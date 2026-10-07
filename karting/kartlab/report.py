"""Build the session debrief page (HTML) from analysis.json + coaching.json + frames/."""
from __future__ import annotations

import html
import json
from pathlib import Path

import numpy as np

CSS = """
/* Layout: one reading column; timing tables and map scroll inside their own boxes. */
:root{
  --bg:#eceef1; --panel:#f8f9fb; --ink:#14181d; --muted:#5b6470; --line:#cfd4db;
  --kerb:#d63a26; --purple:#8a3ad6; --green:#178a4c; --amber:#b37d00; --slow:#c0392b;
  --map-track:#b9c0c9;
  --f-display:"Barlow Condensed","Arial Narrow",sans-serif;
  --f-body:"IBM Plex Sans",system-ui,sans-serif;
  --f-data:"IBM Plex Mono",ui-monospace,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#111418; --panel:#191d23; --ink:#e6e9ee; --muted:#98a1ad; --line:#2c323b;
  --kerb:#ff5a43; --purple:#b67cff; --green:#3fcf83; --amber:#f0b429; --slow:#ff6b5b;
  --map-track:#3a414b; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#111418; --panel:#191d23; --ink:#e6e9ee; --muted:#98a1ad; --line:#2c323b;
  --kerb:#ff5a43; --purple:#b67cff; --green:#3fcf83; --amber:#f0b429; --slow:#ff6b5b;
  --map-track:#3a414b; color-scheme:dark}
body{background:var(--bg);color:var(--ink);font:15px/1.55 var(--f-body)}
.wrap{max-width:980px;margin:0 auto;padding-inline:16px;padding-block:28px 64px;display:grid;gap:36px}
h1,h2,h3{font-family:var(--f-display);font-weight:700;letter-spacing:.01em;text-wrap:balance;margin:0}
h1{font-size:clamp(34px,6vw,52px);line-height:1}
h2{font-size:28px;text-transform:uppercase;letter-spacing:.04em}
h3{font-size:24px}
p{margin:0;max-width:68ch}
.eyebrow{font:600 12px var(--f-data);text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.kerb{height:8px;background:repeating-linear-gradient(90deg,var(--kerb) 0 18px,var(--panel) 18px 36px);border-radius:2px}
header{display:grid;gap:12px}
.stats{display:flex;flex-wrap:wrap;gap:10px 28px;font-family:var(--f-data);font-variant-numeric:tabular-nums}
.stats div{display:grid}
.stats b{font-size:24px;font-weight:600}
.stats span{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
section{display:grid;gap:14px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:16px}
.scroll{overflow-x:auto}
.prio{display:grid;gap:10px;counter-reset:p;margin:0;padding:0;list-style:none}
.prio li{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:baseline}
.prio li::before{counter-increment:p;content:counter(p);font:700 22px var(--f-display);color:var(--kerb)}
.gain{font:600 13px var(--f-data);color:var(--green);white-space:nowrap}
table{border-collapse:collapse;font:13px var(--f-data);font-variant-numeric:tabular-nums;width:100%}
th,td{padding:5px 8px;text-align:right;border-bottom:1px solid var(--line);white-space:nowrap}
th{font-weight:600;color:var(--muted);text-transform:uppercase;font-size:11px;letter-spacing:.08em}
td:first-child,th:first-child{text-align:left}
.s-pb{color:var(--purple);font-weight:700}.s-good{color:var(--green)}.s-mid{color:var(--amber)}.s-bad{color:var(--slow)}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font:12px var(--f-data);color:var(--muted)}
.map svg{width:100%;height:auto;max-height:520px;display:block}
.map text{font:600 13px var(--f-data);fill:var(--ink)}
.corner{display:grid;gap:12px;padding-block:18px;border-top:1px solid var(--line)}
.corner-head{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:baseline}
.tag{font:600 11px var(--f-data);text-transform:uppercase;letter-spacing:.1em;padding:2px 8px;border-radius:3px;border:1px solid currentColor}
.tag.focus{color:var(--kerb)}.tag.ok{color:var(--green)}.tag.attack{color:var(--purple)}
.metrics{display:flex;flex-wrap:wrap;gap:6px 20px;font:13px var(--f-data);color:var(--muted);font-variant-numeric:tabular-nums}
.metrics b{color:var(--ink);font-weight:600}
.advice{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px 24px}
.advice div{min-width:0}
.advice h4{margin:0 0 2px;font:600 12px var(--f-data);text-transform:uppercase;letter-spacing:.1em;color:var(--muted)}
figure{margin:0}
figure img{display:block;width:100%;border-radius:4px}
figcaption{font-size:12px;color:var(--muted);margin-top:4px}
ul.plain{margin:0;padding-left:18px;display:grid;gap:6px}
.note{font-size:13px;color:var(--muted)}
"""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700'
         '&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600&display=swap">')


def e(x) -> str:
    return html.escape(str(x)) if x is not None else ""


def fmt(t, d=3):
    return "–" if t is None else f"{t:.{d}f}"


def _map_svg(an: dict) -> str:
    xy = np.asarray(an["map"]["xy"])
    sp = np.asarray(an["map"]["speed"])
    if len(xy) < 3:
        return ""
    lo, hi = xy.min(0), xy.max(0)
    span = max((hi - lo).max(), 1e-6)
    pad, W = 40, 800
    sc = (W - 2 * pad) / span
    H = int((hi[1] - lo[1]) * sc + 2 * pad)
    P = lambda p: (pad + (p[0] - lo[0]) * sc, H - pad - (p[1] - lo[1]) * sc)
    pts = [P(p) for p in xy]
    smin, smax = np.percentile(sp, 5), np.percentile(sp, 95)
    segs = []
    for (x1, y1), (x2, y2), s in zip(pts, pts[1:], sp):
        k = float(np.clip((s - smin) / max(smax - smin, 1e-6), 0, 1))
        # slow = kerb red, fast = timing green, mixed in CSS via color-mix
        segs.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                    f'style="stroke:color-mix(in oklab,var(--kerb) {100 - k * 100:.0f}%,var(--green))" '
                    'stroke-width="6" stroke-linecap="round"/>')
    marks = []
    for c in an["corners"]:
        x, y = P(c["xy"])
        marks.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="13" style="fill:var(--panel);stroke:var(--ink)" '
                     f'stroke-width="1.5"/><text x="{x:.1f}" y="{y + 4.5:.1f}" text-anchor="middle">{e(c["id"])}</text>')
    sx, sy = pts[0]
    start = (f'<rect x="{sx - 9:.1f}" y="{sy - 9:.1f}" width="18" height="18" style="fill:var(--ink)"/>'
             f'<text x="{sx + 14:.1f}" y="{sy - 12:.1f}">LINE</text>')
    outline = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    return (f'<svg viewBox="0 0 {W} {H}" role="img" aria-label="Reconstructed best-lap path coloured by speed">'
            f'<polyline points="{outline}" fill="none" style="stroke:var(--map-track)" stroke-width="16" '
            f'stroke-linejoin="round"/>{"".join(segs)}{start}{"".join(marks)}</svg>')


def _sector_table(an: dict) -> str:
    ids = [c["id"] for c in an["corners"]]
    best = np.asarray(an["summary"]["segment_best"])
    med = np.asarray(an["summary"]["segment_median"])
    best_lap = min(l["time"] for l in an["laps"])
    rows = []
    for l in an["laps"]:
        cells = [f'<td>Lap {l["n"]}</td>',
                 f'<td class="{"s-pb" if l["time"] == best_lap else ""}">{fmt(l["time"])}</td>']
        for i, c in enumerate(l["corners"]):
            s = c["segment_time"]
            cls = "s-pb" if s <= best[i] + 1e-6 else "s-good" if s <= med[i] else \
                "s-mid" if s <= med[i] + 0.15 else "s-bad"
            cells.append(f'<td class="{cls}">{fmt(s, 2)}</td>')
        rows.append("<tr>" + "".join(cells) + "</tr>")
    foot = ('<tr><td>Best</td><td>' + fmt(an["summary"]["theoretical_best"]) + "</td>"
            + "".join(f'<td class="s-pb">{fmt(b, 2)}</td>' for b in best) + "</tr>"
            '<tr><td>Median</td><td>' + fmt(an["summary"]["median"]) + "</td>"
            + "".join(f"<td>{fmt(m, 2)}</td>" for m in med) + "</tr>")
    head = "<tr><th>Lap</th><th>Time</th>" + "".join(f"<th>{e(i)}</th>" for i in ids) + "</tr>"
    return f'<div class="scroll"><table><thead>{head}</thead><tbody>{"".join(rows)}{foot}</tbody></table></div>'


def _metric_line(an: dict, i: int) -> str:
    best_n = an["summary"]["best_lap_n"]
    bl = next(l for l in an["laps"] if l["n"] == best_n)["corners"][i]
    allc = [l["corners"][i] for l in an["laps"]]
    med = lambda k: float(np.median([c[k] for c in allc if c.get(k) is not None])) if any(
        c.get(k) is not None for c in allc) else None
    parts = [("Min speed", bl.get("min_speed_kmh"), med("min_speed_kmh"), "km/h", 1),
             ("Peak lat", bl.get("peak_lat_g"), med("peak_lat_g"), "g", 2),
             ("Brake", bl.get("max_brake_g"), med("max_brake_g"), "g", 2),
             ("Throttle after apex", bl.get("throttle_after_apex_s"), med("throttle_after_apex_s"), "s", 2),
             ("Corrections", bl.get("corrections"), med("corrections"), "", 0)]
    return "".join(f"<span>{n} <b>{fmt(b, d)}</b>{u} <small>(median {fmt(m, d)})</small></span>"
                   for n, b, m, u, d in parts if b is not None)


def build(session: Path, out: Path) -> Path:
    an = json.loads((session / "analysis.json").read_text())
    co_path = session / "coaching.json"
    co = json.loads(co_path.read_text()) if co_path.exists() else {}
    meta = json.loads((session / "session.json").read_text())
    s = an["summary"]
    out.mkdir(parents=True, exist_ok=True)

    title = co.get("title") or f'{meta.get("track_name", "Session")} debrief'
    prios = "".join(f'<li><div><b>{e(p["title"])}</b><p>{e(p.get("detail", ""))}</p></div>'
                    f'<span class="gain">{e(p.get("gain", ""))}</span></li>' for p in co.get("priorities", []))
    corners_html = []
    for i, c in enumerate(an["corners"]):
        cc = co.get("corners", {}).get(c["id"], {})
        img = session / "frames" / f'{c["id"]}.jpg'
        fig = ""
        if img.exists():
            (out / "frames").mkdir(exist_ok=True)
            (out / "frames" / img.name).write_bytes(img.read_bytes())
            fig = (f'<figure><img src="frames/{img.name}" alt="{e(c["id"])} turn-in, apex and exit frames" '
                   f'loading="lazy"><figcaption>Turn-in, apex and exit. Rows: your best lap, a typical lap'
                   f'{", reference lap" if meta.get("reference") else ""}.</figcaption></figure>')
        advice = "".join(f'<div><h4>{lbl}</h4><p>{e(cc[k])}</p></div>'
                         for k, lbl in (("line", "Line"), ("issue", "What's happening"), ("fix", "Change"),
                                        ("overtake", "Overtake"), ("defend", "Defend")) if cc.get(k))
        rating = cc.get("rating", "")
        tag = f'<span class="tag {e(rating)}">{e(rating)}</span>' if rating else ""
        corners_html.append(
            f'<article class="corner" id="{e(c["id"])}"><div class="corner-head"><h3>{e(c["id"])}'
            f'{" · " + e(cc["name"]) if cc.get("name") else ""}</h3>'
            f'<span class="eyebrow">{"Left" if c["dir"] == "L" else "Right"} · {c["angle"]}°</span>'
            f'{tag}</div>'
            f'<div class="metrics">{_metric_line(an, i)}</div>{advice}{fig}</article>')

    rc = co.get("racecraft", {})
    rc_html = "".join(f'<div class="panel"><h3>{lbl}</h3><ul class="plain">'
                      + "".join(f"<li>{e(x)}</li>" for x in rc[k]) + "</ul></div>"
                      for k, lbl in (("overtaking", "Overtaking"), ("defending", "Defending"),
                                     ("starts", "Starts and restarts")) if rc.get(k))
    doc = f"""<title>{e(title)}</title>
{FONTS}
<style>{CSS}</style>
<div class="wrap">
<header>
  <div class="eyebrow">{e(meta.get("track_name", ""))} · {e(meta.get("date", ""))} · {e(meta.get("session_type", ""))}</div>
  <h1>{e(title)}</h1>
  <div class="kerb" aria-hidden="true"></div>
  <div class="stats">
    <div><b>{fmt(s["best_lap"])}</b><span>Best (lap {s["best_lap_n"]})</span></div>
    <div><b>{fmt(s["theoretical_best"])}</b><span>Best sectors combined</span></div>
    <div><b>{fmt(s["median"])}</b><span>Median lap</span></div>
    <div><b>±{fmt(s["consistency_sd"], 2)}</b><span>Lap spread (SD)</span></div>
    <div><b>{e(co.get("target", "–"))}</b><span>Target</span></div>
  </div>
  {f"<p>{e(co['headline'])}</p>" if co.get("headline") else ""}
</header>
{f'<section><h2>Priorities</h2><ol class="prio panel">{prios}</ol></section>' if prios else ""}
<section><h2>Track map</h2>
  <div class="panel map">{_map_svg(an)}</div>
  <p class="note">Your best lap rebuilt from helmet gyro and speed estimates, coloured red (slow) to green (fast). Shape is approximate; use the official layout for exact geometry. Corner numbers are this tool's own, counted from the timing line.</p>
</section>
<section><h2>Sector times</h2>
  <div class="legend"><span class="s-pb">■ best of session</span><span class="s-good">■ better than median</span><span class="s-mid">■ within 0.15 s</span><span class="s-bad">■ slower</span></div>
  <div class="panel">{_sector_table(an)}</div>
  <p class="note">Each sector runs from the exit of the previous corner to the exit of this one, so it includes the straight, the braking and the corner.</p>
</section>
<section><h2>Corner by corner</h2>{"".join(corners_html)}</section>
{f'<section><h2>Racecraft</h2><div class="advice">{rc_html}</div></section>' if rc_html else ""}
<section><h2>How this was measured</h2><p class="note">{e(co.get("method_note", "Lap and corner timings come from the GoPro's gyro and accelerometer, split using the timing sheet. Speeds are estimated from cornering load and yaw rate (no GPS indoors), so treat them as relative between laps rather than exact."))}</p></section>
</div>
"""
    dest = out / "index.html"
    dest.write_text(doc)
    return dest
