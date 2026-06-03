'use client';
import {useEffect, useMemo} from 'react';
import * as THREE from 'three';

/**
 * Starfield — 1800 points distributed on a sphere of radius 500–1700,
 * ported verbatim from the prototype starfield block.
 */
export function Starfield() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (let i = 0; i < 1800; i++) {
      const r = 500 + Math.random() * 1200;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      positions.push(
        r * Math.sin(ph) * Math.cos(th),
        r * Math.cos(ph),
        r * Math.sin(ph) * Math.sin(th),
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  // Imperatively-created geometry — dispose on unmount (R3F won't).
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color={0xffffff}
        size={1.6}
        sizeAttenuation
        transparent
        opacity={0.9}
      />
    </points>
  );
}
