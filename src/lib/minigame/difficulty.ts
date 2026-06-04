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
}

export const DIFFICULTY: Record<Difficulty, DiffParams> = {
  easy:   {baseSpeed: 24, speedRamp: 0.45, maxSpeed: 55, baseGap: 7.0, minGap: 4.2, gapRamp: 0.05, baseSpawnInterval: 1.5,  minSpawnInterval: 0.85, spawnRamp: 0.012},
  normal: {baseSpeed: 30, speedRamp: 0.60, maxSpeed: 72, baseGap: 6.0, minGap: 3.4, gapRamp: 0.06, baseSpawnInterval: 1.25, minSpawnInterval: 0.60, spawnRamp: 0.016},
  hard:   {baseSpeed: 38, speedRamp: 0.80, maxSpeed: 95, baseGap: 5.2, minGap: 2.8, gapRamp: 0.07, baseSpawnInterval: 1.0,  minSpawnInterval: 0.45, spawnRamp: 0.020},
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
