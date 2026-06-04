import {describe, it, expect, vi, afterEach} from 'vitest';
import {render, screen} from '@testing-library/react';
import {LiveScore} from './LiveScore';

describe('LiveScore', () => {
  afterEach(() => vi.restoreAllMocks());

  it('imperatively shows the latest score from the ref', () => {
    // Drive a single rAF tick synchronously, then no-op (avoid infinite recursion).
    let fired = false;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      if (!fired) {
        fired = true;
        cb(0);
      }
      return 0;
    });
    const scoreRef = {current: 256};
    render(<LiveScore scoreRef={scoreRef} />);
    expect(screen.getByText('256')).toBeInTheDocument();
  });
});
