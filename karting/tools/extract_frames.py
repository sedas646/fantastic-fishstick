#!/usr/bin/env python3
"""Extract frames from a video file as JPEGs.

Needs only OpenCV:  pip install opencv-python

Examples
  # one frame every 0.5 s, 640 px wide
  python3 extract_frames.py GX010123.MP4 frames/ --every 0.5 --width 640

  # specific times (seconds or mm:ss.s)
  python3 extract_frames.py GX010123.MP4 frames/ --at 12.5 1:03.2 2:10

  # only part of the video, 4 frames a second
  python3 extract_frames.py GX010123.MP4 frames/ --start 60 --end 105 --every 0.25
"""
import argparse
from pathlib import Path

import cv2


def parse_time(s: str) -> float:
    parts = [float(p) for p in s.split(":")]
    t = 0.0
    for p in parts:
        t = t * 60 + p
    return t


def save(frame, out: Path, t: float, width: int | None, quality: int) -> Path:
    if width and frame.shape[1] > width:
        h = int(frame.shape[0] * width / frame.shape[1])
        frame = cv2.resize(frame, (width, h), interpolation=cv2.INTER_AREA)
    path = out / f"frame_{t:09.3f}s.jpg"
    cv2.imwrite(str(path), frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
    return path


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--every", type=float, help="seconds between frames")
    ap.add_argument("--at", nargs="+", help="exact times to grab (s or mm:ss)")
    ap.add_argument("--start", default="0", help="start time (s or mm:ss)")
    ap.add_argument("--end", help="end time (s or mm:ss)")
    ap.add_argument("--width", type=int, default=1280, help="resize to this width (0 = original)")
    ap.add_argument("--quality", type=int, default=90)
    a = ap.parse_args()

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    cap = cv2.VideoCapture(a.video)
    if not cap.isOpened():
        raise SystemExit(f"Can't open {a.video}")
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / fps
    print(f"{a.video}: {duration:.1f}s at {fps:.2f} fps")

    n = 0
    if a.at:
        # random access: seek to each requested time
        for s in a.at:
            t = parse_time(s)
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, frame = cap.read()
            if ok:
                save(frame, out, t, a.width, a.quality)
                n += 1
            else:
                print(f"  no frame at {t:.2f}s")
    else:
        # sequential read: fast and frame-accurate for regular intervals
        every = a.every or 1.0
        start = parse_time(a.start)
        end = parse_time(a.end) if a.end else duration
        cap.set(cv2.CAP_PROP_POS_MSEC, start * 1000)
        next_t = start
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            t = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            if t > end:
                break
            if t + 0.5 / fps >= next_t:
                save(frame, out, t, a.width, a.quality)
                n += 1
                next_t += every
    cap.release()
    print(f"Saved {n} frames to {out}/")


if __name__ == "__main__":
    main()
