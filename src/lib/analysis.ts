import { COLORS } from '../data/colors'
import { COLOR_QUESTIONS, ESSENCE_QUESTIONS, STYLE_QUESTIONS } from '../data/quiz'
import type { ColorDef, Profile, Style } from '../types'

export const STYLES: Record<Style, { name: string; blurb: string; keywords: string }> = {
  classic: { name: 'Classic', blurb: 'Polished, timeless, tailored. Investment staples that never date.', keywords: 'classic tailored' },
  minimal: { name: 'Minimalist', blurb: 'Clean lines, a tight palette and quiet luxury.', keywords: 'minimalist' },
  romantic: { name: 'Romantic', blurb: 'Soft, feminine details: drape, lace, florals and delicate jewellery.', keywords: 'feminine romantic' },
  natural: { name: 'Natural / Casual', blurb: 'Relaxed, comfortable, easy. Great basics and soft textures.', keywords: 'casual relaxed' },
  edgy: { name: 'Edgy', blurb: 'Leather, black, sharp cuts and a little attitude.', keywords: 'edgy' },
  boho: { name: 'Bohemian', blurb: 'Free-spirited layers, earthy tones, prints and flow.', keywords: 'boho' },
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

export type ColorAnswers = Record<string, number>
export type StyleAnswers = Record<string, number>
export type EssenceAnswers = Record<string, number>

export function scoreColorAxes(ans: ColorAnswers) {
  const axes = { t: [] as number[], d: [] as number[], c: [] as number[] }
  for (const q of COLOR_QUESTIONS) {
    const o = q.options[ans[q.id]]
    if (!o) continue
    for (const k of ['t', 'd', 'c'] as const) if (o[k] !== undefined) axes[k].push(o[k])
  }
  return { t: avg(axes.t), d: avg(axes.d), c: avg(axes.c) }
}

export function scoreStyles(ans: StyleAnswers): Record<Style, number> {
  const s: Record<Style, number> = { classic: 0, minimal: 0, romantic: 0, natural: 0, edgy: 0, boho: 0 }
  for (const q of STYLE_QUESTIONS) {
    const o = q.options[ans[q.id]]
    if (!o) continue
    for (const [k, v] of Object.entries(o.pts)) s[k as Style] += v
  }
  return s
}

export const scoreYin = (ans: EssenceAnswers) =>
  avg(ESSENCE_QUESTIONS.flatMap((q) => (q.options[ans[q.id]] ? [q.options[ans[q.id]].y] : [])))

export const topStyles = (p: Profile, n = 2): Style[] =>
  (Object.entries(p.styleScores) as [Style, number][]).sort((a, b) => b[1] - a[1]).slice(0, n).map(([s]) => s)

// ---------- colour season ----------
const SEASON_PROTO = {
  Spring: { t: 0.8, d: -0.4, c: 0.6 },
  Summer: { t: -0.7, d: -0.4, c: -0.6 },
  Autumn: { t: 0.8, d: 0.4, c: -0.6 },
  Winter: { t: -0.7, d: 0.6, c: 0.8 },
} as const
type Season = keyof typeof SEASON_PROTO

const SUBTYPES: Record<Season, { axis: 'd' | 'c'; sign: 1 | -1; name: string }[]> = {
  Spring: [{ axis: 'd', sign: -1, name: 'Light' }, { axis: 'c', sign: 1, name: 'Bright' }],
  Summer: [{ axis: 'd', sign: -1, name: 'Light' }, { axis: 'c', sign: -1, name: 'Soft' }],
  Autumn: [{ axis: 'c', sign: -1, name: 'Soft' }, { axis: 'd', sign: 1, name: 'Deep' }],
  Winter: [{ axis: 'c', sign: 1, name: 'Bright' }, { axis: 'd', sign: 1, name: 'Deep' }],
}

const SEASON_TEXT: Record<Season, { metals: string; makeup: string; avoid: string }> = {
  Spring: { metals: 'Yellow / rose gold', makeup: 'Peachy blush, coral lips, warm bronze', avoid: 'Dull, heavy dark tones near the face' },
  Summer: { metals: 'Silver / rose gold', makeup: 'Rosy blush, dusty-rose lips, taupe eyes', avoid: 'Harsh orange and strong black near the face' },
  Autumn: { metals: 'Antique / yellow gold, bronze', makeup: 'Terracotta blush, brick lips, bronze eyes', avoid: 'Icy pastels and stark white/black' },
  Winter: { metals: 'Silver / platinum', makeup: 'Berry or true-red lips, cool blush, crisp liner', avoid: 'Muddy, muted earth tones' },
}

export interface Analysis {
  season: string
  main: Season
  sub: string | null
  target: { t: number; d: number; c: number }
  best: ColorDef[]
  avoidList: ColorDef[]
  neutrals: ColorDef[]
  text: { metals: string; makeup: string; avoid: string }
}

export function colorFit(p: { t: number; d: number; c: number }, col: ColorDef): number {
  const dist = Math.hypot(1.3 * (p.t - col.t), p.d - col.d, 0.9 * (p.c - col.c))
  return Math.max(0, Math.min(1, 1 - dist / 2.6))
}

export function analyse(p: Pick<Profile, 't' | 'd' | 'c'>): Analysis {
  const main = (Object.entries(SEASON_PROTO) as [Season, { t: number; d: number; c: number }][])
    .map(([s, v]) => ({ s, dist: Math.hypot(p.t - v.t, 0.7 * (p.d - v.d), 0.7 * (p.c - v.c)) }))
    .sort((a, b) => a.dist - b.dist)[0].s
  const strong = SUBTYPES[main].find((x) => p[x.axis] * x.sign > 0.35)
  const sub = strong?.name ?? null
  const proto = SEASON_PROTO[main]
  // blend user's measured values with the season prototype so palettes stay coherent
  const target = { t: 0.5 * p.t + 0.5 * proto.t, d: 0.5 * p.d + 0.5 * proto.d, c: 0.5 * p.c + 0.5 * proto.c }
  const ranked = COLORS.map((col) => ({ col, fit: colorFit(target, col) })).sort((a, b) => b.fit - a.fit)
  const best = ranked.filter((r) => !r.col.neutral).slice(0, 12).map((r) => r.col)
  const neutrals = ranked.filter((r) => r.col.neutral).slice(0, 5).map((r) => r.col)
  const avoidList = ranked.slice(-6).map((r) => r.col)
  return { season: sub ? `${sub} ${main}` : `True ${main}`, main, sub, target, best, avoidList, neutrals, text: SEASON_TEXT[main] }
}

// ---------- feminine essence ----------
export interface Essence {
  name: string
  blurb: string
  necklines: string
  fabrics: string
  prints: string
  silhouettes: string
}

export function essence(yin: number): Essence {
  if (yin > 0.6) return {
    name: 'Romantic (soft yin)', blurb: 'Soft curves and delicate features. You shine in fluid, gentle, luxurious pieces.',
    necklines: 'V-neck, sweetheart, scoop, wrap', fabrics: 'Chiffon, silk, jersey, soft knits, lace',
    prints: 'Florals, watercolour, small-scale soft prints', silhouettes: 'Fitted-and-flowing, wrap dresses, bias-cut skirts',
  }
  if (yin > 0.2) return {
    name: 'Soft natural', blurb: 'Gentle and approachable, with relaxed lines. Comfort and texture suit you.',
    necklines: 'Scoop, V-neck, soft cowl', fabrics: 'Cotton, linen blends, brushed knits, denim',
    prints: 'Gentle florals, soft stripes, tonal prints', silhouettes: 'Relaxed with some shape, soft layering',
  }
  if (yin > -0.2) return {
    name: 'Balanced classic', blurb: 'An even mix of soft and sharp: you can wear both structured and flowy.',
    necklines: 'Almost anything: crew, V, boat, collar', fabrics: 'Medium-weight crepe, cotton, wool, silk blends',
    prints: 'Medium-scale classic prints, stripes, checks', silhouettes: 'Waist-defined, tailored with a soft touch',
  }
  if (yin > -0.6) return {
    name: 'Strong elegant', blurb: 'Clean angles and a confident presence. Structure and sleek lines flatter you.',
    necklines: 'Square, collared, high or sharp V', fabrics: 'Crepe, structured cotton, leather-look, wool suiting',
    prints: 'Geometric, bold stripes, graphic', silhouettes: 'Tailored, straight lines, sharp shoulders',
  }
  return {
    name: 'Dramatic (sharp yang)', blurb: 'Striking and angular. You carry bold lines, high contrast and sleek, long shapes.',
    necklines: 'Plunge, asymmetric, high structured', fabrics: 'Leather, heavy crepe, satin, sleek knits',
    prints: 'Large graphic, high contrast, abstract', silhouettes: 'Long, sharp, monochrome columns, strong shoulders',
  }
}
