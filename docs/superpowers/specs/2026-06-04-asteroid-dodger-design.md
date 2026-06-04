# Asteroid Dodger Minigame — Design Spec

**Author:** Malachi Tzuoo (with Claude)
**Date:** 2026-06-04
**Status:** Draft for review
**App:** `galaxy-resume/` (Next.js + React Three Fiber, statically exported)
**Builds on:** `docs/superpowers/specs/2026-06-03-galaxy-resume-design.md`

---

## 1. Summary

A hidden **easter-egg arcade minigame**, launched by clicking the ship in the galaxy. It's a cinematic 3D **asteroid-dodger**: an angled 3/4 camera, the player's ship sweeps diagonally, and asteroids stream in forming walls with navigable gaps you thread by **steering** the ship — finger-drag on mobile, mouse-follow on desktop. **One hit ends the run** — you chase your best score. A start screen offers an **Easy / Normal / Hard** difficulty picker. A **fast-follow** phase adds a **cosmetic ship skin** unlocked at a score threshold.

This is the first of two planned minigames (the sun game is a separate later round).

### Goals
- A polished, self-contained "one-more-try" minigame that rewards exploring the galaxy.
- Reuses the existing R3F stack and ship model; **fully isolated** from the galaxy so it can't destabilize it.
- Works on mobile (touch drag) and desktop (mouse); WebGL-only by nature.

### Non-goals
- **The sun minigame** — its own brainstorm round.
- **Gameplay-affecting upgrades** (shields, handling boosts) — the only reward is cosmetic.
- **Audio/SFX, haptics, online leaderboards, multiplayer** — possible future follow-ups.
- No changes to résumé content, sections, or the 2D fallback.

### Phasing
- **Phase 1 (core, ship this):** launch trigger, overlay shell, camera, drag controls, wave/gap spawning, difficulty picker, one-hit + best-score, exit flow.
- **Phase 2 (fast-follow):** cosmetic skin unlock + selector. Built only after Phase 1 is green.

---

## 2. Launch & lifecycle (the easter egg)

- **Trigger:** an **invisible, enlarged hit-sphere** parented to the galaxy ship (transparent mesh, radius a few world units so it's tappable on a phone even as the ship orbits). Its `onClick` opens the minigame. No visible button — it stays a discoverable easter egg. Desktop shows a pointer cursor on hover.
- The hit-sphere lives as a child of the `Ship` group so it tracks the ship's live position. Its handler calls `stopPropagation()` so the click does **not** also start a free-look drag (the `Canvas` has a global `onPointerDown`). It fires on a click (down+up without a meaningful drag), not while dragging to look.
- **State owner:** `GalaxyExperience` holds `minigameOpen`. `openMinigame()` sets it true; while open it renders `<AsteroidGame>` as a fixed full-screen overlay **above** the galaxy and **pauses the galaxy** (a new `paused` prop on `Scene` sets its `frameloop` to `'never'`) to save GPU/battery.
- **Exit:** a back/✕ button and **Esc** (desktop) call `onExit` → close the overlay and resume the galaxy. The galaxy's nav state is untouched, so the player returns exactly where they were.
- **WebGL-only:** the ship only exists in the 3D galaxy (reduced-motion / no-WebGL users are already on the 2D résumé), so the minigame needs no separate 2D fallback.

---

## 3. Camera, world & motion

- The flight lane runs along **−Z**; asteroids travel toward **+Z** (toward the player/camera). The camera sits **above and to one side**, looking down the lane — the cinematic **angled 3/4** view chosen in brainstorming.
- The player's ship flies near the camera end, free to move on the **X/Y play-plane** within clamped bounds; it noses slightly into its motion for a dynamic, diagonal feel.
- Asteroids spawn far down-lane, advance at the current speed, and are **recycled** once they pass the camera plane.
- **Background:** a starfield (reuse `Starfield` or a lighter variant) plus subtle speed streaks for a sense of motion. Kept deliberately light for mobile.

---

## 4. Controls

- A pointer interaction (touch drag / mouse move) over the canvas is converted to **normalized device coords → a target point on the play-plane**. The ship **eases toward** that target each frame (a lerp factor gives weighty, cinematic lag rather than instant snapping). The target is **clamped to the play bounds** so the ship can't leave the screen.
- No on-screen joystick. A one-line hint ("drag to fly") shows at the start of a run and fades on first movement.

---

## 5. Gameplay & difficulty

- **Wave/gap spawning:** each wave is a wall of asteroids across the lane with **one navigable gap** at a varying lateral position; the player threads the gap. A pure `spawn.ts` builds wave specs from elapsed time / score + difficulty + a **seeded RNG** (deterministic, so it's unit-testable).
- **Ramp:** over a run, gaps narrow, waves arrive faster, and approach speed rises — each within difficulty-specific bounds.
- **Difficulty presets** (`difficulty.ts`): **Easy / Normal / Hard** set base spawn interval, base gap width, base approach speed, and ramp rates. Picked on the start menu and **re-pickable from the game-over card**.
- **Asteroids:** low-poly icosahedra with small random rotation/scale, drawn via a single **InstancedMesh**; a hard cap (~40) with a recycle pool keeps it smooth on phones.

---

## 6. Fail & score

- **Collision:** each frame, test the ship's hit-sphere against active asteroids (`collision.ts`, sphere–sphere, O(n) with small n). The first overlap → **game over**.
- **Score:** climbs with **distance survived** (elapsed × speed), shown as an integer. The **best run** is persisted to `localStorage` via a thin storage wrapper (try/catch, failures swallowed — same pattern as `CoachHint`).
- **Game-over card:** final score + best, **Retry** (same difficulty), **Change difficulty** (→ menu), **Exit** (→ galaxy).

---

## 7. Phase 2 — cosmetic skin (fast-follow)

- **Unlock:** when the best score crosses a threshold (default target ~**1500**, tuned during the build), a cosmetic skin unlocks. Unlocked skins persist in `localStorage`.
- **Selector:** once ≥1 alternate skin is unlocked, the start menu shows a small skin picker; the choice persists and applies a different ship **material/color**. **Purely cosmetic — no gameplay effect.**
- Implemented only **after Phase 1 ships green**, as later tasks on the same branch.

---

## 8. Architecture & components

New UI module `src/components/minigame/` + pure logic in `src/lib/minigame/`.

**New (components):**
- `AsteroidGame.tsx` — the overlay shell and **game state machine** (reducer: `phase 'menu' | 'playing' | 'over'`, `difficulty`, `score`, `best`); renders `GameScene` (its own `<Canvas>`) + `GameHud`; owns Esc/exit.
- `GameScene.tsx` — the R3F scene: angled camera, lighting, starfield, `PlayerShip`, `Asteroids`; hosts the engine.
- `PlayerShip.tsx` — the player's ship, reusing the shared ship model.
- `Asteroids.tsx` — an `InstancedMesh` driven by the engine's live positions.
- `GameHud.tsx` — DOM overlay: start menu (difficulty), live score/best, game-over card, back/✕.
- `useGameEngine.ts` — per-frame simulation via refs + `useFrame` (spawn, advance, pointer→target, collide, score); emits `onGameOver`. No per-frame React re-renders.

**New (pure logic, unit-tested):**
- `src/lib/minigame/difficulty.ts` — presets + ramp curve.
- `src/lib/minigame/spawn.ts` — wave/gap generation (seeded RNG).
- `src/lib/minigame/collision.ts` — sphere–sphere test.
- `src/lib/minigame/score.ts` — scoring + best-run storage wrapper.

**Edited:**
- `src/components/GalaxyExperience.tsx` — `minigameOpen` state, `openMinigame`/`onExit`, render the overlay, pass `paused` to `Scene`.
- `src/components/three/Scene.tsx` — accept a `paused` prop (`frameloop` → `'never'` when paused) and thread an `onLaunchMinigame` callback to the ship.
- `src/components/three/Ship.tsx` — add the invisible enlarged hit-sphere child (`onClick` → `onLaunchMinigame`, `stopPropagation`). **Optional clean extraction:** pull the ship's visual meshes into a shared `ShipModel` reused by `PlayerShip`, so the galaxy ship and the game ship can't drift.

**Boundaries:** the minigame is fully self-contained — its own `Canvas`, its own state. The galaxy's only touch-points are (1) the ship hit-sphere that opens it and (2) `GalaxyExperience` pausing the galaxy while it's open. All game math (spawn/gap, collision, score, difficulty) lives in `src/lib/minigame/` and is testable without a DOM or WebGL.

---

## 9. Testing

Matches the existing Vitest suite (pure-logic unit tests + component render/interaction tests).

**Pure logic:**
- `difficulty.ts` — Easy is strictly easier than Hard (wider gap, slower, gentler ramp); the ramp narrows the gap / raises speed monotonically with elapsed time, staying within bounds.
- `spawn.ts` — with a seeded RNG, every wave leaves **exactly one** gap of ≥ the current minimum width, positioned within lane bounds; density rises with difficulty and time.
- `collision.ts` — overlap → hit, separation → miss, including the touching boundary.
- `score.ts` — score increases with distance; best persists and only increases; storage failures are swallowed (never throw).

**Components:**
- `GameHud` — start menu shows three difficulties and selecting one dispatches start; the game-over card shows score/best and Retry/Change/Exit fire their callbacks (`fireEvent.click`).
- `AsteroidGame` — state machine transitions: menu → playing → over → retry/menu/exit; Esc exits.
- `Ship` — the hit-sphere `onClick` calls `onLaunchMinigame` and stops propagation (no look-drag started).
- `useGameEngine` (light) — a few simulated frames spawn and recycle asteroids and register a collision.

**Gates (unchanged):** `npm run test:run`, `npm run lint`, `npm run build` (static export) all green — at the end of **both** Phase 1 and Phase 2.

---

## 10. Open follow-ups (out of scope, tracked)
- **Sun minigame** — next brainstorm round.
- Audio/SFX and haptics.
- Gameplay-affecting upgrades, multiple skin tiers, online leaderboard.
- Minigame performance profiling under sustained play on low-end phones.
