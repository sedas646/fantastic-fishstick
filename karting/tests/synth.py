"""Synthetic GoPro IMU session for testing the pipeline without real footage."""
from __future__ import annotations

import numpy as np

G = 9.80665
# (length m, radius m or 0 for straight, +1 left / -1 right)
LAYOUT = [(40, 0, 0), (14, 6, -1), (25, 0, 0), (9, 4, 1), (8, 0, 0), (12, 5, -1), (55, 0, 0),
          (20, 7, -1), (15, 0, 0), (10, 3.5, 1), (30, 0, 0), (16, 8, 1), (20, 0, 0),
          (11, 4, -1), (45, 0, 0), (18, 9, -1), (12, 0, 0), (13, 5, 1), (15, 0, 0)]


def lap_profile(rng, skill=1.0, ds=0.1):
    s, R, d = [], [], []
    for L, r, sg in LAYOUT:
        n = int(L / ds)
        R += [r] * n
        d += [sg] * n
    R, d = np.array(R, float), np.array(d, float)
    mu = 1.15 * skill * (1 + rng.normal(0, 0.03, len(LAYOUT)))
    mu_s = np.repeat(mu, [int(L / ds) for L, _, _ in LAYOUT])
    vmax = np.where(R > 0, np.sqrt(mu_s * G * np.maximum(R, 1e-3)), 22.0)
    v = vmax.copy()
    acc, brk = 2.2 * skill, 7.0 * skill
    for _ in range(2):
        for i in range(1, len(v)):
            v[i] = min(v[i], np.sqrt(v[i - 1] ** 2 + 2 * acc * ds))
        for i in range(len(v) - 2, -1, -1):
            v[i] = min(v[i], np.sqrt(v[i + 1] ** 2 + 2 * brk * ds))
    dt = ds / v
    t = np.concatenate([[0], np.cumsum(dt)[:-1]])
    omega = np.where(R > 0, d * v / np.maximum(R, 1e-3), 0)
    return t, v, omega, float(dt.sum())


def session(n_laps=12, seed=1, fs=200.0, pit=40.0, tail=20.0):
    rng = np.random.default_rng(seed)
    T, V, W, laps = [np.zeros(1)], [np.zeros(1)], [np.zeros(1)], []
    tcur = pit
    T[0][0] = 0
    for k in range(n_laps):
        skill = 1.0 - abs(rng.normal(0, 0.03)) - (0.06 if k == 0 else 0)
        t, v, w, lt = lap_profile(rng, skill)
        T.append(t + tcur); V.append(v); W.append(w)
        laps.append(lt)
        tcur += lt
    t_all = np.concatenate(T); v_all = np.concatenate(V); w_all = np.concatenate(W)
    grid = np.arange(0, tcur + tail, 1 / fs)
    v = np.interp(grid, t_all, v_all, left=0, right=0)
    w = np.interp(grid, t_all, w_all, left=0, right=0)
    a_lon = np.gradient(v, 1 / fs)
    a_lat = v * w
    # head turns into corners: extra yaw that integrates to ~0
    head = np.convolve(np.gradient(np.convolve(w, np.ones(80) / 80, "same"), 1 / fs), np.ones(20) / 20, "same") * 0.15
    kart = np.stack([a_lon, a_lat, np.full_like(v, G)], 1)  # x fwd, y left, z up
    gyro = np.stack([np.zeros_like(v), np.zeros_like(v), w + head], 1)
    # arbitrary camera mount rotation (chin mount pitched down + rolled)
    def rot(ax, ang):
        c, s = np.cos(ang), np.sin(ang)
        return {"x": np.array([[1, 0, 0], [0, c, -s], [0, s, c]]),
                "y": np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]),
                "z": np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])}[ax]
    Rm = rot("y", 0.5) @ rot("x", 0.2) @ rot("z", 1.9)
    acc = kart @ Rm.T + rng.normal(0, 0.8, kart.shape)
    gyr = gyro @ Rm.T + rng.normal(0, 0.05, gyro.shape)
    return {"ACCL": (grid, acc), "GYRO": (grid, gyr)}, laps, pit
