# Galaxy Résumé — Malachi Tzuoo

An interactive **3D solar-system résumé**: pilot a spaceship between planets, where each planet is a résumé section (About, Experience, Projects, Skills, Résumé, Contact). Built with **Next.js (App Router) + React Three Fiber + TypeScript + Tailwind**. Ships with a fast, fully accessible **2D résumé fallback** for reduced-motion / no-WebGL / mobile users and for search engines.

## Two views
- **Galaxy view** — the 3D experience (fly with ← →, hold **Shift** to boost, **Enter/↑** to land, **↓/Esc** to take off, **V** to cycle camera presets, drag to look, click a planet to fly to it, starmap to jump).
- **Résumé view** — a clean, semantic 2D résumé (the **📄 Résumé view** button, or automatically for `prefers-reduced-motion` / no-WebGL / small screens). A **🚀 Galaxy view** button returns to 3D when supported.

Exactly one view shows at a time; the 2D résumé is always in the server-rendered HTML (crawlable) and just hidden under the galaxy.

## Develop
```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest (watch)
npm run test:run   # Vitest (once)
npm run lint       # ESLint (clean)
npm run build      # production build → static out/
```

## Editing your content
- **Section copy** — `src/data/content.ts`. Each section is an array of typed `ContentBlock`s (`paragraph`, `cards`, `timeline`, `stats`, `projects`, `links`, `download`). The same data renders in both the 3D detail panels and the 2D résumé, so you only edit it once. The two flagship projects (ClaudeProphetAndFriends, Tallio) and their GitHub links live in the `proj` section.
- **Planets/layout** — `src/data/planets.ts`: per-planet `orbitRadius`, `size`, `speed`, `color`, `glow`, `style` (`earth`/`gas`/`lava`/`ice`/`rock`), and `ring`/`moon` flags. Order is inner→outer (you start at the innermost and travel outward).
- **Résumé PDF** — `public/assets/Tzuoo_Malachi_Resume_.pdf` (the Résumé section links to it).

## AI-generated planet art (optional)
Planets render with **procedural canvas textures** by default. The data model has an `art` slot per planet (`src/data/types.ts`): `art?: { texture?; normal?; clouds?; glb? }`. To use a custom image, drop an **equirectangular** texture at `public/planets/<id>.jpg` (or `.png`/`.webp`) and set `art: { texture: '/planets/<id>.jpg' }` on that planet in `planets.ts`.

> **TODO (not yet wired):** `Planet.tsx` currently always uses the procedural texture. To honor `art.texture`, add a small hookup in `Planet.tsx` that, when `planet.art?.texture` is set, loads it (e.g. drei `useTexture` / `THREE.TextureLoader`, `colorSpace = SRGBColorSpace`) and uses it as the sphere `map`/`emissiveMap`, falling back to the procedural canvas when absent. (Same idea for `clouds`/`normal`, and `glb` via `GLTFLoader` for a full model.)

## Deploy
The app is configured for a **fully static export** (`output: 'export'` in `next.config.ts`) — `npm run build` emits a static **`out/`** directory with no Node server required. Deploy `out/` to **AWS S3** (or any static host: Netlify, Vercel, GitHub Pages, Amplify). The 3D scene is a client-only dynamic import, so the static HTML stays light and the heavy three.js bundle loads on demand.

## Tech
Next.js 16 · React 19 · React Three Fiber / three.js · @react-three/drei · Tailwind CSS · TypeScript · Vitest + Testing Library.
