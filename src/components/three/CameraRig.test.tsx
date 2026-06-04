import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {CameraRig} from './CameraRig';
import {createMotionState} from '@/lib/motion';
import {PLANETS} from '@/data/planets';
import {initialNav} from '@/lib/navigation';

describe('CameraRig', () => {
  it('mounts inside the canvas without throwing (renders nothing)', async () => {
    const positionsRef = {current: PLANETS.map(() => [0, 0, 0] as [number, number, number])};
    // Give the focused planet a non-zero world position so framing has a radial.
    positionsRef.current[0] = [20, 0, 0];
    const motion = createMotionState();
    const r = await ReactThreeTestRenderer.create(
      <CameraRig nav={initialNav()} positionsRef={positionsRef} motion={motion} />,
    );
    // CameraRig returns null; it drives the camera via useFrame side effects.
    expect(r.scene.children.length).toBe(0);
    // After mount, the shared look target should have advanced toward the planet
    // (settled at travelT=1 on first frame), i.e. no longer the zero vector.
    await r.advanceFrames(2, 16);
    expect(motion.lastLook.lengthSq()).toBeGreaterThan(0);
  });

  it('mounts with compact free-look (rotation path) without throwing', async () => {
    const positionsRef = {current: PLANETS.map(() => [0, 0, 0] as [number, number, number])};
    positionsRef.current[0] = [20, 0, 0];
    const motion = createMotionState();
    // Non-zero free-look so the compact rotation branch is exercised.
    motion.yaw = 0.4;
    motion.pitch = 0.25;
    const r = await ReactThreeTestRenderer.create(
      <CameraRig nav={initialNav()} positionsRef={positionsRef} motion={motion} compact />,
    );
    expect(r.scene.children.length).toBe(0);
    await r.advanceFrames(2, 16);
    expect(motion.lastLook.lengthSq()).toBeGreaterThan(0);
  });
});
