import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {SettingsMenu, SettingsControls} from './SettingsMenu';

describe('SettingsMenu (desktop)', () => {
  it('opens from the gear and exposes the ship toggle + replay', () => {
    const onToggle = vi.fn();
    const onReplay = vi.fn();
    render(<SettingsMenu shipMinigameEnabled={false} onToggleShipMinigame={onToggle} onReplayTour={onReplay} />);
    fireEvent.click(screen.getByRole('button', {name: /settings/i}));
    const toggle = screen.getByRole('switch', {name: /ship mini-game/i});
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', {name: /replay walkthrough/i}));
    expect(onReplay).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('switch', {name: /ship mini-game/i})).toBeNull();
  });

  it('closes on outside click', () => {
    render(<SettingsMenu shipMinigameEnabled={true} onToggleShipMinigame={vi.fn()} onReplayTour={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', {name: /settings/i}));
    expect(screen.getByRole('switch', {name: /ship mini-game/i})).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('switch', {name: /ship mini-game/i})).toBeNull();
  });
});

describe('SettingsControls — ship switcher', () => {
  it('hides the ship switcher until the interceptor is unlocked', () => {
    const base = {shipMinigameEnabled: true, onToggleShipMinigame: vi.fn(), onReplayTour: vi.fn()};
    render(<SettingsControls {...base} interceptorUnlocked={false} equippedShip="default" onEquipShip={vi.fn()} />);
    expect(screen.queryByRole('button', {name: /interceptor/i})).toBeNull();
  });

  it('shows the switcher when unlocked and equips on click', () => {
    const base = {shipMinigameEnabled: true, onToggleShipMinigame: vi.fn(), onReplayTour: vi.fn()};
    const onEquip = vi.fn();
    render(<SettingsControls {...base} interceptorUnlocked={true} equippedShip="default" onEquipShip={onEquip} />);
    expect(screen.getByRole('button', {name: /standard/i})).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', {name: /interceptor/i})).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', {name: /interceptor/i}));
    expect(onEquip).toHaveBeenCalledWith('interceptor');
  });
});
