import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Sun} from './Sun';

describe('Sun', () => {
  it('mounts without throwing and creates a mesh', async () => {
    const r = await ReactThreeTestRenderer.create(<Sun />);
    expect(r.scene.children.length).toBeGreaterThan(0);
  });
});
