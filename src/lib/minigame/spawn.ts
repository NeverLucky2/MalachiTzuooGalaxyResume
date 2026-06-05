export interface WaveConfig {
  halfW: number;   // play half-width (x)
  halfH: number;   // play half-height (y)
  spacing: number; // grid spacing between candidate asteroid slots
  rMin: number;    // min asteroid radius
  rMax: number;    // max asteroid radius
}

export interface WaveAsteroid {
  x: number;
  y: number;
  r: number;
}

export interface Wave {
  gapX: number;
  gapY: number;
  asteroids: WaveAsteroid[];
}

/**
 * Build one wave: a jittered grid of asteroids across the play cross-section,
 * skipping any slot that would intrude into a single circular gap of
 * `gapDiameter` centered at a random (gapX, gapY). The gap is the only safe
 * route through the wall. Pure + deterministic given `rng`.
 */
export function makeWave(rng: () => number, gapDiameter: number, cfg: WaveConfig): Wave {
  const gapR = gapDiameter / 2;
  const gapX = (rng() * 2 - 1) * Math.max(0, cfg.halfW - gapR);
  const gapY = (rng() * 2 - 1) * Math.max(0, cfg.halfH - gapR);

  // Even grid INCLUDING both endpoints (±halfW, ±halfH) so the wall reaches the
  // full ship-reachable area — corners included — leaving no permanent blind spot.
  const cols = Math.max(1, Math.ceil((2 * cfg.halfW) / cfg.spacing));
  const rows = Math.max(1, Math.ceil((2 * cfg.halfH) / cfg.spacing));
  const jit = cfg.spacing * 0.25;

  const asteroids: WaveAsteroid[] = [];
  for (let i = 0; i <= cols; i++) {
    const gx = -cfg.halfW + (2 * cfg.halfW) * (i / cols);
    for (let j = 0; j <= rows; j++) {
      const gy = -cfg.halfH + (2 * cfg.halfH) * (j / rows);
      const x = gx + (rng() * 2 - 1) * jit;
      const y = gy + (rng() * 2 - 1) * jit;
      const r = cfg.rMin + rng() * (cfg.rMax - cfg.rMin);
      // Keep this asteroid only if its whole body sits outside the gap.
      if (Math.hypot(x - gapX, y - gapY) - r >= gapR) {
        asteroids.push({x, y, r});
      }
    }
  }
  return {gapX, gapY, asteroids};
}
