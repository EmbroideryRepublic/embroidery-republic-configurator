/**
 * Produktionsübersicht je Bestellposition: für jede Ansicht mit mindestens
 * einem Element eine große Vorschaukarte (Kleidungsstück + Motive exakt wie
 * im Editor platziert, siehe lib/rendering/renderPrintView.ts) mit der
 * dazugehörigen, nummerierten Element-Liste ("Logo 1", "Text 1", …) direkt
 * darunter. Technische Positionsangaben (cm) ergänzen jede Zeile, ersetzen
 * die visuelle Darstellung aber nicht.
 *
 * Zeigt AUSSCHLIESSLICH bereits vorhandene Daten (lib/admin/data.ts::
 * getOrderDetail liest configuration_elements und signiert die längst
 * gespeicherten Vorschau-PNGs) – kein neues Rendering, keine neue
 * Datenhaltung. Fehlt eine Vorschau (Rendering ist nicht-fatal fehlgeschlagen,
 * oder es handelt sich um eine ältere Testbestellung ohne echte Storage-
 * Dateien), kann sie über denselben, bereits beim Bestellabschluss genutzten
 * Rendering-Pfad nachträglich erzeugt werden (RegeneratePreviewButton →
 * productionPreviewActions.ts). Schlägt auch das fehl, wird der tatsächliche
 * Grund angezeigt statt eine Lücke zu verschleiern.
 */
import Image from 'next/image';
import type { AdminOrderItemRow, AdminOrderElementRow } from '@/lib/admin/data';
import { ansichtLabel, sortiereAnsichten } from '@/lib/admin/ansichten';
import { RegeneratePreviewButton } from './RegeneratePreviewButton';

function ElementZeile({ element, nummer }: { element: AdminOrderElementRow; nummer: number }) {
  const bezeichnung = element.type === 'logo' ? `Logo ${nummer}` : `Text ${nummer}`;
  return (
    <li className="flex items-start gap-2.5 border-t border-gray-100 py-2 first:border-t-0">
      {element.type === 'logo' ? (
        <span className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-white">
          {element.logoPreviewUrl ? (
            <Image src={element.logoPreviewUrl} alt={element.fileName ?? bezeichnung} fill sizes="56px" className="object-contain p-1" />
          ) : (
            <span className="flex h-full items-center justify-center px-1 text-center text-[9px] leading-tight text-gray-400">
              kein Bild
            </span>
          )}
        </span>
      ) : (
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Text
        </span>
      )}
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-gray-800">{bezeichnung}</p>
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
          {element.xCm.toFixed(1)}/{element.yCm.toFixed(1)} cm · {element.widthCm.toFixed(1)}×{element.heightCm.toFixed(1)} cm
          {element.rotationDeg ? ` · ${element.rotationDeg.toFixed(0)}°` : ''}
        </p>
      </div>
    </li>
  );
}

function AnsichtsKarte({
  orderId,
  itemIndex,
  view,
  previewUrl,
  elements,
}: {
  orderId: string;
  itemIndex: number;
  view: string;
  previewUrl: string | undefined;
  elements: AdminOrderElementRow[];
}) {
  const zaehler: Record<'logo' | 'text', number> = { logo: 0, text: 0 };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50/60">
      <div className="relative aspect-[700/840] w-full border-b border-gray-200 bg-white">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`Vorschau ${ansichtLabel(view)}`}
            fill
            sizes="(min-width: 1280px) 360px, (min-width: 640px) 45vw, 90vw"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="text-xs text-gray-400">Vorschau noch nicht erzeugt</p>
            <RegeneratePreviewButton orderId={orderId} itemIndex={itemIndex} view={view} />
          </div>
        )}
      </div>
      <p className="border-b border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
        {ansichtLabel(view)}
      </p>
      <ul className="px-3 pb-1">
        {elements.map((element, i) => {
          zaehler[element.type] += 1;
          return <ElementZeile key={i} element={element} nummer={zaehler[element.type]} />;
        })}
      </ul>
    </div>
  );
}

function PositionUebersicht({ item, index, orderId }: { item: AdminOrderItemRow; index: number; orderId: string }) {
  const views = sortiereAnsichten([...new Set(item.elements.map((e) => e.view))]);
  const groessen = Object.entries(item.sizeQuantities)
    .filter(([, q]) => q > 0)
    .map(([size, q]) => `${size}×${q}`)
    .join(', ');

  return (
    <div className={index > 0 ? 'mt-8 border-t border-gray-100 pt-8' : ''}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-base font-semibold text-gray-900">
          Position {index + 1}: {item.productName} · {item.colorName}
        </p>
        <p className="text-xs text-gray-500">
          {groessen}
          {groessen ? ' · ' : ''}
          {item.printMethod === 'embroidery' ? 'Stickerei' : 'DTF'}
        </p>
      </div>

      {views.length === 0 ? (
        <p className="text-sm text-gray-400">Keine Personalisierung an dieser Position.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {views.map((view) => (
            <AnsichtsKarte
              key={view}
              orderId={orderId}
              itemIndex={index}
              view={view}
              previewUrl={item.previewUrlByView[view]}
              elements={item.elements.filter((e) => e.view === view)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductionPreview({ orderId, items }: { orderId: string; items: AdminOrderItemRow[] }) {
  return (
    <div>
      {items.map((item, i) => (
        <PositionUebersicht key={i} item={item} index={i} orderId={orderId} />
      ))}
    </div>
  );
}
