'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
}

const TOOLTIP_WIDTH = 224; // px, entspricht w-56
const VIEWPORT_MARGIN = 8; // Mindestabstand zum Bildschirmrand

/**
 * Kleines "i"-Icon, das bei Hover/Tap eine Sprechblase mit Erklärtext
 * einblendet.
 *
 * WICHTIG: Die Sprechblase wird über ein Portal direkt in <body> gerendert
 * (nicht mehr `absolute` innerhalb der Komponente selbst). Grund: Vorher
 * wurde sie vom nächsten Vorfahren-Element mit `overflow-hidden`
 * abgeschnitten (z.B. abgerundete Karten/Panels) – in einer schmalen
 * Seitenleiste ragte die Sprechblase dadurch über den Rand hinaus und
 * wurde dort hart gekappt, statt sich anzupassen. Die Position wird jetzt
 * per JavaScript aus der tatsächlichen Bildschirmposition des Icons
 * berechnet und immer innerhalb des sichtbaren Bereichs gehalten.
 */
export function InfoTooltip({ text }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; showBelow: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN));

    const showBelow = rect.top < 90;
    const top = showBelow ? rect.bottom + 6 : rect.top - 6;

    setPosition({ top, left, showBelow });
  }

  function open() {
    updatePosition();
    setIsOpen(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={open}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            setIsOpen(false);
          } else {
            open();
          }
        }}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-brand/30 hover:text-gold-dark"
        aria-label="Mehr Informationen"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {isOpen &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              width: TOOLTIP_WIDTH,
              transform: position.showBelow ? undefined : 'translateY(-100%)',
            }}
            className="z-[100] rounded-lg bg-brand px-2.5 py-2 text-[11px] leading-relaxed text-white shadow-lg"
          >
            {text}
          </span>,
          document.body
        )}
    </>
  );
}
