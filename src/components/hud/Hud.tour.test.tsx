import {describe, it, expect, vi} from 'vitest';
import {render} from '@testing-library/react';
import {Hud} from './Hud';
import {initialNav} from '@/lib/navigation';

describe('Hud — tour anchors', () => {
  it('tags land, fly, and menu controls for the walkthrough', () => {
    const {container} = render(<Hud nav={initialNav()} dispatch={vi.fn()} onSkip={vi.fn()} />);
    for (const t of ['land', 'fly', 'menu'])
      expect(container.querySelector(`[data-tour="${t}"]`)).not.toBeNull();
  });
});
