import {describe, it, expect} from 'vitest';
import * as THREE from 'three';
import {
  smoothstep,
  bezierPoint,
  avoidanceControl,
  orbitPointFor,
  type Obstacle,
} from './motion';

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

describe('smoothstep', () => {
  it('pins endpoints and is monotonic at the middle', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 6);
  });
});

describe('bezierPoint', () => {
  const from = v(-100, 0, 0);
  const control = v(0, 80, 0);
  const to = v(100, 0, 0);

  it('returns `from` at e=0 (exact endpoint)', () => {
    const p = bezierPoint(from, control, to, 0);
    expect(p.x).toBeCloseTo(from.x, 6);
    expect(p.y).toBeCloseTo(from.y, 6);
    expect(p.z).toBeCloseTo(from.z, 6);
  });

  it('returns `to` at e=1 (exact endpoint)', () => {
    const p = bezierPoint(from, control, to, 1);
    expect(p.x).toBeCloseTo(to.x, 6);
    expect(p.y).toBeCloseTo(to.y, 6);
    expect(p.z).toBeCloseTo(to.z, 6);
  });

  it('at e=0.5 sits at (from+to)/4 + control/2 (quadratic Bézier midpoint)', () => {
    const p = bezierPoint(from, control, to, 0.5);
    // 0.25*from + 0.5*control + 0.25*to
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.y).toBeCloseTo(40, 6);
    expect(p.z).toBeCloseTo(0, 6);
  });

  it('writes into the provided out vector and returns it', () => {
    const out = v(0, 0, 0);
    const r = bezierPoint(from, control, to, 0.5, out);
    expect(r).toBe(out);
  });
});

describe('orbitPointFor', () => {
  it('matches the radius/bob/lift formula and accepts a tuple or Vector3', () => {
    const size = 4;
    const ang = 0.7;
    const rr = Math.max(size * 1.45, 1.3);
    const exp = v(
      10 + Math.cos(ang) * rr,
      2 + Math.sin(ang) * rr * 0.32 + size * 0.45,
      -5 + Math.sin(ang) * rr,
    );
    const fromTuple = orbitPointFor([10, 2, -5], size, ang);
    const fromVec = orbitPointFor(v(10, 2, -5), size, ang);
    for (const p of [fromTuple, fromVec]) {
      expect(p.x).toBeCloseTo(exp.x, 6);
      expect(p.y).toBeCloseTo(exp.y, 6);
      expect(p.z).toBeCloseTo(exp.z, 6);
    }
  });

  it('clamps the orbit radius to a 1.3 floor for tiny planets', () => {
    // size*1.45 = 0.145 < 1.3, so the radius floor applies at angle 0.
    const p = orbitPointFor([0, 0, 0], 0.1, 0);
    // cos(0)*rr = rr = 1.3 in x; sin(0)=0 so y = size*0.45, z = 0.
    expect(p.x).toBeCloseTo(1.3, 6);
    expect(p.y).toBeCloseTo(0.045, 6);
    expect(p.z).toBeCloseTo(0, 6);
  });

  it('writes into the provided out vector and returns it', () => {
    const out = v(0, 0, 0);
    const r = orbitPointFor([1, 1, 1], 2, 0.3, out);
    expect(r).toBe(out);
  });
});

describe('avoidanceControl', () => {
  const STAR: Obstacle = {center: v(0, 0, 0), radius: 26};

  it('endpoints are exact via bezier (e=0 → from, e=1 → to)', () => {
    const from = v(20, 0, 0);
    const to = v(-110, 0, 0);
    const c = avoidanceControl(from, to, [STAR]);
    const p0 = bezierPoint(from, c, to, 0);
    const p1 = bezierPoint(from, c, to, 1);
    expect(p0.x).toBeCloseTo(from.x, 6);
    expect(p0.y).toBeCloseTo(from.y, 6);
    expect(p0.z).toBeCloseTo(from.z, 6);
    expect(p1.x).toBeCloseTo(to.x, 6);
    expect(p1.y).toBeCloseTo(to.y, 6);
    expect(p1.z).toBeCloseTo(to.z, 6);
  });

  it('returns the segment midpoint (straight line) when no obstacle is near', () => {
    // Two adjacent outer points; the star at the origin is far from this segment.
    const from = v(88, 0, 0);
    const to = v(0, 0, 88);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const c = avoidanceControl(from, to, [STAR]);
    expect(c.x).toBeCloseTo(mid.x, 6);
    expect(c.y).toBeCloseTo(mid.y, 6);
    expect(c.z).toBeCloseTo(mid.z, 6);

    // Sampled path stays on the straight line: apex == straight midpoint.
    const apex = bezierPoint(from, c, to, 0.5);
    expect(apex.x).toBeCloseTo(mid.x, 6);
    expect(apex.y).toBeCloseTo(mid.y, 6);
    expect(apex.z).toBeCloseTo(mid.z, 6);
  });

  it('swerves so the path clears a star it would otherwise pass through', () => {
    // Segment runs along the X axis straight through the origin (the star).
    const from = v(40, 0, 0);
    const to = v(-110, 0, 0);
    const c = avoidanceControl(from, to, [STAR]);

    let arcMin = Infinity;
    let straightMin = Infinity;
    for (let i = 0; i <= 60; i++) {
      const e = i / 60;
      arcMin = Math.min(arcMin, bezierPoint(from, c, to, e).distanceTo(STAR.center));
      straightMin = Math.min(
        straightMin,
        from.clone().lerp(to, e).distanceTo(STAR.center),
      );
    }
    expect(straightMin).toBeLessThan(STAR.radius); // straight path clips the star
    // Closest approach of the arc clears the star radius (allow tiny sampling slack).
    expect(arcMin).toBeGreaterThanOrEqual(STAR.radius - 0.5);
  });

  it('does not deflect when an obstacle is off the path', () => {
    // Star far to the side of a segment that runs along +Z, well clear of it.
    const from = v(80, 0, -20);
    const to = v(80, 0, 60);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    const c = avoidanceControl(from, to, [STAR]);
    expect(c.x).toBeCloseTo(mid.x, 6);
    expect(c.y).toBeCloseTo(mid.y, 6);
    expect(c.z).toBeCloseTo(mid.z, 6);
  });

  it('picks the obstacle with the largest penetration and stays finite through-centre', () => {
    // Segment through the origin; a shallow obstacle plus the deep star.
    const from = v(50, 0, 0);
    const to = v(-50, 0, 0);
    const shallow: Obstacle = {center: v(0, 30, 0), radius: 31}; // pen ~1 at closest
    const c = avoidanceControl(from, to, [shallow, STAR]);
    expect(Number.isFinite(c.x)).toBe(true);
    expect(Number.isFinite(c.y)).toBe(true);
    expect(Number.isFinite(c.z)).toBe(true);
    // The star (pen 26) dominates → arc clears the star radius.
    let arcMin = Infinity;
    for (let i = 0; i <= 60; i++) {
      arcMin = Math.min(arcMin, bezierPoint(from, c, to, i / 60).distanceTo(STAR.center));
    }
    expect(arcMin).toBeGreaterThanOrEqual(STAR.radius - 0.5);
  });

  it('writes into the provided out vector and returns it', () => {
    const out = v(0, 0, 0);
    const r = avoidanceControl(v(20, 0, 0), v(-110, 0, 0), [STAR], 3, out);
    expect(r).toBe(out);
  });
});
