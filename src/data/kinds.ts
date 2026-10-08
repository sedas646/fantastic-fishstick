import type { Category, KindDef, Shape, Style } from '../types'

const k = (
  id: string, label: string, category: Category, formality: number, warmth: number,
  comfort: number, mobile: boolean, shape: Shape, styles: Style[], query: string,
  extra: Partial<Pick<KindDef, 'secureFoot' | 'loose'>> = {},
): KindDef => ({ id, label, category, formality, warmth, comfort, mobile, shape, styles, query, ...extra })

export const KINDS: KindDef[] = [
  // tops
  k('tee', 'T-shirt', 'top', 1, 1, 3, true, 'relaxed', ['natural', 'minimal'], 't-shirt'),
  k('tank', 'Tank / cami', 'top', 2, 1, 2, true, 'fitted', ['minimal', 'romantic'], 'cami top'),
  k('bodysuit', 'Bodysuit', 'top', 3, 1, 2, true, 'fitted', ['edgy', 'minimal'], 'bodysuit'),
  k('shirt', 'Button-up shirt', 'top', 3, 1, 2, true, 'structured', ['classic', 'minimal'], 'shirt'),
  k('blouse', 'Blouse', 'top', 3, 1, 2, false, 'flowy', ['romantic', 'classic', 'boho'], 'blouse', { loose: true }),
  k('knit', 'Knit sweater', 'top', 2, 3, 3, true, 'relaxed', ['natural', 'classic'], 'knit sweater'),
  k('longsleeve', 'Long-sleeve top', 'top', 2, 2, 3, true, 'fitted', ['minimal', 'natural'], 'long sleeve top'),
  k('sweatshirt', 'Sweatshirt / hoodie', 'top', 1, 2, 3, true, 'relaxed', ['natural', 'edgy'], 'sweatshirt'),
  k('sporttop', 'Sports top', 'top', 1, 1, 3, true, 'fitted', ['natural'], 'sports top'),
  k('dressytop', 'Satin / evening top', 'top', 4, 1, 1, false, 'flowy', ['romantic', 'edgy'], 'satin top', { loose: true }),
  // bottoms
  k('jeans', 'Jeans', 'bottom', 2, 2, 2, true, 'fitted', ['natural', 'classic', 'edgy'], 'jeans'),
  k('widejeans', 'Wide-leg jeans', 'bottom', 2, 2, 3, true, 'relaxed', ['natural', 'minimal', 'boho'], 'wide leg jeans'),
  k('trousers', 'Tailored trousers', 'bottom', 4, 2, 2, true, 'structured', ['classic', 'minimal'], 'tailored trousers'),
  k('leggings', 'Leggings', 'bottom', 1, 2, 3, true, 'fitted', ['natural'], 'leggings'),
  k('joggers', 'Joggers', 'bottom', 1, 2, 3, true, 'relaxed', ['natural', 'edgy'], 'joggers'),
  k('shorts', 'Shorts', 'bottom', 1, 1, 3, true, 'relaxed', ['natural'], 'shorts'),
  k('midiskirt', 'Midi skirt', 'bottom', 3, 1, 2, false, 'flowy', ['romantic', 'boho', 'classic'], 'midi skirt', { loose: true }),
  k('miniskirt', 'Mini skirt', 'bottom', 3, 1, 2, false, 'fitted', ['edgy', 'romantic'], 'mini skirt'),
  k('leatherpants', 'Leather-look trousers', 'bottom', 4, 2, 2, true, 'fitted', ['edgy'], 'leather look trousers'),
  // dresses
  k('casualdress', 'Casual dress', 'dress', 2, 1, 3, false, 'relaxed', ['natural', 'boho', 'romantic'], 'casual dress', { loose: true }),
  k('shirtdress', 'Shirt dress', 'dress', 3, 1, 2, false, 'structured', ['classic', 'minimal'], 'shirt dress'),
  k('maxidress', 'Maxi dress', 'dress', 3, 1, 3, false, 'flowy', ['boho', 'romantic'], 'maxi dress', { loose: true }),
  k('wrapdress', 'Wrap dress', 'dress', 4, 1, 2, false, 'flowy', ['romantic', 'classic'], 'wrap dress', { loose: true }),
  k('eveningdress', 'Evening dress', 'dress', 5, 1, 1, false, 'fitted', ['romantic', 'edgy', 'classic'], 'evening dress'),
  k('littleblackdress', 'Fitted dress', 'dress', 4, 1, 2, false, 'fitted', ['classic', 'minimal', 'edgy'], 'fitted midi dress'),
  // outerwear
  k('cardigan', 'Cardigan', 'outer', 2, 2, 3, true, 'relaxed', ['natural', 'classic'], 'cardigan'),
  k('blazer', 'Blazer', 'outer', 4, 2, 2, true, 'structured', ['classic', 'minimal', 'edgy'], 'blazer'),
  k('denimjacket', 'Denim jacket', 'outer', 2, 2, 3, true, 'relaxed', ['natural', 'edgy'], 'denim jacket'),
  k('leatherjacket', 'Leather jacket', 'outer', 3, 2, 2, true, 'fitted', ['edgy'], 'leather jacket'),
  k('trench', 'Trench coat', 'outer', 4, 2, 2, false, 'structured', ['classic', 'minimal'], 'trench coat'),
  k('wooolcoat', 'Wool coat', 'outer', 4, 3, 2, false, 'structured', ['classic', 'minimal'], 'wool coat'),
  k('puffer', 'Puffer / parka', 'outer', 1, 3, 3, true, 'relaxed', ['natural'], 'puffer jacket'),
  k('rainjacket', 'Rain jacket', 'outer', 1, 2, 3, true, 'relaxed', ['natural'], 'rain jacket'),
  // shoes
  k('sneakers', 'Sneakers', 'shoes', 1, 1, 3, true, 'relaxed', ['natural', 'minimal'], 'sneakers', { secureFoot: true }),
  k('whitesneakers', 'Clean leather sneakers', 'shoes', 2, 1, 3, true, 'relaxed', ['minimal', 'classic'], 'white leather sneakers', { secureFoot: true }),
  k('anklebootsflat', 'Flat ankle boots', 'shoes', 3, 3, 2, true, 'structured', ['edgy', 'classic', 'boho'], 'flat ankle boots', { secureFoot: true }),
  k('heelboots', 'Heeled ankle boots', 'shoes', 4, 3, 1, false, 'structured', ['edgy', 'classic'], 'heeled ankle boots'),
  k('loafers', 'Loafers', 'shoes', 3, 1, 2, true, 'structured', ['classic', 'minimal'], 'loafers', { secureFoot: true }),
  k('ballet', 'Ballet flats', 'shoes', 3, 1, 2, true, 'fitted', ['romantic', 'classic'], 'ballet flats'),
  k('sandals', 'Sandals', 'shoes', 2, 1, 2, false, 'relaxed', ['boho', 'natural'], 'sandals'),
  k('heels', 'Heels', 'shoes', 5, 1, 1, false, 'fitted', ['romantic', 'classic', 'edgy'], 'heeled sandals'),
  k('wellies', 'Walking boots / wellies', 'shoes', 1, 3, 2, true, 'relaxed', ['natural'], 'waterproof walking boots', { secureFoot: true }),
  // bags
  k('tote', 'Tote bag', 'bag', 2, 1, 2, true, 'structured', ['classic', 'minimal'], 'tote bag'),
  k('crossbody', 'Crossbody bag', 'bag', 2, 1, 3, true, 'relaxed', ['natural', 'edgy'], 'crossbody bag'),
  k('backpack', 'Backpack', 'bag', 1, 1, 3, true, 'relaxed', ['natural'], 'backpack'),
  k('clutch', 'Clutch / mini bag', 'bag', 5, 1, 1, false, 'fitted', ['romantic', 'classic'], 'clutch bag'),
  k('beltbag', 'Belt bag', 'bag', 1, 1, 3, true, 'fitted', ['natural', 'edgy'], 'belt bag'),
  // accessories
  k('scarf', 'Scarf', 'accessory', 2, 2, 3, false, 'flowy', ['classic', 'boho'], 'scarf', { loose: true }),
  k('jewellery', 'Statement jewellery', 'accessory', 4, 1, 3, false, 'fitted', ['romantic', 'boho', 'edgy'], 'statement earrings', { loose: true }),
  k('belt', 'Belt', 'accessory', 3, 1, 3, true, 'structured', ['classic', 'edgy'], 'leather belt'),
  k('sunglasses', 'Sunglasses', 'accessory', 2, 1, 3, true, 'structured', ['classic', 'minimal'], 'sunglasses'),
  k('cap', 'Cap / hat', 'accessory', 1, 1, 3, true, 'relaxed', ['natural'], 'cap'),
]

export const kindById = (id: string): KindDef => KINDS.find((x) => x.id === id) ?? KINDS[0]

export const CATEGORIES: { id: Category; label: string; plural: string }[] = [
  { id: 'top', label: 'Top', plural: 'Tops' },
  { id: 'bottom', label: 'Bottom', plural: 'Bottoms' },
  { id: 'dress', label: 'Dress', plural: 'Dresses' },
  { id: 'outer', label: 'Outerwear', plural: 'Outerwear' },
  { id: 'shoes', label: 'Shoes', plural: 'Shoes' },
  { id: 'bag', label: 'Bag', plural: 'Bags' },
  { id: 'accessory', label: 'Accessory', plural: 'Accessories' },
]
