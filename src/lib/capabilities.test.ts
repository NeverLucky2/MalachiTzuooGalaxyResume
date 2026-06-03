import {describe, it, expect} from 'vitest';
import {shouldUse3D} from './capabilities';

describe('shouldUse3D', () => {
  const base = {hasWebGL:true, reducedMotion:false, coarsePointer:false, width:1280};
  it('true on a capable desktop', () => expect(shouldUse3D(base)).toBe(true));
  it('false without WebGL', () => expect(shouldUse3D({...base, hasWebGL:false})).toBe(false));
  it('false with reduced motion', () => expect(shouldUse3D({...base, reducedMotion:true})).toBe(false));
  it('false on small touch screens', () => expect(shouldUse3D({...base, coarsePointer:true, width:600})).toBe(false));
});
