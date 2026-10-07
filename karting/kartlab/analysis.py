"""Corner detection, per-lap/per-corner metrics, and a dead-reckoned track map."""
from __future__ import annotations

import numpy as np

from .laps import dtw_path
from .signals import G, smooth

DTW_FS = 20.0


def _slice(sig, a, b):
    m = (sig["t"] >= a) & (sig["t"] < b)
    return {k: (v[m] if isinstance(v, np.ndarray) and v.shape[:1] == sig["t"].shape else v)
            for k, v in sig.items()}


def detect_corners(lap: dict, thr: float = 0.6, min_dur: float = 0.35, merge_gap: float = 0.35) -> list[dict]:
    t, yaw = lap["t"], smooth(lap["yaw"], 0.25)
    on = np.abs(yaw) > thr
    edges = np.flatnonzero(np.diff(np.r_[0, on.astype(int), 0]))
    segs = [[int(a), int(b)] for a, b in zip(edges[::2], edges[1::2])]
    merged = []
    for s in segs:
        if merged and (t[min(s[0], len(t) - 1)] - t[merged[-1][1] - 1]) < merge_gap and \
                np.sign(yaw[s[0]]) == np.sign(yaw[merged[-1][0]]):
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    corners = []
    for a, b in merged:
        if t[b - 1] - t[a] < min_dur:
            continue
        seg = slice(a, b)
        sgn = np.sign(yaw[seg].mean())
        heading = float(np.degrees(np.abs(yaw[seg].sum()) / lap["fs"]))
        if heading < 25:
            continue
        v = lap["v"][seg]
        apex = a + int(np.argmin(v)) if np.ptp(v) > 0.3 else a + int(np.argmax(np.abs(yaw[seg])))
        corners.append({"start": float(t[a]), "end": float(t[b - 1]), "apex": float(t[apex]),
                        "dir": "L" if sgn > 0 else "R", "angle": round(heading)})
    for i, c in enumerate(corners):
        c["id"] = f"T{i + 1}"
    return corners


def _boundaries(lap, corners):
    """Sector boundaries at corner exits (yaw transitions pin DTW well; mid-straight
    points don't). Segment i = run-up + braking + corner i."""
    b = [lap["t"][0]]
    for c in corners[:-1]:
        b.append(c["end"])
    b.append(lap["t"][-1] + 1 / lap["fs"])
    return b


def corner_metrics(lap: dict, c_start: float, c_apex: float, c_end: float,
                   seg_a: float, seg_b: float) -> dict:
    t = lap["t"]
    seg = (t >= seg_a) & (t < seg_b)
    cor = (t >= c_start) & (t <= c_end)
    pre = (t >= seg_a) & (t < c_apex)
    post = (t > c_apex) & (t < seg_b)
    yaw = lap["yaw"]
    out = {"segment_time": float(seg_b - seg_a)}
    if cor.any():
        out["min_speed_kmh"] = float(lap["v"][cor].min() * 3.6)
        out["peak_lat_g"] = float(np.abs(lap["a_lat"][cor]).max() / G)
        y = lap["yaw_raw"][cor]
        dy = np.diff(smooth(y, 0.08))
        # steering corrections: yaw-acceleration reversals of meaningful size
        flips = np.flatnonzero(np.diff(np.sign(dy[np.abs(dy) > 0.02])) != 0)
        out["corrections"] = int(len(flips))
    if pre.any():
        lon = lap["a_lon"][pre]
        out["max_brake_g"] = float(max(0.0, -lon.min()) / G)
        braking = np.flatnonzero(lon < -0.25 * G)
        out["brake_before_apex_s"] = float(c_apex - t[pre][braking[0]]) if len(braking) else 0.0
    if post.any():
        lon = lap["a_lon"][post]
        go = np.flatnonzero(lon > 0.08 * G)
        out["throttle_after_apex_s"] = float(t[post][go[0]] - c_apex) if len(go) else None
        out["exit_speed_kmh"] = float(lap["v"][post][-1] * 3.6)
    out["entry_speed_kmh"] = float(lap["v"][pre][0] * 3.6) if pre.any() else None
    return out


def _warp(ref, lap):
    """Map reference-lap times onto this lap via DTW on yaw rate (10 Hz)."""
    def ds(x):
        n = int(len(x) * DTW_FS / ref["fs"])
        return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    ra, la = ds(ref["yaw"]), ds(lap["yaw"])
    m = dtw_path(ra, la)
    tr = np.linspace(ref["t"][0], ref["t"][-1], len(ra))
    tl = np.linspace(lap["t"][0], lap["t"][-1], len(la))
    mapped = tl[m]
    return lambda x: float(np.interp(x, tr, mapped))


def track_map(lap: dict) -> np.ndarray:
    """Dead-reckoned x,y (m) of one lap; closure error spread linearly."""
    dt = 1 / lap["fs"]
    hd = np.cumsum(lap["yaw"]) * dt
    xy = np.cumsum(np.stack([lap["v"] * np.cos(hd), lap["v"] * np.sin(hd)], 1), 0) * dt
    err = xy[-1] - xy[0]
    xy -= np.linspace(0, 1, len(xy))[:, None] * err
    return xy


def analyse(sig: dict, v: np.ndarray, laps: list[dict], ref_lap: int | None = None) -> dict:
    sig = dict(sig, v=v)
    valid = [l for l in laps if l["in_video"]]
    if not valid:
        raise ValueError("No laps fall inside the video.")
    times = np.array([l["time"] for l in valid])
    ref_lap = ref_lap or valid[int(np.argmin(times))]["n"]
    ref_info = next(l for l in valid if l["n"] == ref_lap)
    ref = _slice(sig, ref_info["start"], ref_info["end"])
    corners = detect_corners(ref)
    bounds = _boundaries(ref, corners)

    per_lap = []
    for l in valid:
        lap = _slice(sig, l["start"], l["end"])
        f = (lambda x: x) if l["n"] == ref_lap else _warp(ref, lap)
        b = [f(x) for x in bounds]
        b[0], b[-1] = l["start"], l["end"]
        cs = []
        for i, c in enumerate(corners):
            m = corner_metrics(lap, f(c["start"]), f(c["apex"]), f(c["end"]), b[i], b[i + 1])
            m.update({"id": c["id"], "turn_in": f(c["start"]), "apex": f(c["apex"]), "exit": f(c["end"])})
            cs.append(m)
        per_lap.append({"n": l["n"], "time": l["time"], "start": l["start"], "end": l["end"],
                        "top_speed_kmh": float(lap["v"].max() * 3.6), "corners": cs})

    seg = np.array([[c["segment_time"] for c in pl["corners"]] for pl in per_lap])
    best_seg = seg.min(0) if len(seg) else np.array([])
    ref_idx = [pl["n"] for pl in per_lap].index(ref_lap)
    summary = {
        "laps_in_video": len(per_lap), "best_lap": float(times.min()), "best_lap_n": int(ref_lap),
        "average": float(times.mean()),
        "median": float(np.median(times)),
        "consistency_sd": float(times.std()),
        "theoretical_best": float(best_seg.sum()) if len(best_seg) else None,
        "segment_best": best_seg.tolist(),
        "segment_median": np.median(seg, 0).tolist() if len(seg) else [],
        "segment_ref": seg[ref_idx].tolist() if len(seg) else [],
    }
    xy = track_map(ref)
    idx = lambda x: int(np.clip(np.searchsorted(ref["t"], x), 0, len(xy) - 1))
    for c in corners:
        c["xy"] = xy[idx(c["apex"])].tolist()
        c["xy_in"] = xy[idx(c["start"])].tolist()
        c["xy_out"] = xy[idx(c["end"])].tolist()
    step = max(1, len(xy) // 400)
    return {"summary": summary, "corners": corners, "sector_bounds_ref": bounds,
            "laps": per_lap, "map": {"xy": xy[::step].tolist(),
                                     "speed": (ref["v"][::step] * 3.6).tolist()}}
