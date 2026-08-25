/**
 * Produktionsvorschau je Bestellposition: die bereits in Phase 2 gerenderten
 * Druckvorschauen (Kleidungsstück + Motive exakt wie im Editor platziert,
 * siehe lib/rendering/renderPrintView.ts) plus eine strukturierte Liste
 * jedes platzierten Elements (Logo/Text) mit Ansicht, Position/Größe in cm
 * und – bei Text – den produktionsrelevanten Schrifteigenschaften.
 *
 * Zeigt AUSSCHLIESSLICH bereits vorhandene Daten (lib/admin/data.ts::
 * getOrderDetail liest configuration_elements und signiert die längst
 * gespeicherten Vorschau-PNGs) – kein neues Rendering, keine neue
 * Datenhaltung. Fehlt eine Vorschau (Rendering nicht-fatal fehlgeschlagen
 * oder Phase 2 lief noch nicht), wird das ehrlich als Hinweis angezeigt statt
 * eine Lücke zu verschleiern.
 */
import Image from 'next/image';
import { PRINT_VIEW_LABELS } from '@/lib/actions/orderTypes';
import type { AdminOrderItemRow, AdminOrderElementRow } from '@/lib/admin/data';

function ansichtLabel(view: string): string {
  return PRINT_VIEW_LABELS[view as keyof typeof PRINT_VIEW_LABELS] ?? view;
}

function ElementZeile({ element, index }: { element: AdminOrderElementRow; index: number }) {
  return (
    <li className="flex items-start gap-3 border-t border-gray-100 py-2.5 first:border-t-0">
      {element.type === 'logo' ? (
        <span className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
          {element.logoPreviewUrl ? (
            <Image src={element.logoPreviewUrl} alt={element.fileName ?? 'Logo'} fill sizes="48px" className="object-contain p-1" />
          ) : (
            <span className="flex h-full items-center justify-center text-[9px] text-gray-400">kein Bild</span>
          )}
        </span>
      ) : (
        <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-50 text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Text
        </span>
      )}
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-gray-800">
          {index + 1}. {element.type === 'logo' ? 'Logo' : 'Text'} · {ansichtLabel(element.view)}
        </p>
        {element.type === 'logo' ? (
          <p className="mt-0.5 truncate text-xs text-gray-500">{element.fileName ?? 'Dateiname unbekannt'}</p>
        ) : (
          <>
            <p className="mt-0.5 break-words text-gray-800">&bdquo;{element.content}&ldquo;</p>
            <p className="mt-0.5 text-xs text-gray-500">
              {element.fontFamily ?? 'Standardschrift'}
              {element.fontSizePx ? `, ${Math.round(element.fontSizePx)}px` : ''}
              {element.bold ? ', fett' : ''}
              {element.italic ? ', kursiv' : ''}
              {element.align ? `, ${element.align}` : ''}
              {element.color ? ` · Farbe ${element.color}` : ''}
            </p>
          </>
        )}
        <p className="mt-0.5 text-xs text-gray-400">
          Position {element.xCm.toFixed(1)}/{element.yCm.toFixed(1)} cm · Größe {element.widthCm.toFixed(1)}×
          {element.heightCm.toFixed(1)} cm{element.rotationDeg ? ` · gedreht ${element.rotationDeg.toFixed(0)}°` : ''}
        </p>
      </div>
    </li>
  );
}

function PositionVorschau({ item, index }: { item: AdminOrderItemRow; index: number }) {
  const ansichten = Object.entries(item.previewUrlByView);
  // Ansichten mit Element, aber (noch) ohne gerenderte Vorschau – ehrlich
  // ausweisen statt stillschweigend wegzulassen.
  const fehlendeAnsichten = [...new Set(item.elements.map((e) => e.view))].filter(
    (view) => !item.previewUrlByView[view]
  );

  return (
    <div className={index > 0 ? 'mt-6 border-t border-gray-100 pt-6' : ''}>
      <p className="text-sm font-medium text-gray-800">
        Position {index + 1}: {item.productName} · {item.colorName}
      </p>

      {item.elements.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">Keine Personalisierung an dieser Position.</p>
      ) : (
        <>
          {(ansichten.length > 0 || fehlendeAnsichten.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-4">
              {ansichten.map(([view, url]) => (
                <figure key={view} className="w-40">
                  <div className="relative aspect-[620/720] w-40 overflow-hidden rounded border border-gray-200 bg-white">
                    <Image src={url!} alt={`${item.productName} · ${ansichtLabel(view)}`} fill sizes="160px" className="object-contain p-1" />
                  </div>
                  <figcaption className="mt-1 text-center text-xs text-gray-500">{ansichtLabel(view)}</figcaption>
                </figure>
              ))}
              {fehlendeAnsichten.map((view) => (
                <figure key={view} className="w-40">
                  <div className="flex aspect-[620/720] w-40 items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 p-2 text-center text-xs text-gray-400">
                    Vorschau für {ansichtLabel(view)} noch nicht erzeugt
                  </div>
                </figure>
              ))}
            </div>
          )}

          <ul className="mt-3">
            {item.elements.map((element, i) => (
              <ElementZeile key={i} element={element} index={i} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function ProductionPreview({ items }: { items: AdminOrderItemRow[] }) {
  return (
    <div>
      {items.map((item, i) => (
        <PositionVorschau key={i} item={item} index={i} />
      ))}
    </div>
  );
}
