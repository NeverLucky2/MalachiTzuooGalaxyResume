# Premium Unlockable Ship ("Interceptor") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium "Interceptor" ship model that unlocks at 1000 mini-game points (any difficulty), auto-equips, appears in both the galaxy and the mini-game, with a Default/Interceptor switcher in Settings and a start-screen teaser + game-over celebration.

**Architecture:** A pure `ships.ts` registry defines variants + the 1000 threshold. A new `InterceptorShip` R3F component (drop-in for `ShipModel`: forward +Z, similar size) plus a `ShipVariant` dispatcher render the equipped model in both `Ship` (galaxy) and `PlayerShip` (mini-game). `GalaxyExperience` owns the equipped-ship state (persisted via `prefs.ts`), derives "unlocked" from the existing best score, and threads it to `Scene` (galaxy ship + Settings switcher) and `AsteroidGame` (mini-game ship + auto-equip on unlock).

**Tech Stack:** Next.js 16, React 19, React Three Fiber 9 / three 0.184, Tailwind v4, Vitest 4 + Testing Library (+ `@react-three/test-renderer` for ship render tests).

**Conventions (match these):**
- Tests: Vitest + RTL. `fireEvent.click` for state-flipping buttons. `beforeEach(() => localStorage.clear())` when touching storage. R3F render tests use `ReactThreeTestRenderer.create(<X/>)` then `r.scene.findAllByType('Mesh')`.
- eslint-plugin-react-hooks v7: no synchronous `setState` in an effect BODY (lazy `useState(() => …)` for init; localStorage WRITES in effects are fine).
- New props added mid-plan are made **optional with safe defaults** so each task compiles and prior tests stay green.
- Gates after each task: `npm run test:run`, `npm run lint`, `npm run build`.

---

## File Structure

**Create**
- `src/lib/ships.ts` — variant registry + unlock threshold + pure helpers.
- `src/components/three/InterceptorShip.tsx` — the premium ship geometry.
- `src/components/three/ShipVariant.tsx` — variant → model dispatcher.
- `src/components/minigame/InterceptorIcon.tsx` — 2D teaser silhouette.
- Tests alongside each.

**Modify**
- `src/lib/prefs.ts` — equipped-ship get/set.
- `src/lib/minigame/gameState.ts` — `justUnlocked` flag.
- `src/components/minigame/GameHud.tsx` — teaser + celebration.
- `src/components/minigame/PlayerShip.tsx`, `GameScene.tsx`, `AsteroidGame.tsx` — variant + unlock detection.
- `src/components/three/Ship.tsx`, `Scene.tsx` — galaxy ship variant.
- `src/components/GalaxyExperience.tsx` — own equipped state, derive unlocked, thread.
- `src/components/hud/SettingsMenu.tsx` (`SettingsControls`), `MobileHud.tsx`, `Hud.tsx`, `MobileMenu.tsx` — Settings switcher + threading.

---

## Task 1: Ship registry (`ships.ts`)

**Files:**
- Create: `src/lib/ships.ts`, `src/lib/ships.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/ships.test.ts
import {describe, it, expect} from 'vitest';
import {SHIP_VARIANTS, INTERCEPTOR_UNLOCK, isInterceptorUnlocked, isVariantUnlocked} from './ships';

describe('ships registry', () => {
  it('lists default (free) and interceptor (1000)', () => {
    expect(SHIP_VARIANTS.map((v) => v.id)).toEqual(['default', 'interceptor']);
    expect(SHIP_VARIANTS.find((v) => v.id === 'default')!.unlockScore).toBe(0);
    expect(SHIP_VARIANTS.find((v) => v.id === 'interceptor')!.unlockScore).toBe(1000);
    expect(INTERCEPTOR_UNLOCK).toBe(1000);
  });

  it('isInterceptorUnlocked is true only at/above the threshold', () => {
    expect(isInterceptorUnlocked(0)).toBe(false);
    expect(isInterceptorUnlocked(999)).toBe(false);
    expect(isInterceptorUnlocked(1000)).toBe(true);
    expect(isInterceptorUnlocked(5000)).toBe(true);
  });

  it('isVariantUnlocked: default always; interceptor gated by best', () => {
    expect(isVariantUnlocked('default', 0)).toBe(true);
    expect(isVariantUnlocked('interceptor', 999)).toBe(false);
    expect(isVariantUnlocked('interceptor', 1000)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/ships.test.ts`
Expected: FAIL — cannot find module `./ships`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/ships.ts
/** Selectable ship models. `default` is always available; others unlock by score. */
export type ShipVariantId = 'default' | 'interceptor';

export interface ShipVariant {
  id: ShipVariantId;
  name: string;
  /** Best mini-game score required to unlock (0 = always available). */
  unlockScore: number;
}

/** Score needed to unlock the Interceptor (any difficulty). */
export const INTERCEPTOR_UNLOCK = 1000;

export const SHIP_VARIANTS: ShipVariant[] = [
  {id: 'default', name: 'Standard', unlockScore: 0},
  {id: 'interceptor', name: 'Interceptor', unlockScore: INTERCEPTOR_UNLOCK},
];

/** Is `id` unlocked given the player's best score? */
export function isVariantUnlocked(id: ShipVariantId, best: number): boolean {
  const v = SHIP_VARIANTS.find((s) => s.id === id);
  return v ? best >= v.unlockScore : false;
}

/** Convenience: is the Interceptor unlocked at this best score? */
export function isInterceptorUnlocked(best: number): boolean {
  return best >= INTERCEPTOR_UNLOCK;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/ships.test.ts` → Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ships.ts src/lib/ships.test.ts
git commit -m "feat(ships): variant registry + interceptor unlock threshold"
```

---

## Task 2: Equipped-ship persistence (`prefs.ts`)

**Files:**
- Modify: `src/lib/prefs.ts`
- Test: `src/lib/prefs.test.ts` (append)

- [ ] **Step 1: Write the failing test** (append to `src/lib/prefs.test.ts`)

```ts
import {getEquippedShip, setEquippedShip} from './prefs';

describe('prefs — equipped ship', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to "default" and round-trips a valid id', () => {
    expect(getEquippedShip()).toBe('default');
    setEquippedShip('interceptor');
    expect(getEquippedShip()).toBe('interceptor');
    expect(localStorage.getItem('galaxy.ship.model')).toBe('interceptor');
  });

  it('falls back to "default" for an unknown stored value', () => {
    localStorage.setItem('galaxy.ship.model', 'bogus');
    expect(getEquippedShip()).toBe('default');
  });
});
```

> If the existing `prefs.test.ts` doesn't already `import {beforeEach} from 'vitest'`, it does (Task 1 of the prior round added storage tests with `beforeEach`). Keep the new `describe` at the end of the file.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/prefs.test.ts`
Expected: FAIL — `getEquippedShip` is not exported.

- [ ] **Step 3: Add to `src/lib/prefs.ts`** (append; keep existing content)

```ts
import {SHIP_VARIANTS, type ShipVariantId} from './ships';

export const SHIP_MODEL_KEY = 'galaxy.ship.model';

/** The equipped ship variant id; 'default' when absent/unknown/unreadable. */
export function getEquippedShip(): ShipVariantId {
  if (typeof window === 'undefined') return 'default';
  try {
    const v = localStorage.getItem(SHIP_MODEL_KEY);
    return SHIP_VARIANTS.some((s) => s.id === v) ? (v as ShipVariantId) : 'default';
  } catch {
    return 'default';
  }
}

export function setEquippedShip(id: ShipVariantId): void {
  try {
    localStorage.setItem(SHIP_MODEL_KEY, id);
  } catch {
    /* storage unavailable — ignore */
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/prefs.test.ts` → Expected: PASS (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/prefs.ts src/lib/prefs.test.ts
git commit -m "feat(prefs): equipped-ship get/set"
```

---

## Task 3: Game-state unlock flag (`gameState.ts`)

**Files:**
- Modify: `src/lib/minigame/gameState.ts`
- Test: `src/lib/minigame/gameState.test.ts` (append)

- [ ] **Step 1: Write the failing test** (append to `src/lib/minigame/gameState.test.ts`)

```ts
import {gameReducer, initialGameState} from './gameState';

describe('gameState — justUnlocked', () => {
  it('gameOver carries justUnlocked through; start/retry/menu reset it', () => {
    const playing = gameReducer(initialGameState(0), {type: 'start', difficulty: 'easy'});
    const over = gameReducer(playing, {type: 'gameOver', score: 1200, best: 1200, justUnlocked: true});
    expect(over.justUnlocked).toBe(true);
    expect(gameReducer(over, {type: 'retry'}).justUnlocked).toBe(false);
    expect(gameReducer(over, {type: 'menu'}).justUnlocked).toBe(false);
    expect(gameReducer(over, {type: 'start', difficulty: 'hard'}).justUnlocked).toBe(false);
  });

  it('gameOver without justUnlocked defaults to false', () => {
    const over = gameReducer(initialGameState(0), {type: 'gameOver', score: 300, best: 300});
    expect(over.justUnlocked).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/minigame/gameState.test.ts`
Expected: FAIL — `justUnlocked` missing / type error.

- [ ] **Step 3: Edit `src/lib/minigame/gameState.ts`**

Add the optional field to the interface, the action, and reset it in the reducer:

```ts
export interface GameState {
  phase: Phase;
  difficulty: Difficulty;
  score: number;
  best: number;
  /** Set on the game-over that crossed an unlock threshold this run. */
  justUnlocked?: boolean;
}

export type GameAction =
  | {type: 'start'; difficulty: Difficulty}
  | {type: 'gameOver'; score: number; best: number; justUnlocked?: boolean}
  | {type: 'retry'}
  | {type: 'menu'};
```

And the reducer cases (set/clear `justUnlocked`):

```ts
  switch (a.type) {
    case 'start':
      return {...s, phase: 'playing', difficulty: a.difficulty, score: 0, justUnlocked: false};
    case 'gameOver':
      return {...s, phase: 'over', score: a.score, best: a.best, justUnlocked: a.justUnlocked ?? false};
    case 'retry':
      return {...s, phase: 'playing', score: 0, justUnlocked: false};
    case 'menu':
      return {...s, phase: 'menu', score: 0, justUnlocked: false};
  }
```

(`initialGameState` may leave `justUnlocked` unset — it's optional/falsy. Leave it as-is.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/minigame/gameState.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/minigame/gameState.ts src/lib/minigame/gameState.test.ts
git commit -m "feat(minigame): gameState justUnlocked flag"
```

---

## Task 4: Interceptor ship model (`InterceptorShip.tsx`)

A low-poly dart matching the chosen silhouette + Obsidian Neon palette. Drop-in for `ShipModel`: forward = +Z, centered, similar size.

**Files:**
- Create: `src/components/three/InterceptorShip.tsx`, `src/components/three/InterceptorShip.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/three/InterceptorShip.test.tsx
import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {InterceptorShip} from './InterceptorShip';

describe('InterceptorShip', () => {
  it('renders the ship parts (several meshes)', async () => {
    const r = await ReactThreeTestRenderer.create(<InterceptorShip />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/three/InterceptorShip.test.tsx`
Expected: FAIL — cannot find module `./InterceptorShip`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/three/InterceptorShip.tsx
'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {radialCanvas} from '@/lib/procedural';

interface Mats {
  hull: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  engine: THREE.MeshBasicMaterial;
}

/**
 * Premium "Interceptor" ship — a sleek dart: tapered hull (sharp +Z nose), swept
 * delta wings, a glowing cyan spine, cockpit, twin magenta engines, and a cyan
 * halo. Obsidian Neon palette. Drop-in for ShipModel: forward = +Z, centered,
 * comparable size, so the galaxy Ship + minigame PlayerShip use it unchanged.
 */
export function InterceptorShip() {
  const haloTex = useMemo(() => {
    const cv = radialCanvas('rgba(159,233,255,1)', 0.35, 'rgba(33,230,255,.6)', 'rgba(33,230,255,0)');
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const mats = useMemo<Mats>(
    () => ({
      hull: new THREE.MeshStandardMaterial({color: 0x15131f, metalness: 0.82, roughness: 0.3, emissive: 0x05060a}),
      accent: new THREE.MeshStandardMaterial({color: 0x21e6ff, emissive: 0x16c8e0, emissiveIntensity: 1.8, metalness: 0.4, roughness: 0.3}),
      glass: new THREE.MeshStandardMaterial({color: 0x0a2030, emissive: 0x1a5870, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.05}),
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

  // Subtle spin on the cyan nose tip ring for life.
  const tipRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (tipRef.current) tipRef.current.rotation.z += Math.min(0.05, delta) * 0.9;
  });

  return (
    <group>
      {/* Tapered hull: narrow nose toward +Z, wider tail toward -Z. */}
      <mesh material={mats.hull} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.3, 1.9, 16]} />
      </mesh>
      {/* Sharp accent nose tip (+Z). */}
      <mesh ref={tipRef} material={mats.accent} position={[0, 0, 1.02]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 16]} />
      </mesh>
      {/* Glowing cyan dorsal spine. */}
      <mesh material={mats.accent} position={[0, 0.17, -0.1]}>
        <boxGeometry args={[0.05, 0.06, 1.25]} />
      </mesh>
      {/* Cockpit canopy. */}
      <mesh material={mats.glass} position={[0, 0.12, 0.4]} rotation={[-0.6, 0, 0]}>
        <sphereGeometry args={[0.17, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>
      <Wing side={1} mats={mats} />
      <Wing side={-1} mats={mats} />
      {/* Twin engines (rear, -Z). */}
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[-0.18, -0.02, -0.95]}>
        <cylinderGeometry args={[0.08, 0.11, 0.32, 14]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[0.18, -0.02, -0.95]}>
        <cylinderGeometry args={[0.08, 0.11, 0.32, 14]} />
      </mesh>
      {/* Cyan exhaust halo. */}
      <sprite position={[0, 0, -1.08]} scale={[1.3, 1.3, 1]}>
        <spriteMaterial map={haloTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

function Wing({side, mats}: {side: number; mats: Pick<Mats, 'hull' | 'accent'>}) {
  // Swept-back delta wing: angled outward + back, with a lit leading edge.
  return (
    <group position={[side * 0.22, -0.03, -0.18]} rotation={[0, side * 0.62, side * 0.1]}>
      <mesh material={mats.hull} position={[side * 0.46, 0, 0]}>
        <boxGeometry args={[0.86, 0.035, 0.7]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.46, 0.005, 0.34]}>
        <boxGeometry args={[0.9, 0.05, 0.05]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.88, 0, 0]}>
        <boxGeometry args={[0.05, 0.06, 0.5]} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/three/InterceptorShip.test.tsx` → Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/three/InterceptorShip.tsx src/components/three/InterceptorShip.test.tsx
git commit -m "feat(ship): low-poly Interceptor model (Obsidian Neon)"
```

---

## Task 5: Variant dispatcher (`ShipVariant.tsx`)

**Files:**
- Create: `src/components/three/ShipVariant.tsx`, `src/components/three/ShipVariant.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/three/ShipVariant.test.tsx
import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {ShipVariant} from './ShipVariant';

describe('ShipVariant', () => {
  it('renders a ship for the default variant', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipVariant variant="default" />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });

  it('renders a ship for the interceptor variant', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipVariant variant="interceptor" />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });

  it('defaults to a ship when no variant is given', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipVariant />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/three/ShipVariant.test.tsx`
Expected: FAIL — cannot find module `./ShipVariant`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/three/ShipVariant.tsx
'use client';
import type {ShipVariantId} from '@/lib/ships';
import {ShipModel} from './ShipModel';
import {InterceptorShip} from './InterceptorShip';

/**
 * Renders the ship geometry for the equipped `variant`. The single place
 * consumers branch on variant; anything unknown falls through to the standard
 * ShipModel. Used by both the galaxy `Ship` and the minigame `PlayerShip`.
 */
export function ShipVariant({variant = 'default'}: {variant?: ShipVariantId}) {
  return variant === 'interceptor' ? <InterceptorShip /> : <ShipModel />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/three/ShipVariant.test.tsx` → Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/three/ShipVariant.tsx src/components/three/ShipVariant.test.tsx
git commit -m "feat(ship): ShipVariant dispatcher"
```

---

## Task 6: Mini-game teaser + celebration (`GameHud.tsx` + `InterceptorIcon`)

**Files:**
- Create: `src/components/minigame/InterceptorIcon.tsx`
- Modify: `src/components/minigame/GameHud.tsx`
- Test: `src/components/minigame/GameHud.test.tsx` (append)

- [ ] **Step 1: Write the failing tests** (append to `src/components/minigame/GameHud.test.tsx`)

```tsx
describe('GameHud — interceptor unlock UI', () => {
  it('menu shows the locked teaser when not unlocked', () => {
    render(
      <GameHud state={initialGameState(740)} onStart={vi.fn()} onRetry={vi.fn()} onMenu={vi.fn()} onExit={vi.fn()} interceptorUnlocked={false} />,
    );
    expect(screen.getByText(/1000 to unlock the interceptor/i)).toBeInTheDocument();
  });

  it('menu shows the unlocked note when unlocked', () => {
    render(
      <GameHud state={initialGameState(1500)} onStart={vi.fn()} onRetry={vi.fn()} onMenu={vi.fn()} onExit={vi.fn()} interceptorUnlocked={true} />,
    );
    expect(screen.getByText(/interceptor unlocked/i)).toBeInTheDocument();
  });

  it('game-over celebrates a fresh unlock', () => {
    const over = {phase: 'over' as const, difficulty: 'normal' as const, score: 1200, best: 1200, justUnlocked: true};
    render(<GameHud state={over} onStart={vi.fn()} onRetry={vi.fn()} onMenu={vi.fn()} onExit={vi.fn()} interceptorUnlocked={true} />);
    expect(screen.getByText(/interceptor unlocked — equipped/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/minigame/GameHud.test.tsx`
Expected: FAIL — teaser/celebration text not present; `interceptorUnlocked` prop unknown.

- [ ] **Step 3: Create `src/components/minigame/InterceptorIcon.tsx`**

```tsx
// src/components/minigame/InterceptorIcon.tsx
/** Small 2D Interceptor silhouette for the locked teaser (color via currentColor). */
export function InterceptorIcon({className = ''}: {className?: string}) {
  return (
    <svg viewBox="0 0 120 150" className={className} fill="currentColor" aria-hidden="true">
      <polygon points="56,66 18,118 44,116 56,96" />
      <polygon points="64,66 102,118 76,116 64,96" />
      <polygon points="60,12 52,60 52,116 68,116 68,60" />
      <rect x="51" y="114" width="8" height="17" rx="3" />
      <rect x="61" y="114" width="8" height="17" rx="3" />
    </svg>
  );
}
```

- [ ] **Step 4: Edit `src/components/minigame/GameHud.tsx`**

Add imports at the top:

```tsx
import {INTERCEPTOR_UNLOCK} from '@/lib/ships';
import {InterceptorIcon} from './InterceptorIcon';
```

Add the prop (optional, default false) to the component signature:

```tsx
export function GameHud({
  state,
  onStart,
  onRetry,
  onMenu,
  onExit,
  interceptorUnlocked = false,
}: {
  state: GameState;
  onStart: (d: Difficulty) => void;
  onRetry: () => void;
  onMenu: () => void;
  onExit: () => void;
  interceptorUnlocked?: boolean;
}) {
```

In the **menu** block, after the difficulty buttons row (`</div>` closing the `flex gap-3` of difficulty buttons), add the teaser:

```tsx
          {interceptorUnlocked ? (
            <p className="font-display text-xs text-cyan-200">✓ Interceptor unlocked — switch ships in Settings</p>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-[#21e6ff]/30 bg-[#0a0a1f]/60 px-4 py-2 text-[#9fb6cf]">
              <InterceptorIcon className="h-8 w-8 flex-none text-[#21e6ff] opacity-40" />
              <span className="text-xs">
                Score {INTERCEPTOR_UNLOCK} to unlock the Interceptor
                {state.best > 0 ? ` · best ${state.best}` : ''}
              </span>
            </div>
          )}
```

In the **over** block, after the score/best display block, add:

```tsx
          {state.justUnlocked ? (
            <p className="font-display text-sm font-bold text-[#21e6ff] [text-shadow:0_0_10px_rgba(33,230,255,.6)]">
              🎉 Interceptor unlocked — equipped!
            </p>
          ) : !interceptorUnlocked ? (
            <p className="text-xs text-[#9fb6cf]">
              Best {state.best} · {INTERCEPTOR_UNLOCK} to unlock the Interceptor
            </p>
          ) : null}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- src/components/minigame/GameHud.test.tsx` → Expected: PASS (existing + 3 new).

- [ ] **Step 6: Commit**

```bash
git add src/components/minigame/InterceptorIcon.tsx src/components/minigame/GameHud.tsx src/components/minigame/GameHud.test.tsx
git commit -m "feat(minigame): interceptor unlock teaser + celebration"
```

---

## Task 7: Mini-game ship variant + unlock detection

Render the equipped ship in the mini-game and detect/auto-equip the unlock.

**Files:**
- Modify: `src/components/minigame/PlayerShip.tsx`, `GameScene.tsx`, `AsteroidGame.tsx`
- Test: `src/components/minigame/AsteroidGame.test.tsx` (extend the GameScene mock + add tests)

- [ ] **Step 1: Write the failing tests** — rewrite the GameScene mock in `AsteroidGame.test.tsx` to expose an end-run trigger, and add unlock tests.

Replace the existing line `vi.mock('./GameScene', () => ({GameScene: () => null}));` with:

```tsx
const ctrl = vi.hoisted(() => ({score: 0}));
vi.mock('./GameScene', () => ({
  // Exposes a button that ends the run with the controlled score, so we can drive
  // the game-over/unlock path in jsdom without the real engine.
  GameScene: ({onGameOver}: {onGameOver: (s: number) => void}) => (
    <button type="button" onClick={() => onGameOver(ctrl.score)}>__end_run</button>
  ),
}));
```

Add these tests (the file already imports `render, screen, fireEvent`, `vi`; add `beforeEach` to the vitest import if missing):

```tsx
describe('AsteroidGame — interceptor unlock', () => {
  beforeEach(() => localStorage.clear());

  it('crossing 1000 auto-equips + celebrates', () => {
    ctrl.score = 1200;
    const onUnlock = vi.fn();
    render(<AsteroidGame onExit={vi.fn()} onUnlockInterceptor={onUnlock} />);
    fireEvent.click(screen.getByRole('button', {name: /normal/i}));   // → playing
    fireEvent.click(screen.getByRole('button', {name: /__end_run/i})); // → over
    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/interceptor unlocked — equipped/i)).toBeInTheDocument();
  });

  it('a sub-1000 run does not unlock', () => {
    ctrl.score = 400;
    const onUnlock = vi.fn();
    render(<AsteroidGame onExit={vi.fn()} onUnlockInterceptor={onUnlock} />);
    fireEvent.click(screen.getByRole('button', {name: /normal/i}));
    fireEvent.click(screen.getByRole('button', {name: /__end_run/i}));
    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.queryByText(/unlocked — equipped/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/components/minigame/AsteroidGame.test.tsx`
Expected: FAIL — `onUnlockInterceptor` unknown / no celebration.

- [ ] **Step 3: Add a `variant` prop to `PlayerShip.tsx`**

```tsx
// src/components/minigame/PlayerShip.tsx
'use client';
import type {RefObject} from 'react';
import type * as THREE from 'three';
import type {ShipVariantId} from '@/lib/ships';
import {ShipVariant} from '@/components/three/ShipVariant';

/**
 * The player's ship in the minigame: the equipped ShipVariant scaled up, inside a
 * group the engine positions/banks each frame via `groupRef`. Nosed toward −Z.
 */
export function PlayerShip({
  groupRef,
  variant = 'default',
}: {
  groupRef: RefObject<THREE.Group | null>;
  variant?: ShipVariantId;
}) {
  return (
    <group ref={groupRef}>
      <group rotation={[0, Math.PI, 0]} scale={1.6}>
        <ShipVariant variant={variant} />
      </group>
    </group>
  );
}
```

- [ ] **Step 4: Thread `variant` through `GameScene.tsx`**

Add the prop and pass it to `PlayerShip`:

```tsx
import type {ShipVariantId} from '@/lib/ships';
```

```tsx
export function GameScene({
  difficulty,
  pointerRef,
  scoreRef,
  onGameOver,
  variant = 'default',
}: {
  difficulty: Difficulty;
  pointerRef: RefObject<{x: number; y: number} | null>;
  scoreRef: RefObject<number>;
  onGameOver: (score: number) => void;
  variant?: ShipVariantId;
}) {
```

```tsx
      <PlayerShip groupRef={shipRef} variant={variant} />
```

- [ ] **Step 5: Wire detection + props in `AsteroidGame.tsx`**

Add imports:

```tsx
import type {ShipVariantId} from '@/lib/ships';
import {INTERCEPTOR_UNLOCK, isInterceptorUnlocked} from '@/lib/ships';
import {loadBest, saveBest} from '@/lib/minigame/score';
```

(`loadBest`/`saveBest` are already imported — extend the existing import rather than duplicating.)

Extend the props (new ones optional):

```tsx
export function AsteroidGame({
  onExit,
  equippedShip = 'default',
  onUnlockInterceptor = () => {},
}: {
  onExit: () => void;
  equippedShip?: ShipVariantId;
  onUnlockInterceptor?: () => void;
}) {
```

Change `onGameOver` to detect the crossing and auto-equip:

```tsx
  const onGameOver = useCallback(
    (score: number) => {
      const prevBest = loadBest();
      const best = saveBest(score);
      const justUnlocked = prevBest < INTERCEPTOR_UNLOCK && best >= INTERCEPTOR_UNLOCK;
      if (justUnlocked) onUnlockInterceptor();
      dispatch({type: 'gameOver', score, best, justUnlocked});
    },
    [onUnlockInterceptor],
  );

  const interceptorUnlocked = isInterceptorUnlocked(loadBest());
```

Pass `variant` to `GameScene` and `interceptorUnlocked` to `GameHud`:

```tsx
        {state.phase === 'playing' && (
          <GameScene difficulty={state.difficulty} pointerRef={pointerRef} scoreRef={scoreRef} onGameOver={onGameOver} variant={equippedShip} />
        )}
```

```tsx
      <GameHud
        state={state}
        onStart={onStart}
        onRetry={() => dispatch({type: 'retry'})}
        onMenu={() => dispatch({type: 'menu'})}
        onExit={onExit}
        interceptorUnlocked={interceptorUnlocked}
      />
```

- [ ] **Step 6: Run tests + lint + build**

Run: `npm run test:run -- src/components/minigame/AsteroidGame.test.tsx` → Expected: PASS (existing 3 + 2 new).
Run: `npm run lint` → 0. Run: `npm run build` → static export ok.

- [ ] **Step 7: Commit**

```bash
git add src/components/minigame/PlayerShip.tsx src/components/minigame/GameScene.tsx src/components/minigame/AsteroidGame.tsx src/components/minigame/AsteroidGame.test.tsx
git commit -m "feat(minigame): equipped ship in-game + unlock detection/auto-equip"
```

---

## Task 8: Galaxy ship variant (`Ship.tsx` + `Scene.tsx`)

**Files:**
- Modify: `src/components/three/Ship.tsx`, `src/components/three/Scene.tsx`

- [ ] **Step 1: Add a `variant` prop to `Ship.tsx`**

Add the import and prop, and render the variant instead of the bare `ShipModel`:

```tsx
import type {ShipVariantId} from '@/lib/ships';
import {ShipVariant} from './ShipVariant';
```

Add `variant` to the props type (optional, default `'default'`):

```tsx
export function Ship({
  nav,
  positionsRef,
  motion,
  onLaunch,
  variant = 'default',
}: {
  nav: NavState;
  positionsRef: PositionsRef;
  motion: MotionState;
  onLaunch?: () => void;
  variant?: ShipVariantId;
}) {
```

Replace the `<ShipModel />` line (inside the returned `<group ref={shipRef}>`) with:

```tsx
      <ShipVariant variant={variant} />
```

(Remove the now-unused `import {ShipModel} from './ShipModel';`.)

- [ ] **Step 2: Thread `equippedShip` through `Scene.tsx`**

Add the import and an optional prop, and pass it to `Ship`:

```tsx
import type {ShipVariantId} from '@/lib/ships';
```

Add to Scene's props (optional, default `'default'`):

```tsx
  equippedShip = 'default',
```
```tsx
  equippedShip?: ShipVariantId;
```

Pass it to the ship:

```tsx
          <Ship nav={nav} positionsRef={positionsRef} motion={motion.current} onLaunch={shipMinigame ? onLaunchMinigame : undefined} variant={equippedShip} />
```

- [ ] **Step 3: Verify build + tests**

Run: `npm run test:run` → Expected: all green (existing Ship.test renders `<Ship/>` with no `variant` → defaults to ShipModel, still passes).
Run: `npm run lint` → 0. Run: `npm run build` → ok.

- [ ] **Step 4: Commit**

```bash
git add src/components/three/Ship.tsx src/components/three/Scene.tsx
git commit -m "feat(galaxy): render the equipped ship variant"
```

---

## Task 9: Own equipped state + auto-equip wiring (`GalaxyExperience.tsx`)

**Files:**
- Modify: `src/components/GalaxyExperience.tsx`

- [ ] **Step 1: Add equipped state, derive unlocked, thread to Scene + AsteroidGame**

Add imports:

```tsx
import {getEquippedShip, setEquippedShip as persistEquippedShip} from '@/lib/prefs';
import type {ShipVariantId} from '@/lib/ships';
```

Inside `GalaxyExperience`, add the state (lazy init; persist on change in an effect — a localStorage write, not setState):

```tsx
  const [equippedShip, setEquippedShip] = useState<ShipVariantId>(() => getEquippedShip());
  useEffect(() => {
    persistEquippedShip(equippedShip);
  }, [equippedShip]);
  const equipInterceptor = () => setEquippedShip('interceptor');
```

In the `mode === 'galaxy'` return, pass the new props:

```tsx
        <Scene
          nav={nav}
          dispatch={dispatch}
          onSkip={showResume}
          reducedMotion={caps.reducedMotion}
          paused={minigameOpen}
          onLaunchMinigame={openMinigame}
          equippedShip={equippedShip}
        />
        {minigameOpen && (
          <AsteroidGame
            onExit={() => setMinigameOpen(false)}
            equippedShip={equippedShip}
            onUnlockInterceptor={equipInterceptor}
          />
        )}
```

> Only `equippedShip` is passed to `Scene` here (it's what `Scene` accepts after Task 8). The Settings switcher props (`onEquipShip`, `interceptorUnlocked`) are added to the `Scene` call in Task 10, alongside `Scene` accepting them.

- [ ] **Step 2: Verify**

Run: `npm run test:run` → Expected: green (the GalaxyExperience test mocks Scene/AsteroidGame; new optional props don't affect it).
Run: `npm run lint` → 0. Run: `npm run build` → ok.

- [ ] **Step 3: Commit**

```bash
git add src/components/GalaxyExperience.tsx
git commit -m "feat(galaxy): own equipped-ship state + auto-equip on unlock"
```

---

## Task 10: Settings ship switcher (shown when unlocked)

Add the Default/Interceptor switcher to `SettingsControls` and thread the props from `GalaxyExperience` → `Scene` → HUDs → menus.

**Files:**
- Modify: `src/components/hud/SettingsMenu.tsx`, `src/components/hud/MobileMenu.tsx`, `src/components/hud/MobileHud.tsx`, `src/components/hud/Hud.tsx`, `src/components/three/Scene.tsx`, `src/components/GalaxyExperience.tsx`
- Test: `src/components/hud/SettingsMenu.test.tsx` (append)

- [ ] **Step 1: Write the failing tests** (append to `src/components/hud/SettingsMenu.test.tsx`)

```tsx
import {SettingsControls} from './SettingsMenu';

describe('SettingsControls — ship switcher', () => {
  const base = {shipMinigameEnabled: true, onToggleShipMinigame: vi.fn(), onReplayTour: vi.fn()};

  it('hides the ship switcher until the interceptor is unlocked', () => {
    render(<SettingsControls {...base} interceptorUnlocked={false} equippedShip="default" onEquipShip={vi.fn()} />);
    expect(screen.queryByRole('button', {name: /interceptor/i})).toBeNull();
  });

  it('shows the switcher when unlocked and equips on click', () => {
    const onEquip = vi.fn();
    render(<SettingsControls {...base} interceptorUnlocked={true} equippedShip="default" onEquipShip={onEquip} />);
    fireEvent.click(screen.getByRole('button', {name: /interceptor/i}));
    expect(onEquip).toHaveBeenCalledWith('interceptor');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/components/hud/SettingsMenu.test.tsx`
Expected: FAIL — `SettingsControls` doesn't accept the new props / no Interceptor button.

- [ ] **Step 3: Add the switcher to `SettingsControls`** in `src/components/hud/SettingsMenu.tsx`

Add the import:

```tsx
import {SHIP_VARIANTS, type ShipVariantId} from '@/lib/ships';
```

Extend `SettingsControls` props (new ones optional) and render the switcher only when unlocked:

```tsx
export function SettingsControls({
  shipMinigameEnabled,
  onToggleShipMinigame,
  onReplayTour,
  interceptorUnlocked = false,
  equippedShip = 'default',
  onEquipShip = () => {},
}: {
  shipMinigameEnabled: boolean;
  onToggleShipMinigame: () => void;
  onReplayTour: () => void;
  interceptorUnlocked?: boolean;
  equippedShip?: ShipVariantId;
  onEquipShip?: (id: ShipVariantId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* (existing ship-minigame toggle button stays here) */}
      {/* (existing replay-walkthrough button stays here) */}

      {interceptorUnlocked && (
        <div className="rounded-xl border border-[#21e6ff]/40 bg-[#0a0a1f]/60 px-3 py-2.5">
          <div className="mb-1.5 font-display text-[10px] uppercase tracking-[1.5px] text-[#7fb0c9]">Ship</div>
          <div className="flex gap-2">
            {SHIP_VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={equippedShip === v.id}
                onClick={() => onEquipShip(v.id)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-display ${
                  equippedShip === v.id
                    ? 'border-[#21e6ff] bg-[#21e6ff]/15 text-cyan-100'
                    : 'border-[#21e6ff]/40 text-[#9fb6cf]'
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

> Keep the two existing buttons exactly as they are; only add the `interceptorUnlocked && (...)` block after them and the three new props.

- [ ] **Step 4: Thread the props through the menus**

In `MobileMenu.tsx`: add the three optional props (`interceptorUnlocked = false`, `equippedShip = 'default'`, `onEquipShip = () => {}`; import `type {ShipVariantId} from '@/lib/ships'`) and pass them into the `<SettingsControls .../>` it renders.

In `SettingsMenu` (desktop popover, same file): it already spreads its props into `SettingsControls` via the explicit list — extend `SettingsMenu`'s props with the same three and pass them through to `SettingsControls`.

In `MobileHud.tsx` and `Hud.tsx`: add the same three optional props and forward them to `MobileMenu` / `SettingsMenu` respectively.

In `Scene.tsx`: add the same three optional props (`onEquipShip`, `interceptorUnlocked`; `equippedShip` already exists from Task 8) and pass them to both `MobileHud` and `Hud`.

Concretely, the new prop signatures to add (each optional):
```tsx
interceptorUnlocked?: boolean;
equippedShip?: ShipVariantId;       // already on Scene; add to MobileHud/Hud/MobileMenu/SettingsMenu
onEquipShip?: (id: ShipVariantId) => void;
```

- [ ] **Step 5: Pass them from `GalaxyExperience.tsx`**

Add imports:

```tsx
import {isInterceptorUnlocked} from '@/lib/ships';
import {loadBest} from '@/lib/minigame/score';
```

Declare the derived flag next to `equipInterceptor` (recomputes each render — after the minigame saves a new best, an unlock also flips `equippedShip` → re-render):

```tsx
  const interceptorUnlocked = isInterceptorUnlocked(loadBest());
```

Extend the `Scene` call:

```tsx
        <Scene
          nav={nav}
          dispatch={dispatch}
          onSkip={showResume}
          reducedMotion={caps.reducedMotion}
          paused={minigameOpen}
          onLaunchMinigame={openMinigame}
          equippedShip={equippedShip}
          onEquipShip={setEquippedShip}
          interceptorUnlocked={interceptorUnlocked}
        />
```

(`setEquippedShip` is the state setter typed `(id: ShipVariantId) => void` — pass it directly as `onEquipShip`.)

- [ ] **Step 6: Run the full suite + lint + build**

Run: `npm run test:run` → Expected: all green (new SettingsControls tests pass; existing menu/HUD tests unaffected by optional props).
Run: `npm run lint` → 0 (the `interceptorUnlocked` declared in Task 9 is now consumed).
Run: `npm run build` → static export ok.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(settings): Default/Interceptor ship switcher (shown when unlocked)"
```

---

## Final verification

- [ ] **Run all gates**

```bash
npm run test:run
npm run lint
npm run build
```

Expected: all green; static export to `out/`.

- [ ] **Manual check (not unit-testable):**
  - Mini-game start screen shows the locked teaser ("Score 1000 to unlock the Interceptor") with the silhouette.
  - Score ≥ 1000 (any difficulty) → game-over shows "🎉 Interceptor unlocked — equipped!"; exit to galaxy and confirm the orbiting ship is now the Interceptor.
  - Settings (⚙ desktop / ☰ mobile) shows the Default/Interceptor switcher only after unlocking; switching changes both the galaxy + mini-game ship and persists across reload.
  - Tune the Interceptor's 3D proportions with `next dev` if needed.

---

## Self-review notes

- **Spec coverage:** registry→T1; persistence→T2; justUnlocked→T3; Interceptor model→T4; dispatcher→T5; teaser/celebration→T6; mini-game ship + unlock/auto-equip→T7; galaxy ship→T8; own-state/derive-unlocked→T9; Settings switcher + threading→T10. All spec sections mapped.
- **Type consistency:** `ShipVariantId`, `SHIP_VARIANTS`, `INTERCEPTOR_UNLOCK`, `isInterceptorUnlocked`, `isVariantUnlocked`, `getEquippedShip`/`setEquippedShip`, `justUnlocked`, `equippedShip`, `onEquipShip`, `onUnlockInterceptor`, `interceptorUnlocked`, `variant` are used identically across tasks.
- **Optional props** on AsteroidGame/PlayerShip/GameScene/Ship/Scene/HUDs/menus/SettingsControls keep every intermediate task compiling and prior tests green.
- **Drop-in ship:** InterceptorShip uses forward +Z and ShipModel-comparable size, so no changes to Ship/PlayerShip motion/scale logic.
- **Deferred:** visual proportion tuning; additional future ships (add a registry entry + model + ShipVariant case).
