# Galaxy Résumé — Design Spec

**Author:** Malachi Tzuoo (with Claude)
**Date:** 2026-06-03
**Status:** Draft for review
**Reference prototype:** `.superpowers/brainstorm/362-1780458394/content/galaxy-3d-v17.html` (latest, served via the brainstorm visual-companion). 2D exploratory mockups (superseded) live alongside it.

---

## 1. Summary

Rebuild Malachi's résumé website as an interactive **3D solar system** that the visitor explores by piloting a spaceship between planets, where **each planet is a résumé section**. Built fresh in **Next.js + React Three Fiber**. The experience is a genuine WebGL fly-through (camera travels through space, parallax, ship co-orbits the focused planet), with a **recruiter/accessibility fallback** so the site never blocks someone who just wants the facts or the PDF.

This is a full rebuild; the old tbakerx template (`MalachiResumeWebsite/`) is retired (content/assets are salvaged).

### Goals
- A memorable, distinctive portfolio piece that signals strong front-end/3D engineering.
- Still gets a recruiter to the content (and the PDF) in seconds, on any device.
- Data-driven so planets, art, and copy are easy to edit; AI-generated planet art drops in later.

### Non-goals (YAGNI)
- No CMS, no backend, no auth, no analytics dashboards.
- No multiplayer / physics simulation. Orbits are decorative, not an n-body sim.
- No in-browser 3D editing tools.

---

## 2. The experience (as prototyped)

A central **sun** with **six planets** orbiting on rings. The visitor's **spaceship** orbits the currently-focused planet. Travelling selects the next/previous planet; the camera smoothly flies across the system (parallax on sun + other worlds) and the ship glides to the new planet, nose pointed along its path. **Landing** flies the camera down to the planet (it fills the view) and a **detail panel** slides in with that section's content. **Taking off** zooms back out along the same camera angle.

### Sections = planets (inner → outer; you start at the innermost and travel outward)
1. **About** — home world (earth-like), closest to the star
2. **Experience** — ringed gas giant
3. **Projects** — gas giant with an orbiting moon
4. **Skills** — lava world
5. **Résumé / Certs** — ice world (holds the AWS cert + PDF download)
6. **Contact** — rocky world, the outer frontier

Résumé order is preserved as you travel outward. The order/section set is **confirmed for v1** (revisit only if content demands it).

### Navigation & controls
- **← / →** (or **OUTWARD / INWARD** buttons): fly to the next / previous planet.
- **Enter / ↑** (or **LAND**): land on the focused planet (opens detail panel).
- **↓ / Esc** (or **TAKE OFF**): leave the planet, zoom back out.
- **Hold Shift**: boost travel speed (cinematic-slow by default). On-screen hint "⇧ HOLD SHIFT — BOOST SPEED" above the OUTWARD/INWARD buttons.
- **Click a planet**: in normal views, fly to it (or land if it's the focused one); in TOP-DOWN, click flies down and **lands** on it.
- **Drag**: free-look (small yaw/pitch offset on top of the active preset).
- **Starmap legend** (top-right): jump straight to any section (instant access).
- **Skip to résumé / PDF** link (bottom-right): the recruiter escape hatch → opens the PDF / fallback.
- **Camera-angle button** ("👁 …", or **V**), labeled **CAMERA ANGLE · V** above it, cycles presets (below).

### Camera presets
- **SUN LEFT** *(default)* — far, zoomed-out, wide composition with the **sun hanging to the left** behind the planet; bigger ship.
- **LIT FACE** — closer head-on view of the sunlit face; normal ship size.
- **TOP-DOWN** — high overhead view of the **whole system**; click a planet to dive in & land; bigger ship.

Switching presets transitions smoothly and resets free-look drag. Landing uses the *current* preset's angle (just closer) so take-off only changes distance, never the angle.

### Motion details (the feel we tuned)
- **Travel = smooth "fly-over"** at a steady framing distance (translate, not a stomach-drop zoom). Default slow; Shift = fast.
- **Ship** noses along its velocity vector; flies straight into its live orbit point and **merges into orbit with no snap**; scales down small when landed.
- **Planets** are small/proportional, self-lit enough to read surface detail on the dark side, slowly rotating; gaps grow toward the outer worlds (solar-system-like).
- **Sun** is a solid disc with a **modest warm glow** (a contained corona, sized so it reads as a glowing star but does not flood the screen when flying near it).
- **Celestial backdrop:** a twinkling 3D starfield, **~13 distant galaxy sprites** (faint, additive, random orientation/tint, spread so a couple are always in frame in any view), and **~4 roaming comets** (glowing head + trailing light streak) that drift across the far field and respawn on new paths.
- **Planet brightness:** planets are intentionally **slightly self-lit** (emissive map + raised ambient) so surface detail stays readable even on the side facing away from the sun — readability over physical realism.

---

## 3. Visual / art direction

- **Palette:** neon on deep space — cyan `#21e6ff`, magenta `#ff3df0`, ink `#e7f6ff`; background deep navy/black with faint nebula gradients.
- **Type:** `Orbitron` (display/HUD), `Inter` (body). Self-host the fonts in the real build (don't depend on Google Fonts CDN).
- **Per-planet identity:** distinct base color + glow, surface style (earth / gas / lava / ice / rock), optional ring (Experience) and orbiting moon (Projects), plus an atmosphere glow shell.
- **Planet art is pluggable** (see Data Model): default = procedural canvas textures (shipped in prototype); upgrade path = **AI-generated equirectangular textures** (and optional normal/cloud maps) dropped in `public/planets/`, or an AI-generated `.glb` for the ship. Procedural stays as the fallback/default.
- **HUD/panels:** glassy dark neon cards (backdrop blur), consistent with the prototype.

---

## 4. Information architecture & data model

Everything is driven by a typed `planets` config so content, layout, art, and order are edited in one place.

```ts
type PlanetStyle = 'earth' | 'gas' | 'lava' | 'ice' | 'rock';

interface Planet {
  id: 'about' | 'xp' | 'proj' | 'skills' | 'resume' | 'contact';
  label: string;            // "ABOUT"
  subtitle: string;         // small caption in the panel header
  orbitRadius: number;      // R (inner→outer)
  size: number;             // sphere radius
  speed: number;            // orbital angular speed
  color: number;            // base/glow color
  style: PlanetStyle;       // procedural texture style
  ring?: boolean;           // Saturn ring
  moon?: boolean;           // orbiting moon
  art?: {                   // optional overrides for procedural default
    texture?: string;       // '/planets/about.jpg' (equirectangular)
    normal?: string;
    clouds?: string;
    glb?: string;           // full model override
  };
  content: ReactNode | ContentBlock[];  // panel body
}
```

Content blocks are simple, reusable primitives rendered into the detail panel (and reused verbatim by the 2D fallback): `paragraph`, `cardGrid` (label/value cards), `timeline` (role / meta / bullets), `statBars` (skill bars), `links`, `download` (PDF button).

**Assets:** `public/planets/` (textures/models), `public/assets/Tzuoo_Malachi_Resume_.pdf` (résumé download — already exists).

---

## 5. Architecture (Next.js + React Three Fiber)

Fresh app: **Next.js (App Router) + TypeScript + Tailwind + React Three Fiber (three.js)**.

### Rendering strategy
- The galaxy is a **client component**, dynamically imported with `ssr: false` (WebGL is client-only). The page shell, `<head>`/SEO, and the **DOM content of every section** render server-side so the résumé is crawlable and works without JS.
- The 3D `<Canvas>` mounts on top; the same section content powers both the in-world detail panels and the 2D fallback (single source of truth).

### Component breakdown (each small, single-purpose, independently testable)
- `GalaxyExperience` — top-level client wrapper; decides 3D vs fallback (capability + preference checks); owns navigation state.
- `Scene` — R3F `<Canvas>`, lights, starfield, post nothing-heavy.
- `Sun` — sphere + thin halo sprite.
- `Planet` — sphere (procedural/`art` material), atmosphere shell, optional ring/moon, slow spin; exposes its live position for the camera/labels.
- `Ship` — low-poly winged craft; orbit + travel + velocity-aligned orientation + per-preset scale.
- `CameraRig` — preset framing (SUN LEFT / LIT FACE / TOP-DOWN), smooth travel lerp, landing pan-in, free-look offset, Shift-boost.
- `PlanetLabels` — DOM labels projected under each planet (hidden when landed).
- `HUD` — name/level/cert chips, starmap legend, controls bar, speed hint, camera-angle button, skip link.
- `DetailPanel` — section content overlay + TAKE OFF.
- `FallbackResume` — accessible 2D/text version (see §6).
- `usePlanetNavigation` — selection/landed/preset state + keyboard/pointer handlers (decoupled from rendering).
- `planets.ts` / `content.tsx` — the data model from §4.

### State
Local React state (small): `current`, `landed`, `preset`, `boost`, travel progress. No global store needed for v1. The animation loop reads state via refs to avoid re-renders.

---

## 6. Accessibility & recruiter fallback (required)

The 3D scene must never trap or exclude anyone. Provide a **fast 2D/text version** with the same content, shown when any of these is true:
- `prefers-reduced-motion: reduce`,
- no/blocked **WebGL**,
- small/touch viewport below a threshold (mobile gets the fallback by default, with an optional "enter the galaxy" opt-in),
- explicit **"Skip to résumé"** toggle.

Fallback = a clean, fast, scrollable résumé (the section content rendered as normal DOM) + the **PDF download**. Additional a11y:
- Section content is real semantic HTML (headings, lists, links) → SEO + screen readers.
- Keyboard: all navigation operable without a mouse (already true in the prototype); visible focus states; the fallback is fully keyboard/scroll friendly.
- Honor reduced-motion in the 3D path too (dampen idle orbital motion if 3D is force-entered).
- Color contrast checked for the neon palette on text surfaces.

---

## 7. Performance

- Dynamic-import three/R3F; code-split so the fallback ships almost no JS.
- `dpr` capped (≤2), antialias on, modest geometry (segments tuned), no heavy post-processing.
- Reuse geometries/materials; generate procedural textures once; lazy/Suspense loading with a themed loader.
- Pause/throttle the render loop when the tab is hidden.
- Budget: smooth 60fps on a typical laptop; graceful degrade (auto-fallback) on weak/no-GPU.

---

## 8. Content updates (from the new résumé PDF)

- **Experience:** Logistics Coordinator (Bensenville, IL · Nov 2024–present); Front-End Dev Intern (remote · Jun–Nov 2024); Ruby Full-Stack (remote · Mar–Jul 2023). (Old site wrongly showed Astrite.gg as current.)
- **Projects:** **Stock Trading Platform** *(NEW — details TBD)*, **Financial Planner** *(NEW — details TBD)*, GenAI Dev Practice, Astrite.gg, Revature Blogger, Mario Screaming Bot. **Airline Shortest Path removed** (also remove from the résumé PDF).
- **Skills:** Python, JS/TS, React, AWS, GenAI/LLMs/LangChain, CI/CD/Docker (bars).
- **Résumé/Certs:** AWS Certified Developer – Associate (2024–2027) + PDF download.
- **Contact:** email `mtzuoo@gmail.com`, GitHub `NeverLucky2`, LinkedIn `malachi-tzuoo-depaul`, Chicago, IL.

---

## 9. Hosting / deploy

- Static-friendly Next.js (the galaxy page is a client component; the shell can be statically generated). Continue hosting on the current **AWS S3** static setup (or equivalent). Ensure the PDF and `public/planets/` assets are deployed.

---

## 10. Open questions (to resolve during/after spec review)

1. **Stock Trading Platform** & **Financial Planner**: one-liner each — what they do, stack, status, links/repos. (Placeholdered for now.)
2. AI **planet art**: generate now or ship procedural for v1 and swap later? (Spec supports both.)
3. Mobile policy: fallback-by-default with opt-in galaxy, or attempt 3D on capable phones?
4. Keep the playful HUD flavor ("LV.25", "CLASS · SOFTWARE ENGINEER") or tone it down for recruiters?
5. Custom domain, or keep current hosting URL?

---

## 11. Milestones (feeds the implementation plan)

1. Scaffold fresh Next.js + TS + Tailwind + R3F; data model + content ported.
2. Scene: sun, starfield, planets (procedural), labels.
3. Ship + CameraRig: travel, presets, landing/takeoff, boost, free-look.
4. HUD: legend, controls, detail panels, skip link.
5. Accessibility/fallback (2D résumé, reduced-motion, no-WebGL, mobile) + SEO.
6. Performance pass + polish; deploy.
