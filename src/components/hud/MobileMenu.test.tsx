import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {MobileMenu} from './MobileMenu';
import {initialNav} from '@/lib/navigation';

describe('MobileMenu', () => {
  it('is closed until ☰ is pressed, then shows identity + sections', () => {
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByText(/MALACHI TZUOO/)).toBeNull();
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    expect(screen.getByText(/MALACHI TZUOO/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /about/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /contact/i})).toBeInTheDocument();
  });

  it('tapping a section dispatches selectAndLand', () => {
    const dispatch = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={dispatch} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    fireEvent.click(screen.getByRole('button', {name: /experience/i}));
    expect(dispatch).toHaveBeenCalledWith({type: 'selectAndLand', index: 1});
  });

  it('Resume button calls onSkip', () => {
    const onSkip = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    // The 📄 icon disambiguates the escape button from the "RESUME" starmap row.
    fireEvent.click(screen.getByRole('button', {name: /📄\s*resume/i}));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

describe('MobileMenu — settings', () => {
  it('shows the ship toggle state and fires onToggleShipMinigame', () => {
    const onToggle = vi.fn();
    render(
      <MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()}
        shipMinigameEnabled={true} onToggleShipMinigame={onToggle} onReplayTour={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    const toggle = screen.getByRole('switch', {name: /ship mini-game/i});
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('replay button fires onReplayTour', () => {
    const onReplay = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} onReplayTour={onReplay} />);
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    fireEvent.click(screen.getByRole('button', {name: /replay walkthrough/i}));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });
});
