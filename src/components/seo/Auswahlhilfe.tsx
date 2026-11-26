/**
 * „Welches Modell passt?“ – Eckpunkte einer Produktart aus dem Katalog (lib/seo/auswahlhilfe.ts). Server-Komponente.
 */
import Link from 'next/link';
import type { AuswahlPunkt } from '@/lib/seo/auswahlhilfe';
import { markeUndName } from '@/lib/seo/auswahlhilfe';

export function Auswahlhilfe({ name, anzahl, punkte }: { name: string; anzahl: number; punkte: AuswahlPunkt[] }) {
  return (
    <section aria-labelledby="auswahlhilfe" className="mt-24 max-w-4xl">
      <h2 id="auswahlhilfe" className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-normal tracking-tight text-brand">
        {name}: Welches Modell passt?
      </h2>
      <p className="mt-4 text-[16px] leading-relaxed text-brand/70">
        Von {anzahl} Modellen sind das die Eckpunkte – nach Preis, Gewicht, Farben und Größen. Alle Werte stammen aus den Produktdaten; Material, Passform und Maße je Größe
        stehen auf der jeweiligen Produktseite.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {punkte.map((p) => (
          <li key={p.produkt.id} className="rounded-2xl border border-brand/[0.08] bg-white p-5">
            <p className="text-[12px] uppercase tracking-[0.14em] text-gold-dark">{p.titel}</p>
            <Link href={`/produkt/${p.produkt.id}`} className="mt-1.5 block font-serif text-[20px] leading-snug text-brand transition-colors hover:text-gold-dark">
              {markeUndName(p.produkt)}
            </Link>
            <p className="mt-1.5 text-[14px] leading-relaxed text-brand/70">{p.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
