'use client';

/**
 * Black-Week-Band für die Startseite (und die Aktionsseite): schwarze Fläche mit der Aussage in einem Satz, dem „Code“ als Gutscheinkarte
 * und zwei Wegen weiter. Der Code ist reine Anzeige – er wird nie eingegeben, der Rabatt kommt automatisch in den Warenkorb.
 *
 * Alle Angaben (Satz, Code, Zeitraum) stammen aus config/aktion.ts, nichts ist hier fest geschrieben. Der Server liefert das Band nur aus,
 * solange die Aktion läuft; der Browser blendet es aus, wenn sie inzwischen abgelaufen ist.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { verbleibendeTage, type PreisAktion } from '@/config/aktion';
import { useAktionNochAktiv } from './useAktion';

interface Props {
  aktion: PreisAktion;
  /** Auf der Aktionsseite selbst führt der zweite Knopf nicht noch einmal dorthin. */
  aufAktionsseite?: boolean;
}

export function BlackWeekBand({ aktion, aufAktionsseite = false }: Props) {
  const aktiv = useAktionNochAktiv(aktion);
  // „Noch X Tage“ erst im Browser: Die Zahl hängt von der Uhrzeit ab und würde sonst zwischen Server und Browser abweichen.
  const [tage, setTage] = useState<number | null>(null);
  useEffect(() => {
    setTage(verbleibendeTage(aktion));
  }, [aktion]);
  if (!aktiv) return null;

  return (
    <section aria-labelledby="black-week-titel" className="bg-brand text-white">
      <div className="mx-auto grid max-w-[1500px] items-center gap-8 px-4 py-12 sm:px-8 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
        <div>
          <p className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.22em] text-gold">
            <span aria-hidden className="h-[2px] w-6 bg-gold" />
            {aktion.name} · bis {aktion.letzterTag}
          </p>
          <h2 id="black-week-titel" className="mt-3 font-serif text-[clamp(2.5rem,6vw,4.75rem)] leading-[0.98] text-white">
            {aktion.prozent} % auf alles.
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/80">
            Gestalte dein Teil, lege es in den Warenkorb – der Rabatt ist schon drin. Für jedes Produkt, jede Stückzahl und jedes Motiv. Du musst
            keinen Code eintippen.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/konfigurator"
              className="group inline-flex items-center gap-3 rounded-full bg-gold-btn px-7 py-3.5 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-gold-dark"
            >
              Jetzt gestalten
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
            {!aufAktionsseite && (
              <Link
                href="/black-week"
                className="inline-flex items-center rounded-full border-2 border-white/40 px-6 py-3 text-[15px] font-semibold text-white transition-colors duration-200 hover:border-white hover:bg-white/10"
              >
                So funktioniert die Aktion
              </Link>
            )}
          </div>
        </div>

        {/* Gutscheinkarte: zeigt, wie der Rabatt im Warenkorb erscheint – automatisch, ohne Eingabefeld. */}
        <div className="relative mx-auto w-full max-w-md rounded-2xl border-2 border-dashed border-gold/70 bg-white/[0.04] p-6 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Dein Code im Warenkorb</p>
          <p className="mt-2 font-mono text-[clamp(2rem,5vw,2.75rem)] font-black leading-none tracking-[0.08em] text-white">{aktion.code}</p>
          <ul className="mt-5 space-y-2.5 text-[14px] text-white/90">
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" strokeWidth={2.5} aria-hidden />
              <span>Wird automatisch angewendet – nichts einzugeben</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" strokeWidth={2.5} aria-hidden />
              <span>{aktion.prozent} % auf Textil, Druck und Einrichtung</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" strokeWidth={2.5} aria-hidden />
              <span>Gilt für alle Bestellungen bis einschließlich {aktion.letzterTag}</span>
            </li>
          </ul>
          {tage !== null && tage > 0 && (
            <p className="mt-5 inline-block rounded-full bg-gold px-3 py-1 text-[12px] font-extrabold uppercase tracking-wide text-brand">
              {tage === 1 ? 'Letzter Tag' : `Noch ${tage} Tage`}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
