import {describe, it, expect, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {CoachHint} from './CoachHint';

describe('CoachHint', () => {
  beforeEach(() => localStorage.clear());

  it('shows on first load', () => {
    render(<CoachHint />);
    expect(screen.getByText(/drag to look around/i)).toBeInTheDocument();
  });

  it('hides and persists after "Got it"', () => {
    render(<CoachHint />);
    fireEvent.click(screen.getByRole('button', {name: /got it/i}));
    expect(screen.queryByText(/drag to look around/i)).toBeNull();
    expect(localStorage.getItem('galaxy.coach.dismissed')).toBe('1');
  });

  it('does not show when already dismissed', () => {
    localStorage.setItem('galaxy.coach.dismissed', '1');
    render(<CoachHint />);
    expect(screen.queryByText(/drag to look around/i)).toBeNull();
  });
});
