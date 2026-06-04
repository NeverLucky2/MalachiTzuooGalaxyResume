# Mobile Galaxy Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 3D galaxy the default experience on phones and give it a touch-native HUD (☰-menu top, ◀ LAND ▶ thumb dock, swipe gestures), keeping the desktop HUD unchanged.

**Architecture:** A new `isCompact` signal (coarse pointer or width < 768) picks a new `MobileHud` over the existing desktop `Hud` inside `Scene`. Touch flicks are interpreted by a pure `classifyGesture` + a `useTouchGestures` hook that dispatches the same nav actions the buttons do. The landed view keeps the existing translucent `DetailPanel`; the swipe/scroll conflict is resolved for free because the panel sits (pointer-events-auto) above the canvas, so swipes that start on it never reach the gesture handler.

**Tech Stack:** Next.js 16 (App Router), React 19, React Three Fiber 9 / three 0.184, Tailwind v4, Vitest 4 + Testing Library (jsdom, `globals: true`, `@testing-library/jest-dom/vitest`).

**Spec:** `docs/superpowers/specs/2026-06-03-mobile-galaxy-design.md`
**Branch:** `mobile-galaxy` (already checked out). Run all commands from the `galaxy-resume/` directory.

---

## File Structure

**Create:**
- `src/lib/gesture.ts` — pure `classifyGesture(dx,dy,dtMs)` + threshold constants. One responsibility: flick math, DOM-free.
- `src/lib/gesture.test.ts`
- `src/hooks/useIsCompact.ts` — reactive `isCompact` boolean (matchMedia + resize).
- `src/hooks/useIsCompact.test.ts`
- `src/hooks/useTouchGestures.ts` — canvas pointerdown/up → nav dispatch via `classifyGesture`.
- `src/hooks/useTouchGestures.test.ts`
- `src/components/hud/ThumbDock.tsx` — bottom ◀ LAND ▶ dock.
- `src/components/hud/ThumbDock.test.tsx`
- `src/components/hud/MobileMenu.tsx` — ☰ button + full-screen overlay (identity, starmap, résumé/PDF).
- `src/components/hud/MobileMenu.test.tsx`
- `src/components/hud/CoachHint.tsx` — one-time dismissible hint.
- `src/components/hud/CoachHint.test.tsx`
- `src/components/hud/MobileHud.tsx` — composes the above + shared `DetailPanel`.
- `src/components/hud/MobileHud.test.tsx`

**Modify:**
- `src/lib/capabilities.ts` — `shouldUse3D` drops the coarse/width exclusion; add `COMPACT_MAX_WIDTH` + `isCompact()` pure helper.
- `src/lib/capabilities.test.ts` — update the small-touch-screen expectation; add `isCompact` tests.
- `src/hooks/useGalaxyControls.ts` — add `compact?` param; compact tap → `selectAndLand`.
- `src/hooks/useGalaxyControls.test.ts` — add a compact-tap test.
- `src/components/three/Scene.tsx` — choose `MobileHud` vs `Hud`; wire `useIsCompact`, `useTouchGestures`, and compact tap.
- `src/components/hud/DetailPanel.tsx` — mobile centering + safe-area on TAKE OFF.
- `src/app/layout.tsx` — `export const viewport` with `viewportFit: 'cover'` (enables `env(safe-area-inset-*)`).
- `src/components/GalaxyExperience.tsx` — safe-area insets on the "Galaxy view" button.

Desktop `Hud`, `StarmapLegend`, `PlanetLabels`, and the three/* scene components are NOT modified.

---

### Task 1: `shouldUse3D` + `isCompact` (capabilities)

**Files:**
- Modify: `src/lib/capabilities.ts`
- Test: `src/lib/capabilities.test.ts`

- [ ] **Step 1: Update the test file**

Replace the entire contents of `src/lib/capabilities.test.ts` with:

```ts
import {describe, it, expect} from 'vitest';
import {shouldUse3D, isCompact} from './capabilities';

describe('shouldUse3D', () => {
  const base = {hasWebGL: true, reducedMotion: false, coarsePointer: false, width: 1280};
  it('true on a capable desktop', () => expect(shouldUse3D(base)).toBe(true));
  it('false without WebGL', () => expect(shouldUse3D({...base, hasWebGL: false})).toBe(false));
  it('false with reduced motion', () => expect(shouldUse3D({...base, reducedMotion: true})).toBe(false));
  it('true on small touch screens (phones now boot into the galaxy)', () =>
    expect(shouldUse3D({...base, coarsePointer: true, width: 600})).toBe(true));
});

describe('isCompact', () => {
  it('true for a coarse pointer even on a wide screen', () =>
    expect(isCompact({coarsePointer: true, width: 1280})).toBe(true));
  it('true for a narrow viewport with a fine pointer', () =>
    expect(isCompact({coarsePointer: false, width: 600})).toBe(true));
  it('false for a wide fine-pointer desktop', () =>
    expect(isCompact({coarsePointer: false, width: 1280})).toBe(false));
  it('boundary: width 768 is not compact', () =>
    expect(isCompact({coarsePointer: false, width: 768})).toBe(false));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/capabilities.test.ts`
Expected: FAIL — `isCompact` is not exported, and the small-touch-screen case still returns false.

- [ ] **Step 3: Edit `capabilities.ts`**

In `src/lib/capabilities.ts`, delete this line from `shouldUse3D`:

```ts
  if (c.coarsePointer && c.width < 820) return false;
```

so the function reads:

```ts
export function shouldUse3D(c: Caps): boolean {
  if (!c.hasWebGL) return false;
  if (c.reducedMotion) return false;
  return true;
}
```

Then add, directly below `shouldUse3D` (before `detectCaps`):

```ts
/** Viewport width (px) below which the touch-native compact HUD is used. */
export const COMPACT_MAX_WIDTH = 768;

/** True when the compact (touch) HUD should render: coarse pointer OR narrow viewport. */
export function isCompact(c: {coarsePointer: boolean; width: number}): boolean {
  return c.coarsePointer || c.width < COMPACT_MAX_WIDTH;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/capabilities.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/capabilities.ts src/lib/capabilities.test.ts
git commit -m "feat(mobile): phones boot into galaxy; add isCompact helper"
```

---

### Task 2: `useIsCompact` hook

**Files:**
- Create: `src/hooks/useIsCompact.ts`
- Test: `src/hooks/useIsCompact.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useIsCompact.test.ts`:

```ts
import {describe, it, expect, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useIsCompact} from './useIsCompact';

function setEnv({coarse, width}: {coarse: boolean; width: number}) {
  Object.defineProperty(window, 'innerWidth', {value: width, configurable: true, writable: true});
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('coarse') ? coarse : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('useIsCompact', () => {
  it('true for a coarse pointer on a wide screen', () => {
    setEnv({coarse: true, width: 1280});
    const {result} = renderHook(() => useIsCompact());
    expect(result.current).toBe(true);
  });
  it('true for a narrow screen with a fine pointer', () => {
    setEnv({coarse: false, width: 500});
    const {result} = renderHook(() => useIsCompact());
    expect(result.current).toBe(true);
  });
  it('false for a wide fine-pointer desktop', () => {
    setEnv({coarse: false, width: 1280});
    const {result} = renderHook(() => useIsCompact());
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useIsCompact.test.ts`
Expected: FAIL — module `./useIsCompact` does not exist.

- [ ] **Step 3: Write the hook**

Create `src/hooks/useIsCompact.ts`:

```ts
'use client';
import {useEffect, useState} from 'react';
import {isCompact} from '@/lib/capabilities';

/** Read the current compact state from the live window. SSR-safe (returns false). */
function read(): boolean {
  if (typeof window === 'undefined') return false;
  return isCompact({
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    width: window.innerWidth,
  });
}

/**
 * Reactive `isCompact` — recomputes on resize, orientation change, and pointer
 * media changes so a rotated phone or resized window flips HUDs correctly.
 * `Scene` is client-only (dynamic import, ssr:false), so reading window on the
 * first render is safe.
 */
export function useIsCompact(): boolean {
  const [compact, setCompact] = useState<boolean>(read);
  useEffect(() => {
    const update = () => setCompact(read());
    update();
    const mq = window.matchMedia('(pointer: coarse)');
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    mq.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      mq.removeEventListener('change', update);
    };
  }, []);
  return compact;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useIsCompact.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useIsCompact.ts src/hooks/useIsCompact.test.ts
git commit -m "feat(mobile): reactive useIsCompact hook"
```

---

### Task 3: `classifyGesture` (pure flick math)

**Files:**
- Create: `src/lib/gesture.ts`
- Test: `src/lib/gesture.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/gesture.test.ts`:

```ts
import {describe, it, expect} from 'vitest';
import {classifyGesture, MIN_FLICK_DISTANCE, MAX_FLICK_MS} from './gesture';

describe('classifyGesture', () => {
  it('fast left flick → next', () => expect(classifyGesture(-80, 5, 150)).toBe('next'));
  it('fast right flick → prev', () => expect(classifyGesture(80, -5, 150)).toBe('prev'));
  it('fast up flick → land', () => expect(classifyGesture(5, -80, 150)).toBe('land'));
  it('fast down flick → takeOff', () => expect(classifyGesture(-5, 80, 150)).toBe('takeOff'));
  it('too slow → look', () => expect(classifyGesture(-80, 0, MAX_FLICK_MS + 50)).toBe('look'));
  it('too small → look', () => expect(classifyGesture(MIN_FLICK_DISTANCE - 1, 0, 100)).toBe('look'));
  it('diagonal resolves to dominant horizontal', () => expect(classifyGesture(-90, 50, 150)).toBe('next'));
  it('diagonal resolves to dominant vertical', () => expect(classifyGesture(20, -90, 150)).toBe('land'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/gesture.test.ts`
Expected: FAIL — module `./gesture` does not exist.

- [ ] **Step 3: Write the implementation**

Create `src/lib/gesture.ts`:

```ts
export type Gesture = 'next' | 'prev' | 'land' | 'takeOff' | 'look';

/** Min pointer travel (px) for a move to count as a flick rather than a look-drag. */
export const MIN_FLICK_DISTANCE = 45;
/** Max duration (ms) for a move to count as a quick flick. */
export const MAX_FLICK_MS = 400;

/**
 * Classify a canvas pointer interaction. `dx/dy` are end−start in px (dy<0 = up),
 * `dtMs` the elapsed time. A quick, far-enough flick maps to a nav gesture by its
 * dominant axis; anything slow or small is a free-look drag.
 *
 *   horizontal: left (dx<0) → next (outward),  right (dx>0) → prev (inward)
 *   vertical:   up   (dy<0) → land,            down (dy>0)  → takeOff
 */
export function classifyGesture(dx: number, dy: number, dtMs: number): Gesture {
  if (dtMs > MAX_FLICK_MS) return 'look';
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (Math.max(adx, ady) < MIN_FLICK_DISTANCE) return 'look';
  if (adx >= ady) return dx < 0 ? 'next' : 'prev';
  return dy < 0 ? 'land' : 'takeOff';
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/gesture.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/gesture.ts src/lib/gesture.test.ts
git commit -m "feat(mobile): classifyGesture flick math"
```

---

### Task 4: `useTouchGestures` hook

**Files:**
- Create: `src/hooks/useTouchGestures.ts`
- Test: `src/hooks/useTouchGestures.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/useTouchGestures.test.ts`:

```ts
import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useTouchGestures} from './useTouchGestures';
import {initialNav} from '@/lib/navigation';

// jsdom's PointerEvent doesn't carry clientX/Y reliably; attach them to a plain Event.
function up(x: number, y: number) {
  const e = new Event('pointerup');
  Object.assign(e, {clientX: x, clientY: y});
  window.dispatchEvent(e);
}

describe('useTouchGestures', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  beforeEach(() => {dispatch = vi.fn();});
  afterEach(() => vi.clearAllMocks());

  it('fast left flick (not landed) → next', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 200, clientY: 100}); up(100, 105);});
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type: 'next'}));
  });

  it('fast up flick (not landed) → land', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 100, clientY: 300}); up(105, 200);});
    expect(dispatch).toHaveBeenCalledWith({type: 'land'});
  });

  it('while landed: down flick → takeOff and travel flicks are ignored', () => {
    const nav = {...initialNav(), landed: true};
    const {result} = renderHook(() => useTouchGestures({nav, dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 100, clientY: 100}); up(105, 220);});
    expect(dispatch).toHaveBeenCalledWith({type: 'takeOff'});
    dispatch.mockClear();
    act(() => {result.current.onPointerDown({clientX: 200, clientY: 100}); up(100, 105);});
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('small/slow move → look (no dispatch)', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 100, clientY: 100}); up(108, 104);});
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('disabled → never dispatches', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: false}));
    act(() => {result.current.onPointerDown({clientX: 200, clientY: 100}); up(100, 105);});
    expect(dispatch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useTouchGestures.test.ts`
Expected: FAIL — module `./useTouchGestures` does not exist.

- [ ] **Step 3: Write the hook**

Create `src/hooks/useTouchGestures.ts`:

```ts
'use client';
import {useCallback, useEffect, useRef} from 'react';
import {PLANETS} from '@/data/planets';
import {classifyGesture} from '@/lib/gesture';
import type {NavState, NavAction} from '@/lib/navigation';

const N = PLANETS.length;

/**
 * Touch flick gestures for the compact HUD. Records the start point on canvas
 * pointerdown and classifies on the window pointerup. Travel/land flicks act only
 * while flying; the take-off flick acts only while landed.
 *
 * The swipe-down-to-take-off vs panel-scroll conflict is resolved by layering:
 * the landed DetailPanel is a `pointer-events-auto` sibling ABOVE the canvas, so a
 * touch that begins on the panel never reaches this canvas handler — it scrolls.
 * Only touches that begin on the bare canvas (around the planet) can take off.
 *
 * Returns `{onPointerDown}` to attach to <Canvas> (composed with the free-look
 * drag handler). No-ops entirely when `enabled` is false.
 */
export function useTouchGestures({
  nav,
  dispatch,
  enabled,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  enabled: boolean;
}) {
  const navRef = useRef(nav);
  navRef.current = nav;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const start = useRef<{x: number; y: number; t: number} | null>(null);

  const onPointerDown = useCallback((e: {clientX: number; clientY: number}) => {
    if (!enabledRef.current) return;
    start.current = {x: e.clientX, y: e.clientY, t: performance.now()};
  }, []);

  useEffect(() => {
    const onUp = (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!enabledRef.current || !s) return;
      const g = classifyGesture(e.clientX - s.x, e.clientY - s.y, performance.now() - s.t);
      if (g === 'look') return;
      if (navRef.current.landed) {
        if (g === 'takeOff') dispatch({type: 'takeOff'});
        return;
      }
      if (g === 'next') dispatch({type: 'next', n: N});
      else if (g === 'prev') dispatch({type: 'prev', n: N});
      else if (g === 'land') dispatch({type: 'land'});
      // 'takeOff' while flying → ignored
    };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, [dispatch]);

  return {onPointerDown};
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useTouchGestures.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTouchGestures.ts src/hooks/useTouchGestures.test.ts
git commit -m "feat(mobile): useTouchGestures flick navigation"
```

---

### Task 5: Compact tap → `selectAndLand` (useGalaxyControls)

**Files:**
- Modify: `src/hooks/useGalaxyControls.ts`
- Test: `src/hooks/useGalaxyControls.test.ts`

- [ ] **Step 1: Add the failing test**

Append this block inside the existing `describe('useGalaxyControls — onSelect (click-to-fly) handler', ...)` in `src/hooks/useGalaxyControls.test.ts` (just before its closing `});`):

```ts
  it('compact: selecting any planet → selectAndLand', () => {
    const nav = {...initialNav(), current: 1};
    const {result} = renderHook(() =>
      useGalaxyControls({nav, dispatch, motion, compact: true}),
    );
    act(() => result.current.onSelect(4));
    expect(dispatch).toHaveBeenCalledWith({type: 'selectAndLand', index: 4});
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/hooks/useGalaxyControls.test.ts`
Expected: FAIL — `compact` is not a parameter, so `onSelect(4)` from `current:1` dispatches `goTo`, not `selectAndLand`.

- [ ] **Step 3: Edit `useGalaxyControls.ts`**

Change the hook signature to accept `compact`:

```ts
export function useGalaxyControls({
  nav,
  dispatch,
  motion,
  compact = false,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  motion: MotionState;
  /** Compact (touch) mode: a tap on any planet flies in and lands in one action. */
  compact?: boolean;
}) {
```

Add a ref next to `navRef` (just after `navRef.current = nav;`):

```ts
  const compactRef = useRef(compact);
  compactRef.current = compact;
```

Replace the `onSelect` callback body's branch so it reads:

```ts
  const onSelect = useCallback(
    (index: number) => {
      const cur = navRef.current;
      if (cur.landed) return;
      if (compactRef.current || cur.preset === 'TOP-DOWN') dispatch({type: 'selectAndLand', index});
      else if (index === cur.current) dispatch({type: 'land'});
      else dispatch({type: 'goTo', index, n: N});
    },
    [dispatch],
  );
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/hooks/useGalaxyControls.test.ts`
Expected: PASS (existing tests + the new compact test).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGalaxyControls.ts src/hooks/useGalaxyControls.test.ts
git commit -m "feat(mobile): compact tap flies in and lands in one tap"
```

---

### Task 6: `ThumbDock` component

**Files:**
- Create: `src/components/hud/ThumbDock.tsx`
- Test: `src/components/hud/ThumbDock.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/ThumbDock.test.tsx`:

```tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ThumbDock} from './ThumbDock';
import {initialNav} from '@/lib/navigation';
import {PLANETS} from '@/data/planets';

describe('ThumbDock', () => {
  it('LAND dispatches land', () => {
    const dispatch = vi.fn();
    render(<ThumbDock nav={initialNav()} dispatch={dispatch} />);
    screen.getByRole('button', {name: /land/i}).click();
    expect(dispatch).toHaveBeenCalledWith({type: 'land'});
  });

  it('inward is disabled at the first section', () => {
    render(<ThumbDock nav={{...initialNav(), current: 0}} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', {name: /inward/i})).toBeDisabled();
  });

  it('outward is disabled at the last section and dispatches next otherwise', () => {
    const dispatch = vi.fn();
    const {rerender} = render(<ThumbDock nav={initialNav()} dispatch={dispatch} />);
    screen.getByRole('button', {name: /outward/i}).click();
    expect(dispatch).toHaveBeenCalledWith({type: 'next', n: PLANETS.length});
    rerender(<ThumbDock nav={{...initialNav(), current: PLANETS.length - 1}} dispatch={dispatch} />);
    expect(screen.getByRole('button', {name: /outward/i})).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/hud/ThumbDock.test.tsx`
Expected: FAIL — module `./ThumbDock` does not exist.

- [ ] **Step 3: Write the component**

Create `src/components/hud/ThumbDock.tsx`:

```tsx
'use client';
import {PLANETS} from '@/data/planets';
import type {NavState, NavAction} from '@/lib/navigation';

/** Bottom thumb dock for the compact HUD: ◀ inward · LAND · outward ▶. */
export function ThumbDock({
  nav,
  dispatch,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
}) {
  const n = PLANETS.length;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 grid grid-cols-[1fr_1.3fr_1fr] items-end gap-2 px-4 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3">
      <DockButton aria-label="Inward" onClick={() => dispatch({type: 'prev', n})} disabled={nav.current === 0}>
        ◀
      </DockButton>
      <DockButton aria-label="Land" land onClick={() => dispatch({type: 'land'})}>
        LAND
      </DockButton>
      <DockButton aria-label="Outward" onClick={() => dispatch({type: 'next', n})} disabled={nav.current === n - 1}>
        ▶
      </DockButton>
    </div>
  );
}

function DockButton({
  children,
  onClick,
  disabled,
  land,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  land?: boolean;
  'aria-label': string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`pointer-events-auto rounded-2xl border py-4 text-center font-display text-base font-bold text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:opacity-35 ${
        land
          ? 'border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 text-white shadow-[0_0_16px_#ff3df0]'
          : 'border-[#21e6ff]/50 bg-[#0a0a1f]/70 shadow-[0_0_14px_rgba(33,230,255,.3)]'
      }`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/hud/ThumbDock.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/hud/ThumbDock.tsx src/components/hud/ThumbDock.test.tsx
git commit -m "feat(mobile): ThumbDock bottom navigation"
```

---

### Task 7: `MobileMenu` component

**Files:**
- Create: `src/components/hud/MobileMenu.tsx`
- Test: `src/components/hud/MobileMenu.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/MobileMenu.test.tsx`:

```tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MobileMenu} from './MobileMenu';
import {initialNav} from '@/lib/navigation';

describe('MobileMenu', () => {
  it('is closed until ☰ is pressed, then shows identity + sections', () => {
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByText(/MALACHI TZUOO/)).toBeNull();
    screen.getByRole('button', {name: /menu/i}).click();
    expect(screen.getByText(/MALACHI TZUOO/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /about/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /contact/i})).toBeInTheDocument();
  });

  it('tapping a section dispatches selectAndLand', () => {
    const dispatch = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={dispatch} onSkip={vi.fn()} />);
    screen.getByRole('button', {name: /menu/i}).click();
    screen.getByRole('button', {name: /experience/i}).click();
    expect(dispatch).toHaveBeenCalledWith({type: 'selectAndLand', index: 1});
  });

  it('Résumé button calls onSkip', () => {
    const onSkip = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={onSkip} />);
    screen.getByRole('button', {name: /menu/i}).click();
    screen.getByRole('button', {name: /résumé/i}).click();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/hud/MobileMenu.test.tsx`
Expected: FAIL — module `./MobileMenu` does not exist.

- [ ] **Step 3: Write the component**

Create `src/components/hud/MobileMenu.tsx`:

```tsx
'use client';
import {useEffect, useState} from 'react';
import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import type {ContentBlock} from '@/data/types';
import type {NavState, NavAction} from '@/lib/navigation';

// Reuse the résumé section's PDF download (DRY — single source of the href/label).
const PDF = CONTENT.resume.find(
  (b): b is Extract<ContentBlock, {kind: 'download'}> => b.kind === 'download',
);

/**
 * The only persistent top control on mobile: a ☰ button that opens a full-screen
 * overlay holding identity, the starmap (tap a row = fly + land), and the
 * résumé/PDF escape. Closes on ✕, tap-away, Escape, or choosing a section.
 */
export function MobileMenu({
  nav,
  dispatch,
  onSkip,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="pointer-events-auto fixed right-[calc(12px+env(safe-area-inset-right))] top-[calc(12px+env(safe-area-inset-top))] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[#21e6ff]/50 bg-[#0a0a1f]/70 text-xl text-[#9fe9ff] shadow-[0_0_14px_rgba(33,230,255,.3)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#05030f]/90 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full flex-col gap-4 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-lg font-black text-transparent">
                  MALACHI TZUOO
                </div>
                <div className="mt-1 text-[11px] text-[#9fb6cf]">
                  LV.26 · SOFTWARE ENGINEER · 🛰 AWS CERTIFIED
                </div>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-[#9fe9ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                ✕
              </button>
            </div>

            <div className="font-display text-[10px] uppercase tracking-[2px] text-[#7fb0c9]">
              ◇ Starmap — jump anywhere
            </div>
            <nav className="flex flex-col gap-1">
              {PLANETS.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    dispatch({type: 'selectAndLand', index: i});
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300 ${
                    i === nav.current ? 'bg-[#21e6ff]/[.12] shadow-[inset_0_0_0_1px_rgba(33,230,255,.4)]' : ''
                  }`}
                >
                  <span
                    className="h-3 w-3 flex-none rounded-full"
                    style={{background: p.glow, boxShadow: `0 0 8px ${p.glow}`}}
                  />
                  <span>{p.label}</span>
                  <span className="ml-auto font-display text-[10px] opacity-50">{`0${i + 1}`}</span>
                </button>
              ))}
            </nav>

            <div className="mt-auto flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSkip();
                }}
                className="pointer-events-auto flex-1 rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 py-3 text-center font-display text-sm text-cyan-200"
              >
                📄 Résumé
              </button>
              {PDF && (
                <a
                  href={PDF.href}
                  className="flex-1 rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 py-3 text-center font-display text-sm text-cyan-200"
                >
                  ⬇ PDF
                </a>
              )}
            </div>
            <div className="text-center text-[10px] text-[#6f93a9]">drag to look · swipe to travel</div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/hud/MobileMenu.test.tsx`
Expected: PASS (3 tests). Note: `/résumé/i` (accented) matches only the "📄 Résumé" button, not the "RESUME" starmap row.

- [ ] **Step 5: Commit**

```bash
git add src/components/hud/MobileMenu.tsx src/components/hud/MobileMenu.test.tsx
git commit -m "feat(mobile): MobileMenu overlay (identity, starmap, resume/PDF)"
```

---

### Task 8: `CoachHint` component

**Files:**
- Create: `src/components/hud/CoachHint.tsx`
- Test: `src/components/hud/CoachHint.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/CoachHint.test.tsx`:

```tsx
import {describe, it, expect, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {CoachHint} from './CoachHint';

describe('CoachHint', () => {
  beforeEach(() => localStorage.clear());

  it('shows on first load', () => {
    render(<CoachHint />);
    expect(screen.getByText(/swipe to travel/i)).toBeInTheDocument();
  });

  it('hides and persists after "Got it"', () => {
    render(<CoachHint />);
    screen.getByRole('button', {name: /got it/i}).click();
    expect(screen.queryByText(/swipe to travel/i)).toBeNull();
    expect(localStorage.getItem('galaxy.coach.dismissed')).toBe('1');
  });

  it('does not show when already dismissed', () => {
    localStorage.setItem('galaxy.coach.dismissed', '1');
    render(<CoachHint />);
    expect(screen.queryByText(/swipe to travel/i)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/hud/CoachHint.test.tsx`
Expected: FAIL — module `./CoachHint` does not exist.

- [ ] **Step 3: Write the component**

Create `src/components/hud/CoachHint.tsx`:

```tsx
'use client';
import {useEffect, useState} from 'react';

const KEY = 'galaxy.coach.dismissed';

/** One-time, dismissible hint shown on first compact galaxy load. */
export function CoachHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== '1') setShow(true);
    } catch {
      /* storage blocked (private mode) → just don't show */
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 flex justify-center px-6">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#21e6ff]/40 bg-[#0a0a1f]/85 px-4 py-3 text-center text-xs text-[#cfe6f5] shadow-[0_0_18px_rgba(33,230,255,.3)] backdrop-blur-md">
        <span>swipe to travel · tap a planet to land · drag to look</span>
        <button
          type="button"
          onClick={dismiss}
          className="flex-none rounded-lg border border-[#21e6ff]/50 px-2 py-1 font-display text-[11px] text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/hud/CoachHint.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/hud/CoachHint.tsx src/components/hud/CoachHint.test.tsx
git commit -m "feat(mobile): first-time CoachHint"
```

---

### Task 9: `MobileHud` (composition)

**Files:**
- Create: `src/components/hud/MobileHud.tsx`
- Test: `src/components/hud/MobileHud.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/MobileHud.test.tsx`:

```tsx
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MobileHud} from './MobileHud';
import {initialNav} from '@/lib/navigation';

describe('MobileHud', () => {
  beforeEach(() => localStorage.clear());

  it('while flying: shows the ☰ menu and the dock', () => {
    render(<MobileHud nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByRole('button', {name: /menu/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /land/i})).toBeInTheDocument();
  });

  it('while landed: hides the menu/dock and shows the detail panel TAKE OFF', () => {
    render(<MobileHud nav={{...initialNav(), landed: true}} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByRole('button', {name: /menu/i})).toBeNull();
    expect(screen.queryByRole('button', {name: /^land$/i})).toBeNull();
    expect(screen.getByRole('button', {name: /take off/i})).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/components/hud/MobileHud.test.tsx`
Expected: FAIL — module `./MobileHud` does not exist.

- [ ] **Step 3: Write the component**

Create `src/components/hud/MobileHud.tsx`:

```tsx
'use client';
import type {NavState, NavAction} from '@/lib/navigation';
import {MobileMenu} from './MobileMenu';
import {ThumbDock} from './ThumbDock';
import {CoachHint} from './CoachHint';
import {DetailPanel} from './DetailPanel';

/**
 * Compact (touch) HUD. While flying: ☰ menu + thumb dock + coach hint. While
 * landed: only the shared translucent DetailPanel (planet stays visible behind).
 */
export function MobileHud({
  nav,
  dispatch,
  onSkip,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
}) {
  return (
    <>
      {!nav.landed && (
        <>
          <MobileMenu nav={nav} dispatch={dispatch} onSkip={onSkip} />
          <ThumbDock nav={nav} dispatch={dispatch} />
          <CoachHint />
        </>
      )}
      <DetailPanel nav={nav} onTakeOff={() => dispatch({type: 'takeOff'})} />
    </>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/components/hud/MobileHud.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/hud/MobileHud.tsx src/components/hud/MobileHud.test.tsx
git commit -m "feat(mobile): MobileHud composition"
```

---

### Task 10: Wire the compact HUD into `Scene`

**Files:**
- Modify: `src/components/three/Scene.tsx`

No unit test: `Scene` mounts a live R3F `<Canvas>` plus DOM HUD and isn't unit-tested today. Verify via the full suite + `build` (Task 12) and the manual checks below. Logic it depends on (`useIsCompact`, `useTouchGestures`, `useGalaxyControls`, the HUD components) is already covered by Tasks 1–9.

- [ ] **Step 1: Add imports**

In `src/components/three/Scene.tsx`, add to the imports:

```ts
import {useIsCompact} from '@/hooks/useIsCompact';
import {useTouchGestures} from '@/hooks/useTouchGestures';
import {MobileHud} from '@/components/hud/MobileHud';
```

- [ ] **Step 2: Compute compact + gestures, pass compact to controls**

Inside `Scene`, replace the controls line:

```ts
  const {boost, onSelect, onPointerDown} = useGalaxyControls({
    nav,
    dispatch,
    motion: motion.current,
  });
```

with:

```ts
  const isCompact = useIsCompact();
  const {boost, onSelect, onPointerDown} = useGalaxyControls({
    nav,
    dispatch,
    motion: motion.current,
    compact: isCompact,
  });
  const gestures = useTouchGestures({nav, dispatch, enabled: isCompact});
```

- [ ] **Step 3: Compose the canvas pointer-down handler**

Change the `<Canvas>` prop:

```tsx
          onPointerDown={(e) => onPointerDown(e)}
```

to:

```tsx
          onPointerDown={(e) => {
            onPointerDown(e);
            gestures.onPointerDown(e);
          }}
```

- [ ] **Step 4: Select the HUD by compact state**

Replace the trailing HUD line:

```tsx
      {/* DOM overlay HUD — sibling of the Canvas, NOT inside it. */}
      <Hud nav={nav} dispatch={dispatch} onSkip={onSkip} boost={boost} />
```

with:

```tsx
      {/* DOM overlay HUD — sibling of the Canvas, NOT inside it. Compact (touch)
          devices and narrow windows get the MobileHud; desktop keeps the full Hud. */}
      {isCompact ? (
        <MobileHud nav={nav} dispatch={dispatch} onSkip={onSkip} />
      ) : (
        <Hud nav={nav} dispatch={dispatch} onSkip={onSkip} boost={boost} />
      )}
```

- [ ] **Step 5: Verify the suite still passes and it type-checks via build**

Run: `npx vitest run` then `npm run build`
Expected: tests PASS; build completes the static export with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/three/Scene.tsx
git commit -m "feat(mobile): render MobileHud + touch gestures on compact devices"
```

---

### Task 11: Safe-area viewport + DetailPanel mobile fit

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/hud/DetailPanel.tsx`
- Modify: `src/components/GalaxyExperience.tsx`

- [ ] **Step 1: Add the viewport export (enables `env(safe-area-inset-*)`)**

In `src/app/layout.tsx`, change the type import:

```ts
import type {Metadata} from 'next';
```

to:

```ts
import type {Metadata, Viewport} from 'next';
```

and add, directly after the `export const metadata: Metadata = { ... };` block:

```ts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#05030f',
};
```

- [ ] **Step 2: Make the DetailPanel centered on mobile + clear the home-bar**

In `src/components/hud/DetailPanel.tsx`, change the TAKE OFF button className offsets from:

```tsx
        className="pointer-events-auto absolute bottom-5 left-6 rounded-xl border border-[#ff3df0] ...
```

to use safe-area-aware offsets (keep the rest of the class string identical):

```tsx
        className="pointer-events-auto absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-[calc(1.5rem+env(safe-area-inset-left))] rounded-xl border border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 px-[18px] py-3 font-display text-[13px] font-bold tracking-wide text-white shadow-[0_0_16px_#ff3df0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
```

Then change the panel container className from:

```tsx
        className="pointer-events-auto absolute right-[4%] top-1/2 max-h-[84vh] w-[min(440px,92vw)] -translate-y-1/2 overflow-auto rounded-[18px] border bg-[#080818]/85 pb-6 backdrop-blur-md"
```

to (mobile: centered, slightly shorter so it clears the TAKE OFF button; `sm:` restores the desktop right-side placement):

```tsx
        className="pointer-events-auto absolute left-1/2 right-auto top-1/2 max-h-[72vh] w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[18px] border bg-[#080818]/85 pb-6 backdrop-blur-md sm:left-auto sm:right-[4%] sm:max-h-[84vh] sm:translate-x-0"
```

- [ ] **Step 3: Safe-area for the "Galaxy view" button (resume mode)**

In `src/components/GalaxyExperience.tsx`, change the button className start from:

```tsx
      className="fixed right-4 top-4 z-30 rounded-xl border border-cyan-400/60 ...
```

to:

```tsx
      className="fixed right-[calc(1rem+env(safe-area-inset-right))] top-[calc(1rem+env(safe-area-inset-top))] z-30 rounded-xl border border-cyan-400/60 bg-[#0a0a1f]/70 px-4 py-2.5 font-display text-sm text-cyan-200 shadow-[0_0_16px_rgba(33,230,255,.4)] backdrop-blur-md transition hover:bg-[#0a0a1f]/90 hover:shadow-[0_0_22px_rgba(33,230,255,.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
```

- [ ] **Step 4: Verify existing tests still pass + build**

Run: `npx vitest run src/components/hud/DetailPanel.test.tsx src/components/GalaxyExperience.test.tsx` then `npm run build`
Expected: tests PASS (class-only changes don't affect content/roles); build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/components/hud/DetailPanel.tsx src/components/GalaxyExperience.tsx
git commit -m "feat(mobile): safe-area viewport + mobile DetailPanel fit"
```

---

### Task 12: Full verification & manual mobile pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test:run`
Expected: PASS — all prior tests plus the ~24 new ones (gesture 8, capabilities +5, useIsCompact 3, useTouchGestures 5, useGalaxyControls +1, ThumbDock 3, MobileMenu 3, CoachHint 3, MobileHud 2).

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Production build (static export)**

Run: `npm run build`
Expected: completes, emits `out/`, no type errors.

- [ ] **Step 4: Manual mobile checks**

Run: `npm run dev`, open the site, and in browser devtools toggle device emulation (e.g. iPhone 14, 390×844). Verify:
  - Loads straight into the galaxy (no manual toggle needed).
  - Top shows only the ☰ button (no identity chip, no résumé button); ☰ opens the overlay; a starmap row flies in and lands; ✕/tap-away/Escape close it.
  - Bottom dock ◀ LAND ▶ is reachable by thumb, not under the home-bar; ◀ disabled on About, ▶ disabled on Contact.
  - Swipe left/right travels; swipe up lands; on a planet, swipe down (starting off the panel) takes off; the landed panel scrolls without taking off; tapping a planet flies in + lands.
  - Coach hint appears once; "Got it" dismisses it; reload shows it stays dismissed.
  - Resize the window wide (> 768, fine pointer): the desktop HUD returns.
  - With OS "reduce motion" on: the 2D résumé fallback loads instead (galaxy not forced).

- [ ] **Step 5: Final commit (if any manual fixups were needed)**

```bash
git add -A
git commit -m "chore(mobile): verification pass"
```

(Skip if Step 4 needed no changes.)

---

## Plan Self-Review

- **Spec coverage:** Entry policy → Task 1; `isCompact` → Tasks 1–2; HUD layout (☰ menu, thumb dock, dropped V/boost) → Tasks 6,7,9,10; gestures + landed conflict + compact tap → Tasks 3,4,5,10; landed translucent panel → Task 11; coach hint → Task 8; safe-area → Tasks 6,7,8,11; non-goals (no perf/2D restyle) respected. All spec sections map to a task.
- **Placeholders:** none — every code step has complete code and exact commands.
- **Type consistency:** `NavAction` types (`next`/`prev`/`land`/`takeOff`/`selectAndLand`) match `navigation.ts`; `Gesture` union is consistent across `gesture.ts` and `useTouchGestures`; `isCompact` signature `{coarsePointer,width}` matches between `capabilities.ts`, its test, and `useIsCompact`; `MobileHud`/`MobileMenu`/`ThumbDock` props (`nav`,`dispatch`,`onSkip`) match call sites; PDF block narrowed via `Extract<ContentBlock,{kind:'download'}>` matches `types.ts`.
```
