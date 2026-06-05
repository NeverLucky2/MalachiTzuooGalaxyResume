import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {renderHook, act} from '@testing-library/react';
import {useGalaxyControls} from './useGalaxyControls';
import {createMotionState} from '@/lib/motion';
import {initialNav} from '@/lib/navigation';

function press(key: string, opts: KeyboardEventInit = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', {key, ...opts}));
}

describe('useGalaxyControls — keyboard mapping', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let motion: ReturnType<typeof createMotionState>;

  beforeEach(() => {
    dispatch = vi.fn();
    motion = createMotionState();
  });
  afterEach(() => vi.clearAllMocks());

  it('ArrowRight / d dispatch next', () => {
    renderHook(() => useGalaxyControls({nav: initialNav(), dispatch, motion}));
    act(() => press('ArrowRight'));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type: 'next'}));
    act(() => press('d'));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type: 'next'}));
  });

  it('ArrowLeft / a dispatch prev', () => {
    renderHook(() => useGalaxyControls({nav: initialNav(), dispatch, motion}));
    act(() => press('ArrowLeft'));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type: 'prev'}));
    act(() => press('a'));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type: 'prev'}));
  });

  it('Enter / Space / ArrowUp dispatch land', () => {
    renderHook(() => useGalaxyControls({nav: initialNav(), dispatch, motion}));
    act(() => press('Enter'));
    act(() => press(' '));
    act(() => press('ArrowUp'));
    expect(dispatch.mock.calls.filter((c) => c[0].type === 'land')).toHaveLength(3);
  });

  it('v / V dispatch cyclePreset', () => {
    renderHook(() => useGalaxyControls({nav: initialNav(), dispatch, motion}));
    act(() => press('v'));
    expect(dispatch).toHaveBeenCalledWith({type: 'cyclePreset'});
  });

  it('while landed: Escape / ArrowDown dispatch takeOff and others are ignored', () => {
    const nav = {...initialNav(), landed: true};
    renderHook(() => useGalaxyControls({nav, dispatch, motion}));
    act(() => press('Escape'));
    act(() => press('ArrowDown'));
    expect(dispatch.mock.calls.filter((c) => c[0].type === 'takeOff')).toHaveLength(2);
    // navigation keys ignored while landed
    act(() => press('ArrowRight'));
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({type: 'next'}));
  });

  it('Shift sets motion.shiftHeld true on down, false on up/blur', () => {
    renderHook(() => useGalaxyControls({nav: initialNav(), dispatch, motion}));
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Shift'})));
    expect(motion.shiftHeld).toBe(true);
    act(() => window.dispatchEvent(new KeyboardEvent('keyup', {key: 'Shift'})));
    expect(motion.shiftHeld).toBe(false);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Shift'})));
    expect(motion.shiftHeld).toBe(true);
    act(() => window.dispatchEvent(new Event('blur')));
    expect(motion.shiftHeld).toBe(false);
  });
});

describe('useGalaxyControls — onSelect (click-to-fly) handler', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let motion: ReturnType<typeof createMotionState>;
  beforeEach(() => {
    dispatch = vi.fn();
    motion = createMotionState();
  });

  it('TOP-DOWN: selecting any planet → selectAndLand', () => {
    const nav = {...initialNav(), preset: 'TOP-DOWN' as const};
    const {result} = renderHook(() => useGalaxyControls({nav, dispatch, motion}));
    act(() => result.current.onSelect(3));
    expect(dispatch).toHaveBeenCalledWith({type: 'selectAndLand', index: 3});
  });

  it('non-top-down, selecting current planet → land', () => {
    const nav = {...initialNav(), current: 2};
    const {result} = renderHook(() => useGalaxyControls({nav, dispatch, motion}));
    act(() => result.current.onSelect(2));
    expect(dispatch).toHaveBeenCalledWith({type: 'land'});
  });

  it('non-top-down, selecting a different planet → goTo', () => {
    const nav = {...initialNav(), current: 2};
    const {result} = renderHook(() => useGalaxyControls({nav, dispatch, motion}));
    act(() => result.current.onSelect(4));
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({type: 'goTo', index: 4}));
  });

  it('landed → onSelect ignored', () => {
    const nav = {...initialNav(), landed: true};
    const {result} = renderHook(() => useGalaxyControls({nav, dispatch, motion}));
    act(() => result.current.onSelect(1));
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('compact: selecting any planet → selectAndLand', () => {
    const nav = {...initialNav(), current: 1};
    const {result} = renderHook(() =>
      useGalaxyControls({nav, dispatch, motion, compact: true}),
    );
    act(() => result.current.onSelect(4));
    expect(dispatch).toHaveBeenCalledWith({type: 'selectAndLand', index: 4});
  });
});

describe('useGalaxyControls — free-look drag', () => {
  let dispatch: ReturnType<typeof vi.fn>;
  let motion: ReturnType<typeof createMotionState>;
  beforeEach(() => {
    dispatch = vi.fn();
    motion = createMotionState();
  });

  // jsdom lacks a PointerEvent constructor; MouseEvent carries clientX/clientY and
  // the listeners only read those, so it stands in for pointer events here.
  const move = (clientX: number, clientY: number) =>
    window.dispatchEvent(new MouseEvent('pointermove', {clientX, clientY}));

  it('accumulates yaw/pitch while dragging', () => {
    const {result} = renderHook(() =>
      useGalaxyControls({nav: initialNav(), dispatch, motion, compact: true}),
    );
    act(() => result.current.onPointerDown({clientX: 100, clientY: 100}));
    act(() => move(140, 130));
    expect(motion.yaw).not.toBe(0);
    expect(motion.pitch).not.toBe(0);
  });

  it('pointercancel ends the drag so later moves are ignored', () => {
    const {result} = renderHook(() =>
      useGalaxyControls({nav: initialNav(), dispatch, motion, compact: true}),
    );
    act(() => result.current.onPointerDown({clientX: 100, clientY: 100}));
    act(() => move(140, 100));
    const yaw = motion.yaw;
    act(() => window.dispatchEvent(new MouseEvent('pointercancel')));
    act(() => move(220, 100));
    expect(motion.yaw).toBe(yaw); // unchanged after cancel
  });
});
