import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {GameHud} from './GameHud';
import {initialGameState} from '@/lib/minigame/gameState';

describe('GameHud', () => {
  it('menu shows three difficulties and Exit; picking one calls onStart', () => {
    const onStart = vi.fn();
    render(
      <GameHud state={initialGameState(0)} onStart={onStart} onRetry={vi.fn()} onMenu={vi.fn()} onExit={vi.fn()} />,
    );
    for (const name of [/easy/i, /normal/i, /hard/i, /exit/i])
      expect(screen.getByRole('button', {name})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /hard/i}));
    expect(onStart).toHaveBeenCalledWith('hard');
  });

  it('game over shows score + best and wires Retry / Change / Exit', () => {
    const onRetry = vi.fn(), onMenu = vi.fn(), onExit = vi.fn();
    const over = {phase: 'over' as const, difficulty: 'normal' as const, score: 300, best: 500};
    render(<GameHud state={over} onStart={vi.fn()} onRetry={onRetry} onMenu={onMenu} onExit={onExit} />);
    expect(screen.getByText(/300/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /retry/i}));
    fireEvent.click(screen.getByRole('button', {name: /change difficulty/i}));
    // Two Exit buttons in the over phase (top-left round ← + card "Exit"); click the card's (last in DOM).
    fireEvent.click(screen.getAllByRole('button', {name: /exit/i}).at(-1)!);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('back button is reachable during play and calls onExit', () => {
    const onExit = vi.fn();
    const playing: import('@/lib/minigame/gameState').GameState = {
      phase: 'playing',
      difficulty: 'normal',
      score: 0,
      best: 0,
    };
    render(<GameHud state={playing} onStart={vi.fn()} onRetry={vi.fn()} onMenu={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByRole('button', {name: /exit/i}));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
