# Mobile Galaxy Experience — Design Spec

**Author:** Malachi Tzuoo (with Claude)
**Date:** 2026-06-03
**Status:** Draft for review
**App:** `galaxy-resume/` (Next.js + React Three Fiber, statically exported)
**Builds on:** `docs/superpowers/specs/2026-06-03-galaxy-resume-design.md`

---

## 1. Summary

The galaxy résumé already ships, but on phones it (a) doesn't run by default — phones fall back to the flat 2D résumé — and (b) when reached via the manual toggle, it renders the desktop HUD shrunk onto a small screen: the bottom control bar wraps into a cramped pile, hints reference keys a phone lacks, and the top bar overflows.

This project makes the **galaxy the default mobile experience** and gives it a **touch-native HUD**: a minimal ☰-menu-only top, a big-thumb `◀ LAND ▶` dock, and a full gesture set (swipe to travel / land / take off). The landed view keeps the current behavior the user likes (planet zooms in, translucent panel floats over it). Plus two polish items: a first-time coach hint and safe-area handling.

### Goals
- Phones boot straight into the galaxy (the centerpiece), with the 2D résumé/PDF as an explicit escape.
- A touch-native, uncramped HUD on small screens; zero keyboard/Shift references.
- Discoverable navigation: gestures **and** visible dock buttons do the same things.
- Keep the desktop experience exactly as-is.

### Non-goals (this round)
- **No mobile perf tuning** (star/comet thinning, DPR cap). Noted as a future follow-up since phones now run the 3D scene.
- **No restyle of the 2D résumé fallback.**
- No new content, no deploy, no new sections. Section set and order are unchanged.

---

## 2. Entry & device policy

### `shouldUse3D` change
Today (`src/lib/capabilities.ts`):
```
if (!c.hasWebGL) return false;
if (c.reducedMotion) return false;
if (c.coarsePointer && c.width < 820) return false;   // ← remove this line
return true;
```
Remove the coarse-pointer/width exclusion. Phones now boot into the galaxy. The two **real** gates remain: no-WebGL → fallback, `prefers-reduced-motion` → fallback. Crawlers/no-JS still get the SSR 2D résumé (unchanged).

### `isCompact` — single source of truth for HUD selection
- Definition: `coarsePointer || viewport width < 768px`.
- Recomputed on resize/orientation change (matchMedia + resize listener), exposed to the React tree so `Scene` can choose `MobileHud` vs `Hud` and so `useTouchGestures` enables only when compact.
- Separate from `shouldUse3D`: a narrow *desktop* window also gets the compact HUD (good), but only true caps push someone to the 2D fallback.

---

## 3. HUD layout (compact)

A new **`MobileHud`** renders when `isCompact`; the existing desktop **`Hud`** is left untouched. `Scene` renders one or the other. The shared `DetailPanel` is reused by both.

### Top — ☰ menu only
- A single ☰ button, top-right, respecting safe-area insets. Nothing else on the canvas top (no identity chip, no résumé button).
- **`MobileMenu`** overlay (approved mockup): a full-screen translucent panel over a dimmed galaxy:
  - **Identity header:** `MALACHI TZUOO` (gradient), subline `LV.26 · SOFTWARE ENGINEER · 🛰 AWS CERTIFIED`. Close ✕ top-right.
  - **Starmap** — `◇ STARMAP — JUMP ANYWHERE`, the six sections as rows (color dot + label + index), current highlighted. Tapping a row = `selectAndLand` (fly + land) and closes the menu.
  - **Escapes:** `📄 Résumé` (→ 2D résumé view, calls the existing `onSkip`) and `⬇ PDF` (links to the exported PDF asset).
  - **Footer hint:** one line — `drag to look · swipe to travel`.
  - Opens on ☰; closes on ✕, tap-away, route to a section, or Escape. While open it is `pointer-events-auto` and traps focus for a11y.

### Bottom — thumb dock
- **`ThumbDock`**: three large touch targets in a single row — `◀` (inward/prev), `LAND` (accent), `▶` (outward/next), respecting bottom safe-area inset.
- Buttons disable at the ends (`◀` at first section, `▶` at last), mirroring desktop nav rules.
- **Removed on mobile:** the keyboard-hint string, the Shift-boost hint, and the V/camera-angle (preset cycle) control. Mobile locks to the current default travel camera angle.
- Hidden (faded + `inert`) while landed, same as desktop, so only the `DetailPanel` shows.

---

## 4. Input / gesture model

A new **`useTouchGestures`** hook (kept separate from the keyboard/drag logic in `useGalaxyControls`), active only when `isCompact`. It interprets a touch/pointer interaction on the canvas and dispatches nav actions.

### Gestures
| Gesture | Action | Nav dispatch |
|---|---|---|
| Quick horizontal flick → | travel next (outward) | `next` |
| Quick horizontal flick ← | travel prev (inward) | `prev` |
| Quick flick up | land focused planet | `land` |
| Quick flick down | take off | `takeOff` |
| Slow drag (any direction) | look around (unchanged) | — (accumulates `motion.yaw/pitch`) |
| Tap a planet mesh | fly + land in one tap | `selectAndLand` |

### Disambiguation (flick vs look-drag)
- A pointer interaction is classified on release: it counts as a **flick** only if travel distance ≥ a distance threshold **and** elapsed time ≤ a time threshold; the dominant axis (|dx| vs |dy|) and sign pick the action. Otherwise it was a **look-drag** and only adjusts yaw/pitch (current behavior).
- Thresholds live in a pure, unit-tested classifier (e.g. `classifyGesture(start, end, dtMs) → 'next' | 'prev' | 'land' | 'takeOff' | 'look'`). Defaults are tunable constants.
- Drag-to-look keeps working during the gesture; a flick may nudge the look slightly before the action fires — acceptable.

### Landed conflict resolution (swipe-down vs panel scroll)
- The `DetailPanel` content scrolls. **While landed, the take-off gesture only fires from a touch that *begins outside* the panel** (i.e., on the planet/background area). Inside the panel, vertical drag = scroll. The `TAKE OFF` button always works regardless.
- While landed, travel/land flicks are disabled (consistent with desktop, which ignores nav keys while landed except take-off).

### Tap model
- On mobile, tapping a planet does `selectAndLand` (one tap → content), consistent with the starmap rows. Implementation branches on `isCompact` rather than relying on the desktop `TOP-DOWN` preset (which mobile no longer exposes).
- Dock buttons remain the discoverable equivalent of every gesture.

---

## 5. Landed panel (mobile)

Keep the behavior the user explicitly likes: **planet zooms in, the translucent `DetailPanel` floats over it** so the planet still glows behind. Mobile-only tweaks to `DetailPanel`:
- Near-full-width with comfortable side margins (it is already `w-[min(440px,92vw)]`); ensure it reads well centered vertically and scrolls within `max-h`.
- `TAKE OFF` button positioned within the thumb zone and clear of the bottom safe-area inset.
- Opacity tuned so the zoomed planet remains visible behind (retain the current translucent treatment).

No bottom-sheet, no full-screen takeover.

---

## 6. Misc polish (user-selected)

### First-time coach hint
- **`CoachHint`**: a one-time, dismissible overlay shown on first compact galaxy load — `swipe to travel · tap a planet to land · drag to look`. Dismiss on tap/× or after first successful navigation; remembered via `localStorage` (e.g. key `galaxy.coach.dismissed`). Never shown again once dismissed. Respects reduced data — pure DOM, no animation dependency.

### Safe-area
- The ☰ button, `MobileMenu`, `ThumbDock`, and `DetailPanel`'s `TAKE OFF` use `env(safe-area-inset-*)` (via Tailwind arbitrary values or a small utility in `globals.css`) so nothing hides under a notch or home-bar. Light landscape sanity check so the dock/menu remain reachable.

---

## 7. Architecture & components

**New:**
- `src/components/hud/MobileHud.tsx` — compact HUD shell; renders `MobileMenu`, `ThumbDock`, `CoachHint`, and the shared `DetailPanel`.
- `src/components/hud/MobileMenu.tsx` — the ☰ overlay.
- `src/components/hud/ThumbDock.tsx` — bottom `◀ LAND ▶` dock.
- `src/components/hud/CoachHint.tsx` — first-time hint.
- `src/hooks/useTouchGestures.ts` — touch interpretation → nav dispatch.
- `src/lib/gesture.ts` — pure `classifyGesture(...)` + threshold constants.

**Edited:**
- `src/lib/capabilities.ts` — `shouldUse3D` change; add an `isCompact` helper / matchMedia signal.
- `src/components/three/Scene.tsx` — choose `MobileHud` vs `Hud`; wire `useTouchGestures` when compact.
- `src/hooks/useGalaxyControls.ts` — branch tap behavior on compact (`selectAndLand`); keep keyboard/drag as-is for desktop.
- `src/components/hud/DetailPanel.tsx` — mobile margin/opacity/safe-area tweaks.
- `src/app/globals.css` — safe-area utility if needed.
- `src/components/GalaxyExperience.tsx` — only if `isCompact` needs threading from the entry point.

**Boundaries:** desktop `Hud` and its children are not modified (other than the shared `DetailPanel`'s additive mobile tweaks). Gesture math is isolated in `gesture.ts` so it is testable without a DOM. `isCompact` is the only new cross-cutting signal.

---

## 8. Testing

Matches the existing Vitest suite (60 tests today; pure logic + component render/interaction tests).

- **`gesture.ts`** — unit tests for `classifyGesture`: horizontal/vertical flicks above threshold map to next/prev/land/takeOff; sub-threshold or slow drags map to `look`; diagonal resolves to dominant axis; boundary values.
- **`capabilities.ts`** — `shouldUse3D` now returns `true` for coarse+narrow with WebGL & motion allowed; still `false` for no-WebGL and reduced-motion. `isCompact` true for coarse pointer or width < 768.
- **`ThumbDock`** — renders three controls; `◀` disabled at first, `▶` disabled at last; click dispatches `prev`/`land`/`next`.
- **`MobileMenu`** — renders identity + six starmap rows + résumé/PDF; row click dispatches `selectAndLand` and closes; ✕/Escape close; focus handling.
- **`CoachHint`** — shows when `localStorage` flag absent; hidden after dismiss; sets the flag.
- **`MobileHud`** — renders dock + ☰ when not landed; hides dock and shows `DetailPanel` when landed.
- **`useTouchGestures`** — landed take-off only fires from touches starting outside the panel; flicks disabled while landed; dispatches correct actions when compact, no-ops when not.

Gates (unchanged): `npm run test:run`, `npm run lint`, `npm run build` (static export) all green.

---

## 9. Open follow-ups (out of scope, tracked)
- Mobile performance pass (DPR cap, fewer stars/comets/galaxies on phones).
- 2D résumé fallback restyle for small screens.
- Pending content from prior spec (Stock Trading Platform / Financial Planner blurbs, Tallio URL) and deploy — unaffected by this round.
