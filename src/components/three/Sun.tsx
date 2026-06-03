'use client';
import {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {radialCanvas} from '@/lib/procedural';

/** Sun sphere + corona sprite, ported from the prototype. */
export function Sun() {
  const coronaTex = useMemo(() => {
    const cv = radialCanvas(
      'rgba(255,240,205,0.6)',
      0.3,
      'rgba(255,185,95,.3)',
      'rgba(255,150,60,0)',
    );
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // The corona texture is created imperatively (not a JSX resource), so R3F won't
  // auto-dispose it — release the GPU texture on unmount ourselves.
  useEffect(() => () => coronaTex.dispose(), [coronaTex]);

  return (
    <group>
      {/* Sun sphere — radius 9, color 0xe3c171 */}
      <mesh>
        <sphereGeometry args={[9, 44, 44]} />
        <meshBasicMaterial color={0xe3c171} />
      </mesh>

      {/* Corona sprite — additive, no depth write, scaled 42 */}
      <sprite scale={[42, 42, 1]}>
        <spriteMaterial
          map={coronaTex}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </group>
  );
}
