'use client';
import type {RefObject} from 'react';
import type * as THREE from 'three';

/**
 * One InstancedMesh for the whole asteroid pool. The engine writes a transform
 * into each instance every frame (inactive instances are scaled to 0). Low-poly
 * icosahedron, rocky matte material — cheap to draw `count` of.
 */
export function Asteroids({meshRef, count}: {meshRef: RefObject<THREE.InstancedMesh | null>; count: number}) {
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={0x8b8f9a} roughness={0.95} metalness={0.05} flatShading />
    </instancedMesh>
  );
}
