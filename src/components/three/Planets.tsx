'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {PLANETS} from '@/data/planets';
import {Planet} from './Planet';

type PositionsRef = {current: [number, number, number][]};

// Ambient orbital drift is damped to this fraction of normal when the user
// prefers reduced motion but has forced their way into the galaxy view.
const REDUCED_MOTION_FACTOR = 0.15;

export function Planets({
  current,
  positionsRef,
  onSelect,
  reducedMotion = false,
}: {
  current: number;
  positionsRef: PositionsRef;
  /** Click-to-fly handler invoked with the clicked planet's index. */
  onSelect?: (index: number) => void;
  /** Damp idle orbital speed for prefers-reduced-motion users. */
  reducedMotion?: boolean;
}) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const ang = useRef<number[]>(PLANETS.map((_, i) => i * 1.1));

  // Build orbit LineLoop geometries once
  const orbitGeos = useMemo(() => {
    return PLANETS.map((p) => {
      const pts: THREE.Vector3[] = [];
      for (let a = 0; a <= 96; a++) {
        const t = (a / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(t) * p.orbitRadius, 0, Math.sin(t) * p.orbitRadius));
      }
      return new THREE.BufferGeometry().setFromPoints(pts);
    });
  }, []);

  // Orbit geometries are created imperatively, so dispose them on unmount.
  useEffect(() => () => orbitGeos.forEach((g) => g.dispose()), [orbitGeos]);

  const motionScale = reducedMotion ? REDUCED_MOTION_FACTOR : 1;
  useFrame((_, dt) => {
    const d = Math.min(0.05, dt);
    PLANETS.forEach((p, i) => {
      ang.current[i] += p.speed * d * (i === current ? 0.16 : 1) * motionScale;
      const g = groups.current[i];
      if (!g) return;
      g.position.set(
        Math.cos(ang.current[i]) * p.orbitRadius,
        0,
        Math.sin(ang.current[i]) * p.orbitRadius,
      );
      positionsRef.current[i] = [g.position.x, g.position.y, g.position.z];
    });
  });

  return (
    <>
      {/* Orbit LineLoops — one per planet, at scene level */}
      {PLANETS.map((p, i) => (
        <lineLoop key={`orbit-${p.id}`} geometry={orbitGeos[i]}>
          <lineBasicMaterial
            color={0x6f86d6}
            transparent
            opacity={0.14}
          />
        </lineLoop>
      ))}

      {/* Planet groups — position updated each frame */}
      {PLANETS.map((p, i) => (
        <group
          key={p.id}
          ref={(el) => {
            groups.current[i] = el;
          }}
        >
          <Planet
            planet={p}
            onSelect={onSelect ? () => onSelect(i) : undefined}
          />
        </group>
      ))}
    </>
  );
}
