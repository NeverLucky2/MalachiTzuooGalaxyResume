import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {ShipVariant} from './ShipVariant';

describe('ShipVariant', () => {
  it('renders a ship for the default variant', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipVariant variant="default" />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });

  it('renders a ship for the interceptor variant', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipVariant variant="interceptor" />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });

  it('defaults to a ship when no variant is given', async () => {
    const r = await ReactThreeTestRenderer.create(<ShipVariant />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });
});
