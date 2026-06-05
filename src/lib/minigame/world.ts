/** Shared spatial constants for the play space (world units). */
export const PLAY = {
  halfW: 9,       // play-plane half width (x)
  halfH: 6,       // play-plane half height (y)
  shipZ: 0,       // ship's fixed z (asteroids approach toward +z)
  spawnZ: -120,   // asteroids spawn at this z
  despawnZ: 14,   // recycled once past this z (behind the camera)
  shipR: 0.55,    // ship collision radius
  poolSize: 120,  // asteroid pool capacity (hard cap; large enough that full walls — incl. corners — never overflow/drop)
  shipEase: 6,    // ship target-follow rate (per second)
  rMin: 0.7,
  rMax: 1.7,
} as const;

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  z: number;
  r: number;
  active: boolean;
  rotX: number;
  rotY: number;
  rotZ: number;
  spin: number;
}

export interface World {
  asteroids: Asteroid[];
  shipX: number;
  shipY: number;
  elapsed: number;   // seconds played
  distance: number;  // accumulated speed*dt → score basis
  speed: number;     // current approach speed
  nextSpawnIn: number;
  alive: boolean;
}

/** Fresh world with a pre-allocated, all-inactive asteroid pool. */
export function createWorld(): World {
  const asteroids: Asteroid[] = Array.from({length: PLAY.poolSize}, (_, i) => ({
    id: i,
    x: 0,
    y: 0,
    z: PLAY.despawnZ + 10,
    r: 1,
    active: false,
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    spin: 0,
  }));
  return {
    asteroids,
    shipX: 0,
    shipY: 0,
    elapsed: 0,
    distance: 0,
    speed: 0,
    nextSpawnIn: 0.6,
    alive: true,
  };
}
