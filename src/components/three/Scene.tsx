'use client';
import {useRef} from 'react';
import {Canvas} from '@react-three/fiber';
import type {NavState, NavAction} from '@/lib/navigation';
import {PLANETS} from '@/data/planets';
import {Starfield} from './Starfield';
import {Sun} from './Sun';
import {Planets} from './Planets';
import {Galaxies} from './Galaxies';
import {Comets} from './Comets';

export function Scene({nav, dispatch: _dispatch}: {nav: NavState; dispatch: React.Dispatch<NavAction>}) {
  const positionsRef = useRef<[number, number, number][]>(PLANETS.map(() => [0, 0, 0]));

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
        {/* Ship, CameraRig, HUD added in later tasks */}
      </Canvas>
    </div>
  );
}
