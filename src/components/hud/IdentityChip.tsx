'use client';

/**
 * Identity tag pinned top-left of the compact HUD. A button: tapping it opens the
 * résumé view (also a walkthrough target via data-tour="name"). Mirrors the
 * desktop name chip in Hud.tsx. MobileHud renders it only while flying.
 */
export function IdentityChip({onOpenResume}: {onOpenResume: () => void}) {
  return (
    <button
      type="button"
      data-tour="name"
      onClick={onOpenResume}
      aria-label="Malachi Tzuoo — view résumé"
      className="pointer-events-auto fixed left-[calc(12px+env(safe-area-inset-left))] top-[calc(12px+env(safe-area-inset-top))] z-30 rounded-[14px] border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-3 py-2 text-left shadow-[0_0_18px_rgba(33,230,255,.35)] backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
    >
      <div className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-sm font-black leading-tight tracking-wide text-transparent">
        MALACHI TZUOO
      </div>
      <div className="mt-0.5 text-[10px] font-medium leading-tight tracking-wide text-[#9fb6cf]">
        LV.26 · SOFTWARE ENGINEER
      </div>
    </button>
  );
}
