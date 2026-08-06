/**
 * Eine Produktkachel. Server-Komponente – nichts daran ist interaktiv außer
 * dem Link.
 *
 * ── Weniger Text, mehr Ware ───────────────────────────────────────────
 * Gezeigt werden nur Marke, Name, Preis und die verfügbaren Farben. Material,
 * Flächengewicht und Qualitätsstufe stehen auf der Produktseite – in der
 * Übersicht lenken sie vom Kleidungsstück ab. Das Bild bekommt dafür die
 * Fläche, die es in einem Modeshop braucht.
 *
 * Die Auszeichnungen sind ABGELEITET, nicht gepflegt:
 *   • „Bestseller" aus den echten Verkaufszahlen (order_items)
 *   • Nachhaltigkeitszeichen aus der Materialgruppe (Bio/recycelt)
 *
 * ── data-Attribute ────────────────────────────────────────────────────
 * `data-preis` und `data-gewicht` tragen die Zahlenwerte für die
 * Prüfstrecke. Sie stehen bewusst als Attribut und nicht als sichtbarer
 * Text: Die Prüfung soll die Gestaltung nicht diktieren.
 */
import Link from 'next/link';
import Image from 'next/image';
import { Leaf } from 'lucide-react';
import type { ProductConfig } from '@/config/products/types';
import { produktBild } from '@/lib/assets';
import { materialGruppen } from '@/config/products/facetten';
import { formatiereGeld } from '@/lib/format';
import { ermittleVerfuegbarkeit, VERFUEGBARKEIT_LABELS } from '@/lib/catalog/verfuegbarkeit';
import type { Ansicht } from '@/lib/catalog/kriterien';

/** So viele Farbpunkte werden gezeigt, der Rest als „+N". */
const PUNKTE = 6;

/** Farbpunkt mit leichtem Glanz und weichem Rand – wirkt wie Stoff, nicht
 *  wie ein Farbfeld aus einem Formular. */
const PUNKT =
  'h-[18px] w-[18px] rounded-full ring-1 ring-black/10 ' +
  'shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.45),inset_0_-1.5px_2px_rgba(0,0,0,0.12)] ' +
  'transition-transform duration-300 ease-out group-hover:scale-105';

export function Produktkachel({
  produkt, bestseller, ansicht,
}: { produkt: ProductConfig; bestseller: boolean; ansicht: Ansicht }) {
  const stand = ermittleVerfuegbarkeit(produkt);
  const gruppen = materialGruppen(produkt);
  const nachhaltig = gruppen.includes('bio-baumwolle') || gruppen.includes('recycelt');
  const liste = ansicht === 'liste';

  return (
    <Link
      href={`/produkt/${produkt.id}`}
      data-produkt={produkt.id}
      data-preis={produkt.basePrice}
      data-gewicht={produkt.weightGsm}
      className={`group block transition-transform duration-300 ease-out ${
        liste ? 'flex items-center gap-8' : 'hover:-translate-y-1'
      }`}
    >
      <div
        // Weiße Bildfläche mit Absicht: Die Produktfotos haben selbst einen
        // weißen Hintergrund. Auf einer getönten Fläche stünde das Foto als
        // sichtbares weißes Rechteck darin – so geht es nahtlos auf.
        className={`relative overflow-hidden bg-white transition-shadow duration-300 ease-out group-hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.22)] ${
          liste ? 'h-44 w-44 shrink-0 rounded-2xl' : 'aspect-[3/4] rounded-2xl'
        }`}
      >
        {produkt.colors[0] && (
          <Image
            src={produktBild(produkt.id, produkt.colors)}
            alt={produkt.name}
            fill
            sizes={liste ? '176px' : '(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw'}
            className={`object-contain p-6 transition-transform duration-[600ms] ease-out group-hover:scale-[1.05] ${
              stand !== 'lieferbar' ? 'opacity-40' : ''
            }`}
          />
        )}

        {bestseller && stand === 'lieferbar' && (
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-brand backdrop-blur-sm">
            Bestseller
          </span>
        )}
        {nachhaltig && (
          <span
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 backdrop-blur-sm"
            title="Bio-Baumwolle oder recyceltes Material"
          >
            <Leaf className="h-3.5 w-3.5 text-green-700" aria-label="Nachhaltiges Material" />
          </span>
        )}
        {stand !== 'lieferbar' && (
          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[10px] uppercase tracking-wide text-brand/70 backdrop-blur-sm">
            {VERFUEGBARKEIT_LABELS[stand]}
          </span>
        )}
      </div>

      <div className={liste ? 'min-w-0 flex-1' : 'pt-5'}>
        <p className="text-[11px] uppercase tracking-[0.14em] text-brand/40">{produkt.brand}</p>
        <p className="mt-1.5 truncate text-[15px] leading-snug text-brand transition-colors duration-300 group-hover:text-gold-dark">
          {produkt.name}
        </p>
        <p className="mt-2.5 text-[16px] font-medium tabular-nums text-brand">
          <span className="mr-1 text-[12px] font-normal text-brand/40">ab</span>
          {formatiereGeld(produkt.basePrice)}
        </p>

        <div className="mt-3.5 flex items-center gap-2">
          {produkt.colors.slice(0, PUNKTE).map((f) => (
            <span key={f.id} title={f.name} className={PUNKT} style={{ backgroundColor: f.hex }} />
          ))}
          {produkt.colors.length > PUNKTE && (
            <span className="ml-1 text-[11px] tracking-wide text-brand/40">
              +{produkt.colors.length - PUNKTE}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
