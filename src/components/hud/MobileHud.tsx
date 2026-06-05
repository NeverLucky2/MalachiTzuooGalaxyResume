'use client';
import type {NavState, NavAction} from '@/lib/navigation';
import type {ShipVariantId} from '@/lib/ships';
import {IdentityChip} from './IdentityChip';
import {MobileMenu} from './MobileMenu';
import {ThumbDock} from './ThumbDock';
import {DetailPanel} from './DetailPanel';

/**
 * Compact (touch) HUD. While flying: ☰ menu + thumb dock. While
 * landed: only the shared translucent DetailPanel (planet stays visible behind).
 */
export function MobileHud({
  nav,
  dispatch,
  onSkip,
  shipMinigameEnabled = true,
  onToggleShipMinigame = () => {},
  onReplayTour = () => {},
  interceptorUnlocked = false,
  equippedShip = 'default',
  onEquipShip = () => {},
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
  shipMinigameEnabled?: boolean;
  onToggleShipMinigame?: () => void;
  onReplayTour?: () => void;
  interceptorUnlocked?: boolean;
  equippedShip?: ShipVariantId;
  onEquipShip?: (id: ShipVariantId) => void;
}) {
  return (
    <>
      {!nav.landed && (
        <>
          <IdentityChip onOpenResume={onSkip} />
          <MobileMenu nav={nav} dispatch={dispatch} onSkip={onSkip} shipMinigameEnabled={shipMinigameEnabled} onToggleShipMinigame={onToggleShipMinigame} onReplayTour={onReplayTour} interceptorUnlocked={interceptorUnlocked} equippedShip={equippedShip} onEquipShip={onEquipShip} />
          <ThumbDock nav={nav} dispatch={dispatch} />
        </>
      )}
      <DetailPanel nav={nav} onTakeOff={() => dispatch({type: 'takeOff'})} />
    </>
  );
}
