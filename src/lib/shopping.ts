import type { ColorDef, KindDef, Profile } from '../types'
import { STYLES, topStyles } from './analysis'

export interface Retailer { id: string; name: string; url: (q: string) => string }

const enc = encodeURIComponent
export const RETAILERS: Retailer[] = [
  { id: 'google', name: 'Google Shopping', url: (q) => `https://www.google.com/search?tbm=shop&q=${enc(q)}` },
  { id: 'asos', name: 'ASOS', url: (q) => `https://www.asos.com/search/?q=${enc(q)}` },
  { id: 'zara', name: 'Zara', url: (q) => `https://www.zara.com/search?searchTerm=${enc(q)}` },
  { id: 'hm', name: 'H&M', url: (q) => `https://www2.hm.com/en_gb/search-results.html?q=${enc(q)}` },
  { id: 'mango', name: 'Mango', url: (q) => `https://shop.mango.com/gb/search?kw=${enc(q)}` },
  { id: 'zalando', name: 'Zalando', url: (q) => `https://www.zalando.co.uk/catalogue/?q=${enc(q)}` },
  { id: 'cos', name: 'COS', url: (q) => `https://www.cos.com/en_gb/search.html?q=${enc(q)}` },
  { id: 'nextuk', name: 'Next', url: (q) => `https://www.next.co.uk/search?w=${enc(q)}` },
]

export function shopQuery(kind: KindDef, color: ColorDef, profile: Profile): string {
  const style = STYLES[topStyles(profile, 1)[0]].keywords
  return `women's ${color.name.toLowerCase()} ${kind.query} ${style}`.replace(/\s+/g, ' ').trim()
}

export const shopLinks = (kind: KindDef, color: ColorDef, profile: Profile) => {
  const q = shopQuery(kind, color, profile)
  return RETAILERS.filter((r) => profile.retailers.includes(r.id)).map((r) => ({ name: r.name, href: r.url(q) }))
}
