import { useMemo, useState } from 'react'
import { buildCapsule } from '../lib/outfits'
import type { Store } from '../store'
import { Chip, ItemThumb, OutfitCard, Swatch, SuggestionCard } from './ui'
import { colorById } from '../data/colors'
import { itemLabel } from '../store'

export function Capsule({ store, goWardrobe }: { store: Store; goWardrobe: () => void }) {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium')
  const active = useMemo(
    () => store.activities.filter((a) => (store.profile.frequencies[a.id] ?? 0) > 0),
    [store.activities, store.profile.frequencies],
  )
  const cap = useMemo(
    () => (store.items.length ? buildCapsule(store.items, store.profile, active, store.weather, size) : null),
    [store.items, store.profile, active, store.weather, size],
  )
  const colors = cap ? [...new Map(cap.items.map((i) => [i.color, colorById(i.color)])).values()] : []

  return (
    <main className="page">
      <h1>Capsule wardrobe</h1>
      <p className="muted">The fewest pieces that cover the activities in your life, weighted by how often you do them.</p>
      <div className="chips">
        {(['small', 'medium', 'large'] as const).map((s) => <Chip key={s} active={size === s} onClick={() => setSize(s)}>{s === 'small' ? 'Minimal' : s === 'medium' ? 'Balanced' : 'Extended'}</Chip>)}
      </div>

      {!cap && <section className="card center"><p>Add clothes to build your capsule.</p><button className="btn" onClick={goWardrobe}>Go to wardrobe</button></section>}

      {cap && (
        <>
          <section className="card">
            <h2>{cap.items.length} pieces → {cap.combos} looks</h2>
            <div className="swatches">{colors.map((c) => <Swatch key={c.id} color={c} size={26} />)}</div>
            <div className="grid">
              {cap.items.map((i) => (
                <div key={i.id} className="card item"><ItemThumb item={i} /><b>{itemLabel(i)}</b><small className="muted">{colorById(i.color).name}</small></div>
              ))}
            </div>
          </section>

          {cap.looks.map((l) => (
            <section key={l.activity.id}>
              <h3>{l.activity.emoji} {l.activity.label}</h3>
              {l.outfits.length
                ? l.outfits.slice(0, 2).map((o, i) => <OutfitCard key={i} outfit={o} rank={i + 1} />)
                : <p className="muted">The capsule can't dress you for this yet — see shopping ideas below.</p>}
            </section>
          ))}

          {cap.buy.length > 0 && (
            <>
              <h2>🛒 Complete your capsule</h2>
              {cap.buy.map((s) => (
                <div key={s.kind.id + s.color.id + s.activity}>
                  <small className="muted">For: {s.activity}</small>
                  <SuggestionCard s={s} profile={store.profile} />
                </div>
              ))}
            </>
          )}
        </>
      )}
    </main>
  )
}
