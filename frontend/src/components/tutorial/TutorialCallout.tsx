import type { ReactNode } from 'react';
import type { CalloutSide, TutorialStep } from './tutorialSteps';
import { TOTAL_STEPS } from './tutorialSteps';
import { useLanguage } from '../../i18n/LanguageContext';

interface TutorialCalloutProps {
  step: TutorialStep;
  stepIndex: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onSkip: () => void;
  onPlayNow: () => void;
  stepError?: string | null;
  children?: ReactNode;
}

/** Parse **bold** markdown into spans */
function parseBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const CALLOUT_W = 296; // px
const CALLOUT_GAP = 12; // px gap between spotlight edge and callout
const EST_H = 250;      // estimated callout height
const MARGIN = 8;       // keep inside viewport

function sideFits(side: CalloutSide, r: DOMRect): boolean {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  switch (side) {
    case 'above': return r.top    - CALLOUT_GAP - EST_H  >= MARGIN;
    case 'below': return r.bottom + CALLOUT_GAP + EST_H  <= vh - MARGIN;
    case 'left':  return r.left   - CALLOUT_GAP - CALLOUT_W >= MARGIN;
    case 'right': return r.right  + CALLOUT_GAP + CALLOUT_W <= vw - MARGIN;
  }
}

function computeCalloutStyle(
  targetRect: DOMRect | null,
  preferredSide: CalloutSide,
  topRight?: boolean,
  topLeft?: boolean,
): React.CSSProperties {
  if (topRight) {
    return {
      position: 'fixed',
      top: `${MARGIN}px`,
      right: `${MARGIN}px`,
      width: `${Math.min(CALLOUT_W, window.innerWidth - MARGIN * 2)}px`,
      zIndex: 50,
    };
  }
  if (topLeft) {
    return {
      position: 'fixed',
      top: `${MARGIN}px`,
      left: `${MARGIN}px`,
      width: `${Math.min(CALLOUT_W, window.innerWidth - MARGIN * 2)}px`,
      zIndex: 50,
    };
  }
  const centreScreen: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${Math.min(CALLOUT_W, window.innerWidth - MARGIN * 2)}px`,
    zIndex: 50,
  };

  if (!targetRect) return centreScreen;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Centre helpers
  const centreH = Math.max(MARGIN, Math.min(
    targetRect.left + targetRect.width / 2 - CALLOUT_W / 2,
    vw - CALLOUT_W - MARGIN,
  ));
  const centreV = Math.max(MARGIN, Math.min(
    targetRect.top + targetRect.height / 2 - EST_H / 2,
    vh - EST_H - MARGIN,
  ));

  // Try preferred side, then opposite, then below, then above, then fallback
  const opposite: CalloutSide = preferredSide === 'above' ? 'below'
    : preferredSide === 'below' ? 'above'
    : preferredSide === 'left' ? 'right' : 'left';

  const order: CalloutSide[] = [preferredSide, opposite, 'below', 'above', 'right', 'left'];
  const deduped = order.filter((s, i) => order.indexOf(s) === i);
  const chosen = deduped.find(s => sideFits(s, targetRect));

  if (!chosen) return centreScreen; // nothing fits — centre on screen

  const base: React.CSSProperties = { position: 'fixed', width: `${CALLOUT_W}px`, zIndex: 50 };
  switch (chosen) {
    case 'above': return { ...base, left: `${centreH}px`, bottom: `${vh - targetRect.top + CALLOUT_GAP}px` };
    case 'below': return { ...base, left: `${centreH}px`, top: `${targetRect.bottom + CALLOUT_GAP}px` };
    case 'left':  return { ...base, right: `${vw - targetRect.left + CALLOUT_GAP}px`, top: `${centreV}px` };
    case 'right': return { ...base, left: `${targetRect.right + CALLOUT_GAP}px`, top: `${centreV}px` };
  }
}

export default function TutorialCallout({
  step,
  stepIndex,
  targetRect,
  onNext,
  onSkip,
  onPlayNow,
  stepError,
  children,
}: TutorialCalloutProps) {
  const { t } = useLanguage();

  const isLastStep = stepIndex === TOTAL_STEPS - 1;
  const isInteractive = step.type === 'interactive';

  const title = t(step.titleKey);
  const body  = t(step.bodyKey);

  const calloutStyle = computeCalloutStyle(targetRect, step.calloutSide, step.calloutTopRight, step.calloutTopLeft);

  return (
    <div style={calloutStyle}>
      <div className="bg-gradient-to-br from-indigo-700 to-purple-900 rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-white/60 transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-white/50 text-[10px] font-semibold uppercase tracking-wider">
                {t('tutorial.step')} {stepIndex + 1} / {TOTAL_STEPS}
              </span>
              <h3 className="text-white font-bold text-base leading-snug mt-0.5">{title}</h3>
            </div>
            <button
              onClick={onSkip}
              className="flex-shrink-0 text-white/40 hover:text-white/70 text-xs transition-colors mt-1"
            >
              {t('tutorial.skipTutorial')}
            </button>
          </div>

          {/* Body text */}
          <p className="text-white/85 text-sm leading-relaxed mb-3">
            {parseBold(body)}
          </p>

          {/* Error slot */}
          {stepError && (
            <div className="bg-amber-500/25 border border-amber-400/40 text-amber-200 text-xs px-2.5 py-1.5 rounded-lg mb-2">
              {stepError}
            </div>
          )}

          {/* BidInput slot */}
          {children && (
            <div className="mb-3">
              {children}
            </div>
          )}

          {/* Footer */}
          {isLastStep ? (
            <button
              onClick={onPlayNow}
              className="w-full py-2.5 text-white font-extrabold text-sm rounded-xl btn-3d-accent"
            >
              {t('tutorial.playNow')}
            </button>
          ) : isInteractive ? null : (
            <button
              onClick={onNext}
              className="w-full py-2 text-white font-semibold text-sm rounded-xl btn-glass"
            >
              {t('tutorial.next')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
