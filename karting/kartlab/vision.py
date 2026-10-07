"""Video-only signals, for footage without telemetry (e.g. a YouTube reference lap).

The horizontal optical flow of the far scene tracks the kart's yaw rate closely
enough to warp a reference lap onto our own lap with DTW and find its corners.
"""
from __future__ import annotations

import numpy as np

from .laps import dtw_path
from .signals import smooth


def flow_yaw(video: str, start: float, end: float, fs: float = 20.0, width: int = 192) -> dict:
    import cv2  # optional dependency: opencv-python-headless

    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    cap.set(cv2.CAP_PROP_POS_MSEC, start * 1000)
    prev, ts, vals = None, [], []
    t = start
    while t < end:
        ok, frame = cap.read()
        if not ok:
            break
        t = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
        h, w = frame.shape[:2]
        small = cv2.resize(frame, (width, int(h * width / w)))
        g = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        if prev is not None:
            f = cv2.calcOpticalFlowFarneback(prev, g, None, 0.5, 3, 15, 3, 5, 1.2, 0)
            hh = g.shape[0]
            band = f[int(hh * 0.15):int(hh * 0.55), :, 0]  # far scene; skips bodywork/hands/overlays
            vals.append(-float(np.median(band)) * fps)
            ts.append(t)
        prev = g
    cap.release()
    ts, vals = np.asarray(ts), np.asarray(vals)
    grid = np.arange(ts[0], ts[-1], 1 / fs)
    return {"t": grid, "yaw": smooth(np.interp(grid, ts, vals), 0.25, fs), "fs": fs, "video_fps": fps}


def align_reference(ref_flow: dict, own_t: np.ndarray, own_yaw: np.ndarray,
                    events: dict[str, float]) -> dict[str, float]:
    """Map event times on our lap (e.g. T3 apex) to times in the reference video."""
    fs = ref_flow["fs"]
    own_grid = np.arange(own_t[0], own_t[-1], 1 / fs)
    a = np.interp(own_grid, own_t, own_yaw)
    b = ref_flow["yaw"]
    za = (a - a.mean()) / (a.std() + 1e-9)
    zb = (b - b.mean()) / (b.std() + 1e-9)
    # flow sign/scale depends on lens + mount; pick the sign that matches
    rb = np.interp(np.linspace(0, len(zb) - 1, len(za)), np.arange(len(zb)), zb)
    if np.dot(za, rb) < 0:
        zb = -zb
    m = dtw_path(za, zb, band=0.2)
    mapped = ref_flow["t"][m]
    return {k: float(np.interp(v, own_grid, mapped)) for k, v in events.items()}
