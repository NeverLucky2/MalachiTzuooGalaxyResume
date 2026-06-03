import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Galaxies} from './Galaxies';

describe('Galaxies', () => {
  it('mounts with children', async () => {
    const r = await ReactThreeTestRenderer.create(<Galaxies />);
    expect(r.scene.children.length).toBeGreaterThan(0);
  });
});
