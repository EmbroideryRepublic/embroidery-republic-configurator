'use client';

/**
 * Knöpfe der fertig digitalisierten Stickdatei eines Motivs (nur bei Positionen mit Stickerei):
 *   „Stickdatei (DST)“  lädt die Datei für die Maschine herunter,
 *   „Stickvorschau“     zeigt die Garnlinien als Bild,
 *   „Prüfen“            nennt Größe, Stichzahl, Farben und – wichtig – wo das Motiv an die Grenzen der
 *                       automatischen Digitalisierung stößt (zu dünne Linien, sehr kleine Schrift …).
 * Die Datei entsteht auf Abruf (app/api/admin/bestellungen/[id]/stickdatei/[elementId]).
 */
import { useState } from 'react';
import { stickdateiHref, stickinfoHref, stickvorschauHref } from '@/lib/admin/stickdateiLink';

interface Info {
  breiteMm: number;
  hoeheMm: number;
  stiche: number;
  sprunge: number;
  farben: number;
  hinweise: string[];
}

export function StickdateiKnoepfe({ orderId, elementId }: { orderId: string; elementId: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(false);

  async function pruefen() {
    setLaedt(true);
    setFehler(null);
    try {
      const antwort = await fetch(stickinfoHref(orderId, elementId), { cache: 'no-store' });
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

  return (
    <div className="mt-2 border-t border-dashed border-gray-200 pt-2">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <a
          href={stickdateiHref(orderId, elementId)}
          className="rounded bg-gold-btn px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-gold-dark"
        >
          Stickdatei (DST)
        </a>
        <a
          href={stickvorschauHref(orderId, elementId)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Stickvorschau
        </a>
        <button
          type="button"
          onClick={pruefen}
          disabled={laedt}
          className="text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-800 disabled:opacity-60"
        >
          {laedt ? 'Prüfe …' : 'Prüfen'}
        </button>
      </p>
      {fehler && <p className="mt-1 text-xs text-red-600">{fehler}</p>}
      {info && (
        <div className="mt-1 text-xs text-gray-600">
          <p>
            {info.breiteMm.toLocaleString('de-DE')} × {info.hoeheMm.toLocaleString('de-DE')} mm · {info.stiche.toLocaleString('de-DE')} Stiche ·{' '}
            {info.sprunge.toLocaleString('de-DE')} Sprünge · {info.farben} {info.farben === 1 ? 'Garnfarbe' : 'Garnfarben'}
          </p>
          {info.hinweise.length > 0 ? (
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-amber-700">
              {info.hinweise.map((hinweis, i) => (
                <li key={i}>{hinweis}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-0.5 text-green-700">Keine Auffälligkeiten. Vor der Serie trotzdem einmal auf Probestoff sticken.</p>
          )}
        </div>
      )}
    </div>
  );
}
