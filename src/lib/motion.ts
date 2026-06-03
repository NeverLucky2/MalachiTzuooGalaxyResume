import * as THREE from 'three';

/** Smoothstep easing — ported from the prototype's `smooth = t=>t*t*(3-2*t)`. */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Shared mutable motion state read/written by both CameraRig and Ship each frame.
 * Mirrors the prototype's module-level travel/ship globals so the rig and ship
 * stay perfectly in sync (single `travelT`, single set of "from" snapshots).
 */
export interface MotionState {
  /** Travel progress 0→1; 1 = settled. */
  travelT: number;
  /** Base advance rate for travelT (0.4 travel / 0.85 land / 0.75 take-off). */
  moveBase: number;
  /** Camera position at the moment the current move started. */
  fromCam: THREE.Vector3;
  /** Camera look target at the moment the current move started. */
  fromLook: THREE.Vector3;
  /** Current (lerped) camera look target — carried frame to frame. */
  lastLook: THREE.Vector3;
  /** Ship position at the moment the current move started. */
  shipFrom: THREE.Vector3;
  /** Current ship world position — carried frame to frame. */
  shipPos: THREE.Vector3;
  /** Boost flag (set by a later controls task; default false). */
  shiftHeld: boolean;
  /** Free-look yaw (set by a later controls task; default 0). */
  yaw: number;
  /** Free-look pitch (set by a later controls task; default 0). */
  pitch: number;
  /** Ship orbit angle accumulator. */
  orbAng: number;
}

/** Create the initial shared motion state. `travelT:1` = already settled at start. */
export function createMotionState(): MotionState {
  return {
    travelT: 1,
    moveBase: 0.4,
    fromCam: new THREE.Vector3(),
    fromLook: new THREE.Vector3(),
    lastLook: new THREE.Vector3(),
    shipFrom: new THREE.Vector3(),
    shipPos: new THREE.Vector3(),
    shiftHeld: false,
    yaw: 0,
    pitch: 0,
    orbAng: 0,
  };
}
