export interface Collidable {
  x: number;
  y: number;
  z: number;
  r: number;
  active: boolean;
}

/** True when two spheres overlap or touch. */
export function spheresOverlap(
  ax: number, ay: number, az: number, ar: number,
  bx: number, by: number, bz: number, br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const dz = az - bz;
  const sum = ar + br;
  return dx * dx + dy * dy + dz * dz <= sum * sum;
}

/** True if the ship sphere overlaps any active asteroid. */
export function shipHitsAny(
  shipX: number, shipY: number, shipZ: number, shipR: number,
  asteroids: Collidable[],
): boolean {
  for (const a of asteroids) {
    if (!a.active) continue;
    if (spheresOverlap(shipX, shipY, shipZ, shipR, a.x, a.y, a.z, a.r)) return true;
  }
  return false;
}
