'use client';

import { useRef, useState } from 'react';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { AVAILABLE_FONTS } from '@/config/fonts';
import { computeTextBoxCm } from '@/lib/canvas/textSizing';
import { measureInkCoverageRatio } from '@/lib/canvas/measureText';
import { estimateTextStitches } from '@/lib/embroidery/estimateStitches';
import type { PrintArea, TextElement } from '@/types';

interface TextToolPanelProps {
  printArea: PrintArea | null;
  /** Wird nach dem Hinzufügen aufgerufen – schaltet z.B. auf den Design-Tab um,
   *  wo sich das neue Element sofort bearbeiten lässt. */
  onElementAdded?: () => void;
}

export function TextToolPanel({ printArea, onElementAdded }: TextToolPanelProps) {
  const [value, setValue] = useState('');
  const isAddingRef = useRef(false);
  const activeView = useConfiguratorStore((s) => s.activeView);
  const addElement = useConfiguratorStore((s) => s.addElement);
  const setSelectedElementId = useConfiguratorStore((s) => s.setSelectedElementId);

  function handleAdd() {
    const content = value.trim();
    if (!content || !printArea) return;
    // Schutz gegen versehentliches Mehrfach-Erstellen bei schnellem
    // Doppelklick: solange eine Erstellung "in Bearbeitung" ist (bis der
    // Klick-Handler durchgelaufen und value geleert ist), wird ein
    // weiterer Klick ignoriert.
    if (isAddingRef.current) return;
    isAddingRef.current = true;

    // Startgröße der Schrift an den Druckbereich anpassen (grobe Schätzung),
    // dann die tatsächliche Box aus den echten Textmetriken berechnen –
    // die Box entspricht danach IMMER dem sichtbaren Text, nie einer
    // willkürlich größeren Fläche (siehe computeTextBoxCm).
    let fontSizePx = Math.min(32, Math.max(14, Math.round(printArea.maxHeightCm * 8)));
    let box = computeTextBoxCm(content, AVAILABLE_FONTS[0], fontSizePx, false, false, printArea);

    // Falls der Text bei dieser Schriftgröße breiter oder höher wäre als
    // der Druckbereich, Schriftgröße proportional verkleinern und neu messen.
    if (box.widthCm > printArea.maxWidthCm * 0.9 || box.heightCm > printArea.maxHeightCm * 0.9) {
      const scale = Math.min(
        (printArea.maxWidthCm * 0.9) / box.widthCm,
        (printArea.maxHeightCm * 0.9) / box.heightCm
      );
      fontSizePx = Math.max(8, Math.round(fontSizePx * scale));
      box = computeTextBoxCm(content, AVAILABLE_FONTS[0], fontSizePx, false, false, printArea);
    }

    const inkCoverageRatio = measureInkCoverageRatio(content, AVAILABLE_FONTS[0], fontSizePx, false, false);

    const element: TextElement = {
      id: crypto.randomUUID(),
      type: 'text',
      view: activeView,
      xCm: (printArea.movementWidthCm - box.widthCm) / 2,
      yCm: (printArea.referenceGarmentHeightCm - box.heightCm) / 2,
      widthCm: box.widthCm,
      heightCm: box.heightCm,
      rotationDeg: 0,
      isOutOfBounds: false,
      extraPrice: 0,
      name: content,
      locked: false,
      hidden: false,
      content,
      fontFamily: AVAILABLE_FONTS[0],
      fontSizePx,
      color: '#000000',
      bold: false,
      italic: false,
      align: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      hasShadow: false,
      hasOutline: false,
      outlineColor: '#ffffff',
      inkCoverageRatio,
      estimatedStitches: estimateTextStitches(box.widthCm * box.heightCm, inkCoverageRatio),
    };

    addElement(element);
    setSelectedElementId(element.id);
    setValue('');
    onElementAdded?.();
    isAddingRef.current = false;
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          placeholder="Text eingeben …"
          className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!value.trim() || !printArea}
          className="rounded bg-gold px-3 py-1.5 text-sm text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Hinzufügen
        </button>
      </div>
      {!printArea && (
        <p className="text-xs text-amber-600">Für diese Ansicht ist kein Druckbereich definiert.</p>
      )}
      <p className="text-xs text-gray-400">
        Nach dem Hinzufügen wechselt die Ansicht automatisch zu „Design" – dort lassen sich
        Schriftart, Größe, Farbe, Fett/Kursiv, Ausrichtung u.v.m. anpassen.
      </p>
    </div>
  );
}
