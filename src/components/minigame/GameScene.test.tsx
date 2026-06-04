import {describe, it, expect, vi} from 'vitest';
import {createRef} from 'react';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {GameScene} from './GameScene';

describe('GameScene', () => {
  it('mounts and advances frames without throwing', async () => {
    const pointer = createRef<{x: number; y: number}>();
    pointer.current = {x: 0, y: 0};
    const scoreRef = {current: 0};
    const r = await ReactThreeTestRenderer.create(
      <GameScene difficulty="normal" pointerRef={pointer} scoreRef={scoreRef} onGameOver={vi.fn()} />,
    );
    await r.advanceFrames(5, 1 / 60);
    expect(r.scene.findAll((n) => n.instance?.isInstancedMesh === true).length).toBe(1);
  });
});
