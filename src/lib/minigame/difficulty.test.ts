import {describe, it, expect} from 'vitest';
import {DIFFICULTY, speedAt, gapWidthAt, spawnIntervalAt} from './difficulty';

describe('difficulty', () => {
  it('easy is strictly easier than hard at every elapsed time', () => {
    for (const t of [0, 10, 30, 60, 120]) {
      expect(speedAt(DIFFICULTY.easy, t)).toBeLessThan(speedAt(DIFFICULTY.hard, t));
      expect(gapWidthAt(DIFFICULTY.easy, t)).toBeGreaterThan(gapWidthAt(DIFFICULTY.hard, t));
    }
  });

  it('speed rises with time but is capped', () => {
    const p = DIFFICULTY.normal;
    expect(speedAt(p, 10)).toBeGreaterThan(speedAt(p, 0));
    expect(speedAt(p, 100000)).toBeLessThanOrEqual(p.maxSpeed);
  });

  it('gap narrows with time but never below the floor', () => {
    const p = DIFFICULTY.normal;
    expect(gapWidthAt(p, 10)).toBeLessThan(gapWidthAt(p, 0));
    expect(gapWidthAt(p, 100000)).toBeGreaterThanOrEqual(p.minGap);
  });

  it('spawn interval shrinks with time but never below the floor', () => {
    const p = DIFFICULTY.normal;
    expect(spawnIntervalAt(p, 10)).toBeLessThan(spawnIntervalAt(p, 0));
    expect(spawnIntervalAt(p, 100000)).toBeGreaterThanOrEqual(p.minSpawnInterval);
  });
});
