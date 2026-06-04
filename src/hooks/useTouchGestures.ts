'use client';
import {useCallback, useEffect, useRef} from 'react';
import {PLANETS} from '@/data/planets';
import {classifyGesture} from '@/lib/gesture';
import type {NavState, NavAction} from '@/lib/navigation';

const N = PLANETS.length;

/**
 * Touch flick gestures for the compact HUD. Records the start point on canvas
 * pointerdown and classifies on the window pointerup. Travel/land flicks act only
 * while flying; the take-off flick acts only while landed.
 *
 * The swipe-down-to-take-off vs panel-scroll conflict is resolved by layering:
 * the landed DetailPanel is a `pointer-events-auto` sibling ABOVE the canvas, so a
 * touch that begins on the panel never reaches this canvas handler — it scrolls.
 * Only touches that begin on the bare canvas (around the planet) can take off.
 *
 * Returns `{onPointerDown}` to attach to <Canvas> (composed with the free-look
 * drag handler). No-ops entirely when `enabled` is false.
 */
export function useTouchGestures({
  nav,
  dispatch,
  enabled,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  enabled: boolean;
}) {
  const navRef = useRef(nav);
  navRef.current = nav;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const start = useRef<{x: number; y: number; t: number} | null>(null);

  const onPointerDown = useCallback((e: {clientX: number; clientY: number}) => {
    if (!enabledRef.current) return;
    start.current = {x: e.clientX, y: e.clientY, t: performance.now()};
  }, []);

  useEffect(() => {
    const onUp = (e: PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!enabledRef.current || !s) return;
      const g = classifyGesture(e.clientX - s.x, e.clientY - s.y, performance.now() - s.t);
      if (g === 'look') return;
      if (navRef.current.landed) {
        if (g === 'takeOff') dispatch({type: 'takeOff'});
        return;
      }
      if (g === 'next') dispatch({type: 'next', n: N});
      else if (g === 'prev') dispatch({type: 'prev', n: N});
      else if (g === 'land') dispatch({type: 'land'});
      // 'takeOff' while flying → ignored
    };
    window.addEventListener('pointerup', onUp);
    return () => window.removeEventListener('pointerup', onUp);
  }, [dispatch]);

  return {onPointerDown};
}
