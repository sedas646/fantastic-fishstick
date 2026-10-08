import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { colorById } from '../data/colors'
import { kindById } from '../data/kinds'
import { itemLabel } from '../store'
import { shopLinks } from '../lib/shopping'
import type { ColorDef, Item, Outfit, Profile, Suggestion } from '../types'

export const Swatch = ({ color, size = 28, title }: { color: ColorDef; size?: number; title?: boolean }) => (
  <span className="swatch-wrap" title={color.name}>
    <span className="swatch" style={{ background: color.hex, width: size, height: size }} />
    {title && <span className="swatch-name">{color.name}</span>}
  </span>
)

export const Chip = ({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: ReactNode }) => (
  <button type="button" className={`chip ${active ? 'on' : ''}`} onClick={onClick}>{children}</button>
)

export const ItemThumb = ({ item }: { item: Item }) => {
  const col = colorById(item.color)
  return item.photo
    ? <img className="thumb" src={item.photo} alt={itemLabel(item)} />
    : <span className="thumb" style={{ background: col.hex }} aria-label={col.name} />
}

export function OutfitCard({ outfit, rank }: { outfit: Outfit; rank: number }) {
  const b = outfit.breakdown
  return (
    <div className="card outfit">
      <div className="row between">
        <strong>Look {rank}</strong>
        <span className={`score ${outfit.score >= 80 ? 'great' : outfit.score >= 65 ? 'good' : 'meh'}`}>{outfit.score}% match</span>
      </div>
      <ul className="parts">
        {outfit.parts.map((p) => (
          <li key={p.item.id}>
            <ItemThumb item={p.item} />
            <span>
              <b>{itemLabel(p.item)}</b>
              <small>{colorById(p.item.color).name} · {kindById(p.item.kind).label}</small>
            </span>
          </li>
        ))}
      </ul>
      <div className="bars">
        {([['Colour', b.color], ['Fit & comfort', b.fit], ['Style', b.style], ['Weather', b.weather]] as const).map(([l, v]) => (
          <div key={l}><small>{l}</small><div className="bar"><i style={{ width: `${v}%` }} /></div></div>
        ))}
      </div>
    </div>
  )
}

export function SuggestionCard({ s, profile }: { s: Suggestion; profile: Profile }) {
  const links = shopLinks(s.kind, s.color, profile)
  return (
    <div className="card suggestion">
      <div className="row">
        <Swatch color={s.color} size={36} />
        <div>
          <strong>{s.color.name} {s.kind.label.toLowerCase()}</strong>
          <small className="muted block">{s.reason}</small>
        </div>
      </div>
      <div className="links">
        {links.length === 0 && <small className="muted">Pick retailers in Profile → Shopping.</small>}
        {links.map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className="link-btn">
            {l.name} <ExternalLink size={12} />
          </a>
        ))}
      </div>
    </div>
  )
}
