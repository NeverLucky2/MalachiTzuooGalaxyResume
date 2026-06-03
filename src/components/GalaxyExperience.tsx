'use client';
import {useEffect, useReducer, useState} from 'react';
import dynamic from 'next/dynamic';
import {detectCaps, shouldUse3D} from '@/lib/capabilities';
import {initialNav, navReducer} from '@/lib/navigation';

const Scene = dynamic(() => import('@/components/three/Scene').then(m => m.Scene), {ssr:false});

type Mode = 'galaxy' | 'resume';

/**
 * Top-level switch between the two views: the 3D `galaxy` scene and the clean 2D
 * `resume`. Exactly one is visible at a time — when in `galaxy` mode the SSR'd
 * #resume-2d block is hidden via `[data-mode="galaxy"]` CSS so its text never
 * bleeds through the transparent canvas; when in `resume` mode the Scene is
 * unmounted entirely. Initial mode honours device capabilities.
 */
export function GalaxyExperience() {
  // Start in `resume` for SSR / no-JS / no-WebGL; promote to `galaxy` on mount.
  const [mode, setMode] = useState<Mode>('resume');
  const [hasWebGL, setHasWebGL] = useState(false);
  const [nav, dispatch] = useReducer(navReducer, undefined, initialNav);

  // Decide the initial view once on the client, where we can detect caps.
  useEffect(() => {
    const caps = detectCaps();
    setHasWebGL(caps.hasWebGL);
    if (shouldUse3D(caps)) setMode('galaxy');
  }, []);

  // Mirror the mode onto <html> so CSS can hide the SSR résumé under the canvas.
  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  if (mode === 'galaxy') {
    return <Scene nav={nav} dispatch={dispatch} onSkip={() => setMode('resume')} />;
  }

  // Résumé mode: only offer the galaxy toggle when WebGL is actually available.
  if (!hasWebGL) return null;
  return (
    <button
      type="button"
      onClick={() => setMode('galaxy')}
      className="fixed right-4 top-4 z-30 rounded-xl border border-cyan-400/60 bg-[#0a0a1f]/70 px-4 py-2.5 font-[Orbitron] text-sm text-cyan-200 shadow-[0_0_16px_rgba(33,230,255,.4)] backdrop-blur-md transition hover:bg-[#0a0a1f]/90 hover:shadow-[0_0_22px_rgba(33,230,255,.6)]"
    >
      🚀 Galaxy view
    </button>
  );
}
