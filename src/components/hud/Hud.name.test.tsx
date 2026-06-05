import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {Hud} from './Hud';
import {initialNav} from '@/lib/navigation';

describe('Hud — name tag', () => {
  it('clicking the name opens the résumé view', () => {
    const onSkip = vi.fn();
    render(<Hud nav={initialNav()} dispatch={vi.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByRole('button', {name: /malachi tzuoo/i}));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});
