'use client';
import {useRef} from 'react';
import {useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {PLANETS} from '@/data/planets';
import {framing} from '@/lib/cameraPresets';
import {
  avoidanceControl,
  bezierPoint,
  orbitPointFor,
  smoothstep,
  type MotionState,
  type Obstacle,
} from '@/lib/motion';
import type {NavState} from '@/lib/navigation';

const BOOST = 1.3;
// Keep-out radius around the central star the flight path must clear.
const STAR_RADIUS = 26;
// Extra margin added to each planet's size to form its keep-out radius (camera).
const PLANET_PAD = 6;
// Same, but for the ship's flight path (matches Ship's keep-out margin).
const SHIP_PLANET_PAD = 4;

type PositionsRef = {current: [number, number, number][]};

/**
 * Drives the camera each frame from `nav` + the planets' live positions, using
 * pure `framing()`. Ports the prototype's `startMove` + the per-frame camera
 * block. Shares `motion` (travelT, from-snapshots, lastLook) with the Ship so
 * they stay in lockstep.
 *
 * CameraRig is the SOLE owner of trip-start detection: it alone detects a nav
 * change, resets `motion.travelT`, and snapshots BOTH the camera and ship launch
 * points + control points. Ship is a pure consumer. This requires CameraRig's
 * `useFrame` to run BEFORE Ship's on the change frame so `motion.shipPos` still
 * holds the OLD position when we snapshot `shipFrom` (otherwise the ship would
 * depart from the destination). R3F runs same-priority `useFrame` callbacks in
 * registration (mount/JSX) order, so `<CameraRig/>` MUST be rendered before
 * `<Ship/>` in Scene.tsx. Do NOT use positive useFrame priorities (that disables
 * R3F's automatic render).
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
  // Reusable star obstacle + per-planet obstacle pool (rebuilt at each trip
  // start, so no allocation in the per-frame path).
  const star = useRef<Obstacle>({center: new THREE.Vector3(0, 0, 0), radius: STAR_RADIUS});
  const planetObs = useRef<Obstacle[]>(
    PLANETS.map(() => ({center: new THREE.Vector3(), radius: 0})),
  );
  const liftOff = useRef(new THREE.Vector3());
  // Ship-specific scratch: its trip-start orbit target + obstacle pool (the ship
  // uses a smaller planet pad than the camera, so it needs its own obstacles).
  const shipStar = useRef<Obstacle>({center: new THREE.Vector3(0, 0, 0), radius: STAR_RADIUS});
  const shipPlanetObs = useRef<Obstacle[]>(
    PLANETS.map(() => ({center: new THREE.Vector3(), radius: 0})),
  );
  const shipTarget = useRef(new THREE.Vector3());

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
      // Snapshot the ship's CURRENT position as its launch point. This is correct
      // because CameraRig's useFrame runs BEFORE Ship's on this change frame (see
      // the registration-order note below / Scene.tsx ordering), so motion.shipPos
      // still holds the OLD position here — the ship departs from where it is.
      motion.shipFrom.copy(motion.shipPos);
      motion.travelT = 0;
      // moveBase: land 0.85, take-off 0.75, else 0.4 (planet/preset change).
      if (!prev.landed && nav.landed) motion.moveBase = 0.85;
      else if (prev.landed && !nav.landed) motion.moveBase = 0.75;
      else motion.moveBase = 0.4;

      // Compute the CAMERA flight control point ONCE per trip (snapshot of the
      // target + obstacles at this instant), so moving planets don't cause wobble.
      const Ps = positionsRef.current[nav.current];
      const sizeS = PLANETS[nav.current].size;
      const tgt = framing(Ps, sizeS, nav.preset, nav.landed);
      liftOff.current.set(tgt.pos[0], tgt.pos[1], tgt.pos[2]);
      // Obstacles: the star + every planet EXCEPT the destination.
      const obs: Obstacle[] = [star.current];
      for (let i = 0; i < PLANETS.length; i++) {
        if (i === nav.current) continue;
        const o = planetObs.current[i];
        const Pi = positionsRef.current[i];
        o.center.set(Pi[0], Pi[1], Pi[2]);
        o.radius = PLANETS[i].size + PLANET_PAD;
        obs.push(o);
      }
      avoidanceControl(motion.fromCam, liftOff.current, obs, 3, motion.camControl);

      // Compute the SHIP flight control point ONCE per trip too. CameraRig is the
      // sole owner of trip-start; Ship is a pure consumer of shipFrom/shipControl.
      // Target = the orbit point around the DESTINATION planet at the current
      // orbAng (same orbitPointFor formula Ship uses each frame, so endpoints line
      // up). Obstacles: the star + every non-destination planet, with the ship's
      // own (smaller) keep-out pad.
      orbitPointFor(Ps, sizeS, motion.orbAng, shipTarget.current);
      const shipObs: Obstacle[] = [shipStar.current];
      for (let i = 0; i < PLANETS.length; i++) {
        if (i === nav.current) continue;
        const o = shipPlanetObs.current[i];
        const Pi = positionsRef.current[i];
        o.center.set(Pi[0], Pi[1], Pi[2]);
        o.radius = PLANETS[i].size + SHIP_PLANET_PAD;
        shipObs.push(o);
      }
      avoidanceControl(motion.shipFrom, shipTarget.current, shipObs, 3, motion.shipControl);
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

    // --- camera position along the flight path + free-look ---
    // Quadratic Bézier from `fromCam` → the LIVE framing target, using the
    // control point computed once at trip start. With no obstacle on the path
    // the control == midpoint, so this is a straight line; it swerves sideways
    // only enough to clear the star or a planet that lies on the way.
    bezierPoint(motion.fromCam, motion.camControl, targetPos.current, e, camera.position);
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
