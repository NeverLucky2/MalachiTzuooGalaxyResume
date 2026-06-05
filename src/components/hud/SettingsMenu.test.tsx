import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {SettingsMenu} from './SettingsMenu';

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
  });
});
