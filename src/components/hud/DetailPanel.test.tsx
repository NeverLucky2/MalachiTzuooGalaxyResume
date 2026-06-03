import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
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
});
