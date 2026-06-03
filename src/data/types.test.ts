import {describe, it, expect} from 'vitest';
import type {Planet} from './types';

describe('types', () => {
  it('a Planet object satisfies the interface', () => {
    const p: Planet = {id:'about',label:'ABOUT',subtitle:'x',orbitRadius:20,size:1.75,speed:0.2,color:0x3b82f6,glow:'#3b82f6',style:'earth'};
    expect(p.id).toBe('about');
  });
});
