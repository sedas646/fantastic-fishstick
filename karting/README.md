# kartlab

Karting session analysis from GoPro footage. Reads the camera's built-in gyro and accelerometer (and GPS when outdoors), splits laps using the track's lap-time sheet, finds corners, compares sector times and corner metrics across laps, grabs turn-in/apex/exit frames, and builds a debrief page.

The repeatable workflow, including how to get footage into a cloud session, is in `../.claude/skills/kart-session-analysis/SKILL.md`. Advice guidelines are in `coaching-guide.md`.

```bash
pip install -r requirements.txt
python3 -m kartlab --help
python3 -m tests.test_pipeline /tmp/kartlab-test   # synthetic end-to-end check
```

Layout:

- `kartlab/gpmf.py`: GoPro telemetry (GPMF) reader
- `kartlab/signals.py`: helmet IMU to kart frame, speed estimate
- `kartlab/laps.py`: lap-sheet alignment, timing-line anchor, DTW
- `kartlab/analysis.py`: corners, sectors, per-corner metrics, track map
- `kartlab/vision.py`: optical-flow yaw for reference videos without telemetry
- `kartlab/frames.py`, `kartlab/report.py`: frame montages and the debrief page
- `tracks/`: one JSON file per track (length, corner names, timing line)
- `sessions/<date>/`: per-session outputs (videos and telemetry are git-ignored)
