import {describe, it, expect, beforeEach} from 'vitest';
import {
  isTourDone, setTourDone,
  isShipMinigameEnabled, setShipMinigameEnabled,
  isTakeoffTipSeen, setTakeoffTipSeen,
} from './prefs';

describe('prefs', () => {
  beforeEach(() => localStorage.clear());

  it('tour-done defaults false and round-trips', () => {
    expect(isTourDone()).toBe(false);
    setTourDone(true);
    expect(isTourDone()).toBe(true);
    expect(localStorage.getItem('galaxy.tour.done')).toBe('1');
    setTourDone(false);
    expect(isTourDone()).toBe(false);
  });

  it('ship-minigame defaults ON when absent and persists OFF', () => {
    expect(isShipMinigameEnabled()).toBe(true);
    setShipMinigameEnabled(false);
    expect(isShipMinigameEnabled()).toBe(false);
    expect(localStorage.getItem('galaxy.ship.minigame')).toBe('0');
  });

  it('takeoff-tip defaults unseen and round-trips', () => {
    expect(isTakeoffTipSeen()).toBe(false);
    setTakeoffTipSeen(true);
    expect(isTakeoffTipSeen()).toBe(true);
  });
});
