import { downloadProductionFile } from '@/lib/supabase/storage';
import type { OrderElementRecord } from '@/lib/actions/orderTypes';
import type { RenderableElement } from './types';

/**
 * Wandelt einen persistierten OrderElementRecord in ein RenderableElement
 * um – lädt für Logos die tatsächlich angezeigte Bild-Datei aus Storage
 * herunter (Fallback auf die Original-Datei bei älteren Datensätzen aus
 * der Zeit vor Migration 0003, die noch kein `logoDisplayStoragePath`
 * hatten). Bewusst hier und nicht in renderPrintView() selbst, damit
 * Letzteres eine reine Funktion ohne Supabase-Zugriff bleibt (siehe
 * renderPrintView.ts-Kommentar zur späteren Reprint-Wiederverwendbarkeit).
 */
export async function toRenderableElement(el: OrderElementRecord): Promise<RenderableElement> {
  const base = {
    view: el.view,
    xCm: el.xCm,
    yCm: el.yCm,
    widthCm: el.widthCm,
    heightCm: el.heightCm,
    rotationDeg: el.rotationDeg,
  };

  if (el.type === 'logo') {
    const storagePath = el.logoDisplayStoragePath ?? el.logoStoragePath;
    if (!storagePath) {
      throw new Error('Logo-Element ohne logoDisplayStoragePath/logoStoragePath kann nicht gerendert werden.');
    }
    const imageBuffer = await downloadProductionFile(storagePath);
    return { ...base, type: 'logo', imageBuffer };
  }

  return {
    ...base,
    type: 'text',
    content: el.content ?? '',
    fontFamily: el.fontFamily ?? 'Arial',
    fontSizePx: el.fontSizePx ?? 32,
    color: el.color ?? '#000000',
    bold: el.bold ?? false,
    italic: el.italic ?? false,
    align: (el.align as 'left' | 'center' | 'right' | undefined) ?? 'center',
    letterSpacing: el.letterSpacing ?? 0,
    lineHeight: el.lineHeight ?? 1.2,
    hasShadow: el.hasShadow ?? false,
    hasOutline: el.hasOutline ?? false,
    outlineColor: el.outlineColor ?? '#ffffff',
  };
}
