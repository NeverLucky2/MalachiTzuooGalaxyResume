import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, act, fireEvent} from '@testing-library/react';
import {DetailPanel} from './DetailPanel';
import {initialNav} from '@/lib/navigation';
import {PLANETS} from '@/data/planets';
import {isTakeoffTipSeen} from '@/lib/prefs';

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

  it('on the RESUME planet, shows the full résumé minus About, plus the PDF download', () => {
    vi.useFakeTimers();
    try {
      const resumeIdx = PLANETS.findIndex((p) => p.id === 'resume');
      render(
        <DetailPanel
          nav={{...initialNav(), current: resumeIdx, landed: true}}
          onTakeOff={() => {}}
        />,
      );
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      // The résumé body renders other sections inside the panel...
      expect(screen.getByRole('heading', {name: /experience/i})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: /projects/i})).toBeInTheDocument();
      expect(screen.getByRole('heading', {name: /contact/i})).toBeInTheDocument();
      // ...but About is omitted (it has its own planet, so it's redundant here).
      expect(screen.queryByRole('heading', {name: /^about$/i})).toBeNull();
      // The PDF download stays available.
      expect(screen.getByRole('link', {name: /download resume/i})).toHaveAttribute(
        'href',
        '/assets/Tzuoo_Malachi_Resume_.pdf',
      );
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

describe('DetailPanel — first-land tip', () => {
  beforeEach(() => localStorage.clear());

  it('shows the take-off tip on the first landing and persists once dismissed', () => {
    render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />);
    expect(screen.getByText(/head back to space/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /got it/i}));
    expect(screen.queryByText(/head back to space/i)).toBeNull();
    expect(isTakeoffTipSeen()).toBe(true);
  });

  it('does not show the tip once it has been seen', () => {
    localStorage.setItem('galaxy.takeoff.tipSeen', '1');
    render(<DetailPanel nav={{...initialNav(), landed: true}} onTakeOff={() => {}} />);
    expect(screen.queryByText(/head back to space/i)).toBeNull();
  });
});
