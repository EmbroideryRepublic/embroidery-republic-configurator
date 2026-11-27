'use client';

/**
 * Schmale Leiste über der Kopfzeile, solange eine Preisaktion läuft (config/aktion.ts, aktuell Black Week).
 *
 * Eine Zeile, am Handy gekürzt: Name, Satz, Zeitraum und Verweis auf die Aktionsseite. Sie scrollt mit der Seite weg (die Kopfzeile darunter
 * bleibt kleben) und fehlt im Konfigurator und im Adminbereich – dort hat die Oberfläche eine feste Höhe bzw. ist nicht für die Kundschaft.
 * Der Server entscheidet, OB die Leiste ausgeliefert wird (Layout); der Browser blendet sie aus, wenn die Aktion inzwischen abgelaufen ist.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import type { PreisAktion } from '@/config/aktion';
import { useAktionNochAktiv } from './useAktion';

export function AktionsLeiste({ aktion }: { aktion: PreisAktion }) {
  const pfad = usePathname();
  const aktiv = useAktionNochAktiv(aktion);
  if (!aktiv || pfad?.startsWith('/konfigurator') || pfad?.startsWith('/admin')) return null;

  return (
    <div role="region" aria-label={`${aktion.name}: ${aktion.prozent} % Rabatt`} className="bg-brand text-white">
      <Link
        href="/black-week"
        className="mx-auto flex min-h-10 max-w-[1500px] items-center justify-center gap-x-3 gap-y-0.5 px-4 py-2 text-[13px] leading-tight transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.06] sm:px-8"
      >
        <span className="flex-shrink-0 text-[11px] font-black uppercase tracking-[0.18em]">{aktion.name}</span>
        <span className="flex-shrink-0 rounded-full bg-gold px-2.5 py-0.5 text-[12px] font-extrabold tabular-nums text-brand">−{aktion.prozent} %</span>
        <span className="min-w-0 truncate text-white/90">
          <span className="sm:hidden">auf alles · bis {aktion.letzterTagKurz}</span>
          <span className="hidden sm:inline">
            auf alle Produkte · automatisch im Warenkorb (Code {aktion.code}) · bis {aktion.letzterTag}
          </span>
        </span>
        <span className="hidden flex-shrink-0 items-center gap-1 font-semibold text-gold underline-offset-2 sm:inline-flex">
          Zur Aktion
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </span>
      </Link>
    </div>
  );
}
