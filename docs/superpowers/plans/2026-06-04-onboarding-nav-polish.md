# Onboarding & Navigation Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opening spotlight walkthrough, a toggle to disable ship-tap launching, a top-left Take Off button with a first-land tip, a name-tag→résumé shortcut, a smooth mobile camera drag, and a clearly-visible mini-game back button.

**Architecture:** A small `prefs.ts` centralizes the localStorage flags. A new `Walkthrough` component (driven by pure `walkthrough.ts` step data) overlays the live HUD and rings real controls via `data-tour` attributes; `Scene` owns its show/replay state and the ship-toggle state, threading both into the HUDs. The camera fix is CSS `touch-action: none` plus a `pointercancel` handler. The mini-game back button becomes a round icon and the overlay sizes to the dynamic viewport.

**Tech Stack:** Next.js 16, React 19, React Three Fiber 9 / three 0.184, Tailwind v4, Vitest 4 + Testing Library.

**Conventions (match these):**
- This repo pins breaking versions; read `node_modules/next/dist/docs/` before Next-specific work (see `AGENTS.md`).
- Tests: Vitest + RTL. Use `fireEvent.click` (not raw `.click()`) for buttons that flip local state. Use `vi.useFakeTimers()` + `act(() => vi.advanceTimersByTime(...))` for delays. `beforeEach(() => localStorage.clear())` when a test touches storage.
- eslint-plugin-react-hooks v7: **no synchronous `setState` in an effect body** (use a lazy `useState(() => …)` initializer instead), and **no ref mutation during render**.
- Client-only components that read `window`/`localStorage` at init are fine here — the galaxy HUD lives inside the `ssr:false` `Scene`.
- Gates after every task: `npm run test:run`, `npm run lint`, `npm run build`.

---

## File Structure

**Create**
- `src/lib/prefs.ts` — typed localStorage flag helpers (tour done, ship-minigame enabled, take-off tip seen).
- `src/lib/walkthrough.ts` — pure `tourSteps(compact)` step data.
- `src/components/hud/Walkthrough.tsx` — spotlight tour overlay.
- `src/components/hud/SettingsMenu.tsx` — desktop ⚙ popover (ship toggle + replay).
- Test files alongside each.

**Modify**
- `src/hooks/useGalaxyControls.ts` — `pointercancel` ends the drag.
- `src/app/globals.css` — `touch-action: none` on the galaxy canvas.
- `src/components/three/Scene.tsx` — canvas class; own tour + ship-toggle state; thread props; gate `Ship.onLaunch`.
- `src/components/three/Ship.tsx` — (no change needed; already gates the hit-sphere on `onLaunch`).
- `src/components/GalaxyExperience.tsx` — drop `MinigameHint` + `discovered` wiring.
- `src/components/hud/MobileHud.tsx` — drop `CoachHint`; thread new props; name-tag→résumé.
- `src/components/hud/IdentityChip.tsx` — interactive name tag + `data-tour="name"`.
- `src/components/hud/ThumbDock.tsx` — `data-tour` on LAND and ▶.
- `src/components/hud/MobileMenu.tsx` — Settings block (toggle + replay).
- `src/components/hud/Hud.tsx` — name button + `data-tour`; render `SettingsMenu`; `data-tour="menu"` on starmap.
- `src/components/hud/DetailPanel.tsx` — Take Off top-left + first-land tip.
- `src/components/minigame/GameHud.tsx` — round ← back button.
- `src/components/minigame/AsteroidGame.tsx` — dynamic-viewport overlay.

**Delete**
- `src/components/hud/MinigameHint.tsx` + `MinigameHint.test.tsx`.
- `src/components/hud/CoachHint.tsx` + `CoachHint.test.tsx`.

---

## Task 1: Persisted preference flags (`prefs.ts`)

**Files:**
- Create: `src/lib/prefs.ts`
- Test: `src/lib/prefs.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/prefs.test.ts
import {describe, it, expect, beforeEach} from 'vitest';
import {
  isTourDone, setTourDone,
  isShipMinigameEnabled, setShipMinigameEnabled,
  isTakeoffTipSeen, setTakeoffTipSeen,
} from './prefs';

describe('prefs', () => {
  beforeEach(() => localStorage.clear());

  it('tour-done defaults false and round-trips', () => {
    expect(isTourDone()).toBe(false);
    setTourDone(true);
    expect(isTourDone()).toBe(true);
    expect(localStorage.getItem('galaxy.tour.done')).toBe('1');
    setTourDone(false);
    expect(isTourDone()).toBe(false);
  });

  it('ship-minigame defaults ON when absent and persists OFF', () => {
    expect(isShipMinigameEnabled()).toBe(true);
    setShipMinigameEnabled(false);
    expect(isShipMinigameEnabled()).toBe(false);
    expect(localStorage.getItem('galaxy.ship.minigame')).toBe('0');
  });

  it('takeoff-tip defaults unseen and round-trips', () => {
    expect(isTakeoffTipSeen()).toBe(false);
    setTakeoffTipSeen(true);
    expect(isTakeoffTipSeen()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/prefs.test.ts`
Expected: FAIL — cannot find module `./prefs`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/prefs.ts
/**
 * Centralized localStorage boolean flags for the galaxy HUD. All reads are
 * SSR-safe (return the default when `window` is absent) and storage-failure-safe.
 * Stored as '1'/'0'; an ABSENT key falls back to the provided default — that's how
 * the ship mini-game stays ON until a user explicitly turns it off.
 */
function readBool(key: string, dflt: boolean): boolean {
  if (typeof window === 'undefined') return dflt;
  try {
    const v = localStorage.getItem(key);
    return v === null ? dflt : v === '1';
  } catch {
    return dflt;
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* storage unavailable — ignore */
  }
}

export const TOUR_DONE_KEY = 'galaxy.tour.done';
export const SHIP_MINIGAME_KEY = 'galaxy.ship.minigame';
export const TAKEOFF_TIP_KEY = 'galaxy.takeoff.tipSeen';

export const isTourDone = () => readBool(TOUR_DONE_KEY, false);
export const setTourDone = (done: boolean) => writeBool(TOUR_DONE_KEY, done);

export const isShipMinigameEnabled = () => readBool(SHIP_MINIGAME_KEY, true);
export const setShipMinigameEnabled = (on: boolean) => writeBool(SHIP_MINIGAME_KEY, on);

export const isTakeoffTipSeen = () => readBool(TAKEOFF_TIP_KEY, false);
export const setTakeoffTipSeen = (seen: boolean) => writeBool(TAKEOFF_TIP_KEY, seen);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/prefs.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/prefs.ts src/lib/prefs.test.ts
git commit -m "feat(prefs): centralized localStorage flag helpers"
```

---

## Task 2: Mobile camera drag fix

Root cause: the galaxy `<Canvas>` has no `touch-action: none`, so mobile browsers claim the drag as a scroll and fire `pointercancel` mid-gesture. Fix = CSS `touch-action: none` on the canvas + a `pointercancel` handler that ends the free-look drag.

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/hooks/useGalaxyControls.ts`
- Modify: `src/components/three/Scene.tsx:66` (wrapper div class)
- Test: `src/hooks/useGalaxyControls.test.ts` (append a describe)

- [ ] **Step 1: Write the failing test** (append to `src/hooks/useGalaxyControls.test.ts`)

```ts
describe('useGalaxyControls — free-look drag', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let motion: ReturnType<typeof createMotionState>;
  beforeEach(() => {
    dispatch = vi.fn();
    motion = createMotionState();
  });

  // jsdom lacks a PointerEvent constructor; MouseEvent carries clientX/clientY and
  // the listeners only read those, so it stands in for pointer events here.
  const move = (clientX: number, clientY: number) =>
    window.dispatchEvent(new MouseEvent('pointermove', {clientX, clientY}));

  it('accumulates yaw/pitch while dragging', () => {
    const {result} = renderHook(() =>
      useGalaxyControls({nav: initialNav(), dispatch, motion, compact: true}),
    );
    act(() => result.current.onPointerDown({clientX: 100, clientY: 100}));
    act(() => move(140, 130));
    expect(motion.yaw).not.toBe(0);
    expect(motion.pitch).not.toBe(0);
  });

  it('pointercancel ends the drag so later moves are ignored', () => {
    const {result} = renderHook(() =>
      useGalaxyControls({nav: initialNav(), dispatch, motion, compact: true}),
    );
    act(() => result.current.onPointerDown({clientX: 100, clientY: 100}));
    act(() => move(140, 100));
    const yaw = motion.yaw;
    act(() => window.dispatchEvent(new MouseEvent('pointercancel')));
    act(() => move(220, 100));
    expect(motion.yaw).toBe(yaw); // unchanged after cancel
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/hooks/useGalaxyControls.test.ts`
Expected: FAIL — after `pointercancel`, `motion.yaw` still changes (no cancel handler yet).

- [ ] **Step 3: Add the `pointercancel` handler** in `useGalaxyControls.ts`

In the free-look effect (currently around lines 81-102), register `pointercancel` alongside `pointerup` using the existing `onUp`:

```ts
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
```

- [ ] **Step 4: Add the CSS rule** — append to `src/app/globals.css`

```css
/* Touch devices: keep the browser from claiming galaxy-canvas drags as a page
   scroll, which fired pointercancel mid-gesture and made free-look stutter. */
.galaxy-canvas canvas {
  touch-action: none;
}
```

- [ ] **Step 5: Tag the canvas wrapper** in `src/components/three/Scene.tsx`

Change the canvas wrapper div (currently `<div className="fixed inset-0 z-10" aria-hidden="true">`) to:

```tsx
      <div className="galaxy-canvas fixed inset-0 z-10" aria-hidden="true">
```

> Note: `touch-action` is not inherited, so the rule targets the actual `<canvas>` (`.galaxy-canvas canvas`). `setPointerCapture` was considered but skipped — `touch-action: none` is the root-cause fix and avoids changing the `onPointerDown({clientX, clientY})` signature. Axis signs/sensitivity are feel-based; verify on a real phone and flip the `rotateOnWorldAxis`/`rotateX` signs in `CameraRig.tsx` if a direction feels inverted.

- [ ] **Step 6: Run tests + lint to verify**

Run: `npm run test:run -- src/hooks/useGalaxyControls.test.ts` → Expected: PASS.
Run: `npm run lint` → Expected: 0 problems.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useGalaxyControls.ts src/hooks/useGalaxyControls.test.ts src/app/globals.css src/components/three/Scene.tsx
git commit -m "fix(galaxy): smooth mobile camera drag (touch-action + pointercancel)"
```

---

## Task 3: Walkthrough step data (`walkthrough.ts`)

**Files:**
- Create: `src/lib/walkthrough.ts`
- Test: `src/lib/walkthrough.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/walkthrough.test.ts
import {describe, it, expect} from 'vitest';
import {tourSteps} from './walkthrough';

describe('tourSteps', () => {
  it('has 5 steps in the fixed order with the right spotlight targets', () => {
    const steps = tourSteps(true);
    expect(steps.map((s) => s.key)).toEqual(['land', 'fly', 'menu', 'name', 'ship']);
    expect(steps.map((s) => s.target)).toEqual(['land', 'fly', 'menu', 'name', null]);
  });

  it('ship step is a centered card (no DOM target)', () => {
    expect(tourSteps(false)[4].target).toBeNull();
  });

  it('wording adapts: compact says ☰ menu, desktop says starmap', () => {
    expect(tourSteps(true)[2].body).toMatch(/menu/i);
    expect(tourSteps(false)[2].body).toMatch(/starmap/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/lib/walkthrough.test.ts`
Expected: FAIL — cannot find module `./walkthrough`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/walkthrough.ts
/** A single walkthrough step. `target` is the `data-tour` value of the control to
 *  spotlight, or null for a centered card (the ship is a 3D object, not a DOM node). */
export interface TourStep {
  key: 'land' | 'fly' | 'menu' | 'name' | 'ship';
  target: 'land' | 'fly' | 'menu' | 'name' | null;
  title: string;
  body: string;
}

/** The opening tour's steps, adapted to touch (`compact`) vs desktop controls. */
export function tourSteps(compact: boolean): TourStep[] {
  return [
    {
      key: 'land',
      target: 'land',
      title: 'Land on a planet',
      body: compact
        ? 'Tap any planet to land on it and read that section. Drag anywhere to look around first.'
        : 'Click any planet to land on it (or press Enter). Drag to look around first.',
    },
    {
      key: 'fly',
      target: 'fly',
      title: 'Fly between planets',
      body: compact
        ? 'Use ◀ and ▶ to fly to the other planets.'
        : 'Use ◀ and ▶ (or the arrow keys) to fly between planets.',
    },
    {
      key: 'menu',
      target: 'menu',
      title: 'Jump anywhere',
      body: compact
        ? 'Open the ☰ menu to jump straight to any section.'
        : 'Use the starmap to jump straight to any section.',
    },
    {
      key: 'name',
      target: 'name',
      title: 'Open the résumé',
      body: 'Tap your name tag in the corner to jump to the full résumé view any time.',
    },
    {
      key: 'ship',
      target: null,
      title: 'Hidden mini-game',
      body: compact
        ? 'See the little ship orbiting your planet? Tap it for a hidden asteroid game — you can turn this off in the ☰ menu.'
        : 'See the little ship orbiting your planet? Click it for a hidden asteroid game — you can turn this off in Settings.',
    },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/lib/walkthrough.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/walkthrough.ts src/lib/walkthrough.test.ts
git commit -m "feat(walkthrough): tour step data"
```

---

## Task 4: Walkthrough component (`Walkthrough.tsx`)

Spotlight overlay: dims the scene, rings the current step's target (via `data-tour`), shows a centered card with step text, dots, and Skip / Back / Next. On finish or skip it persists `galaxy.tour.done`.

**Files:**
- Create: `src/components/hud/Walkthrough.tsx`
- Test: `src/components/hud/Walkthrough.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/hud/Walkthrough.test.tsx
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {Walkthrough} from './Walkthrough';
import {isTourDone} from '@/lib/prefs';

describe('Walkthrough', () => {
  beforeEach(() => localStorage.clear());

  it('starts on step 1 and advances with Next', () => {
    render(<Walkthrough compact onClose={vi.fn()} />);
    expect(screen.getByText(/land on a planet/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/fly between planets/i)).toBeInTheDocument();
  });

  it('Back returns to the previous step', () => {
    render(<Walkthrough compact onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /back/i}));
    expect(screen.getByText(/land on a planet/i)).toBeInTheDocument();
  });

  it('Skip closes and persists tour-done', () => {
    const onClose = vi.fn();
    render(<Walkthrough compact onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', {name: /skip/i}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(isTourDone()).toBe(true);
  });

  it('Done on the last step persists tour-done and closes', () => {
    const onClose = vi.fn();
    render(<Walkthrough compact onClose={onClose} />);
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/hidden mini-game/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /done/i}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(isTourDone()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/hud/Walkthrough.test.tsx`
Expected: FAIL — cannot find module `./Walkthrough`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/components/hud/Walkthrough.tsx
'use client';
import {useEffect, useState} from 'react';
import {tourSteps} from '@/lib/walkthrough';
import {setTourDone} from '@/lib/prefs';

/**
 * Opening spotlight tour. Dims the scene and rings the current step's control
 * (matched by `[data-tour=…]`); the ship step has no DOM node so it shows a
 * centered card with no ring. Persists `galaxy.tour.done` on finish/skip.
 */
export function Walkthrough({compact, onClose}: {compact: boolean; onClose: () => void}) {
  const steps = tourSteps(compact);
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;

  // Measure the current target's box so the ring lines up; re-measure on resize.
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step.target]);

  const finish = () => {
    setTourDone(true);
    onClose();
  };
  const next = () => (last ? finish() : setI((v) => v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));

  return (
    <div className="fixed inset-0 z-50">
      {rect ? (
        // The ring's huge spread box-shadow dims everything EXCEPT the cutout.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl border-2 border-[#21e6ff]"
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(3,3,12,0.74), 0 0 26px rgba(33,230,255,.7)',
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[#03030c]/74" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Walkthrough"
        className="fixed left-1/2 top-1/2 w-[min(360px,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#21e6ff]/55 bg-[#08081a]/95 p-5 text-[#e7f6ff] shadow-[0_0_40px_rgba(33,230,255,.35)] backdrop-blur-md"
      >
        <div className="font-display text-[10px] uppercase tracking-[2px] text-[#7fb0c9]">
          Step {i + 1} of {steps.length}
        </div>
        <h3 className="mt-1 font-display text-lg font-bold">{step.title}</h3>
        <p className="mt-2 text-sm text-[#cfe6f5]">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((s, idx) => (
              <span
                key={s.key}
                className={`h-1.5 w-1.5 rounded-full ${
                  idx === i ? 'bg-[#21e6ff] shadow-[0_0_6px_#21e6ff]' : 'bg-[#2a3a55]'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={finish}
              className="text-xs text-[#9fb6cf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              Skip
            </button>
            {i > 0 && (
              <button
                type="button"
                onClick={back}
                className="rounded-lg border border-[#21e6ff]/50 px-3 py-1.5 text-xs text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-[#21e6ff] px-3 py-1.5 text-xs font-bold text-[#05030f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              {last ? 'Done' : 'Next ▸'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/components/hud/Walkthrough.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/hud/Walkthrough.tsx src/components/hud/Walkthrough.test.tsx
git commit -m "feat(walkthrough): spotlight tour component"
```

---

## Task 5: Wire the tour in, tag targets, remove old hints

Add `data-tour` anchors, render `Walkthrough` from `Scene` (with show/replay state), and delete `MinigameHint` + `CoachHint`.

**Files:**
- Modify: `src/components/hud/ThumbDock.tsx`
- Modify: `src/components/hud/IdentityChip.tsx` (data-tour only here; click added in Task 7)
- Modify: `src/components/three/Scene.tsx`
- Modify: `src/components/GalaxyExperience.tsx`
- Modify: `src/components/hud/MobileHud.tsx`
- Delete: `src/components/hud/MinigameHint.tsx`, `MinigameHint.test.tsx`, `CoachHint.tsx`, `CoachHint.test.tsx`
- Test: `src/components/hud/ThumbDock.test.tsx` (append)

- [ ] **Step 1: Write the failing test** (append to `src/components/hud/ThumbDock.test.tsx`)

```tsx
import {initialNav} from '@/lib/navigation';

describe('ThumbDock — tour anchors', () => {
  it('tags the LAND and ▶ controls for the walkthrough', () => {
    const {container} = render(<ThumbDock nav={initialNav()} dispatch={vi.fn()} />);
    expect(container.querySelector('[data-tour="land"]')).not.toBeNull();
    expect(container.querySelector('[data-tour="fly"]')).not.toBeNull();
  });
});
```

> If `ThumbDock.test.tsx` doesn't already import `render`, `vi`, etc., add: `import {describe, it, expect, vi} from 'vitest'; import {render} from '@testing-library/react'; import {ThumbDock} from './ThumbDock';`

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/components/hud/ThumbDock.test.tsx`
Expected: FAIL — no `[data-tour]` nodes.

- [ ] **Step 3: Add `dataTour` to `DockButton` and tag controls** in `ThumbDock.tsx`

Add an optional prop to `DockButton` and apply it:

```tsx
function DockButton({
  children,
  onClick,
  disabled,
  land,
  dataTour,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  land?: boolean;
  dataTour?: string;
  'aria-label': string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-tour={dataTour}
      onClick={onClick}
      disabled={disabled}
      className={/* unchanged */ `pointer-events-auto rounded-2xl border py-4 text-center font-display text-base font-bold text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:opacity-35 ${
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

Then on the LAND and Outward buttons:

```tsx
      <DockButton aria-label="Land" land dataTour="land" onClick={() => dispatch({type: 'land'})}>
        LAND
      </DockButton>
      <DockButton aria-label="Outward" dataTour="fly" onClick={() => dispatch({type: 'next', n})} disabled={nav.current === n - 1}>
        ▶
      </DockButton>
```

- [ ] **Step 4: Tag `IdentityChip`** — add `data-tour="name"` to its root element in `IdentityChip.tsx` (the outer `<div>`):

```tsx
    <div data-tour="name" className="pointer-events-none fixed left-[calc(12px+env(safe-area-inset-left))] ...">
```

> (The full name-tag→résumé interaction lands in Task 7; this only adds the anchor.)

- [ ] **Step 5: Own tour state in `Scene.tsx` and render `Walkthrough`**

Add imports:

```tsx
import {useCallback} from 'react';
import {Walkthrough} from '@/components/hud/Walkthrough';
import {isTourDone, setTourDone} from '@/lib/prefs';
```

Inside `Scene`, after `isCompact`:

```tsx
  // Opening walkthrough: show once (lazy init from storage; Scene is ssr:false so
  // reading localStorage at init is safe). `onReplayTour` re-arms it from a menu.
  const [showTour, setShowTour] = useState(() => !isTourDone());
  const closeTour = useCallback(() => setShowTour(false), []);
  const replayTour = useCallback(() => {
    setTourDone(false);
    setShowTour(true);
  }, []);
```

Render the tour as a sibling of the HUD (after the `{isCompact ? <MobileHud…/> : <Hud…/>}` block), hidden while the mini-game is open:

```tsx
      {showTour && !paused && <Walkthrough compact={isCompact} onClose={closeTour} />}
```

Pass `onReplayTour={replayTour}` into both HUDs (consumed in Task 6):

```tsx
      {isCompact ? (
        <MobileHud nav={nav} dispatch={dispatch} onSkip={onSkip} onReplayTour={replayTour} />
      ) : (
        <Hud nav={nav} dispatch={dispatch} onSkip={onSkip} boost={boost} onReplayTour={replayTour} />
      )}
```

> `MobileHud`/`Hud` get `onReplayTour?` as an OPTIONAL prop in Task 6 so this compiles now and existing tests that omit it stay green.

- [ ] **Step 6: Remove the old hints**

In `GalaxyExperience.tsx`: delete the `MinigameHint` import, the `DISCOVERED_KEY`/`readDiscovered` block, the `discovered`/`hintDismissed` state, and simplify `openMinigame`:

```tsx
  const openMinigame = () => setMinigameOpen(true);
```

And the galaxy-mode return becomes:

```tsx
  if (mode === 'galaxy') {
    return (
      <>
        <Scene
          nav={nav}
          dispatch={dispatch}
          onSkip={showResume}
          reducedMotion={caps.reducedMotion}
          paused={minigameOpen}
          onLaunchMinigame={openMinigame}
        />
        {minigameOpen && <AsteroidGame onExit={() => setMinigameOpen(false)} />}
      </>
    );
  }
```

In `MobileHud.tsx`: delete the `CoachHint` import and its `<CoachHint />` usage.

Delete the files:

```bash
git rm src/components/hud/MinigameHint.tsx src/components/hud/MinigameHint.test.tsx src/components/hud/CoachHint.tsx src/components/hud/CoachHint.test.tsx
```

- [ ] **Step 7: Run the full suite + lint**

Run: `npm run test:run` → Expected: PASS (MinigameHint/CoachHint tests gone; ThumbDock anchor test passes; GalaxyExperience tests still green).
Run: `npm run lint` → Expected: 0 problems (no unused imports left behind).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(walkthrough): wire tour into Scene, tag targets, drop old hints"
```

---

## Task 6: Ship-tap toggle + settings surfaces

Add the prefs-backed ship-minigame toggle, gate the launch, and surface the toggle + "Replay walkthrough" in the mobile ☰ menu and a new desktop ⚙ popover.

**Files:**
- Modify: `src/components/three/Scene.tsx`
- Modify: `src/components/hud/MobileHud.tsx`
- Modify: `src/components/hud/MobileMenu.tsx`
- Modify: `src/components/hud/Hud.tsx`
- Create: `src/components/hud/SettingsMenu.tsx`
- Test: `src/components/hud/MobileMenu.test.tsx` (append), `src/components/hud/SettingsMenu.test.tsx` (new)

- [ ] **Step 1: Write the failing tests**

Append to `src/components/hud/MobileMenu.test.tsx`:

```tsx
describe('MobileMenu — settings', () => {
  it('shows the ship toggle state and fires onToggleShipMinigame', () => {
    const onToggle = vi.fn();
    render(
      <MobileMenu
        nav={initialNav()}
        dispatch={vi.fn()}
        onSkip={vi.fn()}
        shipMinigameEnabled={true}
        onToggleShipMinigame={onToggle}
        onReplayTour={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    const toggle = screen.getByRole('switch', {name: /ship mini-game/i});
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('replay button fires onReplayTour', () => {
    const onReplay = vi.fn();
    render(
      <MobileMenu
        nav={initialNav()}
        dispatch={vi.fn()}
        onSkip={vi.fn()}
        onReplayTour={onReplay}
      />,
    );
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    fireEvent.click(screen.getByRole('button', {name: /replay walkthrough/i}));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });
});
```

New `src/components/hud/SettingsMenu.test.tsx`:

```tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {SettingsMenu} from './SettingsMenu';

describe('SettingsMenu (desktop)', () => {
  it('opens from the gear and exposes the ship toggle + replay', () => {
    const onToggle = vi.fn();
    const onReplay = vi.fn();
    render(
      <SettingsMenu shipMinigameEnabled={false} onToggleShipMinigame={onToggle} onReplayTour={onReplay} />,
    );
    fireEvent.click(screen.getByRole('button', {name: /settings/i}));
    const toggle = screen.getByRole('switch', {name: /ship mini-game/i});
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', {name: /replay walkthrough/i}));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/components/hud/MobileMenu.test.tsx src/components/hud/SettingsMenu.test.tsx`
Expected: FAIL — no `switch` role / missing `SettingsMenu` module.

- [ ] **Step 3: Add a shared settings control list** — create `src/components/hud/SettingsMenu.tsx`

```tsx
'use client';
import {useEffect, useState} from 'react';

/** The two settings rows, reused by the desktop popover and the mobile menu. */
export function SettingsControls({
  shipMinigameEnabled,
  onToggleShipMinigame,
  onReplayTour,
}: {
  shipMinigameEnabled: boolean;
  onToggleShipMinigame: () => void;
  onReplayTour: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={shipMinigameEnabled}
        aria-label="Ship mini-game"
        onClick={onToggleShipMinigame}
        className="flex items-center justify-between gap-3 rounded-xl border border-[#21e6ff]/40 bg-[#0a0a1f]/60 px-3 py-2.5 text-left text-sm text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        <span>🚀 Ship mini-game</span>
        <span
          className={`font-display text-[11px] ${shipMinigameEnabled ? 'text-cyan-200' : 'text-[#9fb6cf]'}`}
        >
          {shipMinigameEnabled ? 'On' : 'Off'}
        </span>
      </button>
      <button
        type="button"
        onClick={onReplayTour}
        className="rounded-xl border border-[#21e6ff]/40 bg-[#0a0a1f]/60 px-3 py-2.5 text-left text-sm text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ↻ Replay walkthrough
      </button>
    </div>
  );
}

/** Desktop-only ⚙ button + popover wrapping SettingsControls (desktop has no ☰). */
export function SettingsMenu(props: {
  shipMinigameEnabled: boolean;
  onToggleShipMinigame: () => void;
  onReplayTour: () => void;
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
    <div className="relative">
      <button
        type="button"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#21e6ff]/50 bg-[#0a0a1f]/60 text-lg text-[#9fe9ff] shadow-[0_0_14px_rgba(33,230,255,.3)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ⚙
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-60 rounded-2xl border border-[#21e6ff]/40 bg-[#08081a]/95 p-3 shadow-[0_0_30px_rgba(33,230,255,.3)] backdrop-blur-md">
          <SettingsControls {...props} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add the settings block to `MobileMenu.tsx`**

Extend the props (all three optional with safe defaults so existing renders/tests still compile):

```tsx
export function MobileMenu({
  nav,
  dispatch,
  onSkip,
  shipMinigameEnabled = true,
  onToggleShipMinigame = () => {},
  onReplayTour = () => {},
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
  shipMinigameEnabled?: boolean;
  onToggleShipMinigame?: () => void;
  onReplayTour?: () => void;
}) {
```

Import the shared controls at the top:

```tsx
import {SettingsControls} from './SettingsMenu';
```

Insert a Settings block just above the existing résumé/PDF row (before `<div className="mt-auto flex gap-3">`):

```tsx
            <div className="font-display text-[10px] uppercase tracking-[2px] text-[#7fb0c9]">
              ◇ Settings
            </div>
            <SettingsControls
              shipMinigameEnabled={shipMinigameEnabled}
              onToggleShipMinigame={onToggleShipMinigame}
              onReplayTour={() => {
                setOpen(false);
                onReplayTour();
              }}
            />
```

- [ ] **Step 5: Thread props through `MobileHud.tsx`**

Extend props (optional) and pass them to `MobileMenu`:

```tsx
export function MobileHud({
  nav,
  dispatch,
  onSkip,
  shipMinigameEnabled = true,
  onToggleShipMinigame = () => {},
  onReplayTour = () => {},
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
  shipMinigameEnabled?: boolean;
  onToggleShipMinigame?: () => void;
  onReplayTour?: () => void;
}) {
  return (
    <>
      {!nav.landed && (
        <>
          <IdentityChip onOpenResume={onSkip} />
          <MobileMenu
            nav={nav}
            dispatch={dispatch}
            onSkip={onSkip}
            shipMinigameEnabled={shipMinigameEnabled}
            onToggleShipMinigame={onToggleShipMinigame}
            onReplayTour={onReplayTour}
          />
          <ThumbDock nav={nav} dispatch={dispatch} />
        </>
      )}
      <DetailPanel nav={nav} onTakeOff={() => dispatch({type: 'takeOff'})} />
    </>
  );
}
```

> `IdentityChip onOpenResume` is added in Task 7; if implementing strictly in order, pass it now and have `IdentityChip` accept an optional `onOpenResume?` in Task 7. To keep this task self-contained, add the optional prop signature to `IdentityChip` here (no behavior yet) and complete the click in Task 7.

- [ ] **Step 6: Render `SettingsMenu` in desktop `Hud.tsx`**

Extend `Hud` props with the three settings props + `onReplayTour` (optional), import `SettingsMenu`, and place the gear next to the starmap legend in the top-right cluster:

```tsx
import {SettingsMenu} from './SettingsMenu';
```

```tsx
        <div className="pointer-events-auto flex items-start gap-2">
          <StarmapLegend nav={nav} dispatch={dispatch} />
          <SettingsMenu
            shipMinigameEnabled={shipMinigameEnabled}
            onToggleShipMinigame={onToggleShipMinigame}
            onReplayTour={onReplayTour}
          />
        </div>
```

with props:

```tsx
export function Hud({
  nav,
  dispatch,
  onSkip,
  boost = false,
  shipMinigameEnabled = true,
  onToggleShipMinigame = () => {},
  onReplayTour = () => {},
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
  boost?: boolean;
  shipMinigameEnabled?: boolean;
  onToggleShipMinigame?: () => void;
  onReplayTour?: () => void;
}) {
```

- [ ] **Step 7: Own the toggle state in `Scene.tsx` and gate the launch**

Add imports:

```tsx
import {isShipMinigameEnabled, setShipMinigameEnabled} from '@/lib/prefs';
```

Add state (persist via effect — localStorage writes in an effect are allowed; only `setState` in an effect body is forbidden):

```tsx
  const [shipMinigame, setShipMinigame] = useState(() => isShipMinigameEnabled());
  useEffect(() => {
    setShipMinigameEnabled(shipMinigame);
  }, [shipMinigame]);
  const toggleShipMinigame = useCallback(() => setShipMinigame((v) => !v), []);
```

Gate the ship's launch (only pass `onLaunch` when enabled):

```tsx
          <Ship
            nav={nav}
            positionsRef={positionsRef}
            motion={motion.current}
            onLaunch={shipMinigame ? onLaunchMinigame : undefined}
          />
```

Pass the toggle into both HUDs:

```tsx
      {isCompact ? (
        <MobileHud
          nav={nav}
          dispatch={dispatch}
          onSkip={onSkip}
          shipMinigameEnabled={shipMinigame}
          onToggleShipMinigame={toggleShipMinigame}
          onReplayTour={replayTour}
        />
      ) : (
        <Hud
          nav={nav}
          dispatch={dispatch}
          onSkip={onSkip}
          boost={boost}
          shipMinigameEnabled={shipMinigame}
          onToggleShipMinigame={toggleShipMinigame}
          onReplayTour={replayTour}
        />
      )}
```

> `Ship` already renders the hit-sphere only when `onLaunch` is truthy (`{onLaunch && <mesh …/>}`), so passing `undefined` fully disables ship-tap launching. End-to-end suppression is verified manually (Ship is R3F).

- [ ] **Step 8: Run tests + lint + build**

Run: `npm run test:run` → Expected: PASS (new MobileMenu + SettingsMenu tests; existing green).
Run: `npm run lint` → Expected: 0.
Run: `npm run build` → Expected: static export succeeds.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(settings): ship-tap toggle + replay walkthrough (mobile menu + desktop gear)"
```

---

## Task 7: Name tag → résumé

Make the name tag open the résumé on both platforms; keep existing résumé buttons.

**Files:**
- Modify: `src/components/hud/IdentityChip.tsx`
- Modify: `src/components/hud/Hud.tsx`
- Test: `src/components/hud/IdentityChip.test.tsx` (new), `src/components/hud/MobileHud.test.tsx` (append)

- [ ] **Step 1: Write the failing tests**

New `src/components/hud/IdentityChip.test.tsx`:

```tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {IdentityChip} from './IdentityChip';

describe('IdentityChip', () => {
  it('is a button that opens the résumé', () => {
    const onOpen = vi.fn();
    render(<IdentityChip onOpenResume={onOpen} />);
    fireEvent.click(screen.getByRole('button', {name: /résumé|resume|malachi/i}));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
```

Append to `src/components/hud/Hud.test.tsx` (create the file if absent with the imports shown):

```tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {Hud} from './Hud';
import {initialNav} from '@/lib/navigation';

describe('Hud — name tag', () => {
  it('clicking the name opens the résumé view', () => {
    const onSkip = vi.fn();
    render(<Hud nav={initialNav()} dispatch={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', {name: /malachi tzuoo/i}));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/components/hud/IdentityChip.test.tsx src/components/hud/Hud.test.tsx`
Expected: FAIL — name is not a button yet.

- [ ] **Step 3: Make `IdentityChip` an interactive button**

```tsx
// src/components/hud/IdentityChip.tsx
'use client';

/**
 * Identity tag pinned top-left of the compact HUD. A button: tapping it opens the
 * résumé view (also a walkthrough target via data-tour="name"). Mirrors the
 * desktop name chip in Hud.tsx. MobileHud renders it only while flying.
 */
export function IdentityChip({onOpenResume}: {onOpenResume: () => void}) {
  return (
    <button
      type="button"
      data-tour="name"
      onClick={onOpenResume}
      aria-label="Malachi Tzuoo — view résumé"
      className="pointer-events-auto fixed left-[calc(12px+env(safe-area-inset-left))] top-[calc(12px+env(safe-area-inset-top))] z-30 rounded-[14px] border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-3 py-2 text-left shadow-[0_0_18px_rgba(33,230,255,.35)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      <div className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-sm font-black leading-tight tracking-wide text-transparent">
        MALACHI TZUOO
      </div>
      <div className="mt-0.5 text-[10px] font-medium leading-tight tracking-wide text-[#9fb6cf]">
        LV.26 · SOFTWARE ENGINEER
      </div>
    </button>
  );
}
```

- [ ] **Step 4: Make the desktop name a button** in `Hud.tsx`

Wrap the name span in a button and tag it. Replace the existing `<span …>MALACHI TZUOO</span>` (in the top-left chip) with:

```tsx
          <button
            type="button"
            data-tour="name"
            onClick={onSkip}
            aria-label="Malachi Tzuoo — view résumé"
            className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-base font-black tracking-wide text-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            MALACHI TZUOO
          </button>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:run -- src/components/hud/IdentityChip.test.tsx src/components/hud/Hud.test.tsx src/components/hud/MobileHud.test.tsx`
Expected: PASS. (The existing MobileHud `getByText(/malachi tzuoo/i)` still matches the button's text.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(hud): name tag opens the résumé on mobile + desktop"
```

---

## Task 8: Take Off → top-left + first-land tip

**Files:**
- Modify: `src/components/hud/DetailPanel.tsx`
- Test: `src/components/hud/DetailPanel.test.tsx` (append)

- [ ] **Step 1: Write the failing tests** (append to `DetailPanel.test.tsx`)

```tsx
import {fireEvent} from '@testing-library/react';
import {isTakeoffTipSeen} from '@/lib/prefs';

describe('DetailPanel — first-land tip', () => {
  beforeEach(() => localStorage.clear());

  it('shows the take-off tip on the first landing and persists once dismissed', () => {
    render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />);
    expect(screen.getByText(/head back to space/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /got it/i}));
    expect(screen.queryByText(/head back to space/i)).toBeNull();
    expect(isTakeoffTipSeen()).toBe(true);
  });

  it('does not show the tip once it has been seen', () => {
    localStorage.setItem('galaxy.takeoff.tipSeen', '1');
    render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />);
    expect(screen.queryByText(/head back to space/i)).toBeNull();
  });
});
```

> Add `beforeEach` to the existing top imports if not present: `import {describe, it, expect, vi, beforeEach} from 'vitest';`

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:run -- src/components/hud/DetailPanel.test.tsx`
Expected: FAIL — no tip text.

- [ ] **Step 3: Move Take Off to top-left + add the tip** in `DetailPanel.tsx`

Add the import and a seen-state (lazy init, no setState-in-effect):

```tsx
import {isTakeoffTipSeen, setTakeoffTipSeen} from '@/lib/prefs';
```

Inside the component, alongside `revealed`:

```tsx
  const [tipSeen, setTipSeen] = useState(() => isTakeoffTipSeen());
  const markTipSeen = () => {
    setTipSeen(true);
    setTakeoffTipSeen(true);
  };
  const showTip = nav.landed && !tipSeen;
```

Replace the existing bottom-left TAKE OFF button block with a top-left button plus the tip. The button calls `markTipSeen()` before `onTakeOff()` so leaving also retires the tip:

```tsx
      {/* TAKE OFF (top-left) — shown immediately on landing; mirrors "back = top-left". */}
      {nav.landed && (
        <button
          type="button"
          data-tour="takeoff"
          onClick={() => {
            markTipSeen();
            onTakeOff();
          }}
          className="pointer-events-auto absolute left-[calc(1rem+env(safe-area-inset-left))] top-[calc(1rem+env(safe-area-inset-top))] rounded-xl border border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 px-[18px] py-3 font-display text-[13px] font-bold tracking-wide text-white shadow-[0_0_16px_#ff3df0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          🚀 TAKE OFF
        </button>
      )}

      {/* First-land tip — once ever, just below the button. */}
      {showTip && (
        <div className="pointer-events-auto absolute left-[calc(1rem+env(safe-area-inset-left))] top-[calc(4.5rem+env(safe-area-inset-top))] flex max-w-[220px] items-start gap-2 rounded-xl border border-[#21e6ff]/55 bg-[#08081a]/92 px-3 py-2.5 text-xs text-[#cfe6f5] shadow-[0_0_18px_rgba(33,230,255,.3)] backdrop-blur-md">
          <span>Done exploring? Take off to head back to space.</span>
          <button
            type="button"
            onClick={markTipSeen}
            className="flex-none rounded-lg border border-[#21e6ff]/50 px-2 py-1 font-display text-[11px] text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            Got it
          </button>
        </div>
      )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:run -- src/components/hud/DetailPanel.test.tsx`
Expected: PASS (existing 4 tests + 2 new). The existing "TAKE OFF is immediate" / "calls onTakeOff" tests still pass (button still named "TAKE OFF").

- [ ] **Step 5: Commit**

```bash
git add src/components/hud/DetailPanel.tsx src/components/hud/DetailPanel.test.tsx
git commit -m "feat(hud): Take Off moves top-left with a one-time first-land tip"
```

---

## Task 9: Mini-game back button visibility

Round ← icon top-left (keeps the run uncluttered) + dynamic-viewport overlay so it isn't hidden under the mobile address bar.

**Files:**
- Modify: `src/components/minigame/GameHud.tsx`
- Modify: `src/components/minigame/AsteroidGame.tsx`
- Test: `src/components/minigame/GameHud.test.tsx` (verify still green; no new assertions required since the accessible name stays "Exit game")

- [ ] **Step 1: Swap the Exit pill for a round ← icon** in `GameHud.tsx`

Replace the existing top-left Exit `<button>` with:

```tsx
      {/* Back is always reachable, top-left. Round icon keeps the run uncluttered;
          generous top offset + solid bg so it isn't lost under mobile browser chrome. */}
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit game"
        className="pointer-events-auto absolute z-20 left-[calc(14px+env(safe-area-inset-left))] top-[calc(14px+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full border border-[#ff3df0] bg-[#0a0a1f]/85 text-xl text-[#ff9cf0] shadow-[0_0_16px_rgba(255,61,240,.5)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ←
      </button>
```

> Keep `aria-label="Exit game"` — the existing `GameHud.test.tsx` queries this button by `/exit/i` (accessible name), so it stays green even though the visible glyph changed.

- [ ] **Step 2: Size the overlay to the dynamic viewport** in `AsteroidGame.tsx`

Change the container className from `fixed inset-0 z-50 touch-none bg-[#04030c]` to use dynamic viewport units so its top edge tracks the visible area (URL bar shown/hidden):

```tsx
    <div
      ref={containerRef}
      className="fixed left-0 top-0 z-50 h-[100dvh] w-[100vw] touch-none bg-[#04030c]"
      onPointerMove={(e) => updatePointer(e.clientX, e.clientY)}
      onPointerDown={(e) => updatePointer(e.clientX, e.clientY)}
    >
```

- [ ] **Step 3: Run the mini-game tests + lint + build**

Run: `npm run test:run -- src/components/minigame/GameHud.test.tsx` → Expected: PASS (unchanged accessible name).
Run: `npm run lint` → Expected: 0.
Run: `npm run build` → Expected: static export succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/minigame/GameHud.tsx src/components/minigame/AsteroidGame.tsx
git commit -m "fix(minigame): clearer round back button + dynamic-viewport overlay"
```

---

## Final verification

- [ ] **Run the full gate suite**

```bash
npm run test:run
npm run lint
npm run build
```

Expected: all green; static export to `out/`.

- [ ] **Manual device check (camera + mobile chrome)** — not unit-testable:
  - On a real phone, drag to look around: motion should be smooth and continuous (no nudge-then-stop). If a direction feels inverted, flip the `rotateOnWorldAxis`/`rotateX` signs in `CameraRig.tsx`.
  - Open the mini-game on the phone and confirm the round ← back button is fully visible during play (not under the address bar).
  - First visit: the walkthrough auto-plays; Skip/Done suppress it on reload; "Replay walkthrough" re-arms it.
  - Turn the ship mini-game OFF in the menu, then tap the ship while aiming near a planet — it should not launch.

---

## Self-review notes

- **Spec coverage:** A→Task 3/4/5; B→Task 6; C→Task 8; D→Task 7; E→Task 2; F→Task 9. Removal of `MinigameHint`/`CoachHint`→Task 5. All spec sections map to tasks.
- **Type consistency:** `onReplayTour`, `shipMinigameEnabled`, `onToggleShipMinigame`, `onOpenResume`, `setTourDone`/`isTourDone`, `setTakeoffTipSeen`/`isTakeoffTipSeen`, `tourSteps`, `TourStep`, `data-tour` values (`land`/`fly`/`menu`/`name`) are used identically across tasks.
- **Optional props** on `MobileHud`/`Hud`/`MobileMenu` keep pre-existing tests (which omit them) compiling.
- **Deferred:** projecting the ship to ring it in step 5; `setPointerCapture`; VisualViewport fallback if `100dvh` proves insufficient. All noted in the spec.
