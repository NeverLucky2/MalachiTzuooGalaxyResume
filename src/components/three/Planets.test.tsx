import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Planets} from './Planets';
import {PLANETS} from '@/data/planets';

describe('Planets', () => {
  it('mounts one group per planet', async () => {
    const positions = {current: PLANETS.map(() => [0, 0, 0] as [number, number, number])};
    const r = await ReactThreeTestRenderer.create(<Planets current={0} positionsRef={positions} />);
    expect(r.scene.children.length).toBeGreaterThanOrEqual(PLANETS.length);
  });
});
