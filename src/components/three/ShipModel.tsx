'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {radialCanvas} from '@/lib/procedural';

interface ShipMats {
  hull: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  engine: THREE.MeshBasicMaterial;
}

/**
 * The ship's visual meshes (hull, energy ring, visor, wings, fin, twin engines,
 * magenta halo), with their own materials/texture lifecycle and an internally
 * spun energy ring. Shared by the galaxy `Ship` (which wraps this in its animated
 * orbit group) and the minigame `PlayerShip`. Forward = +Z.
 */
export function ShipModel() {
  const haloTex = useMemo(() => {
    const cv = radialCanvas('rgba(255,170,250,1)', 0.35, 'rgba(255,61,240,.6)', 'rgba(255,61,240,0)');
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  const mats = useMemo<ShipMats>(
    () => ({
      hull: new THREE.MeshStandardMaterial({color: 0xeaf2ff, metalness: 0.78, roughness: 0.24, emissive: 0x0a1622}),
      accent: new THREE.MeshStandardMaterial({color: 0x21e6ff, emissive: 0x16c8e0, emissiveIntensity: 1.6, metalness: 0.4, roughness: 0.3}),
      glass: new THREE.MeshStandardMaterial({color: 0x07202c, emissive: 0x1a5870, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.05}),
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

  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.z += Math.min(0.05, delta) * 0.7;
  });

  return (
    <group>
      <mesh material={mats.hull} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.26, 0.95, 10, 20]} />
      </mesh>
      <mesh ref={ringRef} material={mats.accent}>
        <torusGeometry args={[0.42, 0.04, 14, 56]} />
      </mesh>
      <mesh material={mats.glass} position={[0, 0.1, 0.45]} rotation={[-0.6, 0, 0]}>
        <sphereGeometry args={[0.2, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      </mesh>
      <Wing side={1} mats={mats} />
      <Wing side={-1} mats={mats} />
      <mesh material={mats.accent} position={[0, 0.22, -0.6]}>
        <boxGeometry args={[0.05, 0.42, 0.4]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[-0.26, -0.02, -0.74]}>
        <cylinderGeometry args={[0.09, 0.12, 0.3, 14]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[0.26, -0.02, -0.74]}>
        <cylinderGeometry args={[0.09, 0.12, 0.3, 14]} />
      </mesh>
      <sprite position={[0, 0, -0.85]} scale={[1.2, 1.2, 1]}>
        <spriteMaterial map={haloTex} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  );
}

function Wing({side, mats}: {side: number; mats: Pick<ShipMats, 'hull' | 'accent'>}) {
  return (
    <group position={[side * 0.2, -0.02, -0.04]} rotation={[0, side * 0.5, side * 0.12]}>
      <mesh material={mats.hull} position={[side * 0.4, 0, 0]}>
        <boxGeometry args={[0.66, 0.035, 0.44]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.4, 0, 0.2]}>
        <boxGeometry args={[0.72, 0.05, 0.07]} />
      </mesh>
      <mesh material={mats.accent} position={[side * 0.74, 0, 0]}>
        <sphereGeometry args={[0.055, 10, 10]} />
      </mesh>
    </group>
  );
}
