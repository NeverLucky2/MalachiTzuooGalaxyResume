# Onboarding & Navigation Polish — Design

**Date:** 2026-06-04
**Branch:** `onboarding-polish`
**Status:** Approved (2026-06-04)

## Background

A friend stress-tested the live galaxy site and surfaced four issues. This round
addresses all four, plus the shared pieces they require. The galaxy app lives in
`galaxy-resume/` (Next.js 16 + React 19 + R3F 9 + Tailwind + Vitest).

Friend's findings:
1. **Mini-game back button is invisible on mobile** — during play, users can't
   find the way out and feel stuck until they die into the game-over screen.
2. **The ship-tap-to-launch is a surprise** — a delayed (7s) hint isn't enough;
   the site needs an up-front walkthrough. The friend also kept *accidentally*
   tapping the ship while aiming for a nearby planet, which was frustrating.
3. **Take Off button is easy to miss** — first-time landers don't realize how to
   get back; it should sit top-left with a one-time tip.
4. **Camera drag is stuttery on mobile** — a swipe nudges the camera, then stops.
   Desktop drag is smooth.

## Goals

- Replace the delayed mini-game hint with a short, guided **opening walkthrough**.
- Let users **disable ship-tap launching** so accidental taps stop being painful.
- Make "go back" **consistent and obvious**: top-left everywhere (landed + game).
- Make the **name tag** a fast path to the résumé.
- Make **mobile camera drag smooth**.

## Non-goals

- No new mini-games or gameplay changes.
- No content/résumé edits.
- No redesign of the 2D fallback.
- No change to the planet set, orbits, or flight model.

---

## Feature A — Opening walkthrough (spotlight tour)

A new `Walkthrough` component replaces the current `MinigameHint` (7s nudge) and
`CoachHint` ("drag to look…"). It plays a **spotlight tour**: the scene dims and
each step rings the real control with a tooltip card (step text, progress dots,
**Skip** / **Back** / **Next**).

**Trigger & persistence**
- Plays once, automatically, on first galaxy entry.
- Persisted complete/skip flag: `localStorage['galaxy.tour.done'] = '1'`.
- **Replayable** via "↻ Replay walkthrough" (mobile ☰ menu / desktop ⚙ popover),
  which clears the flag and restarts the tour.
- Shown on **both** mobile and desktop, adapted to each device's controls.

**Steps** (user's wording; "drag to look around" folded into the step-1 intro):

| # | Teaches | Mobile target | Desktop target |
|---|---------|---------------|----------------|
| 1 | Land on a planet | LAND dock button — "Tap a planet to land" | LAND bar button — "Click a planet (or Enter) to land" |
| 2 | Fly between planets | ◀ ▶ thumb dock | ◀ INWARD / OUTWARD ▶ |
| 3 | Jump anywhere quickly | ☰ menu button | starmap legend (top-right) |
| 4 | View the résumé | name tag (top-left) | name tag (top-left) |
| 5 | Hidden mini-game (+ off note) | the ship | the ship |

**Spotlight mechanics**
- Steps 1–4 anchor on a real DOM element. The tour reads the target's bounding
  box (via a ref or `data-tour` id + `getBoundingClientRect`) and draws a dim
  overlay with a transparent "cutout" rectangle (4 surrounding panels, or a
  box-shadow ring) plus the tooltip positioned next to it.
- **Step 5 is the exception**: the ship is a 3D object in the canvas, not a DOM
  node, so it renders a centered tip card (🚀 + the note that ship-tap can be
  turned off) with no precise ring. (Future enhancement: project the ship's world
  position to screen and ring it — out of scope for v1.)
- Re-measure on resize/scroll so rings stay aligned.

**Removed:** `MinigameHint.tsx`, `CoachHint.tsx`, and the `galaxy.minigame.discovered`
gating in `GalaxyExperience` that only existed to suppress the old hint.

---

## Feature B — Ship-tap toggle (accidental-launch fix)

New persisted setting controlling whether tapping the ship launches the mini-game.

- Key: `localStorage['galaxy.ship.minigame']`; **default ON** (absent = on).
- When **OFF**, the ship's invisible hit-sphere `onClick` is a no-op (or the
  hit-sphere isn't rendered), so taps meant for a nearby planet never launch.
- Setting is read into state in `GalaxyExperience` and passed down so both the
  launch wiring (`Ship`/`Scene`) and the menus reflect it.

**Where it lives**
- **Mobile:** a "Settings" block in the existing ☰ `MobileMenu` — a toggle row
  ("🚀 Ship mini-game  [on/off]") plus "↻ Replay walkthrough".
- **Desktop:** a new small **⚙ button** in the top bar opening a compact popover
  with the same toggle + replay (desktop has no hamburger today).

Tour step 5 references the toggle ("…you can turn this off in the menu / Settings").

---

## Feature C — Take Off → top-left + first-land tip

- In `DetailPanel`, move the **🚀 TAKE OFF** button from bottom-left to
  **top-left** (keep the magenta gradient style). The name tag hides on landing,
  so the corner is free.
- One-time **first-land tip** near the button: "Done exploring? Take off to head
  back to space." Persisted `localStorage['galaxy.takeoff.tipSeen'] = '1'`; shown
  only on the user's first-ever landing, dismiss on take-off or via the tip.
- Applies to mobile and desktop.

---

## Feature D — Name tag → résumé

- Make the name tag a button that calls the existing `showResume`/`onSkip` path,
  on **both**:
  - Mobile `IdentityChip` — currently `pointer-events-none`; becomes an
    interactive top-left button. It's a small fixed DOM element above the canvas,
    so it does not start a drag-to-look gesture.
  - Desktop `Hud` name span — wrap the "MALACHI TZUOO" name in a button.
- Keep existing résumé entry points (desktop "📄 RESUME VIEW", mobile menu
  "📄 Resume") as escape hatches.
- Add an accessible label/title ("View résumé").

---

## Feature E — Mobile camera drag fix

**Root cause:** the galaxy `<Canvas>` (in `Scene.tsx`) has no `touch-action: none`.
On touch devices the browser claims the drag as a scroll/pan and fires
`pointercancel` mid-gesture, so `useGalaxyControls`' free-look gets a nudge then
stops. Desktop mouse input isn't subject to `touch-action`, hence the smoothness
gap.

**Fix (in `Scene.tsx` / `useGalaxyControls.ts`):**
- Set `touch-action: none` on the canvas (Tailwind `touch-none` on the `<Canvas>`
  or its wrapper; the mini-game overlay already does this).
- On `pointerdown`, `setPointerCapture` so move events keep flowing to the same
  target through the gesture.
- Add a `pointercancel` (and keep `pointerup`) handler that cleanly ends the drag.

The drag axis signs / sensitivity are feel-based and were never user-verified, so
this needs a quick manual check on a real phone; flip signs if a direction feels
inverted (per the existing CameraRig note).

---

## Feature F — Mini-game back button visibility

In `GameHud.tsx`:
- Replace the "✕ Exit" text pill with a **round ← icon** button, top-left
  (user's choice — keeps the run distraction-free), high-contrast with a solid
  background, and a safe top offset (`max(env(safe-area-inset-top), …)`).
- Ensure the `AsteroidGame` overlay sizes to the **dynamic viewport** (`100dvh`/
  `100dvw` or equivalent) so the control isn't hidden under the mobile address bar.
- The menu and game-over screens keep their explicit exit/back options.

---

## Architecture & file impact

New:
- `src/components/hud/Walkthrough.tsx` — the spotlight tour (steps, spotlight,
  tooltip, persistence). Pure step data extracted to a small module if it grows
  (`src/lib/walkthrough.ts` for the step list + `useTourTarget` helper).
- A small settings surface: extend `MobileMenu` and add a desktop `SettingsMenu`
  (⚙ popover) — or a shared `SettingsControls` used by both.
- Persistence helpers (a tiny `src/lib/prefs.ts`) for the boolean flags so the
  `localStorage` reads/writes are centralized and testable.

Edited:
- `GalaxyExperience.tsx` — own tour visibility + ship-toggle state; drop the
  discovered/MinigameHint wiring; pass `shipMinigameEnabled` down.
- `Scene.tsx` — `touch-none` + pointer capture/cancel; thread the ship toggle.
- `Ship.tsx` — gate the launch hit-sphere on the toggle.
- `useGalaxyControls.ts` — pointer capture + `pointercancel`.
- `DetailPanel.tsx` — Take Off to top-left; first-land tip.
- `IdentityChip.tsx` / `Hud.tsx` — name tag → résumé.
- `MobileMenu.tsx` — Settings block (toggle + replay).
- `GameHud.tsx` — round ← back button; `AsteroidGame.tsx` — dynamic-viewport sizing.
- Remove `MinigameHint.tsx`, `CoachHint.tsx` (+ their tests).

## Testing

Component tests (Vitest + RTL), following existing patterns (`fireEvent.click`,
fake timers for delays, lazy `useState` initializers — no setState-in-effect):
- Walkthrough: advances Next/Back, Skip ends it, persists `galaxy.tour.done`,
  doesn't re-show when done, replay restarts it, renders the right step targets.
- Ship toggle: launch fires when ON, is suppressed when OFF; menu toggle flips
  and persists the flag.
- Name tag → résumé on both `IdentityChip` and `Hud`.
- Take-off tip shows once and persists `galaxy.takeoff.tipSeen`; Take Off renders
  top-left.
- Mini-game back button renders and calls `onExit`.
- Camera fix is hard to unit-test (touch-action is CSS); cover the
  `pointercancel`/capture handler wiring where practical; verify by manual device
  check.

Gates (must stay green): `npm run test:run`, `npm run lint`, `npm run build`
(static export to `out/`).

## Open / deferred

- Step 5 ringing the ship (3D→screen projection) — deferred; v1 uses a tip card.
- Camera drag axis sign/sensitivity — confirm by manual phone test.
- Mini-game address-bar overlap: if `100dvh` proves insufficient on a target
  browser, revisit with the VisualViewport API.
