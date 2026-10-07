"""Turn raw helmet IMU into kart-frame signals: yaw rate, lateral g, longitudinal g, speed.

The camera can be mounted at any angle (chin, top, side), so axes are found
from the data rather than assumed:
  * vertical    = direction of (slow-averaged) gravity
  * yaw rate    = gyro projected on vertical, sign: left turn = positive
  * lateral     = horizontal accel direction best correlated with yaw rate
  * longitudinal= horizontal axis perpendicular to lateral; sign chosen so the
                  kart decelerates going into corners
Speed without GPS: in corners v = a_lat / yaw_rate; between corners integrate
longitudinal accel, pulled towards those corner anchors. Each lap is then
scaled so its distance equals the track length.
"""
from __future__ import annotations

import numpy as np

FS = 50.0  # analysis sample rate, Hz
G = 9.80665


def smooth(x: np.ndarray, seconds: float, fs: float = FS) -> np.ndarray:
    """Zero-phase smoothing: two passes of a centred boxcar (~triangular kernel)."""
    n = max(1, int(round(seconds * fs)))
    if n <= 1:
        return x
    k = np.ones(n) / n
    pad = n
    def run(v):
        vp = np.pad(v, pad, mode="edge")
        return np.convolve(vp, k, mode="same")[pad:-pad]
    if x.ndim == 1:
        return run(run(x))
    return np.stack([run(run(x[:, i])) for i in range(x.shape[1])], axis=1)


def resample(t: np.ndarray, v: np.ndarray, grid: np.ndarray) -> np.ndarray:
    order = np.argsort(t)
    t, v = t[order], v[order]
    return np.stack([np.interp(grid, t, v[:, i]) for i in range(v.shape[1])], axis=1)


def kart_frame(streams: dict, fs: float = FS) -> dict:
    ta, acc = streams["ACCL"]
    tg, gyr = streams["GYRO"]
    t0 = max(ta[0], tg[0])
    t1 = min(ta[-1], tg[-1])
    t = np.arange(t0, t1, 1.0 / fs)
    acc = resample(ta, acc, t)
    gyr = resample(tg, gyr, t)

    # Gravity direction: long average (the accelerometer reads +g "up" when still).
    grav = smooth(acc, 8.0, fs)
    up = grav / np.linalg.norm(grav, axis=1, keepdims=True)

    yaw = np.einsum("ij,ij->i", smooth(gyr, 0.1, fs), up)
    a_vert = np.einsum("ij,ij->i", acc, up)
    a_h = acc - a_vert[:, None] * up

    # Build a horizontal basis (e1, e2) from the mean up vector.
    u = up.mean(0); u /= np.linalg.norm(u)
    ref = np.eye(3)[np.argmin(np.abs(u))]
    e1 = np.cross(u, ref); e1 /= np.linalg.norm(e1)
    e2 = np.cross(u, e1)
    h = np.stack([a_h @ e1, a_h @ e2], axis=1)
    hs = smooth(h, 0.15, fs)
    ys = smooth(yaw, 0.15, fs)
    # Lateral axis = direction whose accel best tracks yaw rate (centripetal = v * omega).
    best, best_ang = -np.inf, 0.0
    for ang in np.radians(np.arange(0, 360, 2)):
        d = np.array([np.cos(ang), np.sin(ang)])
        c = np.dot(hs @ d, ys)
        if c > best:
            best, best_ang = c, ang
    d_lat = np.array([np.cos(best_ang), np.sin(best_ang)])
    d_lon = np.array([-d_lat[1], d_lat[0]])
    a_lat = hs @ d_lat
    a_lon = hs @ d_lon

    # Longitudinal sign: decel just before corner entries.
    corner = np.abs(smooth(yaw, 0.3, fs)) > 0.8
    entries = np.flatnonzero(np.diff(corner.astype(int)) == 1)
    pre = [a_lon[max(0, e - int(0.6 * fs)):e].mean() for e in entries if e > fs]
    if pre and np.mean(pre) > 0:
        a_lon = -a_lon

    return {"t": t, "yaw": smooth(yaw, 0.2, fs), "a_lat": smooth(a_lat, 0.2, fs),
            "a_lon": smooth(a_lon, 0.3, fs), "a_vert": smooth(a_vert - G, 0.3, fs),
            "yaw_raw": yaw, "fs": fs}


def estimate_speed(sig: dict, lap_bounds: list[tuple[float, float]] | None = None,
                   track_length: float | None = None) -> np.ndarray:
    t, yaw, a_lat, a_lon, fs = sig["t"], sig["yaw"], sig["a_lat"], sig["a_lon"], sig["fs"]
    dt = 1.0 / fs
    with np.errstate(divide="ignore", invalid="ignore"):
        v_c = a_lat / yaw
    ok = (np.abs(yaw) > 0.7) & (v_c > 2) & (v_c < 25)
    v_anchor = np.where(ok, v_c, np.nan)
    v = np.zeros_like(t)
    cur = 8.0
    k = 1.5  # pull strength towards anchors (1/s)
    for i in range(len(t)):
        cur += a_lon[i] * dt
        if not np.isnan(v_anchor[i]):
            cur += k * (v_anchor[i] - cur) * dt * 4
        else:
            cur += 0.02 * (8.0 - cur) * dt  # very weak leak keeps drift bounded
        cur = min(max(cur, 0.0), 25.0)
        v[i] = cur
    v = smooth(v, 0.3, fs)
    if lap_bounds and track_length:
        for a, b in lap_bounds:
            m = (t >= a) & (t < b)
            dist = v[m].sum() * dt
            if dist > 0:
                v[m] *= track_length / dist
    return v
