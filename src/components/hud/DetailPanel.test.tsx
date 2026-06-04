import {describe, it, expect, vi} from 'vitest';
import {render, screen, act} from '@testing-library/react';
import {DetailPanel} from './DetailPanel';
import {initialNav} from '@/lib/navigation';

describe('DetailPanel', () => {
  it('reveals content + header after the delay; TAKE OFF is immediate', () => {
    vi.useFakeTimers();
    try {
      // current 0 = ABOUT; its content includes the Chicago location card.
      render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />);
      // TAKE OFF appears right away; the text panel is hidden (aria-hidden) until
      // the reveal delay, so getByRole excludes its heading.
      expect(screen.getByRole('button', {name: /take off/i})).toBeInTheDocument();
      expect(screen.queryByRole('heading', {name: /about/i})).toBeNull();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('heading', {name: /about/i})).toBeInTheDocument();
      expect(screen.getByText(/Chicago, IL/i)).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('renders a TAKE OFF button that calls onTakeOff', () => {
    const onTakeOff = vi.fn();
    render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={onTakeOff} />);
    screen.getByRole('button', {name: /take off/i}).click();
    expect(onTakeOff).toHaveBeenCalledTimes(1);
  });

  it('compact also delays the panel until after the reveal delay', () => {
    vi.useFakeTimers();
    try {
      render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} compact />);
      expect(screen.queryByRole('heading', {name: /about/i})).toBeNull();
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('heading', {name: /about/i})).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('hides the panel again on take-off', () => {
    vi.useFakeTimers();
    try {
      const {rerender} = render(
        <DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />,
      );
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('heading', {name: /about/i})).toBeInTheDocument();

      // Take off → the panel is hidden again (aria-hidden), so getByRole excludes it.
      rerender(<DetailPanel nav={{...initialNav(), landed: false}} onTakeOff={() => {}} />);
      expect(screen.queryByRole('heading', {name: /about/i})).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
