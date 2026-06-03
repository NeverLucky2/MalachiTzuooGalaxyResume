import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';

vi.mock('@/lib/capabilities', () => ({
  detectCaps: () => ({hasWebGL:false, reducedMotion:true, coarsePointer:false, width:1280}),
  shouldUse3D: () => false,
}));
vi.mock('@/components/three/Scene', () => ({Scene: () => <div data-testid="scene" />}));

import {GalaxyExperience} from './GalaxyExperience';

describe('GalaxyExperience', () => {
  beforeEach(() => vi.clearAllMocks());
  it('does NOT mount the 3D scene when capabilities say no', async () => {
    render(<GalaxyExperience />);
    expect(screen.queryByTestId('scene')).toBeNull();
    expect(screen.getByRole('button', {name: /enter the galaxy/i})).toBeInTheDocument();
  });
});
