'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {radialCanvas} from '@/lib/procedural';

const COMET_COUNT = 4;
const TRAIL_POINTS = 22;
const BOX = 540;
// Comet drift is damped to this fraction of normal under prefers-reduced-motion.
const REDUCED_MOTION_FACTOR = 0.15;

interface CometData {
  p: THREE.Vector3;
  v: THREE.Vector3;
  hist: THREE.Vector3[];
}

function randEdge(): THREE.Vector3 {
  return new THREE.Vector3(
    (Math.random() * 2 - 1),
    (Math.random() * 2 - 1) * 0.5,
    (Math.random() * 2 - 1),
  ).multiplyScalar(BOX);
}

export function Comets({reducedMotion = false}: {reducedMotion?: boolean} = {}) {
  // Glow texture for comet heads
  const glowTex = useMemo(() => {
    const cv = radialCanvas(
      'rgba(255,255,255,1)',
      0.3,
      'rgba(180,225,255,.7)',
      'rgba(140,200,255,0)',
    );
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Mutable comet state (not reactive — updated in useFrame)
  const cometsRef = useRef<CometData[]>([]);
  // Trail position arrays (Float32Array per comet, updated in useFrame)
  const trailArraysRef = useRef<Float32Array[]>([]);
  // Refs to Three.js objects for direct mutation
  const trailGeoRefs = useRef<(THREE.BufferGeometry | null)[]>([]);
  const headRefs = useRef<(THREE.Sprite | null)[]>([]);

  // Initialize comet data once
  if (cometsRef.current.length === 0) {
    for (let i = 0; i < COMET_COUNT; i++) {
      const s = randEdge();
      const dir = randEdge().sub(s).normalize();
      const speed = 22 + Math.random() * 18;
      cometsRef.current.push({
        p: s.clone(),
        v: dir.multiplyScalar(speed),
        hist: [],
      });
      trailArraysRef.current.push(new Float32Array(TRAIL_POINTS * 3));
    }
  }

  // Build trail geometries (once via useMemo)
  const trailGeos = useMemo(() => {
    return Array.from({length: COMET_COUNT}, (_, i) => {
      const geo = new THREE.BufferGeometry();
      const arr = trailArraysRef.current[i] ?? new Float32Array(TRAIL_POINTS * 3);
      trailArraysRef.current[i] = arr;
      geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      return geo;
    });
  }, []);

  // Build trail Line objects + materials once (hoisted so they aren't
  // re-created on every render and so they can be disposed on unmount).
  const trailLines = useMemo(() => {
    return trailGeos.map((geo) => {
      const mat = new THREE.LineBasicMaterial({
        color: 0x9fd0ff,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Line(geo, mat);
    });
  }, [trailGeos]);

  // Imperatively-created glow texture + trail geometries + line materials — dispose on unmount.
  useEffect(() => {
    return () => {
      glowTex.dispose();
      trailGeos.forEach((g) => g.dispose());
      trailLines.forEach((l) => l.material.dispose());
    };
  }, [glowTex, trailGeos, trailLines]);

  const motionScale = reducedMotion ? REDUCED_MOTION_FACTOR : 1;
  useFrame((_, dt) => {
    const d = Math.min(0.05, dt) * motionScale;
    const comets = cometsRef.current;

    for (let ci = 0; ci < COMET_COUNT; ci++) {
      const c = comets[ci];
      if (!c) continue;

      // Advance position (stepComets logic from prototype)
      c.p.addScaledVector(c.v, d);

      // Prepend to history, cap at TRAIL_POINTS
      c.hist.unshift(c.p.clone());
      if (c.hist.length > TRAIL_POINTS) c.hist.pop();

      // Respawn if past 1.8x box
      if (c.p.length() > BOX * 1.8) {
        const s = randEdge();
        c.p.copy(s);
        const dir = randEdge().sub(s).normalize();
        const speed = 22 + Math.random() * 18;
        c.v = dir.multiplyScalar(speed);
        c.hist.length = 0;
      }

      // Update head sprite position
      const head = headRefs.current[ci];
      if (head) {
        head.position.copy(c.p);
      }

      // Update trail geometry
      const arr = trailArraysRef.current[ci];
      const geo = trailGeoRefs.current[ci];
      if (arr && geo) {
        for (let k = 0; k < TRAIL_POINTS; k++) {
          const h = c.hist[k] ?? c.p;
          arr[k * 3]     = h.x;
          arr[k * 3 + 1] = h.y;
          arr[k * 3 + 2] = h.z;
        }
        const attr = geo.attributes.position as THREE.BufferAttribute;
        attr.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {Array.from({length: COMET_COUNT}, (_, i) => (
        <group key={i}>
          {/* Trail line */}
          <primitive
            object={(() => {
              trailGeoRefs.current[i] = trailGeos[i];
              return trailLines[i];
            })()}
          />
          {/* Glow sprite head */}
          <sprite
            ref={(el) => {
              headRefs.current[i] = el;
            }}
            scale={[7, 7, 1]}
          >
            <spriteMaterial
              map={glowTex}
              color={0xdcefff}
              transparent
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </group>
      ))}
    </>
  );
}
