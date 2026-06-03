'use client';
import {useRef} from 'react';
import {Canvas} from '@react-three/fiber';
import type {NavState, NavAction} from '@/lib/navigation';
import {PLANETS} from '@/data/planets';
import {createMotionState} from '@/lib/motion';
import {useGalaxyControls} from '@/hooks/useGalaxyControls';
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
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
}) {
  const positionsRef = useRef<[number, number, number][]>(PLANETS.map(() => [0, 0, 0]));
  // Shared motion state (travelT, from-snapshots, look/ship pos, free-look) that
  // CameraRig and Ship both read/write each frame so they stay in lockstep.
  // Controls set shiftHeld/yaw/pitch on it.
  const motion = useRef(createMotionState());

  // Keyboard / pointer-drag / click-to-fly controls.
  const {boost, onSelect, onPointerDown} = useGalaxyControls({
    nav,
    dispatch,
    motion: motion.current,
  });

  return (
    <>
      <div className="fixed inset-0 z-10">
        <Canvas
          camera={{fov: 55, position: [0, 95, 210], near: 0.1, far: 4000}}
          dpr={[1, 2]}
          gl={{antialias: true}}
          onPointerDown={(e) => onPointerDown(e)}
        >
          <ambientLight color={0x6a7fb0} intensity={1.45} />
          <pointLight color={0xfff0d0} intensity={1.9} distance={0} decay={0.015} />
          <Starfield />
          <Sun />
          <Planets current={nav.current} positionsRef={positionsRef} onSelect={onSelect} />
          <Galaxies />
          <Comets />
          <Ship nav={nav} positionsRef={positionsRef} motion={motion.current} />
          <CameraRig nav={nav} positionsRef={positionsRef} motion={motion.current} />
          <PlanetLabels
            current={nav.current}
            landed={nav.landed}
            positionsRef={positionsRef}
          />
        </Canvas>
      </div>
      {/* DOM overlay HUD — sibling of the Canvas, NOT inside it. */}
      <Hud nav={nav} dispatch={dispatch} onSkip={onSkip} boost={boost} />
    </>
  );
}
