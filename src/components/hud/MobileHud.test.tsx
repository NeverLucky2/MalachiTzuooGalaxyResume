import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MobileHud} from './MobileHud';
import {initialNav} from '@/lib/navigation';

describe('MobileHud', () => {
  beforeEach(() => localStorage.clear());

  it('while flying: shows the ☰ menu and the dock', () => {
    render(<MobileHud nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByRole('button', {name: /menu/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /land/i})).toBeInTheDocument();
  });

  it('while landed: hides the menu/dock and shows the detail panel TAKE OFF', () => {
    render(<MobileHud nav={{...initialNav(), landed: true}} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByRole('button', {name: /menu/i})).toBeNull();
    expect(screen.queryByRole('button', {name: /^land$/i})).toBeNull();
    expect(screen.getByRole('button', {name: /take off/i})).toBeInTheDocument();
  });
});
