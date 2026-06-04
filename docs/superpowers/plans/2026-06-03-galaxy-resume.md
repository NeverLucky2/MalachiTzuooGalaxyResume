# Galaxy Résumé Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Malachi Tzuoo's résumé website as an interactive 3D solar system (fly a spaceship between planets = résumé sections) with a fast, accessible 2D fallback.

**Architecture:** Fresh **Next.js (App Router) + TypeScript + Tailwind + React Three Fiber (three.js)**. The 3D galaxy is a client-only component, dynamically imported; all section content lives in a typed data model and is rendered both inside the 3D detail panels and in the 2D fallback (single source of truth). A capability/preference gate decides 3D vs fallback (reduced-motion, no-WebGL, small/touch screens, or explicit "skip"). The locked prototype `reference/galaxy-prototype.html` is the visual/behavioral source of truth.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, `three`, `@react-three/fiber`, `@react-three/drei`, Vitest + React Testing Library + `@react-three/test-renderer`, ESLint/Prettier.

**Spec:** `docs/superpowers/specs/2026-06-03-galaxy-resume-design.md`

---

## Conventions

- **TDD:** for pure logic (data integrity, camera math, navigation reducer, capability detection, content/fallback rendering) write the failing test first. For 3D scene components, use `@react-three/test-renderer` smoke tests (mounts without throwing, expected object graph) plus a dev-server visual-verification step.
- **Commits:** one per task (after its tests pass). Conventional Commits style.
- **Run dev server:** `npm run dev` → http://localhost:3000. **Run tests:** `npm test` (Vitest, watch off in CI via `npm run test:run`).
- **No `any`. Strict TS.** Keep files small and single-purpose.

---

## File Structure (target)

```
galaxy-resume/                      # new project root (git repo)
  reference/galaxy-prototype.html   # the locked three.js prototype (read-only reference)
  public/
    assets/Tzuoo_Malachi_Resume_.pdf
    planets/                        # optional AI textures later (about.jpg, …)
    fonts/                          # self-hosted Orbitron + Inter
  src/
    app/
      layout.tsx                    # <html>, fonts, metadata/SEO
      page.tsx                      # server shell: renders FallbackResume (SSR) + mounts GalaxyExperience
      globals.css                   # tailwind + base
    data/
      planets.ts                    # typed Planet[] config (orbits, sizes, art, style)
      content.tsx                   # section content as ContentBlock[]
      types.ts                      # shared types (Planet, ContentBlock, Preset…)
    lib/
      capabilities.ts               # webgl/reduced-motion/touch detection
      cameraPresets.ts              # PRESETS + framing() pure math
      navigation.ts                 # pure nav reducer (selection/landed/preset/boost)
      procedural.ts                 # canvas planet/cloud/galaxy/glow textures
    hooks/
      useGalaxyControls.ts          # keyboard/pointer → nav actions
    components/
      GalaxyExperience.tsx          # decides 3D vs fallback; owns nav state
      fallback/FallbackResume.tsx   # accessible 2D résumé (uses content.tsx)
      fallback/ContentRenderer.tsx  # renders ContentBlock[] to DOM (shared w/ panels)
      hud/Hud.tsx                    # name chips, legend, controls, speed hint, view button, skip
      hud/StarmapLegend.tsx
      hud/PlanetLabels.tsx          # DOM labels projected under planets
      hud/DetailPanel.tsx           # landed section panel + TAKE OFF
      three/Scene.tsx                # <Canvas>, lights, backdrop
      three/Sun.tsx
      three/Starfield.tsx
      three/Galaxies.tsx
      three/Comets.tsx
      three/Planet.tsx
      three/Planets.tsx              # maps planets.ts → <Planet>, exposes live positions
      three/Ship.tsx
      three/CameraRig.tsx            # framing/travel/landing via useFrame
  vitest.config.ts
  vitest.setup.ts
```

---

## Task 0: Scaffold project

**Files:** new repo `galaxy-resume/` (create as sibling of `MalachiResumeWebsite/`).

- [ ] **Step 1: Create the Next.js app**

Run (from `C:/Users/mtzuo/OneDrive/Documents/Projects/ResumeWebsite/`):
```bash
npx create-next-app@latest galaxy-resume --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
cd galaxy-resume
```
Accept defaults for any remaining prompts.

- [ ] **Step 2: Install runtime + test deps**

```bash
npm i three @react-three/fiber @react-three/drei
npm i -D @types/three vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @react-three/test-renderer
```

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:
```ts
import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {environment: 'jsdom', globals: true, setupFiles: ['./vitest.setup.ts']},
  resolve: {alias: {'@': path.resolve(__dirname, './src')}},
});
```
Create `vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```
Add scripts to `package.json`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 4: Copy assets + prototype reference**

```bash
mkdir -p public/assets reference public/planets public/fonts
cp ../MalachiResumeWebsite/out/assets/Tzuoo_Malachi_Resume_.pdf public/assets/
cp ../.superpowers/brainstorm/362-1780458394/content/galaxy-3d-v17.html reference/galaxy-prototype.html
```

- [ ] **Step 5: Initialize git + gitignore**

```bash
git init
printf "\n.superpowers/\n" >> .gitignore
git add -A
git commit -m "chore: scaffold Next.js + R3F + Vitest project"
```

- [ ] **Step 6: Verify toolchain**

Run: `npm run test:run` → Expected: "No test files found" (exit 0 is fine) — confirms Vitest runs.
Run: `npm run dev`, open http://localhost:3000 → Expected: default Next.js page renders. Stop the server.

---

## Task 1: Shared types

**Files:** Create `src/data/types.ts`; Test `src/data/types.test.ts`

- [ ] **Step 1: Write the type module**

```ts
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
```

- [ ] **Step 2: Write a compile/contract test**

```ts
import {describe, it, expect} from 'vitest';
import type {Planet} from './types';

describe('types', () => {
  it('a Planet object satisfies the interface', () => {
    const p: Planet = {id:'about',label:'ABOUT',subtitle:'x',orbitRadius:20,size:1.75,speed:0.2,color:0x3b82f6,glow:'#3b82f6',style:'earth'};
    expect(p.id).toBe('about');
  });
});
```

- [ ] **Step 3: Run + commit**

Run: `npm run test:run` → Expected: PASS.
```bash
git add -A && git commit -m "feat: shared domain types"
```

---

## Task 2: Planet config

**Files:** Create `src/data/planets.ts`; Test `src/data/planets.test.ts`

Values are taken verbatim from the locked prototype (inner→outer; you start at About innermost and travel outward).

- [ ] **Step 1: Write the failing test**

```ts
import {describe, it, expect} from 'vitest';
import {PLANETS} from './planets';

describe('PLANETS', () => {
  it('has the six sections in inner→outer order', () => {
    expect(PLANETS.map(p => p.id)).toEqual(['about','xp','proj','skills','resume','contact']);
  });
  it('orbit radii strictly increase outward', () => {
    for (let i=1;i<PLANETS.length;i++) expect(PLANETS[i].orbitRadius).toBeGreaterThan(PLANETS[i-1].orbitRadius);
  });
  it('inner planets orbit faster than outer', () => {
    for (let i=1;i<PLANETS.length;i++) expect(PLANETS[i].speed).toBeLessThan(PLANETS[i-1].speed);
  });
  it('Experience has a ring and Projects has a moon', () => {
    expect(PLANETS.find(p=>p.id==='xp')?.ring).toBe(true);
    expect(PLANETS.find(p=>p.id==='proj')?.moon).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run` → Expected: FAIL (cannot find `./planets`).

- [ ] **Step 3: Implement**

```ts
import type {Planet} from './types';

export const PLANETS: Planet[] = [
  {id:'about',  label:'ABOUT',      subtitle:'World 1 · home, closest to the star', orbitRadius:20,  size:1.75, speed:0.20,  color:0x3b82f6, glow:'#3b82f6', style:'earth'},
  {id:'xp',     label:'EXPERIENCE', subtitle:'Career orbit',                        orbitRadius:34,  size:2.3,  speed:0.13,  color:0xe0a23b, glow:'#f0a93b', style:'gas', ring:true},
  {id:'proj',   label:'PROJECTS',   subtitle:'Collectibles & builds',               orbitRadius:50,  size:2.1,  speed:0.10,  color:0xa23bff, glow:'#a23bff', style:'gas', moon:true},
  {id:'skills', label:'SKILLS',     subtitle:'Your stat sheet',                     orbitRadius:68,  size:1.45, speed:0.08,  color:0xff3d6e, glow:'#ff3d6e', style:'lava'},
  {id:'resume', label:'RÉSUMÉ',     subtitle:'The official log',                    orbitRadius:88,  size:1.55, speed:0.065, color:0x3be0c0, glow:'#3be0c0', style:'ice'},
  {id:'contact',label:'CONTACT',    subtitle:'Mission control · the outer frontier',orbitRadius:110, size:1.2,  speed:0.052, color:0x9fd0ff, glow:'#9fd0ff', style:'rock'},
];
```

- [ ] **Step 4: Run + commit**

Run: `npm run test:run` → Expected: PASS.
```bash
git add -A && git commit -m "feat: planet (section) configuration"
```

---

## Task 3: Section content

**Files:** Create `src/data/content.ts`; Test `src/data/content.test.ts`

> NOTE: the **Stock Trading Platform** and **Financial Planner** entries are placeholders pending Malachi's blurbs — flagged with `isNew:true`. Update their `body` text when provided; no structural change needed.

- [ ] **Step 1: Write the failing test**

```ts
import {describe, it, expect} from 'vitest';
import {CONTENT} from './content';

describe('CONTENT', () => {
  it('has content for every section', () => {
    expect(Object.keys(CONTENT).sort()).toEqual(['about','contact','proj','resume','skills','xp']);
  });
  it('résumé section offers the PDF download', () => {
    const blocks = CONTENT.resume;
    expect(blocks.some(b => b.kind === 'download' && b.href.endsWith('.pdf'))).toBe(true);
  });
  it('projects include the two new in-progress apps (trading agent + Tallio) and exclude Airline Shortest Path', () => {
    const proj = CONTENT.proj.find(b => b.kind === 'projects');
    const items = proj && proj.kind === 'projects' ? proj.items : [];
    const titles = items.map(i => i.title).join(' ');
    expect(items.filter(i => i.isNew)).toHaveLength(2);
    expect(titles).toMatch(/Tallio/);
    expect(titles).toMatch(/Prophet/);
    expect(titles).not.toMatch(/Airline/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run` → Expected: FAIL (cannot find `./content`).

- [ ] **Step 3: Implement**

```ts
import type {ContentBlock, SectionId} from './types';

export const CONTENT: Record<SectionId, ContentBlock[]> = {
  about: [
    {kind:'paragraph', text:'Software developer with a strong engineering foundation — Python, cloud-native delivery, CI/CD automation, and generative-AI tooling. AWS Certified Developer based in Chicago, shipping production apps in cross-functional teams.'},
    {kind:'cards', items:[
      {label:'📍 Location', value:'Chicago, IL'},
      {label:'🎓 Study', value:'DePaul (BS Software Dev) · Linköping (BBA)'},
      {label:'🧗 Interests', value:'Rock climbing, gym, games'},
      {label:'🐱 Also', value:'Owner of 3 very good cats'},
    ]},
  ],
  xp: [
    {kind:'timeline', items:[
      {role:'Logistics Coordinator', meta:'Bensenville, IL · Nov 2024 – Present', bullets:[
        'Built Python automation pipelines to ingest, clean & process large operational datasets.',
        'Custom extraction/parsing with validation logic turning raw shipment records into analytics-ready data.']},
      {role:'Front-End Software Developer Intern', meta:'Remote · Jun 2024 – Nov 2024', bullets:[
        'Maintained an Astro + React app serving 10,000+ monthly users.',
        'Accessible UI in TypeScript + Tailwind, integrated with Supabase / PostgreSQL.']},
      {role:'Ruby Full-Stack Developer', meta:'Remote · Mar 2023 – Jul 2023', bullets:[
        'Rails + React blog platform on AWS with RDS PostgreSQL.',
        'Designed CI/CD from scratch with GitHub Actions; TDD & pair programming.']},
    ]},
  ],
  proj: [
    {kind:'projects', items:[
      {title:'ClaudeProphetAndFriends (fork of OpenProphet)', body:"A fork of Jake Nesler's OpenProphet that I largely rebuilt. The original was a single hyper-aggressive options agent with no real edge; I turned it into a fleet of agents running mechanical, backtested (historical-data) strategies that don't rely on options — lower highs, but far steadier and more consistent. I added a pre-flight step that cuts token cost, automatic heartbeat tuning, and FMP-powered screeners/analysis. Node/Express agent + Go (Gin) Alpaca backend + Claude (via OpenCode) + 45+ MCP tools with permission guardrails; paper trading. Mostly just the (reworked) dashboard layout remains from the original.", isNew:true, href:'https://github.com/NeverLucky2/ClaudeProphetAndFriends'},
      {title:'Tallio — local-first finance tracker', body:"A friendlier Quicken alternative built for my dad. Snap bills, receipts, paystubs & statements with your phone; Claude's vision model does the data entry into a double-entry ledger, then reports cash flow, net worth, spending & recurring charges. 100% in-browser (localStorage) — no server or account — with phone→desktop capture over WebRTC. React 19 · Vite · Claude vision · 590+ tests.", isNew:true},
      {title:'GenAI Dev Practice', body:'Daily Anthropic API, LangChain & agentic workflow work.'},
      {title:'Astrite.gg', body:'Wuthering Waves gacha tracker (Astro/React), 10k+ users.'},
      {title:'Revature Blogger', body:'Full-stack Rails + React blog, GitHub Actions CI/CD.'},
      {title:'Mario Screaming Bot', body:'JS Discord bot, token auth, self-hosted uptime.'},
    ]},
  ],
  skills: [
    {kind:'stats', items:[
      {label:'Python', pct:88},{label:'JavaScript / TypeScript', pct:85},{label:'React', pct:75},
      {label:'AWS (EC2/RDS/S3)', pct:82},{label:'GenAI / LLMs / LangChain', pct:85},{label:'CI/CD · Docker', pct:74},
    ]},
  ],
  resume: [
    {kind:'cards', items:[{label:'🏅 AWS Certified Developer – Associate', value:'Valid 2024 – 2027. EC2, Lambda, DynamoDB, SNS/SQS, CodePipeline.'}]},
    {kind:'paragraph', text:'Grab the full PDF for the complete history.'},
    {kind:'download', label:'⤓ Download résumé (PDF)', href:'/assets/Tzuoo_Malachi_Resume_.pdf'},
  ],
  contact: [
    {kind:'links', items:[
      {label:'✉️ Email', value:'mtzuoo@gmail.com', href:'mailto:mtzuoo@gmail.com'},
      {label:'🐙 GitHub', value:'github.com/NeverLucky2', href:'https://github.com/NeverLucky2'},
      {label:'💼 LinkedIn', value:'malachi-tzuoo-depaul', href:'https://www.linkedin.com/in/malachi-tzuoo-depaul/'},
      {label:'📍 Based in', value:'Chicago, IL'},
    ]},
  ],
};
```

- [ ] **Step 4: Run + commit**

Run: `npm run test:run` → Expected: PASS.
```bash
git add -A && git commit -m "feat: section content data (new projects placeholdered)"
```

---

## Task 4: Camera presets + framing math (pure)

**Files:** Create `src/lib/cameraPresets.ts`; Test `src/lib/cameraPresets.test.ts`

Pure functions ported from the prototype's `PRESETS` + `framing()`. Uses plain `[x,y,z]` tuples (no three.js dependency → trivially testable).

- [ ] **Step 1: Write the failing test**

```ts
import {describe, it, expect} from 'vitest';
import {PRESETS, framing} from './cameraPresets';

const P: [number,number,number] = [20,0,0]; // about on +x axis

describe('framing', () => {
  it('SUN LEFT places the camera farther from the planet than LIT FACE', () => {
    const a = framing(P, 1.75, 'SUN LEFT', false);
    const b = framing(P, 1.75, 'LIT FACE', false);
    const dist = (c:[number,number,number]) => Math.hypot(c[0]-P[0],c[1]-P[1],c[2]-P[2]);
    expect(dist(a.pos)).toBeGreaterThan(dist(b.pos));
  });
  it('landing pulls the camera closer than its non-landed framing', () => {
    const far = framing(P, 1.75, 'SUN LEFT', false);
    const near = framing(P, 1.75, 'SUN LEFT', true);
    const dist = (c:[number,number,number]) => Math.hypot(c[0]-P[0],c[1]-P[1],c[2]-P[2]);
    expect(dist(near.pos)).toBeLessThan(dist(far.pos));
  });
  it('TOP-DOWN looks at the origin from high above', () => {
    const f = framing(P, 1.75, 'TOP-DOWN', false);
    expect(f.pos[1]).toBeGreaterThan(150);
    expect(f.look).toEqual([0,0,0]);
  });
  it('exposes ship scale per preset', () => {
    expect(PRESETS['LIT FACE'].ship).toBeLessThan(PRESETS['SUN LEFT'].ship);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run` → Expected: FAIL.

- [ ] **Step 3: Implement** (ported values from prototype)

```ts
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
```

- [ ] **Step 4: Run + commit**

Run: `npm run test:run` → Expected: PASS.
```bash
git add -A && git commit -m "feat: camera presets + framing math"
```

---

## Task 5: Navigation reducer (pure)

**Files:** Create `src/lib/navigation.ts`; Test `src/lib/navigation.test.ts`

Pure state machine so all navigation logic is testable without three.js/React.

- [ ] **Step 1: Write the failing test**

```ts
import {describe, it, expect} from 'vitest';
import {initialNav, navReducer} from './navigation';

const N = 6;
describe('navReducer', () => {
  it('next/prev clamp at ends and do nothing while landed', () => {
    let s = initialNav();
    s = navReducer(s, {type:'prev', n:N}); expect(s.current).toBe(0);     // clamp low
    s = navReducer(s, {type:'next', n:N}); expect(s.current).toBe(1);
    s = navReducer(s, {type:'land'});      expect(s.landed).toBe(true);
    s = navReducer(s, {type:'next', n:N}); expect(s.current).toBe(1);     // no move while landed
  });
  it('land then takeOff returns to galaxy in same preset', () => {
    let s = initialNav();
    s = navReducer(s, {type:'cyclePreset'}); const p = s.preset;
    s = navReducer(s, {type:'land'});
    s = navReducer(s, {type:'takeOff'});
    expect(s.landed).toBe(false); expect(s.preset).toBe(p);
  });
  it('selecting a planet in top-down lands and resets preset to SUN LEFT', () => {
    let s = {...initialNav(), preset:'TOP-DOWN' as const};
    s = navReducer(s, {type:'selectAndLand', index:3});
    expect(s.current).toBe(3); expect(s.landed).toBe(true); expect(s.preset).toBe('SUN LEFT');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run` → Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run + commit**

Run: `npm run test:run` → Expected: PASS.
```bash
git add -A && git commit -m "feat: pure navigation reducer"
```

---

## Task 6: Capability detection (pure)

**Files:** Create `src/lib/capabilities.ts`; Test `src/lib/capabilities.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import {describe, it, expect, vi} from 'vitest';
import {shouldUse3D} from './capabilities';

describe('shouldUse3D', () => {
  const base = {hasWebGL:true, reducedMotion:false, coarsePointer:false, width:1280};
  it('true on a capable desktop', () => expect(shouldUse3D(base)).toBe(true));
  it('false without WebGL', () => expect(shouldUse3D({...base, hasWebGL:false})).toBe(false));
  it('false with reduced motion', () => expect(shouldUse3D({...base, reducedMotion:true})).toBe(false));
  it('false on small touch screens', () => expect(shouldUse3D({...base, coarsePointer:true, width:600})).toBe(false));
});
```

- [ ] **Step 2: Run to verify it fails** → `npm run test:run` Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run + commit** → `npm run test:run` Expected: PASS.
```bash
git add -A && git commit -m "feat: webgl/motion/touch capability detection"
```

---

## Task 7: Content renderer + accessible fallback résumé

**Files:** Create `src/components/fallback/ContentRenderer.tsx`, `src/components/fallback/FallbackResume.tsx`; Test `src/components/fallback/FallbackResume.test.tsx`

This renders the same `CONTENT` to semantic DOM — used by both the 2D fallback and (later) the 3D detail panels, so content lives once.

- [ ] **Step 1: Write the failing test**

```tsx
import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FallbackResume} from './FallbackResume';

describe('FallbackResume', () => {
  it('renders every section heading and the résumé PDF link', () => {
    render(<FallbackResume />);
    for (const h of ['About','Experience','Projects','Skills','Résumé','Contact'])
      expect(screen.getByRole('heading', {name: new RegExp(h, 'i')})).toBeInTheDocument();
    const pdf = screen.getByRole('link', {name: /download résumé/i});
    expect(pdf).toHaveAttribute('href', '/assets/Tzuoo_Malachi_Resume_.pdf');
  });
});
```

- [ ] **Step 2: Run to verify it fails** → Expected: FAIL.

- [ ] **Step 3: Implement `ContentRenderer.tsx`**

```tsx
import type {ContentBlock} from '@/data/types';

export function ContentRenderer({blocks}: {blocks: ContentBlock[]}) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'paragraph': return <p key={i} className="text-sm leading-relaxed opacity-90">{b.text}</p>;
          case 'cards': return (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {b.items.map((it, j) => <div key={j} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm"><b className="block">{it.label}</b>{it.value}</div>)}
            </div>);
          case 'timeline': return (
            <div key={i} className="space-y-4">
              {b.items.map((it, j) => (
                <div key={j} className="border-b border-white/10 pb-3 last:border-0">
                  <div className="font-bold">{it.role}</div>
                  <div className="text-xs opacity-60">{it.meta}</div>
                  <ul className="list-disc pl-5 text-sm opacity-90">{it.bullets.map((x,k)=><li key={k}>{x}</li>)}</ul>
                </div>))}
            </div>);
          case 'stats': return (
            <div key={i} className="space-y-2">
              {b.items.map((it,j)=>(
                <div key={j} className="flex items-center gap-3 text-sm">
                  <span className="w-44 opacity-80">{it.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{width:`${it.pct}%`}} /></span>
                </div>))}
            </div>);
          case 'projects': return (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {b.items.map((it,j)=>(
                <div key={j} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  <b className="block">{it.title}{it.isNew && <span className="ml-2 rounded bg-fuchsia-500 px-1.5 py-0.5 text-[10px] font-extrabold">NEW</span>}</b>{it.body}
                  {it.href && <a className="mt-2 block text-cyan-300 underline" href={it.href} target="_blank" rel="noreferrer">View on GitHub →</a>}
                </div>))}
            </div>);
          case 'links': return (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {b.items.map((it,j)=>(
                <div key={j} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  <b className="block">{it.label}</b>{it.href ? <a className="text-cyan-300 underline" href={it.href}>{it.value}</a> : it.value}
                </div>))}
            </div>);
          case 'download': return <a key={i} href={b.href} className="mt-2 inline-block rounded-lg bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 font-extrabold text-[#04030f]">{b.label}</a>;
        }
      })}
    </>
  );
}
```

- [ ] **Step 4: Implement `FallbackResume.tsx`**

```tsx
import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import {ContentRenderer} from './ContentRenderer';

export function FallbackResume() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-[#e7f6ff]">
      <header className="mb-8">
        <h1 className="font-[Orbitron] text-3xl font-black">Malachi Tzuoo</h1>
        <p className="opacity-70">Software Engineer · Chicago, IL · AWS Certified Developer</p>
      </header>
      {PLANETS.map(p => (
        <section key={p.id} className="mb-10" aria-labelledby={`s-${p.id}`}>
          <h2 id={`s-${p.id}`} className="mb-3 border-b border-white/10 pb-1 font-[Orbitron] text-xl">{p.label}</h2>
          <div className="space-y-3"><ContentRenderer blocks={CONTENT[p.id]} /></div>
        </section>
      ))}
    </main>
  );
}
```

- [ ] **Step 5: Run + commit** → `npm run test:run` Expected: PASS.
```bash
git add -A && git commit -m "feat: accessible 2D fallback résumé + shared content renderer"
```

---

## Task 8: App shell + SSR fallback + experience gate

**Files:** Modify `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`; Create `src/components/GalaxyExperience.tsx`; Test `src/components/GalaxyExperience.test.tsx`

The server renders `FallbackResume` (crawlable, no-JS). `GalaxyExperience` mounts on the client and, only if `shouldUse3D`, replaces it with the 3D scene; otherwise it leaves the fallback visible and shows an "Enter the galaxy" opt-in button.

- [ ] **Step 1: Write the failing test**

```tsx
import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen} from '@testing-library/react';

vi.mock('@/lib/capabilities', () => ({
  detectCaps: () => ({hasWebGL:false, reducedMotion:true, coarsePointer:false, width:1280}),
  shouldUse3D: () => false,
}));
vi.mock('@/components/three/Scene', () => ({Scene: () => <div data-testid="scene" />}));

import {GalaxyExperience} from './GalaxyExperience';

describe('GalaxyExperience', () => {
  beforeEach(() => vi.clearAllMocks());
  it('does NOT mount the 3D scene when capabilities say no', async () => {
    render(<GalaxyExperience />);
    expect(screen.queryByTestId('scene')).toBeNull();
    expect(screen.getByRole('button', {name: /enter the galaxy/i})).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails** → Expected: FAIL.

- [ ] **Step 3: Implement `GalaxyExperience.tsx`**

```tsx
'use client';
import {useEffect, useReducer, useState} from 'react';
import dynamic from 'next/dynamic';
import {detectCaps, shouldUse3D} from '@/lib/capabilities';
import {initialNav, navReducer} from '@/lib/navigation';

const Scene = dynamic(() => import('@/components/three/Scene').then(m => m.Scene), {ssr:false});

export function GalaxyExperience() {
  const [enabled, setEnabled] = useState(false);
  const [forced, setForced] = useState(false);
  const [nav, dispatch] = useReducer(navReducer, undefined, initialNav);

  useEffect(() => { if (shouldUse3D(detectCaps())) setEnabled(true); }, []);

  if (!enabled && !forced) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-center">
        <button onClick={() => setForced(true)}
          className="pointer-events-auto rounded-xl border border-cyan-400/60 bg-[#0a0a1f]/70 px-5 py-3 font-[Orbitron] text-sm text-cyan-200 shadow-[0_0_16px_rgba(33,230,255,.4)]">
          ▶ Enter the galaxy (3D)
        </button>
      </div>
    );
  }
  return <Scene nav={nav} dispatch={dispatch} />;
}
```

- [ ] **Step 4: Wire `page.tsx` + `layout.tsx`**

`src/app/page.tsx`:
```tsx
import {FallbackResume} from '@/components/fallback/FallbackResume';
import {GalaxyExperience} from '@/components/GalaxyExperience';

export default function Page() {
  return (
    <>
      {/* SSR, crawlable, works without JS; the 3D scene mounts over it when enabled */}
      <FallbackResume />
      <GalaxyExperience />
    </>
  );
}
```
In `src/app/layout.tsx` set `metadata` (title "Malachi Tzuoo — Software Engineer", description, OpenGraph) and load self-hosted Orbitron + Inter via `next/font/local` (place font files in `public/fonts/`, or use `next/font/google` for now). Set `<body className="bg-[#05030f] text-[#e7f6ff]">`.

- [ ] **Step 5: Run + commit** → `npm run test:run` Expected: PASS; `npm run dev` shows the fallback résumé + (on desktop) it will be replaced once the Scene exists (Task 9+).
```bash
git add -A && git commit -m "feat: app shell, SSR fallback, 3D experience gate"
```

---

## Task 9: Procedural textures (pure-ish util)

**Files:** Create `src/lib/procedural.ts`; Test `src/lib/procedural.test.ts`

Port `planetTexture`, `cloudTexture`, `radial`, `galaxyTex`, `disc/glow` canvas generators from the prototype. Return `HTMLCanvasElement` (caller wraps in `THREE.CanvasTexture`) so they're testable in jsdom.

- [ ] **Step 1: Write the failing test**

```ts
import {describe, it, expect} from 'vitest';
import {planetCanvas, radialCanvas} from './procedural';

describe('procedural textures', () => {
  it('planetCanvas returns a 512x256 canvas', () => {
    const c = planetCanvas(0x3b82f6, 'earth');
    expect(c.width).toBe(512); expect(c.height).toBe(256);
  });
  it('radialCanvas returns a 128 canvas', () => {
    expect(radialCanvas('rgba(255,255,255,1)',.3,'rgba(0,0,0,.5)','rgba(0,0,0,0)').width).toBe(128);
  });
});
```

- [ ] **Step 2: Run to verify it fails** → Expected: FAIL.

- [ ] **Step 3: Implement** — port the canvas functions from `reference/galaxy-prototype.html` (`hash`, `vnoise`, `fbm`, `planetTexture`→`planetCanvas`, `cloudTexture`→`cloudCanvas`, `radial`→`radialCanvas`, `galaxyTex`→`galaxyCanvas`). Keep signatures returning `HTMLCanvasElement`; do **not** import three here. Use a small color helper instead of `THREE.Color` (parse hex to r/g/b 0-1) to stay dependency-free.

```ts
// src/lib/procedural.ts  (port the noise + drawing code verbatim from the prototype;
// replace THREE.Color with this helper)
export function rgb(hex:number){return {r:((hex>>16)&255)/255, g:((hex>>8)&255)/255, b:(hex&255)/255};}
// ... hash/vnoise/fbm, planetCanvas(hex,style), cloudCanvas(), radialCanvas(c0,s1,c1,c2), galaxyCanvas()
```

- [ ] **Step 4: Run + commit** → `npm run test:run` Expected: PASS.
```bash
git add -A && git commit -m "feat: procedural texture generators (ported from prototype)"
```

---

## Task 10: Scene scaffold + lights + starfield + sun

**Files:** Create `src/components/three/Scene.tsx`, `Starfield.tsx`, `Sun.tsx`; Test `src/components/three/Scene.test.tsx`

- [ ] **Step 1: Write a smoke test** (`@react-three/test-renderer`)

```tsx
import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Sun} from './Sun';

describe('Sun', () => {
  it('mounts without throwing and creates a mesh', async () => {
    const r = await ReactThreeTestRenderer.create(<Sun />);
    expect(r.scene.children.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run to verify it fails** → Expected: FAIL.

- [ ] **Step 3: Implement** `Sun.tsx` (sphere radius 9, color `0xe3c171`, + corona `<sprite>` using `radialCanvas` glow scaled 42, additive, depthWrite off), `Starfield.tsx` (1800 points on a 500–1700 sphere, ported), and `Scene.tsx`:

```tsx
'use client';
import {Canvas} from '@react-three/fiber';
import type {NavState, NavAction} from '@/lib/navigation';
import {Starfield} from './Starfield';
import {Sun} from './Sun';

export function Scene({nav, dispatch}: {nav: NavState; dispatch: React.Dispatch<NavAction>}) {
  return (
    <div className="fixed inset-0 z-10">
      <Canvas camera={{fov:55, position:[0,95,210], near:0.1, far:4000}} dpr={[1,2]} gl={{antialias:true}}>
        <ambientLight color={0x6a7fb0} intensity={1.45} />
        <pointLight color={0xfff0d0} intensity={1.9} distance={0} decay={0.015} />
        <Starfield />
        <Sun />
        {/* Planets, Ship, CameraRig, Backdrop added in later tasks */}
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 4: Run smoke test + dev verify** → `npm run test:run` PASS. `npm run dev` on desktop → starfield + glowing sun render over a dark background.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: 3D scene scaffold, lights, starfield, sun"
```

---

## Task 11: Planets (3D spheres) + live positions

**Files:** Create `src/components/three/Planet.tsx`, `Planets.tsx`; Test `Planets.test.tsx`

`Planets` advances each planet's orbit in `useFrame`, exposes **live world positions** via a ref array (consumed by CameraRig, Ship, PlanetLabels). Port sphere material (map+emissiveMap from `planetCanvas`, emissiveIntensity 0.45), atmosphere shell, earth clouds, ring (Experience), moon (Projects), orbit `LineLoop`.

- [ ] **Step 1: Smoke test**

```tsx
import {describe, it, expect} from 'vitest';
import ReactThreeTestRenderer from '@react-three/test-renderer';
import {Planets} from './Planets';
import {PLANETS} from '@/data/planets';

describe('Planets', () => {
  it('mounts one group per planet', async () => {
    const positions = {current: PLANETS.map(()=>[0,0,0] as [number,number,number])};
    const r = await ReactThreeTestRenderer.create(<Planets current={0} positionsRef={positions} />);
    expect(r.scene.children.length).toBeGreaterThanOrEqual(PLANETS.length);
  });
});
```

- [ ] **Step 2: Run to verify it fails** → Expected: FAIL.

- [ ] **Step 3: Implement** `Planet.tsx` (single planet mesh + extras, props: `planet`, `selected`) and `Planets.tsx`:

```tsx
'use client';
import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {PLANETS} from '@/data/planets';
import {Planet} from './Planet';

type PositionsRef = {current: [number,number,number][]};

export function Planets({current, positionsRef}: {current:number; positionsRef:PositionsRef}) {
  const groups = useRef<THREE.Group[]>([]);
  const ang = useRef<number[]>(PLANETS.map((_,i)=>i*1.1));
  useFrame((_, dt) => {
    const d = Math.min(0.05, dt);
    PLANETS.forEach((p, i) => {
      ang.current[i] += p.speed * d * (i===current ? 0.16 : 1);
      const g = groups.current[i]; if (!g) return;
      g.position.set(Math.cos(ang.current[i])*p.orbitRadius, 0, Math.sin(ang.current[i])*p.orbitRadius);
      positionsRef.current[i] = [g.position.x, g.position.y, g.position.z];
    });
  });
  return (<>
    {PLANETS.map((p, i) => (
      <group key={p.id} ref={(el)=>{if(el)groups.current[i]=el;}}>
        <Planet planet={p} selected={i===current} />
      </group>
    ))}
  </>);
}
```
`Planet.tsx` builds the mesh + atmosphere + optional clouds/ring/moon using `planetCanvas`/`cloudCanvas` (wrap canvases in `new THREE.CanvasTexture(...)`, set `colorSpace='srgb'`), and animates spin/cloud/moon in its own `useFrame` (port values from prototype: spin `dt*0.25`, clouds `dt*0.32`, moon radius `size*2`, `dt*1.2`). Also render each orbit `LineLoop` (96 segments, color `0x6f86d6`, opacity .14) — these can live in `Planets` at the scene level.

- [ ] **Step 4: Smoke test + dev verify** → tests PASS; dev server shows textured planets orbiting the sun with rings/moon/clouds.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: 3D planets, orbits, rings, moon, live positions"
```

---

## Task 12: Backdrop — galaxies + comets

**Files:** Create `src/components/three/Galaxies.tsx`, `Comets.tsx`; add to `Scene`. Test: smoke test each mounts.

- [ ] **Step 1: Smoke test** (mount `<Galaxies/>` and `<Comets/>` via test renderer; expect children > 0).
- [ ] **Step 2: Run to verify fails** → FAIL.
- [ ] **Step 3: Implement** porting from prototype: `Galaxies` = 13 additive sprites (`galaxyCanvas` texture, colors `[0x9fb6ff,0xffb0e6,0xa8ffe6,0xffd9a8,0xc4a8ff]`, r 780–1680, scale 210–530, random `material.rotation`, opacity .5). `Comets` = 4 comets, each a `<line>` trail (22 points) + glow `<sprite>` head; advance in `useFrame` (box half-size 540, speed 22–40, respawn past 1.8× box) exactly as `stepComets` in the prototype.
- [ ] **Step 4: Add `<Galaxies/>` and `<Comets/>` to `Scene.tsx`; dev verify** galaxies appear in SUN LEFT view and comets drift.
- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: celestial backdrop — distant galaxies and roaming comets"
```

---

## Task 13: Ship

**Files:** Create `src/components/three/Ship.tsx`. Test: smoke test mounts.

Port the low-poly winged ship (capsule hull, energy ring, cockpit visor, swept short wings, fin, twin magenta engines, magenta halo sprite). Forward axis = +Z. Props: `targetPos` (current planet live position), `landed`, `presetShip` (scale from `PRESETS[preset].ship`). In `useFrame`: maintain `orbAng += dt*1.4`; compute live `orbitPoint` around the target (radius `max(size*1.45,1.3)`, vertical bob); lerp ship toward it via the travel progress (see CameraRig task — share a `travelT` ref) so it merges into orbit with no snap; orient via `quaternion.setFromUnitVectors([0,0,1], velocity.normalize())`; lerp scale toward `landed ? 0.11 : presetShip`.

- [ ] **Step 1: Smoke test** → mount `<Ship .../>` returns a group.
- [ ] **Step 2: Run fails** → FAIL.
- [ ] **Step 3: Implement** (port geometry + per-frame logic from prototype `ship`/`orbitPoint`/velocity-orient code).
- [ ] **Step 4: Dev verify** ship orbits the focused planet and noses along its path; small when landed.
- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: spaceship model + orbit/velocity orientation"
```

---

## Task 14: Camera rig (travel, presets, landing)

**Files:** Create `src/components/three/CameraRig.tsx`. Test: extend `cameraPresets.test.ts` already covers framing; add a small reducer-driven integration smoke test if practical.

Drives the camera each frame from `nav` + the planets' live positions, using `framing()` from Task 4. Maintains `travelT` (0→1) that advances by `dt * (shiftHeld ? 1.3 : moveBase)` where `moveBase` = 0.4 (planet travel) or 0.85 (land) or 0.75 (take-off); captures `fromCamPos`/`fromFocus` when the target changes (selection/landed/preset change); lerps camera position and lookAt by `smoothstep(travelT)`; applies the free-look yaw/pitch offset; shares `travelT` with `Ship`.

- [ ] **Step 1: Implement** porting the prototype's `framing` usage, `startMove`, `smooth`, and the per-frame camera block (use the R3F `camera` from `useThree`). Read `nav` via props; read `shiftHeld`, `yaw`, `pitch` from refs set by `useGalaxyControls` (Task 16).
- [ ] **Step 2: Dev verify** ← → flies smoothly between planets (no zoom lurch); SHIFT boosts; landing flies in and the camera angle matches the preset; take-off zooms back out at the same angle; cycling presets transitions and TOP-DOWN looks straight down.
- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "feat: camera rig — travel, presets, landing pan-in"
```

---

## Task 15: HUD — labels, legend, controls, detail panel

**Files:** Create `src/components/hud/Hud.tsx`, `StarmapLegend.tsx`, `PlanetLabels.tsx`, `DetailPanel.tsx`. Mount `Hud` from `Scene` (DOM overlay outside `<Canvas>`). Test: `DetailPanel.test.tsx` renders the focused section's content + a TAKE OFF button.

- [ ] **Step 1: Write the failing test** for `DetailPanel` (renders `CONTENT[current]` via `ContentRenderer` and a button named /take off/i that calls `onTakeOff`).
- [ ] **Step 2: Run fails** → FAIL.
- [ ] **Step 3: Implement** the HUD (port styles/markup from prototype): name/level/cert chips; `StarmapLegend` (click → `selectAndLand`); bottom controls (◀ INWARD / LAND / OUTWARD ▶), the **CAMERA ANGLE · V** label above the view button, the SHIFT boost hint, and the **Skip to résumé / PDF** link (toggles to the fallback/opens PDF); `DetailPanel` shows when `landed`; `PlanetLabels` projects each planet's live position to screen (`camera.project`) and positions a DOM label under it (hidden when landed). Reuse `ContentRenderer` for the panel body.
- [ ] **Step 4: Run + dev verify** → test PASS; HUD overlay works; labels track planets; legend jumps; panel opens on land.
- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: HUD — legend, controls, planet labels, detail panel, skip link"
```

---

## Task 16: Input controls (keyboard, pointer, boost, drag, click-to-fly)

**Files:** Create `src/hooks/useGalaxyControls.ts`; wire into `Scene`/`GalaxyExperience`. Test: `useGalaxyControls.test.ts` (dispatch correctness for key events via a fake dispatch).

- [ ] **Step 1: Write the failing test** — simulate `keydown` ArrowRight → dispatch `{type:'next'}`; Enter → `land`; Escape/ArrowDown (while landed) → `takeOff`; `v` → `cyclePreset`; Shift sets a `shiftHeld` ref true on down / false on up.
- [ ] **Step 2: Run fails** → FAIL.
- [ ] **Step 3: Implement** the hook: window keydown/keyup listeners mapping to `dispatch` actions (respecting `landed`), `shiftHeld`/`yaw`/`pitch` refs, pointer drag → yaw/pitch, and raycast click → fly/land (in TOP-DOWN: `selectAndLand`; else land current or `goTo`). Use R3F `useThree` for the raycaster against planet meshes (expose a planet-mesh ref array from `Planets`).
- [ ] **Step 4: Run + dev verify** → test PASS; all keys/clicks/drag/boost behave like the prototype.
- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: keyboard/pointer controls, boost, drag-look, click-to-fly"
```

---

## Task 17: Accessibility, reduced-motion, SEO polish

**Files:** Modify `layout.tsx` (metadata, OpenGraph, JSON-LD Person), `GalaxyExperience.tsx`, `Hud.tsx`. Test: `capabilities.test.ts` already covers gating; add a test that `FallbackResume` content equals the planet set (guards drift).

- [ ] **Step 1:** Ensure the **Skip to résumé** link in the HUD unmounts the 3D scene and reveals `FallbackResume` (set `forced=false` / an explicit `show2D` state) and focuses the main heading.
- [ ] **Step 2:** Respect `prefers-reduced-motion` even when 3D is force-entered: when reduced motion, damp idle orbital speeds (multiply planet/comet speeds by ~0.15) — read once at mount.
- [ ] **Step 3:** Add `metadata` + a JSON-LD `Person` script in `layout.tsx`; ensure all fallback links have discernible names and the canvas has `aria-hidden` with a visually-hidden "Skip to résumé" control reachable by keyboard first.
- [ ] **Step 4:** Run a quick a11y pass (axe DevTools or Lighthouse) on the fallback; fix contrast/name issues.
- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: a11y/reduced-motion/SEO polish + skip-to-résumé"
```

---

## Task 18: Performance pass

**Files:** various. No new behavior; verify budgets.

- [ ] **Step 1:** Confirm `Scene` is dynamically imported (`ssr:false`) and not in the initial fallback bundle (check `npm run build` output / route JS size).
- [ ] **Step 2:** Cap `dpr={[1,2]}`; generate each procedural texture once (memoize); dispose textures/geometries on unmount.
- [ ] **Step 3:** Pause the render loop when the tab is hidden (`document.visibilitychange` → `frameloop="demand"`/stop).
- [ ] **Step 4:** Verify ~60fps on a typical laptop; confirm auto-fallback path still works (toggle `shouldUse3D` to false via reduced-motion emulation).
- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "perf: bundle split, texture memoization, hidden-tab pause"
```

---

## Task 19: Build, deploy config, README

**Files:** Create `README.md`; deploy config for current host (AWS S3 static or Vercel).

- [ ] **Step 1:** `npm run build` → fix any TS/lint/build errors; ensure the page statically generates and the PDF + `public/planets` are included.
- [ ] **Step 2:** Document local dev, where to drop AI planet textures (`public/planets/<id>.jpg` + set `art.texture` in `planets.ts`), and how to update the two project blurbs in `content.ts`.
- [ ] **Step 3:** Configure deploy (if S3 static export, set `output: 'export'` only if compatible with the client-only canvas — otherwise deploy as a standard Next app to Vercel/Amplify). Verify the deployed URL loads fallback first, then galaxy on capable clients.
- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "chore: build, deploy config, README"
```

---

## Post-build follow-ups (tracked, not blocking)

- **ClaudeProphetAndFriends** copy is final: honestly framed as a heavily-rebuilt **fork** of Jake Nesler's OpenProphet (mechanical backtested multi-agent strategies, pre-flight token savings, auto-heartbeat, FMP screeners; only the reworked dashboard layout remains). **Tallio** is original work, private repo (no public link). Both flagged `isNew` (in progress).
- Remove **Airline Shortest Path** from the résumé **PDF** (the site already excludes it).
- Optional: drop AI-generated equirectangular **planet textures** into `public/planets/` and set `art.texture` per planet.
- Decide HUD tone ("LV.25" / "CLASS · SOFTWARE ENGINEER") — keep playful or make recruiter-plain.
- Confirm custom domain.

---

## Self-review notes (author)

- **Spec coverage:** experience (Tasks 10–16), presets/camera (4,14), navigation (5,16), data model (1–3), fallback/a11y/SEO (6,7,8,17), performance (18), backdrop/brightness (10–12), content updates (3 + follow-ups), hosting (19). ✅
- **Types consistent:** `Planet`, `ContentBlock`, `PresetName`, `NavState/NavAction`, `framing()` signature reused across tasks. ✅
- **Placeholders:** the only intentional content placeholders (two projects) are explicitly flagged with update instructions; no plan-step placeholders. ✅
