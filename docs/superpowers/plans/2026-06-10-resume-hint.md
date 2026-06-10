# Résumé Hint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pulsating "Click here for résumé" cue with an arrow pointing at the top-left name tag, shown to visitors who skipped the walkthrough, dismissed for good once the résumé is first opened.

**Architecture:** A single `ResumeHint` component rendered once in `Scene.tsx`, statically pinned under the name tag (safe-area aware, same on both layouts). Dismissal is persisted via a new `prefs` flag and flows through the existing `onSkip` handler, so every "open résumé" path dismisses it. Visibility is pure derived state.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Vitest 4 + Testing Library, TypeScript.

**Reference:** Spec at `docs/superpowers/specs/2026-06-10-resume-hint-design.md`.

**Test commands:** single file → `npx vitest run <path>`; full suite → `npm run test:run`. Build/type check → `npm run build`. Lint → `npm run lint`.

---

### Task 1: Persistence flag in `prefs`

**Files:**
- Modify: `src/lib/prefs.ts` (add after the `TAKEOFF_TIP_KEY` block, ~line 29-38)
- Test: `src/lib/prefs.test.ts`

- [ ] **Step 1: Write the failing test**

Add this `it` block inside the existing `describe('prefs', …)` block in `src/lib/prefs.test.ts` (after the `takeoff-tip` test, before the closing `});` of that describe). Also add `isResumeHintDone, setResumeHintDone` to the import from `./prefs` at the top of the file.

```ts
  it('resume-hint defaults not-done and round-trips', () => {
    expect(isResumeHintDone()).toBe(false);
    setResumeHintDone(true);
    expect(isResumeHintDone()).toBe(true);
    expect(localStorage.getItem('galaxy.resumeHint.done')).toBe('1');
    setResumeHintDone(false);
    expect(isResumeHintDone()).toBe(false);
  });
```

Resulting import line at top of `src/lib/prefs.test.ts`:

```ts
import {
  isTourDone, setTourDone,
  isShipMinigameEnabled, setShipMinigameEnabled,
  isTakeoffTipSeen, setTakeoffTipSeen,
  isResumeHintDone, setResumeHintDone,
  getEquippedShip, setEquippedShip,
} from './prefs';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/prefs.test.ts`
Expected: FAIL — `isResumeHintDone is not a function` (or a TypeScript/import error).

- [ ] **Step 3: Write minimal implementation**

In `src/lib/prefs.ts`, add these lines immediately after the `setTakeoffTipSeen` export (after line 38):

```ts
export const RESUME_HINT_KEY = 'galaxy.resumeHint.done';

export const isResumeHintDone = () => readBool(RESUME_HINT_KEY, false);
export const setResumeHintDone = (done: boolean) => writeBool(RESUME_HINT_KEY, done);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/prefs.test.ts`
Expected: PASS (all prefs tests green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/prefs.ts src/lib/prefs.test.ts
git commit -m "feat(prefs): add resume-hint dismissed flag"
```

---

### Task 2: `ResumeHint` component + pulse keyframe

**Files:**
- Create: `src/components/hud/ResumeHint.tsx`
- Create: `src/components/hud/ResumeHint.test.tsx`
- Modify: `src/app/globals.css` (the `@theme inline` block, ~line 7-10)

- [ ] **Step 1: Write the failing test**

Create `src/components/hud/ResumeHint.test.tsx`:

```tsx
import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {ResumeHint} from './ResumeHint';

describe('ResumeHint', () => {
  it('opens the résumé when clicked', () => {
    const onOpen = vi.fn();
    render(<ResumeHint compact={false} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', {name: /résumé|resume/i}));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('adapts the copy: Click on desktop, Tap on compact', () => {
    const {rerender} = render(<ResumeHint compact={false} onOpen={vi.fn()} />);
    expect(screen.getByText(/click here/i)).toBeTruthy();
    rerender(<ResumeHint compact onOpen={vi.fn()} />);
    expect(screen.getByText(/tap here/i)).toBeTruthy();
  });

  it('pulses but respects prefers-reduced-motion', () => {
    render(<ResumeHint compact={false} onOpen={vi.fn()} />);
    const label = screen.getByText(/here for résumé/i);
    expect(label.className).toContain('animate-resume-pulse');
    expect(label.className).toContain('motion-reduce:animate-none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/hud/ResumeHint.test.tsx`
Expected: FAIL — cannot resolve `./ResumeHint`.

- [ ] **Step 3: Register the pulse animation in `globals.css`**

In `src/app/globals.css`, add the `--animate-resume-pulse` line inside the existing `@theme inline` block, and add the `@keyframes` rule right after that block. The block becomes:

```css
@theme inline {
  --font-display: var(--font-orbitron), Orbitron, system-ui, sans-serif;
  --font-sans: var(--font-inter), Inter, system-ui, sans-serif;
  --animate-resume-pulse: resume-pulse 1.8s ease-in-out infinite;
}

/* Pulsing nudge that points visitors at the clickable name tag (ResumeHint). */
@keyframes resume-pulse {
  0%, 100% { transform: scale(1);    box-shadow: 0 0 12px rgba(33, 230, 255, 0.45); }
  50%      { transform: scale(1.05); box-shadow: 0 0 22px rgba(255, 61, 240, 0.65); }
}
```

- [ ] **Step 4: Write the component**

Create `src/components/hud/ResumeHint.tsx`:

```tsx
'use client';

/**
 * A pulsing nudge pinned just under the name tag (top-left), shown to visitors
 * who skipped the walkthrough so they can still find the résumé. Clicking it
 * opens the résumé (same action as the name tag); the ▲ arrow points up at the
 * name tag to teach that the tag itself is clickable too. Scene owns the
 * visibility gate and persists dismissal once the résumé is opened.
 */
export function ResumeHint({compact, onOpen}: {compact: boolean; onOpen: () => void}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="View résumé"
      className="pointer-events-auto fixed left-[calc(16px+env(safe-area-inset-left))] top-[calc(70px+env(safe-area-inset-top))] z-40 flex flex-col items-start gap-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      {/* Arrow pointing up toward the name tag. */}
      <span
        aria-hidden="true"
        className="ml-5 text-[10px] leading-none text-[#21e6ff] [text-shadow:0_0_8px_rgba(33,230,255,.8)]"
      >
        ▲
      </span>
      <span className="animate-resume-pulse rounded-full border border-[#ff3df0]/70 bg-[#0a0a1f]/75 px-3 py-1.5 font-display text-[11px] font-bold tracking-wide text-white shadow-[0_0_14px_rgba(255,61,240,.5)] backdrop-blur-md motion-reduce:animate-none">
        {compact ? 'Tap' : 'Click'} here for résumé
      </span>
    </button>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/hud/ResumeHint.test.tsx`
Expected: PASS (3 tests green).

- [ ] **Step 6: Commit**

```bash
git add src/components/hud/ResumeHint.tsx src/components/hud/ResumeHint.test.tsx src/app/globals.css
git commit -m "feat(hint): pulsing ResumeHint cue pointing at the name tag"
```

---

### Task 3: Wire the hint into `Scene`

**Files:**
- Modify: `src/components/three/Scene.tsx` (imports ~line 18-21; new state after the tour state ~line 73-79; HUD props ~line 128-153; render after the HUD)

There is no isolated unit test for `Scene` (it mounts an R3F `<Canvas>` and is `ssr:false`), consistent with the existing codebase. This task is verified by the full test suite plus a type-checking build and a manual check.

- [ ] **Step 1: Add the imports**

In `src/components/three/Scene.tsx`, add the `ResumeHint` import alongside the other `hud` imports (after the `Walkthrough` import on line 20):

```tsx
import {ResumeHint} from '@/components/hud/ResumeHint';
```

Extend the `prefs` import on line 21 to pull in the new flag, aliasing the writer to avoid colliding with the local state setter:

```tsx
import {
  isTourDone, setTourDone,
  isShipMinigameEnabled, setShipMinigameEnabled,
  isResumeHintDone, setResumeHintDone as persistResumeHintDone,
} from '@/lib/prefs';
```

- [ ] **Step 2: Add the hint state + the wrapped open handler**

In `src/components/three/Scene.tsx`, immediately after the `replayTour` `useCallback` (after line 79), add:

```tsx
  // "Click here for résumé" hint: shown to visitors who skipped the tour, until
  // they open the résumé once. Persisted so it never nags a returning visitor.
  const [resumeHintDone, setResumeHintDone] = useState(() => isResumeHintDone());
  const handleOpenResume = useCallback(() => {
    if (!resumeHintDone) {
      setResumeHintDone(true);
      persistResumeHintDone(true);
    }
    onSkip();
  }, [onSkip, resumeHintDone]);
```

- [ ] **Step 3: Route every résumé-open through the wrapped handler**

In `src/components/three/Scene.tsx`, change the `onSkip` prop passed to both HUDs from `onSkip={onSkip}` to `onSkip={handleOpenResume}`. There are two occurrences — one on the `MobileHud` (~line 132) and one on the `Hud` (~line 144). Both become:

```tsx
          onSkip={handleOpenResume}
```

- [ ] **Step 4: Render the hint**

In `src/components/three/Scene.tsx`, add the hint right after the closing of the `isCompact ? <MobileHud …/> : <Hud …/>` ternary and before the `{showTour && …}` line (~line 154):

```tsx
      {!showTour && !nav.landed && !paused && !resumeHintDone && (
        <ResumeHint compact={isCompact} onOpen={handleOpenResume} />
      )}
```

- [ ] **Step 5: Run the full test suite**

Run: `npm run test:run`
Expected: PASS — all existing tests plus the new `prefs` and `ResumeHint` tests are green.

- [ ] **Step 6: Type-check / build and lint**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors (confirms the `Scene` wiring and the aliased import type-check).

Run: `npm run lint`
Expected: no new lint errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/three/Scene.tsx
git commit -m "feat(hint): show ResumeHint while flying until résumé first opened"
```

---

### Task 4: Manual verification

**Files:** none (manual smoke test).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` and open the printed local URL in a browser where WebGL is available (so the galaxy view loads).

- [ ] **Step 2: Verify the happy path**

1. On first load the walkthrough appears; click **Skip**.
2. Confirm the pulsing **"Click here for résumé"** cue appears at the top-left with the ▲ arrow pointing up at the name tag.
3. Fly to a planet and **land** — confirm the hint hides with the rest of the top bar.
4. **Take off** — confirm the hint returns.
5. Click the name tag (or the hint, or the "📄 RESUME VIEW" button) — confirm the résumé opens.
6. Return to galaxy view — confirm the hint is **gone** and stays gone after a page reload (persisted via `galaxy.resumeHint.done`).
7. In DevTools, clear `localStorage` and reload to reset for re-testing.

- [ ] **Step 3: Verify reduced motion**

In DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce", reload, skip the tour, and confirm the hint is still visible but **not** animating.

- [ ] **Step 4: Verify mobile layout**

Toggle a narrow / touch viewport (DevTools device toolbar), reload, skip the tour, and confirm the hint reads **"Tap here for résumé"** and sits under the mobile name chip.
