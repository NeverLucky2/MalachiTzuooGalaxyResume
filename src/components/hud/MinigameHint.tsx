'use client';
import {useEffect, useState} from 'react';

/** Delay before the easter-egg nudge fades in (ms). */
const APPEAR_MS = 7000;

/**
 * A one-line nudge that the ship hides a mini-game. Fades in a few seconds after
 * entering the galaxy. GalaxyExperience only mounts it until the player has
 * discovered the game (and removes it for this session on dismiss).
 */
export function MinigameHint({onDismiss}: {onDismiss: () => void}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setShown(true), APPEAR_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      aria-hidden={!shown}
      className={`pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 flex justify-center px-6 transition-opacity duration-700 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl border border-[#ff3df0]/50 bg-[#0a0a1f]/85 px-4 py-3 text-sm text-[#ffd9fb] shadow-[0_0_18px_rgba(255,61,240,.3)] backdrop-blur-md ${
          shown ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <span>🚀 Psst — click the ship for a hidden mini-game</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss hint"
          className="flex-none rounded-lg border border-[#ff3df0]/50 px-2 py-1 font-display text-[11px] text-[#ff9cf0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
