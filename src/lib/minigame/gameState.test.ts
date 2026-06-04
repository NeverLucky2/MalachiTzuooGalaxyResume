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
