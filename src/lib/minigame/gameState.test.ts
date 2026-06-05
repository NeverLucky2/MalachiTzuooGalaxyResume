import {describe, it, expect} from 'vitest';
import {initialGameState, gameReducer} from './gameState';

describe('gameReducer', () => {
  it('starts at the menu with the supplied best', () => {
    expect(initialGameState(250)).toEqual({phase: 'menu', difficulty: 'normal', score: 0, best: 250});
  });

  it('start → playing with the chosen difficulty and reset score', () => {
    const s = gameReducer(initialGameState(0), {type: 'start', difficulty: 'hard'});
    expect(s.phase).toBe('playing');
    expect(s.difficulty).toBe('hard');
    expect(s.score).toBe(0);
  });

  it('gameOver → over with final score and best', () => {
    const playing = gameReducer(initialGameState(0), {type: 'start', difficulty: 'easy'});
    const s = gameReducer(playing, {type: 'gameOver', score: 420, best: 420});
    expect(s).toMatchObject({phase: 'over', score: 420, best: 420, difficulty: 'easy'});
  });

  it('retry → playing again at the same difficulty', () => {
    const over = gameReducer(
      gameReducer(initialGameState(0), {type: 'start', difficulty: 'hard'}),
      {type: 'gameOver', score: 10, best: 10},
    );
    const s = gameReducer(over, {type: 'retry'});
    expect(s).toMatchObject({phase: 'playing', difficulty: 'hard', score: 0});
  });

  it('menu → back to the menu', () => {
    const over = gameReducer(initialGameState(5), {type: 'gameOver', score: 3, best: 5});
    expect(gameReducer(over, {type: 'menu'}).phase).toBe('menu');
  });
});

describe('gameState — justUnlocked', () => {
  it('gameOver carries justUnlocked through; start/retry/menu reset it', () => {
    const playing = gameReducer(initialGameState(0), {type: 'start', difficulty: 'easy'});
    const over = gameReducer(playing, {type: 'gameOver', score: 1200, best: 1200, justUnlocked: true});
    expect(over.justUnlocked).toBe(true);
    expect(gameReducer(over, {type: 'retry'}).justUnlocked).toBe(false);
    expect(gameReducer(over, {type: 'menu'}).justUnlocked).toBe(false);
    expect(gameReducer(over, {type: 'start', difficulty: 'hard'}).justUnlocked).toBe(false);
  });

  it('gameOver without justUnlocked defaults to false', () => {
    const over = gameReducer(initialGameState(0), {type: 'gameOver', score: 300, best: 300});
    expect(over.justUnlocked).toBe(false);
  });
});
