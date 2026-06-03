'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import * as THREE from 'three';
import {PLANETS} from '@/data/planets';

type PositionsRef = {current: [number, number, number][]};

/**
 * Planet labels rendered INSIDE <Canvas> via drei <Html>. Each label rides an
 * invisible tracker group whose position follows the planet's live world
 * position (read from `positionsRef`, updated each frame by <Planets>). Labels
 * are non-interactive and hidden while landed. Mirrors the prototype's `.plabel`.
 */
export function PlanetLabels({
  current,
  landed,
  positionsRef,
}: {
  current: number;
  landed: boolean;
  positionsRef: PositionsRef;
}) {
  const trackers = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    PLANETS.forEach((_, i) => {
      const g = trackers.current[i];
      const p = positionsRef.current[i];
      if (g && p) g.position.set(p[0], p[1], p[2]);
    });
  });

  if (landed) return null;

  return (
    <>
      {PLANETS.map((p, i) => (
        <group
          key={p.id}
          ref={(el) => {
            trackers.current[i] = el;
          }}
        >
          <Html
            center
            pointerEvents="none"
            // small downward offset so the label sits under the planet
            position={[0, -(p.size + 1.4), 0]}
            zIndexRange={[15, 0]}
          >
            <div
              className="whitespace-nowrap font-display font-bold tracking-wide text-white"
              style={{
                fontSize: i === current ? 15 : 12,
                opacity: i === current ? 1 : 0.82,
                textShadow: `0 0 9px ${p.glow}, 0 0 3px rgba(0,0,0,.7)`,
              }}
            >
              {p.label}
            </div>
          </Html>
        </group>
      ))}
    </>
  );
}
