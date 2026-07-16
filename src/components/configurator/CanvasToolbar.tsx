'use client';

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Eye } from 'lucide-react';
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
}: CanvasToolbarProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-gold/15 bg-white px-2 py-1.5 shadow-sm">
      <div className="flex items-center gap-1">
        <ToolbarButton title={t('canvas_undo')} onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title={t('canvas_redo')} onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      <div className="flex items-center gap-1">
        <ToolbarButton title={t('canvas_zoom_out')} onClick={onZoomOut} disabled={zoom <= 0.5}>
          <ZoomOut className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="w-10 text-center text-xs tabular-nums text-brand/60">
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
          className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gold-dark hover:bg-gold-light"
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
      className="rounded p-1.5 text-brand/60 transition-colors hover:bg-cream hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
