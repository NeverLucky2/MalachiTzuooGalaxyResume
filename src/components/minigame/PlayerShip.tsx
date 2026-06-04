'use client';
import type {RefObject} from 'react';
import type * as THREE from 'three';
import {ShipModel} from '@/components/three/ShipModel';

/**
 * The player's ship in the minigame: the shared ShipModel scaled up, inside a
 * group the engine positions/banks each frame via `groupRef`. Nosed toward −Z
 * (into the oncoming asteroids) since ShipModel's forward is +Z.
 */
export function PlayerShip({groupRef}: {groupRef: RefObject<THREE.Group | null>}) {
  return (
    <group ref={groupRef}>
      <group rotation={[0, Math.PI, 0]} scale={1.6}>
        <ShipModel />
      </group>
    </group>
  );
}
