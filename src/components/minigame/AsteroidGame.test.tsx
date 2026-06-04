import {describe, it, expect, vi} from 'vitest';
import type {ReactNode} from 'react';
import {render, screen, fireEvent} from '@testing-library/react';

// The 3D Canvas/scene needs WebGL; stub it so we can test the shell + state machine in jsdom.
vi.mock('@react-three/fiber', () => ({Canvas: ({children}: {children: ReactNode}) => <div data-testid="canvas">{children}</div>}));
vi.mock('./GameScene', () => ({GameScene: () => null}));

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
