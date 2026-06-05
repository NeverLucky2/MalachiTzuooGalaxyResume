'use client';
import {useEffect, useState} from 'react';
import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import {ContentRenderer} from '@/components/fallback/ContentRenderer';
import {ResumeSections} from '@/components/fallback/ResumeSections';
import type {NavState} from '@/lib/navigation';
import {isTakeoffTipSeen, setTakeoffTipSeen} from '@/lib/prefs';

/** Delay (ms) before the text panel fades in after landing, so the zoom plays first. */
export const LAND_REVEAL_MS = 1000;

/**
 * Landed-section detail panel. The text panel is ALWAYS mounted but hidden
 * (opacity 0, aria-hidden, no pointer events) until ~1s after landing, then it
 * fades in; on take-off it fades out. Keeping it mounted — rather than mounting/
 * unmounting — lets the CSS opacity transition play cleanly in both directions
 * with no flash. The background is translucent (with a backdrop blur) so the
 * planet stays visible behind it while the text remains legible. The TAKE OFF
 * button appears immediately on landing.
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

  // Reveal the panel a beat after landing (lets the zoom play); reset on take-off.
  const [revealed, setRevealed] = useState(false);

  const [tipSeen, setTipSeen] = useState(() => isTakeoffTipSeen());
  const markTipSeen = () => {
    setTipSeen(true);
    setTakeoffTipSeen(true);
  };
  const showTip = nav.landed && !tipSeen;
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

      {/* Text panel — always mounted; fades in after the delay, out on take-off. */}
      <div
        aria-hidden={!show}
        className={`absolute left-1/2 right-auto top-1/2 max-h-[72vh] w-[min(440px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-[18px] border bg-[#080818]/60 pb-6 backdrop-blur-md sm:left-auto sm:right-[4%] sm:max-h-[84vh] sm:translate-x-0 ${
          show ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
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
          {/* The RESUME planet shows the résumé minus About (it has its own
              planet); the full 2D résumé view still shows everything. Every
              other planet shows just its own section. */}
          {planet.id === 'resume' ? (
            <ResumeSections idPrefix="resume-panel-" exclude={['about']} />
          ) : (
            <ContentRenderer blocks={CONTENT[planet.id]} />
          )}
        </div>
      </div>
    </div>
  );
}
