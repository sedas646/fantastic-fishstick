import { useCallback, useEffect, useState } from 'react'
import { ACTIVITIES } from './data/activities'
import { kindById } from './data/kinds'
import type { ActivityDef, Item, Profile, Weather } from './types'

export const DEFAULT_PROFILE: Profile = {
  completed: false, t: 0, d: 0, c: 0,
  styleScores: { classic: 0, minimal: 0, romantic: 0, natural: 0, edgy: 0, boho: 0 },
  yin: 0,
  frequencies: { wfh: 2, dog: 2, shopping: 2, karting: 1, goingout: 2 },
  retailers: ['google', 'asos', 'zara', 'hm'],
}

interface Saved { profile: Profile; items: Item[]; custom: ActivityDef[]; weather: Weather }
const KEY = 'wardrobe-stylist-v1'

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as Partial<Saved>
      return {
        profile: { ...DEFAULT_PROFILE, ...s.profile },
        items: s.items ?? [], custom: s.custom ?? [], weather: s.weather ?? 'mild',
      }
    }
  } catch { /* ignore corrupt or unavailable storage */ }
  return { profile: DEFAULT_PROFILE, items: [], custom: [], weather: 'mild' }
}

export function useStore() {
  const [state, setState] = useState<Saved>(load)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* quota / private mode */ }
  }, [state])

  const setProfile = useCallback((profile: Profile) => setState((s) => ({ ...s, profile })), [])
  const setWeather = useCallback((weather: Weather) => setState((s) => ({ ...s, weather })), [])
  const addItem = useCallback((it: Omit<Item, 'id'>) =>
    setState((s) => ({ ...s, items: [...s.items, { ...it, id: crypto.randomUUID() }] })), [])
  const addItems = useCallback((its: Omit<Item, 'id'>[]) =>
    setState((s) => ({ ...s, items: [...s.items, ...its.map((it) => ({ ...it, id: crypto.randomUUID() }))] })), [])
  const removeItem = useCallback((id: string) =>
    setState((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) })), [])
  const addActivity = useCallback((a: ActivityDef) =>
    setState((s) => ({ ...s, custom: [...s.custom, a], profile: { ...s.profile, frequencies: { ...s.profile.frequencies, [a.id]: 2 } } })), [])
  const removeActivity = useCallback((id: string) =>
    setState((s) => ({ ...s, custom: s.custom.filter((a) => a.id !== id) })), [])
  const reset = useCallback(() => setState({ profile: DEFAULT_PROFILE, items: [], custom: [], weather: 'mild' }), [])

  const activities = [...ACTIVITIES, ...state.custom]
  return { ...state, activities, setProfile, setWeather, addItem, addItems, removeItem, addActivity, removeActivity, reset }
}

export type Store = ReturnType<typeof useStore>

export const itemLabel = (i: Item) => i.name || kindById(i.kind).label

export const SAMPLE: Omit<Item, 'id'>[] = [
  { kind: 'tee', color: 'white', formality: 1, name: '' },
  { kind: 'tee', color: 'navy', formality: 1, name: '' },
  { kind: 'longsleeve', color: 'beige', formality: 2, name: '' },
  { kind: 'knit', color: 'camel', formality: 2, name: '' },
  { kind: 'shirt', color: 'powder', formality: 3, name: '' },
  { kind: 'blouse', color: 'blush', formality: 3, name: '' },
  { kind: 'dressytop', color: 'burgundy', formality: 4, name: '' },
  { kind: 'jeans', color: 'denim', formality: 2, name: '' },
  { kind: 'leggings', color: 'black', formality: 1, name: '' },
  { kind: 'trousers', color: 'charcoal', formality: 4, name: '' },
  { kind: 'midiskirt', color: 'rust', formality: 3, name: '' },
  { kind: 'casualdress', color: 'olive', formality: 2, name: '' },
  { kind: 'wrapdress', color: 'emerald', formality: 4, name: '' },
  { kind: 'blazer', color: 'navy', formality: 4, name: '' },
  { kind: 'puffer', color: 'black', formality: 1, name: '' },
  { kind: 'cardigan', color: 'taupe', formality: 2, name: '' },
  { kind: 'sneakers', color: 'white', formality: 1, name: '' },
  { kind: 'anklebootsflat', color: 'chocolate', formality: 3, name: '' },
  { kind: 'heels', color: 'black', formality: 5, name: '' },
  { kind: 'crossbody', color: 'camel', formality: 2, name: '' },
  { kind: 'clutch', color: 'black', formality: 5, name: '' },
]
