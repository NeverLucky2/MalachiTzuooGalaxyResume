'use client';
import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import {ContentRenderer} from '@/components/fallback/ContentRenderer';
import type {NavState} from '@/lib/navigation';

/**
 * Landed-section detail panel. Shown when `nav.landed`. Header = planet label +
 * subtitle; body reuses the shared <ContentRenderer>. A TAKE OFF button calls
 * `onTakeOff`. Styling ported from the prototype's `.detail` / `.dpanel`.
 */
export function DetailPanel({
  nav,
  onTakeOff,
}: {
  nav: NavState;
  onTakeOff: () => void;
}) {
  const planet = PLANETS[nav.current];
  const glow = planet.glow;

  if (!nav.landed) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* TAKE OFF button (bottom-left) */}
      <button
        type="button"
        onClick={onTakeOff}
        className="pointer-events-auto absolute bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-[calc(1.5rem+env(safe-area-inset-left))] rounded-xl border border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 px-[18px] py-3 font-display text-[13px] font-bold tracking-wide text-white shadow-[0_0_16px_#ff3df0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        🚀 TAKE OFF
      </button>

      {/* Panel (right side) */}
      <div
        className="pointer-events-auto absolute left-1/2 right-auto top-1/2 max-h-[72vh] w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[18px] border bg-[#080818]/85 pb-6 backdrop-blur-md sm:left-auto sm:right-[4%] sm:max-h-[84vh] sm:translate-x-0"
        style={{borderColor: glow, boxShadow: `0 0 50px ${glow}`}}
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
