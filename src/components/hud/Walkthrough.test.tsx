import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {Walkthrough} from './Walkthrough';
import {isTourDone} from '@/lib/prefs';

describe('Walkthrough', () => {
  beforeEach(() => localStorage.clear());

  it('starts on step 1 and advances with Next', () => {
    render(<Walkthrough compact onClose={vi.fn()} />);
    expect(screen.getByText(/land on a planet/i)).toBeInTheDocument();
    expect(screen.getByText(/step 1 of 5/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/fly between planets/i)).toBeInTheDocument();
  });

  it('Back returns to the previous step', () => {
    render(<Walkthrough compact onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', {name: /next/i}));
    fireEvent.click(screen.getByRole('button', {name: /back/i}));
    expect(screen.getByText(/land on a planet/i)).toBeInTheDocument();
  });

  it('Skip closes and persists tour-done', () => {
    const onClose = vi.fn();
    render(<Walkthrough compact onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', {name: /skip/i}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(isTourDone()).toBe(true);
  });

  it('Done on the last step persists tour-done and closes', () => {
    const onClose = vi.fn();
    render(<Walkthrough compact onClose={onClose} />);
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole('button', {name: /next/i}));
    expect(screen.getByText(/hidden mini-game/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /done/i}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(isTourDone()).toBe(true);
  });
});
