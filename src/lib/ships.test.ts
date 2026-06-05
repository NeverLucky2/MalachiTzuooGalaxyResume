import {describe, it, expect} from 'vitest';
import {SHIP_VARIANTS, INTERCEPTOR_UNLOCK, isInterceptorUnlocked, isVariantUnlocked} from './ships';

describe('ships registry', () => {
  it('lists default (free) and interceptor (1000)', () => {
    expect(SHIP_VARIANTS.map((v) => v.id)).toEqual(['default', 'interceptor']);
    expect(SHIP_VARIANTS.find((v) => v.id === 'default')!.unlockScore).toBe(0);
    expect(SHIP_VARIANTS.find((v) => v.id === 'interceptor')!.unlockScore).toBe(1000);
    expect(INTERCEPTOR_UNLOCK).toBe(1000);
  });

  it('isInterceptorUnlocked is true only at/above the threshold', () => {
    expect(isInterceptorUnlocked(0)).toBe(false);
    expect(isInterceptorUnlocked(999)).toBe(false);
    expect(isInterceptorUnlocked(1000)).toBe(true);
    expect(isInterceptorUnlocked(5000)).toBe(true);
  });

  it('isVariantUnlocked: default always; interceptor gated by best', () => {
    expect(isVariantUnlocked('default', 0)).toBe(true);
    expect(isVariantUnlocked('interceptor', 999)).toBe(false);
    expect(isVariantUnlocked('interceptor', 1000)).toBe(true);
  });
});
