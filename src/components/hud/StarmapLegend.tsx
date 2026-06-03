'use client';
import {PLANETS} from '@/data/planets';
import type {NavState, NavAction} from '@/lib/navigation';

/**
 * Top-right starmap legend — one row per section (color dot + label + index).
 * Clicking a row flies to and lands on that section (`selectAndLand`). The
 * current section is highlighted. Styling ported from the prototype's `.legend`.
 */
export function StarmapLegend({
  nav,
  dispatch,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
}) {
  return (
    <div className="min-w-[182px] rounded-[14px] border border-[#21e6ff]/40 bg-[#0a0a1f]/60 px-3 py-[10px] shadow-[0_0_16px_rgba(33,230,255,.25)] backdrop-blur-md">
      <div className="mx-1 mb-2 font-[Orbitron] text-[10px] uppercase tracking-[2px] opacity-65">
        ◇ Starmap — jump anywhere
      </div>
      {PLANETS.map((p, i) => {
        const cur = i === nav.current;
        return (
          <button
            type="button"
            key={p.id}
            onClick={() => dispatch({type: 'selectAndLand', index: i})}
            className={`flex w-full items-center gap-[9px] rounded-lg px-2 py-[6px] text-left text-xs text-[#e7f6ff] transition-opacity hover:bg-white/[.06] ${
              cur
                ? 'bg-[#21e6ff]/[.12] opacity-100 shadow-[inset_0_0_0_1px_rgba(33,230,255,.4)]'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <span
              className="h-3 w-3 flex-none rounded-full"
              style={{background: p.glow, boxShadow: `0 0 8px ${p.glow}`}}
            />
            <span>{p.label}</span>
            <span className="ml-auto font-[Orbitron] text-[9px] opacity-50">
              {`0${i + 1}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
