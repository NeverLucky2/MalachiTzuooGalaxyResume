/** Selectable ship models. `default` is always available; others unlock by score. */
export type ShipVariantId = 'default' | 'interceptor';

export interface ShipVariant {
  id: ShipVariantId;
  name: string;
  /** Best mini-game score required to unlock (0 = always available). */
  unlockScore: number;
}

/** Score needed to unlock the Interceptor (any difficulty). */
export const INTERCEPTOR_UNLOCK = 1000;

export const SHIP_VARIANTS: ShipVariant[] = [
  {id: 'default', name: 'Standard', unlockScore: 0},
  {id: 'interceptor', name: 'Interceptor', unlockScore: INTERCEPTOR_UNLOCK},
];

/** Is `id` unlocked given the player's best score? */
export function isVariantUnlocked(id: ShipVariantId, best: number): boolean {
  const v = SHIP_VARIANTS.find((s) => s.id === id);
  return v ? best >= v.unlockScore : false;
}

/** Convenience: is the Interceptor unlocked at this best score? */
export function isInterceptorUnlocked(best: number): boolean {
  return best >= INTERCEPTOR_UNLOCK;
}
