'use client';
import {useEffect, useState} from 'react';
import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import {ContentRenderer} from '@/components/fallback/ContentRenderer';
import type {NavState} from '@/lib/navigation';

/** Delay (ms) before the text panel fades in after landing, so the zoom plays first. */
export const LAND_REVEAL_MS = 1000;

/**
 * Landed-section detail panel. The text panel is ALWAYS mounted but hidden
 * (opacity 0, aria-hidden, no pointer events) until ~1s after landing, then it
 * fades in; on take-off it fades out. Keeping it mounted — rather than mounting/
 * unmounting — lets the CSS opacity transition play cleanly in both directions
 * with no flash. `compact` only makes the panel slightly more transparent so the
 * planet glows behind it. The TAKE OFF button appears immediately on landing.
 */
export function DetailPanel({
  nav,
  onTakeOff,
  compact = false,
}: {
  nav: NavState;
  onTakeOff: () => void;
  /** Touch HUD: extra transparency so the planet stays visible behind the panel. */
  compact?: boolean;
}) {
  const planet = PLANETS[nav.current];
  const glow = planet.glow;

  // Reveal the panel a beat after landing (lets the zoom play); reset on take-off.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!nav.landed) return;
    const id = setTimeout(() => setRevealed(true), LAND_REVEAL_MS);
    return () => {
      clearTimeout(id);
      setRevealed(false);
    };
  }, [nav.landed]);

  const show = nav.landed && revealed;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* TAKE OFF button (bottom-left) — shown immediately on landing. */}
      {nav.landed && (
        <button
          type="button"
          onClick={onTakeOff}
          className="pointer-events-auto absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-[calc(1.5rem+env(safe-area-inset-left))] rounded-xl border border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 px-[18px] py-3 font-display text-[13px] font-bold tracking-wide text-white shadow-[0_0_16px_#ff3df0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          🚀 TAKE OFF
        </button>
      )}

      {/* Text panel — always mounted; fades in after the delay, out on take-off. */}
      <div
        aria-hidden={!show}
        className={`absolute left-1/2 right-auto top-1/2 max-h-[72vh] w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[18px] border pb-6 backdrop-blur-md sm:left-auto sm:right-[4%] sm:max-h-[84vh] sm:translate-x-0 ${
          compact ? 'bg-[#080818]/70' : 'bg-[#080818]/85'
        } ${show ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{
          borderColor: glow,
          boxShadow: `0 0 50px ${glow}`,
          opacity: show ? 1 : 0,
          // Fade in (slower) after the reveal delay; quick fade out on take-off.
          transition: show ? 'opacity 0.45s ease-out' : 'opacity 0.3s ease-in',
        }}
      >
        <div className="border-b border-white/10 px-[26px] pb-4 pt-[22px]">
          <h2 className="m-0 font-display text-[22px]">{planet.label}</h2>
          <div className="mt-1 text-[13px] opacity-65">{planet.subtitle}</div>
        </div>
        <div className="space-y-3 px-[26px] pt-[18px]">
          <ContentRenderer blocks={CONTENT[planet.id]} />
        </div>
      </div>
    </div>
  );
}
