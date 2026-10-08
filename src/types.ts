export type Style = 'classic' | 'minimal' | 'romantic' | 'natural' | 'edgy' | 'boho'
export type Category = 'top' | 'bottom' | 'dress' | 'outer' | 'shoes' | 'bag' | 'accessory'
export type Shape = 'structured' | 'fitted' | 'flowy' | 'relaxed'
export type Weather = 'hot' | 'mild' | 'cold'

export interface ColorDef {
  id: string
  name: string
  hex: string
  family: string
  neutral: boolean
  /** warm(+1)/cool(-1), deep(+1)/light(-1), clear(+1)/soft(-1) */
  t: number
  d: number
  c: number
}

export interface KindDef {
  id: string
  label: string
  category: Category
  formality: number
  /** 1 light, 2 medium, 3 heavy */
  warmth: number
  /** 1 restrictive, 2 ok, 3 very comfy */
  comfort: number
  /** fine for running around / karting */
  mobile: boolean
  /** covers toes and holds on to the foot */
  secureFoot?: boolean
  /** loose, dangling or open fabric that can snag */
  loose?: boolean
  shape: Shape
  styles: Style[]
  /** shopping search keywords */
  query: string
}

export interface Item {
  id: string
  name: string
  kind: string
  color: string
  formality: number
  photo?: string
}

export interface ActivityDef {
  id: string
  label: string
  emoji: string
  formality: number
  comfort: number
  outdoor: boolean
  mobileOnly: boolean
  secureFootOnly: boolean
  noLoose: boolean
  noKinds: string[]
  tip: string
  custom?: boolean
}

export type Frequency = 0 | 1 | 2 | 3

export interface Profile {
  completed: boolean
  t: number
  d: number
  c: number
  styleScores: Record<Style, number>
  yin: number
  frequencies: Record<string, Frequency>
  retailers: string[]
}

export interface Outfit {
  parts: { slot: string; item: Item }[]
  score: number
  breakdown: { color: number; fit: number; style: number; weather: number }
}

export interface Suggestion {
  kind: KindDef
  color: ColorDef
  reason: string
  gain: number
  isNew: boolean
}
