import {describe, it, expect} from 'vitest';
import {PRESETS, framing} from './cameraPresets';

const P: [number,number,number] = [20,0,0]; // about on +x axis

describe('framing', () => {
  it('SUN LEFT places the camera farther from the planet than LIT FACE', () => {
    const a = framing(P, 1.75, 'SUN LEFT', false);
    const b = framing(P, 1.75, 'LIT FACE', false);
    const dist = (c:[number,number,number]) => Math.hypot(c[0]-P[0],c[1]-P[1],c[2]-P[2]);
    expect(dist(a.pos)).toBeGreaterThan(dist(b.pos));
  });
  it('landing pulls the camera closer than its non-landed framing', () => {
    const far = framing(P, 1.75, 'SUN LEFT', false);
    const near = framing(P, 1.75, 'SUN LEFT', true);
    const dist = (c:[number,number,number]) => Math.hypot(c[0]-P[0],c[1]-P[1],c[2]-P[2]);
    expect(dist(near.pos)).toBeLessThan(dist(far.pos));
  });
  it('TOP-DOWN looks at the origin from high above', () => {
    const f = framing(P, 1.75, 'TOP-DOWN', false);
    expect(f.pos[1]).toBeGreaterThan(150);
    expect(f.look).toEqual([0,0,0]);
  });
  it('exposes ship scale per preset', () => {
    expect(PRESETS['LIT FACE'].ship).toBeLessThan(PRESETS['SUN LEFT'].ship);
  });
});
