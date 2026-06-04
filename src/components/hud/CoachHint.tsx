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
