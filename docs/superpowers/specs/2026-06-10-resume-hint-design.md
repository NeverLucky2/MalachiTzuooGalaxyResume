# Résumé Hint — Design

**Date:** 2026-06-10
**Status:** Approved

## Problem

A visitor who skips (or rushes through) the opening walkthrough may not realize
the name tag in the top-left corner is a button that jumps to the full résumé.
We want a small, pulsating **"Click here for résumé"** cue with an arrow pointing
at the name tag, so the résumé is always one obvious click away.

## Behaviour (decided)

- **When it shows:** after the walkthrough closes (skipped *or* finished), and on
  any later visit where the tour is already done — i.e. whenever the tour is not
  on screen and the visitor has not yet opened the résumé.
- **When it goes away — for good:** the first time the visitor opens the résumé
  by any path (name tag, the "📄 RESUME VIEW" control, the mobile menu). The
  dismissal is persisted, so it never shows again on that browser.
- **Also hidden while:** landed on a planet (the whole top bar hides then) or
  while the asteroid mini-game is open (`paused`).
- **Platforms:** both desktop (`Hud`) and compact/touch (`MobileHud` /
  `IdentityChip`).

The gate falls out cleanly: first-time visitors see the tour first; returning
visitors who skipped before see the hint immediately until they open the résumé
once.

## Approach

A single new `ResumeHint` component rendered once in `Scene.tsx` alongside the
HUD, statically pinned to the top-left just under the name tag. Both name tags
(desktop and mobile) live in that same corner, so one safe-area-aware position
lines up on both. Dismissal flows through the existing `onSkip` handler, which
every "open résumé" path already calls — no duplicated logic.

Alternatives considered and rejected:

- **Render inside both `Hud` and `MobileHud`.** More physically coupled to each
  tag, but duplicates the gating condition and prop plumbing across two
  components.
- **Measure the `[data-tour="name"]` rect** (reuse the `Walkthrough` pattern) for
  a pixel-perfect arrow. Most precise, but adds resize listeners and a
  first-frame flicker to manage — marginal gain since the tag sits in a fixed
  corner.

## Components

### 1. Persistence — `src/lib/prefs.ts`

Add a boolean flag mirroring the existing `TOUR_DONE_KEY` pattern:

```
export const RESUME_HINT_KEY = 'galaxy.resumeHint.done';
export const isResumeHintDone = () => readBool(RESUME_HINT_KEY, false);
export const setResumeHintDone = (done: boolean) => writeBool(RESUME_HINT_KEY, done);
```

Default `false`. Reads/writes are already SSR-safe and storage-failure-safe via
the shared `readBool`/`writeBool` helpers.

### 2. New component — `src/components/hud/ResumeHint.tsx`

A `pointer-events-auto` `<button>` fixed to the top-left, below the name tag,
with a short arrow pointing up toward the tag.

Props:

```ts
{ compact: boolean; onOpen: () => void }
```

- **Copy** adapts like `tourSteps` does: `"Click here for résumé"` on desktop,
  `"Tap here for résumé"` when `compact`.
- **Click** calls `onOpen` (the same résumé-open handler the name tag uses), so
  the literal "click here" works, and the arrow teaches that the name tag is
  clickable too.
- **Position:** `fixed`, anchored with
  `top: calc(70px + env(safe-area-inset-top))` and
  `left: calc(16px + env(safe-area-inset-left))` so it sits just under the name
  tag on both layouts. `z` index between the HUD and the walkthrough.
- **Pulse:** a custom `@keyframes` (gentle scale + neon glow in the
  cyan `#21e6ff` → magenta `#ff3df0` palette) registered in `globals.css` via
  Tailwind v4's `--animate-resume-pulse` theme variable; applied with
  `animate-resume-pulse motion-reduce:animate-none` so it honours
  `prefers-reduced-motion`.
- `aria-label="View résumé"`.

### 3. Global CSS — `src/app/globals.css`

Register the animation under the existing `@theme inline` block and define the
keyframes:

```css
@theme inline {
  --animate-resume-pulse: resume-pulse 1.8s ease-in-out infinite;
}
@keyframes resume-pulse {
  0%, 100% { transform: scale(1);    box-shadow: 0 0 12px rgba(33,230,255,.45); }
  50%      { transform: scale(1.05); box-shadow: 0 0 22px rgba(255,61,240,.65); }
}
```

(Exact values may be tuned during implementation to match the existing glow.)

### 4. Wiring — `src/components/three/Scene.tsx`

- New state: `const [resumeHintDone, setHintDone] = useState(() => isResumeHintDone())`.
- Wrap `onSkip` once:

  ```ts
  const handleOpenResume = useCallback(() => {
    if (!resumeHintDone) { setHintDone(true); persistResumeHintDone(true); }
    onSkip();
  }, [onSkip, resumeHintDone]);
  ```

  (Import the pref writer aliased: `setResumeHintDone as persistResumeHintDone`.)
- Pass `handleOpenResume` as `onSkip` to both `Hud` and `MobileHud`, so every
  résumé-open path dismisses the hint.
- Render the hint when not otherwise occluded:

  ```tsx
  {!showTour && !nav.landed && !paused && !resumeHintDone && (
    <ResumeHint compact={isCompact} onOpen={handleOpenResume} />
  )}
  ```

## Data flow

```
name tag / RESUME VIEW / mobile menu  ──onSkip──▶ handleOpenResume (Scene)
                                                    │
                                          first call│ persist galaxy.resumeHint.done = 1
                                                    ▼
                                                  onSkip()  → GalaxyExperience.showResume()
ResumeHint button ────────────────────onOpen──────┘   (also dismisses)
```

The hint's visibility is pure derived state: shown only while
`!showTour && !nav.landed && !paused && !resumeHintDone`.

## Error handling

Inherited. `prefs` reads return the default when `window` is absent or storage
throws; writes silently no-op on failure. The component renders nothing when the
gate is false, so there is no runtime path that can fail.

## Testing

- **`src/lib/prefs.test.ts`** — `isResumeHintDone()` defaults `false`; after
  `setResumeHintDone(true)` it reads `true`.
- **`src/components/hud/ResumeHint.test.tsx`**
  - renders "Click here" copy by default, "Tap here" when `compact`;
  - is a button whose click calls `onOpen` once;
  - carries `motion-reduce:animate-none` (reduced-motion respected).

Scene-level wiring (the gate and the `onSkip` wrap) is straightforward
composition and is left to manual/visual verification, consistent with how
`Scene` (ssr:false, three.js heavy) is otherwise untested.

## Out of scope (YAGNI)

- Distinguishing tour-skip from tour-complete (the flag serves both).
- A separate "✕ dismiss" affordance (opening the résumé is the dismissal).
- Auto-fade timers.
- Measuring the tag rect for a dynamic arrow.
