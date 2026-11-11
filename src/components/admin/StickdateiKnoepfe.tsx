'use client';

/**
 * Knöpfe der fertig digitalisierten Stickdatei eines Motivs (nur bei Positionen mit Stickerei):
 *   Schalter „Weißen Hintergrund entfernen“ (nur Logos)  an: nur das Motiv wird gestickt, aus: der Hintergrund des Originals
 *                          wird als eigene Garnfarbe mitgestickt – alle Dateien, die Vorschau und „Prüfen“ folgen dem Schalter,
 *   „DST“ / „PES“ / „JEF“  dieselbe Stickerei im Format der Maschine (Tajima & Co. / Brother / Janome),
 *   „Stickvorschau“        zeigt die Garnlinien als Bild,
 *   „Prüfen“               nennt Größe, Stichzahl, Fadenschnitte, Garnfarben und – wichtig – wo das Motiv an die Grenzen
 *                          der automatischen Digitalisierung stößt (zu dünne Linien, sehr kleine Schrift …).
 * Die Dateien entstehen auf Abruf (app/api/admin/bestellungen/[id]/stickdatei/[elementId]).
 * Die Wahl des Schalters merkt sich der Browser je Motiv (nur als Komfort; ohne Speicher gilt „an“).
 */
import { useEffect, useState } from 'react';
import { stickdateiHref, stickinfoHref, stickvorschauHref } from '@/lib/admin/stickdateiLink';

interface Garn {
  hex: string;
  brother: { platz: number; name: string };
  janome: { platz: number; name: string };
}

interface Info {
  breiteMm: number;
  hoeheMm: number;
  stiche: number;
  sprunge: number;
  schnitte: number;
  farben: number;
  garne: Garn[];
  hinweise: string[];
}

const FORMATE = [
  { format: 'dst', beschriftung: 'DST', hilfe: 'Tajima, Barudan, ZSK, SWF, Happy und viele weitere Industriemaschinen' },
  { format: 'pes', beschriftung: 'PES', hilfe: 'Brother, Babylock, Bernina (Brother-Reihe)' },
  { format: 'jef', beschriftung: 'JEF', hilfe: 'Janome' },
] as const;

const speicherSchluessel = (elementId: string) => `stickdatei-hintergrund:${elementId}`;

export function StickdateiKnoepfe({ orderId, elementId, istLogo }: { orderId: string; elementId: string; istLogo: boolean }) {
  const [hintergrundEntfernen, setHintergrundEntfernen] = useState(true);
  const [info, setInfo] = useState<Info | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  // Gemerkte Wahl dieses Motivs wiederherstellen (nur Komfort, der Speicher kann fehlen).
  useEffect(() => {
    if (!istLogo) return;
    try {
      if (window.localStorage.getItem(speicherSchluessel(elementId)) === 'aus') setHintergrundEntfernen(false);
    } catch {
      /* kein Speicher: Standard bleibt */
    }
  }, [elementId, istLogo]);

  // Für Texte gibt es keinen Hintergrund – sie ignorieren den Schalter.
  const entfernen = istLogo ? hintergrundEntfernen : true;

  async function pruefen(wert: boolean = entfernen) {
    setLaedt(true);
    setFehler(null);
    try {
      const antwort = await fetch(stickinfoHref(orderId, elementId, wert), { cache: 'no-store' });
      const daten = (await antwort.json()) as Info & { fehler?: string };
      if (!antwort.ok) {
        setInfo(null);
        setFehler(daten.fehler ?? 'Die Stickdatei konnte nicht erzeugt werden.');
      } else {
        setInfo(daten);
      }
    } catch {
      setInfo(null);
      setFehler('Die Stickdatei konnte nicht geprüft werden (keine Verbindung).');
    } finally {
      setLaedt(false);
    }
  }

  function umschalten() {
    const neu = !hintergrundEntfernen;
    setHintergrundEntfernen(neu);
    try {
      window.localStorage.setItem(speicherSchluessel(elementId), neu ? 'an' : 'aus');
    } catch {
      /* kein Speicher: gilt nur für diese Ansicht */
    }
    // Die angezeigten Kennzahlen gehören zur alten Einstellung: neu berechnen, wenn sie sichtbar waren.
    setFehler(null);
    if (info || fehler) void pruefen(neu);
    else setInfo(null);
  }

  return (
    <div className="mt-2 border-t border-dashed border-gray-200 pt-2">
      <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">Stickdatei für die Maschine</p>
      {istLogo && (
        <label className="mb-2 flex cursor-pointer items-start gap-2">
          <input type="checkbox" role="switch" className="peer sr-only" checked={hintergrundEntfernen} onChange={umschalten} />
          <span
            aria-hidden="true"
            className="relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-gold-btn peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-gray-400"
          />
          <span className="text-xs leading-snug text-gray-700">
            <span className="font-medium">Weißen Hintergrund entfernen: {hintergrundEntfernen ? 'an' : 'aus'}</span>
            <br />
            <span className="text-[11px] text-gray-500">
              {hintergrundEntfernen
                ? 'Original des Kunden, ein einfarbiger Hintergrund am Bildrand (meist weiß) bleibt weg – egal, ob der Kunde freigestellt hat.'
                : 'Original des Kunden unverändert: Ein deckender Hintergrund wird als eigene Garnfarbe mitgestickt.'}
            </span>
          </span>
        </label>
      )}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {FORMATE.map(({ format, beschriftung, hilfe }) => (
          <a
            key={format}
            href={stickdateiHref(orderId, elementId, format, entfernen)}
            title={hilfe}
            className="rounded bg-gold-btn px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-gold-dark"
          >
            {beschriftung}
          </a>
        ))}
        <a
          href={stickvorschauHref(orderId, elementId, entfernen)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Stickvorschau
        </a>
        <button
          type="button"
          onClick={() => void pruefen()}
          disabled={laedt}
          className="text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-800 disabled:opacity-60"
        >
          {laedt ? 'Prüfe …' : 'Prüfen'}
        </button>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-gray-400">DST: Tajima, Barudan, ZSK, SWF &middot; PES: Brother, Babylock &middot; JEF: Janome</p>
      {fehler && <p className="mt-1 text-xs text-red-600">{fehler}</p>}
      {info && (
        <div className="mt-1 text-xs text-gray-600">
          <p>
            {info.breiteMm.toLocaleString('de-DE')} × {info.hoeheMm.toLocaleString('de-DE')} mm · {info.stiche.toLocaleString('de-DE')} Stiche ·{' '}
            {info.sprunge.toLocaleString('de-DE')} Sprünge · {info.schnitte.toLocaleString('de-DE')} Fadenschnitte · {info.farben}{' '}
            {info.farben === 1 ? 'Garnfarbe' : 'Garnfarben'}
          </p>
          <ul className="mt-0.5 space-y-0.5">
            {info.garne.map((garn, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-1.5">
                <span className="inline-block h-3 w-3 rounded-sm border border-gray-300" style={{ backgroundColor: garn.hex }} aria-hidden="true" />
                <span>
                  Farbe {i + 1} ({garn.hex}): Brother {garn.brother.name}, Janome {garn.janome.name}
                </span>
              </li>
            ))}
          </ul>
          {info.hinweise.length > 0 ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-amber-700">
              {info.hinweise.map((hinweis, i) => (
                <li key={i}>{hinweis}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-green-700">Keine Auffälligkeiten. Vor der Serie trotzdem einmal auf Probestoff sticken.</p>
          )}
        </div>
      )}
    </div>
  );
}
