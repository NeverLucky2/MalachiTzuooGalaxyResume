import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, waitFor, fireEvent} from '@testing-library/react';

const caps = vi.hoisted(() => ({
  value: {hasWebGL: false, reducedMotion: true, coarsePointer: false, width: 1280},
  use3D: false,
}));

vi.mock('@/lib/capabilities', () => ({
  detectCaps: () => caps.value,
  shouldUse3D: () => caps.use3D,
}));
// Stub Scene with a working "skip to resume" button so we can exercise the skip
// flow + focus management without mounting the real 3D canvas.
vi.mock('@/components/three/Scene', () => ({
  Scene: ({onSkip, onLaunchMinigame}: {onSkip: () => void; onLaunchMinigame?: () => void}) => (
    <div data-testid="scene">
      <button type="button" onClick={onSkip}>
        📄 RESUME VIEW
      </button>
      <button type="button" onClick={onLaunchMinigame}>
        launch minigame
      </button>
    </div>
  ),
}));

vi.mock('@/components/minigame/AsteroidGame', () => ({
  AsteroidGame: ({onExit}: {onExit: () => void}) => (
    <button type="button" onClick={onExit}>exit minigame</button>
  ),
}));

import {GalaxyExperience} from './GalaxyExperience';
import {FallbackResume} from './fallback/FallbackResume';

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

  it('offers the Galaxy-view toggle (resume mode) when WebGL is available but 3D is not auto-enabled', () => {
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

  it('opens the minigame overlay on launch and closes it on exit', async () => {
    caps.value = {hasWebGL: true, reducedMotion: false, coarsePointer: false, width: 1280};
    caps.use3D = true;
    render(<GalaxyExperience />);
    const launch = await screen.findByRole('button', {name: /launch minigame/i});
    fireEvent.click(launch);
    expect(screen.getByRole('button', {name: /exit minigame/i})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: /exit minigame/i}));
    expect(screen.queryByRole('button', {name: /exit minigame/i})).toBeNull();
  });

  it('skip-to-resume switches to the 2D view and focuses its heading', async () => {
    caps.value = {hasWebGL: true, reducedMotion: false, coarsePointer: false, width: 1280};
    caps.use3D = true;
    // rAF runs the focus callback; drive it deterministically.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    // The page renders the SSR resume (with the focus target heading) alongside.
    render(
      <>
        <FallbackResume />
        <GalaxyExperience />
      </>,
    );
    const skip = await screen.findByRole('button', {name: /resume view/i});
    skip.click();
    await waitFor(() => expect(screen.queryByTestId('scene')).toBeNull());
    const heading = screen.getByRole('heading', {name: /malachi tzuoo/i});
    expect(heading).toHaveFocus();
    vi.restoreAllMocks();
  });
});
