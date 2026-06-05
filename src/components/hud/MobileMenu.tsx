'use client';
import {useEffect, useState} from 'react';
import {PLANETS} from '@/data/planets';
import {CONTENT} from '@/data/content';
import type {ContentBlock} from '@/data/types';
import type {NavState, NavAction} from '@/lib/navigation';
import {SettingsControls} from './SettingsMenu';

// Reuse the résumé section's PDF download (DRY — single source of the href/label).
const PDF = CONTENT.resume.find(
  (b): b is Extract<ContentBlock, {kind: 'download'}> => b.kind === 'download',
);

/**
 * The only persistent top control on mobile: a ☰ button that opens a full-screen
 * overlay holding identity, the starmap (tap a row = fly + land), and the
 * résumé/PDF escape. Closes on ✕, tap-away, Escape, or choosing a section.
 */
export function MobileMenu({
  nav,
  dispatch,
  onSkip,
  shipMinigameEnabled = true,
  onToggleShipMinigame = () => {},
  onReplayTour = () => {},
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
  shipMinigameEnabled?: boolean;
  onToggleShipMinigame?: () => void;
  onReplayTour?: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        data-tour="menu"
        onClick={() => setOpen(true)}
        className="pointer-events-auto fixed right-[calc(12px+env(safe-area-inset-right))] top-[calc(12px+env(safe-area-inset-top))] z-30 flex h-11 w-11 items-center justify-center rounded-full border border-[#21e6ff]/50 bg-[#0a0a1f]/70 text-xl text-[#9fe9ff] shadow-[0_0_14px_rgba(33,230,255,.3)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ☰
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-[#05030f]/90 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full flex-col gap-4 px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-[calc(16px+env(safe-area-inset-top))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-lg font-black text-transparent">
                  MALACHI TZUOO
                </div>
                <div className="mt-1 text-[11px] text-[#9fb6cf]">
                  LV.26 · SOFTWARE ENGINEER · 🛰 AWS CERTIFIED
                </div>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-[#9fe9ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
              >
                ✕
              </button>
            </div>

            <div className="font-display text-[10px] uppercase tracking-[2px] text-[#7fb0c9]">
              ◇ Starmap — jump anywhere
            </div>
            <nav className="flex flex-col gap-1">
              {PLANETS.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => {
                    dispatch({type: 'selectAndLand', index: i});
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cyan-300 ${
                    i === nav.current ? 'bg-[#21e6ff]/[.12] shadow-[inset_0_0_0_1px_rgba(33,230,255,.4)]' : ''
                  }`}
                >
                  <span
                    className="h-3 w-3 flex-none rounded-full"
                    style={{background: p.glow, boxShadow: `0 0 8px ${p.glow}`}}
                  />
                  <span>{p.label}</span>
                  <span className="ml-auto font-display text-[10px] opacity-50">{`0${i + 1}`}</span>
                </button>
              ))}
            </nav>

            <div className="font-display text-[10px] uppercase tracking-[2px] text-[#7fb0c9]">
              ◇ Settings
            </div>
            <SettingsControls
              shipMinigameEnabled={shipMinigameEnabled}
              onToggleShipMinigame={onToggleShipMinigame}
              onReplayTour={() => {
                setOpen(false);
                onReplayTour();
              }}
            />

            <div className="mt-auto flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onSkip();
                }}
                className="pointer-events-auto flex-1 rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 py-3 text-center font-display text-sm text-cyan-200"
              >
                📄 Resume
              </button>
              {PDF && (
                <a
                  href={PDF.href}
                  className="flex-1 rounded-xl border border-[#21e6ff]/50 bg-[#0a0a1f]/60 py-3 text-center font-display text-sm text-cyan-200"
                >
                  ⬇ PDF
                </a>
              )}
            </div>
            <div className="text-center text-[10px] text-[#6f93a9]">drag to look around · tap a planet to explore</div>
          </div>
        </div>
      )}
    </>
  );
}
