import type {Planet} from './types';

export const PLANETS: Planet[] = [
  {id:'about',  label:'ABOUT',      subtitle:'World 1 · home, closest to the star', orbitRadius:20,  size:1.75, speed:0.20,  color:0x3b82f6, glow:'#3b82f6', style:'earth'},
  {id:'xp',     label:'EXPERIENCE', subtitle:'Career orbit',                        orbitRadius:34,  size:2.3,  speed:0.13,  color:0xe0a23b, glow:'#f0a93b', style:'gas', ring:true},
  {id:'proj',   label:'PROJECTS',   subtitle:'Collectibles & builds',               orbitRadius:50,  size:2.1,  speed:0.10,  color:0xa23bff, glow:'#a23bff', style:'gas', moon:true},
  {id:'skills', label:'SKILLS',     subtitle:'Your stat sheet',                     orbitRadius:68,  size:1.45, speed:0.08,  color:0xff3d6e, glow:'#ff3d6e', style:'lava'},
  {id:'resume', label:'RÉSUMÉ',     subtitle:'The official log',                    orbitRadius:88,  size:1.55, speed:0.065, color:0x3be0c0, glow:'#3be0c0', style:'ice'},
  {id:'contact',label:'CONTACT',    subtitle:'Mission control · the outer frontier',orbitRadius:110, size:1.2,  speed:0.052, color:0x9fd0ff, glow:'#9fd0ff', style:'rock'},
];
