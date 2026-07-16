'use client';

import { Type, Trophy, Users, Sparkles } from 'lucide-react';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { computeTextBoxCm } from '@/lib/canvas/textSizing';
import { measureInkCoverageRatio } from '@/lib/canvas/measureText';
import { estimateTextStitches } from '@/lib/embroidery/estimateStitches';
import { AVAILABLE_FONTS } from '@/config/fonts';
import type { PrintArea, PrintView, TextElement } from '@/types';

interface Template {
  id: string;
  label: string;
  description: string;
  icon: typeof Type;
  view: PrintView;
  fontSizeRatio: number;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  placeholder: string;
}

const TEMPLATES: Template[] = [
  {
    id: 'brand-chest',
    label: 'Firmenname – Brust',
    description: 'Dezent, mittig auf der Brust',
    icon: Type,
    view: 'front',
    fontSizeRatio: 0.28,
    bold: false,
    align: 'center',
    placeholder: 'Euer Firmenname',
  },
  {
    id: 'slogan-back',
    label: 'Slogan – Rückendruck',
    description: 'Groß und auffällig auf dem Rücken',
    icon: Sparkles,
    view: 'back',
    fontSizeRatio: 0.5,
    bold: true,
    align: 'center',
    placeholder: 'EUER SLOGAN',
  },
  {
    id: 'jersey-number',
    label: 'Trikot-Nummer',
    description: 'Groß, fett, sportlich – Rückseite',
    icon: Trophy,
    view: 'back',
    fontSizeRatio: 0.85,
    bold: true,
    align: 'center',
    placeholder: '07',
  },
  {
    id: 'team-name',
    label: 'Team-/Vorname',
    description: 'Klein, dezent auf der Brust',
    icon: Users,
    view: 'front',
    fontSizeRatio: 0.18,
    bold: false,
    align: 'center',
    placeholder: 'Max Mustermann',
  },
];

interface TemplateToolPanelProps {
  printAreas: PrintArea[];
  onApplied: (view: PrintView) => void;
}

export function TemplateToolPanel({ printAreas, onApplied }: TemplateToolPanelProps) {
  const addElement = useConfiguratorStore((s) => s.addElement);
  const setActiveView = useConfiguratorStore((s) => s.setActiveView);
  const setSelectedElementId = useConfiguratorStore((s) => s.setSelectedElementId);

  function applyTemplate(template: Template) {
    const area = printAreas.find((a) => a.view === template.view);
    if (!area) return;

    const fontSizePx = Math.max(10, Math.round(area.maxHeightCm * 8 * template.fontSizeRatio));
    let box = computeTextBoxCm(template.placeholder, AVAILABLE_FONTS[0], fontSizePx, template.bold, false, area);

    let finalFontSizePx = fontSizePx;
    if (box.widthCm > area.maxWidthCm * 0.92) {
      const scale = (area.maxWidthCm * 0.92) / box.widthCm;
      finalFontSizePx = Math.max(8, Math.round(fontSizePx * scale));
      box = computeTextBoxCm(template.placeholder, AVAILABLE_FONTS[0], finalFontSizePx, template.bold, false, area);
    }

    const inkRatio = measureInkCoverageRatio(template.placeholder, AVAILABLE_FONTS[0], finalFontSizePx, template.bold, false);

    const element: TextElement = {
      id: crypto.randomUUID(),
      type: 'text',
      view: template.view,
      xCm: (area.movementWidthCm - box.widthCm) / 2,
      yCm: (area.referenceGarmentHeightCm - box.heightCm) / 2,
      widthCm: box.widthCm,
      heightCm: box.heightCm,
      rotationDeg: 0,
      isOutOfBounds: false,
      extraPrice: 0,
      name: template.placeholder,
      locked: false,
      hidden: false,
      content: template.placeholder,
      fontFamily: AVAILABLE_FONTS[0],
      fontSizePx: finalFontSizePx,
      color: '#000000',
      bold: template.bold,
      italic: false,
      align: template.align,
      letterSpacing: 0,
      lineHeight: 1.2,
      hasShadow: false,
      hasOutline: false,
      outlineColor: '#ffffff',
      inkCoverageRatio: inkRatio,
      estimatedStitches: estimateTextStitches(box.widthCm * box.heightCm, inkRatio),
    };

    addElement(element);
    setActiveView(template.view);
    setSelectedElementId(element.id);
    onApplied(template.view);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-brand/50">
        Vorlage anklicken, dann euren eigenen Text eintragen (Position &amp; Größe sind schon passend gesetzt).
      </p>
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          const available = printAreas.some((a) => a.view === template.view);
          return (
            <button
              key={template.id}
              type="button"
              disabled={!available}
              onClick={() => applyTemplate(template)}
              className="flex flex-col items-start gap-1 rounded-lg border border-gold/20 bg-white p-2.5 text-left transition-colors hover:border-gold hover:bg-gold-light/20 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Icon className="h-4 w-4 text-gold-dark" />
              <span className="text-xs font-medium text-brand">{template.label}</span>
              <span className="text-[10px] text-brand/50">{template.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
