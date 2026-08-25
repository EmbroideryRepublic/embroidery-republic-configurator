'use client';

/**
 * Löst die nachträgliche Erzeugung EINER fehlenden Druckvorschau aus (siehe
 * lib/actions/productionPreviewActions.ts) – nutzt dieselbe Rendering-
 * Pipeline wie der reguläre Bestellabschluss, kein neues System.
 *
 * Schlägt der Versuch fehl (z.B. weil die zugrunde liegende Logo-Datei nicht
 * mehr im Storage existiert – etwa bei älteren Testbestellungen), wird der
 * tatsächliche Grund angezeigt statt dauerhaft nur "nicht erzeugt".
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { erzeugeDruckvorschauNeu } from '@/lib/actions/productionPreviewActions';
import type { PrintView } from '@/types';

export function RegeneratePreviewButton({
  orderId,
  itemIndex,
  view,
}: {
  orderId: string;
  itemIndex: number;
  view: PrintView;
}) {
  const router = useRouter();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  function erzeugen() {
    starte(async () => {
      const r = await erzeugeDruckvorschauNeu(orderId, itemIndex, view);
      setMeldung({ ok: r.ok, text: r.meldung });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        disabled={laeuft}
        onClick={erzeugen}
        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {laeuft ? 'Wird erzeugt …' : 'Vorschau erzeugen'}
      </button>
      {meldung && !meldung.ok && <p className="max-w-[200px] text-center text-[10px] text-red-700">{meldung.text}</p>}
    </div>
  );
}
