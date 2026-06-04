import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {ShipModel} from './ShipModel';

describe('ShipModel', () => {
  it('renders the ship parts (several meshes)', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipModel />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });
});
