import type { ColorDef } from '../types'

const c = (
  id: string, name: string, hex: string, family: string, neutral: boolean,
  t: number, d: number, ch: number,
): ColorDef => ({ id, name, hex, family, neutral, t, d, c: ch })

// t: warm(+)/cool(-), d: deep(+)/light(-), c: clear(+)/soft(-)
export const COLORS: ColorDef[] = [
  c('black', 'Black', '#14141a', 'black', true, -0.2, 1, 1),
  c('white', 'Optic white', '#fbfbfb', 'white', true, -0.5, -1, 1),
  c('ivory', 'Ivory', '#f2ead3', 'white', true, 0.7, -0.8, -0.3),
  c('grey', 'Soft grey', '#b8bcc4', 'grey', true, -0.6, -0.5, -0.5),
  c('charcoal', 'Charcoal', '#3d4249', 'grey', true, -0.3, 0.6, -0.2),
  c('navy', 'Navy', '#1f2a4d', 'blue', true, -0.5, 0.8, 0.3),
  c('denim', 'Denim blue', '#4b6b95', 'blue', true, -0.4, 0.2, -0.5),
  c('beige', 'Beige', '#d9c4a4', 'brown', true, 0.5, -0.4, -0.6),
  c('camel', 'Camel', '#c29a68', 'brown', true, 0.8, 0, -0.2),
  c('chocolate', 'Chocolate', '#4a2f25', 'brown', true, 0.7, 0.9, -0.3),
  c('taupe', 'Taupe', '#9b8b80', 'brown', true, 0, -0.1, -0.8),
  c('olive', 'Olive', '#6c6d33', 'green', false, 0.9, 0.3, -0.6),
  c('forest', 'Forest green', '#1f4d3a', 'green', false, 0, 0.8, 0.2),
  c('emerald', 'Emerald', '#0f9d6b', 'green', false, -0.2, 0.2, 1),
  c('sage', 'Sage', '#a3b59a', 'green', false, 0.1, -0.4, -0.8),
  c('mint', 'Mint', '#a9e2cb', 'green', false, -0.1, -0.8, 0.1),
  c('teal', 'Teal', '#1b7f86', 'teal', false, -0.2, 0.3, 0.4),
  c('turquoise', 'Turquoise', '#27bcc6', 'teal', false, 0.1, -0.2, 0.9),
  c('powder', 'Powder blue', '#b4d0ea', 'blue', false, -0.6, -0.8, -0.2),
  c('royal', 'Royal blue', '#2a4fd0', 'blue', false, -0.7, 0.2, 1),
  c('lavender', 'Lavender', '#b8a9da', 'purple', false, -0.6, -0.5, -0.2),
  c('plum', 'Plum', '#5d2a63', 'purple', false, -0.5, 0.8, 0),
  c('fuchsia', 'Fuchsia', '#d6247a', 'pink', false, -0.5, 0.2, 1),
  c('blush', 'Blush', '#f3d1d6', 'pink', false, -0.3, -0.8, -0.3),
  c('rose', 'Dusty rose', '#c79c9f', 'pink', false, -0.1, -0.2, -0.8),
  c('coral', 'Coral', '#ff6f61', 'orange', false, 0.8, -0.3, 0.8),
  c('peach', 'Peach', '#ffc9a2', 'orange', false, 0.8, -0.7, 0),
  c('rust', 'Rust', '#b4532a', 'orange', false, 0.9, 0.4, -0.2),
  c('mustard', 'Mustard', '#d3a017', 'yellow', false, 1, 0, 0.3),
  c('butter', 'Butter yellow', '#f6e8a3', 'yellow', false, 0.4, -0.8, 0.1),
  c('red', 'True red', '#cf2030', 'red', false, 0, 0.2, 1),
  c('burgundy', 'Burgundy', '#6d1f35', 'red', false, -0.3, 0.8, -0.1),
]

export const colorById = (id: string): ColorDef =>
  COLORS.find((x) => x.id === id) ?? COLORS[0]
