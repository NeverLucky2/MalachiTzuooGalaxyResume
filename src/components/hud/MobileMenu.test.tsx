import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MobileMenu} from './MobileMenu';
import {initialNav} from '@/lib/navigation';

describe('MobileMenu', () => {
  it('is closed until ☰ is pressed, then shows identity + sections', () => {
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByText(/MALACHI TZUOO/)).toBeNull();
    screen.getByRole('button', {name: /menu/i}).click();
    expect(screen.getByText(/MALACHI TZUOO/)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /about/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /contact/i})).toBeInTheDocument();
  });

  it('tapping a section dispatches selectAndLand', () => {
    const dispatch = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={dispatch} onSkip={vi.fn()} />);
    screen.getByRole('button', {name: /menu/i}).click();
    screen.getByRole('button', {name: /experience/i}).click();
    expect(dispatch).toHaveBeenCalledWith({type: 'selectAndLand', index: 1});
  });

  it('Résumé button calls onSkip', () => {
    const onSkip = vi.fn();
    render(<MobileMenu nav={initialNav()} dispatch={vi.fn()} onSkip={onSkip} />);
    screen.getByRole('button', {name: /menu/i}).click();
    screen.getByRole('button', {name: /résumé/i}).click();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
