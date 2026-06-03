'use client';
import {useEffect, useReducer, useState} from 'react';
import dynamic from 'next/dynamic';
import {detectCaps, shouldUse3D} from '@/lib/capabilities';
import {initialNav, navReducer} from '@/lib/navigation';

const Scene = dynamic(() => import('@/components/three/Scene').then(m => m.Scene), {ssr:false});

export function GalaxyExperience() {
  const [enabled, setEnabled] = useState(false);
  const [forced, setForced] = useState(false);
  // Skip → unmount the 3D scene, revealing the SSR'd FallbackResume beneath it.
  const [show2D, setShow2D] = useState(false);
  const [nav, dispatch] = useReducer(navReducer, undefined, initialNav);

  useEffect(() => { if (shouldUse3D(detectCaps())) setEnabled(true); }, []);

  // Skipped to the 2D résumé — leave the SSR fallback visible.
  if (show2D) return null;

  if (!enabled && !forced) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center">
        <button onClick={() => setForced(true)}
          className="pointer-events-auto rounded-xl border border-cyan-400/60 bg-[#0a0a1f]/70 px-5 py-3 font-[Orbitron] text-sm text-cyan-200 shadow-[0_0_16px_rgba(33,230,255,.4)]">
          ▶ Enter the galaxy (3D)
        </button>
      </div>
    );
  }
  return <Scene nav={nav} dispatch={dispatch} onSkip={() => setShow2D(true)} />;
}
