/**
 * „Ware bestellen“: zu jeder Position der Bestellung der Direktlink zum Artikel beim Lieferanten (Textil-Großhandel, L-Shop, …),
 * dazu Artikelnummer, Farbe und Größen – damit der Betreiber sofort weiß, was er einkaufen muss (lib/suppliers/bestelllinks.ts).
 *
 * Gilt für ALLE Produkte des Katalogs (bezugsquellen.generated.ts), nicht nur für die mit Browser-Automatisierung angebundenen.
 * Die Links öffnen in einem neuen Tab; der L-Shop verlangt die Anmeldung im eigenen Browser des Betreibers.
 */
import { bestellhilfe, groessenText } from '@/lib/suppliers/bestelllinks';

export interface EinkaufsPosition {
  productId: string;
  productName: string;
  colorName: string;
  sizeQuantities: Record<string, number>;
  quantity: number;
}

const KNOPF: Record<string, string> = {
  'textil-grosshandel': 'border-gold-dark text-gold-dark hover:bg-brand-light',
  'l-shop': 'border-sky-700 text-sky-800 hover:bg-sky-50',
  andere: 'border-gray-500 text-gray-800 hover:bg-gray-50',
};

export function EinkaufsLinks({ items }: { items: EinkaufsPosition[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4" data-testid="einkaufs-links">
      <h2 className="mb-1 text-sm font-semibold">Ware bestellen – Direktlinks</h2>
      <p className="mb-3 text-xs text-gray-500">
        Jede Position mit Artikelnummer, Farbe und Größen. Ein Klick öffnet den Artikel beim Lieferanten (neuer Tab).
      </p>
      <ul className="space-y-3">
        {items.map((item, index) => {
          const hilfe = bestellhilfe(item.productId);
          return (
            <li key={`${item.productId}-${index}`} className="rounded-md border border-gray-100 bg-gray-50/60 p-3 text-sm">
              <div className="font-medium text-gray-900">
                {item.productName}
                {hilfe.artikelnummer && <span className="ml-2 text-xs font-normal text-gray-500">Art.-Nr. {hilfe.artikelnummer}</span>}
              </div>
              <div className="mt-0.5 text-xs text-gray-700">
                Farbe: <span className="font-medium">{item.colorName}</span> · Größen:{' '}
                <span className="font-medium">{groessenText(item.sizeQuantities) || '–'}</span> · zusammen {item.quantity} Stück
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {hilfe.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`rounded border px-2.5 py-1 text-xs font-semibold ${KNOPF[link.quelle] ?? KNOPF.andere}`}
                  >
                    {link.label} öffnen ↗
                  </a>
                ))}
                {hilfe.hinweis && <span className="text-xs font-medium text-amber-800">{hilfe.hinweis}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
