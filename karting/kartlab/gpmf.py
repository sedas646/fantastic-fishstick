"""Extract and decode GoPro GPMF telemetry (ACCL, GYRO, GPS5/GPS9) from an MP4.

Pure numpy + ffmpeg/ffprobe. Handles chaptered files one at a time; use
`load_many` to stitch chapters (GX01xxxx.MP4, GX02xxxx.MP4, ...) together.
"""
from __future__ import annotations

import json
import struct
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

_TYPES = {
    "b": ("b", 1), "B": ("B", 1), "c": ("c", 1), "d": ("d", 8), "f": ("f", 4),
    "F": ("4s", 4), "j": ("q", 8), "J": ("Q", 8), "l": ("i", 4), "L": ("I", 4),
    "q": ("i", 4), "Q": ("q", 8), "s": ("h", 2), "S": ("H", 2),
}


@dataclass
class Stream:
    name: str
    times: list = field(default_factory=list)   # per-sample timestamps (s)
    values: list = field(default_factory=list)  # per-sample rows
    units: str = ""

    def array(self) -> tuple[np.ndarray, np.ndarray]:
        if not self.values:
            return np.zeros(0), np.zeros((0, 0))
        return np.asarray(self.times, float), np.asarray(self.values, float)


def _probe_gpmd(path: Path) -> tuple[int, list[tuple[float, float, int]]]:
    info = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-of", "json", str(path)]))
    idx = next((s["index"] for s in info["streams"]
                if s.get("codec_tag_string") == "gpmd"), None)
    if idx is None:
        raise ValueError(f"{path.name}: no GoPro telemetry (gpmd) track. "
                         "The file was probably re-encoded/exported; use the original from the camera.")
    pk = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-select_streams", str(idx), "-show_packets",
        "-show_entries", "packet=pts_time,duration_time,size", "-of", "json", str(path)]))
    packets = [(float(p["pts_time"]), float(p.get("duration_time") or 1.0), int(p["size"]))
               for p in pk["packets"]]
    return idx, packets


def _raw_gpmd(path: Path, idx: int) -> bytes:
    return subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-map", f"0:{idx}",
        "-c", "copy", "-f", "data", "-"])


def _klv(buf: bytes, start: int, end: int):
    i = start
    while i + 8 <= end:
        key = buf[i:i + 4].decode("latin-1")
        typ = chr(buf[i + 4])
        size = buf[i + 5]
        repeat = struct.unpack(">H", buf[i + 6:i + 8])[0]
        n = size * repeat
        yield key, typ, size, repeat, i + 8
        i += 8 + ((n + 3) & ~3)


def _decode(buf, off, typ, size, repeat, complex_type=None):
    if typ == "c":
        return buf[off:off + size * repeat].decode("latin-1").rstrip("\0")
    if typ == "U":
        return buf[off:off + 16].decode("latin-1")
    fmt = complex_type if typ == "?" else None
    if fmt is None:
        code, width = _TYPES[typ]
        per = size // width
        fmt = typ * per
    codes = "".join(_TYPES[c][0] for c in fmt)
    st = struct.Struct(">" + codes)
    rows = []
    for r in range(repeat):
        vals = list(st.unpack_from(buf, off + r * size))
        for j, c in enumerate(fmt):
            if c == "q":
                vals[j] /= 65536.0
            elif c == "Q":
                vals[j] /= 4294967296.0
        rows.append(vals)
    return rows


SENSORS = ("ACCL", "GYRO", "GPS5", "GPS9", "GRAV", "CORI")


def parse(path: str | Path) -> dict:
    """Return {'device': str, 'duration': s, 'streams': {name: Stream}, 'gps_fix': [...]}"""
    path = Path(path)
    idx, packets = _probe_gpmd(path)
    raw = _raw_gpmd(path, idx)
    streams: dict[str, Stream] = {}
    gps_fix: list[tuple[float, int, float]] = []  # (t, fix, dop) for GPS5 cameras
    device = ""
    off = 0
    for pts, dur, size in packets:
        payload = raw[off:off + size]
        off += size
        for key, typ, sz, rep, p in _klv(payload, 0, len(payload)):
            if key != "DEVC":
                continue
            dend = p + sz * rep
            for k2, t2, s2, r2, p2 in _klv(payload, p, dend):
                if k2 == "DVNM":
                    device = _decode(payload, p2, t2, s2, r2)
                if k2 != "STRM":
                    continue
                send = p2 + s2 * r2
                scal, ctype, units, fix, dop = [1.0], None, "", None, None
                for k3, t3, s3, r3, p3 in _klv(payload, p2, send):
                    if k3 == "SCAL":
                        scal = [v for row in _decode(payload, p3, t3, s3, r3) for v in row]
                    elif k3 == "TYPE":
                        ctype = _decode(payload, p3, "c", s3, r3)
                    elif k3 in ("SIUN", "UNIT"):
                        units = _decode(payload, p3, "c", s3, r3) if t3 == "c" else units
                    elif k3 == "GPSF":
                        fix = _decode(payload, p3, t3, s3, r3)[0][0]
                    elif k3 == "GPSP":
                        dop = _decode(payload, p3, t3, s3, r3)[0][0] / 100.0
                    elif k3 in SENSORS:
                        rows = _decode(payload, p3, t3, s3, r3, ctype if t3 == "?" else None)
                        sc = np.asarray(scal, float)
                        arr = np.asarray(rows, float)
                        arr = arr / (sc if sc.size in (1, arr.shape[1]) else sc[0])
                        n = len(arr)
                        ts = pts + dur * np.arange(n) / max(n, 1)
                        s = streams.setdefault(k3, Stream(k3, units=units))
                        s.times.extend(ts.tolist())
                        s.values.extend(arr.tolist())
                        if k3 == "GPS5":
                            gps_fix.append((pts, int(fix or 0), float(dop or 99)))
    duration = packets[-1][0] + packets[-1][1] if packets else 0.0
    return {"device": device, "duration": duration, "streams": streams, "gps_fix": gps_fix}


def load_many(paths: list[str | Path]) -> dict:
    """Parse chaptered files in order and concatenate on a single timeline."""
    out = {"device": "", "duration": 0.0, "streams": {}, "gps_fix": [], "chapters": []}
    t0 = 0.0
    for p in paths:
        d = parse(p)
        out["device"] = out["device"] or d["device"]
        out["chapters"].append({"file": str(p), "start": t0, "duration": d["duration"]})
        for name, s in d["streams"].items():
            dst = out["streams"].setdefault(name, Stream(name, units=s.units))
            dst.times.extend((np.asarray(s.times) + t0).tolist())
            dst.values.extend(s.values)
        out["gps_fix"].extend((t + t0, f, dp) for t, f, dp in d["gps_fix"])
        t0 += d["duration"]
    out["duration"] = t0
    return out


def save_npz(data: dict, dest: str | Path) -> None:
    arrays = {}
    for name, s in data["streams"].items():
        t, v = s.array()
        arrays[f"{name}_t"] = t
        arrays[f"{name}_v"] = v
    arrays["gps_fix"] = np.asarray(data["gps_fix"], float).reshape(-1, 3)
    meta = {k: data[k] for k in ("device", "duration") if k in data}
    meta["chapters"] = data.get("chapters", [])
    arrays["meta"] = np.frombuffer(json.dumps(meta).encode(), dtype=np.uint8)
    np.savez_compressed(dest, **arrays)


def load_npz(src: str | Path) -> tuple[dict, dict]:
    z = np.load(src)
    meta = json.loads(bytes(z["meta"]).decode())
    streams = {k[:-2]: (z[k], z[k[:-2] + "_v"]) for k in z.files if k.endswith("_t")}
    streams["gps_fix"] = z["gps_fix"]
    return meta, streams
