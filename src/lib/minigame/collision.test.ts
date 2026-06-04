import {describe, it, expect} from 'vitest';
import {spheresOverlap, shipHitsAny, type Collidable} from './collision';

describe('spheresOverlap', () => {
  it('detects overlap', () => {
    expect(spheresOverlap(0, 0, 0, 1, 1, 0, 0, 1)).toBe(true); // gap 2, radii sum 2 → touching
  });
  it('detects separation', () => {
    expect(spheresOverlap(0, 0, 0, 1, 3, 0, 0, 1)).toBe(false);
  });
});

describe('shipHitsAny', () => {
  const asteroids: Collidable[] = [
    {x: 8, y: 0, z: 0, r: 1, active: true},
    {x: 0, y: 0, z: 0, r: 1, active: false}, // inactive, would overlap but is ignored
  ];
  it('ignores inactive asteroids', () => {
    expect(shipHitsAny(0, 0, 0, 0.6, asteroids)).toBe(false);
  });
  it('hits an active overlapping asteroid', () => {
    expect(shipHitsAny(8, 0, 0, 0.6, asteroids)).toBe(true);
  });
});
