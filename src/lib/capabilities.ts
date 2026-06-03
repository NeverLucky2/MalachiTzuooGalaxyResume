export interface Caps {hasWebGL:boolean; reducedMotion:boolean; coarsePointer:boolean; width:number}

export function shouldUse3D(c: Caps): boolean {
  if (!c.hasWebGL) return false;
  if (c.reducedMotion) return false;
  if (c.coarsePointer && c.width < 820) return false;
  return true;
}

export function detectCaps(): Caps {
  if (typeof window === 'undefined') return {hasWebGL:false, reducedMotion:false, coarsePointer:false, width:0};
  let hasWebGL = false;
  try {
    const c = document.createElement('canvas');
    hasWebGL = !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {hasWebGL = false;}
  return {
    hasWebGL,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarsePointer: window.matchMedia('(pointer: coarse)').matches,
    width: window.innerWidth,
  };
}
