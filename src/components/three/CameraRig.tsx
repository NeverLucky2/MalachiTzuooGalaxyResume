'use client';
import {useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {PLANETS} from '@/data/planets';
import {framing} from '@/lib/cameraPresets';
import {bezierPoint, bowControl, smoothstep, type MotionState} from '@/lib/motion';
import type {NavState} from '@/lib/navigation';

const BOOST = 1.3;
// Keep-out radius around the star (radius 9 + glow ~21 + margin) the travel arc
// bows past, so crossings between opposite-side planets curve around it.
const SAFE = 60;

type PositionsRef = {current: [number, number, number][]};

/**
 * Drives the camera each frame from `nav` + the planets' live positions, using
 * pure `framing()`. Ports the prototype's `startMove` + the per-frame camera
 * block. Shares `motion` (travelT, from-snapshots, lastLook) with the Ship so
 * they stay in lockstep.
 */
export function CameraRig({
  nav,
  positionsRef,
  motion,
}: {
  nav: NavState;
  positionsRef: PositionsRef;
  motion: MotionState;
}) {
  const camera = useThree((s) => s.camera);

  // Previous nav snapshot, to detect a "startMove" trigger each frame.
  const prevNav = useRef<NavState | null>(null);

  // Scratch vectors reused each frame (no per-frame allocation).
  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const radv = useRef(new THREE.Vector3());
  const tang = useRef(new THREE.Vector3());
  const control = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);

    // --- detect nav change → startMove (prototype: goTo/openNode/closePanel) ---
    const prev = prevNav.current;
    if (
      prev &&
      (prev.current !== nav.current ||
        prev.landed !== nav.landed ||
        prev.preset !== nav.preset)
    ) {
      motion.fromCam.copy(camera.position);
      motion.fromLook.copy(motion.lastLook);
      motion.shipFrom.copy(motion.shipPos);
      motion.travelT = 0;
      // moveBase: land 0.85, take-off 0.75, else 0.4 (planet/preset change).
      if (!prev.landed && nav.landed) motion.moveBase = 0.85;
      else if (prev.landed && !nav.landed) motion.moveBase = 0.75;
      else motion.moveBase = 0.4;
    }
    prevNav.current = nav;

    // --- advance travelT ---
    if (motion.travelT < 1) {
      motion.travelT = Math.min(
        1,
        motion.travelT + dt * (motion.shiftHeld ? BOOST : motion.moveBase),
      );
    }
    const e = smoothstep(motion.travelT);

    // --- compute framing target for the focused planet ---
    const P = positionsRef.current[nav.current];
    const size = PLANETS[nav.current].size;
    const target = framing(P, size, nav.preset, nav.landed);
    targetPos.current.set(target.pos[0], target.pos[1], target.pos[2]);
    targetLook.current.set(target.look[0], target.look[1], target.look[2]);

    // --- camera position along an arc that bows around the star + free-look ---
    // Quadratic Bézier from `fromCam` → framing target, control point pushed away
    // from the origin so long opposite-side crossings curve around the star.
    // Short hops (midpoint already ≥ SAFE) reduce to the straight lerp.
    bowControl(motion.fromCam, targetPos.current, SAFE, control.current);
    bezierPoint(motion.fromCam, control.current, targetPos.current, e, camera.position);
    // radial / tangent at the planet for the free-look pan
    radv.current.set(P[0], 0, P[2]);
    if (radv.current.lengthSq() < 1e-4) radv.current.set(1, 0, 0);
    radv.current.normalize();
    tang.current.set(-radv.current.z, 0, radv.current.x);
    const drag = nav.landed ? 0.35 : 1;
    camera.position
      .addScaledVector(tang.current, motion.yaw * 8 * drag)
      .add(new THREE.Vector3(0, motion.pitch * 10 * drag, 0));

    // --- look target lerp ---
    motion.lastLook.copy(motion.fromLook).lerp(targetLook.current, e);
    camera.lookAt(motion.lastLook);
  });

  return null;
}
