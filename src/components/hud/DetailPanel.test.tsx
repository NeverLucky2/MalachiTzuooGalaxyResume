import {describe, it, expect, vi} from 'vitest';
import {render, screen, act} from '@testing-library/react';
import {DetailPanel} from './DetailPanel';
import {initialNav} from '@/lib/navigation';

describe('DetailPanel', () => {
  it('shows content + header after the reveal delay; TAKE OFF is immediate', () => {
    vi.useFakeTimers();
    try {
      // current 0 = ABOUT; its content includes the Chicago location card.
      render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />);
      // TAKE OFF appears right away; the text panel is delayed so the zoom shows.
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

  it('fades out on take-off, then unmounts after the fade', () => {
    vi.useFakeTimers();
    try {
      const {rerender} = render(
        <DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />,
      );
      act(() => {
        vi.advanceTimersByTime(1000); // reveal
      });
      expect(screen.getByRole('heading', {name: /about/i})).toBeInTheDocument();

      // Take off: the panel lingers during the fade-out...
      rerender(<DetailPanel nav={{...initialNav(), landed: false}} onTakeOff={() => {}} />);
      expect(screen.getByRole('heading', {name: /about/i})).toBeInTheDocument();

      // ...then unmounts once the fade completes.
      act(() => {
        vi.advanceTimersByTime(400); // > TAKE_OFF_FADE_MS (300)
      });
      expect(screen.queryByRole('heading', {name: /about/i})).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
