'use client';
import {PLANETS} from '@/data/planets';
import type {NavState, NavAction} from '@/lib/navigation';
import {StarmapLegend} from './StarmapLegend';
import {DetailPanel} from './DetailPanel';
import {SettingsMenu} from './SettingsMenu';

/**
 * Full DOM overlay HUD (rendered as a sibling of <Canvas>, NOT inside it).
 * Name/level/cert chips, starmap legend, bottom control bar, camera-angle view
 * button, boost hint, and a skip-to-resume button. The control bar / labels /
 * speed hint hide while landed (only the DetailPanel shows). Styling ported from
 * the prototype's `.topbar` / `.controls` / `.detail`.
 */
export function Hud({
  nav,
  dispatch,
  onSkip,
  boost = false,
  shipMinigameEnabled = true,
  onToggleShipMinigame = () => {},
  onReplayTour = () => {},
}: {
  nav: NavState;
  dispatch: React.Dispatch<NavAction>;
  onSkip: () => void;
  /** Reflects the live Shift-boost state for the speed hint. */
  boost?: boolean;
  shipMinigameEnabled?: boolean;
  onToggleShipMinigame?: () => void;
  onReplayTour?: () => void;
}) {
  const n = PLANETS.length;
  const atFirst = nav.current === 0;
  const atLast = nav.current === n - 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Top bar: name chips (left) + legend (right). Hidden while landed. */}
      <div
        className={`absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 px-5 transition-opacity duration-300 ${
          nav.landed ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-[14px] border border-[#21e6ff]/50 bg-[#0a0a1f]/60 px-4 py-[10px] shadow-[0_0_18px_rgba(33,230,255,.35)] backdrop-blur-md">
          <button
            type="button"
            data-tour="name"
            onClick={onSkip}
            aria-label="Malachi Tzuoo — view résumé"
            className="bg-gradient-to-r from-[#21e6ff] to-[#ff3df0] bg-clip-text font-display text-base font-black tracking-wide text-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            MALACHI TZUOO
          </button>
          <Chip>LV.26</Chip>
          <Chip>CLASS · SOFTWARE ENGINEER</Chip>
          <Chip>🛰 AWS CERTIFIED</Chip>
        </div>
        <div className="pointer-events-auto flex items-start gap-2">
          <div data-tour="menu">
            <StarmapLegend nav={nav} dispatch={dispatch} />
          </div>
          <SettingsMenu
            key={nav.landed ? 'landed' : 'flying'}
            shipMinigameEnabled={shipMinigameEnabled}
            onToggleShipMinigame={onToggleShipMinigame}
            onReplayTour={onReplayTour}
          />
        </div>
      </div>

      {/* Boost hint. Hidden while landed. */}
      <div
        className={`absolute bottom-[66px] left-[22px] font-display text-[10px] tracking-wide transition-opacity duration-300 ${
          nav.landed ? 'opacity-0' : ''
        } ${
          boost
            ? 'text-white opacity-100 [text-shadow:0_0_12px_#ff3df0]'
            : 'text-[#21e6ff] opacity-80 [text-shadow:0_0_8px_rgba(33,230,255,.6)]'
        }`}
      >
        ⇧ HOLD <b className="text-white">SHIFT</b> — BOOST SPEED
      </div>

      {/* Bottom control bar. Hidden while landed. */}
      <div
        inert={nav.landed || undefined}
        aria-hidden={nav.landed}
        className={`absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-[10px] px-[22px] pb-[18px] pt-3 transition-opacity duration-300 ${
          nav.landed ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
        }`}
      >
        <CtrlButton onClick={() => dispatch({type: 'prev', n})} disabled={atFirst}>
          ◀ INWARD
        </CtrlButton>
        <CtrlButton land dataTour="land" onClick={() => dispatch({type: 'land'})}>
          LAND ▾
        </CtrlButton>
        <CtrlButton dataTour="fly" onClick={() => dispatch({type: 'next', n})} disabled={atLast}>
          OUTWARD ▶
        </CtrlButton>

        {/* Camera angle caption above the view button */}
        <span className="inline-flex flex-col items-center gap-[3px]">
          <span className="whitespace-nowrap font-display text-[9px] tracking-wide text-[#21e6ff] opacity-65 [text-shadow:0_0_6px_rgba(33,230,255,.5)]">
            CAMERA ANGLE · V
          </span>
          <CtrlButton dataTour="camera" onClick={() => dispatch({type: 'cyclePreset'})}>
            👁 {nav.preset}
          </CtrlButton>
        </span>

        <span className="text-xs opacity-65">
          ← → fly &nbsp;·&nbsp; Enter/↑ land &nbsp;·&nbsp; V cycles view &nbsp;·&nbsp; drag to look
        </span>

        <CtrlButton className="ml-auto" onClick={onSkip}>
          📄 RESUME VIEW
        </CtrlButton>
      </div>

      {/* Landed detail panel */}
      <DetailPanel nav={nav} onTakeOff={() => dispatch({type: 'takeOff'})} />
    </div>
  );
}

function Chip({children}: {children: React.ReactNode}) {
  return (
    <span className="rounded-full border border-[#21e6ff]/40 px-[9px] py-[3px] text-[11px] opacity-90">
      {children}
    </span>
  );
}

function CtrlButton({
  children,
  onClick,
  disabled,
  land,
  dataTour,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  land?: boolean;
  dataTour?: string;
  /** Extra utility classes (e.g. `ml-auto` to push the button to the right). */
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      data-tour={dataTour}
      className={`pointer-events-auto rounded-xl border px-4 py-3 font-display text-[13px] font-bold text-[#e7f6ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-default disabled:opacity-35 disabled:shadow-none ${
        land
          ? 'border-[#ff3df0] bg-gradient-to-r from-[#ff3df0]/30 to-[#21e6ff]/30 text-white shadow-[0_0_16px_#ff3df0]'
          : 'border-[#21e6ff]/50 bg-[#0a0a1f]/60 shadow-[0_0_14px_rgba(33,230,255,.3)]'
      } ${className}`}
    >
      {children}
    </button>
  );
}
