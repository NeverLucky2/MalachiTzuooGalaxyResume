import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor} from '@testing-library/react';

const caps = vi.hoisted(() => ({
  value: {hasWebGL: false, reducedMotion: true, coarsePointer: false, width: 1280},
  use3D: false,
}));

vi.mock('@/lib/capabilities', () => ({
  detectCaps: () => caps.value,
  shouldUse3D: () => caps.use3D,
}));
vi.mock('@/components/three/Scene', () => ({Scene: () => <div data-testid="scene" />}));

import {GalaxyExperience} from './GalaxyExperience';

describe('GalaxyExperience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    caps.value = {hasWebGL: false, reducedMotion: true, coarsePointer: false, width: 1280};
    caps.use3D = false;
  });

  it('does NOT mount the 3D scene when capabilities say no', () => {
    render(<GalaxyExperience />);
    expect(screen.queryByTestId('scene')).toBeNull();
  });

  it('hides the Galaxy-view toggle when WebGL is unavailable', () => {
    render(<GalaxyExperience />);
    expect(screen.queryByRole('button', {name: /galaxy view/i})).toBeNull();
  });

  it('offers the Galaxy-view toggle (résumé mode) when WebGL is available but 3D is not auto-enabled', () => {
    caps.value = {hasWebGL: true, reducedMotion: true, coarsePointer: false, width: 1280};
    caps.use3D = false;
    render(<GalaxyExperience />);
    expect(screen.queryByTestId('scene')).toBeNull();
    expect(screen.getByRole('button', {name: /galaxy view/i})).toBeInTheDocument();
  });

  it('mounts the 3D scene when capabilities say yes', async () => {
    caps.value = {hasWebGL: true, reducedMotion: false, coarsePointer: false, width: 1280};
    caps.use3D = true;
    render(<GalaxyExperience />);
    // Scene is a dynamic(ssr:false) import, so it resolves on a microtask.
    await waitFor(() => expect(screen.getByTestId('scene')).toBeInTheDocument());
  });
});
