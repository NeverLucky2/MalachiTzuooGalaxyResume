'use client';
import {useReducer, useRef, useEffect, useCallback} from 'react';
import {Canvas} from '@react-three/fiber';
import {gameReducer, initialGameState} from '@/lib/minigame/gameState';
import {loadBest, saveBest} from '@/lib/minigame/score';
import type {Difficulty} from '@/lib/minigame/difficulty';
import {GameScene} from './GameScene';
import {GameHud} from './GameHud';

/**
 * Full-screen minigame overlay. Owns the game state machine, tracks the pointer
 * as normalized [-1,1] coords for the engine, persists the best score, and
 * renders its own R3F Canvas (angled 3/4 camera) plus the DOM HUD. `onExit`
 * returns to the galaxy.
 */
export function AsteroidGame({onExit}: {onExit: () => void}) {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => initialGameState(loadBest()));
  const pointerRef = useRef<{x: number; y: number}>({x: 0, y: 0});
  const containerRef = useRef<HTMLDivElement>(null);

  // Esc exits from anywhere in the game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  // Map a client point to normalized [-1,1] play coords (y up).
  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pointerRef.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerRef.current.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  }, []);

  const onStart = (d: Difficulty) => dispatch({type: 'start', difficulty: d});
  const onGameOver = useCallback((score: number) => {
    dispatch({type: 'gameOver', score, best: saveBest(score)});
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 touch-none bg-[#04030c]"
      onPointerMove={(e) => updatePointer(e.clientX, e.clientY)}
      onPointerDown={(e) => updatePointer(e.clientX, e.clientY)}
    >
      <Canvas camera={{position: [6.5, 4.5, 14], fov: 60, near: 0.1, far: 400}} dpr={[1, 2]} gl={{antialias: true}}>
        {state.phase === 'playing' && (
          <GameScene difficulty={state.difficulty} pointerRef={pointerRef} onGameOver={onGameOver} />
        )}
      </Canvas>

      <GameHud
        state={state}
        onStart={onStart}
        onRetry={() => dispatch({type: 'retry'})}
        onMenu={() => dispatch({type: 'menu'})}
        onExit={onExit}
      />
    </div>
  );
}
