/**
 * "Kundendateien" – Downloadbereich der ORIGINAL, von der Kundschaft
 * hochgeladenen Logo-Dateien (vor evtl. Hintergrundentfernung), getrennt von
 * ProductionPreview.tsx (das die bereits gerenderte Druckvorschau zeigt).
 *
 * ── Original vs. Vorschau ──────────────────────────────────────────────
 * ProductionPreview zeigt `logoPreviewUrl` (die ANGEZEIGTE, ggf. freigestellte
 * Version, dieselbe die das Rendering nutzt) als kleines Vorschaubild – genau
 * richtig für "wie sieht das Motiv auf dem Kleidungsstück aus". Für die
 * tatsächliche Produktion (Stickerei/DTF-Datenaufbereitung) wird die
 * ORIGINAL-Datei gebraucht, nicht die für die Vorschau ggf. veränderte. Diese
 * Datei ist hier über einen echten Download-Button erreichbar (siehe
 * app/api/admin/bestellungen/[id]/kundendateien/), das Thumbnail daneben
 * bleibt bewusst die (kleinere, ohnehin schon signierte) Vorschau-Version –
 * kein zweiter Signed-URL-Aufruf nur für ein 56px-Bild.
 *
 * ── Ehrlicher Hinweis zu "Original" ────────────────────────────────────
 * Der Konfigurator wandelt jeden Upload (PNG/SVG/PDF) bereits im Browser in
 * PNG um (siehe lib/upload/pruefeUpload.ts) – "Original" meint hier die
 * Version VOR Hintergrundentfernung, nicht zwingend die rohen Bytes der vom
 * Kunden ausgewählten Datei.
 *
 * Zeigt fehlende Dateien (DSGVO-Altdatei-Löschung, alte Testbestellungen)
 * als "Datei nicht mehr vorhanden" statt eines kaputten Downloads oder gar
 * eines Seitenabsturzes – reine Anzeige bereits geladener Daten
 * (lib/admin/data.ts::getOrderDetail), kein zusätzlicher Request.
 */
import Image from 'next/image';
import type { AdminOrderItemRow, AdminOrderElementRow } from '@/lib/admin/data';
import { ansichtLabel, sortiereAnsichten } from '@/lib/admin/ansichten';

function formatiereDateigroesse(bytes: number | null): string | null {
  if (bytes === null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function dateiTypLabel(mimeType: string | null, storageKey: string | null): string {
  if (mimeType) return mimeType.replace('image/', '').toUpperCase();
  const endung = storageKey?.split('.').pop();
  return endung ? endung.toUpperCase() : 'Unbekannt';
}

function downloadHref(orderId: string, storageKey: string, kundenDateiname: string): string {
  const pfad = `/api/admin/bestellungen/${encodeURIComponent(orderId)}/kundendateien/${encodeURIComponent(storageKey)}`;
  return `${pfad}?name=${encodeURIComponent(kundenDateiname)}`;
}

function KundendateiZeile({ orderId, element, nummer }: { orderId: string; element: AdminOrderElementRow; nummer: number }) {
  const groesse = formatiereDateigroesse(element.fileSizeBytes);

  return (
    <li className="flex items-center gap-3 border-t border-gray-100 py-2.5 first:border-t-0">
      <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-white">
        {element.logoPreviewUrl ? (
          <Image src={element.logoPreviewUrl} alt={element.fileName ?? `Logo ${nummer}`} fill sizes="48px" className="object-contain p-1" />
        ) : (
          <span className="flex h-full items-center justify-center text-[9px] text-gray-400">kein Bild</span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          Logo {nummer} · {element.fileName ?? 'Dateiname unbekannt'}
        </p>
        {element.originalDateiVorhanden ? (
          <p className="text-xs text-gray-500">
            {dateiTypLabel(element.fileMimeType, element.originalStorageKey)}
            {groesse ? ` · ${groesse}` : ''}
          </p>
        ) : (
          <p className="text-xs font-medium text-red-700">Datei nicht mehr vorhanden</p>
        )}
      </div>

      {element.originalDateiVorhanden && element.originalStorageKey ? (
        <a
          href={downloadHref(orderId, element.originalStorageKey, element.fileName ?? element.originalStorageKey)}
          className="flex-shrink-0 rounded border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Herunterladen
        </a>
      ) : null}
    </li>
  );
}

function PositionsGruppe({ item, index, orderId }: { item: AdminOrderItemRow; index: number; orderId: string }) {
  const logoElemente = item.elements.filter((e) => e.type === 'logo');
  if (logoElemente.length === 0) return null;

  const views = sortiereAnsichten([...new Set(logoElemente.map((e) => e.view))]);

  return (
    <div className={index > 0 ? 'mt-5 border-t border-gray-100 pt-5' : ''}>
      <p className="mb-2 text-sm font-semibold text-gray-900">
        Position {index + 1}: {item.productName} · {item.colorName}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {views.map((view) => {
          let nummer = 0;
          const elementeDieserAnsicht = logoElemente.filter((e) => e.view === view);
          return (
            <div key={view} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{ansichtLabel(view)}</p>
              <ul>
                {elementeDieserAnsicht.map((element, i) => {
                  nummer += 1;
                  return <KundendateiZeile key={i} orderId={orderId} element={element} nummer={nummer} />;
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KundendateienPanel({ orderId, items }: { orderId: string; items: AdminOrderItemRow[] }) {
  const gesamtAnzahl = items.reduce((summe, item) => summe + item.elements.filter((e) => e.type === 'logo').length, 0);

  if (gesamtAnzahl === 0) {
    return <p className="text-sm text-gray-400">Keine hochgeladenen Logo-Dateien an dieser Bestellung.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          {gesamtAnzahl} Datei{gesamtAnzahl === 1 ? '' : 'en'} insgesamt
        </p>
        <a
          href={`/api/admin/bestellungen/${encodeURIComponent(orderId)}/kundendateien`}
          className="rounded bg-gold px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark"
        >
          Alle Kundendateien herunterladen (ZIP)
        </a>
      </div>
      {items.map((item, i) => (
        <PositionsGruppe key={i} item={item} index={i} orderId={orderId} />
      ))}
    </div>
  );
}
