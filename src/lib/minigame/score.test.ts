import {describe, it, expect, beforeEach} from 'vitest';
import {scoreFromDistance, loadBest, saveBest} from './score';

describe('score', () => {
  beforeEach(() => localStorage.clear());

  it('scoreFromDistance floors distance to an integer', () => {
    expect(scoreFromDistance(123.9)).toBe(123);
    expect(scoreFromDistance(0)).toBe(0);
  });

  it('best starts at 0 when nothing is stored', () => {
    expect(loadBest()).toBe(0);
  });

  it('saveBest keeps the maximum and persists it', () => {
    expect(saveBest(100)).toBe(100);
    expect(saveBest(40)).toBe(100); // does not regress
    expect(loadBest()).toBe(100);
  });

  it('swallows storage failures without throwing', () => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
    try {
      expect(() => saveBest(999)).not.toThrow();
    } finally {
      Storage.prototype.setItem = orig;
    }
  });
});
