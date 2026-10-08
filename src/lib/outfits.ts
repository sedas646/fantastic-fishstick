import { COLORS, colorById } from '../data/colors'
import { KINDS, kindById } from '../data/kinds'
import { analyse, colorFit, topStyles } from './analysis'
import type { ActivityDef, ColorDef, Item, KindDef, Outfit, Profile, Suggestion, Weather } from '../types'

export interface Ctx {
  profile: Profile
  activity: ActivityDef
  weather: Weather
  target: { t: number; d: number; c: number }
  styles: string[]
}

export const makeCtx = (profile: Profile, activity: ActivityDef, weather: Weather): Ctx => ({
  profile, activity, weather, target: analyse(profile).target, styles: topStyles(profile, 2),
})

export function allowed(kind: KindDef, a: ActivityDef): boolean {
  if (a.noKinds.includes(kind.id)) return false
  if (a.mobileOnly && !kind.mobile) return false
  if (a.secureFootOnly && kind.category === 'shoes' && !kind.secureFoot) return false
  if (a.noLoose && kind.loose) return false
  return true
}

/** 0..1 score for a single piece in a given context */
export function soloScore(kind: KindDef, color: ColorDef, formality: number, ctx: Ctx): number {
  const a = ctx.activity
  let cf = colorFit(ctx.target, color)
  if (color.neutral) cf = Math.max(cf, 0.45)
  const form = Math.max(0, 1 - Math.abs(formality - a.formality) / 3)
  const style = kind.styles.some((s) => ctx.styles.includes(s)) ? 1 : 0.5
  const yin = ctx.profile.yin
  const shape =
    yin > 0.3 ? (kind.shape === 'flowy' || kind.shape === 'fitted' ? 1 : kind.shape === 'relaxed' ? 0.7 : 0.5)
    : yin < -0.3 ? (kind.shape === 'structured' || kind.shape === 'fitted' ? 1 : kind.shape === 'relaxed' ? 0.6 : 0.5)
    : 0.8
  const comfort = a.comfort >= 3 ? [0, 0.4, 0.8, 1][kind.comfort] : 1
  let weather = 1
  if (ctx.weather === 'hot' && kind.warmth === 3) weather = 0.4
  if (ctx.weather === 'cold' && kind.warmth === 1 && kind.category !== 'accessory' && kind.category !== 'bag') weather = 0.8
  return 0.35 * cf + 0.25 * form + 0.15 * style + 0.1 * shape + 0.1 * comfort + 0.05 * weather
}

const itemSolo = (it: Item, ctx: Ctx) => soloScore(kindById(it.kind), colorById(it.color), it.formality, ctx)

function scoreOutfit(parts: Item[], ctx: Ctx): Outfit {
  const a = ctx.activity
  const kinds = parts.map((p) => kindById(p.kind))
  const cols = parts.map((p) => colorById(p.color))
  const w = kinds.map((k) => (k.category === 'top' || k.category === 'dress' ? 2 : 1))
  const wsum = w.reduce((x, y) => x + y, 0)
  const colorAvg = cols.reduce((s, c, i) => {
    const f = colorFit(ctx.target, c)
    return s + w[i] * (c.neutral ? Math.max(f, 0.45) : f)
  }, 0) / wsum
  const families = new Set(cols.filter((c) => !c.neutral).map((c) => c.family))
  const harmony = families.size <= 1 ? 1 : families.size === 2 ? 0.95 : families.size === 3 ? 0.8 : 0.6
  const color = colorAvg * harmony

  const core = parts.filter((_, i) => !['bag', 'accessory'].includes(kinds[i].category))
  const avgForm = core.reduce((s, p) => s + p.formality, 0) / core.length
  const form = Math.max(0, 1 - Math.abs(avgForm - a.formality) / 3)
  const comfortAvg = kinds.reduce((s, k) => s + k.comfort, 0) / kinds.length
  const comfort = a.comfort >= 3 ? Math.min(1, comfortAvg / 2.6) : 1
  const fit = 0.7 * form + 0.3 * comfort

  const styleHit = kinds.filter((k) => k.styles.some((s) => ctx.styles.includes(s))).length / kinds.length
  const yin = ctx.profile.yin
  const shapes = kinds.map((k) => k.shape)
  const shapeHit = shapes.filter((s) =>
    yin > 0.3 ? s === 'flowy' || s === 'fitted' : yin < -0.3 ? s === 'structured' || s === 'fitted' : true,
  ).length / shapes.length
  const style = 0.65 * styleHit + 0.35 * shapeHit

  const outer = kinds.find((k) => k.category === 'outer')
  const heavy = kinds.filter((k) => k.warmth === 3).length
  let weather = 1
  if (ctx.weather === 'cold') weather = !outer ? 0.35 : outer.warmth >= (a.outdoor ? 3 : 2) ? 1 : 0.65
  else if (ctx.weather === 'mild') weather = outer || !a.outdoor ? 1 : 0.8
  else weather = Math.max(0.3, (outer ? 0.7 : 1) - 0.2 * heavy)

  const total = 0.32 * color + 0.28 * fit + 0.25 * style + 0.15 * weather
  return {
    parts: parts.map((item, i) => ({ slot: kinds[i].category, item })),
    score: Math.round(total * 100),
    breakdown: {
      color: Math.round(color * 100), fit: Math.round(fit * 100),
      style: Math.round(style * 100), weather: Math.round(weather * 100),
    },
  }
}

function pool(items: Item[], category: string, ctx: Ctx, k: number): Item[] {
  return items
    .filter((i) => {
      const kd = kindById(i.kind)
      return kd.category === category && allowed(kd, ctx.activity)
    })
    .map((i) => ({ i, s: itemSolo(i, ctx) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.i)
}

export type Slot = 'top' | 'bottom' | 'dress' | 'shoes'

/** Which required parts the wardrobe cannot supply for this activity */
export function missingSlots(items: Item[], ctx: Ctx): Slot[] {
  const has = (c: string) => pool(items, c, ctx, 1).length > 0
  const missing: Slot[] = []
  if (!has('shoes')) missing.push('shoes')
  if (!has('dress')) {
    if (!has('top')) missing.push('top')
    if (!has('bottom')) missing.push('bottom')
  }
  // a dress alone is a complete base; but if the activity bans dresses and top/bottom absent we still list them
  return missing.filter((m) => !(m === 'top' && has('dress')) && !(m === 'bottom' && has('dress')))
}

export function buildOutfits(items: Item[], ctx: Ctx, n = 4, k = 6, pinned?: string): Outfit[] {
  const tops = pool(items, 'top', ctx, k)
  const bottoms = pool(items, 'bottom', ctx, k)
  const dresses = pool(items, 'dress', ctx, k)
  const shoes = pool(items, 'shoes', ctx, k)
  const outers = pool(items, 'outer', ctx, k)
  const bags = pool(items, 'bag', ctx, 1)
  const accs = pool(items, 'accessory', ctx, 1)
  if (!shoes.length) return []

  const bases: Item[][] = [...dresses.map((d) => [d])]
  for (const t of tops) for (const b of bottoms) bases.push([t, b])
  const outerOptions: (Item | null)[] = [null, ...outers]

  const out: Outfit[] = []
  for (const base of bases)
    for (const s of shoes)
      for (const o of outerOptions) {
        const parts = [...base, s, ...(o ? [o] : [])]
        if (pinned && !parts.some((p) => p.id === pinned)) continue
        out.push(scoreOutfit(parts, ctx))
      }
  out.sort((a, b) => b.score - a.score)

  // keep variety: each base used once, each shoe at most twice
  const seenBase = new Set<string>()
  const shoeUse = new Map<string, number>()
  const picked: Outfit[] = []
  for (const o of out) {
    const baseKey = o.parts.filter((p) => ['top', 'bottom', 'dress'].includes(p.slot)).map((p) => p.item.id).join('+')
    const shoe = o.parts.find((p) => p.slot === 'shoes')!.item.id
    if (seenBase.has(baseKey) || (shoeUse.get(shoe) ?? 0) >= 2) continue
    seenBase.add(baseKey)
    shoeUse.set(shoe, (shoeUse.get(shoe) ?? 0) + 1)
    // finish with a bag / accessory when they help
    let parts = o.parts.map((p) => p.item)
    for (const extra of [bags[0], accs[0]]) {
      if (!extra) continue
      const withExtra = scoreOutfit([...parts, extra], ctx)
      const without = scoreOutfit(parts, ctx)
      if (withExtra.score >= without.score - 1) parts = [...parts, extra]
    }
    picked.push(scoreOutfit(parts, ctx))
    if (picked.length >= n) break
  }
  return picked.sort((a, b) => b.score - a.score)
}

export const bestScore = (items: Item[], ctx: Ctx) => buildOutfits(items, ctx, 1, 4)[0]?.score ?? 0

let tmpId = 0
const hypothetical = (kind: KindDef, color: ColorDef): Item => ({
  id: `hyp-${tmpId++}`, name: `${color.name} ${kind.label}`, kind: kind.id, color: color.id, formality: kind.formality,
})

/** Pieces worth buying for one activity */
export function suggestPurchases(items: Item[], ctx: Ctx, max = 3): Suggestion[] {
  const a = ctx.activity
  const an = analyse(ctx.profile)
  const colors = [...an.best.slice(0, 4), ...an.neutrals.slice(0, 3)]
  const kinds = KINDS.filter((kd) => allowed(kd, a) && kd.category !== 'accessory' && Math.abs(kd.formality - a.formality) <= 1)
  const missing = missingSlots(items, ctx)

  // wardrobe can't make a complete outfit yet -> recommend the missing basics
  if (missing.length) {
    const out: Suggestion[] = []
    for (const slot of missing) {
      const cands = kinds.filter((kd) => kd.category === slot)
        .flatMap((kd) => colors.map((c) => ({ kd, c, s: soloScore(kd, c, kd.formality, ctx) })))
        .sort((x, y) => y.s - x.s)
      const seen = new Set<string>()
      for (const c of cands) {
        if (seen.has(c.kd.id)) continue
        seen.add(c.kd.id)
        out.push({ kind: c.kd, color: c.c, gain: 0, isNew: true, reason: `Missing ${slot === 'shoes' ? 'shoes' : slot} for ${a.label.toLowerCase()}` })
        if (seen.size >= 2) break
      }
    }
    return out.slice(0, max + 1)
  }

  const base = bestScore(items, ctx)
  const have = new Set(items.map((i) => `${i.kind}:${i.color}`))
  const scored: Suggestion[] = []
  for (const kd of kinds)
    for (const c of colors) {
      if (have.has(`${kd.id}:${c.id}`)) continue
      const s = bestScore([...items, hypothetical(kd, c)], ctx)
      if (s > base) scored.push({ kind: kd, color: c, gain: s - base, isNew: false, reason: `${a.label} look: ${base} → ${s}` })
    }
  scored.sort((x, y) => y.gain - x.gain)
  const seenKinds = new Set<string>()
  return scored.filter((s) => (seenKinds.has(s.kind.id) ? false : (seenKinds.add(s.kind.id), true))).slice(0, max)
}

// ---------- capsule ----------
export interface CapsuleResult {
  items: Item[]
  looks: { activity: ActivityDef; outfits: Outfit[] }[]
  combos: number
  buy: (Suggestion & { activity: string })[]
}

const QUOTA: Record<string, number> = { top: 4, bottom: 3, dress: 1, outer: 2, shoes: 3, bag: 1, accessory: 1 }

export function buildCapsule(
  items: Item[], profile: Profile, activities: ActivityDef[], weather: Weather, size: 'small' | 'medium' | 'large',
): CapsuleResult {
  const mult = size === 'small' ? 0.7 : size === 'large' ? 1.5 : 1
  const weight = (a: ActivityDef) => profile.frequencies[a.id] || 1
  const usage = new Map<string, number>()
  for (const a of activities) {
    const ctx = makeCtx(profile, a, weather)
    for (const o of buildOutfits(items, ctx, 5, 8))
      for (const p of o.parts) usage.set(p.item.id, (usage.get(p.item.id) ?? 0) + o.score * weight(a))
  }
  const chosen: Item[] = []
  for (const [cat, q] of Object.entries(QUOTA)) {
    const take = Math.max(1, Math.round(q * mult))
    const ranked = items
      .filter((i) => kindById(i.kind).category === cat)
      .map((i) => ({ i, u: usage.get(i.id) ?? 0 }))
      .filter((x) => x.u > 0)
      .sort((a, b) => b.u - a.u)
    chosen.push(...ranked.slice(0, take).map((x) => x.i))
  }
  const looks = activities.map((a) => ({ activity: a, outfits: buildOutfits(chosen, makeCtx(profile, a, weather), 3, 8) }))
  const combos = looks.reduce((s, l) => s + l.outfits.length, 0)
  const buy = activities
    .flatMap((a) => suggestPurchases(chosen, makeCtx(profile, a, weather), 1).map((s) => ({ ...s, activity: a.label })))
    .sort((x, y) => y.gain - x.gain)
    .slice(0, 6)
  return { items: chosen, looks, combos, buy }
}

export { COLORS }
