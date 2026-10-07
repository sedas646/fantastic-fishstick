"""End-to-end check on a synthetic session: python3 -m tests.test_pipeline [outdir]"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

from kartlab import __main__ as cli
from kartlab import gpmf
from tests.synth import LAYOUT, session


def main(out="/tmp/kartlab-test"):
    s = Path(out); s.mkdir(parents=True, exist_ok=True)
    st, laptimes, pit = session(n_laps=10)
    dur = float(st["ACCL"][0][-1])
    arrays = {f"{k}_t": v[0] for k, v in st.items()} | {f"{k}_v": v[1] for k, v in st.items()}
    vid = s / "video.mp4"
    if not vid.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i",
                        f"testsrc=size=320x180:rate=10:duration={dur:.1f}", str(vid)], check=True)
    meta = {"device": "synthetic", "duration": dur, "chapters": [{"file": str(vid), "start": 0.0, "duration": dur}]}
    arrays["gps_fix"] = np.zeros((0, 3))
    arrays["meta"] = np.frombuffer(json.dumps(meta).encode(), dtype=np.uint8)
    np.savez_compressed(s / "telemetry.npz", **arrays)
    (s / "session.json").write_text(json.dumps(meta | {"track_name": "Synthetic Raceway", "date": "test",
                                                       "session_type": "Practice",
                                                       "track_length_m": sum(l for l, _, _ in LAYOUT)}))
    (s / "laptimes.txt").write_text("\n".join(f"{i + 1}  {t:.3f}" for i, t in enumerate(laptimes)))
    cli.main(["laps", str(s), "--times", str(s / "laptimes.txt"), "--line", str(pit)])
    off = json.loads((s / "laps.json").read_text())
    assert abs(off["t0"] - pit) < 0.05, off["t0"]
    cli.main(["analyse", str(s)])
    an = json.loads((s / "analysis.json").read_text())
    n_true = sum(1 for _, r, _ in LAYOUT if r > 0)
    assert len(an["corners"]) == n_true, (len(an["corners"]), n_true)
    for l in an["laps"]:
        assert abs(sum(c["segment_time"] for c in l["corners"]) - l["time"]) < 0.01
    assert an["summary"]["theoretical_best"] <= an["summary"]["best_lap"] + 1e-6
    cli.main(["linecheck", str(s)])
    cli.main(["frames", str(s)])
    cli.main(["report", str(s)])
    print("OK", s / "report" / "index.html")


if __name__ == "__main__":
    main(*sys.argv[1:])
