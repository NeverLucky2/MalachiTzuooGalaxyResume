'use client';
import {Canvas} from '@react-three/fiber';
import type {NavState, NavAction} from '@/lib/navigation';
import {Starfield} from './Starfield';
import {Sun} from './Sun';

export function Scene({nav: _nav, dispatch: _dispatch}: {nav: NavState; dispatch: React.Dispatch<NavAction>}) {
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
        {/* Planets, Ship, CameraRig, Backdrop added in later tasks */}
      </Canvas>
    </div>
  );
}
