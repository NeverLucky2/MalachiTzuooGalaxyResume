'use client';
import {useCallback, useEffect, useRef, useState} from 'react';
import {PLANETS} from '@/data/planets';
import type {MotionState} from '@/lib/motion';
import type {NavState, NavAction} from '@/lib/navigation';

const N = PLANETS.length;

/**
 * Input controls for the galaxy: keyboard nav, Shift boost, free-look drag, and
 * click-to-fly. Ported from the prototype's keydown/pointer handlers.
 *
 * - Keyboard (window listeners): Shift → boost; while landed Escape/ArrowDown →
 *   takeOff (others ignored); else ←/a prev, →/d next, Enter/Space/↑ land, v/V
 *   cyclePreset.
 * - Free-look: drag (pointerdown on canvas + move) accumulates motion.yaw/pitch.
 * - Click-to-fly: `onSelect(index)` — TOP-DOWN → selectAndLand; else land current
 *   or goTo. Wire to each planet mesh's onClick.
 *
 * Returns `{boost, onSelect, onPointerDown}`. `boost` re-renders the speed hint.
 */
export function useGalaxyControls({
  nav,
  dispatch,
  motion,
  compact = false,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  motion: MotionState;
  /** Compact (touch) mode: a tap on any planet flies in and lands in one action. */
  compact?: boolean;
}) {
  const [boost, setBoost] = useState(false);

  // Keep latest nav in a ref so window listeners (bound once) read fresh state.
  const navRef = useRef(nav);
  navRef.current = nav;

  const compactRef = useRef(compact);
  compactRef.current = compact;

  // --- keyboard ---
  useEffect(() => {
    const setShift = (on: boolean) => {
      motion.shiftHeld = on;
      setBoost(on);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShift(true);
      const cur = navRef.current;
      if (cur.landed) {
        if (e.key === 'Escape' || e.key === 'ArrowDown') dispatch({type: 'takeOff'});
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'd') dispatch({type: 'next', n: N});
      else if (e.key === 'ArrowLeft' || e.key === 'a') dispatch({type: 'prev', n: N});
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp')
        dispatch({type: 'land'});
      else if (e.key === 'v' || e.key === 'V') dispatch({type: 'cyclePreset'});
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setShift(false);
    };
    const onBlur = () => setShift(false);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [dispatch, motion]);

  // --- free-look drag (window move/up; pointerdown comes from the canvas) ---
  const drag = useRef({active: false, px: 0, py: 0});

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current.active) return;
      motion.yaw += (e.clientX - drag.current.px) * 0.005;
      motion.pitch += (e.clientY - drag.current.py) * 0.003;
      // Mobile drag rotates the view (CameraRig free-look), so allow a wider
      // vertical range than the desktop strafe to survey the scene.
      const pitchLimit = compactRef.current ? 1.2 : 0.5;
      motion.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, motion.pitch));
      drag.current.px = e.clientX;
      drag.current.py = e.clientY;
    };
    const onUp = () => {
      drag.current.active = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [motion]);

  const onPointerDown = useCallback((e: {clientX: number; clientY: number}) => {
    drag.current.active = true;
    drag.current.px = e.clientX;
    drag.current.py = e.clientY;
  }, []);

  // --- click-to-fly / land (wire to each planet mesh onClick) ---
  const onSelect = useCallback(
    (index: number) => {
      const cur = navRef.current;
      if (cur.landed) return;
      if (compactRef.current || cur.preset === 'TOP-DOWN') dispatch({type: 'selectAndLand', index});
      else if (index === cur.current) dispatch({type: 'land'});
      else dispatch({type: 'goTo', index, n: N});
    },
    [dispatch],
  );

  return {boost, onSelect, onPointerDown};
}
