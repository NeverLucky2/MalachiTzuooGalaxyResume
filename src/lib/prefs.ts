/**
 * Centralized localStorage boolean flags for the galaxy HUD. All reads are
 * SSR-safe (return the default when `window` is absent) and storage-failure-safe.
 * Stored as '1'/'0'; an ABSENT key falls back to the provided default — that's how
 * the ship mini-game stays ON until a user explicitly turns it off.
 */
function readBool(key: string, dflt: boolean): boolean {
  if (typeof window === 'undefined') return dflt;
  try {
    const v = localStorage.getItem(key);
    return v === null ? dflt : v === '1';
  } catch {
    return dflt;
  }
}

function writeBool(key: string, value: boolean): void {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* storage unavailable — ignore */
  }
}

export const TOUR_DONE_KEY = 'galaxy.tour.done';
export const SHIP_MINIGAME_KEY = 'galaxy.ship.minigame';
export const TAKEOFF_TIP_KEY = 'galaxy.takeoff.tipSeen';

export const isTourDone = () => readBool(TOUR_DONE_KEY, false);
export const setTourDone = (done: boolean) => writeBool(TOUR_DONE_KEY, done);

export const isShipMinigameEnabled = () => readBool(SHIP_MINIGAME_KEY, true);
export const setShipMinigameEnabled = (on: boolean) => writeBool(SHIP_MINIGAME_KEY, on);

export const isTakeoffTipSeen = () => readBool(TAKEOFF_TIP_KEY, false);
export const setTakeoffTipSeen = (seen: boolean) => writeBool(TAKEOFF_TIP_KEY, seen);

