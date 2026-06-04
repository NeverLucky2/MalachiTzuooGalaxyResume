import {describe, it, expect} from 'vitest';
import {makeWave, type WaveConfig} from './spawn';
import {makeRng} from './rng';

const cfg: WaveConfig = {halfW: 9, halfH: 6, spacing: 2.6, rMin: 0.7, rMax: 1.7};

describe('makeWave', () => {
  it('leaves the gap clear of every asteroid body', () => {
    const wave = makeWave(makeRng(123), 6, cfg);
    const gapR = 3; // gapDiameter / 2
    for (const a of wave.asteroids) {
      const d = Math.hypot(a.x - wave.gapX, a.y - wave.gapY);
      expect(d - a.r).toBeGreaterThanOrEqual(gapR);
    }
  });

  it('builds a non-empty wall', () => {
    const wave = makeWave(makeRng(123), 6, cfg);
    expect(wave.asteroids.length).toBeGreaterThan(5);
  });

  it('keeps the gap center inside the play bounds', () => {
    for (let seed = 0; seed < 20; seed++) {
      const wave = makeWave(makeRng(seed), 6, cfg);
      expect(Math.abs(wave.gapX)).toBeLessThanOrEqual(cfg.halfW);
      expect(Math.abs(wave.gapY)).toBeLessThanOrEqual(cfg.halfH);
    }
  });

  it('is deterministic for a seed', () => {
    const a = makeWave(makeRng(5), 6, cfg);
    const b = makeWave(makeRng(5), 6, cfg);
    expect(a.asteroids.length).toBe(b.asteroids.length);
    expect(a.gapX).toBe(b.gapX);
  });
});
