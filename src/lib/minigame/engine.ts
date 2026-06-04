import {PLAY, type World} from './world';
import {type DiffParams, speedAt, spawnIntervalAt, gapWidthAt} from './difficulty';
import {makeWave} from './spawn';
import {shipHitsAny} from './collision';

export interface EngineInput {
  dt: number;
  targetX: number;
  targetY: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Activate pool slots for a fresh wave at the spawn plane. */
export function spawnWave(world: World, diff: DiffParams, rng: () => number): void {
  const wave = makeWave(rng, gapWidthAt(diff, world.elapsed), {
    halfW: PLAY.halfW,
    halfH: PLAY.halfH,
    spacing: PLAY.spacing,
    rMin: PLAY.rMin,
    rMax: PLAY.rMax,
  });
  let wi = 0;
  for (const a of world.asteroids) {
    if (wi >= wave.asteroids.length) break;
    if (a.active) continue;
    const w = wave.asteroids[wi++];
    a.active = true;
    a.x = w.x;
    a.y = w.y;
    a.z = PLAY.spawnZ;
    a.r = w.r;
    a.rotX = rng() * 6.283;
    a.rotY = rng() * 6.283;
    a.rotZ = rng() * 6.283;
    a.spin = (rng() * 2 - 1) * 1.5;
  }
}

/** Advance the simulation one frame (mutates `world`). No-op once dead. */
export function stepWorld(world: World, input: EngineInput, diff: DiffParams, rng: () => number): void {
  if (!world.alive) return;
  const dt = Math.min(0.05, input.dt); // clamp huge frame gaps (tab refocus)

  world.elapsed += dt;
  world.speed = speedAt(diff, world.elapsed);

  // Ship eases toward the clamped target.
  const tx = clamp(input.targetX, -PLAY.halfW, PLAY.halfW);
  const ty = clamp(input.targetY, -PLAY.halfH, PLAY.halfH);
  const k = Math.min(1, PLAY.shipEase * dt);
  world.shipX += (tx - world.shipX) * k;
  world.shipY += (ty - world.shipY) * k;

  // Advance asteroids toward the camera; recycle past the despawn plane.
  const move = world.speed * dt;
  for (const a of world.asteroids) {
    if (!a.active) continue;
    a.z += move;
    a.rotX += a.spin * dt;
    a.rotY += a.spin * dt * 0.7;
    if (a.z > PLAY.despawnZ) a.active = false;
  }
  world.distance += move;

  // Spawn the next wave when due.
  world.nextSpawnIn -= dt;
  if (world.nextSpawnIn <= 0) {
    spawnWave(world, diff, rng);
    world.nextSpawnIn = spawnIntervalAt(diff, world.elapsed);
  }

  // One hit ends the run.
  if (shipHitsAny(world.shipX, world.shipY, PLAY.shipZ, PLAY.shipR, world.asteroids)) {
    world.alive = false;
  }
}
