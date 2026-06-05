import {describe, it, expect, vi} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {IdentityChip} from './IdentityChip';

describe('IdentityChip', () => {
  it('is a button that opens the résumé', () => {
    const onOpen = vi.fn();
    render(<IdentityChip onOpenResume={onOpen} />);
    fireEvent.click(screen.getByRole('button', {name: /résumé|resume|malachi/i}));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('is tagged as the name walkthrough target', () => {
    const {container} = render(<IdentityChip onOpenResume={vi.fn()} />);
    expect(container.querySelector('[data-tour="name"]')).not.toBeNull();
  });
});
