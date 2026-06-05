export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DiffParams {
  baseSpeed: number;
  speedRamp: number; // units/sec added per elapsed second
  maxSpeed: number;
  baseGap: number; // gap diameter (world units)
  minGap: number;
  gapRamp: number; // gap shrink per elapsed second
  baseSpawnInterval: number; // seconds between waves
  minSpawnInterval: number;
  spawnRamp: number; // interval shrink per elapsed second
  spacing: number; // asteroid-wall grid spacing — larger = sparser walls = fewer asteroids
}

// Easy: slow + sparse. Normal: today's hard SPEED but slightly sparser. Hard: faster + dense.
export const DIFFICULTY: Record<Difficulty, DiffParams> = {
  easy:   {baseSpeed: 24, speedRamp: 0.45, maxSpeed: 55,  baseGap: 8.0, minGap: 5.5, gapRamp: 0.05, baseSpawnInterval: 1.6, minSpawnInterval: 1.0,  spawnRamp: 0.012, spacing: 3.6},
  normal: {baseSpeed: 38, speedRamp: 0.80, maxSpeed: 95,  baseGap: 6.5, minGap: 4.2, gapRamp: 0.06, baseSpawnInterval: 1.3, minSpawnInterval: 0.8,  spawnRamp: 0.016, spacing: 3.1},
  hard:   {baseSpeed: 44, speedRamp: 0.95, maxSpeed: 112, baseGap: 5.4, minGap: 3.0, gapRamp: 0.07, baseSpawnInterval: 1.1, minSpawnInterval: 0.65, spawnRamp: 0.020, spacing: 2.6},
};

export function speedAt(p: DiffParams, elapsed: number): number {
  return Math.min(p.maxSpeed, p.baseSpeed + p.speedRamp * elapsed);
}

export function gapWidthAt(p: DiffParams, elapsed: number): number {
  return Math.max(p.minGap, p.baseGap - p.gapRamp * elapsed);
}

export function spawnIntervalAt(p: DiffParams, elapsed: number): number {
  return Math.max(p.minSpawnInterval, p.baseSpawnInterval - p.spawnRamp * elapsed);
}
