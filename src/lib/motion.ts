import * as THREE from 'three';

/** Smoothstep easing — ported from the prototype's `smooth = t=>t*t*(3-2*t)`. */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Quadratic Bézier sample at parameter `e` ∈ [0,1].
 * `out = from*(1-e)^2 + control*2(1-e)e + to*e^2`. Endpoints are exact:
 * `e=0 → from`, `e=1 → to`. Writes into `out` (no allocation) and returns it.
 */
export function bezierPoint(
  from: THREE.Vector3,
  control: THREE.Vector3,
  to: THREE.Vector3,
  e: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  const u = 1 - e;
  out.set(0, 0, 0);
  out.addScaledVector(from, u * u);
  out.addScaledVector(control, 2 * u * e);
  out.addScaledVector(to, e * e);
  return out;
}

/**
 * Control point for an arc that bows the `from`→`to` path AWAY from the origin
 * so travel between opposite-side planets curves around the central star instead
 * of flying through it. When the midpoint is already at least `safe` from the
 * origin, bow is 0 and `control == midpoint`, so the Bézier degenerates to the
 * straight `from`→`to` lerp (short hops are unaffected). Writes into `out`.
 */
export function bowControl(
  from: THREE.Vector3,
  to: THREE.Vector3,
  safe: number,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  // Midpoint of the straight segment.
  out.copy(from).add(to).multiplyScalar(0.5);
  const d = out.length();
  // Outward direction = midpoint direction; fall back when it's ~0 (path passes
  // straight through the origin). Add a vertical lift so it bows over the plane.
  const outDir = new THREE.Vector3();
  if (out.lengthSq() > 1e-3) {
    outDir.copy(out).normalize();
  } else {
    outDir.copy(from).add(to).setLength(1);
    if (outDir.lengthSq() < 1e-6) outDir.set(1, 0, 0);
  }
  outDir.y += 0.35;
  outDir.normalize();
  // A quadratic Bézier only reaches HALFWAY to its control point at its apex
  // (apex sits at mid + outDir*bow/2), so to push the *curve* — not just the
  // control — out to `safe` we use 2*(safe-d). When d >= safe, bow = 0 and the
  // control collapses to the midpoint → the Bézier degenerates to a straight
  // lerp, leaving short hops untouched. Endpoints stay exact either way.
  const bow = 2 * Math.max(0, safe - d);
  return out.addScaledVector(outDir, bow);
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
