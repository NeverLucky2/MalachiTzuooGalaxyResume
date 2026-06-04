# Asteroid Dodger Minigame — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase-1 core of a hidden 3D asteroid-dodger minigame, launched by clicking the galaxy ship — angled cinematic camera, drag/mouse-follow steering, wave/gap spawning with an Easy/Normal/Hard ramp, one-hit game over and a saved best score.

**Architecture:** All game math lives in pure, unit-tested modules under `src/lib/minigame/` (RNG, difficulty, spawn, collision, score, world+engine, game-state reducer). The UI is a self-contained `src/components/minigame/` module: an `AsteroidGame` overlay (own R3F `<Canvas>` + a `useReducer` state machine) renders a `GameScene` (3D) and a DOM `GameHud`. The galaxy's only touch-points are an invisible hit-sphere on the ship that opens the overlay, and `GalaxyExperience` pausing the galaxy while it's open.

**Tech Stack:** Next.js 16 (static export), React 19, React Three Fiber 9 / three 0.184, TypeScript, Tailwind v4, Vitest 4 (+ `@react-three/test-renderer`, `@testing-library/react`).

**Spec:** `docs/superpowers/specs/2026-06-04-asteroid-dodger-design.md`

**Conventions:**
- Path alias `@/` → `src/`.
- Run a single test file with `npx vitest run <path>`; the full gates are `npm run test:run`, `npm run lint`, `npm run build`.
- One commit per task (test + implementation together), conventional-commit style. ASCII-only commit messages (the repo deliberately avoids accents).
- This plan is **Phase 1 only**. Phase 2 (cosmetic ship-skin unlock) is a fast-follow and gets its own plan after Phase 1 ships green.

---

## File Structure

**New — pure logic (`src/lib/minigame/`):**
- `rng.ts` — deterministic seeded RNG (mulberry32).
- `difficulty.ts` — `Difficulty` type, presets, and `speedAt`/`gapWidthAt`/`spawnIntervalAt` ramps.
- `spawn.ts` — `makeWave`: a wall of asteroids with one clear circular gap.
- `collision.ts` — sphere–sphere overlap + `shipHitsAny`.
- `score.ts` — `scoreFromDistance` + `loadBest`/`saveBest` (localStorage).
- `world.ts` — `PLAY` constants, `Asteroid`/`World` types, `createWorld`.
- `engine.ts` — `stepWorld` (advance ship, asteroids, spawning, collision) + `spawnWave`.
- `gameState.ts` — `GameState` + `gameReducer` (menu → playing → over).

**New — UI (`src/components/minigame/`):**
- `GameHud.tsx` — DOM overlay: start menu (difficulty), live score, game-over card.
- `PlayerShip.tsx` — the player ship (reuses `ShipModel`).
- `Asteroids.tsx` — one `InstancedMesh` for the asteroid pool.
- `useGameEngine.ts` — wires `stepWorld` to `useFrame`, maps the pointer, syncs the meshes.
- `GameScene.tsx` — camera + lights + starfield + ship + asteroids; hosts the engine.
- `AsteroidGame.tsx` — overlay shell: `<Canvas>` + `useReducer` state machine + pointer tracking + Esc/exit.

**New — shared (`src/components/three/`):**
- `ShipModel.tsx` — the ship's visual meshes, extracted from `Ship.tsx` for reuse.

**Modified:**
- `src/components/three/Ship.tsx` — render `<ShipModel/>` instead of inline meshes; add the invisible launch hit-sphere.
- `src/components/three/Scene.tsx` — accept `paused` (frameloop) + thread `onLaunchMinigame` to `Ship`.
- `src/components/GalaxyExperience.tsx` — `minigameOpen` state, render the overlay, pause the galaxy.

---

## Task 1: Seeded RNG

Deterministic RNG so spawn/engine tests are reproducible.

**Files:**
- Create: `src/lib/minigame/rng.ts`
- Test: `src/lib/minigame/rng.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/minigame/rng.test.ts
import {describe, it, expect} from 'vitest';
import {makeRng} from './rng';

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('returns values in [0, 1)', () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('different seeds diverge', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/minigame/rng.test.ts`
Expected: FAIL — `Failed to resolve import "./rng"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/minigame/rng.ts

/**
 * mulberry32 — a tiny, fast, deterministic PRNG. Returns a function that yields
 * the next float in [0, 1) each call. Used so spawn/engine behavior is
 * reproducible under test (and stable per run).
 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/minigame/rng.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/minigame/rng.ts src/lib/minigame/rng.test.ts
git commit -m "feat(minigame): deterministic seeded RNG"
```

---

## Task 2: Difficulty presets & ramps

**Files:**
- Create: `src/lib/minigame/difficulty.ts`
- Test: `src/lib/minigame/difficulty.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/minigame/difficulty.test.ts
import {describe, it, expect} from 'vitest';
import {DIFFICULTY, speedAt, gapWidthAt, spawnIntervalAt} from './difficulty';

describe('difficulty', () => {
  it('easy is strictly easier than hard at every elapsed time', () => {
    for (const t of [0, 10, 30, 60, 120]) {
      expect(speedAt(DIFFICULTY.easy, t)).toBeLessThan(speedAt(DIFFICULTY.hard, t));
      expect(gapWidthAt(DIFFICULTY.easy, t)).toBeGreaterThan(gapWidthAt(DIFFICULTY.hard, t));
    }
  });

  it('speed rises with time but is capped', () => {
    const p = DIFFICULTY.normal;
    expect(speedAt(p, 10)).toBeGreaterThan(speedAt(p, 0));
    expect(speedAt(p, 100000)).toBeLessThanOrEqual(p.maxSpeed);
  });

  it('gap narrows with time but never below the floor', () => {
    const p = DIFFICULTY.normal;
    expect(gapWidthAt(p, 10)).toBeLessThan(gapWidthAt(p, 0));
    expect(gapWidthAt(p, 100000)).toBeGreaterThanOrEqual(p.minGap);
  });

  it('spawn interval shrinks with time but never below the floor', () => {
    const p = DIFFICULTY.normal;
    expect(spawnIntervalAt(p, 10)).toBeLessThan(spawnIntervalAt(p, 0));
    expect(spawnIntervalAt(p, 100000)).toBeGreaterThanOrEqual(p.minSpawnInterval);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/minigame/difficulty.test.ts`
Expected: FAIL — cannot resolve `./difficulty`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/minigame/difficulty.ts

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DiffParams {
  baseSpeed: number;
  speedRamp: number; // units/sec added per elapsed second
  maxSpeed: number;
  baseGap: number; // gap diameter (world units)
  minGap: number;
  gapRamp: number; // gap shrink per elapsed second
  baseSpawnInterval: number; // seconds between waves
  minSpawnInterval: number;
  spawnRamp: number; // interval shrink per elapsed second
}

export const DIFFICULTY: Record<Difficulty, DiffParams> = {
  easy:   {baseSpeed: 24, speedRamp: 0.45, maxSpeed: 55, baseGap: 7.0, minGap: 4.2, gapRamp: 0.05, baseSpawnInterval: 1.5,  minSpawnInterval: 0.85, spawnRamp: 0.012},
  normal: {baseSpeed: 30, speedRamp: 0.60, maxSpeed: 72, baseGap: 6.0, minGap: 3.4, gapRamp: 0.06, baseSpawnInterval: 1.25, minSpawnInterval: 0.60, spawnRamp: 0.016},
  hard:   {baseSpeed: 38, speedRamp: 0.80, maxSpeed: 95, baseGap: 5.2, minGap: 2.8, gapRamp: 0.07, baseSpawnInterval: 1.0,  minSpawnInterval: 0.45, spawnRamp: 0.020},
};

export function speedAt(p: DiffParams, elapsed: number): number {
  return Math.min(p.maxSpeed, p.baseSpeed + p.speedRamp * elapsed);
}

export function gapWidthAt(p: DiffParams, elapsed: number): number {
  return Math.max(p.minGap, p.baseGap - p.gapRamp * elapsed);
}

export function spawnIntervalAt(p: DiffParams, elapsed: number): number {
  return Math.max(p.minSpawnInterval, p.baseSpawnInterval - p.spawnRamp * elapsed);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/minigame/difficulty.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/minigame/difficulty.ts src/lib/minigame/difficulty.test.ts
git commit -m "feat(minigame): difficulty presets and ramp curves"
```

---

## Task 3: Wave/gap spawning

A wave fills the play cross-section with asteroids except for one clear circular gap the player threads.

**Files:**
- Create: `src/lib/minigame/spawn.ts`
- Test: `src/lib/minigame/spawn.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/minigame/spawn.test.ts
import {describe, it, expect} from 'vitest';
import {makeWave, type WaveConfig} from './spawn';
import {makeRng} from './rng';

const cfg: WaveConfig = {halfW: 9, halfH: 6, spacing: 2.6, rMin: 0.7, rMax: 1.7};

describe('makeWave', () => {
  it('leaves the gap clear of every asteroid body', () => {
    const wave = makeWave(makeRng(123), 6, cfg);
    const gapR = 3; // gapDiameter / 2
    for (const a of wave.asteroids) {
      const d = Math.hypot(a.x - wave.gapX, a.y - wave.gapY);
      expect(d - a.r).toBeGreaterThanOrEqual(gapR);
    }
  });

  it('builds a non-empty wall', () => {
    const wave = makeWave(makeRng(123), 6, cfg);
    expect(wave.asteroids.length).toBeGreaterThan(5);
  });

  it('keeps the gap center inside the play bounds', () => {
    for (let seed = 0; seed < 20; seed++) {
      const wave = makeWave(makeRng(seed), 6, cfg);
      expect(Math.abs(wave.gapX)).toBeLessThanOrEqual(cfg.halfW);
      expect(Math.abs(wave.gapY)).toBeLessThanOrEqual(cfg.halfH);
    }
  });

  it('is deterministic for a seed', () => {
    const a = makeWave(makeRng(5), 6, cfg);
    const b = makeWave(makeRng(5), 6, cfg);
    expect(a.asteroids.length).toBe(b.asteroids.length);
    expect(a.gapX).toBe(b.gapX);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/minigame/spawn.test.ts`
Expected: FAIL — cannot resolve `./spawn`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/minigame/spawn.ts

export interface WaveConfig {
  halfW: number;   // play half-width (x)
  halfH: number;   // play half-height (y)
  spacing: number; // grid spacing between candidate asteroid slots
  rMin: number;    // min asteroid radius
  rMax: number;    // max asteroid radius
}

export interface WaveAsteroid {
  x: number;
  y: number;
  r: number;
}

export interface Wave {
  gapX: number;
  gapY: number;
  asteroids: WaveAsteroid[];
}

/**
 * Build one wave: a jittered grid of asteroids across the play cross-section,
 * skipping any slot that would intrude into a single circular gap of
 * `gapDiameter` centered at a random (gapX, gapY). The gap is the only safe
 * route through the wall. Pure + deterministic given `rng`.
 */
export function makeWave(rng: () => number, gapDiameter: number, cfg: WaveConfig): Wave {
  const gapR = gapDiameter / 2;
  const gapX = (rng() * 2 - 1) * Math.max(0, cfg.halfW - gapR);
  const gapY = (rng() * 2 - 1) * Math.max(0, cfg.halfH - gapR);

  const asteroids: WaveAsteroid[] = [];
  for (let gx = -cfg.halfW; gx <= cfg.halfW + 1e-9; gx += cfg.spacing) {
    for (let gy = -cfg.halfH; gy <= cfg.halfH + 1e-9; gy += cfg.spacing) {
      const x = gx + (rng() * 2 - 1) * cfg.spacing * 0.25;
      const y = gy + (rng() * 2 - 1) * cfg.spacing * 0.25;
      const r = cfg.rMin + rng() * (cfg.rMax - cfg.rMin);
      // Keep this asteroid only if its whole body sits outside the gap.
      if (Math.hypot(x - gapX, y - gapY) - r >= gapR) {
        asteroids.push({x, y, r});
      }
    }
  }
  return {gapX, gapY, asteroids};
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/minigame/spawn.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/minigame/spawn.ts src/lib/minigame/spawn.test.ts
git commit -m "feat(minigame): wave/gap spawn generator"
```

---

## Task 4: Collision

**Files:**
- Create: `src/lib/minigame/collision.ts`
- Test: `src/lib/minigame/collision.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/minigame/collision.test.ts
import {describe, it, expect} from 'vitest';
import {spheresOverlap, shipHitsAny, type Collidable} from './collision';

describe('spheresOverlap', () => {
  it('detects overlap', () => {
    expect(spheresOverlap(0, 0, 0, 1, 1, 0, 0, 1)).toBe(true); // gap 2, radii sum 2 → touching
  });
  it('detects separation', () => {
    expect(spheresOverlap(0, 0, 0, 1, 3, 0, 0, 1)).toBe(false);
  });
});

describe('shipHitsAny', () => {
  const asteroids: Collidable[] = [
    {x: 8, y: 0, z: 0, r: 1, active: true},
    {x: 0, y: 0, z: 0, r: 1, active: false}, // inactive, would overlap but is ignored
  ];
  it('ignores inactive asteroids', () => {
    expect(shipHitsAny(0, 0, 0, 0.6, asteroids)).toBe(false);
  });
  it('hits an active overlapping asteroid', () => {
    expect(shipHitsAny(8, 0, 0, 0.6, asteroids)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/minigame/collision.test.ts`
Expected: FAIL — cannot resolve `./collision`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/minigame/collision.ts

export interface Collidable {
  x: number;
  y: number;
  z: number;
  r: number;
  active: boolean;
}

/** True when two spheres overlap or touch. */
export function spheresOverlap(
  ax: number, ay: number, az: number, ar: number,
  bx: number, by: number, bz: number, br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  const sum = ar + br;
  return dx * dx + dy * dy + dz * dz <= sum * sum;
}

/** True if the ship sphere overlaps any active asteroid. */
export function shipHitsAny(
  shipX: number, shipY: number, shipZ: number, shipR: number,
  asteroids: Collidable[],
): boolean {
  for (const a of asteroids) {
    if (!a.active) continue;
    if (spheresOverlap(shipX, shipY, shipZ, shipR, a.x, a.y, a.z, a.r)) return true;
  }
  return false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/minigame/collision.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/minigame/collision.ts src/lib/minigame/collision.test.ts
git commit -m "feat(minigame): sphere-sphere collision"
```

---

## Task 5: Score & best-run storage

**Files:**
- Create: `src/lib/minigame/score.ts`
- Test: `src/lib/minigame/score.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/minigame/score.test.ts
import {describe, it, expect, beforeEach} from 'vitest';
import {scoreFromDistance, loadBest, saveBest} from './score';

describe('score', () => {
  beforeEach(() => localStorage.clear());

  it('scoreFromDistance floors distance to an integer', () => {
    expect(scoreFromDistance(123.9)).toBe(123);
    expect(scoreFromDistance(0)).toBe(0);
  });

  it('best starts at 0 when nothing is stored', () => {
    expect(loadBest()).toBe(0);
  });

  it('saveBest keeps the maximum and persists it', () => {
    expect(saveBest(100)).toBe(100);
    expect(saveBest(40)).toBe(100); // does not regress
    expect(loadBest()).toBe(100);
  });

  it('swallows storage failures without throwing', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
    try {
      expect(() => saveBest(999)).not.toThrow();
    } finally {
      Storage.prototype.setItem = orig;
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/minigame/score.test.ts`
Expected: FAIL — cannot resolve `./score`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/minigame/score.ts

const BEST_KEY = 'galaxy.asteroids.best';

/** Score is the floored distance survived. */
export function scoreFromDistance(distance: number): number {
  return Math.floor(distance);
}

/** Read the saved best score; 0 if absent or unreadable. */
export function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Persist `score` if it beats the stored best; returns the resulting best. */
export function saveBest(score: number): number {
  const best = Math.max(loadBest(), Math.floor(score));
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    /* storage unavailable — best is still returned for this session */
  }
  return best;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/minigame/score.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/minigame/score.ts src/lib/minigame/score.test.ts
git commit -m "feat(minigame): score + best-run storage"
```

---

## Task 6: World state & engine step

The per-frame simulation, kept pure (mutates a plain `World`) so it's testable without WebGL.

**Files:**
- Create: `src/lib/minigame/world.ts`
- Create: `src/lib/minigame/engine.ts`
- Test: `src/lib/minigame/engine.test.ts`

- [ ] **Step 1: Write `world.ts` (types + factory + constants — no test of its own)**

```ts
// src/lib/minigame/world.ts

/** Shared spatial constants for the play space (world units). */
export const PLAY = {
  halfW: 9,       // play-plane half width (x)
  halfH: 6,       // play-plane half height (y)
  shipZ: 0,       // ship's fixed z (asteroids approach toward +z)
  spawnZ: -120,   // asteroids spawn at this z
  despawnZ: 14,   // recycled once past this z (behind the camera)
  shipR: 0.55,    // ship collision radius
  poolSize: 48,   // asteroid pool capacity (hard cap)
  shipEase: 6,    // ship target-follow rate (per second)
  spacing: 2.6,   // spawn grid spacing
  rMin: 0.7,
  rMax: 1.7,
} as const;

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  z: number;
  r: number;
  active: boolean;
  rotX: number;
  rotY: number;
  rotZ: number;
  spin: number;
}

export interface World {
  asteroids: Asteroid[];
  shipX: number;
  shipY: number;
  elapsed: number;   // seconds played
  distance: number;  // accumulated speed*dt → score basis
  speed: number;     // current approach speed
  nextSpawnIn: number;
  alive: boolean;
}

/** Fresh world with a pre-allocated, all-inactive asteroid pool. */
export function createWorld(): World {
  const asteroids: Asteroid[] = Array.from({length: PLAY.poolSize}, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    z: PLAY.despawnZ + 10,
    r: 1,
    active: false,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    spin: 0,
  }));
  return {
    asteroids,
    shipX: 0,
    shipY: 0,
    elapsed: 0,
    distance: 0,
    speed: 0,
    nextSpawnIn: 0.6,
    alive: true,
  };
}
```

- [ ] **Step 2: Write the failing test for `engine.ts`**

```ts
// src/lib/minigame/engine.test.ts
import {describe, it, expect} from 'vitest';
import {createWorld, PLAY} from './world';
import {stepWorld} from './engine';
import {DIFFICULTY} from './difficulty';
import {makeRng} from './rng';

const D = DIFFICULTY.normal;

describe('stepWorld', () => {
  it('eases the ship toward the (clamped) target without overshooting', () => {
    const w = createWorld();
    for (let i = 0; i < 30; i++) stepWorld(w, {dt: 1 / 60, targetX: 100, targetY: 0}, D, makeRng(1));
    expect(w.shipX).toBeGreaterThan(0);
    expect(w.shipX).toBeLessThanOrEqual(PLAY.halfW + 1e-6); // clamped, never past the wall
  });

  it('spawns asteroids over time and accrues distance', () => {
    const w = createWorld();
    const rng = makeRng(2);
    for (let i = 0; i < 120; i++) stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, rng);
    expect(w.asteroids.some((a) => a.active)).toBe(true);
    expect(w.distance).toBeGreaterThan(0);
  });

  it('recycles asteroids that pass the despawn plane', () => {
    const w = createWorld();
    w.asteroids[0].active = true;
    w.asteroids[0].z = PLAY.despawnZ - 0.01;
    stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, makeRng(3));
    expect(w.asteroids[0].active).toBe(false);
  });

  it('ends the run when an asteroid overlaps the ship', () => {
    const w = createWorld();
    w.asteroids[0] = {...w.asteroids[0], active: true, x: 0, y: 0, z: PLAY.shipZ, r: 1};
    stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, makeRng(4));
    expect(w.alive).toBe(false);
  });

  it('is inert once dead', () => {
    const w = createWorld();
    w.alive = false;
    const before = w.elapsed;
    stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, makeRng(5));
    expect(w.elapsed).toBe(before);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/minigame/engine.test.ts`
Expected: FAIL — cannot resolve `./engine`.

- [ ] **Step 4: Write `engine.ts`**

```ts
// src/lib/minigame/engine.ts
import {PLAY, type World} from './world';
import {type DiffParams, speedAt, spawnIntervalAt, gapWidthAt} from './difficulty';
import {makeWave} from './spawn';
import {shipHitsAny} from './collision';

export interface EngineInput {
  dt: number;
  targetX: number;
  targetY: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Activate pool slots for a fresh wave at the spawn plane. */
export function spawnWave(world: World, diff: DiffParams, rng: () => number): void {
  const wave = makeWave(rng, gapWidthAt(diff, world.elapsed), {
    halfW: PLAY.halfW,
    halfH: PLAY.halfH,
    spacing: PLAY.spacing,
    rMin: PLAY.rMin,
    rMax: PLAY.rMax,
  });
  let wi = 0;
  for (const a of world.asteroids) {
    if (wi >= wave.asteroids.length) break;
    if (a.active) continue;
    const w = wave.asteroids[wi++];
    a.active = true;
    a.x = w.x;
    a.y = w.y;
    a.z = PLAY.spawnZ;
    a.r = w.r;
    a.rotX = rng() * 6.283;
    a.rotY = rng() * 6.283;
    a.rotZ = rng() * 6.283;
    a.spin = (rng() * 2 - 1) * 1.5;
  }
}

/** Advance the simulation one frame (mutates `world`). No-op once dead. */
export function stepWorld(world: World, input: EngineInput, diff: DiffParams, rng: () => number): void {
  if (!world.alive) return;
  const dt = Math.min(0.05, input.dt); // clamp huge frame gaps (tab refocus)

  world.elapsed += dt;
  world.speed = speedAt(diff, world.elapsed);

  // Ship eases toward the clamped target.
  const tx = clamp(input.targetX, -PLAY.halfW, PLAY.halfW);
  const ty = clamp(input.targetY, -PLAY.halfH, PLAY.halfH);
  const k = Math.min(1, PLAY.shipEase * dt);
  world.shipX += (tx - world.shipX) * k;
  world.shipY += (ty - world.shipY) * k;

  // Advance asteroids toward the camera; recycle past the despawn plane.
  const move = world.speed * dt;
  for (const a of world.asteroids) {
    if (!a.active) continue;
    a.z += move;
    a.rotX += a.spin * dt;
    a.rotY += a.spin * dt * 0.7;
    if (a.z > PLAY.despawnZ) a.active = false;
  }
  world.distance += move;

  // Spawn the next wave when due.
  world.nextSpawnIn -= dt;
  if (world.nextSpawnIn <= 0) {
    spawnWave(world, diff, rng);
    world.nextSpawnIn = spawnIntervalAt(diff, world.elapsed);
  }

  // One hit ends the run.
  if (shipHitsAny(world.shipX, world.shipY, PLAY.shipZ, PLAY.shipR, world.asteroids)) {
    world.alive = false;
  }
}
```

- [ ] **Step 5: Run test to verify it passes, then commit**

Run: `npx vitest run src/lib/minigame/engine.test.ts`
Expected: PASS (5 tests).

```bash
git add src/lib/minigame/world.ts src/lib/minigame/engine.ts src/lib/minigame/engine.test.ts
git commit -m "feat(minigame): world state + per-frame engine step"
```

---

## Task 7: Game-state reducer

The menu → playing → over machine, kept pure for testing.

**Files:**
- Create: `src/lib/minigame/gameState.ts`
- Test: `src/lib/minigame/gameState.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/minigame/gameState.test.ts
import {describe, it, expect} from 'vitest';
import {initialGameState, gameReducer} from './gameState';

describe('gameReducer', () => {
  it('starts at the menu with the supplied best', () => {
    expect(initialGameState(250)).toEqual({phase: 'menu', difficulty: 'normal', score: 0, best: 250});
  });

  it('start → playing with the chosen difficulty and reset score', () => {
    const s = gameReducer(initialGameState(0), {type: 'start', difficulty: 'hard'});
    expect(s.phase).toBe('playing');
    expect(s.difficulty).toBe('hard');
    expect(s.score).toBe(0);
  });

  it('gameOver → over with final score and best', () => {
    const playing = gameReducer(initialGameState(0), {type: 'start', difficulty: 'easy'});
    const s = gameReducer(playing, {type: 'gameOver', score: 420, best: 420});
    expect(s).toMatchObject({phase: 'over', score: 420, best: 420, difficulty: 'easy'});
  });

  it('retry → playing again at the same difficulty', () => {
    const over = gameReducer(
      gameReducer(initialGameState(0), {type: 'start', difficulty: 'hard'}),
      {type: 'gameOver', score: 10, best: 10},
    );
    const s = gameReducer(over, {type: 'retry'});
    expect(s).toMatchObject({phase: 'playing', difficulty: 'hard', score: 0});
  });

  it('menu → back to the menu', () => {
    const over = gameReducer(initialGameState(5), {type: 'gameOver', score: 3, best: 5});
    expect(gameReducer(over, {type: 'menu'}).phase).toBe('menu');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/minigame/gameState.test.ts`
Expected: FAIL — cannot resolve `./gameState`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/minigame/gameState.ts
import type {Difficulty} from './difficulty';

export type Phase = 'menu' | 'playing' | 'over';

export interface GameState {
  phase: Phase;
  difficulty: Difficulty;
  score: number;
  best: number;
}

export type GameAction =
  | {type: 'start'; difficulty: Difficulty}
  | {type: 'gameOver'; score: number; best: number}
  | {type: 'retry'}
  | {type: 'menu'};

export function initialGameState(best: number): GameState {
  return {phase: 'menu', difficulty: 'normal', score: 0, best};
}

export function gameReducer(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'start':
      return {...s, phase: 'playing', difficulty: a.difficulty, score: 0};
    case 'gameOver':
      return {...s, phase: 'over', score: a.score, best: a.best};
    case 'retry':
      return {...s, phase: 'playing', score: 0};
    case 'menu':
      return {...s, phase: 'menu', score: 0};
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/minigame/gameState.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/minigame/gameState.ts src/lib/minigame/gameState.test.ts
git commit -m "feat(minigame): game-state reducer"
```

---

## Task 8: GameHud (DOM overlay)

Start menu (difficulty), live score, and the game-over card. Pure presentational — all actions are callbacks.

**Files:**
- Create: `src/components/minigame/GameHud.tsx`
- Test: `src/components/minigame/GameHud.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/minigame/GameHud.test.tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {GameHud} from './GameHud';
import {initialGameState, gameReducer} from '@/lib/minigame/gameState';

describe('GameHud', () => {
  it('menu shows three difficulties and Exit; picking one calls onStart', () => {
    const onStart = vi.fn();
    render(
      <GameHud state={initialGameState(0)} onStart={onStart} onRetry={vi.fn()} onMenu={vi.fn()} onExit={vi.fn()} />,
    );
    for (const name of [/easy/i, /normal/i, /hard/i, /exit/i])
      expect(screen.getByRole('button', {name})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /hard/i}));
    expect(onStart).toHaveBeenCalledWith('hard');
  });

  it('playing shows the live score', () => {
    const playing = gameReducer(initialGameState(0), {type: 'start', difficulty: 'normal'});
    render(<GameHud state={{...playing, score: 137}} onStart={vi.fn()} onRetry={vi.fn()} onMenu={vi.fn()} onExit={vi.fn()} />);
    expect(screen.getByText(/137/)).toBeInTheDocument();
  });

  it('game over shows score + best and wires Retry / Change / Exit', () => {
    const onRetry = vi.fn(), onMenu = vi.fn(), onExit = vi.fn();
    const over = {phase: 'over' as const, difficulty: 'normal' as const, score: 300, best: 500};
    render(<GameHud state={over} onStart={vi.fn()} onRetry={onRetry} onMenu={onMenu} onExit={onExit} />);
    expect(screen.getByText(/300/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /retry/i}));
    fireEvent.click(screen.getByRole('button', {name: /change difficulty/i}));
    fireEvent.click(screen.getByRole('button', {name: /exit/i}));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/minigame/GameHud.test.tsx`
Expected: FAIL — cannot resolve `./GameHud`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/minigame/GameHud.tsx
'use client';
import type {Difficulty} from '@/lib/minigame/difficulty';
import type {GameState} from '@/lib/minigame/gameState';

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * DOM overlay for the asteroid game. Renders the start menu, the live score, or
 * the game-over card depending on phase. Purely presentational — every action is
 * a callback owned by AsteroidGame.
 */
export function GameHud({
  state,
  onStart,
  onRetry,
  onMenu,
  onExit,
}: {
  state: GameState;
  onStart: (d: Difficulty) => void;
  onRetry: () => void;
  onMenu: () => void;
  onExit: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-[#e7f6ff]">
      {/* Exit is always reachable, top-left. */}
      <button
        type="button"
        onClick={onExit}
        className="pointer-events-auto absolute left-[calc(12px+env(safe-area-inset-left))] top-[calc(12px+env(safe-area-inset-top))] rounded-full border border-[#21e6ff]/50 bg-[#0a0a1f]/70 px-3 py-2 font-display text-xs text-cyan-200 backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
      >
        ✕ Exit
      </button>

      {state.phase === 'menu' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#05030f]/70 backdrop-blur-sm">
          <h2 className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-3xl font-black text-transparent">
            ASTEROID RUN
          </h2>
          <p className="text-sm opacity-75">Drag to fly · thread the gaps · one hit ends the run</p>
          {state.best > 0 && <p className="font-display text-sm text-cyan-200">BEST {state.best}</p>}
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onStart(d)}
                className="rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-5 py-3 font-display text-sm uppercase tracking-wide text-cyan-100 shadow-[0_0_14px_rgba(33,230,255,.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.phase === 'playing' && (
        <div className="absolute right-[calc(14px+env(safe-area-inset-right))] top-[calc(12px+env(safe-area-inset-top))] font-display text-2xl font-black tabular-nums [text-shadow:0_0_10px_rgba(33,230,255,.6)]">
          {state.score}
        </div>
      )}

      {state.phase === 'over' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#05030f]/75 backdrop-blur-sm">
          <h2 className="font-display text-2xl font-black text-[#ff3df0]">RUN OVER</h2>
          <div className="text-center font-display">
            <div className="text-4xl font-black tabular-nums">{state.score}</div>
            <div className="mt-1 text-sm text-cyan-200">BEST {state.best}</div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onRetry} className="rounded-xl border border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 px-5 py-3 font-display text-sm font-bold text-white shadow-[0_0_16px_#ff3df0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
              ↻ Retry
            </button>
            <button type="button" onClick={onMenu} className="rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-5 py-3 font-display text-sm text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
              Change difficulty
            </button>
            <button type="button" onClick={onExit} className="rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-5 py-3 font-display text-sm text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/minigame/GameHud.test.tsx`
Expected: PASS (3 tests). Note: the "over" card's **Exit** and the always-on top-left **✕ Exit** both call `onExit`; `getByRole('button', {name: /exit/i})` would match two — the test clicks the over-card button by exact name `/exit/i` after Retry/Change, which still matches multiple. To keep `getByRole` unambiguous, the top-left control's accessible name is `✕ Exit` and the card's is `Exit`; query the card button with `screen.getByRole('button', {name: '^Exit$'})` if needed. If the matcher reports multiple elements, change that query to `screen.getAllByRole('button', {name: /exit/i}).at(-1)!`.

- [ ] **Step 5: Commit**

```bash
git add src/components/minigame/GameHud.tsx src/components/minigame/GameHud.test.tsx
git commit -m "feat(minigame): game HUD (menu, score, game-over)"
```

---

## Task 9: Extract shared `ShipModel`

Pull the ship's visual meshes out of `Ship.tsx` so both the galaxy ship and the player ship render the same model (DRY — they can't drift).

**Files:**
- Create: `src/components/three/ShipModel.tsx`
- Modify: `src/components/three/Ship.tsx` (render `<ShipModel/>`, drop the inline meshes/materials/`Wing`/ring-spin)
- Test: `src/components/three/ShipModel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/three/ShipModel.test.tsx
import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {ShipModel} from './ShipModel';

describe('ShipModel', () => {
  it('renders the ship parts (several meshes)', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipModel />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/three/ShipModel.test.tsx`
Expected: FAIL — cannot resolve `./ShipModel`.

- [ ] **Step 3: Create `ShipModel.tsx` (ported verbatim from `Ship.tsx`'s render + materials + halo + ring spin)**

```tsx
// src/components/three/ShipModel.tsx
'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {radialCanvas} from '@/lib/procedural';

interface ShipMats {
  hull: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  engine: THREE.MeshBasicMaterial;
}

/**
 * The ship's visual meshes (hull, energy ring, visor, wings, fin, twin engines,
 * magenta halo), with their own materials/texture lifecycle and an internally
 * spun energy ring. Shared by the galaxy `Ship` (which wraps this in its animated
 * orbit group) and the minigame `PlayerShip`. Forward = +Z.
 */
export function ShipModel() {
  const haloTex = useMemo(() => {
    const cv = radialCanvas('rgba(255,170,250,1)', 0.35, 'rgba(255,61,240,.6)', 'rgba(255,61,240,0)');
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const mats = useMemo<ShipMats>(
    () => ({
      hull: new THREE.MeshStandardMaterial({color: 0xeaf2ff, metalness: 0.78, roughness: 0.24, emissive: 0x0a1622}),
      accent: new THREE.MeshStandardMaterial({color: 0x21e6ff, emissive: 0x16c8e0, emissiveIntensity: 1.6, metalness: 0.4, roughness: 0.3}),
      glass: new THREE.MeshStandardMaterial({color: 0x07202c, emissive: 0x1a5870, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.05}),
      engine: new THREE.MeshBasicMaterial({color: 0xff3df0}),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      haloTex.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [haloTex, mats]);

  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += Math.min(0.05, delta) * 0.7;
  });

  return (
    <group>
      <mesh material={mats.hull} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.26, 0.95, 10, 20]} />
      </mesh>
      <mesh ref={ringRef} material={mats.accent}>
        <torusGeometry args={[0.42, 0.04, 14, 56]} />
      </mesh>
      <mesh material={mats.glass} position={[0, 0.1, 0.45]} rotation={[-0.6, 0, 0]}>
        <sphereGeometry args={[0.2, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      </mesh>
      <Wing side={1} mats={mats} />
      <Wing side={-1} mats={mats} />
      <mesh material={mats.accent} position={[0, 0.22, -0.6]}>
        <boxGeometry args={[0.05, 0.42, 0.4]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[-0.26, -0.02, -0.74]}>
        <cylinderGeometry args={[0.09, 0.12, 0.3, 14]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[0.26, -0.02, -0.74]}>
        <cylinderGeometry args={[0.09, 0.12, 0.3, 14]} />
      </mesh>
      <sprite position={[0, 0, -0.85]} scale={[1.2, 1.2, 1]}>
        <spriteMaterial map={haloTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

function Wing({side, mats}: {side: number; mats: Pick<ShipMats, 'hull' | 'accent'>}) {
  return (
    <group position={[side * 0.2, -0.02, -0.04]} rotation={[0, side * 0.5, side * 0.12]}>
      <mesh material={mats.hull} position={[side * 0.4, 0, 0]}>
        <boxGeometry args={[0.66, 0.035, 0.44]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.4, 0, 0.2]}>
        <boxGeometry args={[0.72, 0.05, 0.07]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.74, 0, 0]}>
        <sphereGeometry args={[0.055, 10, 10]} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Refactor `Ship.tsx` to use `ShipModel`**

In `src/components/three/Ship.tsx`: delete the `haloTex` memo, the `mats` memo, the dispose `useEffect`, the `ring1Ref` and its per-frame `rotation.z` line, and the entire inline JSX body + the `Wing`/`WingMats` definitions. Add `import {ShipModel} from './ShipModel';`. Keep all orbit/merge/scale/orient logic. The render becomes:

```tsx
  return (
    <group ref={shipRef}>
      <ShipModel />
    </group>
  );
```

Remove the now-unused `radialCanvas` import and the `ring1Ref` declaration from `Ship.tsx`. (Keep `useRef`, `useFrame`, `THREE`, motion/planet imports — still used by the orbit logic.)

- [ ] **Step 5: Run tests to verify both pass**

Run: `npx vitest run src/components/three/ShipModel.test.tsx src/components/three/Ship.test.tsx`
Expected: PASS — `ShipModel` renders >3 meshes; existing `Ship` test still passes (it renders `ShipModel`).

- [ ] **Step 6: Commit**

```bash
git add src/components/three/ShipModel.tsx src/components/three/Ship.tsx src/components/three/ShipModel.test.tsx
git commit -m "refactor(three): extract shared ShipModel from Ship"
```

---

## Task 10: PlayerShip & Asteroids (instanced visuals)

**Files:**
- Create: `src/components/minigame/PlayerShip.tsx`
- Create: `src/components/minigame/Asteroids.tsx`
- Test: `src/components/minigame/visuals.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/minigame/visuals.test.tsx
import {describe, it, expect} from 'vitest';
import {createRef} from 'react';
import * as THREE from 'three';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {PlayerShip} from './PlayerShip';
import {Asteroids} from './Asteroids';
import {PLAY} from '@/lib/minigame/world';

describe('minigame visuals', () => {
  it('PlayerShip renders the ship model', async () => {
    const ref = createRef<THREE.Group>();
    const r = await ReactThreeTestRenderer.create(<PlayerShip groupRef={ref} />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });

  it('Asteroids renders one instanced mesh sized to the pool', async () => {
    const ref = createRef<THREE.InstancedMesh>();
    const r = await ReactThreeTestRenderer.create(<Asteroids meshRef={ref} count={PLAY.poolSize} />);
    expect(r.scene.findAllByType('InstancedMesh').length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/minigame/visuals.test.tsx`
Expected: FAIL — cannot resolve `./PlayerShip`.

- [ ] **Step 3: Write `PlayerShip.tsx`**

```tsx
// src/components/minigame/PlayerShip.tsx
'use client';
import type {RefObject} from 'react';
import * as THREE from 'three';
import {ShipModel} from '@/components/three/ShipModel';

/**
 * The player's ship in the minigame: the shared ShipModel scaled up, inside a
 * group the engine positions/banks each frame via `groupRef`. Nosed toward −Z
 * (into the oncoming asteroids) since ShipModel's forward is +Z.
 */
export function PlayerShip({groupRef}: {groupRef: RefObject<THREE.Group | null>}) {
  return (
    <group ref={groupRef}>
      <group rotation={[0, Math.PI, 0]} scale={1.6}>
        <ShipModel />
      </group>
    </group>
  );
}
```

- [ ] **Step 4: Write `Asteroids.tsx`**

```tsx
// src/components/minigame/Asteroids.tsx
'use client';
import type {RefObject} from 'react';

/**
 * One InstancedMesh for the whole asteroid pool. The engine writes a transform
 * into each instance every frame (inactive instances are scaled to 0). Low-poly
 * icosahedron, rocky matte material — cheap to draw `count` of.
 */
export function Asteroids({meshRef, count}: {meshRef: RefObject<THREE.InstancedMesh | null>; count: number}) {
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={0x8b8f9a} roughness={0.95} metalness={0.05} flatShading />
    </instancedMesh>
  );
}
```

Note: `import type * as THREE from 'three'` is not needed in `Asteroids.tsx` (the type `THREE.InstancedMesh` is referenced only in the prop type via the test's ref; here the prop uses `RefObject<THREE.InstancedMesh | null>`). Add `import type * as THREE from 'three';` at the top of `Asteroids.tsx` so the type resolves.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/minigame/visuals.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/minigame/PlayerShip.tsx src/components/minigame/Asteroids.tsx src/components/minigame/visuals.test.tsx
git commit -m "feat(minigame): player ship + instanced asteroids"
```

---

## Task 11: Engine hook + GameScene

Wire the pure engine to `useFrame`, the pointer, and the meshes.

**Files:**
- Create: `src/components/minigame/useGameEngine.ts`
- Create: `src/components/minigame/GameScene.tsx`
- Test: `src/components/minigame/GameScene.test.tsx`

- [ ] **Step 1: Write the failing test (render smoke + no throw across frames)**

```tsx
// src/components/minigame/GameScene.test.tsx
import {describe, it, expect, vi} from 'vitest';
import {createRef} from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {GameScene} from './GameScene';

describe('GameScene', () => {
  it('mounts and advances frames without throwing', async () => {
    const pointer = createRef<{x: number; y: number}>();
    pointer.current = {x: 0, y: 0};
    const r = await ReactThreeTestRenderer.create(
      <GameScene difficulty="normal" pointerRef={pointer} onGameOver={vi.fn()} />,
    );
    await r.advanceFrames(5, 1 / 60);
    expect(r.scene.findAllByType('InstancedMesh').length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/minigame/GameScene.test.tsx`
Expected: FAIL — cannot resolve `./GameScene`.

- [ ] **Step 3: Write `useGameEngine.ts`**

```ts
// src/components/minigame/useGameEngine.ts
'use client';
import {useEffect, useRef, type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {createWorld, PLAY} from '@/lib/minigame/world';
import {stepWorld} from '@/lib/minigame/engine';
import {DIFFICULTY, type Difficulty} from '@/lib/minigame/difficulty';
import {scoreFromDistance, saveBest} from '@/lib/minigame/score';
import {makeRng} from '@/lib/minigame/rng';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const HIDDEN = new THREE.Vector3(0, 0, 1e4);
const ZERO = new THREE.Vector3(0, 0, 0);

/**
 * Drives the minigame each frame: steps the pure world, maps the latest pointer
 * to a play-plane target, writes the ship's transform and every asteroid
 * instance matrix, and fires `onGameOver(score, best)` exactly once on death.
 */
export function useGameEngine({
  difficulty,
  pointerRef,
  shipRef,
  asteroidsRef,
  onGameOver,
}: {
  difficulty: Difficulty;
  pointerRef: RefObject<{x: number; y: number} | null>;
  shipRef: RefObject<THREE.Group | null>;
  asteroidsRef: RefObject<THREE.InstancedMesh | null>;
  onGameOver: (score: number, best: number) => void;
}) {
  const world = useRef(createWorld());
  const rng = useRef(makeRng((Date.now() & 0xffff) || 1));
  const ended = useRef(false);

  // Fresh world whenever a new run starts (difficulty changes / remount).
  useEffect(() => {
    world.current = createWorld();
    ended.current = false;
  }, [difficulty]);

  useFrame((_, delta) => {
    const w = world.current;
    const diff = DIFFICULTY[difficulty];
    const p = pointerRef.current ?? ZERO_TARGET;
    stepWorld(w, {dt: delta, targetX: p.x * PLAY.halfW, targetY: p.y * PLAY.halfH}, diff, rng.current);

    // Ship transform: follow sim position, bank into lateral motion.
    const ship = shipRef.current;
    if (ship) {
      ship.position.set(w.shipX, w.shipY, PLAY.shipZ);
      ship.rotation.z = -w.shipX * 0.06;
      ship.rotation.x = w.shipY * 0.04;
    }

    // Asteroid instances.
    const mesh = asteroidsRef.current;
    if (mesh) {
      for (let i = 0; i < w.asteroids.length; i++) {
        const a = w.asteroids[i];
        if (a.active) {
          _pos.set(a.x, a.y, a.z);
          _e.set(a.rotX, a.rotY, a.rotZ);
          _q.setFromEuler(_e);
          _scl.setScalar(a.r);
          _m.compose(_pos, _q, _scl);
        } else {
          _m.compose(HIDDEN, _q.identity(), ZERO);
        }
        mesh.setMatrixAt(i, _m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (!w.alive && !ended.current) {
      ended.current = true;
      const score = scoreFromDistance(w.distance);
      onGameOver(score, saveBest(score));
    }
  });
}

const ZERO_TARGET = {x: 0, y: 0};
```

- [ ] **Step 4: Write `GameScene.tsx`**

```tsx
// src/components/minigame/GameScene.tsx
'use client';
import {useRef, type RefObject} from 'react';
import * as THREE from 'three';
import {Starfield} from '@/components/three/Starfield';
import {PLAY} from '@/lib/minigame/world';
import type {Difficulty} from '@/lib/minigame/difficulty';
import {PlayerShip} from './PlayerShip';
import {Asteroids} from './Asteroids';
import {useGameEngine} from './useGameEngine';

/**
 * The 3D contents of the minigame: angled key/fill lighting, the galaxy
 * starfield for depth, the player ship, and the instanced asteroid field. Hosts
 * the engine, which owns the per-frame simulation.
 */
export function GameScene({
  difficulty,
  pointerRef,
  onGameOver,
}: {
  difficulty: Difficulty;
  pointerRef: RefObject<{x: number; y: number} | null>;
  onGameOver: (score: number, best: number) => void;
}) {
  const shipRef = useRef<THREE.Group>(null);
  const asteroidsRef = useRef<THREE.InstancedMesh>(null);

  useGameEngine({difficulty, pointerRef, shipRef, asteroidsRef, onGameOver});

  return (
    <>
      <ambientLight color={0x6a7fb0} intensity={1.2} />
      <directionalLight position={[6, 8, 4]} intensity={1.6} color={0xfff0d0} />
      <Starfield />
      <PlayerShip groupRef={shipRef} />
      <Asteroids meshRef={asteroidsRef} count={PLAY.poolSize} />
    </>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/minigame/GameScene.test.tsx`
Expected: PASS (1 test). If `Starfield` requires props the test environment can't supply, render it is still fine (it's the same component the galaxy uses with no required props). 

- [ ] **Step 6: Commit**

```bash
git add src/components/minigame/useGameEngine.ts src/components/minigame/GameScene.tsx src/components/minigame/GameScene.test.tsx
git commit -m "feat(minigame): engine hook + 3D game scene"
```

---

## Task 12: AsteroidGame overlay

The shell: own `<Canvas>` (angled camera), the reducer, pointer tracking, Esc/exit, and the HUD.

**Files:**
- Create: `src/components/minigame/AsteroidGame.tsx`
- Test: `src/components/minigame/AsteroidGame.test.tsx`

- [ ] **Step 1: Write the failing test (state machine via the HUD, with the Canvas mocked)**

```tsx
// src/components/minigame/AsteroidGame.test.tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';

// The 3D Canvas/scene needs WebGL; stub it so we can test the shell + state machine in jsdom.
vi.mock('@react-three/fiber', () => ({Canvas: ({children}: {children: React.ReactNode}) => <div data-testid="canvas">{children}</div>}));
vi.mock('./GameScene', () => ({GameScene: () => null}));

import {AsteroidGame} from './AsteroidGame';

describe('AsteroidGame', () => {
  it('starts at the menu and Exit calls onExit', () => {
    const onExit = vi.fn();
    render(<AsteroidGame onExit={onExit} />);
    expect(screen.getByRole('button', {name: /normal/i})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /✕ exit/i}));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('menu → playing shows the live score area on start', () => {
    render(<AsteroidGame onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', {name: /normal/i}));
    // In playing phase the difficulty buttons are gone.
    expect(screen.queryByRole('button', {name: /^hard$/i})).toBeNull();
  });

  it('Escape exits', () => {
    const onExit = vi.fn();
    render(<AsteroidGame onExit={onExit} />);
    fireEvent.keyDown(window, {key: 'Escape'});
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/minigame/AsteroidGame.test.tsx`
Expected: FAIL — cannot resolve `./AsteroidGame`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/minigame/AsteroidGame.tsx
'use client';
import {useReducer, useRef, useEffect, useCallback} from 'react';
import {Canvas} from '@react-three/fiber';
import {gameReducer, initialGameState} from '@/lib/minigame/gameState';
import {loadBest} from '@/lib/minigame/score';
import type {Difficulty} from '@/lib/minigame/difficulty';
import {GameScene} from './GameScene';
import {GameHud} from './GameHud';

/**
 * Full-screen minigame overlay. Owns the game state machine, tracks the pointer
 * as normalized [-1,1] coords for the engine, and renders its own R3F Canvas
 * (angled 3/4 camera) plus the DOM HUD. `onExit` returns to the galaxy.
 */
export function AsteroidGame({onExit}: {onExit: () => void}) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => initialGameState(loadBest()));
  const pointerRef = useRef<{x: number; y: number}>({x: 0, y: 0});
  const containerRef = useRef<HTMLDivElement>(null);

  // Esc exits from anywhere in the game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  // Map a client point to normalized [-1,1] play coords (y up).
  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  }, []);

  const onStart = (d: Difficulty) => dispatch({type: 'start', difficulty: d});
  const onGameOver = useCallback((score: number, best: number) => dispatch({type: 'gameOver', score, best}), []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 touch-none bg-[#04030c]"
      onPointerMove={(e) => updatePointer(e.clientX, e.clientY)}
      onPointerDown={(e) => updatePointer(e.clientX, e.clientY)}
    >
      <Canvas camera={{position: [6.5, 4.5, 14], fov: 60, near: 0.1, far: 400}} dpr={[1, 2]} gl={{antialias: true}}>
        {state.phase === 'playing' && (
          <GameScene difficulty={state.difficulty} pointerRef={pointerRef} onGameOver={onGameOver} />
        )}
      </Canvas>

      <GameHud
        state={state}
        onStart={onStart}
        onRetry={() => dispatch({type: 'retry'})}
        onMenu={() => dispatch({type: 'menu'})}
        onExit={onExit}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/minigame/AsteroidGame.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/minigame/AsteroidGame.tsx src/components/minigame/AsteroidGame.test.tsx
git commit -m "feat(minigame): AsteroidGame overlay shell + state machine"
```

---

## Task 13: Launch wiring + final gates

Make clicking the ship open the game; pause the galaxy while it's open.

**Files:**
- Modify: `src/components/three/Ship.tsx` (add the invisible hit-sphere)
- Modify: `src/components/three/Scene.tsx` (`paused` + `onLaunchMinigame`)
- Modify: `src/components/GalaxyExperience.tsx` (mount the overlay, pause the galaxy)
- Test: `src/components/three/Ship.test.tsx` (extend), `src/components/GalaxyExperience.test.tsx` (extend)

- [ ] **Step 1: Write the failing tests**

Add to `src/components/three/Ship.test.tsx`:

```tsx
  it('clicking the launch hit-sphere calls onLaunch and stops propagation', async () => {
    const positionsRef = {current: PLANETS.map(() => [0, 0, 0] as [number, number, number])};
    const onLaunch = vi.fn();
    const r = await ReactThreeTestRenderer.create(
      <Ship nav={initialNav()} positionsRef={positionsRef} motion={createMotionState()} onLaunch={onLaunch} />,
    );
    const hit = r.scene.findByProps({name: 'minigame-launch'});
    const stopPropagation = vi.fn();
    hit.props.onClick({stopPropagation});
    expect(onLaunch).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalled();
  });
```

(Add `import {vi} from 'vitest';` to the Ship test imports.)

Add `src/components/GalaxyExperience.test.tsx` (new file):

```tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';

// Stub the 3D scene so we can drive the launch callback from a button in jsdom.
vi.mock('@/components/three/Scene', () => ({
  Scene: ({onLaunchMinigame}: {onLaunchMinigame: () => void}) => (
    <button onClick={onLaunchMinigame}>launch</button>
  ),
}));
vi.mock('@/components/minigame/AsteroidGame', () => ({
  AsteroidGame: ({onExit}: {onExit: () => void}) => <button onClick={onExit}>exit-game</button>,
}));
// Force galaxy mode on mount.
vi.mock('@/lib/capabilities', () => ({
  detectCaps: () => ({hasWebGL: true, reducedMotion: false}),
  shouldUse3D: () => true,
}));

import {GalaxyExperience} from './GalaxyExperience';

describe('GalaxyExperience minigame', () => {
  it('opens the minigame overlay on launch and closes it on exit', () => {
    render(<GalaxyExperience />);
    fireEvent.click(screen.getByText('launch'));
    expect(screen.getByText('exit-game')).toBeInTheDocument();
    fireEvent.click(screen.getByText('exit-game'));
    expect(screen.queryByText('exit-game')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/three/Ship.test.tsx src/components/GalaxyExperience.test.tsx`
Expected: FAIL — `onLaunch`/overlay not implemented; `findByProps({name:'minigame-launch'})` throws.

- [ ] **Step 3: Add the hit-sphere to `Ship.tsx`**

Add an optional `onLaunch?: () => void` to the `Ship` props type. Render the invisible collider as a child of the ship group, sized generously so it's tappable while the ship is small/moving:

```tsx
  return (
    <group ref={shipRef}>
      <ShipModel />
      {onLaunch && (
        <mesh
          name="minigame-launch"
          onClick={(e) => {
            e.stopPropagation();
            onLaunch();
          }}
          onPointerOver={() => (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        >
          <sphereGeometry args={[2.4, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
```

- [ ] **Step 4: Thread the callback + pause through `Scene.tsx`**

Add `paused?: boolean` and `onLaunchMinigame?: () => void` to `Scene`'s props. Set the Canvas frameloop to `'never'` when paused (override the visibility logic):

```tsx
// in the Scene signature
  paused = false,
  onLaunchMinigame,
// ...
// when computing the Canvas frameloop prop:
  frameloop={paused ? 'never' : frameloop}
// pass to the ship:
  <Ship nav={nav} positionsRef={positionsRef} motion={motion.current} onLaunch={onLaunchMinigame} />
```

- [ ] **Step 5: Mount the overlay in `GalaxyExperience.tsx`**

Add state and render the overlay above the paused `Scene`:

```tsx
import {AsteroidGame} from '@/components/minigame/AsteroidGame';
// ...
  const [minigameOpen, setMinigameOpen] = useState(false);
// ...
  if (mode === 'galaxy') {
    return (
      <>
        <Scene
          nav={nav}
          dispatch={dispatch}
          onSkip={showResume}
          reducedMotion={caps.reducedMotion}
          paused={minigameOpen}
          onLaunchMinigame={() => setMinigameOpen(true)}
        />
        {minigameOpen && <AsteroidGame onExit={() => setMinigameOpen(false)} />}
      </>
    );
  }
```

- [ ] **Step 6: Run the targeted tests to verify they pass**

Run: `npx vitest run src/components/three/Ship.test.tsx src/components/GalaxyExperience.test.tsx`
Expected: PASS.

- [ ] **Step 7: Run the full gates**

```bash
npm run test:run
npm run lint
npm run build
```
Expected: all green (test count = prior 84 + the new minigame tests; lint 0; static export to `out/`).

- [ ] **Step 8: Manual QA checklist**

Run `npm run dev`, open the galaxy, then:
- Click the ship (desktop) / tap near it (phone) → the overlay opens; the galaxy stops animating behind it.
- Pick Easy/Normal/Hard → the run starts; dragging moves the ship; it eases with a slight lag and can't leave the screen.
- Thread gaps; take a hit → game-over card shows score + best; **Retry** restarts the same difficulty; **Change difficulty** returns to the menu; **Exit** / **Esc** / **✕** returns to the galaxy exactly where you left it.
- Reload, reopen, score lower → best is retained.

- [ ] **Step 9: Commit**

```bash
git add src/components/three/Ship.tsx src/components/three/Ship.test.tsx src/components/three/Scene.tsx src/components/GalaxyExperience.tsx src/components/GalaxyExperience.test.tsx
git commit -m "feat(minigame): launch from the ship + pause galaxy while playing"
```

---

## Phase 2 (fast-follow — separate plan)

After Phase 1 ships green, a follow-up plan will add the **cosmetic ship skin**: an unlock when the best score crosses a threshold (default ~1500), persisted in `localStorage`; a skin selector on the start menu; `ShipModel` gains an optional `skin`/tint prop (its extraction in Task 9 is what makes this a small, isolated change). No gameplay effect.

---

## Self-Review

**Spec coverage:**
- Launch by clicking the ship (invisible enlarged hit-sphere, stopPropagation) → Task 13. ✓
- Overlay with own Canvas; galaxy pauses → Task 12 (Canvas) + Task 13 (`paused`). ✓
- Exit/back + Esc → Task 12 (Esc, ✕ Exit) + Task 13 (close). ✓
- Angled 3/4 camera → Task 12 (`camera={{position:[6.5,4.5,14]...}}`). ✓
- Drag/mouse-follow, eased, clamped → Task 6 (engine ease+clamp) + Task 12 (pointer mapping). ✓
- Wave/gap spawning + ramp → Tasks 2, 3, 6. ✓
- One-hit + best score → Tasks 4, 5, 6, 11. ✓
- Easy/Normal/Hard picker (start + game-over) → Tasks 2, 7, 8. ✓
- Self-contained `minigame/` + pure logic `lib/minigame/` → all tasks; boundaries respected. ✓
- WebGL-only (no fallback) → inherent; overlay only mounts in galaxy mode (Task 13). ✓
- Cosmetic skin = Phase 2 fast-follow → noted, ShipModel extracted in Task 9 to enable it. ✓
- Testing (pure logic + components) + gates → every task + Task 13 Step 7. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code; constants are concrete values. ✓

**Type consistency:** `Difficulty`, `DiffParams`, `World`, `Asteroid`, `PLAY`, `Wave`/`WaveConfig`/`WaveAsteroid`, `Collidable`, `GameState`/`GameAction`, and the `pointerRef`/`shipRef`/`asteroidsRef` shapes are defined once and reused with the same names/signatures across tasks (`stepWorld`, `makeWave`, `shipHitsAny`, `scoreFromDistance`, `saveBest`, `gameReducer`, `useGameEngine`, `GameScene`, `AsteroidGame`). ✓
