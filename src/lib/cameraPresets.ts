import type {PresetName} from '@/data/types';

type Vec = [number, number, number];
interface PresetDef {r:number; t:number; u:number; dm:number; da:number; ship:number; top?:boolean}

export const PRESETS: Record<PresetName, PresetDef> = {
  'SUN LEFT': {r:0.5,  t:0.62, u:0.32, dm:5.0, da:36, ship:0.8},
  'LIT FACE': {r:-0.7, t:0.55, u:0.4,  dm:2.7, da:10, ship:0.42},
  'TOP-DOWN': {r:0,    t:0,    u:0,     dm:0,   da:0,  ship:1.6, top:true},
};
export const PRESET_ORDER: PresetName[] = ['SUN LEFT','LIT FACE','TOP-DOWN'];
const TOPH = 240;
const norm = (v:Vec):Vec => {const l=Math.hypot(...v)||1; return [v[0]/l,v[1]/l,v[2]/l];};

/** Camera pos + look target for a planet at world position P (XZ-plane orbit). */
export function framing(P: Vec, size: number, preset: PresetName, landed: boolean): {pos: Vec; look: Vec} {
  const rl = Math.hypot(P[0],0,P[2]) || 1;
  const r:Vec = [P[0]/rl, 0, P[2]/rl];        // radial (outward)
  const t:Vec = [-r[2], 0, r[0]];             // tangent
  const up:Vec = [0,1,0];
  if (landed) {
    const lp = PRESETS[preset].top ? PRESETS['SUN LEFT'] : PRESETS[preset];
    const d = norm([r[0]*lp.r + t[0]*lp.t + up[0]*lp.u, r[1]*lp.r + t[1]*lp.t + up[1]*lp.u, r[2]*lp.r + t[2]*lp.t + up[2]*lp.u]);
    const dist = size*2.3;
    return {pos:[P[0]+d[0]*dist, P[1]+d[1]*dist, P[2]+d[2]*dist], look:[...P]};
  }
  const pr = PRESETS[preset];
  if (pr.top) return {pos:[P[0]*0.2, TOPH, P[2]*0.2], look:[0,0,0]};
  const d = norm([r[0]*pr.r + t[0]*pr.t + up[0]*pr.u, r[1]*pr.r + t[1]*pr.t + up[1]*pr.u, r[2]*pr.r + t[2]*pr.t + up[2]*pr.u]);
  const dist = size*pr.dm + pr.da;
  return {pos:[P[0]+d[0]*dist, P[1]+d[1]*dist, P[2]+d[2]*dist], look:[...P]};
}
