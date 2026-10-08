import { useState } from 'react'
import { ACTIVITIES, makeCustomActivity } from '../data/activities'
import { analyse, essence, STYLES, topStyles } from '../lib/analysis'
import { RETAILERS } from '../lib/shopping'
import type { Store } from '../store'
import type { Frequency, Style } from '../types'
import { Chip, Swatch } from './ui'

const FREQ: { v: Frequency; l: string }[] = [{ v: 0, l: 'Never' }, { v: 1, l: 'Rarely' }, { v: 2, l: 'Often' }, { v: 3, l: 'Daily' }]

export function Profile({ store, retake }: { store: Store; retake: () => void }) {
  const p = store.profile
  const a = analyse(p)
  const e = essence(p.yin)
  const styles = topStyles(p, 3)
  const maxStyle = Math.max(1, ...Object.values(p.styleScores))
  const [label, setLabel] = useState('')
  const [formality, setFormality] = useState(2)
  const [comfort, setComfort] = useState(2)
  const [outdoor, setOutdoor] = useState(false)
  const [active, setActive] = useState(false)

  return (
    <main className="page">
      <section className="card hero">
        <small className="muted">Your colour season</small>
        <h1>{a.season}</h1>
        <p>Metals: {a.text.metals}. Makeup: {a.text.makeup}.</p>
        <h3>Your best colours</h3>
        <div className="swatches">{a.best.map((c) => <Swatch key={c.id} color={c} size={34} title />)}</div>
        <h3>Your best neutrals</h3>
        <div className="swatches">{a.neutrals.map((c) => <Swatch key={c.id} color={c} size={34} title />)}</div>
        <h3>Wear away from your face</h3>
        <div className="swatches">{a.avoidList.map((c) => <Swatch key={c.id} color={c} size={28} title />)}</div>
        <small className="muted block">Avoid: {a.text.avoid}.</small>
      </section>

      <section className="card">
        <small className="muted">Your style</small>
        <h2>{styles.map((s) => STYLES[s].name).slice(0, 2).join(' + ')}</h2>
        <p>{STYLES[styles[0]].blurb}</p>
        {(Object.keys(STYLES) as Style[]).map((s) => (
          <div key={s} className="bar-row"><span>{STYLES[s].name}</span>
            <div className="bar"><i style={{ width: `${(p.styleScores[s] / maxStyle) * 100}%` }} /></div></div>
        ))}
      </section>

      <section className="card">
        <small className="muted">Your feminine essence</small>
        <h2>{e.name}</h2>
        <p>{e.blurb}</p>
        <dl>
          <dt>Necklines</dt><dd>{e.necklines}</dd>
          <dt>Fabrics</dt><dd>{e.fabrics}</dd>
          <dt>Prints</dt><dd>{e.prints}</dd>
          <dt>Silhouettes</dt><dd>{e.silhouettes}</dd>
        </dl>
        <small className="muted block">This is a styling guide (inspired by yin/yang image-type systems), not a rule. Wear what you love.</small>
      </section>

      <section className="card">
        <h2>Lifestyle</h2>
        <p className="muted">Used to weight your capsule wardrobe.</p>
        {[...ACTIVITIES, ...store.custom].map((act) => (
          <div key={act.id} className="q">
            <div className="row between"><span>{act.emoji} {act.label}</span>
              {act.custom && <button className="btn ghost small" onClick={() => store.removeActivity(act.id)}>Remove</button>}</div>
            <div className="chips">
              {FREQ.map((f) => (
                <Chip key={f.v} active={(p.frequencies[act.id] ?? 0) === f.v}
                  onClick={() => store.setProfile({ ...p, frequencies: { ...p.frequencies, [act.id]: f.v } })}>{f.l}</Chip>
              ))}
            </div>
          </div>
        ))}
        <h3>Add your own activity</h3>
        <input className="input" placeholder="e.g. Pilates, Picnic, Wedding guest" value={label} onChange={(ev) => setLabel(ev.target.value)} />
        <label className="field">Dressiness: {['Very casual', 'Casual', 'Smart casual', 'Dressy', 'Formal'][formality - 1]}
          <input type="range" min={1} max={5} value={formality} onChange={(ev) => setFormality(+ev.target.value)} /></label>
        <label className="field">Comfort needed: {['Style first', 'Balanced', 'Comfort first'][comfort - 1]}
          <input type="range" min={1} max={3} value={comfort} onChange={(ev) => setComfort(+ev.target.value)} /></label>
        <div className="chips">
          <Chip active={outdoor} onClick={() => setOutdoor(!outdoor)}>Outdoors</Chip>
          <Chip active={active} onClick={() => setActive(!active)}>Active / moving a lot</Chip>
        </div>
        <button className="btn" disabled={!label.trim()} onClick={() => {
          store.addActivity(makeCustomActivity(label.trim(), formality, comfort, outdoor, active)); setLabel('')
        }}>Add activity</button>
      </section>

      <section className="card">
        <h2>Shopping</h2>
        <div className="chips">
          {RETAILERS.map((r) => (
            <Chip key={r.id} active={p.retailers.includes(r.id)}
              onClick={() => store.setProfile({ ...p, retailers: p.retailers.includes(r.id) ? p.retailers.filter((x) => x !== r.id) : [...p.retailers, r.id] })}>{r.name}</Chip>
          ))}
        </div>
        <small className="muted block">Links open a search for the exact colour and piece on each shop. Stock and prices are theirs.</small>
      </section>

      <div className="row nav">
        <button className="btn ghost" onClick={retake}>Retake analysis</button>
        <button className="btn ghost danger" onClick={() => { if (confirm('Delete your profile and wardrobe from this device?')) store.reset() }}>Reset everything</button>
      </div>
    </main>
  )
}
