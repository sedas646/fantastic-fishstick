---
name: kart-session-analysis
description: Analyse a karting session from GoPro footage (with its built-in telemetry), a lap-time sheet and optionally a reference best-lap video, then write a corner-by-corner debrief with line changes, overtaking and defending plans, published as a report page. Use when the user shares a new karting session, asks to analyse karting video or lap times, or wants racing-line or racecraft advice for a track.
---

# Kart session analysis

Tooling lives in `karting/` (Python package `kartlab`). Read `karting/coaching-guide.md` before writing advice, `karting/driver.md` for who the driver is, and `karting/progress.md` for earlier sessions.

## 0. Set up

```bash
cd karting && pip install -q -r requirements.txt
```

ffmpeg/ffprobe must be on PATH (they are in Claude Code cloud sessions).

## 1. Collect inputs

Ask for anything missing, all in one message:

1. **Original GoPro file(s)** straight from the camera or SD card (`GX01xxxx.MP4`, `GX02xxxx.MP4`… for chaptered recordings). An exported, compressed or AirDropped-via-Photos copy loses the telemetry track. Check with `ffprobe` for a `gpmd` stream.
2. **Lap times** pasted as text (one lap per line, any format). Save to `sessions/<date>/laptimes.txt`.
3. **Reference video** (optional), plus the start and end timestamps of the lap to compare within it.
4. **Track layout image** if `tracks/<track>.json` has no `layout_image` yet. Save under `tracks/`.
5. Session type, date, and anything they want looked at (incidents, a specific corner, a rival).

### Getting the files into a cloud session

The environment's network policy decides what is reachable; iCloud and YouTube are usually blocked. Options, best first:

- **Google Drive share link** ("Anyone with the link"): add `drive.google.com` and `drive.usercontent.google.com` to the environment's allowed domains, then `gdown --fuzzy '<link>' -O sessions/<date>/`. For a folder: `gdown --folder '<link>'`.
- **Dropbox** link: allow `www.dropbox.com` and `dl.dropboxusercontent.com`, then `curl -L '<link with dl=1>' -o ...`.
- **GitHub release asset** on this repo (2 GB per file limit): fetch with the GitHub tools.
- Never commit videos to git (over 100 MB fails; `.gitignore` excludes them).

If the network blocks a host, use the `read_documentation` tool (topic `environment.network`) and tell the user which host to allow.

## 2. Run the pipeline

```bash
S=sessions/2026-10-14   # one folder per session
python3 -m kartlab ingest $S $S/GX01*.MP4 $S/GX02*.MP4 --track tracks/teamsport-high-wycombe.json --date 2026-10-14 --type Practice
python3 -m kartlab laps $S --times $S/laptimes.txt
python3 -m kartlab linecheck $S            # writes $S/linecheck.jpg
```

**Pin the timing line.** The lap sheet fixes lap lengths, but not where on track the lap boundary sits. Open `$S/linecheck.jpg` with Read. Find the frame where the kart crosses the timing line (painted line, timing loop strip or gantry). If it isn't in the sheet, re-run `linecheck --around <s>` elsewhere or with a wider `--span`. Then:

```bash
python3 -m kartlab laps $S --times $S/laptimes.txt --line <session seconds of that crossing>
python3 -m kartlab analyse $S
```

Sanity-check the analysis:
- The lap-shape match should be above 0.8. If it's low, the lap times may not match this video (wrong session, missing laps). Ask the user.
- The corner count should match `corner_count` in the track file once that's known. If corners merge or split, try `--ref-lap` with a different clean lap.
- Record the timing-line position in the track file (`timing_line`) so the next session can check it quickly.

Optional reference video (no telemetry; aligned using optical flow):

```bash
python3 -m kartlab reference $S $S/reference.mp4 --start 12.4 --end 56.1
```

Then build the frames (best lap, a typical lap and the reference, at turn-in, apex and exit for every corner):

```bash
python3 -m kartlab frames $S                 # or --laps 7,12 to choose laps
```

## 3. Review the frames and write the coaching

Open every `$S/frames/T*.jpg` with Read. For each corner, compare:
- where the turn-in happens relative to kerbs, barriers and markings
- how close the kart gets to the apex, and whether the apex is early or late
- how much exit width is used
- differences between the best and the typical lap, and against the reference line

Combine that with the numbers from `analyse` and the guidance in `coaching-guide.md`. Then write `$S/coaching.json` in the shape of `karting/coaching.example.json`:
- `priorities`: 3 items, largest expected gain first, gain taken from the sector table
- `corners.<id>`: `name`, `rating` (`focus` / `ok` / `attack`), `line`, `issue`, `fix`, `overtake`, `defend`
- `racecraft`: `overtaking`, `defending`, `starts` lists, ranked by usefulness for the driver's next race

Name corners with the track file's names when it has them, and add new names you settle on to the track file.

## 4. Publish and record

```bash
python3 -m kartlab report $S                 # -> $S/report/index.html (+ frames/)
```

Publish with the Artifact tool: `file_path` = `$S/report/index.html`, and pass every montage through `files` (`{"frames/T1.jpg": "$S/report/frames/T1.jpg", ...}`). Give a one-sentence description and `icon: "flag"`. For a later session, publish a new artifact (new file path) so earlier debriefs keep their links.

Then:
- Append a dated entry to `karting/progress.md`: best, median, best sectors combined, the top 3 issues, and whether last session's priorities improved.
- Update the track file (corner names, count, timing line, notes).
- Commit `karting/` changes (session JSON files, coaching, report HTML; not videos or `telemetry.npz`) and push to the working branch.

## Limits to state in the debrief

- Indoors there's no GPS fix, so speeds are estimated from cornering load and yaw rate. They're good for comparing laps, not as absolute numbers.
- A chin-mounted camera moves with the head. Turning the head into corners adds yaw noise, so metrics are smoothed.
- A reference video from before a surface or tyre change can be compared on line, not on times.
