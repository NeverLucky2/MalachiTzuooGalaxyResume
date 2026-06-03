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
