# Coaching guide

Reference for turning kartlab numbers and frames into advice. Read it before writing `coaching.json`.

## Reading the metrics

Each sector runs from the exit of the previous corner to the exit of this one. A sector's loss can come from the corner itself or from a poor exit of the previous corner (lower speed along the whole straight). Always check the exit speed of the corner *before* a slow sector.

| Signal | Usually means | Confirm in frames |
|---|---|---|
| Throttle after apex is long (more than 0.4 s over the best lap) | Apex too early, so the driver waits for the kart to point at the exit; or overslowed entry | Kart is still turning hard at the "exit" frame; driver runs out of track |
| Min speed lower than the best lap, same sector loss | Overbraking or turning in too sharply (V-line where a U-line is needed) | Turn-in frame shows the kart already slowed well before the kerb |
| Min speed higher than the best lap but the sector is slower | Carried too much speed in, compromised exit | Apex frame wide of the apex; exit frame tight, not using the track |
| High "corrections" count | Sliding, sawing at the wheel or over-driving; on electric karts, often lifting/re-applying mid-corner | Kart angle changes between frames; hands busy |
| Brake well before apex (long) with low brake g | Braking too gently and too early: brake later and harder, release earlier | Kart slows on the straight |
| High peak lateral g, slower sector | Using grip to turn rather than to drive forward; usually line too tight | |
| Big spread (median minus best) in one sector | Inconsistent technique: the easiest time in the lap to find | Compare best and typical rows |

Speeds are estimated (no GPS indoors). Compare them between laps; don't quote them as exact.

## Line principles for indoor electric karts

- **Prioritise the corner before the longest straight.** Exit speed there pays out for the whole straight. Late apex, open the steering early, full power as soon as the wheel unwinds.
- **Slow corner after a long straight:** brake in a straight line, turn in late, aim for a late apex. This is also the prime overtaking spot.
- **Fast sweepers:** smooth, minimal steering, carry speed. Any scrub costs more than a slightly wide line.
- **Complexes (two corners close together):** sacrifice the first to set up the second, if the second leads onto a straight. Work out which one matters from the sector table.
- **Electric karts have instant torque and no gears.** Smooth throttle application avoids wheelspin out of hairpins. There is no engine braking to help entry, so braking points matter more than with petrol karts. Lifting mid-corner unsettles the rear.
- **Ramps and level changes:** don't brake or make big steering inputs as the kart goes light over a crest. Get the braking done before the crest or after the kart settles. Line up straight for the ramp.
- **Use all the track** on exit, right up to the barrier or kerb, unless the next corner needs a different setup.
- **Kart setup is fixed** (rental), so all gains come from line, inputs and consistency.

## Overtaking (sprint racing such as BIKC)

- Rank overtaking spots by: length of the straight before the corner × how slow the corner is × how wide the entry is.
- **Set it up a corner early.** A better exit from the corner before the straight gives the run. Sacrifice entry speed to the previous corner if needed.
- **Inside move under braking:** commit before the defender turns in, get your front wheels level with their sidepod, brake in a straight line, take a tighter, slower line and make sure you can stop.
- **Switchback (cutback):** when someone dives up the inside, go in wider and slower, turn in late and cross behind them for a better exit and repass on the next straight.
- **Dummy moves:** show your nose on one side to force the defender onto a defensive line, then use the better exit on the other side at the next corner.
- **Through complexes:** take the outside of the first corner if it gives you the inside of the second.
- Check the series' contact and penalty rules before recommending anything that could involve contact. Don't invent rule details; tell the driver to check the regs.

## Defending

- **Cover the inside on the approach to the main overtaking corner,** once and early (before the braking zone). Moving in the braking zone is dangerous and penalised in most series.
- The defensive line costs exit speed. Defend only where a pass is actually possible; drive the normal line everywhere else so you don't lose time to the pack behind.
- **Protect exits before the long straights.** A good exit is the best defence: no tow, no run.
- After a defensive entry, expect the switchback: tighten the exit and get the kart straight early.
- Watch the mirrors and shadows indoors (reflections in barriers or windows can show the kart behind).

## Starts and restarts

- Rolling or grid starts: know which side of the grid has the inside line into the first corner.
- With an electric kart the launch is about getting the power in smoothly. Wheelspin wastes the instant torque.
- Lap 1: the inside line into the first slow corner is usually busy. The outside can work if it gives the inside line for the next corner.

## Writing the advice

- Ground every corner note in something seen in the frames or the numbers ("At T4 you're still turning at the exit frame and throttle comes 0.6 s later than on your best lap").
- One clear change per corner. Name a visible marker for it: a kerb, a tyre wall, a barrier joint, a sign.
- Give each priority an expected gain from the sector table (median minus best for that sector), so the driver knows what's worth working on.
- Compare with the reference lap for *line* only. The reference is from before the surface and tyre change, so its lap times and braking points aren't directly comparable.
