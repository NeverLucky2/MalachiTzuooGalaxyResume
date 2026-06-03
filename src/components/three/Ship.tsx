'use client';
import {useRef, useMemo, useEffect} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {PLANETS} from '@/data/planets';
import {PRESETS} from '@/lib/cameraPresets';
import {radialCanvas} from '@/lib/procedural';
import {
  bezierPoint,
  orbitPointFor,
  smoothstep,
  type MotionState,
} from '@/lib/motion';
import type {NavState} from '@/lib/navigation';

const FWD = new THREE.Vector3(0, 0, 1);

type PositionsRef = {current: [number, number, number][]};

/**
 * Low-poly winged ship (forward = +Z). Geometry/materials ported verbatim from
 * the prototype. Per-frame: orbits the focused planet, merges in via shared
 * travelT, noses along its velocity, and scales per preset / landing.
 *
 * Ship is a PURE CONSUMER of trip state: it does NOT detect nav changes, reset
 * travelT, or compute shipFrom/shipControl — CameraRig owns all of that (and runs
 * before Ship; see Scene.tsx ordering). Each frame Ship just samples the bezier
 * (shipFrom → shipControl → live orbit point) at the shared travelT.
 */
export function Ship({
  nav,
  positionsRef,
  motion,
}: {
  nav: NavState;
  positionsRef: PositionsRef;
  motion: MotionState;
}) {
  // Magenta engine halo sprite texture.
  const haloTex = useMemo(() => {
    const cv = radialCanvas(
      'rgba(255,170,250,1)',
      0.35,
      'rgba(255,61,240,.6)',
      'rgba(255,61,240,0)',
    );
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Materials (ported from prototype).
  const mats = useMemo(
    () => ({
      hull: new THREE.MeshStandardMaterial({
        color: 0xeaf2ff,
        metalness: 0.78,
        roughness: 0.24,
        emissive: 0x0a1622,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: 0x21e6ff,
        emissive: 0x16c8e0,
        emissiveIntensity: 1.6,
        metalness: 0.4,
        roughness: 0.3,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: 0x07202c,
        emissive: 0x1a5870,
        emissiveIntensity: 0.9,
        metalness: 0.3,
        roughness: 0.05,
      }),
      engine: new THREE.MeshBasicMaterial({color: 0xff3df0}),
    }),
    [],
  );

  // Halo texture + the ship's materials are created imperatively, so R3F won't
  // auto-dispose them — release them on unmount.
  useEffect(() => {
    return () => {
      haloTex.dispose();
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [haloTex, mats]);

  const shipRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const prevShipPos = useRef(new THREE.Vector3());
  const shipScale = useRef(0.42);
  // Initialized-once guard for the ship's starting position.
  const inited = useRef(false);
  // Scratch objects reused each frame.
  const orbitPt = useRef(new THREE.Vector3());
  const vel = useRef(new THREE.Vector3());
  const tmpQ = useRef(new THREE.Quaternion());

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const ship = shipRef.current;
    if (!ship) return;

    const P = positionsRef.current[nav.current];
    const size = PLANETS[nav.current].size;

    // Seed positions once so velocity orientation has a sane start.
    if (!inited.current) {
      orbitPointFor(P, size, motion.orbAng, motion.shipPos);
      motion.shipFrom.copy(motion.shipPos);
      prevShipPos.current.copy(motion.shipPos);
      inited.current = true;
    }

    // Advance the orbit angle (Ship is the SINGLE place orbAng advances; CameraRig
    // only reads the current value at trip start) and compute the LIVE orbit point
    // around the focused planet — the bezier's destination endpoint.
    motion.orbAng += dt * 1.4;
    orbitPointFor(P, size, motion.orbAng, orbitPt.current);

    // Merge into orbit via shared travelT (slightly faster than camera: *1.12),
    // along the flight path (shipFrom → shipControl → live orbit) computed once at
    // trip start by CameraRig. With no obstacle on the way the control == midpoint
    // (straight line); it swerves only to clear the star or a planet on the path.
    prevShipPos.current.copy(motion.shipPos);
    const eR = smoothstep(Math.min(1, motion.travelT * 1.12));
    bezierPoint(motion.shipFrom, motion.shipControl, orbitPt.current, eR, motion.shipPos);
    ship.position.copy(motion.shipPos);

    // Scale lerp toward landed / preset target.
    const tScale = nav.landed ? 0.11 : PRESETS[nav.preset].ship;
    shipScale.current += (tScale - shipScale.current) * 0.12;
    ship.scale.setScalar(shipScale.current);

    // Orient along velocity (forward = +Z).
    vel.current.copy(motion.shipPos).sub(prevShipPos.current);
    if (vel.current.lengthSq() > 1e-6) {
      tmpQ.current.setFromUnitVectors(FWD, vel.current.normalize());
      ship.quaternion.slerp(tmpQ.current, 0.28);
    }

    // Spin the energy ring.
    if (ring1Ref.current) ring1Ref.current.rotation.z += dt * 0.7;
  });

  return (
    <group ref={shipRef}>
      {/* Capsule hull */}
      <mesh material={mats.hull} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.26, 0.95, 10, 20]} />
      </mesh>

      {/* Energy ring */}
      <mesh ref={ring1Ref} material={mats.accent}>
        <torusGeometry args={[0.42, 0.04, 14, 56]} />
      </mesh>

      {/* Cockpit visor */}
      <mesh
        material={mats.glass}
        position={[0, 0.1, 0.45]}
        rotation={[-0.6, 0, 0]}
      >
        <sphereGeometry args={[0.2, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
      </mesh>

      {/* Wings (short, swept) — port of wing(side) */}
      <Wing side={1} mats={mats} />
      <Wing side={-1} mats={mats} />

      {/* Fin */}
      <mesh material={mats.accent} position={[0, 0.22, -0.6]}>
        <boxGeometry args={[0.05, 0.42, 0.4]} />
      </mesh>

      {/* Twin magenta engines */}
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[-0.26, -0.02, -0.74]}>
        <cylinderGeometry args={[0.09, 0.12, 0.3, 14]} />
      </mesh>
      <mesh material={mats.engine} rotation={[Math.PI / 2, 0, 0]} position={[0.26, -0.02, -0.74]}>
        <cylinderGeometry args={[0.09, 0.12, 0.3, 14]} />
      </mesh>

      {/* Magenta engine halo sprite */}
      <sprite position={[0, 0, -0.85]} scale={[1.2, 1.2, 1]}>
        <spriteMaterial
          map={haloTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}

interface WingMats {
  hull: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
}

/** Single swept wing — port of the prototype's `wing(side)`. */
function Wing({side, mats}: {side: number; mats: WingMats}) {
  return (
    <group
      position={[side * 0.2, -0.02, -0.04]}
      rotation={[0, side * 0.5, side * 0.12]}
    >
      {/* Panel */}
      <mesh material={mats.hull} position={[side * 0.4, 0, 0]}>
        <boxGeometry args={[0.66, 0.035, 0.44]} />
      </mesh>
      {/* Glowing leading edge */}
      <mesh material={mats.accent} position={[side * 0.4, 0, 0.2]}>
        <boxGeometry args={[0.72, 0.05, 0.07]} />
      </mesh>
      {/* Glowing tip */}
      <mesh material={mats.accent} position={[side * 0.74, 0, 0]}>
        <sphereGeometry args={[0.055, 10, 10]} />
      </mesh>
    </group>
  );
}
