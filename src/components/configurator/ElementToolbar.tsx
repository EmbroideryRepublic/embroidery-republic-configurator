'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { AVAILABLE_FONTS } from '@/config/fonts';
import { THREAD_COLORS } from '@/config/threadColors';
import { computeTextBoxCm } from '@/lib/canvas/textSizing';
import { measureInkCoverageRatio } from '@/lib/canvas/measureText';
import { estimateTextStitches } from '@/lib/embroidery/estimateStitches';
import { removeSimpleBackground } from '@/lib/upload/backgroundRemoval';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { LogoElement, PrintArea, TextElement } from '@/types';

const POSITION_PRESETS: { labelKey: 'element_position_top_center' | 'element_position_center' | 'element_position_bottom_center'; x: number; y: number }[] = [
  { labelKey: 'element_position_top_center', x: 0.5, y: 0.08 },
  { labelKey: 'element_position_center', x: 0.5, y: 0.5 },
  { labelKey: 'element_position_bottom_center', x: 0.5, y: 0.85 },
];

// Schnellauswahl für Textfarbe bei DTF (Feinabstimmung bleibt über den
// nativen Farbregler direkt darüber möglich).
const QUICK_COLORS: { name: string; hex: string }[] = [
  { name: 'Schwarz', hex: '#000000' },
  { name: 'Weiß', hex: '#ffffff' },
  { name: 'Rot', hex: '#dc2626' },
  { name: 'Orange', hex: '#ea580c' },
  { name: 'Gelb', hex: '#eab308' },
  { name: 'Grün', hex: '#16a34a' },
  { name: 'Blau', hex: '#2563eb' },
  { name: 'Lila', hex: '#7c3aed' },
  { name: 'Pink', hex: '#db2777' },
  { name: 'Grau', hex: '#6b7280' },
];

interface ElementToolbarProps {
  printArea: PrintArea | null;
}

export function ElementToolbar({ printArea }: ElementToolbarProps) {
  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const elements = useConfiguratorStore((s) => s.elements);
  const selectedElementId = useConfiguratorStore((s) => s.selectedElementId);
  const removeElement = useConfiguratorStore((s) => s.removeElement);
  const duplicateElement = useConfiguratorStore((s) => s.duplicateElement);
  const copyElement = useConfiguratorStore((s) => s.copyElement);
  const updateElement = useConfiguratorStore((s) => s.updateElement);
  const commitElement = useConfiguratorStore((s) => s.commitElement);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  const selected = elements.find((el) => el.id === selectedElementId);

  // Eingabefeld bekommt einen EIGENEN, sofort reagierenden State statt
  // direkt an die (teure) Maßberechnung gekoppelt zu sein. Vorher wurde
  // bei jedem Tastendruck synchron eine Canvas-Textmessung + Tinten-
  // Flächenberechnung ausgeführt – bei schneller Eingabe konnte das
  // spürbar hinterherhinken und wirkte wie "ein Zeichen zu spät". Die
  // eigentliche (teure) Aktualisierung wird jetzt um 200ms entprellt.
  const [textDraft, setTextDraft] = useState(selected?.type === 'text' ? selected.content : '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  useEffect(() => {
    if (selected?.type === 'text') {
      setTextDraft(selected.content);
    }
    // Nur beim Wechsel des ausgewählten Elements synchronisieren, nicht
    // bei jeder Content-Änderung (sonst würde der eigene Entwurf während
    // des Tippens durch den noch nicht aktualisierten Store-Wert
    // überschrieben).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  if (!selected) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 p-3 text-center text-xs text-gray-400">
        {t('element_none_selected')}
      </p>
    );
  }

  const isText = selected.type === 'text';

  function handleContentChange(value: string) {
    setTextDraft(value);
    // Inhalt UND Box/Position sofort aktualisieren (nicht verzögert!) –
    // Konva zeichnet den Text exakt innerhalb dieser Box. Eine Verzögerung
    // hier hätte zur Folge, dass frisch getippte Zeichen kurzzeitig (oder
    // bei schnellem Tippen dauerhaft) außerhalb der noch zu kleinen Box
    // landen und dadurch unsichtbar wirken. Nur die separate, reine
    // Preisberechnung (Tintenflächen-Messung) wird unten entkoppelt.
    updateText({ content: value }, { deferInkRatio: true });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateInkRatioOnly(value);
    }, 200);
  }

  function updateInkRatioOnly(content: string) {
    const current = selected as TextElement;
    if (!current || current.type !== 'text') return;
    const ratio = measureInkCoverageRatio(content, current.fontFamily, current.fontSizePx, current.bold, current.italic);
    updateElement(current.id, {
      inkCoverageRatio: ratio,
      estimatedStitches: estimateTextStitches(current.widthCm * current.heightCm, ratio),
    });
  }

  function updateText(changes: Partial<TextElement>, options?: { deferInkRatio?: boolean }) {
    const current = selected as TextElement;
    const textAffectingKeys: (keyof TextElement)[] = ['content', 'fontFamily', 'fontSizePx', 'bold', 'italic'];
    const affectsSize = Object.keys(changes).some((k) => textAffectingKeys.includes(k as keyof TextElement));

    if (!affectsSize || !printArea) {
      updateElement(current.id, changes);
      return;
    }

    try {
      const merged = { ...current, ...changes };
      let fontSizePx = merged.fontSizePx;
      let box = computeTextBoxCm(merged.content, merged.fontFamily, fontSizePx, merged.bold, merged.italic, printArea);

      // Text darf die angegebene Maximalgröße nie überschreiten – statt
      // stillschweigend über den Rand zu laufen, wird die Schriftgröße
      // automatisch passend verkleinert (nur beim Verkleinern-Bedarf,
      // manuelles Vergrößern über die Größe bleibt möglich, solange es
      // in den Bereich passt).
      if (box.widthCm > printArea.maxWidthCm || box.heightCm > printArea.maxHeightCm) {
        const scale = Math.min(printArea.maxWidthCm / box.widthCm, printArea.maxHeightCm / box.heightCm);
        fontSizePx = Math.max(6, fontSizePx * scale * 0.98); // 2% Puffer
        box = computeTextBoxCm(merged.content, merged.fontFamily, fontSizePx, merged.bold, merged.italic, printArea);
      }

      // Mittelpunkt beibehalten, damit der Text beim Skalieren/Ändern nicht
      // "wegspringt", sondern von seiner aktuellen Mitte aus wächst/schrumpft.
      const centerXCm = current.xCm + current.widthCm / 2;
      const centerYCm = current.yCm + current.heightCm / 2;
      const xCm = Math.max(0, Math.min(centerXCm - box.widthCm / 2, printArea.movementWidthCm - box.widthCm));
      const yCm = Math.max(0, Math.min(centerYCm - box.heightCm / 2, printArea.referenceGarmentHeightCm - box.heightCm));

      updateElement(current.id, {
        ...changes,
        fontSizePx,
        widthCm: box.widthCm,
        heightCm: box.heightCm,
        xCm,
        yCm,
        // Bei options.deferInkRatio (Live-Tippen) wird die teure
        // Pixel-für-Pixel-Messung NICHT hier, sondern entkoppelt in
        // updateInkRatioOnly() nachgeholt – sie beeinflusst nur die
        // Preisanzeige, nicht die sichtbare Darstellung, darf also ruhig
        // etwas nachlaufen, ohne dass Inhalt/Box davon betroffen sind.
        ...(options?.deferInkRatio
          ? {}
          : (() => {
              const ratio = measureInkCoverageRatio(
                merged.content,
                merged.fontFamily,
                merged.fontSizePx,
                merged.bold,
                merged.italic
              );
              return {
                inkCoverageRatio: ratio,
                estimatedStitches: estimateTextStitches(box.widthCm * box.heightCm, ratio),
              };
            })()),
      });
    } catch (err) {
      // Absicherung: falls die Größen-Neuberechnung aus irgendeinem Grund
      // fehlschlägt, soll die eigentliche Änderung (z.B. Farbe, Schriftart)
      // trotzdem ankommen, statt spurlos zu verpuffen – nur eben ohne
      // automatische Box-Anpassung.
      console.error('Textgrößen-Berechnung fehlgeschlagen, wende Änderung ohne Größenanpassung an:', err);
      updateElement(current.id, changes);
    }
  }

  function applyPreset(preset: { x: number; y: number }) {
    if (!printArea || !selected) return;
    const xCm = Math.max(0, preset.x * (printArea.movementWidthCm - selected.widthCm));
    const yCm = Math.max(0, preset.y * (printArea.referenceGarmentHeightCm - selected.heightCm));
    commitElement(selected.id, { xCm, yCm, isOutOfBounds: false });
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium">
          {isText ? (selected as TextElement).content || 'Text' : selected.type === 'logo' ? selected.fileName : ''}
        </span>
        {selected.isOutOfBounds && (
          <span className="whitespace-nowrap rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {t('element_out_of_bounds_badge')}
          </span>
        )}
        {selected.locked && (
          <span className="whitespace-nowrap rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {t('element_locked_badge')}
          </span>
        )}
      </div>

      {isText && (
        <div className="space-y-2 border-b border-gray-100 pb-3">
          <textarea
            value={textDraft}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={t('element_text_placeholder')}
            rows={2}
            className="w-full resize-y rounded border border-gray-300 px-2 py-1.5 text-sm"
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={(selected as TextElement).fontFamily ?? AVAILABLE_FONTS[0]}
              onChange={(e) => updateText({ fontFamily: e.target.value })}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>

            {printMethod === 'dtf' && (
              <input
                type="color"
                value={(selected as TextElement).color ?? '#000000'}
                onChange={(e) => updateText({ color: e.target.value })}
                className="h-9 w-full cursor-pointer rounded border border-gray-300"
                title="Textfarbe (Feinabstimmung)"
              />
            )}
          </div>

          {printMethod === 'dtf' && (
            <div>
              <p className="mb-1 text-xs text-gray-400">{t('element_quick_colors')}</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.name}
                    onClick={() => updateText({ color: c.hex })}
                    className={clsx(
                      'h-6 w-6 rounded-full border-2',
                      (selected as TextElement).color?.toLowerCase() === c.hex
                        ? 'border-brand-accent ring-2 ring-brand-accent/30'
                        : 'border-gray-200'
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    <span className="sr-only">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {printMethod === 'embroidery' && (
            <div>
              <p className="mb-1 text-xs text-gray-400">
                {t('element_thread_color')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {THREAD_COLORS.map((thread) => (
                  <button
                    key={thread.hex}
                    type="button"
                    title={thread.name}
                    onClick={() => updateText({ color: thread.hex })}
                    className={clsx(
                      'h-6 w-6 rounded-full border-2',
                      (selected as TextElement).color === thread.hex
                        ? 'border-brand-accent ring-2 ring-brand-accent/30'
                        : 'border-gray-200'
                    )}
                    style={{ backgroundColor: thread.hex }}
                  >
                    <span className="sr-only">{thread.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="mb-0.5 flex items-center justify-between text-xs text-gray-500">
              <span>{t('element_size')}</span>
              <span className="font-medium text-gray-700">
                {Math.round((selected as TextElement).fontSizePx ?? 32)} px
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={10}
                max={150}
                value={(selected as TextElement).fontSizePx ?? 32}
                onChange={(e) => updateText({ fontSizePx: Number(e.target.value) })}
                className="min-w-0 flex-1"
              />
              <input
                type="number"
                min={6}
                max={300}
                value={Math.round((selected as TextElement).fontSizePx ?? 32)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v) && v > 0) updateText({ fontSizePx: v });
                }}
                className="w-14 flex-shrink-0 rounded border border-gray-300 px-1 py-0.5 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateText({ bold: !(selected as TextElement).bold })}
              className={clsx(
                'h-8 flex-1 rounded border text-sm font-bold',
                (selected as TextElement).bold ? 'border-gold bg-gold text-white' : 'border-gray-300 text-gray-600'
              )}
              title={t('element_bold')}
            >
              F
            </button>
            <button
              type="button"
              onClick={() => updateText({ italic: !(selected as TextElement).italic })}
              className={clsx(
                'h-8 flex-1 rounded border text-sm italic',
                (selected as TextElement).italic ? 'border-gold bg-gold text-white' : 'border-gray-300 text-gray-600'
              )}
              title={t('element_italic')}
            >
              K
            </button>
          </div>

          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => updateText({ align })}
                className={clsx(
                  'min-w-0 flex-1 truncate rounded border py-1 text-xs',
                  (selected as TextElement).align === align
                    ? 'border-gold bg-gold text-white'
                    : 'border-gray-300 text-gray-600'
                )}
              >
                {align === 'left' ? t('element_align_left') : align === 'center' ? t('element_align_center') : t('element_align_right')}
              </button>
            ))}
          </div>

          {/* Erweiterte Textoptionen */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="text-xs text-gray-500">
              {t('element_letter_spacing')}
              <input
                type="range"
                min={-2}
                max={12}
                step={0.5}
                value={(selected as TextElement).letterSpacing ?? 0}
                onChange={(e) => updateText({ letterSpacing: Number(e.target.value) })}
                className="mt-0.5 w-full"
              />
            </label>
            <label className="text-xs text-gray-500">
              <span className="inline-flex items-center gap-1">
                {t('element_line_height')}
                <InfoTooltip text={t('element_line_height_hint')} />
              </span>
              <input
                type="range"
                min={0.8}
                max={2.2}
                step={0.1}
                value={(selected as TextElement).lineHeight ?? 1.2}
                onChange={(e) => updateText({ lineHeight: Number(e.target.value) })}
                className="mt-0.5 w-full"
              />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={(selected as TextElement).hasShadow ?? false}
                onChange={(e) => updateText({ hasShadow: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
              {t('element_shadow')}
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={(selected as TextElement).hasOutline ?? false}
                onChange={(e) => updateText({ hasOutline: e.target.checked })}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
              {t('element_outline')}
            </label>
            {(selected as TextElement).hasOutline && (
              <input
                type="color"
                value={(selected as TextElement).outlineColor ?? '#ffffff'}
                onChange={(e) => updateText({ outlineColor: e.target.value })}
                className="h-6 w-8 cursor-pointer rounded border border-gray-300"
                title={t('element_outline_color')}
              />
            )}
          </div>
        </div>
      )}

      {selected.type === 'logo' && (
        <div className="space-y-2 border-b border-gray-100 pb-3">
          <div className="flex items-start gap-3">
            <span className="flex min-w-0 flex-1 items-center gap-1 text-sm text-gray-600">
              {t('element_remove_bg')}
              <InfoTooltip text={t('element_remove_bg_hint')} />
            </span>
            <button
              type="button"
              disabled={isRemovingBg}
              onClick={async () => {
                const logo = selected as LogoElement;
                if (logo.backgroundRemoved) {
                  updateElement(logo.id, { fileUrl: logo.originalFileUrl, backgroundRemoved: false });
                  return;
                }
                setIsRemovingBg(true);
                try {
                  const cleaned = await removeSimpleBackground(logo.originalFileUrl);
                  updateElement(logo.id, { fileUrl: cleaned, backgroundRemoved: true });
                } catch {
                  setBgError('Freistellung fehlgeschlagen.');
                } finally {
                  setIsRemovingBg(false);
                }
              }}
              className={clsx(
                'relative h-6 w-11 flex-shrink-0 rounded-full transition-colors',
                (selected as LogoElement).backgroundRemoved ? 'bg-gold' : 'bg-gray-300'
              )}
            >
              <span
                className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
                style={{ left: (selected as LogoElement).backgroundRemoved ? '22px' : '2px' }}
              />
            </button>
          </div>
          {isRemovingBg && <p className="text-xs text-gray-400">{t('element_remove_bg_calculating')}</p>}
          {bgError && <p className="text-xs text-red-600">{bgError}</p>}
        </div>
      )}

      {/* Positions-Presets – schneller Weg zu gängigen Druckpositionen, ohne
          manuell exakt ziehen zu müssen. Ideal für Firmenkunden, die schnell
          ein „normales" Ergebnis wollen. */}
      {printArea && (
        <div>
          <p className="mb-1.5 text-xs text-gray-400">{t('element_position')}</p>
          <div className="flex flex-wrap gap-1.5">
            {POSITION_PRESETS.map((preset) => (
              <button
                key={preset.labelKey}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:border-brand-accent hover:text-brand-accent"
              >
                {t(preset.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rotation – für Logo und Text gleichermaßen direkt einstellbar,
          nicht nur per Ziehen am Drehgriff im Canvas. */}
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
          <span>{t('element_rotation')}</span>
          <span>{Math.round(((selected.rotationDeg % 360) + 360) % 360)}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={359}
          value={((selected.rotationDeg % 360) + 360) % 360}
          onChange={(e) => updateElement(selected.id, { rotationDeg: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      {/* Live-Maße – gilt für Logo und Text gleichermaßen */}
      <div className="grid grid-cols-2 gap-2 rounded bg-gray-50 p-2 text-sm text-gray-700">
        <div>
          <span className="block text-xs text-gray-400">{t('element_width')}</span>
          {selected.widthCm.toFixed(1)} cm
        </div>
        <div>
          <span className="block text-xs text-gray-400">{t('element_height')}</span>
          {selected.heightCm.toFixed(1)} cm
        </div>
        <div>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            {printMethod === 'embroidery' ? 'Geschätzte Stiche' : t('element_billable_area')}
            <InfoTooltip
              text={
                printMethod === 'embroidery'
                  ? 'Schätzung nach Branchenwert, keine echte Digitalisierung – siehe Chroma Inspire für die verbindliche Zahl.'
                  : `Box: ${(selected.widthCm * selected.heightCm).toFixed(1)} cm² – berechnet wird nur ${isText ? 'der Buchstaben-Anteil' : 'der tatsächliche Motiv-Anteil'}, nicht die volle Auswahlfläche.`
              }
            />
          </span>
          {printMethod === 'embroidery' ? (
            <>≈ {selected.estimatedStitches.toLocaleString('de-DE')}</>
          ) : (
            <>
              {isText
                ? (
                    selected.widthCm *
                    selected.heightCm *
                    ((selected as TextElement).inkCoverageRatio ?? 0.35)
                  ).toFixed(1)
                : (
                    selected.widthCm *
                    selected.heightCm *
                    ((selected as LogoElement).contentFillRatio ?? 0.85)
                  ).toFixed(1)}{' '}
              cm²
            </>
          )}
        </div>
        <div>
          <span className="block text-xs text-gray-400">{t('element_extra_price')}</span>
          {selected.extraPrice > 0 ? formatPrice(selected.extraPrice) : '–'}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => copyElement(selected.id)}
            title="Kopieren (Strg+C) – danach mit Strg+V hier oder auf einer anderen Ansicht einfügen"
            className="min-w-0 flex-1 truncate rounded bg-brand-light px-2 py-1.5 text-sm hover:bg-gray-200"
          >
            Kopieren
          </button>
          <button
            type="button"
            onClick={() =>
              duplicateElement(
                selected.id,
                printArea ? { movementWidthCm: printArea.movementWidthCm, referenceGarmentHeightCm: printArea.referenceGarmentHeightCm } : undefined
              )
            }
            className="min-w-0 flex-1 truncate rounded bg-brand-light px-2 py-1.5 text-sm hover:bg-gray-200"
          >
            {t('element_duplicate')}
          </button>
        </div>
        <button
          type="button"
          onClick={() => removeElement(selected.id)}
          className="w-full rounded bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
        >
          {t('element_delete')}
        </button>
      </div>
    </div>
  );
}
