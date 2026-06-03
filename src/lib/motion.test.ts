import {describe, it, expect} from 'vitest';
import * as THREE from 'three';
import {smoothstep, bezierPoint, bowControl} from './motion';

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

describe('bowControl', () => {
  const SAFE = 60;

  it('degenerates to the midpoint for short hops already outside SAFE (=> straight lerp)', () => {
    // Two adjacent outer points whose midpoint is well beyond SAFE.
    const from = v(88, 0, 0);
    const to = v(0, 0, 88);
    const mid = from.clone().add(to).multiplyScalar(0.5);
    expect(mid.length()).toBeGreaterThan(SAFE);
    const c = bowControl(from, to, SAFE);
    expect(c.x).toBeCloseTo(mid.x, 6);
    expect(c.y).toBeCloseTo(mid.y, 6);
    expect(c.z).toBeCloseTo(mid.z, 6);
  });

  it('bows an inner↔outer opposite-side crossing away from the star', () => {
    // Worst case: inner planet at +X (r=20) ↔ outer planet on the opposite side
    // at -X (r=110). The straight segment runs along the X axis straight THROUGH
    // the origin (min dist 0 at x=0). Real travel uses camera framing positions
    // (offset further out than these raw centres), so this is a conservative case.
    const from = v(20, 0, 0);
    const to = v(-110, 0, 0);
    const control = bowControl(from, to, SAFE);

    // Sample the straight lerp vs. the arc; the arc must lift the minimum
    // clearance dramatically (straight passes through the origin → ~0).
    let straightMin = Infinity;
    let arcMin = Infinity;
    for (let i = 0; i <= 40; i++) {
      const e = i / 40;
      straightMin = Math.min(straightMin, from.clone().lerp(to, e).length());
      arcMin = Math.min(arcMin, bezierPoint(from, control, to, e).length());
    }
    expect(straightMin).toBeLessThan(1); // straight path skims the star
    expect(arcMin).toBeGreaterThan(straightMin + 1); // arc pulls away from it

    // The arc midpoint clears the keep-out radius comfortably (~SAFE region).
    const arcMid = bezierPoint(from, control, to, 0.5).length();
    expect(arcMid).toBeGreaterThan(SAFE * 0.8);
  });

  it('handles a path passing exactly through the origin without NaN', () => {
    const from = v(50, 0, 0);
    const to = v(-50, 0, 0); // midpoint == origin
    const control = bowControl(from, to, SAFE);
    expect(Number.isFinite(control.x)).toBe(true);
    expect(Number.isFinite(control.y)).toBe(true);
    expect(Number.isFinite(control.z)).toBe(true);
    // Midpoint is the origin (d=0), so bow = 2*safe and the control sits 2*safe
    // out along the lifted fallback axis; the Bézier apex then reaches ~safe.
    expect(control.length()).toBeCloseTo(2 * SAFE, 4);
    const apex = bezierPoint(from, control, to, 0.5);
    expect(apex.length()).toBeCloseTo(SAFE, 4);
  });

  it('writes into the provided out vector and returns it', () => {
    const out = v(0, 0, 0);
    const r = bowControl(v(20, 0, 0), v(-110, 0, 0), SAFE, out);
    expect(r).toBe(out);
  });
});
