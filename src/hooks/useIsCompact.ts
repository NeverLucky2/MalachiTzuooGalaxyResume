'use client';
import {useEffect, useState} from 'react';
import {isCompact} from '@/lib/capabilities';

/** Read the current compact state from the live window. SSR-safe (returns false). */
function read(): boolean {
  if (typeof window === 'undefined') return false;
  return isCompact({
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    width: window.innerWidth,
  });
}

/**
 * Reactive `isCompact` — recomputes on resize, orientation change, and pointer
 * media changes so a rotated phone or resized window flips HUDs correctly.
 * `Scene` is client-only (dynamic import, ssr:false), so reading window on the
 * first render is safe.
 */
export function useIsCompact(): boolean {
  const [compact, setCompact] = useState<boolean>(read);
  useEffect(() => {
    const update = () => setCompact(read());
    update();
    const mq = window.matchMedia('(pointer: coarse)');
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    mq.addEventListener('change', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      mq.removeEventListener('change', update);
    };
  }, []);
  return compact;
}
