'use client';
import type {ShipVariantId} from '@/lib/ships';
import {ShipModel} from './ShipModel';
import {InterceptorShip} from './InterceptorShip';

/**
 * Renders the ship geometry for the equipped `variant`. The single place
 * consumers branch on variant; anything unknown falls through to the standard
 * ShipModel. Used by both the galaxy `Ship` and the minigame `PlayerShip`.
 */
export function ShipVariant({variant = 'default'}: {variant?: ShipVariantId}) {
  return variant === 'interceptor' ? <InterceptorShip /> : <ShipModel />;
}
