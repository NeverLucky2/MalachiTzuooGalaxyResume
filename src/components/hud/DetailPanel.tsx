'use client';
import {useEffect, useState} from 'react';
import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import {ContentRenderer} from '@/components/fallback/ContentRenderer';
import type {NavState} from '@/lib/navigation';

/** Mobile-only delay (ms) before the text panel appears, so the landing zoom is
 *  visible first instead of being instantly covered. */
export const LAND_REVEAL_MS = 1000;

/**
 * Landed-section detail panel. Shown when `nav.landed`. Header = planet label +
 * subtitle; body reuses the shared <ContentRenderer>. A TAKE OFF button calls
 * `onTakeOff`. On `compact` (touch) devices the text panel is held back ~1s after
 * landing and rendered slightly more transparent so the planet zoom stays
 * visible; the TAKE OFF button still appears immediately. Desktop is unchanged.
 */
export function DetailPanel({
  nav,
  onTakeOff,
  compact = false,
}: {
  nav: NavState;
  onTakeOff: () => void;
  /** Touch HUD: delay + extra transparency so the landing zoom is visible. */
  compact?: boolean;
}) {
  const planet = PLANETS[nav.current];
  const glow = planet.glow;

  // On compact devices, hold the text panel back until the zoom has played; on
  // desktop it is shown immediately (initial `true`). The reveal is scheduled
  // when landed and reset in cleanup on take-off, so each landing re-delays.
  const [revealed, setRevealed] = useState(!compact);
  useEffect(() => {
    if (!compact || !nav.landed) return;
    const id = setTimeout(() => setRevealed(true), LAND_REVEAL_MS);
    return () => {
      clearTimeout(id);
      setRevealed(false);
    };
  }, [compact, nav.landed]);

  if (!nav.landed) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* TAKE OFF button (bottom-left) — shown immediately on landing. */}
      <button
        type="button"
        onClick={onTakeOff}
        className="pointer-events-auto absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-[calc(1.5rem+env(safe-area-inset-left))] rounded-xl border border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 px-[18px] py-3 font-display text-[13px] font-bold tracking-wide text-white shadow-[0_0_16px_#ff3df0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        🚀 TAKE OFF
      </button>

      {/* Text panel — on compact it appears only after LAND_REVEAL_MS (lets the
          zoom show); more transparent on compact so the planet glows behind. */}
      {revealed && (
        <div
          className={`pointer-events-auto absolute left-1/2 right-auto top-1/2 max-h-[72vh] w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[18px] border pb-6 backdrop-blur-md sm:left-auto sm:right-[4%] sm:max-h-[84vh] sm:translate-x-0 ${
            compact ? 'bg-[#080818]/70' : 'bg-[#080818]/85'
          }`}
          style={{
            borderColor: glow,
            boxShadow: `0 0 50px ${glow}`,
            // Fade in on every landing (desktop and mobile). On compact the panel
            // mounts after the reveal delay, so the fade follows the zoom.
            animation: 'detailFadeIn 0.45s ease-out',
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
      )}
    </div>
  );
}
