'use client';
import {useRef, useMemo} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {Planet as PlanetType} from '@/data/types';
import {planetCanvas, cloudCanvas} from '@/lib/procedural';

interface PlanetProps {
  planet: PlanetType;
  selected: boolean;
}

export function Planet({planet}: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const moonRef = useRef<THREE.Mesh>(null);
  const moonAngRef = useRef(0);

  // Build planet texture (map + emissiveMap from planetCanvas)
  const planetTex = useMemo(() => {
    const cv = planetCanvas(planet.color, planet.style);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [planet.color, planet.style]);

  // Cloud texture — only for earth style
  const cloudTex = useMemo(() => {
    if (planet.style !== 'earth') return null;
    const cv = cloudCanvas();
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [planet.style]);

  // Moon rock texture — only for planets with moon
  const moonTex = useMemo(() => {
    if (!planet.moon) return null;
    const cv = planetCanvas(0xb8c4d8, 'rock');
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [planet.moon]);

  // Per-frame animation: spin planet, clouds, moon orbit
  useFrame((_, dt) => {
    const d = Math.min(0.05, dt);
    if (meshRef.current) {
      meshRef.current.rotation.y += d * 0.25;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += d * 0.32;
    }
    if (moonRef.current) {
      moonAngRef.current += d * 1.2;
      const ang = moonAngRef.current;
      const r = planet.size * 2.0;
      moonRef.current.position.set(
        Math.cos(ang) * r,
        Math.sin(ang) * planet.size * 0.5,
        Math.sin(ang) * r,
      );
    }
  });

  return (
    <group>
      {/* Main planet sphere */}
      <mesh ref={meshRef} rotation={[0, 0, 0.2]}>
        <sphereGeometry args={[planet.size, 48, 48]} />
        <meshStandardMaterial
          map={planetTex}
          emissive={0xffffff}
          emissiveMap={planetTex}
          emissiveIntensity={0.45}
          roughness={0.92}
          metalness={0.05}
        />

        {/* Atmosphere shell — BackSide additive, slightly larger */}
        <mesh>
          <sphereGeometry args={[planet.size * 1.14, 32, 32]} />
          <meshBasicMaterial
            color={planet.color}
            transparent
            opacity={0.16}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Earth clouds */}
        {planet.style === 'earth' && cloudTex && (
          <mesh ref={cloudsRef}>
            <sphereGeometry args={[planet.size * 1.03, 40, 40]} />
            <meshStandardMaterial
              map={cloudTex}
              transparent
              depthWrite={false}
              opacity={0.9}
            />
          </mesh>
        )}

        {/* Saturn ring (Experience planet) */}
        {planet.ring && (
          <mesh rotation={[Math.PI * 0.46, 0, 0]}>
            <torusGeometry args={[planet.size * 1.8, planet.size * 0.16, 12, 64]} />
            <meshBasicMaterial
              color={planet.color}
              transparent
              opacity={0.55}
            />
          </mesh>
        )}

        {/* Orbiting moon (Projects planet) */}
        {planet.moon && moonTex && (
          <mesh ref={moonRef}>
            <sphereGeometry args={[planet.size * 0.28, 18, 18]} />
            <meshStandardMaterial
              map={moonTex}
              roughness={1}
            />
          </mesh>
        )}
      </mesh>
    </group>
  );
}
