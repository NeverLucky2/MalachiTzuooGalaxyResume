import {describe, it, expect, vi, beforeEach} from 'vitest';
import type {ReactNode} from 'react';
import {render, screen, fireEvent} from '@testing-library/react';

// The 3D Canvas/scene needs WebGL; stub it so we can test the shell + state machine in jsdom.
vi.mock('@react-three/fiber', () => ({Canvas: ({children}: {children: ReactNode}) => <div data-testid="canvas">{children}</div>}));

const ctrl = vi.hoisted(() => ({score: 0}));
vi.mock('./GameScene', () => ({
  // Exposes a button that ends the run with the controlled score, so we can drive
  // the game-over/unlock path in jsdom without the real engine.
  GameScene: ({onGameOver}: {onGameOver: (s: number) => void}) => (
    <button type="button" onClick={() => onGameOver(ctrl.score)}>__end_run</button>
  ),
}));

import {AsteroidGame} from './AsteroidGame';

describe('AsteroidGame', () => {
  it('starts at the menu and Exit calls onExit', () => {
    const onExit = vi.fn();
    render(<AsteroidGame onExit={onExit} />);
    expect(screen.getByRole('button', {name: /normal/i})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /exit game/i}));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('menu → playing hides the difficulty buttons on start', () => {
    render(<AsteroidGame onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', {name: /normal/i}));
    expect(screen.queryByRole('button', {name: /^hard$/i})).toBeNull();
  });

  it('Escape exits', () => {
    const onExit = vi.fn();
    render(<AsteroidGame onExit={onExit} />);
    fireEvent.keyDown(window, {key: 'Escape'});
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

describe('AsteroidGame — interceptor unlock', () => {
  beforeEach(() => localStorage.clear());

  it('crossing 1000 auto-equips + celebrates', () => {
    ctrl.score = 1200;
    const onUnlock = vi.fn();
    render(<AsteroidGame onExit={vi.fn()} onUnlockInterceptor={onUnlock} />);
    fireEvent.click(screen.getByRole('button', {name: /normal/i}));   // → playing
    fireEvent.click(screen.getByRole('button', {name: /__end_run/i})); // → over
    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/interceptor unlocked — equipped/i)).toBeInTheDocument();
  });

  it('a sub-1000 run does not unlock', () => {
    ctrl.score = 400;
    const onUnlock = vi.fn();
    render(<AsteroidGame onExit={vi.fn()} onUnlockInterceptor={onUnlock} />);
    fireEvent.click(screen.getByRole('button', {name: /normal/i}));
    fireEvent.click(screen.getByRole('button', {name: /__end_run/i}));
    expect(onUnlock).not.toHaveBeenCalled();
    expect(screen.queryByText(/unlocked — equipped/i)).toBeNull();
  });
});
