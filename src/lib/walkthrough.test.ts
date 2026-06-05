import {describe, it, expect} from 'vitest';
import {tourSteps} from './walkthrough';

describe('tourSteps', () => {
  it('has 5 steps in the fixed order with the right spotlight targets', () => {
    const steps = tourSteps(true);
    expect(steps.map((s) => s.key)).toEqual(['land', 'fly', 'menu', 'name', 'ship']);
    expect(steps.map((s) => s.target)).toEqual(['land', 'fly', 'menu', 'name', null]);
  });

  it('ship step is a centered card (no DOM target)', () => {
    expect(tourSteps(false)[4].target).toBeNull();
  });

  it('wording adapts: compact says ☰ menu, desktop says starmap', () => {
    expect(tourSteps(true)[2].body).toMatch(/menu/i);
    expect(tourSteps(false)[2].body).toMatch(/starmap/i);
  });
});
