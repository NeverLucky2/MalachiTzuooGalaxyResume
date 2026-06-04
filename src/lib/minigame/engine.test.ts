import {describe, it, expect} from 'vitest';
import {createWorld, PLAY} from './world';
import {stepWorld} from './engine';
import {DIFFICULTY} from './difficulty';
import {makeRng} from './rng';

const D = DIFFICULTY.normal;

describe('stepWorld', () => {
  it('eases the ship toward the (clamped) target without overshooting', () => {
    const w = createWorld();
    for (let i = 0; i < 30; i++) stepWorld(w, {dt: 1 / 60, targetX: 100, targetY: 0}, D, makeRng(1));
    expect(w.shipX).toBeGreaterThan(0);
    expect(w.shipX).toBeLessThanOrEqual(PLAY.halfW + 1e-6); // clamped, never past the wall
  });

  it('spawns asteroids over time and accrues distance', () => {
    const w = createWorld();
    const rng = makeRng(2);
    for (let i = 0; i < 120; i++) stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, rng);
    expect(w.asteroids.some((a) => a.active)).toBe(true);
    expect(w.distance).toBeGreaterThan(0);
  });

  it('recycles asteroids that pass the despawn plane', () => {
    const w = createWorld();
    w.asteroids[0].active = true;
    w.asteroids[0].z = PLAY.despawnZ - 0.01;
    stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, makeRng(3));
    expect(w.asteroids[0].active).toBe(false);
  });

  it('ends the run when an asteroid overlaps the ship', () => {
    const w = createWorld();
    w.asteroids[0] = {...w.asteroids[0], active: true, x: 0, y: 0, z: PLAY.shipZ, r: 1};
    stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, makeRng(4));
    expect(w.alive).toBe(false);
  });

  it('is inert once dead', () => {
    const w = createWorld();
    w.alive = false;
    const before = w.elapsed;
    stepWorld(w, {dt: 1 / 60, targetX: 0, targetY: 0}, D, makeRng(5));
    expect(w.elapsed).toBe(before);
  });
});
