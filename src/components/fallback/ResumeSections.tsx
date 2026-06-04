import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import type {SectionId} from '@/data/types';
import {ContentRenderer} from './ContentRenderer';

/**
 * The résumé body — sections in order, rendered as plain readable text. Shared
 * by the 2D `FallbackResume` page and the landed RESUME planet panel so the two
 * can never drift. `idPrefix` namespaces the section heading ids: the 2D page
 * (always in the DOM) keeps the default `s-` ids; the in-galaxy panel passes its
 * own prefix so the two copies don't collide on duplicate ids. `exclude` drops
 * sections — the panel omits About (it has its own planet, so it's redundant
 * there) while the full 2D view keeps everything.
 */
export function ResumeSections({
  idPrefix = 's-',
  exclude = [],
}: {
  idPrefix?: string;
  exclude?: SectionId[];
}) {
  return (
    <>
      {PLANETS.filter(p => !exclude.includes(p.id)).map(p => (
        <section key={p.id} className="mb-10" aria-labelledby={`${idPrefix}${p.id}`}>
          <h2 id={`${idPrefix}${p.id}`} className="mb-3 border-b border-white/10 pb-1 font-display text-xl">{p.label}</h2>
          <div className="space-y-3"><ContentRenderer blocks={CONTENT[p.id]} /></div>
        </section>
      ))}
    </>
  );
}
