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

  it('Résumé button calls onSkip', () => {
    const onSkip = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', {name: /menu/i}));
    fireEvent.click(screen.getByRole('button', {name: /résumé/i}));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
