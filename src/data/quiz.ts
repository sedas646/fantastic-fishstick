import type { Style } from '../types'

export interface ColorOption { label: string; t?: number; d?: number; c?: number }
export interface ColorQuestion { id: string; q: string; options: ColorOption[] }

export const COLOR_QUESTIONS: ColorQuestion[] = [
  { id: 'veins', q: 'What colour are the veins on your inner wrist (natural light)?', options: [
    { label: 'Blue or purple', t: -1 },
    { label: 'Green or olive', t: 1 },
    { label: 'A mix / hard to tell', t: 0 },
  ] },
  { id: 'metal', q: 'Which jewellery flatters you more?', options: [
    { label: 'Silver / white gold', t: -1 },
    { label: 'Yellow gold', t: 1 },
    { label: 'Both look good', t: 0 },
  ] },
  { id: 'sun', q: 'How does your skin react to the sun?', options: [
    { label: 'Burns easily, rarely tans', t: -0.6, d: -0.4 },
    { label: 'Tans easily, golden glow', t: 0.8, d: 0.2 },
    { label: 'Burns first, then tans', t: 0 },
  ] },
  { id: 'hair', q: 'Your natural hair colour (before dye)?', options: [
    { label: 'Light ash / platinum blonde', t: -0.6, d: -1 },
    { label: 'Golden blonde / strawberry', t: 0.8, d: -0.8 },
    { label: 'Light–mid brown, mousy', t: -0.2, d: -0.1 },
    { label: 'Chestnut / auburn / copper', t: 0.9, d: 0.3 },
    { label: 'Dark brown', t: 0, d: 0.8 },
    { label: 'Black / blue-black', t: -0.4, d: 1 },
  ] },
  { id: 'eyes', q: 'Your eye colour?', options: [
    { label: 'Blue or grey', t: -0.7, d: -0.3 },
    { label: 'Green or hazel', t: 0.5, d: 0 },
    { label: 'Amber / light brown', t: 0.8, d: 0.1 },
    { label: 'Dark brown / black', t: 0, d: 0.9 },
  ] },
  { id: 'skin', q: 'Your skin depth?', options: [
    { label: 'Very fair', d: -1 },
    { label: 'Fair to light', d: -0.5 },
    { label: 'Medium / olive', d: 0.2 },
    { label: 'Tan / brown', d: 0.7 },
    { label: 'Deep', d: 1 },
  ] },
  { id: 'contrast', q: 'Contrast between your hair, skin and eyes?', options: [
    { label: 'Low — everything blends softly', c: -1 },
    { label: 'Medium', c: 0 },
    { label: 'High — striking, crisp contrast', c: 1 },
  ] },
  { id: 'vibe', q: 'Which colours make you glow?', options: [
    { label: 'Muted, dusty, blended', c: -1 },
    { label: 'A bit of both', c: 0 },
    { label: 'Vivid, clear, saturated', c: 1 },
  ] },
]

export interface StyleOption { label: string; pts: Partial<Record<Style, number>> }
export interface StyleQuestion { id: string; q: string; options: StyleOption[] }

export const STYLE_QUESTIONS: StyleQuestion[] = [
  { id: 'weekend', q: 'Your ideal weekend outfit?', options: [
    { label: 'Jeans, tee, clean sneakers', pts: { natural: 2, minimal: 1 } },
    { label: 'Tailored trousers, knit and loafers', pts: { classic: 2, minimal: 1 } },
    { label: 'Floaty dress and sandals', pts: { romantic: 2, boho: 1 } },
    { label: 'Black jeans, leather jacket, boots', pts: { edgy: 2 } },
    { label: 'Flowy skirt, printed top, layers', pts: { boho: 2, romantic: 1 } },
  ] },
  { id: 'detail', q: 'Which details do you love?', options: [
    { label: 'Clean lines, no logos', pts: { minimal: 2, classic: 1 } },
    { label: 'Ruffles, lace, bows', pts: { romantic: 2 } },
    { label: 'Studs, leather, asymmetry', pts: { edgy: 2 } },
    { label: 'Prints, fringe, layered jewellery', pts: { boho: 2 } },
    { label: 'Timeless pieces: stripes, pearls, trench', pts: { classic: 2 } },
    { label: 'Soft textures, comfy basics', pts: { natural: 2 } },
  ] },
  { id: 'palette', q: 'Your wardrobe is mostly…', options: [
    { label: 'Neutrals with one accent', pts: { minimal: 2, classic: 1 } },
    { label: 'Earthy tones', pts: { natural: 1, boho: 2 } },
    { label: 'Soft pastels and pinks', pts: { romantic: 2 } },
    { label: 'Black and dark shades', pts: { edgy: 2, minimal: 1 } },
    { label: 'Navy, camel, white', pts: { classic: 2 } },
  ] },
  { id: 'shoe', q: 'Dream shoe?', options: [
    { label: 'White leather sneakers', pts: { natural: 1, minimal: 2 } },
    { label: 'Pointed pumps / loafers', pts: { classic: 2 } },
    { label: 'Strappy heels or ballet flats', pts: { romantic: 2 } },
    { label: 'Chunky boots', pts: { edgy: 2 } },
    { label: 'Suede ankle boots / sandals', pts: { boho: 2, natural: 1 } },
  ] },
  { id: 'feel', q: 'How do you want people to describe you?', options: [
    { label: 'Polished and elegant', pts: { classic: 2 } },
    { label: 'Effortless and chic', pts: { minimal: 2 } },
    { label: 'Soft and charming', pts: { romantic: 2 } },
    { label: 'Easygoing and warm', pts: { natural: 2 } },
    { label: 'Bold and cool', pts: { edgy: 2 } },
    { label: 'Free-spirited and creative', pts: { boho: 2 } },
  ] },
]

export interface EssenceQuestion { id: string; q: string; options: { label: string; y: number }[] }

/** y: +1 = soft / curved (yin), -1 = sharp / angular (yang) */
export const ESSENCE_QUESTIONS: EssenceQuestion[] = [
  { id: 'face', q: 'Your face and bone structure?', options: [
    { label: 'Round, soft curves, gentle jaw', y: 1 },
    { label: 'Balanced — a mix of soft and defined', y: 0 },
    { label: 'Angular, defined cheekbones/jaw', y: -1 },
  ] },
  { id: 'lines', q: 'Your overall body lines?', options: [
    { label: 'Curvy and soft', y: 1 },
    { label: 'Balanced / hourglass-ish', y: 0.2 },
    { label: 'Straight, athletic or angular', y: -1 },
  ] },
  { id: 'features', q: 'Your features (eyes, lips, hands)?', options: [
    { label: 'Delicate, small', y: 0.8 },
    { label: 'Medium', y: 0 },
    { label: 'Bold, large or striking', y: -0.8 },
  ] },
  { id: 'fabric', q: 'Which fabrics feel like "you"?', options: [
    { label: 'Chiffon, silk, soft knits', y: 1 },
    { label: 'Cotton, denim, jersey', y: 0 },
    { label: 'Crisp cotton, leather, tailoring', y: -1 },
  ] },
  { id: 'energy', q: 'Your natural presence?', options: [
    { label: 'Warm, gentle, approachable', y: 1 },
    { label: 'Friendly but composed', y: 0 },
    { label: 'Commanding, intense, dramatic', y: -1 },
  ] },
]
