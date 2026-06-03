import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Comets} from './Comets';

describe('Comets', () => {
  it('mounts with children', async () => {
    const r = await ReactThreeTestRenderer.create(<Comets />);
    expect(r.scene.children.length).toBeGreaterThan(0);
  });
});
