'use client';
import {useRef} from 'react';
import {Canvas} from '@react-three/fiber';
import type {NavState, NavAction} from '@/lib/navigation';
import {PLANETS} from '@/data/planets';
import {createMotionState} from '@/lib/motion';
import {Starfield} from './Starfield';
import {Sun} from './Sun';
import {Planets} from './Planets';
import {Galaxies} from './Galaxies';
import {Comets} from './Comets';
import {Ship} from './Ship';

export function Scene({nav, dispatch: _dispatch}: {nav: NavState; dispatch: React.Dispatch<NavAction>}) {
  const positionsRef = useRef<[number, number, number][]>(PLANETS.map(() => [0, 0, 0]));
  // Shared motion state (travelT, from-snapshots, look/ship pos, free-look) that
  // CameraRig and Ship both read/write each frame so they stay in lockstep.
  // Exposed for a later controls task to set shiftHeld/yaw/pitch.
  const motion = useRef(createMotionState());

  return (
    <div className="fixed inset-0 z-10">
      <Canvas
        camera={{fov: 55, position: [0, 95, 210], near: 0.1, far: 4000}}
        dpr={[1, 2]}
        gl={{antialias: true}}
      >
        <ambientLight color={0x6a7fb0} intensity={1.45} />
        <pointLight color={0xfff0d0} intensity={1.9} distance={0} decay={0.015} />
        <Starfield />
        <Sun />
        <Planets current={nav.current} positionsRef={positionsRef} />
        <Galaxies />
        <Comets />
        <Ship nav={nav} positionsRef={positionsRef} motion={motion.current} />
        {/* CameraRig (Task 14) + HUD added next */}
      </Canvas>
    </div>
  );
}
