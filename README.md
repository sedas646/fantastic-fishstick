# Style Studio

A personal-stylist web app (React + TypeScript + Vite). Everything runs in the browser; data is stored in `localStorage` only.

- **Analysis** – quiz → 12-style colour season (with best colours, neutrals, colours to avoid), style archetypes, and a "feminine essence" (yin–yang) guide to necklines, fabrics and silhouettes.
- **Wardrobe** – add pieces by type, colour, dressiness and an optional photo (resized, kept on-device).
- **Looks** – pick an activity (WFH, dog walk, shopping, indoor karting, going out, …) and the weather; the engine builds outfits from your wardrobe, respecting activity rules (e.g. no skirts or open shoes for karting).
- **Capsule** – picks the smallest set of pieces that covers your weighted lifestyle and shows the looks it makes.
- **Shopping** – when something is missing, suggests the specific piece + colour that raises your looks most, with search links to your chosen retailers.

```
npm install
npm run dev
npm run build
```

Engine: `src/lib/analysis.ts` (colour/style/essence), `src/lib/outfits.ts` (scoring, capsule, gap analysis), `src/lib/shopping.ts` (links). Garment rules live in `src/data/`.
