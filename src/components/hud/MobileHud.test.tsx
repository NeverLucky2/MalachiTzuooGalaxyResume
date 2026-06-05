import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {MobileHud} from './MobileHud';
import {initialNav} from '@/lib/navigation';

describe('MobileHud', () => {
  beforeEach(() => localStorage.clear());

  it('while flying: shows the identity chip, the ☰ menu and the dock', () => {
    const {container} = render(<MobileHud nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/malachi tzuoo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /menu/i})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /land/i})).toBeInTheDocument();
    expect(container.querySelector('[data-tour="name"]')).not.toBeNull();
    expect(container.querySelector('[data-tour="menu"]')).not.toBeNull();
  });

  it('while landed: hides the identity chip/menu/dock and shows the detail panel TAKE OFF', () => {
    render(<MobileHud nav={{...initialNav(), landed: true}} dispatch={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.queryByText(/malachi tzuoo/i)).toBeNull();
    expect(screen.queryByRole('button', {name: /menu/i})).toBeNull();
    expect(screen.queryByRole('button', {name: /^land$/i})).toBeNull();
    expect(screen.getByRole('button', {name: /take off/i})).toBeInTheDocument();
  });
});
