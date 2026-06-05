import {describe, it, expect, vi} from 'vitest';
import {render, screen} from '@testing-library/react';
import {ThumbDock} from './ThumbDock';
import {initialNav} from '@/lib/navigation';
import {PLANETS} from '@/data/planets';

describe('ThumbDock', () => {
  it('LAND dispatches land', () => {
    const dispatch = vi.fn();
    render(<ThumbDock nav={initialNav()} dispatch={dispatch} />);
    screen.getByRole('button', {name: /land/i}).click();
    expect(dispatch).toHaveBeenCalledWith({type: 'land'});
  });

  it('inward is disabled at the first section', () => {
    render(<ThumbDock nav={{...initialNav(), current: 0}} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', {name: /inward/i})).toBeDisabled();
  });

  it('outward is disabled at the last section and dispatches next otherwise', () => {
    const dispatch = vi.fn();
    const {rerender} = render(<ThumbDock nav={initialNav()} dispatch={dispatch} />);
    screen.getByRole('button', {name: /outward/i}).click();
    expect(dispatch).toHaveBeenCalledWith({type: 'next', n: PLANETS.length});
    rerender(<ThumbDock nav={{...initialNav(), current: PLANETS.length - 1}} dispatch={dispatch} />);
    expect(screen.getByRole('button', {name: /outward/i})).toBeDisabled();
  });

  it('camera-angle button shows the current preset and dispatches cyclePreset', () => {
    const dispatch = vi.fn();
    render(<ThumbDock nav={initialNav()} dispatch={dispatch} />);
    const cam = screen.getByRole('button', {name: /camera angle/i});
    expect(cam).toHaveTextContent(/SUN LEFT/i); // initialNav preset
    cam.click();
    expect(dispatch).toHaveBeenCalledWith({type: 'cyclePreset'});
  });
});

describe('ThumbDock — tour anchors', () => {
  it('tags the LAND and ▶ controls for the walkthrough', () => {
    const {container} = render(<ThumbDock nav={initialNav()} dispatch={vi.fn()} />);
    expect(container.querySelector('[data-tour="land"]')).not.toBeNull();
    expect(container.querySelector('[data-tour="fly"]')).not.toBeNull();
  });
});
