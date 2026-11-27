/**
 * Aktionsseite „Black Week“: Was gilt, wie kommt der Rabatt in den Warenkorb, was spart man konkret.
 *
 * Alle Angaben (Satz, Code, Zeitraum) kommen aus config/aktion.ts, die Rechenbeispiele aus der Preis-Engine (lib/aktion/beispiele.ts) – nichts
 * ist hier fest geschrieben. Ist die Aktion vorbei, zeigt dieselbe Adresse „beendet“ und führt zum Konfigurator; die Adresse bleibt für das nächste
 * Jahr erhalten. Die Seite wird stündlich neu erzeugt, der Browser blendet das Band zusätzlich selbst aus, sobald die Aktion abläuft.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { BLACK_WEEK_2026, aktuelleAktion } from '@/config/aktion';
import { PRODUKTIONSTAGE } from '@/config/company';
import { SHIPPING_RATES } from '@/config/shipping';
import { formatiereGeld } from '@/lib/format';
import { berechneAktionsBeispiele } from '@/lib/aktion/beispiele';
import { BlackWeekBand } from '@/components/aktion/BlackWeekBand';
import { STANDARD_VORSCHAUBILD } from '@/lib/seo/vorschau';

// Stündlich neu erzeugen: Beginn und Ende der Aktion richten sich nach der Uhr (config/aktion.ts).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${BLACK_WEEK_2026.name}: ${BLACK_WEEK_2026.prozent} % Rabatt auf alles`,
  description: `${BLACK_WEEK_2026.name} bei Embroidery Republic: ${BLACK_WEEK_2026.prozent} % Rabatt auf alle Produkte und jede Stückzahl, bis ${BLACK_WEEK_2026.letzterTag}. Der Rabatt wird im Warenkorb automatisch angewendet – kein Code nötig.`,
  alternates: { canonical: '/black-week' },
  openGraph: {
    title: `${BLACK_WEEK_2026.name}: ${BLACK_WEEK_2026.prozent} % Rabatt auf alles`,
    description: `Textilien gestalten und bedrucken lassen – ${BLACK_WEEK_2026.prozent} % Rabatt bis ${BLACK_WEEK_2026.letzterTag}, automatisch im Warenkorb.`,
    images: [STANDARD_VORSCHAUBILD],
  },
};

const KATEGORIEN: { href: string; label: string }[] = [
  { href: '/t-shirts-bedrucken-besticken', label: 'T-Shirts' },
  { href: '/hoodies-bedrucken-besticken', label: 'Hoodies' },
  { href: '/poloshirts-besticken-bedrucken', label: 'Poloshirts' },
  { href: '/jacken-bedrucken', label: 'Jacken' },
  { href: '/kinderbekleidung-bedrucken', label: 'Kinderbekleidung' },
  { href: '/sportbekleidung-bedrucken', label: 'Sportbekleidung' },
];

export default async function BlackWeekSeite() {
  const aktion = aktuelleAktion();

  if (!aktion) {
    return (
      <main className="bg-brand-light">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-8">
          <p className="text-[12px] font-black uppercase tracking-[0.22em] text-gold-dark">{BLACK_WEEK_2026.name}</p>
          <h1 className="mt-3 font-serif text-[clamp(2rem,5vw,3.25rem)] leading-tight text-brand">Die Aktion ist beendet.</h1>
          <p className="mt-4 text-[16px] leading-relaxed text-brand/75">
            Die {BLACK_WEEK_2026.name} lief bis {BLACK_WEEK_2026.letzterTag}. Gestalten und bestellen kannst du natürlich weiterhin – ab 1 Stück, mit
            Live-Preis im Konfigurator.
          </p>
          <Link
            href="/konfigurator"
            className="mt-7 inline-flex items-center gap-3 rounded-full bg-gold-btn px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-gold-dark"
          >
            Jetzt gestalten <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </main>
    );
  }

  const beispiele = await berechneAktionsBeispiele(aktion);

  return (
    <main className="bg-brand-light">
      <h1 className="sr-only">
        {aktion.name}: {aktion.prozent} % Rabatt auf alles, bis {aktion.letzterTag}
      </h1>
      <BlackWeekBand aktion={aktion} aufAktionsseite />

      <div className="mx-auto max-w-[1100px] px-4 py-14 sm:px-8 sm:py-16">
        {/* ── So kommt der Rabatt in den Warenkorb ─────────────────────── */}
        <section aria-labelledby="ablauf">
          <h2 id="ablauf" className="font-serif text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight text-brand">
            So kommt der Rabatt zu dir.
          </h2>
          <ol className="mt-7 grid gap-4 sm:grid-cols-3">
            {[
              { titel: 'Gestalten', text: 'Produkt, Farbe und Motiv im Konfigurator wählen – der Preis steht live neben deinem Entwurf.' },
              {
                titel: 'In den Warenkorb',
                text: `Der Rabatt ist schon im Preis, im Warenkorb steht ${aktion.code} als „angewendet“. Du musst nichts eintippen.`,
              },
              { titel: 'Bestellen', text: `Bestellungen bis einschließlich ${aktion.letzterTag} bekommen den Rabatt – danach gilt wieder der normale Preis.` },
            ].map((schritt, i) => (
              <li key={schritt.titel} className="rounded-2xl border border-brand/10 bg-white p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-white" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-3 text-[17px] font-semibold text-brand">{schritt.titel}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-brand/75">{schritt.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Rechenbeispiele aus der Preis-Engine ─────────────────────── */}
        {beispiele.length > 0 && (
          <section aria-labelledby="beispiele" className="mt-16">
            <h2 id="beispiele" className="font-serif text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight text-brand">
              Was du konkret sparst.
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-brand/75">
              Drei Beispiele mit denselben Preisen wie im Konfigurator, ohne Versand. Mehr Stück senken den Stückpreis; die {aktion.prozent} % kommen
              zusätzlich obendrauf.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-brand/10 bg-white">
              <table className="w-full min-w-[34rem] text-[14px]">
                <thead>
                  <tr className="border-b border-brand/10 text-left text-[12px] uppercase tracking-wide text-brand/70">
                    <th scope="col" className="px-4 py-3 font-medium">Beispiel</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Preis ohne Rabatt</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Mit {aktion.name}</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Du sparst</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {beispiele.map((b) => (
                    <tr key={b.beschriftung} className="border-b border-brand/[0.06] last:border-0">
                      <th scope="row" className="px-4 py-3.5 text-left font-medium text-brand">{b.beschriftung}</th>
                      <td className="px-4 py-3.5 text-right text-brand/70">{formatiereGeld(b.gesamtRegulaer)}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-brand">{formatiereGeld(b.gesamtAktion)}</td>
                      <td className="px-4 py-3.5 text-right font-semibold text-gold-dark">{formatiereGeld(b.ersparnis)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Was gilt, was nicht ───────────────────────────────────────── */}
        <section aria-labelledby="bedingungen" className="mt-16">
          <h2 id="bedingungen" className="font-serif text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight text-brand">
            Das gilt.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-brand/10 bg-white p-6">
              <h3 className="text-[15px] font-semibold text-brand">Rabattiert</h3>
              <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-brand/80">
                {[
                  `${aktion.prozent} % auf jede Position im Warenkorb: Textil, Druck und – bei sehr kleinen Mengen – die Einrichtung`,
                  'Alle Produkte, alle Farben, jede Stückzahl ab 1 Stück',
                  'Zusätzlich zu deinem Mengenpreis: Erst gilt die Staffel, dann kommen die Prozent darauf',
                ].map((z) => (
                  <li key={z} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-dark" strokeWidth={2.5} aria-hidden />
                    <span>{z}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-brand/10 bg-white p-6">
              <h3 className="text-[15px] font-semibold text-brand">Nicht rabattiert</h3>
              <ul className="mt-3 space-y-2.5 text-[14px] leading-relaxed text-brand/80">
                {[
                  `Versandkosten (versandkostenfrei ab ${formatiereGeld(SHIPPING_RATES.DE.freeFrom)} Warenwert, gerechnet nach dem Rabatt)`,
                  `Bestellungen, die nach dem ${aktion.letzterTag} abgeschickt werden`,
                ].map((z) => (
                  <li key={z} className="flex items-start gap-2.5">
                    <Minus className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand/70" strokeWidth={2.5} aria-hidden />
                    <span>{z}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[13px] leading-relaxed text-brand/70">
                Produktion in {PRODUKTIONSTAGE.von}–{PRODUKTIONSTAGE.bis} Werktagen nach Bestellfreigabe, wie sonst auch.
              </p>
            </div>
          </div>
        </section>

        {/* ── Kurze Fragen ──────────────────────────────────────────────── */}
        <section aria-labelledby="fragen" className="mt-16 max-w-3xl">
          <h2 id="fragen" className="font-serif text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight text-brand">
            Kurz gefragt.
          </h2>
          <dl className="mt-6 space-y-6 text-[15px] leading-relaxed">
            <div>
              <dt className="font-semibold text-brand">Muss ich den Code {aktion.code} irgendwo eingeben?</dt>
              <dd className="mt-1 text-brand/75">
                Nein. Der Rabatt wird automatisch angewendet. Im Warenkorb siehst du {aktion.code} als „angewendet“ und den Betrag, den du sparst. Ein
                Eingabefeld gibt es bewusst nicht.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand">Wie lange läuft die Aktion?</dt>
              <dd className="mt-1 text-brand/75">
                Bis einschließlich {aktion.letzterTag}. Entscheidend ist, wann du die Bestellung abschickst.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-brand">Gilt der Rabatt auch für große Mengen?</dt>
              <dd className="mt-1 text-brand/75">
                Ja, für jede Stückzahl. Der Mengenpreis bleibt erhalten und der Rabatt kommt zusätzlich dazu.
              </dd>
            </div>
          </dl>
        </section>

        {/* ── Los geht’s ─────────────────────────────────────────────────── */}
        <section aria-labelledby="loslegen" className="mt-16">
          <h2 id="loslegen" className="font-serif text-[clamp(1.75rem,3.4vw,2.5rem)] leading-tight text-brand">
            Was soll es werden?
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {KATEGORIEN.map((k) => (
              <li key={k.href}>
                <Link
                  href={k.href}
                  className="group flex min-h-14 items-center justify-between gap-2 rounded-xl border border-brand/10 bg-white px-4 py-3 text-[15px] font-semibold text-brand transition-colors hover:border-gold hover:text-gold-dark"
                >
                  {k.label}
                  <ArrowRight className="h-4 w-4 text-gold-dark transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/konfigurator"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-gold-btn px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-gold-dark"
          >
            Direkt im Konfigurator starten <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </div>
    </main>
  );
}
