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
