"""Frame grabs and labelled montages (rows = laps / reference, columns = corner phases)."""
from __future__ import annotations

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def locate(chapters: list[dict], t: float) -> tuple[str, float]:
    """Session time -> (chapter file, time within that file)."""
    for ch in chapters:
        if ch["start"] <= t < ch["start"] + ch["duration"]:
            return ch["file"], t - ch["start"]
    last = chapters[-1]
    return last["file"], min(t - last["start"], last["duration"] - 0.05)


def grab(video: str, t: float, dest: Path, width: int = 640) -> Path:
    dest.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{max(t, 0):.3f}", "-i", video,
                    "-frames:v", "1", "-vf", f"scale={width}:-2", "-q:v", "3", str(dest)], check=True)
    return dest


def _font(size):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"):
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def montage(rows: list[tuple[str, list[Path]]], cols: list[str], dest: Path, width: int = 480) -> Path:
    """rows = [(label, [img per column])]."""
    imgs = [[Image.open(p) for p in paths] for _, paths in rows]
    h = int(imgs[0][0].height * width / imgs[0][0].width)
    head, side = 34, 150
    W, H = side + width * len(cols), head + h * len(rows)
    sheet = Image.new("RGB", (W, H), (20, 23, 28))
    d = ImageDraw.Draw(sheet)
    f = _font(20)
    for j, c in enumerate(cols):
        d.text((side + j * width + 10, 6), c, fill=(235, 235, 235), font=f)
    for i, ((label, _), row) in enumerate(zip(rows, imgs)):
        y = head + i * h
        for k, line in enumerate(label.split("\n")):
            d.text((10, y + 10 + k * 26), line, fill=(235, 235, 235), font=f)
        for j, im in enumerate(row):
            sheet.paste(im.resize((width, h)), (side + j * width, y))
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest, quality=85)
    return dest


def contact_sheet(video: str, times: list[float], dest: Path, cols: int = 4, width: int = 360) -> Path:
    tmp = dest.parent / "_cs"
    paths = [grab(video, t, tmp / f"{i:03d}.jpg", width) for i, t in enumerate(times)]
    ims = [Image.open(p) for p in paths]
    h = ims[0].height
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * width, rows * (h + 24)), (20, 23, 28))
    d = ImageDraw.Draw(sheet)
    f = _font(16)
    for i, (im, t) in enumerate(zip(ims, times)):
        x, y = (i % cols) * width, (i // cols) * (h + 24)
        sheet.paste(im, (x, y + 24))
        d.text((x + 6, y + 3), f"{t:.2f}s", fill=(235, 235, 235), font=f)
    sheet.save(dest, quality=85)
    for p in paths:
        p.unlink()
    tmp.rmdir()
    return dest
