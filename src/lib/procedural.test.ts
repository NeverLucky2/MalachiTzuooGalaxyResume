import {describe, it, expect} from 'vitest';
import {planetCanvas, radialCanvas} from './procedural';

describe('procedural textures', () => {
  it('planetCanvas returns a 512x256 canvas', () => {
    const c = planetCanvas(0x3b82f6, 'earth');
    expect(c.width).toBe(512); expect(c.height).toBe(256);
  });
  it('radialCanvas returns a 128 canvas', () => {
    expect(radialCanvas('rgba(255,255,255,1)',.3,'rgba(0,0,0,.5)','rgba(0,0,0,0)').width).toBe(128);
  });
});
