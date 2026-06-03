import type {ReactNode} from 'react';

export type PlanetStyle = 'earth' | 'gas' | 'lava' | 'ice' | 'rock';
export type SectionId = 'about' | 'xp' | 'proj' | 'skills' | 'resume' | 'contact';
export type PresetName = 'SUN LEFT' | 'LIT FACE' | 'TOP-DOWN';

export interface PlanetArt {
  texture?: string; normal?: string; clouds?: string; glb?: string;
}

export interface Planet {
  id: SectionId;
  label: string;          // "ABOUT"
  subtitle: string;
  orbitRadius: number;    // R, inner→outer
  size: number;
  speed: number;          // orbital angular speed (rad/s)
  color: number;          // hex
  glow: string;           // css hex for HUD/labels
  style: PlanetStyle;
  ring?: boolean;
  moon?: boolean;
  art?: PlanetArt;
}

export type ContentBlock =
  | {kind: 'paragraph'; text: string}
  | {kind: 'cards'; items: {label: string; value: string}[]}
  | {kind: 'timeline'; items: {role: string; meta: string; bullets: string[]}[]}
  | {kind: 'stats'; items: {label: string; pct: number}[]}
  | {kind: 'projects'; items: {title: string; body: string; isNew?: boolean; href?: string}[]}
  | {kind: 'links'; items: {label: string; value: string; href?: string}[]}
  | {kind: 'download'; label: string; href: string};

export interface SectionContent {id: SectionId; blocks: ContentBlock[]}
export type {ReactNode};
