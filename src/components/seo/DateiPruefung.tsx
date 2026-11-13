'use client';

/**
 * Werkzeug „Druckdatei prüfen“ (Ratgeberseite /druckdatei-pruefen): Bild auswählen, Druckbreite eingeben → Auflösung in dpi mit
 * derselben Ampel wie im Konfigurator; bei zu niedriger Auflösung lässt sich das Bild hochskalieren und als PNG speichern.
 *
 * Dieselben Schwellen und Texte wie die Qualitätsampel (lib/canvas/logoQualitaet.ts) und dieselbe Rechnung wie der Button
 * „Hochskalieren“ im Konfigurator (lib/upload/hochskalieren.ts) – das Werkzeug kann also nie etwas anderes sagen oder tun als der
 * Konfigurator.
 *
 * Rechnet ausschließlich im Browser: Das Bild wird nicht hochgeladen, nicht gespeichert und an keinen Server gesendet.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { berechneLogoDpi, logoQualitaetText, stufeFuerDpi, type QualityLevel } from '@/lib/canvas/logoQualitaet';
import { waehleHochskalierung } from '@/lib/upload/hochskalieren';
import { hochskaliereDataUrl } from '@/lib/upload/hochskalierenImBrowser';
import { zahl } from '@/lib/format';

/** Größte Datei, die das Werkzeug annimmt (Bytes). */
const MAX_DATEI_BYTES = 30 * 1024 * 1024;
/** Größtes Bild (Pixel) – darüber braucht das Prüfen zu viel Arbeitsspeicher im Browser. */
const MAX_PIXEL_QUELLE = 60_000_000;

const STUFEN: Record<QualityLevel, { name: string; klasse: string }> = {
  green: { name: 'Grün – optimal', klasse: 'bg-green-50 text-green-900 border-green-200' },
  yellow: { name: 'Gelb – akzeptabel', klasse: 'bg-amber-50 text-amber-900 border-amber-200' },
  red: { name: 'Rot – zu niedrig', klasse: 'bg-red-50 text-red-900 border-red-200' },
};

const FELD =
  'mt-2 w-full rounded-xl border border-brand/[0.15] bg-white px-4 py-3 text-[17px] tabular-nums text-brand outline-none transition-colors focus:border-gold focus-visible:ring-2 focus-visible:ring-gold/40';
const KNOPF =
  'inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 py-2.5 text-[15px] font-medium text-white transition-all duration-300 ease-out hover:bg-brand/90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60';

function alsZahl(text: string): number {
  const t = text.trim().replace(/\./g, '').replace(',', '.');
  return t === '' ? Number.NaN : Number(t);
}

interface Bild {
  name: string;
  dataUrl: string;
  breite: number;
  hoehe: number;
}

interface Ergebnis {
  /** Anzeige (Blob-Adresse, wird beim Ersetzen freigegeben) und Download. */
  url: string;
  breite: number;
  hoehe: number;
  faktor: number;
  bytes: number;
}

function ladeBild(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Die Datei konnte nicht als Bild gelesen werden.'));
    img.src = dataUrl;
  });
}

function leseDatei(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leser = new FileReader();
    leser.onload = () => resolve(String(leser.result));
    leser.onerror = () => reject(new Error('Die Datei konnte nicht gelesen werden.'));
    leser.readAsDataURL(datei);
  });
}

function groesseText(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${zahl(bytes / (1024 * 1024))} MB` : `${zahl(Math.max(1, Math.round(bytes / 1024)), 0)} KB`;
}

export function DateiPruefung() {
  const [bild, setBild] = useState<Bild | null>(null);
  const [breite, setBreite] = useState('20');
  const [fehler, setFehler] = useState<string | null>(null);
  const [rechnet, setRechnet] = useState(false);
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null);
  const bildUrl = useRef<string | null>(null);

  // Blob-Adressen freigeben, wenn sie ersetzt werden oder die Seite verlassen wird.
  const verwerfeErgebnis = useCallback(() => {
    if (bildUrl.current) URL.revokeObjectURL(bildUrl.current);
    bildUrl.current = null;
    setErgebnis(null);
  }, []);
  useEffect(() => () => {
    if (bildUrl.current) URL.revokeObjectURL(bildUrl.current);
  }, []);

  async function beiAuswahl(datei: File | undefined) {
    setFehler(null);
    verwerfeErgebnis();
    if (!datei) return;
    if (!/^image\/(png|jpeg|webp)$/.test(datei.type)) {
      setBild(null);
      setFehler('Bitte wählen Sie ein Bild im Format PNG, JPG/JPEG oder WebP aus.');
      return;
    }
    if (datei.size > MAX_DATEI_BYTES) {
      setBild(null);
      setFehler(`Die Datei ist zu groß (${groesseText(datei.size)}). Das Werkzeug nimmt Dateien bis ${groesseText(MAX_DATEI_BYTES)}.`);
      return;
    }
    try {
      const dataUrl = await leseDatei(datei);
      const img = await ladeBild(dataUrl);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) throw new Error('Das Bild hat keine erkennbare Größe.');
      if (w * h > MAX_PIXEL_QUELLE) {
        setBild(null);
        setFehler(`Das Bild ist mit ${zahl(w, 0)} × ${zahl(h, 0)} Pixeln für dieses Werkzeug zu groß – für den Druck ist es ohnehin hoch genug aufgelöst.`);
        return;
      }
      setBild({ name: datei.name, dataUrl, breite: w, hoehe: h });
    } catch (e) {
      setBild(null);
      setFehler(e instanceof Error ? e.message : 'Die Datei konnte nicht gelesen werden.');
    }
  }

  const cm = alsZahl(breite);
  const gueltig = !!bild && Number.isFinite(cm) && cm > 0;
  const dpi = gueltig ? berechneLogoDpi(bild.breite, cm) : 0;
  const stufe = gueltig ? stufeFuerDpi(dpi) : null;
  const angebot = gueltig ? waehleHochskalierung({ breitePx: bild.breite, hoehePx: bild.hoehe, dpi }) : null;
  const hoeheCm = gueltig ? (cm * bild.hoehe) / bild.breite : 0;

  async function hochskalieren() {
    if (!bild || !angebot) return;
    setRechnet(true);
    setFehler(null);
    verwerfeErgebnis();
    try {
      const neu = await hochskaliereDataUrl(bild.dataUrl, angebot.faktor);
      const blob = await (await fetch(neu.dataUrl)).blob();
      const url = URL.createObjectURL(blob);
      bildUrl.current = url;
      setErgebnis({ url, breite: neu.breite, hoehe: neu.hoehe, faktor: angebot.faktor, bytes: blob.size });
    } catch {
      setFehler('Das Hochskalieren hat nicht geklappt. Versuchen Sie es mit einer kleineren Datei oder einem anderen Browser.');
    } finally {
      setRechnet(false);
    }
  }

  const neuesDpi = ergebnis && gueltig ? berechneLogoDpi(ergebnis.breite, cm) : 0;
  const dateiBasis = bild ? bild.name.replace(/\.[^.]+$/, '') : 'bild';

  return (
    <div className="mt-8 rounded-[24px] border border-brand/[0.08] bg-white p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="datei-pruefen-datei" className="text-[15px] font-medium text-brand">
            Bild auswählen
          </label>
          <input
            id="datei-pruefen-datei"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => void beiAuswahl(e.target.files?.[0])}
            className="mt-2 block w-full cursor-pointer rounded-xl border border-brand/[0.15] bg-white px-4 py-3 text-[15px] text-brand file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-[14px] file:font-medium file:text-white hover:file:bg-brand/90"
            aria-describedby="datei-pruefen-datei-hinweis"
          />
          <p id="datei-pruefen-datei-hinweis" className="mt-2 text-[13px] text-brand/70">
            PNG, JPG/JPEG oder WebP bis {groesseText(MAX_DATEI_BYTES)}. Das Bild bleibt in Ihrem Browser.
          </p>
        </div>
        <div>
          <label htmlFor="datei-pruefen-breite" className="text-[15px] font-medium text-brand">
            Gewünschte Druckbreite in Zentimetern
          </label>
          <input
            id="datei-pruefen-breite"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={breite}
            onChange={(e) => {
              setBreite(e.target.value);
              verwerfeErgebnis();
            }}
            className={FELD}
            aria-describedby="datei-pruefen-breite-hinweis"
          />
          <p id="datei-pruefen-breite-hinweis" className="mt-2 text-[13px] text-brand/70">
            Die Breite, in der das Motiv später auf dem Textil stehen soll.
          </p>
        </div>
      </div>

      <div role="status" aria-live="polite" className="mt-8 space-y-5">
        {fehler && <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-[15px] text-red-900">{fehler}</p>}

        {!bild && !fehler && (
          <p className="rounded-2xl border border-brand/[0.1] bg-brand-light p-5 text-[15px] text-brand/70">
            Wählen Sie ein Bild aus, um die Auflösung zu prüfen.
          </p>
        )}

        {bild && !gueltig && (
          <p className="rounded-2xl border border-brand/[0.1] bg-brand-light p-5 text-[15px] text-brand/70">
            Bitte geben Sie die Druckbreite als Zahl größer als 0 ein.
          </p>
        )}

        {bild && stufe && (
          <div className={`rounded-2xl border p-5 sm:p-6 ${STUFEN[stufe].klasse}`}>
            <p className="font-serif text-[28px] leading-tight tabular-nums">≈ {zahl(Math.round(dpi), 0)} dpi</p>
            <p className="mt-1 text-[15px] font-semibold">{STUFEN[stufe].name}</p>
            <p className="mt-3 text-[15px] leading-relaxed">{logoQualitaetText(stufe, dpi)}</p>
            <p className="mt-3 text-[14px] leading-relaxed opacity-90">
              Ihr Bild hat {zahl(bild.breite, 0)} × {zahl(bild.hoehe, 0)} Pixel. Bei {zahl(cm)} cm Breite wäre der Druck{' '}
              {zahl(hoeheCm)} cm hoch.
            </p>
          </div>
        )}

        {bild && stufe && angebot && !ergebnis && (
          <div className="rounded-2xl border border-brand/[0.1] bg-brand-light p-5 sm:p-6">
            <p className="text-[15px] leading-relaxed text-brand/80">
              Dieses Bild lässt sich auf ca. <strong>{zahl(Math.round(angebot.erreichteDpi), 0)} dpi</strong> hochskalieren (×{zahl(angebot.faktor)},
              {' '}
              {zahl(angebot.neueBreitePx, 0)} × {zahl(angebot.neueHoehePx, 0)} Pixel). Kanten werden dabei glatter und klarer; zusätzliche Details
              entstehen nicht.
            </p>
            <button type="button" onClick={() => void hochskalieren()} disabled={rechnet} className={`${KNOPF} mt-4`}>
              {rechnet ? 'Bild wird hochgerechnet …' : `Hochskalieren (×${zahl(angebot.faktor)})`}
            </button>
          </div>
        )}

        {bild && stufe && !angebot && stufe !== 'green' && !ergebnis && (
          <p className="rounded-2xl border border-brand/[0.1] bg-brand-light p-5 text-[15px] leading-relaxed text-brand/80">
            Dieses Bild lässt sich hier nicht sinnvoll hochskalieren (das Ergebnis wäre zu groß für den Browser). Platzieren Sie es kleiner, verwenden Sie ein SVG
            oder laden Sie eine höher aufgelöste Datei hoch.
          </p>
        )}

        {ergebnis && bild && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900 sm:p-6">
            <p className="font-serif text-[24px] leading-tight tabular-nums">
              Hochskaliert: {zahl(ergebnis.breite, 0)} × {zahl(ergebnis.hoehe, 0)} Pixel
            </p>
            <p className="mt-2 text-[15px] leading-relaxed">
              Bei {zahl(cm)} cm Breite sind das rechnerisch ≈ {zahl(Math.round(neuesDpi), 0)} dpi (vorher ≈ {zahl(Math.round(dpi), 0)} dpi). Der Faktor
              war ×{zahl(ergebnis.faktor)}; die PNG-Datei ist {groesseText(ergebnis.bytes)} groß.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau (Data-/Blob-Adresse), kein Next-Image möglich */}
                <img src={bild.dataUrl} alt="Vorschau des ursprünglichen Bildes" className="max-h-56 w-full rounded-lg border border-green-200 bg-white object-contain" />
                <figcaption className="mt-1 text-[13px]">Vorher</figcaption>
              </figure>
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element -- lokale Vorschau (Data-/Blob-Adresse), kein Next-Image möglich */}
                <img src={ergebnis.url} alt="Vorschau des hochskalierten Bildes" className="max-h-56 w-full rounded-lg border border-green-200 bg-white object-contain" />
                <figcaption className="mt-1 text-[13px]">Nachher</figcaption>
              </figure>
            </div>
            <a href={ergebnis.url} download={`${dateiBasis}-hochskaliert.png`} className={`${KNOPF} mt-5`}>
              Als PNG speichern
            </a>
            <p className="mt-3 text-[13px] leading-relaxed opacity-90">
              Die gespeicherte Datei können Sie anschließend im Konfigurator hochladen. Das hochskalierte Bild hat mehr Bildpunkte, aber nicht mehr Details als das
              Original.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
