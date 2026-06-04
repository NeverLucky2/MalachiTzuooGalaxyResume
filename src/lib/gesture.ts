export type Gesture = 'next' | 'prev' | 'land' | 'takeOff' | 'look';

/** Min pointer travel (px) for a move to count as a flick rather than a look-drag. */
export const MIN_FLICK_DISTANCE = 45;
/** Max duration (ms) for a move to count as a quick flick. */
export const MAX_FLICK_MS = 400;

/**
 * Classify a canvas pointer interaction. `dx/dy` are end−start in px (dy<0 = up),
 * `dtMs` the elapsed time. A quick, far-enough flick maps to a nav gesture by its
 * dominant axis; anything slow or small is a free-look drag.
 *
 *   horizontal: left (dx<0) → next (outward),  right (dx>0) → prev (inward)
 *   vertical:   up   (dy<0) → land,            down (dy>0)  → takeOff
 */
export function classifyGesture(dx: number, dy: number, dtMs: number): Gesture {
  if (dtMs > MAX_FLICK_MS) return 'look';
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (Math.max(adx, ady) < MIN_FLICK_DISTANCE) return 'look';
  if (adx >= ady) return dx < 0 ? 'next' : 'prev';
  return dy < 0 ? 'land' : 'takeOff';
}
