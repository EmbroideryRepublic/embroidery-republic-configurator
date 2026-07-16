'use client';

import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { fileToImage } from '@/lib/upload/fileToImage';
import { removeSimpleBackground } from '@/lib/upload/backgroundRemoval';
import { estimateLogoStitches } from '@/lib/embroidery/estimateStitches';
import { analyzeLogoContent, cropImageToContent } from '@/lib/upload/analyzeLogoContent';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { LogoElement, PrintArea } from '@/types';

const ACCEPTED_TYPES = ['image/png', 'image/svg+xml', 'application/pdf'];
const MAX_FILE_SIZE_MB = 10;
const START_SIZE_RATIO = 0.5;
const MIN_DPI = 150;
const OK_DPI = 220;

type QualityLevel = 'green' | 'yellow' | 'red' | null;

interface LogoUploaderProps {
  printArea: PrintArea | null;
  onElementAdded?: () => void;
}

export function LogoUploader({ printArea, onElementAdded }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState<{ level: QualityLevel; dpi: number | null; message: string } | null>(null);
  const [removeBg, setRemoveBg] = useState(true);

  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const activeView = useConfiguratorStore((s) => s.activeView);
  const addElement = useConfiguratorStore((s) => s.addElement);
  const setSelectedElementId = useConfiguratorStore((s) => s.setSelectedElementId);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  async function handleFile(file: File) {
    setError(null);
    setQuality(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Nur SVG, PNG oder PDF sind erlaubt.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Datei zu groß (maximal ${MAX_FILE_SIZE_MB} MB).`);
      return;
    }
    if (!printArea) {
      setError('Für diese Ansicht ist noch kein Druckbereich definiert.');
      return;
    }

    setIsLoading(true);
    try {
      const uploaded = await fileToImage(file);
      const originalDataUrl = uploaded.dataUrl;
      let displayDataUrl = uploaded.dataUrl;
      let backgroundRemoved = false;

      // Einfache Hintergrundentfernung (regelbasiert, kein ML) – nur für
      // PNGs sinnvoll, bei denen Kunden häufig einen weißen Hintergrund
      // mitliefern. Das Original bleibt separat erhalten, damit sich die
      // Freistellung später jederzeit ein-/ausschalten lässt.
      if (file.type === 'image/png' && removeBg) {
        try {
          displayDataUrl = await removeSimpleBackground(originalDataUrl);
          backgroundRemoved = true;
        } catch {
          // Freistellung fehlgeschlagen -> Original unverändert weiterverwenden
        }
      }

      // Auf den tatsächlichen Bildinhalt zuschneiden (entfernt Leerraum am
      // Rand, falls in der Originaldatei vorhanden) UND den Füllgrad
      // innerhalb dieser zugeschnittenen Box ermitteln (z.B. ein rundes
      // Logo füllt sein eigenes eckiges Bounding-Rechteck nur zu ca. 78%).
      // Beides zusammen sorgt dafür, dass Maßanzeige UND Preis das
      // tatsächliche Motiv widerspiegeln, nicht die volle Bild-Box.
      const contentAnalysis = await analyzeLogoContent(displayDataUrl);
      const cropped = await cropImageToContent(displayDataUrl, contentAnalysis.bounds);
      displayDataUrl = cropped.dataUrl;
      const contentWidthPx = cropped.width;
      const contentHeightPx = cropped.height;

      // Auch die unveränderte Originaldatei (für den späteren
      // Freistellungs-Umschalter) auf denselben Ausschnitt zuschneiden –
      // sonst würde ein Umschalten zwischen freigestellt/original einen
      // sichtbaren Größensprung verursachen (unterschiedliche Ränder).
      const croppedOriginal = await cropImageToContent(originalDataUrl, contentAnalysis.bounds);

      const aspectRatio =
        contentWidthPx > 0 && contentHeightPx > 0 ? contentWidthPx / contentHeightPx : 1;
      let widthCm = printArea.maxWidthCm * START_SIZE_RATIO;
      let heightCm = widthCm / aspectRatio;
      const maxHeightCm = printArea.maxHeightCm * START_SIZE_RATIO;
      if (heightCm > maxHeightCm) {
        heightCm = maxHeightCm;
        widthCm = heightCm * aspectRatio;
      }

      // Qualitätsampel: grün = optimal, gelb = akzeptabel, rot = ungeeignet.
      // Nur für Raster-PNGs relevant (SVG/PDF sind verlustfrei skalierbar).
      if (file.type === 'image/png') {
        const widthInches = widthCm / 2.54;
        const effectiveDpi = widthInches > 0 ? contentWidthPx / widthInches : 0;
        let level: QualityLevel = 'green';
        let message = 'Optimale Druckqualität bei dieser Größe.';
        if (effectiveDpi < MIN_DPI) {
          level = 'red';
          message = `Auflösung zu niedrig für scharfen Druck (≈ ${Math.round(effectiveDpi)} dpi, empfohlen: ${MIN_DPI}+ dpi). Bitte kleiner platzieren, ein SVG verwenden oder eine höher aufgelöste Datei hochladen.`;
        } else if (effectiveDpi < OK_DPI) {
          level = 'yellow';
          message = `Akzeptable Auflösung (≈ ${Math.round(effectiveDpi)} dpi), für sehr große Drucke aber eher knapp.`;
        }
        // Eignung DTF vs. Stickerei: Stickerei verzeiht niedrigere
        // Bild-Auflösung eher (wird ohnehin manuell digitalisiert), dafür
        // sind sehr feine Farbverläufe/Fotos für Stickerei ungeeignet.
        const suitability =
          printMethod === 'embroidery'
            ? ' Hinweis: Für Stickerei wird die Datei ohnehin manuell in Garnfarben digitalisiert – feine Farbverläufe oder Fotos sind dafür weniger geeignet.'
            : ' Für DTF-Transferdruck gut geeignet, sofern die Auflösung ausreicht.';
        setQuality({ level, dpi: Math.round(effectiveDpi), message: message + suitability });
      } else {
        setQuality({ level: 'green', dpi: null, message: 'Vektordatei – verlustfrei skalierbar, für DTF und Stickerei gleichermaßen geeignet.' });
      }

      const element: LogoElement = {
        id: crypto.randomUUID(),
        type: 'logo',
        view: activeView,
        xCm: (printArea.movementWidthCm - widthCm) / 2,
        yCm: (printArea.referenceGarmentHeightCm - heightCm) / 2,
        widthCm,
        heightCm,
        rotationDeg: 0,
        isOutOfBounds: false,
        extraPrice: 0,
        name: uploaded.fileName.replace(/\.[^.]+$/, ''),
        locked: false,
        hidden: false,
        fileUrl: displayDataUrl,
        fileName: uploaded.fileName,
        originalWidthPx: contentWidthPx,
        originalHeightPx: contentHeightPx,
        originalFileUrl: croppedOriginal.dataUrl,
        backgroundRemoved,
        contentFillRatio: contentAnalysis.fillRatio,
        estimatedStitches: await estimateLogoStitches(displayDataUrl, widthCm, heightCm),
      };

      addElement(element);
      setSelectedElementId(element.id);
      onElementAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Datei konnte nicht verarbeitet werden.');
    } finally {
      setIsLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const QUALITY_STYLES: Record<Exclude<QualityLevel, null>, { bg: string; text: string; icon: typeof CheckCircle2; label: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle2, label: t('logo_quality_green') },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle, label: t('logo_quality_yellow') },
    red: { bg: 'bg-red-50', text: 'text-red-700', icon: XCircle, label: t('logo_quality_red') },
  };

  return (
    <div>
      <input
        ref={inputRef}
        id="logo-upload"
        type="file"
        accept=".svg,.png,.pdf,image/svg+xml,image/png,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <label
        htmlFor="logo-upload"
        className="block cursor-pointer rounded-lg border border-dashed border-gold/30 p-4 text-center text-sm text-brand/50 transition-colors hover:border-gold hover:text-gold-dark"
      >
        {isLoading ? t('logo_upload_loading') : t('logo_upload_label')}
      </label>

      <label className="mt-2 flex items-center gap-1.5 text-xs text-brand/50">
        <input
          type="checkbox"
          checked={removeBg}
          onChange={(e) => setRemoveBg(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-gray-300"
        />
        {t('logo_remove_bg_checkbox')}
        <InfoTooltip text={t('logo_remove_bg_hint')} />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {quality && quality.level && (
        <div className={clsx('mt-2 flex items-start gap-1.5 rounded-lg p-2 text-xs', QUALITY_STYLES[quality.level].bg, QUALITY_STYLES[quality.level].text)}>
          {(() => {
            const Icon = QUALITY_STYLES[quality.level].icon;
            return <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />;
          })()}
          <span>
            <strong>{QUALITY_STYLES[quality.level].label}{quality.dpi ? ` (≈ ${quality.dpi} dpi)` : ''}:</strong>{' '}
            {quality.message}
          </span>
        </div>
      )}

      {printMethod === 'embroidery' && (
        <p className="mt-2 flex items-center gap-1 text-xs text-brand/40">
          Hinweis zur Stickerei-Digitalisierung
          <InfoTooltip text={t('logo_embroidery_hint')} />
        </p>
      )}
    </div>
  );
}
