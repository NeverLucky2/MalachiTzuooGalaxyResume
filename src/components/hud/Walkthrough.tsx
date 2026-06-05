'use client';
import {useEffect, useState} from 'react';
import {tourSteps} from '@/lib/walkthrough';
import {setTourDone} from '@/lib/prefs';

/**
 * Opening spotlight tour. Dims the scene and rings the current step's control
 * (matched by `[data-tour=…]`); the ship step has no DOM node so it shows a
 * centered card with no ring. Persists `galaxy.tour.done` on finish/skip.
 */
export function Walkthrough({compact, onClose}: {compact: boolean; onClose: () => void}) {
  const steps = tourSteps(compact);
  const [i, setI] = useState(0);
  const step = steps[i];
  const last = i === steps.length - 1;

  // Measure the current target's box so the ring lines up; re-measure on resize.
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const measure = () => {
      if (!step.target) {
        setRect(null);
        return;
      }
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step.target]);

  const finish = () => {
    setTourDone(true);
    onClose();
  };
  const next = () => (last ? finish() : setI((v) => v + 1));
  const back = () => setI((v) => Math.max(0, v - 1));

  return (
    <div className="fixed inset-0 z-50">
      {rect ? (
        // The ring's huge spread box-shadow dims everything EXCEPT the cutout.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl border-2 border-[#21e6ff]"
          style={{
            left: rect.left - 8,
            top: rect.top - 8,
            width: rect.width + 16,
            height: rect.height + 16,
            boxShadow: '0 0 0 9999px rgba(3,3,12,0.74), 0 0 26px rgba(33,230,255,.7)',
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-[#03030c]/74" />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Walkthrough"
        className="fixed left-1/2 top-1/2 w-[min(360px,88vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#21e6ff]/55 bg-[#08081a]/95 p-5 text-[#e7f6ff] shadow-[0_0_40px_rgba(33,230,255,.35)] backdrop-blur-md"
      >
        <div className="font-display text-[10px] uppercase tracking-[2px] text-[#7fb0c9]">
          Step {i + 1} of {steps.length}
        </div>
        <h3 className="mt-1 font-display text-lg font-bold">{step.title}</h3>
        <p className="mt-2 text-sm text-[#cfe6f5]">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((s, idx) => (
              <span
                key={s.key}
                className={`h-1.5 w-1.5 rounded-full ${
                  idx === i ? 'bg-[#21e6ff] shadow-[0_0_6px_#21e6ff]' : 'bg-[#2a3a55]'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={finish}
              className="text-xs text-[#9fb6cf] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              Skip
            </button>
            {i > 0 && (
              <button
                type="button"
                onClick={back}
                className="rounded-lg border border-[#21e6ff]/50 px-3 py-1.5 text-xs text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="rounded-lg bg-[#21e6ff] px-3 py-1.5 text-xs font-bold text-[#05030f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
              {last ? 'Done' : 'Next ▸'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
