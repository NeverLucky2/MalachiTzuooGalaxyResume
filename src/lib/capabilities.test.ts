import {describe, it, expect} from 'vitest';
import {shouldUse3D, isCompact} from './capabilities';

describe('shouldUse3D', () => {
  const base = {hasWebGL: true, reducedMotion: false, coarsePointer: false, width: 1280};
  it('true on a capable desktop', () => expect(shouldUse3D(base)).toBe(true));
  it('false without WebGL', () => expect(shouldUse3D({...base, hasWebGL: false})).toBe(false));
  it('false with reduced motion', () => expect(shouldUse3D({...base, reducedMotion: true})).toBe(false));
  it('true on small touch screens (phones now boot into the galaxy)', () =>
    expect(shouldUse3D({...base, coarsePointer: true, width: 600})).toBe(true));
});

describe('isCompact', () => {
  it('true for a coarse pointer even on a wide screen', () =>
    expect(isCompact({coarsePointer: true, width: 1280})).toBe(true));
  it('true for a narrow viewport with a fine pointer', () =>
    expect(isCompact({coarsePointer: false, width: 600})).toBe(true));
  it('false for a wide fine-pointer desktop', () =>
    expect(isCompact({coarsePointer: false, width: 1280})).toBe(false));
  it('boundary: width 768 is not compact', () =>
    expect(isCompact({coarsePointer: false, width: 768})).toBe(false));
});
