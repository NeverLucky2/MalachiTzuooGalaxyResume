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
