"""kartlab CLI. Run from karting/:  python3 -m kartlab <command> SESSION_DIR ...

  ingest    SESSION VIDEO [VIDEO...] [--track tracks/x.json] [--date D]  telemetry from GoPro MP4(s)
  laps      SESSION --times laptimes.txt [--line SECONDS]                 split laps using the timing sheet
  linecheck SESSION [--around SECONDS] [--span 3]                         contact sheet to spot the timing line
  analyse   SESSION [--ref-lap N]                                         corners, sectors, per-corner metrics
  reference SESSION VIDEO --start S --end E                               align a reference lap video
  frames    SESSION [--laps 7,12]                                         per-corner montages for review
  report    SESSION                                                       build SESSION/report/index.html
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import numpy as np

from . import analysis, frames, gpmf, laps, report, signals

ROOT = Path(__file__).resolve().parent.parent


def _load_sig(session: Path):
    meta, st = gpmf.load_npz(session / "telemetry.npz")
    return meta, signals.kart_frame(st)


def _j(path: Path, obj=None):
    if obj is None:
        return json.loads(path.read_text())
    path.write_text(json.dumps(obj, indent=1, default=float))
    return obj


def cmd_ingest(a):
    s = Path(a.session); s.mkdir(parents=True, exist_ok=True)
    data = gpmf.load_many(sorted(a.video))
    gpmf.save_npz(data, s / "telemetry.npz")
    track = _j(Path(a.track)) if a.track else {}
    fixes = np.asarray(data["gps_fix"]).reshape(-1, 3)
    gps_ok = float((fixes[:, 1] >= 2).mean()) if len(fixes) else 0.0
    if "GPS9" in data["streams"]:
        v = np.asarray(data["streams"]["GPS9"].values)
        gps_ok = float((v[:, 8] >= 2).mean()) if len(v) else 0.0
    meta = {"device": data["device"], "duration": data["duration"], "chapters": data["chapters"],
            "gps_fix_fraction": round(gps_ok, 3), "track": a.track, "track_name": track.get("name", ""),
            "track_length_m": track.get("length_m"), "date": a.date or "", "session_type": a.type}
    _j(s / "session.json", meta)
    rates = {k: round(len(v.times) / max(data["duration"], 1), 1) for k, v in data["streams"].items()}
    print(json.dumps({"device": data["device"], "duration_s": round(data["duration"], 1),
                      "chapters": len(data["chapters"]), "sample_rates_hz": rates,
                      "gps_fix_fraction": meta["gps_fix_fraction"]}, indent=1))


def cmd_laps(a):
    s = Path(a.session)
    meta, sig = _load_sig(s)
    times = laps.parse_lap_times(Path(a.times).read_text())
    if not times:
        sys.exit("No lap times found in " + a.times)
    off = laps.find_offset(sig["t"], sig["yaw"], times)
    if a.line is not None:
        off = laps.anchor(off, a.line)
    _j(s / "laps.json", off)
    n_in = sum(l["in_video"] for l in off["laps"])
    print(f"{len(times)} laps parsed, {n_in} inside the video. First line crossing at {off['t0']:.2f}s "
          f"(shape match {off['score']:.2f}; >0.8 is good).")
    if a.line is None:
        print("Lap phase is not yet pinned to the timing line: run `linecheck`, then `laps --line <s>`.")


def cmd_linecheck(a):
    s = Path(a.session)
    meta = _j(s / "session.json")
    off = _j(s / "laps.json")
    t = a.around if a.around is not None else off["laps"][[l["in_video"] for l in off["laps"]].index(True)]["start"]
    ts = list(np.arange(t - a.span, t + a.span + 1e-6, 0.25))
    f, local = frames.locate(meta["chapters"], t)
    dest = s / "linecheck.jpg"
    frames.contact_sheet(f, [local + (x - t) for x in ts], dest)
    print(f"Wrote {dest} (labels are times within {Path(f).name}; add {t - local:.2f}s for session time).")


def cmd_analyse(a):
    s = Path(a.session)
    meta, sig = _load_sig(s)
    smeta = _j(s / "session.json")
    off = _j(s / "laps.json")
    bounds = [(l["start"], l["end"]) for l in off["laps"] if l["in_video"]]
    v = signals.estimate_speed(sig, bounds, smeta.get("track_length_m"))
    res = analysis.analyse(sig, v, off["laps"], a.ref_lap)
    _j(s / "analysis.json", res)
    sm = res["summary"]
    print(f"Best {sm['best_lap']:.3f} (lap {sm['best_lap_n']}), median {sm['median']:.3f}, "
          f"best sectors combined {sm['theoretical_best']:.3f}, {len(res['corners'])} corners")
    ids = [c["id"] for c in res["corners"]]
    print("corner  dir angle  ref    best   median  loss(med-best)")
    for i, c in enumerate(res["corners"]):
        print(f"{c['id']:6} {c['dir']:>3} {c['angle']:5} {sm['segment_ref'][i]:6.2f} {sm['segment_best'][i]:6.2f} "
              f"{sm['segment_median'][i]:7.2f} {sm['segment_median'][i] - sm['segment_best'][i]:7.2f}")


def cmd_reference(a):
    from . import vision
    s = Path(a.session)
    meta, sig = _load_sig(s)
    an = _j(s / "analysis.json")
    bl = next(l for l in an["laps"] if l["n"] == an["summary"]["best_lap_n"])
    m = (sig["t"] >= bl["start"]) & (sig["t"] < bl["end"])
    flow = vision.flow_yaw(a.video, a.start, a.end)
    events = {}
    for c in bl["corners"]:
        for k in ("turn_in", "apex", "exit"):
            events[f"{c['id']}.{k}"] = c[k]
    mapped = vision.align_reference(flow, sig["t"][m], sig["yaw"][m], events)
    smeta = _j(s / "session.json")
    smeta["reference"] = {"video": a.video, "start": a.start, "end": a.end}
    _j(s / "session.json", smeta)
    _j(s / "reference.json", {"video": a.video, "start": a.start, "end": a.end, "events": mapped})
    print(f"Reference lap {a.end - a.start:.2f}s aligned; {len(mapped)} events mapped.")


def cmd_frames(a):
    s = Path(a.session)
    smeta = _j(s / "session.json")
    an = _j(s / "analysis.json")
    by_n = {l["n"]: l for l in an["laps"]}
    best = an["summary"]["best_lap_n"]
    if a.laps:
        picks = [int(x) for x in a.laps.split(",")]
    else:  # best lap + the lap closest to the median time
        med = an["summary"]["median"]
        typical = min((l for l in an["laps"] if l["n"] != best), key=lambda l: abs(l["time"] - med),
                      default=None)
        picks = [best] + ([typical["n"]] if typical else [])
    ref = _j(s / "reference.json") if (s / "reference.json").exists() else None
    tmp = s / "frames" / "_raw"
    phases = [("turn_in", "Turn-in"), ("apex", "Apex"), ("exit", "Exit")]
    for i, c in enumerate(an["corners"]):
        rows = []
        for n in picks:
            lc = by_n[n]["corners"][i]
            paths = []
            for k, _ in phases:
                f, local = frames.locate(smeta["chapters"], lc[k])
                paths.append(frames.grab(f, local, tmp / f"{c['id']}_{n}_{k}.jpg"))
            rows.append((f"Lap {n}\n{by_n[n]['time']:.3f}\nsector {lc['segment_time']:.2f}", paths))
        if ref:
            paths = [frames.grab(ref["video"], ref["events"][f"{c['id']}.{k}"], tmp / f"{c['id']}_ref_{k}.jpg")
                     for k, _ in phases]
            rows.append(("Reference", paths))
        frames.montage(rows, [p[1] for p in phases], s / "frames" / f"{c['id']}.jpg")
    for p in tmp.glob("*.jpg"):
        p.unlink()
    tmp.rmdir()
    print(f"Wrote {len(an['corners'])} montages to {s / 'frames'} (laps {picks}{' + reference' if ref else ''}).")


def cmd_report(a):
    s = Path(a.session)
    print(report.build(s, s / "report"))


def main(argv=None):
    p = argparse.ArgumentParser(prog="kartlab", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    q = sub.add_parser("ingest"); q.add_argument("session"); q.add_argument("video", nargs="+")
    q.add_argument("--track"); q.add_argument("--date"); q.add_argument("--type", default="Practice")
    q = sub.add_parser("laps"); q.add_argument("session"); q.add_argument("--times", required=True)
    q.add_argument("--line", type=float)
    q = sub.add_parser("linecheck"); q.add_argument("session"); q.add_argument("--around", type=float)
    q.add_argument("--span", type=float, default=3.0)
    q = sub.add_parser("analyse"); q.add_argument("session"); q.add_argument("--ref-lap", type=int)
    q = sub.add_parser("reference"); q.add_argument("session"); q.add_argument("video")
    q.add_argument("--start", type=float, required=True); q.add_argument("--end", type=float, required=True)
    q = sub.add_parser("frames"); q.add_argument("session"); q.add_argument("--laps")
    q = sub.add_parser("report"); q.add_argument("session")
    a = p.parse_args(argv)
    globals()["cmd_" + a.cmd](a)


if __name__ == "__main__":
    main()
