'use client';
import {useEffect, useRef, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import type {NavState, NavAction} from '@/lib/navigation';
import {PLANETS} from '@/data/planets';
import {createMotionState} from '@/lib/motion';
import {useGalaxyControls} from '@/hooks/useGalaxyControls';
import {useIsCompact} from '@/hooks/useIsCompact';
import {useTouchGestures} from '@/hooks/useTouchGestures';
import {MobileHud} from '@/components/hud/MobileHud';
import {Starfield} from './Starfield';
import {Sun} from './Sun';
import {Planets} from './Planets';
import {Galaxies} from './Galaxies';
import {Comets} from './Comets';
import {Ship} from './Ship';
import {CameraRig} from './CameraRig';
import {Hud} from '@/components/hud/Hud';
import {PlanetLabels} from '@/components/hud/PlanetLabels';

export function Scene({
  nav,
  dispatch,
  onSkip,
  reducedMotion = false,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
  /** When true (prefers-reduced-motion + forced galaxy), damp ambient drift. */
  reducedMotion?: boolean;
}) {
  const positionsRef = useRef<[number, number, number][]>(PLANETS.map(() => [0, 0, 0]));
  // Shared motion state (travelT, from-snapshots, look/ship pos, free-look) that
  // CameraRig and Ship both read/write each frame so they stay in lockstep.
  // Controls set shiftHeld/yaw/pitch on it.
  const motion = useRef(createMotionState());

  // Pause the render loop when the tab is hidden to save CPU/GPU/battery, resume
  // when it becomes visible. `always` runs R3F's continuous loop; `never` stops
  // it entirely (we drive nothing while hidden).
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always');
  useEffect(() => {
    const sync = () => setFrameloop(document.hidden ? 'never' : 'always');
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, []);

  // Keyboard / pointer-drag / click-to-fly controls.
  const isCompact = useIsCompact();
  const {boost, onSelect, onPointerDown} = useGalaxyControls({
    nav,
    dispatch,
    motion: motion.current,
    compact: isCompact,
  });
  const gestures = useTouchGestures({nav, dispatch, enabled: isCompact});

  return (
    <>
      {/* The canvas is purely decorative — all content lives in the HUD (DOM) and
          the SSR resume fallback. Hide it from assistive tech. */}
      <div className="fixed inset-0 z-10" aria-hidden="true">
        <Canvas
          camera={{fov: 55, position: [0, 95, 210], near: 0.1, far: 4000}}
          dpr={[1, 2]}
          frameloop={frameloop}
          gl={{antialias: true}}
          onPointerDown={(e) => {
            onPointerDown(e);
            gestures.onPointerDown(e);
          }}
        >
          <ambientLight color={0x6a7fb0} intensity={1.45} />
          <pointLight color={0xfff0d0} intensity={1.9} distance={0} decay={0.015} />
          <Starfield />
          <Sun />
          <Planets
            current={nav.current}
            positionsRef={positionsRef}
            onSelect={onSelect}
            reducedMotion={reducedMotion}
          />
          <Galaxies />
          <Comets reducedMotion={reducedMotion} />
          {/* ORDER MATTERS: CameraRig MUST render before Ship. R3F runs
              same-priority useFrame callbacks in mount (JSX) order, and CameraRig
              is the sole owner of trip-start — it must snapshot motion.shipFrom
              from the ship's OLD position before Ship moves it. See CameraRig.tsx. */}
          <CameraRig nav={nav} positionsRef={positionsRef} motion={motion.current} compact={isCompact} />
          <Ship nav={nav} positionsRef={positionsRef} motion={motion.current} />
          <PlanetLabels
            current={nav.current}
            landed={nav.landed}
            positionsRef={positionsRef}
          />
        </Canvas>
      </div>
      {/* DOM overlay HUD — sibling of the Canvas, NOT inside it. Compact (touch)
          devices and narrow windows get the MobileHud; desktop keeps the full Hud. */}
      {isCompact ? (
        <MobileHud nav={nav} dispatch={dispatch} onSkip={onSkip} />
      ) : (
        <Hud nav={nav} dispatch={dispatch} onSkip={onSkip} boost={boost} />
      )}
    </>
  );
}
