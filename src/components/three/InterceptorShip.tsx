'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {radialCanvas} from '@/lib/procedural';

interface Mats {
  hull: THREE.MeshStandardMaterial; // white body
  wing: THREE.MeshStandardMaterial; // black wing mid-panel
  cyan: THREE.MeshStandardMaterial; // cyan energy (spine, inner wing band)
  gold: THREE.MeshStandardMaterial; // gold outline / trim
  glass: THREE.MeshStandardMaterial; // cyan-lit cockpit
  engine: THREE.MeshBasicMaterial; // magenta burners
}

/**
 * Premium "Interceptor" ship — a sleek, faceted dart with a white hull and a gold
 * outline: tapered white hull (sharp +Z nose, low-segment F-117 facets), a gold
 * nose tip + collar, blended swept wings (rooted into the hull) banded cyan (at the
 * hull) → black (mid) → gold (outer edges), a cyan dorsal spine + cockpit, twin
 * magenta engines, and a magenta exhaust halo. Drop-in for ShipModel:
 * forward = +Z, centered, comparable size, so the galaxy Ship + minigame PlayerShip
 * use it unchanged.
 */
export function InterceptorShip() {
  const haloTex = useMemo(() => {
    const cv = radialCanvas('rgba(255,170,250,1)', 0.35, 'rgba(255,61,240,.6)', 'rgba(255,61,240,0)');
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const mats = useMemo<Mats>(
    () => ({
      hull: new THREE.MeshStandardMaterial({color: 0xeef3fa, metalness: 0.55, roughness: 0.35, emissive: 0x10131a}),
      wing: new THREE.MeshStandardMaterial({color: 0x14121d, metalness: 0.8, roughness: 0.32, emissive: 0x05060a}),
      cyan: new THREE.MeshStandardMaterial({color: 0x21e6ff, emissive: 0x16c8e0, emissiveIntensity: 1.6, metalness: 0.4, roughness: 0.3}),
      gold: new THREE.MeshStandardMaterial({color: 0xffce4a, emissive: 0xffc24a, emissiveIntensity: 1.8, metalness: 0.3, roughness: 0.35}),
      glass: new THREE.MeshStandardMaterial({color: 0x0a2030, emissive: 0x21a0c0, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.05}),
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

  // Subtle spin on the gold nose tip for life.
  const tipRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (tipRef.current) tipRef.current.rotation.z += Math.min(0.05, delta) * 0.9;
  });

  return (
    <group>
      {/* Tapered white hull: narrow nose toward +Z, wider tail toward -Z. Low
          segment count gives the faceted F-117-style fuselage. */}
      <mesh material={mats.hull} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.32, 1.9, 8]} />
      </mesh>
      {/* Sharp gold nose tip (+Z). */}
      <mesh ref={tipRef} material={mats.gold} position={[0, 0, 1.02]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.3, 16]} />
      </mesh>
      {/* Gold collar ring (front of the hull) — part of the gold outline. */}
      <mesh material={mats.gold} position={[0, 0, 0.42]}>
        <torusGeometry args={[0.15, 0.012, 8, 24]} />
      </mesh>
      {/* Cyan dorsal spine (energy line). */}
      <mesh material={mats.cyan} position={[0, 0.17, -0.1]}>
        <boxGeometry args={[0.05, 0.06, 1.25]} />
      </mesh>
      {/* Cyan-lit cockpit canopy. */}
      <mesh material={mats.glass} position={[0, 0.12, 0.4]} rotation={[-0.6, 0, 0]}>
        <sphereGeometry args={[0.17, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>
      <Wing side={1} mats={mats} />
      <Wing side={-1} mats={mats} />
      {/* Twin magenta engines (rear, -Z). */}
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[-0.18, -0.02, -0.95]}>
        <cylinderGeometry args={[0.08, 0.11, 0.32, 14]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[0.18, -0.02, -0.95]}>
        <cylinderGeometry args={[0.08, 0.11, 0.32, 14]} />
      </mesh>
      {/* Magenta exhaust halo. */}
      <sprite position={[0, 0, -1.08]} scale={[1.3, 1.3, 1]}>
        <spriteMaterial map={haloTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

function Wing({side, mats}: {side: number; mats: Pick<Mats, 'wing' | 'cyan' | 'gold'>}) {
  // Sharply-swept wing whose root is buried INSIDE the fuselage — a blended
  // mid-wing (F-117 style) so there's no gap at the top; the wing emerges from the
  // hull side. Banded cyan (at the hull exit) → black mid → gold edges.
  return (
    <group position={[side * 0.02, -0.04, -0.18]} rotation={[0, side * 0.66, side * 0.02]}>
      {/* Black mid panel — inner edge sits inside the hull, tip swept out + back. */}
      <mesh material={mats.wing} position={[side * 0.52, 0, 0]}>
        <boxGeometry args={[1.04, 0.04, 0.74]} />
      </mesh>
      {/* Cyan band where the wing exits the hull. */}
      <mesh material={mats.cyan} position={[side * 0.26, 0.026, 0]}>
        <boxGeometry args={[0.16, 0.02, 0.66]} />
      </mesh>
      {/* Gold leading edge. */}
      <mesh material={mats.gold} position={[side * 0.54, 0.015, 0.37]}>
        <boxGeometry args={[1.04, 0.05, 0.06]} />
      </mesh>
      {/* Gold trailing edge. */}
      <mesh material={mats.gold} position={[side * 0.54, 0.015, -0.37]}>
        <boxGeometry args={[1.04, 0.05, 0.06]} />
      </mesh>
      {/* Gold outer wingtip edge. */}
      <mesh material={mats.gold} position={[side * 1.04, 0, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.78]} />
      </mesh>
    </group>
  );
}
