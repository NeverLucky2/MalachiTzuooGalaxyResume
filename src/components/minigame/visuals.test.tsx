import {describe, it, expect} from 'vitest';
import {createRef} from 'react';
import type * as THREE from 'three';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {PlayerShip} from './PlayerShip';
import {Asteroids} from './Asteroids';
import {PLAY} from '@/lib/minigame/world';

describe('minigame visuals', () => {
  it('PlayerShip renders the ship model', async () => {
    const ref = createRef<THREE.Group>();
    const r = await ReactThreeTestRenderer.create(<PlayerShip groupRef={ref} />);
    expect(r.scene.findAllByType('Mesh').length).toBeGreaterThan(3);
  });

  it('Asteroids renders one instanced mesh sized to the pool', async () => {
    const ref = createRef<THREE.InstancedMesh>();
    const r = await ReactThreeTestRenderer.create(<Asteroids meshRef={ref} count={PLAY.poolSize} />);
    // THREE.InstancedMesh inherits type='Mesh' from Mesh, so use isInstancedMesh flag instead
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(r.scene.findAll(n => (n.instance as any)?.isInstancedMesh === true).length).toBe(1);
  });
});
