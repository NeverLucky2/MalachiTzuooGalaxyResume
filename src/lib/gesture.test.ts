import {describe, it, expect} from 'vitest';
import {classifyGesture, MIN_FLICK_DISTANCE, MAX_FLICK_MS} from './gesture';

describe('classifyGesture', () => {
  it('fast left flick → next', () => expect(classifyGesture(-80, 5, 150)).toBe('next'));
  it('fast right flick → prev', () => expect(classifyGesture(80, -5, 150)).toBe('prev'));
  it('fast up flick → land', () => expect(classifyGesture(5, -80, 150)).toBe('land'));
  it('fast down flick → takeOff', () => expect(classifyGesture(-5, 80, 150)).toBe('takeOff'));
  it('too slow → look', () => expect(classifyGesture(-80, 0, MAX_FLICK_MS + 50)).toBe('look'));
  it('too small → look', () => expect(classifyGesture(MIN_FLICK_DISTANCE - 1, 0, 100)).toBe('look'));
  it('diagonal resolves to dominant horizontal', () => expect(classifyGesture(-90, 50, 150)).toBe('next'));
  it('diagonal resolves to dominant vertical', () => expect(classifyGesture(20, -90, 150)).toBe('land'));
});
