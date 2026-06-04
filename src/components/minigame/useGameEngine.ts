'use client';
import {useEffect, useRef, type RefObject} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {createWorld, PLAY} from '@/lib/minigame/world';
import {stepWorld} from '@/lib/minigame/engine';
import {DIFFICULTY, type Difficulty} from '@/lib/minigame/difficulty';
import {scoreFromDistance} from '@/lib/minigame/score';
import {makeRng} from '@/lib/minigame/rng';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _pos = new THREE.Vector3();
const _scl = new THREE.Vector3();
const HIDDEN = new THREE.Vector3(0, 0, 1e4);
const ZERO = new THREE.Vector3(0, 0, 0);
const ZERO_TARGET = {x: 0, y: 0};

/**
 * Drives the minigame each frame: steps the pure world, maps the latest pointer
 * to a play-plane target, writes the ship's transform and every asteroid
 * instance matrix, and fires `onGameOver(score, best)` exactly once on death.
 */
export function useGameEngine({
  difficulty,
  pointerRef,
  shipRef,
  asteroidsRef,
  onGameOver,
}: {
  difficulty: Difficulty;
  pointerRef: RefObject<{x: number; y: number} | null>;
  shipRef: RefObject<THREE.Group | null>;
  asteroidsRef: RefObject<THREE.InstancedMesh | null>;
  onGameOver: (score: number) => void;
}) {
  const world = useRef(createWorld());
  const rng = useRef(makeRng((Date.now() & 0xffff) || 1));
  const ended = useRef(false);

  // Fresh world whenever a new run starts (difficulty changes / remount).
  useEffect(() => {
    world.current = createWorld();
    rng.current = makeRng((Date.now() & 0xffff) || 1);
    ended.current = false;
  }, [difficulty]);

  useFrame((_, delta) => {
    const w = world.current;
    const diff = DIFFICULTY[difficulty];
    const p = pointerRef.current ?? ZERO_TARGET;
    stepWorld(w, {dt: delta, targetX: p.x * PLAY.halfW, targetY: p.y * PLAY.halfH}, diff, rng.current);

    // Ship transform: follow sim position, bank into lateral motion.
    const ship = shipRef.current;
    if (ship) {
      ship.position.set(w.shipX, w.shipY, PLAY.shipZ);
      ship.rotation.z = -w.shipX * 0.06;
      ship.rotation.x = w.shipY * 0.04;
    }

    // Asteroid instances.
    const mesh = asteroidsRef.current;
    if (mesh) {
      for (let i = 0; i < w.asteroids.length; i++) {
        const a = w.asteroids[i];
        if (a.active) {
          _pos.set(a.x, a.y, a.z);
          _e.set(a.rotX, a.rotY, a.rotZ);
          _q.setFromEuler(_e);
          _scl.setScalar(a.r);
          _m.compose(_pos, _q, _scl);
        } else {
          _m.compose(HIDDEN, _q.identity(), ZERO);
        }
        mesh.setMatrixAt(i, _m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    if (!w.alive && !ended.current) {
      ended.current = true;
      onGameOver(scoreFromDistance(w.distance));
    }
  });
}
