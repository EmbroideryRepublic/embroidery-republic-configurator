'use client';

/**
 * Kleine Plakette an Preisen (Produktseite): „Black Week: −10 % im Warenkorb, automatisch“. Reine Information – die Preise auf der Seite sind
 * „ab“-Preise für die Ware, der Rabatt wird im Konfigurator und Warenkorb auf den Positionspreis gerechnet (config/aktion.ts).
 * Der Server liefert die Plakette nur, solange die Aktion läuft; der Browser blendet sie bei Ablauf selbst aus.
 */
import { Tag } from 'lucide-react';
import type { PreisAktion } from '@/config/aktion';
import { useAktionNochAktiv } from './useAktion';

export function AktionsPlakette({ aktion, className = '' }: { aktion: PreisAktion; className?: string }) {
  const aktiv = useAktionNochAktiv(aktion);
  if (!aktiv) return null;
  return (
    <p
      data-testid="aktion-plakette"
      className={`inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-lg bg-brand px-3 py-2 text-[12px] font-semibold leading-snug text-white ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <Tag className="h-3.5 w-3.5 text-gold" aria-hidden />
        <span className="font-black uppercase tracking-[0.14em]">{aktion.name}</span>
        <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-extrabold tabular-nums text-brand">−{aktion.prozent} %</span>
      </span>
      <span className="font-medium text-white/85">
        im Warenkorb automatisch ({aktion.code}) · bis {aktion.letzterTagKurz}
      </span>
    </p>
  );
}
