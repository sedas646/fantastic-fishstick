"""Lap splitting.

TeamSport sessions come with a lap-time sheet but the camera clock isn't synced
to the timing loop. Given the lap times, we search for the offset t0 (video time
of the first timed line crossing) at which all laps' yaw-rate traces look most
alike. Indoor tracks rarely get a GPS fix, so this is the primary method.
"""
from __future__ import annotations

import re

import numpy as np

N_PROGRESS = 300


def parse_lap_times(text: str) -> list[float]:
    """Accept pasted sheets: '1  44.123', '0:44.123', '44.1', 'Lap 3 - 45.02 s' ..."""
    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        found = re.findall(r"(?:(\d+):)?(\d{1,3}\.\d{1,3})", line)
        if not found:
            continue
        m, s = found[-1]
        val = float(s) + (60 * int(m) if m else 0)
        if 15 < val < 300:
            out.append(val)
    return out


def _profiles(t, yaw, starts, ends):
    rows = []
    for a, b in zip(starts, ends):
        g = np.linspace(a, b, N_PROGRESS, endpoint=False)
        rows.append(np.interp(g, t, yaw))
    return np.asarray(rows)


def _score(t, yaw, t0, cum, laps):
    starts = t0 + cum[:-1]
    ends = t0 + cum[1:]
    inside = (starts >= t[0]) & (ends <= t[-1])
    if inside.sum() < 3:
        return -np.inf, inside
    P = _profiles(t, yaw, starts[inside], ends[inside])
    P = P - P.mean(1, keepdims=True)
    P /= (np.linalg.norm(P, axis=1, keepdims=True) + 1e-9)
    ref = np.median(P, axis=0)
    ref /= np.linalg.norm(ref) + 1e-9
    return float((P @ ref).sum()), inside


def find_offset(t: np.ndarray, yaw: np.ndarray, laps: list[float],
                lo: float | None = None, hi: float | None = None) -> dict:
    cum = np.concatenate([[0.0], np.cumsum(laps)])
    lo = t[0] - cum[-1] + 3 * np.median(laps) if lo is None else lo
    hi = t[-1] - 3 * np.median(laps) if hi is None else hi
    best = (-np.inf, None)
    for step, span in ((0.25, None), (0.02, 1.0)):
        grid = np.arange(lo, hi, step) if span is None else \
            np.arange(best[1] - span, best[1] + span, step)
        for t0 in grid:
            s, _ = _score(t, yaw, t0, cum, laps)
            if s > best[0]:
                best = (s, t0)
    t0 = best[1]
    s, inside = _score(t, yaw, t0, cum, laps)
    return {"t0": float(t0), "score": s / max(inside.sum(), 1),
            "laps": [{"n": i + 1, "time": laps[i], "start": float(t0 + cum[i]),
                      "end": float(t0 + cum[i + 1]), "in_video": bool(inside[i])}
                     for i in range(len(laps))]}


def from_gps(t: np.ndarray, xy: np.ndarray, line_xy: tuple, radius: float = 8.0) -> list[float]:
    """Line-crossing times from GPS track (outdoor tracks). line_xy = start/finish point (m)."""
    d = np.linalg.norm(xy - np.asarray(line_xy), axis=1)
    near = d < radius
    times, last = [], -1e9
    for i in np.flatnonzero(near):
        if t[i] - last > 15:
            j = i + np.argmin(d[i:i + 200])
            times.append(float(t[j]))
            last = t[j]
    return times


def dtw_path(a: np.ndarray, b: np.ndarray, band: float = 0.15) -> np.ndarray:
    """Dynamic time warping with Sakoe-Chiba band. Returns index j in b for each i in a."""
    n, m = len(a), len(b)
    w = max(int(band * max(n, m)), abs(n - m) + 2)
    D = np.full((n + 1, m + 1), np.inf)
    D[0, 0] = 0
    for i in range(1, n + 1):
        jc = int(round(i * m / n))
        j0, j1 = max(1, jc - w), min(m, jc + w)
        cost = (a[i - 1] - b[j0 - 1:j1]) ** 2
        prev = np.minimum(D[i - 1, j0 - 1:j1], D[i - 1, j0:j1 + 1])
        row = np.empty(j1 - j0 + 1)
        left = np.inf
        for k in range(len(row)):
            left = cost[k] + min(prev[k], left)
            row[k] = left
        D[i, j0:j1 + 1] = row
    # backtrack
    i, j = n, m
    mapping = np.zeros(n, int)
    while i > 0 and j > 0:
        mapping[i - 1] = j - 1
        c = (D[i - 1, j - 1], D[i - 1, j], D[i, j - 1])
        k = int(np.argmin(c))
        if k == 0:
            i, j = i - 1, j - 1
        elif k == 1:
            i -= 1
        else:
            j -= 1
    return mapping


def anchor(offset: dict, t_cross: float) -> dict:
    """Shift lap boundaries so one of them sits on a known line crossing (video time).

    The lap-time sheet fixes lap lengths, but the yaw-shape search only weakly fixes
    *where* on track the boundaries fall. One visually confirmed crossing pins it.
    """
    starts = np.array([l["start"] for l in offset["laps"]] + [offset["laps"][-1]["end"]])
    delta = t_cross - starts[np.argmin(np.abs(starts - t_cross))]
    for l in offset["laps"]:
        l["start"] += delta
        l["end"] += delta
    offset["t0"] += delta
    offset["anchored_at"] = t_cross
    return offset
