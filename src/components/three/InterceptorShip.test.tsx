// src/components/three/InterceptorShip.test.tsx
import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {InterceptorShip} from './InterceptorShip';

describe('InterceptorShip', () => {
  it('renders the ship parts (several meshes)', async () => {
    const r = await ReactThreeTestRenderer.create(<InterceptorShip />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });
});
