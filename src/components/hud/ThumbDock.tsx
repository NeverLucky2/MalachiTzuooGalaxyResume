'use client';
import {PLANETS} from '@/data/planets';
import type {NavState, NavAction} from '@/lib/navigation';

/** Bottom thumb dock for the compact HUD: a camera-angle toggle stacked above
 *  ◀ inward, then LAND, then outward ▶. */
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
      {/* Left column: camera-angle toggle above the inward button. */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          aria-label="Camera angle"
          onClick={() => dispatch({type: 'cyclePreset'})}
          className="pointer-events-auto flex items-center justify-center gap-1 truncate whitespace-nowrap rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/70 px-1 py-2 font-display text-[10px] text-[#9fe9ff] shadow-[0_0_10px_rgba(33,230,255,.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        >
          <span aria-hidden="true">📷</span>
          {nav.preset}
        </button>
        <DockButton aria-label="Inward" onClick={() => dispatch({type: 'prev', n})} disabled={nav.current === 0}>
          ◀
        </DockButton>
      </div>
      <DockButton aria-label="Land" land dataTour="land" onClick={() => dispatch({type: 'land'})}>
        LAND
      </DockButton>
      <DockButton aria-label="Outward" dataTour="fly" onClick={() => dispatch({type: 'next', n})} disabled={nav.current === n - 1}>
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
      onClick={onClick}
      disabled={disabled}
      data-tour={dataTour}
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
