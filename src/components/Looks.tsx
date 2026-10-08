import { useMemo, useState } from 'react'
import { colorById } from '../data/colors'
import { kindById } from '../data/kinds'
import { buildOutfits, makeCtx, missingSlots, suggestPurchases } from '../lib/outfits'
import { itemLabel, type Store } from '../store'
import type { Weather } from '../types'
import { Chip, OutfitCard, SuggestionCard } from './ui'

const WEATHER: { v: Weather; l: string }[] = [{ v: 'hot', l: '☀️ Warm' }, { v: 'mild', l: '⛅ Mild' }, { v: 'cold', l: '❄️ Cold' }]

export function Looks({ store, goWardrobe }: { store: Store; goWardrobe: () => void }) {
  const [actId, setActId] = useState(store.activities[0].id)
  const [pin, setPin] = useState('')
  const activity = store.activities.find((a) => a.id === actId) ?? store.activities[0]
  const ctx = useMemo(() => makeCtx(store.profile, activity, store.weather), [store.profile, activity, store.weather])
  const pinned = store.items.find((i) => i.id === pin)
  const outfits = useMemo(() => buildOutfits(store.items, ctx, 4, 6, pin || undefined), [store.items, ctx, pin])
  const missing = useMemo(() => missingSlots(store.items, ctx), [store.items, ctx])
  const suggestions = useMemo(() => suggestPurchases(store.items, ctx, 3), [store.items, ctx])
  const usable = store.items.filter((i) => {
    const kd = kindById(i.kind)
    return !activity.noKinds.includes(kd.id)
  })

  return (
    <main className="page">
      <h1>Looks for…</h1>
      <div className="chips">
        {store.activities.map((a) => <Chip key={a.id} active={a.id === actId} onClick={() => { setActId(a.id); setPin('') }}>{a.emoji} {a.label}</Chip>)}
      </div>
      <div className="chips">
        {WEATHER.map((w) => <Chip key={w.v} active={store.weather === w.v} onClick={() => store.setWeather(w.v)}>{w.l}</Chip>)}
      </div>
      <p className="tip">💡 {activity.tip}</p>

      <label className="field">Build around a piece (optional)
        <select className="input" value={pin} onChange={(e) => setPin(e.target.value)}>
          <option value="">— let the stylist choose —</option>
          {usable.map((i) => <option key={i.id} value={i.id}>{itemLabel(i)} · {colorById(i.color).name}</option>)}
        </select></label>

      {store.items.length === 0 && (
        <section className="card center"><p>Add some clothes first.</p><button className="btn" onClick={goWardrobe}>Go to wardrobe</button></section>
      )}

      {outfits.map((o, i) => <OutfitCard key={o.parts.map((p) => p.item.id).join()} outfit={o} rank={i + 1} />)}
      {store.items.length > 0 && outfits.length === 0 && (
        <section className="card">
          <b>No complete look yet{pinned ? ` with ${itemLabel(pinned)}` : ''}.</b>
          <p className="muted">{missing.length ? `Missing for ${activity.label.toLowerCase()}: ${missing.join(', ')}.` : 'Try clearing the “build around” piece.'}</p>
        </section>
      )}

      {suggestions.length > 0 && (
        <>
          <h2>🛒 Worth adding</h2>
          <p className="muted">{missing.length ? 'You are missing basics for this activity:' : 'These would raise your best look the most:'}</p>
          {suggestions.map((s) => <SuggestionCard key={s.kind.id + s.color.id} s={s} profile={store.profile} />)}
        </>
      )}
    </main>
  )
}
