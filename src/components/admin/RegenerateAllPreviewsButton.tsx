'use client';

/**
 * Erzeugt alle Vorschaubilder und das Produktionsblatt einer Bestellung aus den
 * gespeicherten Daten neu (lib/actions/productionPreviewActions.ts::
 * erzeugeProduktionsunterlagenNeuAktion) – 1:1-Struktur von
 * RegeneratePreviewButton.tsx, nur für die ganze Bestellung.
 *
 * Gedacht für Bestellungen, deren Bilder mit einem inzwischen behobenen
 * Darstellungsfehler entstanden sind. Es wird nichts verschickt.
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { erzeugeProduktionsunterlagenNeuAktion } from '@/lib/actions/productionPreviewActions';

export function RegenerateAllPreviewsButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  function erzeugen() {
    starte(async () => {
      const r = await erzeugeProduktionsunterlagenNeuAktion(orderId);
      setMeldung({ ok: r.ok, text: r.meldung });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={laeuft}
        onClick={erzeugen}
        title="Rendert Vorschaubilder und Produktionsblatt aus den gespeicherten Bestelldaten neu. Es wird nichts verschickt."
        className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {laeuft ? 'Wird neu erzeugt …' : 'Vorschau & Produktionsblatt neu erzeugen'}
      </button>
      {meldung && (
        <p className={`max-w-xs text-[10px] ${meldung.ok ? 'text-gray-500' : 'text-red-700'}`}>{meldung.text}</p>
      )}
    </div>
  );
}
