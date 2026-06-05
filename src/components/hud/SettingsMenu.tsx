'use client';
import {useEffect, useRef, useState} from 'react';
import {SHIP_VARIANTS, type ShipVariantId} from '@/lib/ships';

/** The two settings rows, reused by the desktop popover and the mobile menu. */
export function SettingsControls({
  shipMinigameEnabled,
  onToggleShipMinigame,
  onReplayTour,
  interceptorUnlocked = false,
  equippedShip = 'default',
  onEquipShip = () => {},
}: {
  shipMinigameEnabled: boolean;
  onToggleShipMinigame: () => void;
  onReplayTour: () => void;
  interceptorUnlocked?: boolean;
  equippedShip?: ShipVariantId;
  onEquipShip?: (id: ShipVariantId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={shipMinigameEnabled}
        aria-label="Ship mini-game"
        onClick={onToggleShipMinigame}
        className="flex items-center justify-between gap-3 rounded-xl border border-[#21e6ff]/40 bg-[#0a0a1f]/60 px-3 py-2.5 text-left text-sm text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        <span>🚀 Ship mini-game</span>
        <span className={`font-display text-[11px] ${shipMinigameEnabled ? 'text-cyan-200' : 'text-[#9fb6cf]'}`}>
          {shipMinigameEnabled ? 'On' : 'Off'}
        </span>
      </button>
      <button
        type="button"
        onClick={onReplayTour}
        className="rounded-xl border border-[#21e6ff]/40 bg-[#0a0a1f]/60 px-3 py-2.5 text-left text-sm text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ↻ Replay walkthrough
      </button>

      {/* Ship switcher — intentionally does NOT close the popover, so the player can toggle/compare. Shown only once unlocked. */}
      {interceptorUnlocked && (
        <div className="rounded-xl border border-[#21e6ff]/40 bg-[#0a0a1f]/60 px-3 py-2.5">
          <div className="mb-1.5 font-display text-[10px] uppercase tracking-[1.5px] text-[#7fb0c9]">Ship</div>
          <div className="flex gap-2">
            {SHIP_VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={equippedShip === v.id}
                onClick={() => onEquipShip(v.id)}
                className={`flex-1 rounded-lg border px-2 py-2 text-xs font-display ${
                  equippedShip === v.id
                    ? 'border-[#21e6ff] bg-[#21e6ff]/15 text-cyan-100'
                    : 'border-[#21e6ff]/40 text-[#9fb6cf]'
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300`}
              >
                {v.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Desktop-only ⚙ button + popover wrapping SettingsControls (desktop has no ☰). */
export function SettingsMenu(props: {
  shipMinigameEnabled: boolean;
  onToggleShipMinigame: () => void;
  onReplayTour: () => void;
  interceptorUnlocked?: boolean;
  equippedShip?: ShipVariantId;
  onEquipShip?: (id: ShipVariantId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#21e6ff]/50 bg-[#0a0a1f]/60 text-lg text-[#9fe9ff] shadow-[0_0_14px_rgba(33,230,255,.3)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        ⚙
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-40 w-60 rounded-2xl border border-[#21e6ff]/40 bg-[#08081a]/95 p-3 shadow-[0_0_30px_rgba(33,230,255,.3)] backdrop-blur-md">
          <SettingsControls
            shipMinigameEnabled={props.shipMinigameEnabled}
            onToggleShipMinigame={props.onToggleShipMinigame}
            onReplayTour={() => {
              setOpen(false);
              props.onReplayTour();
            }}
            interceptorUnlocked={props.interceptorUnlocked}
            equippedShip={props.equippedShip}
            onEquipShip={props.onEquipShip}
          />
        </div>
      )}
    </div>
  );
}
