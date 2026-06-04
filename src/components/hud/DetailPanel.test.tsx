import {describe, it, expect, vi} from 'vitest';
import {render, screen, act} from '@testing-library/react';
import {DetailPanel} from './DetailPanel';
import {initialNav} from '@/lib/navigation';

describe('DetailPanel', () => {
  it('renders the current section content and header', () => {
    // current 0 = ABOUT; its content includes the Chicago location card.
    render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />);
    expect(screen.getByRole('heading', {name: /about/i})).toBeInTheDocument();
    expect(screen.getByText(/Chicago, IL/i)).toBeInTheDocument();
  });

  it('renders a TAKE OFF button that calls onTakeOff', async () => {
    const onTakeOff = vi.fn();
    render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={onTakeOff} />);
    const btn = screen.getByRole('button', {name: /take off/i});
    btn.click();
    expect(onTakeOff).toHaveBeenCalledTimes(1);
  });

  it('compact: holds the text panel back until after the zoom, but shows TAKE OFF immediately', () => {
    vi.useFakeTimers();
    try {
      render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} compact />);
      // TAKE OFF appears right away; the text heading is delayed so the zoom shows.
      expect(screen.getByRole('button', {name: /take off/i})).toBeInTheDocument();
      expect(screen.queryByRole('heading', {name: /about/i})).toBeNull();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('heading', {name: /about/i})).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
