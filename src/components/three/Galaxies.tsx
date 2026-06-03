'use client';
import {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {galaxyCanvas} from '@/lib/procedural';

// 13 distant galaxy sprites, ported verbatim from prototype
const GALAXY_COLORS = [0x9fb6ff, 0xffb0e6, 0xa8ffe6, 0xffd9a8, 0xc4a8ff];
const GALAXY_COUNT = 13;

interface GalaxyDatum {
  pos: [number, number, number];
  scale: number;
  color: number;
  rotation: number;
}

export function Galaxies() {
  const tex = useMemo(() => {
    const cv = galaxyCanvas();
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Imperatively-created texture — dispose on unmount (R3F won't).
  useEffect(() => () => tex.dispose(), [tex]);

  const galaxies = useMemo<GalaxyDatum[]>(() => {
    const result: GalaxyDatum[] = [];
    // Use a seeded-ish approach so values are stable on mount
    for (let i = 0; i < GALAXY_COUNT; i++) {
      // Prototype uses Math.random() at init time — replicate that pattern
      const r = 780 + Math.random() * 900;           // 780–1680
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(ph) * Math.cos(th);
      const y = r * Math.cos(ph) * 0.85;
      const z = r * Math.sin(ph) * Math.sin(th);
      const scale = 210 + Math.random() * 320;       // 210–530
      const color = GALAXY_COLORS[i % 5];
      const rotation = Math.random() * Math.PI;
      result.push({pos: [x, y, z], scale, color, rotation});
    }
    return result;
  }, []);

  return (
    <>
      {galaxies.map((g, i) => (
        <sprite key={i} position={g.pos} scale={[g.scale, g.scale, 1]}>
          <spriteMaterial
            map={tex}
            color={g.color}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            rotation={g.rotation}
          />
        </sprite>
      ))}
    </>
  );
}
