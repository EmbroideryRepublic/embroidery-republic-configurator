/**
 * "Kundendateien" – Downloadbereich der Dateien einer Bestellung: die ORIGINAL,
 * von der Kundschaft hochgeladenen Logo-Dateien (vor evtl. Hintergrund-
 * entfernung) UND die Texte als Bilddatei. Getrennt von ProductionPreview.tsx
 * (das die bereits gerenderte Druckvorschau zeigt).
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
 * ── Texte ──────────────────────────────────────────────────────────────
 * Für einen Text lädt die Kundschaft keine Datei hoch. Sie steht hier trotzdem
 * wie ein Logo in der Liste, damit sich beides auf dieselbe Weise für die
 * (DTF-)Bestellung herunterladen lässt: Die Bilddatei entsteht erst beim Klick
 * aus den gespeicherten Bestelldaten (lib/rendering/renderTextJpg.ts, Route
 * app/api/admin/bestellungen/[id]/texte/[elementId]). "Herunterladen" liefert
 * das PNG mit transparentem Hintergrund (die Datei für DTF – ein JPG-Hintergrund
 * würde mitgedruckt), "Als JPG" die Fassung mit Hintergrund. Das Vorschaubild
 * ist eine kleine (72 dpi) Fassung derselben Darstellung.
 *
 * Zeigt fehlende Dateien (DSGVO-Altdatei-Löschung, alte Testbestellungen)
 * als "Datei nicht mehr vorhanden" statt eines kaputten Downloads oder gar
 * eines Seitenabsturzes – reine Anzeige bereits geladener Daten
 * (lib/admin/data.ts::getOrderDetail), kein zusätzlicher Request.
 */
import Image from 'next/image';
import type { AdminOrderItemRow, AdminOrderElementRow } from '@/lib/admin/data';
import { ansichtLabel, sortiereAnsichten } from '@/lib/admin/ansichten';
import { textEinzeiligHref, textJpgHref, textPngHref, textVorschauHref, zeilenAnzahl } from '@/lib/admin/textLink';

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

const KNOPF_HAUPT =
  'flex-shrink-0 rounded border border-gray-300 px-2.5 py-1.5 text-center text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50';

const TEXT_LINK = 'text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-800';

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
        <a href={downloadHref(orderId, element.originalStorageKey, element.fileName ?? element.originalStorageKey)} className={KNOPF_HAUPT}>
          Herunterladen
        </a>
      ) : null}
    </li>
  );
}

/** Ein Text wie ein Logo: Vorschaubild, Bezeichnung, Download. Die Datei entsteht beim Klick. */
function TextZeile({ orderId, element, nummer }: { orderId: string; element: AdminOrderElementRow; nummer: number }) {
  const inhalt = element.content ?? '';
  const zeilen = zeilenAnzahl(inhalt);
  // In einer Zeile zusammengefasst; die Anzahl der Zeilen steht darunter.
  const einzeilig = inhalt.split(/\r\n|\r|\n/).map((zeile) => zeile.trim()).filter(Boolean).join(' ');

  return (
    <li className="flex items-center gap-3 border-t border-gray-100 py-2.5 first:border-t-0">
      <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-white">
        {/* unoptimized: Die Bilder kommen aus der geschützten Admin-Route; der Bildoptimierer
            der Next-Laufzeit würde sie ohne Anmeldung abrufen und eine Fehlerseite erhalten. */}
        <Image
          src={textVorschauHref(orderId, element.id)}
          alt={`Text ${nummer}: ${einzeilig}`}
          fill
          sizes="48px"
          unoptimized
          className="object-contain p-1"
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          Text {nummer} · &bdquo;{einzeilig}&ldquo;
        </p>
        <p className="text-xs text-gray-500">
          PNG, transparent{zeilen > 1 ? ` · ${zeilen} Zeilen` : ''} · 300 dpi
        </p>
        {/* Nur bei mehreren Zeilen: dieselbe Datei mit allen Zeilen hintereinander. Für den Fall, dass die
            Kundschaft den Text ohne Umbruch möchte, im Textfeld aber mit der Eingabetaste einen erzeugt hat. */}
        {zeilen > 1 && (
          <p className="text-xs text-gray-500">
            Ohne Zeilenumbruch:{' '}
            <a href={textEinzeiligHref(orderId, element.id, 'png')} className={TEXT_LINK}>
              PNG
            </a>
            {' · '}
            <a href={textEinzeiligHref(orderId, element.id, 'jpg')} className={TEXT_LINK}>
              JPG
            </a>
          </p>
        )}
      </div>

      {/* Hauptknopf = PNG: die Datei für die DTF-Bestellung (transparenter Hintergrund). */}
      <div className="flex flex-shrink-0 flex-col gap-1">
        <a href={textPngHref(orderId, element.id)} className={KNOPF_HAUPT}>
          Herunterladen
        </a>
        <a href={textJpgHref(orderId, element.id)} className={`text-center ${TEXT_LINK}`}>
          Als JPG
        </a>
      </div>
    </li>
  );
}

function zaehleDateien(item: AdminOrderItemRow): number {
  return item.elements.filter((e) => e.type === 'logo' || e.type === 'text').length;
}

function PositionsGruppe({ item, index, orderId }: { item: AdminOrderItemRow; index: number; orderId: string }) {
  const dateien = item.elements.filter((e) => e.type === 'logo' || e.type === 'text');
  if (dateien.length === 0) return null;

  const views = sortiereAnsichten([...new Set(dateien.map((e) => e.view))]);

  return (
    <div className={index > 0 ? 'mt-5 border-t border-gray-100 pt-5' : ''}>
      <p className="mb-2 text-sm font-semibold text-gray-900">
        Position {index + 1}: {item.productName} · {item.colorName}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {views.map((view) => {
          const elementeDieserAnsicht = dateien.filter((e) => e.view === view);
          // Erst die Logos, dann die Texte; beide zählen je Ansicht neu ab 1 – wie in ProductionPreview.tsx.
          const logos = elementeDieserAnsicht.filter((e) => e.type === 'logo');
          const texte = elementeDieserAnsicht.filter((e) => e.type === 'text');
          return (
            <div key={view} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{ansichtLabel(view)}</p>
              <ul>
                {logos.map((element, i) => (
                  <KundendateiZeile key={`logo-${i}`} orderId={orderId} element={element} nummer={i + 1} />
                ))}
                {texte.map((element, i) => (
                  <TextZeile key={element.id} orderId={orderId} element={element} nummer={i + 1} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function KundendateienPanel({ orderId, items }: { orderId: string; items: AdminOrderItemRow[] }) {
  const gesamtAnzahl = items.reduce((summe, item) => summe + zaehleDateien(item), 0);
  const hatTexte = items.some((item) => item.elements.some((e) => e.type === 'text'));

  if (gesamtAnzahl === 0) {
    return <p className="text-sm text-gray-400">Keine hochgeladenen Logo-Dateien und keine Texte an dieser Bestellung.</p>;
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
      {hatTexte && (
        <p className="mt-4 text-xs text-gray-500">
          Texte entstehen beim Herunterladen aus den Bestelldaten: unverdreht, in Druckgröße (300 dpi), mit schmalem Rand, in der
          Ersatzschrift der Vorschau (z.&nbsp;B. Anton statt Impact). <strong className="font-medium text-gray-700">PNG</strong> hat
          einen transparenten Hintergrund – das ist die Datei für die DTF-Bestellung (auch im ZIP).{' '}
          <strong className="font-medium text-gray-700">JPG</strong> hat immer einen Hintergrund, der im Druck mitkäme.
        </p>
      )}
    </div>
  );
}
