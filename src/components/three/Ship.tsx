'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {PLANETS} from '@/data/planets';
import {PRESETS} from '@/lib/cameraPresets';
import {
  bezierPoint,
  orbitPointFor,
  smoothstep,
  type MotionState,
} from '@/lib/motion';
import type {NavState} from '@/lib/navigation';
import {ShipModel} from './ShipModel';

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
  onLaunch,
}: {
  nav: NavState;
  positionsRef: PositionsRef;
  motion: MotionState;
  onLaunch?: () => void;
}) {
  const shipRef = useRef<THREE.Group>(null);
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
  });

  return (
    <group ref={shipRef}>
      <ShipModel />
      {onLaunch && (
        <mesh
          name="minigame-launch"
          onClick={(e) => {
            e.stopPropagation();
            onLaunch();
          }}
          onPointerOver={() => {
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = '';
          }}
        >
          <sphereGeometry args={[2.4, 12, 12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}
