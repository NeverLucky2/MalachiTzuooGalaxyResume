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
