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

/** A spherical obstacle the flight path must clear. */
export interface Obstacle {
  center: THREE.Vector3;
  radius: number;
}

// Module-level scratch vectors so `avoidanceControl` allocates nothing per call.
const _dir = new THREE.Vector3();
const _pc = new THREE.Vector3();
const _toC = new THREE.Vector3();
const _push = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _xax = new THREE.Vector3(1, 0, 0);

/**
 * Control point for a quadratic Bézier that flies (almost) straight from `from`
 * to `to`, swerving sideways ONLY enough to clear whichever spherical obstacle
 * the straight segment passes through the most.
 *
 * For each obstacle we find the closest point `Pc` on the segment to the
 * obstacle's centre and the penetration `radius - |C - Pc|` (positive ⇒ the
 * straight line clips it). We bend around the single worst (deepest) obstacle.
 * If nothing penetrates, the control is the segment midpoint, so `bezierPoint`
 * degenerates to a straight `from`→`to` lerp — a direct flight, no detour.
 *
 * The push is sideways (away from the obstacle, perpendicular-ish to travel)
 * with a small upward lift so it arcs slightly over the ecliptic. Because a
 * quadratic Bézier's apex only reaches HALFWAY to its control point, the offset
 * is `2 * (penetration + margin)`. Writes into `out` and returns it.
 */
export function avoidanceControl(
  from: THREE.Vector3,
  to: THREE.Vector3,
  obstacles: Obstacle[],
  margin = 3,
  out: THREE.Vector3 = new THREE.Vector3(),
): THREE.Vector3 {
  // Default: straight line (control == midpoint).
  out.copy(from).add(to).multiplyScalar(0.5);

  _dir.copy(to).sub(from);
  const segLen = _dir.length();
  if (segLen < 1e-6) return out; // degenerate segment → midpoint.
  _dir.divideScalar(segLen); // unit direction along the segment.

  // Find the obstacle with the largest positive penetration.
  let worst: Obstacle | null = null;
  let worstPen = 0;
  let worstGap = 0;
  let worstT = 0;
  for (const ob of obstacles) {
    _toC.copy(ob.center).sub(from);
    const t = Math.min(segLen, Math.max(0, _toC.dot(_dir)));
    _pc.copy(from).addScaledVector(_dir, t);
    const gap = _pc.distanceTo(ob.center);
    const pen = ob.radius - gap;
    if (pen > worstPen) {
      worstPen = pen;
      worst = ob;
      worstGap = gap;
      worstT = t;
    }
  }
  if (!worst) return out; // nothing in the way → straight line.

  // Closest point on the segment to the worst obstacle's centre.
  _pc.copy(from).addScaledVector(_dir, worstT);

  // Sideways push direction: from the obstacle centre toward Pc (away from it).
  if (worstGap > 1e-3) {
    _push.copy(_pc).sub(worst.center).normalize();
  } else {
    // Segment passes through the centre — pick a stable perpendicular to dir.
    _push.crossVectors(_dir, _up);
    if (_push.lengthSq() < 1e-6) _push.crossVectors(_dir, _xax);
    _push.normalize();
  }

  // Slight upward lift so the swerve arcs a touch over the ecliptic.
  _push.y += 0.2;
  _push.normalize();

  // Control = closest point on the segment + push * 2*(penetration + margin).
  // (×2 because a quadratic Bézier's apex only reaches halfway to the control.)
  return out.copy(_pc).addScaledVector(_push, 2 * (worstPen + margin));
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
  /** Bézier control point for the camera's flight, computed once per trip. */
  camControl: THREE.Vector3;
  /** Camera look target at the moment the current move started. */
  fromLook: THREE.Vector3;
  /** Current (lerped) camera look target — carried frame to frame. */
  lastLook: THREE.Vector3;
  /** Ship position at the moment the current move started. */
  shipFrom: THREE.Vector3;
  /** Bézier control point for the ship's flight, computed once per trip. */
  shipControl: THREE.Vector3;
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
    camControl: new THREE.Vector3(),
    fromLook: new THREE.Vector3(),
    lastLook: new THREE.Vector3(),
    shipFrom: new THREE.Vector3(),
    shipControl: new THREE.Vector3(),
    shipPos: new THREE.Vector3(),
    shiftHeld: false,
    yaw: 0,
    pitch: 0,
    orbAng: 0,
  };
}
