import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { COLORS, colorById } from '../data/colors'
import { CATEGORIES, KINDS, kindById } from '../data/kinds'
import { analyse, colorFit } from '../lib/analysis'
import { itemLabel, SAMPLE, type Store } from '../store'
import type { Category } from '../types'
import { Chip, ItemThumb, Swatch } from './ui'

function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const s = 240 / Math.max(img.width, img.height, 1)
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * Math.min(1, s)); c.height = Math.round(img.height * Math.min(1, s))
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')) }
    img.src = url
  })
}

export function Wardrobe({ store }: { store: Store }) {
  const [open, setOpen] = useState(store.items.length === 0)
  const [cat, setCat] = useState<Category>('top')
  const [kind, setKind] = useState('tee')
  const [color, setColor] = useState('white')
  const [name, setName] = useState('')
  const [formality, setFormality] = useState(1)
  const [photo, setPhoto] = useState<string | undefined>()
  const an = analyse(store.profile)

  const pickCat = (c: Category) => {
    setCat(c); const k = KINDS.find((x) => x.category === c)!; setKind(k.id); setFormality(k.formality)
  }

  return (
    <main className="page">
      <div className="row between">
        <h1>My wardrobe <small className="muted">({store.items.length})</small></h1>
        <button className="btn" onClick={() => setOpen(!open)}><Plus size={16} /> Add</button>
      </div>

      {open && (
        <section className="card">
          <div className="chips">{CATEGORIES.map((c) => <Chip key={c.id} active={cat === c.id} onClick={() => pickCat(c.id)}>{c.label}</Chip>)}</div>
          <label className="field">Type
            <select className="input" value={kind} onChange={(e) => { setKind(e.target.value); setFormality(kindById(e.target.value).formality) }}>
              {KINDS.filter((k) => k.category === cat).map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
            </select></label>
          <div className="field">Colour — <b>{colorById(color).name}</b>
            <div className="swatches">
              {COLORS.map((c) => (
                <button key={c.id} type="button" aria-label={c.name} className={`swatch-btn ${color === c.id ? 'sel' : ''}`} onClick={() => setColor(c.id)}>
                  <Swatch color={c} size={30} />
                  {colorFit(an.target, c) > 0.72 && <span className="star">★</span>}
                </button>
              ))}
            </div>
            <small className="muted">★ = in your palette</small></div>
          <label className="field">Dressiness: {['Very casual', 'Casual', 'Smart casual', 'Dressy', 'Formal'][formality - 1]}
            <input type="range" min={1} max={5} value={formality} onChange={(e) => setFormality(+e.target.value)} /></label>
          <input className="input" placeholder="Name (optional) e.g. Zara linen shirt" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="field">Photo (optional, stays on your device)
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0]; if (f) setPhoto(await resize(f).catch(() => undefined))
            }} /></label>
          <button className="btn" onClick={() => {
            store.addItem({ kind, color, formality, name: name.trim(), photo }); setName(''); setPhoto(undefined); setOpen(false)
          }}>Save item</button>
        </section>
      )}

      {store.items.length === 0 && (
        <section className="card center">
          <p>Your wardrobe is empty. Add pieces one by one, or try a sample wardrobe to explore the app.</p>
          <button className="btn ghost" onClick={() => store.addItems(SAMPLE)}>Load sample wardrobe</button>
        </section>
      )}

      {CATEGORIES.map((c) => {
        const list = store.items.filter((i) => kindById(i.kind).category === c.id)
        if (!list.length) return null
        return (
          <section key={c.id}>
            <h3>{c.plural} <small className="muted">({list.length})</small></h3>
            <div className="grid">
              {list.map((i) => (
                <div key={i.id} className="card item">
                  <ItemThumb item={i} />
                  <b>{itemLabel(i)}</b>
                  <small className="muted">{colorById(i.color).name}</small>
                  <button className="icon-btn" aria-label={`Remove ${itemLabel(i)}`} onClick={() => store.removeItem(i.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </main>
  )
}
