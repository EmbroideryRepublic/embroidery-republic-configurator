'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import clsx from 'clsx';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { PrintArea, PrintView } from '@/types';

const ConfiguratorCanvas = dynamic(
  () => import('./ConfiguratorCanvas').then((m) => m.ConfiguratorCanvas),
  { ssr: false }
);

const VIEW_LABEL_KEYS: Record<PrintView, TranslationKey> = {
  front: 'view_front',
  back: 'view_back',
  sleeve_left: 'view_sleeve_left',
  sleeve_right: 'view_sleeve_right',
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

interface LargePreviewModalProps {
  imageUrls: Record<PrintView, string>;
  printAreas: PrintArea[];
  hasSleeves?: boolean;
  onClose: () => void;
}

/**
 * Zeigt das fertige Design großformatig OHNE Bearbeitungs-Overlays
 * (Druckbereich-Umriss, Auswahl-Griffe, Maßanzeige) – wie es tatsächlich
 * aussehen wird. Eigenständiger Ansichtswechsel innerhalb des Modals,
 * unabhängig von der Bearbeitungsansicht im Hintergrund.
 *
 * Zoom: der Vorschau-Bereich hat bereits `overflow-auto` – bei Zoomstufen
 * über 100% wird die Leinwand größer als ihr Container und lässt sich
 * dadurch ganz normal per Scrollen/Wischen verschieben (Panning), ohne
 * dass dafür eine eigene Drag-Logik nötig ist.
 */
export function LargePreviewModal({ imageUrls, printAreas, hasSleeves = true, onClose }: LargePreviewModalProps) {
  const storeActiveView = useConfiguratorStore((s) => s.activeView);
  const isSleeveView = storeActiveView === 'sleeve_left' || storeActiveView === 'sleeve_right';
  const initialView = !hasSleeves && isSleeveView ? 'front' : storeActiveView;
  const [previewView, setPreviewView] = useState<PrintView>(initialView);
  const [zoom, setZoom] = useState(1);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  const availableViews = hasSleeves
    ? (Object.keys(VIEW_LABEL_KEYS) as PrintView[])
    : (['front', 'back'] as PrintView[]);

  const printArea = printAreas.find((a) => a.view === previewView) ?? null;

  function handleViewChange(view: PrintView) {
    setPreviewView(view);
    setZoom(1); // Beim Ansichtswechsel Zoom zurücksetzen, sonst startet man ggf. mitten in der neuen Ansicht verschoben.
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center bg-black/85 p-4">
      <div className="flex w-full max-w-3xl items-center justify-between py-2">
        <div className="flex gap-2">
          {availableViews.map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => handleViewChange(view)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                previewView === view ? 'bg-gold text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
              )}
            >
              {t(VIEW_LABEL_KEYS[view])}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-1 py-1">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
              className="rounded-full p-1.5 text-white hover:bg-white/20 disabled:opacity-30"
              title={t('canvas_zoom_out')}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-xs tabular-nums text-white/80">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              className="rounded-full p-1.5 text-white hover:bg-white/20 disabled:opacity-30"
              title={t('canvas_zoom_in')}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="rounded-full p-1.5 text-white hover:bg-white/20"
              title={t('canvas_zoom_reset')}
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            title="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {zoom > 1 && (
        <p className="pb-1 text-xs text-white/50">Zum Verschieben innerhalb des Bildes scrollen/wischen</p>
      )}

      <div className="flex flex-1 items-center justify-center overflow-auto">
        <ConfiguratorCanvas
          productImageUrl={imageUrls[previewView]}
          printArea={printArea}
          hideGuides
          viewOverride={previewView}
          zoom={zoom}
        />
      </div>
    </div>
  );
}
