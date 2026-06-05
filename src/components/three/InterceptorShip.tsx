// src/components/three/InterceptorShip.tsx
'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {radialCanvas} from '@/lib/procedural';

interface Mats {
  hull: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  engine: THREE.MeshBasicMaterial;
}

/**
 * Premium "Interceptor" ship — a sleek dart: tapered hull (sharp +Z nose), swept
 * delta wings, a glowing cyan spine, cockpit, twin magenta engines, and a cyan
 * halo. Obsidian Neon palette. Drop-in for ShipModel: forward = +Z, centered,
 * comparable size, so the galaxy Ship + minigame PlayerShip use it unchanged.
 */
export function InterceptorShip() {
  const haloTex = useMemo(() => {
    const cv = radialCanvas('rgba(159,233,255,1)', 0.35, 'rgba(33,230,255,.6)', 'rgba(33,230,255,0)');
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const mats = useMemo<Mats>(
    () => ({
      hull: new THREE.MeshStandardMaterial({color: 0x15131f, metalness: 0.82, roughness: 0.3, emissive: 0x05060a}),
      accent: new THREE.MeshStandardMaterial({color: 0x21e6ff, emissive: 0x16c8e0, emissiveIntensity: 1.8, metalness: 0.4, roughness: 0.3}),
      glass: new THREE.MeshStandardMaterial({color: 0x0a2030, emissive: 0x1a5870, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.05}),
      engine: new THREE.MeshBasicMaterial({color: 0xff3df0}),
    }),
    [],
  );

  useEffect(() => {
    return () => {
      haloTex.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [haloTex, mats]);

  // Subtle spin on the cyan nose tip ring for life.
  const tipRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (tipRef.current) tipRef.current.rotation.z += Math.min(0.05, delta) * 0.9;
  });

  return (
    <group>
      {/* Tapered hull: narrow nose toward +Z, wider tail toward -Z. */}
      <mesh material={mats.hull} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.3, 1.9, 16]} />
      </mesh>
      {/* Sharp accent nose tip (+Z). */}
      <mesh ref={tipRef} material={mats.accent} position={[0, 0, 1.02]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 16]} />
      </mesh>
      {/* Glowing cyan dorsal spine. */}
      <mesh material={mats.accent} position={[0, 0.17, -0.1]}>
        <boxGeometry args={[0.05, 0.06, 1.25]} />
      </mesh>
      {/* Cockpit canopy. */}
      <mesh material={mats.glass} position={[0, 0.12, 0.4]} rotation={[-0.6, 0, 0]}>
        <sphereGeometry args={[0.17, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>
      <Wing side={1} mats={mats} />
      <Wing side={-1} mats={mats} />
      {/* Twin engines (rear, -Z). */}
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[-0.18, -0.02, -0.95]}>
        <cylinderGeometry args={[0.08, 0.11, 0.32, 14]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[0.18, -0.02, -0.95]}>
        <cylinderGeometry args={[0.08, 0.11, 0.32, 14]} />
      </mesh>
      {/* Cyan exhaust halo. */}
      <sprite position={[0, 0, -1.08]} scale={[1.3, 1.3, 1]}>
        <spriteMaterial map={haloTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

function Wing({side, mats}: {side: number; mats: Pick<Mats, 'hull' | 'accent'>}) {
  // Swept-back delta wing: angled outward + back, with a lit leading edge.
  return (
    <group position={[side * 0.22, -0.03, -0.18]} rotation={[0, side * 0.62, side * 0.1]}>
      <mesh material={mats.hull} position={[side * 0.46, 0, 0]}>
        <boxGeometry args={[0.86, 0.035, 0.7]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.46, 0.005, 0.34]}>
        <boxGeometry args={[0.9, 0.05, 0.05]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.88, 0, 0]}>
        <boxGeometry args={[0.05, 0.06, 0.5]} />
      </mesh>
    </group>
  );
}
