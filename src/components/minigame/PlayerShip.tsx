'use client';
import type {RefObject} from 'react';
import type * as THREE from 'three';
import type {ShipVariantId} from '@/lib/ships';
import {ShipVariant} from '@/components/three/ShipVariant';

/**
 * The player's ship in the minigame: the equipped ShipVariant scaled up, inside a
 * group the engine positions/banks each frame via `groupRef`. Nosed toward −Z.
 */
export function PlayerShip({
  groupRef,
  variant = 'default',
}: {
  groupRef: RefObject<THREE.Group | null>;
  variant?: ShipVariantId;
}) {
  return (
    <group ref={groupRef}>
      <group rotation={[0, Math.PI, 0]} scale={1.6}>
        <ShipVariant variant={variant} />
      </group>
    </group>
  );
}
