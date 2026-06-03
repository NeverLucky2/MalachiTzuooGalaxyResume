import {PRESET_ORDER} from './cameraPresets';
import type {PresetName} from '@/data/types';

export interface NavState {current:number; landed:boolean; preset:PresetName}
export const initialNav = (): NavState => ({current:0, landed:false, preset:'SUN LEFT'});

export type NavAction =
  | {type:'next'; n:number} | {type:'prev'; n:number}
  | {type:'goTo'; index:number; n:number}
  | {type:'land'} | {type:'takeOff'} | {type:'cyclePreset'}
  | {type:'selectAndLand'; index:number};

export function navReducer(s: NavState, a: NavAction): NavState {
  switch (a.type) {
    case 'next': return s.landed ? s : {...s, current: Math.min(a.n-1, s.current+1)};
    case 'prev': return s.landed ? s : {...s, current: Math.max(0, s.current-1)};
    case 'goTo': return s.landed ? s : {...s, current: Math.max(0, Math.min(a.n-1, a.index))};
    case 'land': return {...s, landed:true};
    case 'takeOff': return {...s, landed:false};
    case 'cyclePreset': {
      const i = PRESET_ORDER.indexOf(s.preset);
      return {...s, preset: PRESET_ORDER[(i+1)%PRESET_ORDER.length]};
    }
    case 'selectAndLand': return {...s, current:a.index, landed:true, preset:'SUN LEFT'};
  }
}
