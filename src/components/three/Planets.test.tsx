import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Planets} from './Planets';
import {PLANETS} from '@/data/planets';

type Positions = {current: [number, number, number][]};
const makePositions = (): Positions => ({
  current: PLANETS.map(() => [0, 0, 0] as [number, number, number]),
});

describe('Planets', () => {
  it('mounts one group per planet', async () => {
    const positions = makePositions();
    const r = await ReactThreeTestRenderer.create(<Planets current={0} positionsRef={positions} />);
    expect(r.scene.children.length).toBeGreaterThanOrEqual(PLANETS.length);
  });

  it('reduced-motion damps idle orbital drift (a non-focused planet moves less)', async () => {
    // Measure how far an outer (non-current) planet drifts over the same number
    // of frames with and without reduced motion. Index 5 is never `current`.
    const idx = 5;
    const startAng = idx * 1.1;
    const startPos: [number, number, number] = [
      Math.cos(startAng) * PLANETS[idx].orbitRadius,
      0,
      Math.sin(startAng) * PLANETS[idx].orbitRadius,
    ];
    const delta = (positions: Positions) => {
      const [x, , z] = positions.current[idx];
      return Math.hypot(x - startPos[0], z - startPos[2]);
    };

    const normalPos = makePositions();
    const normal = await ReactThreeTestRenderer.create(
      <Planets current={0} positionsRef={normalPos} />,
    );
    await normal.advanceFrames(30, 1 / 60);

    const reducedPos = makePositions();
    const reduced = await ReactThreeTestRenderer.create(
      <Planets current={0} positionsRef={reducedPos} reducedMotion />,
    );
    await reduced.advanceFrames(30, 1 / 60);

    expect(delta(reducedPos)).toBeGreaterThan(0); // still drifts a little
    expect(delta(reducedPos)).toBeLessThan(delta(normalPos) * 0.5); // but much less
  });
});
