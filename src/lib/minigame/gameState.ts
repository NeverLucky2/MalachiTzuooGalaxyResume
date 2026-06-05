import type {Difficulty} from './difficulty';

export type Phase = 'menu' | 'playing' | 'over';

export interface GameState {
  phase: Phase;
  difficulty: Difficulty;
  score: number;
  best: number;
  /** Set on the game-over that crossed an unlock threshold this run. */
  justUnlocked?: boolean;
}

export type GameAction =
  | {type: 'start'; difficulty: Difficulty}
  | {type: 'gameOver'; score: number; best: number; justUnlocked?: boolean}
  | {type: 'retry'}
  | {type: 'menu'};

export function initialGameState(best: number): GameState {
  return {phase: 'menu', difficulty: 'normal', score: 0, best};
}

export function gameReducer(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'start':
      return {...s, phase: 'playing', difficulty: a.difficulty, score: 0, justUnlocked: false};
    case 'gameOver':
      return {...s, phase: 'over', score: a.score, best: a.best, justUnlocked: a.justUnlocked ?? false};
    case 'retry':
      return {...s, phase: 'playing', score: 0, justUnlocked: false};
    case 'menu':
      return {...s, phase: 'menu', score: 0, justUnlocked: false};
  }
}
