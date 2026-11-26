'use client';

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Eye, ScanSearch } from 'lucide-react';
import clsx from 'clsx';
import { useLanguageStore, translate } from '@/stores/languageStore';

interface CanvasToolbarProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPreview: () => void;
  /** Lupe ist eingeschaltet (und wirkt: nur mit Motiv in der Ansicht). */
  lupeAn: boolean;
  /** Es liegt ein sichtbares Motiv in der aktuellen Ansicht – ohne Motiv gibt es nichts zu prüfen, der Knopf ist dann aus. */
  lupeMoeglich: boolean;
  onLupeToggle: () => void;
}

export function CanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPreview,
  lupeAn,
  lupeMoeglich,
  onLupeToggle,
}: CanvasToolbarProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/20 bg-white px-2 py-1.5 shadow-sm">
      <div className="flex items-center gap-1">
        <ToolbarButton title={t('canvas_undo')} onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title={t('canvas_redo')} onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        {/* Lupe: schaltet die runde Vergrößerungslinse über der Vorschau ein/aus (siehe VorschauLupe.tsx). Immer da, damit die
            Werkzeugleiste nicht springt; ohne Motiv in der Ansicht ausgegraut, mit Erklärung im Tooltip.
            Steht in der ersten Gruppe, weil dort auf dem Handy Platz ist: Die zweite Gruppe (Zoom + Großansicht) füllt die
            Zeile schon (Messung 375 px: Mit dem Knopf dort lief sie über den Kartenrand und die Seite scrollte waagerecht).
            data-lupe-tasten: Mit dem Fokus auf diesem Knopf bewegen die Pfeiltasten die Linse statt des Motivs. */}
        <button
          type="button"
          data-lupe-schalter
          data-lupe-tasten
          onClick={onLupeToggle}
          disabled={!lupeMoeglich}
          aria-pressed={lupeMoeglich && lupeAn}
          title={!lupeMoeglich ? t('canvas_lupe_ohne_motiv') : lupeAn ? t('canvas_lupe_title_aus') : t('canvas_lupe_title')}
          className={clsx(
            'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
            lupeMoeglich && lupeAn
              ? 'border-gold-dark bg-gold-light text-gold-dark'
              : 'border-gold/30 text-gold-dark hover:bg-gold-light',
            !lupeMoeglich && 'cursor-not-allowed opacity-40 hover:bg-transparent'
          )}
        >
          <ScanSearch className="h-3.5 w-3.5" aria-hidden />
          {t('canvas_lupe')}
        </button>
      </div>

      <div className="flex items-center gap-1">
        <ToolbarButton title={t('canvas_zoom_out')} onClick={onZoomOut} disabled={zoom <= 0.5}>
          <ZoomOut className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="w-10 text-center text-xs tabular-nums text-brand/70">
          {Math.round(zoom * 100)}%
        </span>
        <ToolbarButton title={t('canvas_zoom_in')} onClick={onZoomIn} disabled={zoom >= 2.5}>
          <ZoomIn className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title={t('canvas_zoom_reset')} onClick={onZoomReset}>
          <Maximize2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <div className="mx-1 h-4 w-px bg-gray-200" />
        <button
          type="button"
          onClick={onOpenPreview}
          title={t('canvas_large_preview_title')}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gold-dark hover:bg-gold-light"
        >
          <Eye className="h-3.5 w-3.5" />
          {t('canvas_large_preview')}
        </button>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="rounded-md p-2.5 text-brand/70 transition-colors lg:p-1.5 hover:bg-cream hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
