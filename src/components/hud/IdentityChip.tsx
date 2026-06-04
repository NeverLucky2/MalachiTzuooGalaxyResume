'use client';

/**
 * Display-only identity pill pinned top-left of the compact HUD, so a visitor
 * knows whose site this is without opening the ☰ menu. Mirrors the desktop name
 * chip (see Hud.tsx). Non-interactive (pointer-events-none) so it never captures
 * a drag-to-look gesture; MobileHud renders it only while flying (hidden on land).
 */
export function IdentityChip() {
  return (
    <div className="pointer-events-none fixed left-[calc(12px+env(safe-area-inset-left))] top-[calc(12px+env(safe-area-inset-top))] z-30 rounded-[14px] border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-3 py-2 shadow-[0_0_18px_rgba(33,230,255,.35)] backdrop-blur-md">
      <div className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-sm font-black leading-tight tracking-wide text-transparent">
        MALACHI TZUOO
      </div>
      <div className="mt-0.5 text-[10px] font-medium leading-tight tracking-wide text-[#9fb6cf]">
        LV.26 · SOFTWARE ENGINEER
      </div>
    </div>
  );
}
