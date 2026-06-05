'use client';
import type {Difficulty} from '@/lib/minigame/difficulty';
import type {GameState} from '@/lib/minigame/gameState';

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * DOM overlay for the asteroid game. Renders the start menu and the game-over
 * card depending on phase (the live score is a separate `LiveScore` leaf).
 * Purely presentational — every action is a callback owned by AsteroidGame.
 */
export function GameHud({
  state,
  onStart,
  onRetry,
  onMenu,
  onExit,
}: {
  state: GameState;
  onStart: (d: Difficulty) => void;
  onRetry: () => void;
  onMenu: () => void;
  onExit: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-[#e7f6ff]">
      {/* Exit is always reachable, top-left. */}
      <button
        type="button"
        onClick={onExit}
        aria-label="Exit game"
        className="pointer-events-auto absolute z-20 left-[calc(12px+env(safe-area-inset-left))] top-[calc(12px+env(safe-area-inset-top))] rounded-full border border-[#21e6ff]/50 bg-[#0a0a1f]/70 px-3 py-2 font-display text-xs text-cyan-200 backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ✕ Exit
      </button>

      {state.phase === 'menu' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#05030f]/70 backdrop-blur-sm">
          <h2 className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-3xl font-black text-transparent">
            ASTEROID RUN
          </h2>
          <p className="text-sm opacity-75">Drag to fly · thread the gaps · one hit ends the run</p>
          {state.best > 0 && <p className="font-display text-sm text-cyan-200">BEST {state.best}</p>}
          <div className="flex gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onStart(d)}
                className="rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-5 py-3 font-display text-sm uppercase tracking-wide text-cyan-100 shadow-[0_0_14px_rgba(33,230,255,.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {state.phase === 'over' && (
        <div className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#05030f]/75 backdrop-blur-sm">
          <h2 className="font-display text-2xl font-black text-[#ff3df0]">RUN OVER</h2>
          <div className="text-center font-display">
            <div className="text-4xl font-black tabular-nums">{state.score}</div>
            <div className="mt-1 text-sm text-cyan-200">BEST {state.best}</div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onRetry} className="rounded-xl border border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 px-5 py-3 font-display text-sm font-bold text-white shadow-[0_0_16px_#ff3df0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
              ↻ Retry
            </button>
            <button type="button" onClick={onMenu} className="rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-5 py-3 font-display text-sm text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
              Change difficulty
            </button>
            <button type="button" onClick={onExit} className="rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-5 py-3 font-display text-sm text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
