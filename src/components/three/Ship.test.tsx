import {describe, it, expect, vi} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Ship} from './Ship';
import {createMotionState} from '@/lib/motion';
import {PLANETS} from '@/data/planets';
import {initialNav} from '@/lib/navigation';

describe('Ship', () => {
  it('mounts with a group containing the ship parts', async () => {
    const positionsRef = {current: PLANETS.map(() => [0, 0, 0] as [number, number, number])};
    const motion = createMotionState();
    const r = await ReactThreeTestRenderer.create(
      <Ship nav={initialNav()} positionsRef={positionsRef} motion={motion} />,
    );
    expect(r.scene.children.length).toBeGreaterThan(0);
    // Hull, ring, visor, 2 wings, fin, 2 engines, halo → several meshes/sprites.
    const meshes = r.scene.findAllByType('Mesh');
    expect(meshes.length).toBeGreaterThan(3);
  });

  it('clicking the launch hit-sphere calls onLaunch and stops propagation', async () => {
    const positionsRef = {current: PLANETS.map(() => [0, 0, 0] as [number, number, number])};
    const onLaunch = vi.fn();
    const r = await ReactThreeTestRenderer.create(
      <Ship nav={initialNav()} positionsRef={positionsRef} motion={createMotionState()} onLaunch={onLaunch} />,
    );
    const hit = r.scene.findByProps({name: 'minigame-launch'});
    const stopPropagation = vi.fn();
    hit.props.onClick({stopPropagation});
    expect(onLaunch).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalled();
  });
});
