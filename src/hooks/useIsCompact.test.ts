import {describe, it, expect, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useIsCompact} from './useIsCompact';

function setEnv({coarse, width}: {coarse: boolean; width: number}) {
  Object.defineProperty(window, 'innerWidth', {value: width, configurable: true, writable: true});
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes('coarse') ? coarse : false,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe('useIsCompact', () => {
  it('true for a coarse pointer on a wide screen', () => {
    setEnv({coarse: true, width: 1280});
    const {result} = renderHook(() => useIsCompact());
    expect(result.current).toBe(true);
  });
  it('true for a narrow screen with a fine pointer', () => {
    setEnv({coarse: false, width: 500});
    const {result} = renderHook(() => useIsCompact());
    expect(result.current).toBe(true);
  });
  it('false for a wide fine-pointer desktop', () => {
    setEnv({coarse: false, width: 1280});
    const {result} = renderHook(() => useIsCompact());
    expect(result.current).toBe(false);
  });
});
