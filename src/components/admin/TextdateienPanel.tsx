/**
 * "Texte als Bilddatei (JPG)" – Downloadbereich für die Texte einer
 * Bestellung, getrennt von den Kundendateien (KundendateienPanel.tsx): Die
 * Kundschaft lädt für einen Text keine Datei hoch, die JPG entsteht auf
 * Abruf aus den gespeicherten Bestelldaten (lib/rendering/renderTextJpg.ts).
 *
 * Zeigt nur bereits geladene Daten (lib/admin/data.ts::getOrderDetail), die
 * Links führen zur Download-Route; gerendert wird erst beim Klick.
 */
import type { AdminOrderItemRow, AdminOrderElementRow } from '@/lib/admin/data';
import { ansichtLabel, sortiereAnsichten } from '@/lib/admin/ansichten';
import { textJpgHref, textPngHref, zeilenAnzahl } from '@/lib/admin/textLink';

function TextZeile({ orderId, element, nummer }: { orderId: string; element: AdminOrderElementRow; nummer: number }) {
  const zeilen = zeilenAnzahl(element.content ?? '');
  return (
    <li className="flex items-start gap-3 border-t border-gray-100 py-2.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800">Text {nummer}</p>
        <p className="mt-0.5 whitespace-pre-line break-words text-sm text-gray-800">&bdquo;{element.content}&ldquo;</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {zeilen > 1 ? `${zeilen} Zeilen · ` : ''}
          {element.fontFamily ?? 'Standardschrift'}
          {element.bold ? ', fett' : ''}
          {element.italic ? ', kursiv' : ''}
          {element.color ? ` · Farbe ${element.color}` : ''}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        {/* PNG zuerst: Es ist die Datei für die DTF-Bestellung (transparenter
            Hintergrund – bei JPG würde der Hintergrund mitgedruckt). */}
        <a
          href={textPngHref(orderId, element.id)}
          className="rounded bg-gold px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gold-dark"
        >
          PNG für DTF herunterladen
        </a>
        <a
          href={textJpgHref(orderId, element.id)}
          className="rounded border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Als JPG herunterladen
        </a>
        <a
          href={textJpgHref(orderId, element.id, true)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-800"
        >
          Ansehen
        </a>
      </div>
    </li>
  );
}

function PositionsGruppe({ item, index, orderId }: { item: AdminOrderItemRow; index: number; orderId: string }) {
  const texte = item.elements.filter((e) => e.type === 'text');
  if (texte.length === 0) return null;
  const views = sortiereAnsichten([...new Set(texte.map((e) => e.view))]);

  return (
    <div className={index > 0 ? 'mt-5 border-t border-gray-100 pt-5' : ''}>
      <p className="mb-2 text-sm font-semibold text-gray-900">
        Position {index + 1}: {item.productName} · {item.colorName}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {views.map((view) => (
          <div key={view} className="rounded-lg border border-gray-200 bg-gray-50/60 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">{ansichtLabel(view)}</p>
            <ul>
              {texte
                .filter((e) => e.view === view)
                .map((element, i) => (
                  <TextZeile key={element.id} orderId={orderId} element={element} nummer={i + 1} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Rendert nichts, wenn die Bestellung keinen Text enthält. */
export function TextdateienPanel({ orderId, items }: { orderId: string; items: AdminOrderItemRow[] }) {
  const gesamtAnzahl = items.reduce((summe, item) => summe + item.elements.filter((e) => e.type === 'text').length, 0);
  if (gesamtAnzahl === 0) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold">Texte als Bilddatei (PNG und JPG)</h2>
      <p className="mb-1 text-xs text-gray-500">
        Jeder Text wird aus den Bestelldaten in Druckgröße (300 dpi) erzeugt: unverdreht, mit schmalem Rand. Es wird die
        Ersatzschrift der Vorschau verwendet, z.&nbsp;B. Anton statt Impact.
      </p>
      <p className="mb-3 text-xs text-gray-500">
        <strong className="font-medium text-gray-700">PNG</strong> hat einen transparenten Hintergrund – nur die Schrift trägt
        Farbe. Das ist die Datei für die DTF-Bestellung. <strong className="font-medium text-gray-700">JPG</strong> hat immer einen
        Hintergrund (weiß, bei sehr heller Schrift dunkelgrau); er würde im DTF-Druck mitgedruckt.
      </p>
      {items.map((item, i) => (
        <PositionsGruppe key={i} item={item} index={i} orderId={orderId} />
      ))}
    </section>
  );
}
