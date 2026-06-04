const BEST_KEY = 'galaxy.asteroids.best';

/** Score is the floored distance survived. */
export function scoreFromDistance(distance: number): number {
  return Math.floor(distance);
}

/** Read the saved best score; 0 if absent or unreadable. */
export function loadBest(): number {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Persist `score` if it beats the stored best; returns the resulting best. */
export function saveBest(score: number): number {
  const best = Math.max(loadBest(), Math.floor(score));
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    /* storage unavailable — best is still returned for this session */
  }
  return best;
}
