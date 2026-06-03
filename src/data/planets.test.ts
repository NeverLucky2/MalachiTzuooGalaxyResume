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
