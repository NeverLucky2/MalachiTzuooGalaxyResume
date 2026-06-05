# Premium Unlockable Ship ("Interceptor") — Design

**Date:** 2026-06-05
**Branch:** `premium-ship-unlock`
**Status:** Approved (2026-06-05)

## Background

The galaxy résumé site has an easter-egg asteroid mini-game (launched from the
orbiting ship). The asteroid-dodger spec earmarked a cosmetic ship reward as a
fast-follow. The user wants this now, but upgraded from a recolor "skin" to a
**whole new premium ship model** — a bigger sense of accomplishment. Decisions
were locked via brainstorming + visual mockups.

**Locked decisions:**
- Reward = a distinct **new ship model** (not a recolor): the **Interceptor**
  (sleek dart nose, swept delta wings, twin engines).
- Finish = **Obsidian Neon**: near-black hull `#15131f`, neon-cyan accent
  `#21e6ff` (spine/ring/wing edges), dark-blue cockpit glass `#0a2030`, magenta
  engines `#ff3df0`, cyan halo `#21e6ff`.
- Unlock threshold = **1000** points in the mini-game, **any difficulty**.
- On unlock: **auto-equip** the Interceptor.
- A **Default | Interceptor switcher** lives in the existing Settings area
  (`SettingsControls`, shared by desktop ⚙ and mobile ☰), shown only once unlocked.
- The equipped ship appears in **both** the galaxy (orbiting ship) and the
  mini-game.

## Goals

- Add a second, premium ship model unlocked by skill in the mini-game.
- Make the reward visible everywhere (galaxy + mini-game) so it feels earned.
- Tease the locked ship on the mini-game start screen; celebrate the unlock.

## Non-goals

- More than one unlockable ship (the registry allows it; we ship exactly one).
- Per-difficulty unlocks or separate best scores.
- Gameplay effects from the ship (purely cosmetic).
- Photoreal art — the Interceptor is low-poly R3F primitives like the current ship.

---

## Architecture

### A. Ship-variant registry — `src/lib/ships.ts` (new, pure)

```ts
export type ShipVariantId = 'default' | 'interceptor';

export interface ShipVariant {
  id: ShipVariantId;
  name: string;        // display label, e.g. 'Interceptor'
  unlockScore: number; // 0 = always available
}

export const SHIP_VARIANTS: ShipVariant[] = [
  {id: 'default',     name: 'Standard',    unlockScore: 0},
  {id: 'interceptor', name: 'Interceptor', unlockScore: 1000},
];

export const INTERCEPTOR_UNLOCK = 1000;
export const isVariantUnlocked(id, best): boolean   // best >= that variant's unlockScore
export const isInterceptorUnlocked(best): boolean   // best >= INTERCEPTOR_UNLOCK
```

Pure and unit-tested. The threshold constant is the single source of truth used by
both the mini-game unlock check and the settings switcher's "unlocked" gate.

### B. Ship geometry

- **Default ship:** the existing `ShipModel` is unchanged and represents `'default'`.
- **Interceptor:** new `src/components/three/InterceptorShip.tsx` — low-poly
  primitives forming the dart silhouette: an elongated tapered hull (sharp +Z
  nose), two swept-back delta wings, a cyan accent spine along the hull, a cockpit
  dome, twin magenta engine cylinders at the rear, and an additive cyan halo
  sprite. Materials mirror `ShipModel`'s structure (MeshStandard hull/accent/glass,
  MeshBasic engine) with the Obsidian Neon colors, and the same dispose-on-unmount
  lifecycle.
  - **Drop-in constraint (critical):** forward = **+Z**, centered at the origin,
    and a bounding size close to `ShipModel`'s, so `Ship.tsx`'s per-preset scale,
    velocity-orientation, and `PlayerShip`'s `scale={1.6}` all work unchanged.
- **Dispatcher:** `src/components/three/ShipVariant.tsx` —
  `ShipVariant({variant}: {variant: ShipVariantId})` renders `<InterceptorShip/>`
  for `'interceptor'`, else `<ShipModel/>`. This is the only place consumers
  branch on variant.

### C. Persistence — `src/lib/prefs.ts` (extend)

- New key `galaxy.ship.model` storing the equipped `ShipVariantId`, default
  `'default'`. Add `getEquippedShip(): ShipVariantId` (validates against known ids,
  falls back to `'default'`) and `setEquippedShip(id: ShipVariantId)`.
- Unlock state is **derived** from the existing best score (`loadBest()` in
  `score.ts`) — no separate "unlocked" flag is stored.

### D. State ownership & flow

`GalaxyExperience` is the common parent of the galaxy `Scene` and the
`AsteroidGame` overlay, so it owns the equipped-ship state:

- `const [equippedShip, setEquippedShip] = useState(() => getEquippedShip())`
  (lazy init; client-only). Persist on change via a `useEffect` that calls
  `setEquippedShip(...)` in prefs (a localStorage write, allowed in an effect).
- `const interceptorUnlocked = isInterceptorUnlocked(loadBest())` recomputed each
  render (re-reads after the mini-game saves a new best, because an unlock also
  flips `equippedShip` → re-render).
- Passes to **`Scene`**: `equippedShip`, `onEquipShip` (= `setEquippedShip`),
  `interceptorUnlocked` → used by the galaxy `Ship` and threaded into the HUD
  Settings switcher.
- Passes to **`AsteroidGame`**: `equippedShip` (for the mini-game ship) and
  `onUnlockInterceptor` (= `() => setEquippedShip('interceptor')`).

Prop-drilling for the settings switcher follows the existing pattern
(`shipMinigameEnabled` etc.): `Scene → MobileHud/Hud → MobileMenu/SettingsMenu →
SettingsControls`.

### E. Unlock detection (in `AsteroidGame`)

`onGameOver` computes the unlock transition where prefs are reachable (the reducer
stays pure):

```ts
const onGameOver = useCallback((score: number) => {
  const prev = loadBest();
  const best = saveBest(score);
  const justUnlocked = prev < INTERCEPTOR_UNLOCK && best >= INTERCEPTOR_UNLOCK;
  if (justUnlocked) onUnlockInterceptor();      // auto-equip + persist (parent)
  dispatch({type: 'gameOver', score, best, justUnlocked});
}, [onUnlockInterceptor]);
```

`gameState.ts` gains an optional `justUnlocked: boolean` on `GameState`, set from
the `gameOver` action and reset to `false` by `start`/`retry`/`menu`.

### F. Mini-game UI — `GameHud.tsx`

- **Start menu (`phase === 'menu'`):**
  - If `!interceptorUnlocked`: a teaser block — a small greyed 2D Interceptor
    silhouette (a self-contained inline SVG component) + "Score 1000 to unlock the
    Interceptor!" and "Best {best} so far".
  - If unlocked: "✓ Interceptor unlocked — switch ships in Settings".
- **Game-over (`phase === 'over'`):**
  - If `state.justUnlocked`: a "🎉 Interceptor unlocked — equipped!" banner.
  - Else if `!interceptorUnlocked`: "Best {best} · 1000 to unlock the Interceptor".

`GameHud` needs `interceptorUnlocked` (derived in `AsteroidGame` from `loadBest()`)
in addition to `state`. The locked silhouette is a tiny presentational SVG
(`InterceptorIcon`), not the 3D model.

### G. Where the variant renders

- `Ship.tsx` (galaxy): replace `<ShipModel/>` with `<ShipVariant variant={variant}/>`,
  `variant` threaded from `Scene`.
- `PlayerShip.tsx` (mini-game): take a `variant` prop, render
  `<ShipVariant variant={variant}/>` inside its scale group; `AsteroidGame` passes
  `equippedShip` down through `GameScene`.

---

## File impact

**New**
- `src/lib/ships.ts` (+ test)
- `src/components/three/InterceptorShip.tsx` (+ render test)
- `src/components/three/ShipVariant.tsx` (+ render test)
- `src/components/minigame/InterceptorIcon.tsx` — the 2D teaser silhouette (or colocated in GameHud)

**Edit**
- `src/lib/prefs.ts` — equipped get/set (+ tests)
- `src/lib/minigame/gameState.ts` — `justUnlocked` (+ reducer tests)
- `src/components/minigame/AsteroidGame.tsx` — unlock detection, auto-equip, pass `variant` + `interceptorUnlocked`
- `src/components/minigame/GameScene.tsx` — thread `variant` to `PlayerShip`
- `src/components/minigame/PlayerShip.tsx` — render `ShipVariant`
- `src/components/minigame/GameHud.tsx` — teaser + celebration
- `src/components/three/Ship.tsx` — render `ShipVariant`
- `src/components/three/Scene.tsx` — accept + thread `equippedShip`/`onEquipShip`/`interceptorUnlocked`
- `src/components/GalaxyExperience.tsx` — own equipped state, derive unlocked, thread to Scene + AsteroidGame
- `src/components/hud/SettingsMenu.tsx` (`SettingsControls`) — ship switcher (shown when unlocked)
- `src/components/hud/MobileHud.tsx`, `Hud.tsx`, `MobileMenu.tsx` — thread switcher props

## Testing

Vitest + RTL, matching existing patterns (`fireEvent.click`, lazy `useState`
init, no setState-in-effect-body; R3F `@react-three/test-renderer` for ship
render tests):
- `ships.ts`: variant list, `isInterceptorUnlocked`/`isVariantUnlocked` thresholds.
- `prefs.ts`: `getEquippedShip` default `'default'`, validates unknown → default,
  round-trips; `setEquippedShip` persists.
- `gameState.ts`: `gameOver` sets `justUnlocked` true only when crossing 1000
  (prev < 1000 && new ≥ 1000); `start`/`retry`/`menu` reset it false.
- `GameHud`: locked teaser shows "1000" + silhouette when `!interceptorUnlocked`;
  celebration shows when `state.justUnlocked`; unlocked note when unlocked.
- `SettingsControls`: ship switcher hidden when locked; when unlocked, shows
  Default/Interceptor and clicking Interceptor calls `onEquipShip('interceptor')`.
- `InterceptorShip` + `ShipVariant`: mount without throwing; `ShipVariant`
  picks Interceptor for `'interceptor'`, default otherwise.

Gates (must stay green): `npm run test:run`, `npm run lint`, `npm run build`.

## Open / deferred

- The Interceptor's exact 3D proportions are an interpretation of the chosen 2D
  silhouette; tune visually with `next dev` after the model lands.
- Future ships: add an entry to `SHIP_VARIANTS` + a model component + a
  `ShipVariant` case; the switcher already iterates unlocked variants.
