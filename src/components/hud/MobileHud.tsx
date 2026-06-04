'use client';
import type {NavState, NavAction} from '@/lib/navigation';
import {MobileMenu} from './MobileMenu';
import {ThumbDock} from './ThumbDock';
import {CoachHint} from './CoachHint';
import {DetailPanel} from './DetailPanel';

/**
 * Compact (touch) HUD. While flying: ☰ menu + thumb dock + coach hint. While
 * landed: only the shared translucent DetailPanel (planet stays visible behind).
 */
export function MobileHud({
  nav,
  dispatch,
  onSkip,
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
}) {
  return (
    <>
      {!nav.landed && (
        <>
          <MobileMenu nav={nav} dispatch={dispatch} onSkip={onSkip} />
          <ThumbDock nav={nav} dispatch={dispatch} />
          <CoachHint />
        </>
      )}
      <DetailPanel nav={nav} onTakeOff={() => dispatch({type: 'takeOff'})} compact />
    </>
  );
}
