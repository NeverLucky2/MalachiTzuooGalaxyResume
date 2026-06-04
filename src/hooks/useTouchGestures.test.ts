import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useTouchGestures} from './useTouchGestures';
import {initialNav} from '@/lib/navigation';

// jsdom's PointerEvent doesn't carry clientX/Y reliably; attach them to a plain Event.
function up(x: number, y: number) {
  const e = new Event('pointerup');
  Object.assign(e, {clientX: x, clientY: y});
  window.dispatchEvent(e);
}

describe('useTouchGestures', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  beforeEach(() => {dispatch = vi.fn();});
  afterEach(() => vi.clearAllMocks());

  it('fast left flick (not landed) → next', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 200, clientY: 100}); up(100, 105);});
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type: 'next'}));
  });

  it('fast up flick (not landed) → land', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 100, clientY: 300}); up(105, 200);});
    expect(dispatch).toHaveBeenCalledWith({type: 'land'});
  });

  it('while landed: down flick → takeOff and travel flicks are ignored', () => {
    const nav = {...initialNav(), landed: true};
    const {result} = renderHook(() => useTouchGestures({nav, dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 100, clientY: 100}); up(105, 220);});
    expect(dispatch).toHaveBeenCalledWith({type: 'takeOff'});
    dispatch.mockClear();
    act(() => {result.current.onPointerDown({clientX: 200, clientY: 100}); up(100, 105);});
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('small/slow move → look (no dispatch)', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: true}));
    act(() => {result.current.onPointerDown({clientX: 100, clientY: 100}); up(108, 104);});
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('disabled → never dispatches', () => {
    const {result} = renderHook(() => useTouchGestures({nav: initialNav(), dispatch, enabled: false}));
    act(() => {result.current.onPointerDown({clientX: 200, clientY: 100}); up(100, 105);});
    expect(dispatch).not.toHaveBeenCalled();
  });
});
