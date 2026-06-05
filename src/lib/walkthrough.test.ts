import {describe, it, expect} from 'vitest';
import {tourSteps} from './walkthrough';

describe('tourSteps', () => {
  it('has 6 steps in the fixed order with the right spotlight targets', () => {
    const steps = tourSteps(true);
    expect(steps.map((s) => s.key)).toEqual(['land', 'fly', 'camera', 'menu', 'name', 'ship']);
    expect(steps.map((s) => s.target)).toEqual(['land', 'fly', 'camera', 'menu', 'name', null]);
  });

  it('ship step is a centered card (no DOM target)', () => {
    expect(tourSteps(false)[5].target).toBeNull();
  });

  it('wording adapts: compact says ☰ menu, desktop says starmap', () => {
    expect(tourSteps(true)[3].body).toMatch(/menu/i);
    expect(tourSteps(false)[3].body).toMatch(/starmap/i);
  });

  it('the camera step comes right after fly and explains the angle/recenter button', () => {
    expect(tourSteps(true)[2].key).toBe('camera');
    expect(tourSteps(true)[2].body).toMatch(/angle|camera|re-?center/i);
  });
});
