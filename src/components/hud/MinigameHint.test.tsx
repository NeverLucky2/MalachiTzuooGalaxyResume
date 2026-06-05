import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen, fireEvent, act} from '@testing-library/react';
import {MinigameHint} from './MinigameHint';

describe('MinigameHint', () => {
  afterEach(() => vi.useRealTimers());

  it('reveals the ship hint after the delay', () => {
    vi.useFakeTimers();
    try {
      render(<MinigameHint onDismiss={() => {}} />);
      const wrap = screen.getByText(/hidden mini-game/i).closest('[aria-hidden]')!;
      expect(wrap).toHaveAttribute('aria-hidden', 'true');
      act(() => {
        vi.advanceTimersByTime(7000);
      });
      expect(wrap).toHaveAttribute('aria-hidden', 'false');
    } finally {
      vi.useRealTimers();
    }
  });

  it('dismiss calls onDismiss', () => {
    vi.useFakeTimers();
    try {
      const onDismiss = vi.fn();
      render(<MinigameHint onDismiss={onDismiss} />);
      // Reveal first — before that the hint is aria-hidden (not in the a11y tree).
      act(() => {
        vi.advanceTimersByTime(7000);
      });
      fireEvent.click(screen.getByRole('button', {name: /dismiss hint/i}));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
