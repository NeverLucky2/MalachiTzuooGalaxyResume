'use client';
import {useEffect, useRef, type RefObject} from 'react';

/**
 * Self-updating live score readout. The engine writes the current score into
 * `scoreRef` each frame; this leaf reads it on its own requestAnimationFrame
 * loop and updates the DOM text imperatively, so the score animates without
 * re-rendering React (and without touching the R3F Canvas).
 */
export function LiveScore({scoreRef}: {scoreRef: RefObject<number>}) {
  const elRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = elRef.current;
      if (el) {
        const s = String(scoreRef.current ?? 0);
        if (el.textContent !== s) el.textContent = s;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [scoreRef]);
  return (
    <div
      ref={elRef}
      className="pointer-events-none absolute right-[calc(14px+env(safe-area-inset-right))] top-[calc(12px+env(safe-area-inset-top))] z-10 font-display text-2xl font-black tabular-nums text-[#e7f6ff] [text-shadow:0_0_10px_rgba(33,230,255,.6)]"
    >
      0
    </div>
  );
}
