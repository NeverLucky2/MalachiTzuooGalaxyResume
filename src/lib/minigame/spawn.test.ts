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

  it('covers out to the play bounds — no safe corner', () => {
    // The old grid topped out around x~6.6 / y~4.4; the wall must now reach the
    // full ±halfW / ±halfH the ship can fly to, so the corners can't be blind.
    const wave = makeWave(makeRng(11), 5, cfg);
    const xs = wave.asteroids.map((a) => a.x);
    const ys = wave.asteroids.map((a) => a.y);
    expect(Math.max(...xs)).toBeGreaterThan(7.5);
    expect(Math.min(...xs)).toBeLessThan(-7.5);
    expect(Math.max(...ys)).toBeGreaterThan(5);
    expect(Math.min(...ys)).toBeLessThan(-5);
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
