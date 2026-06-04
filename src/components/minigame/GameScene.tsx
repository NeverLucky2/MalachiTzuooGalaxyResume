'use client';
import {useRef, type RefObject} from 'react';
import type * as THREE from 'three';
import {Starfield} from '@/components/three/Starfield';
import {PLAY} from '@/lib/minigame/world';
import type {Difficulty} from '@/lib/minigame/difficulty';
import {PlayerShip} from './PlayerShip';
import {Asteroids} from './Asteroids';
import {useGameEngine} from './useGameEngine';

/**
 * The 3D contents of the minigame: angled key/fill lighting, the galaxy
 * starfield for depth, the player ship, and the instanced asteroid field. Hosts
 * the engine, which owns the per-frame simulation.
 */
export function GameScene({
  difficulty,
  pointerRef,
  onGameOver,
}: {
  difficulty: Difficulty;
  pointerRef: RefObject<{x: number; y: number} | null>;
  onGameOver: (score: number) => void;
}) {
  const shipRef = useRef<THREE.Group>(null);
  const asteroidsRef = useRef<THREE.InstancedMesh>(null);

  useGameEngine({difficulty, pointerRef, shipRef, asteroidsRef, onGameOver});

  return (
    <>
      <ambientLight color={0x6a7fb0} intensity={1.2} />
      <directionalLight position={[6, 8, 4]} intensity={1.6} color={0xfff0d0} />
      <Starfield />
      <PlayerShip groupRef={shipRef} />
      <Asteroids meshRef={asteroidsRef} count={PLAY.poolSize} />
    </>
  );
}
