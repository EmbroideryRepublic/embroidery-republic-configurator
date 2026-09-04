'use client';

/**
 * Löst den Kundenfreigabe-Schritt aus (orderService.ts::sendeVorschauFreigabeAnfrage
 * über proofRequestActions.ts) – 1:1-Struktur von RegeneratePreviewButton.tsx.
 *
 * Deaktiviert, solange für mindestens eine Ansicht mit Elementen die
 * Druckvorschau fehlt (fehlenVorschauen(), dieselbe Prüfung wie in
 * naechsteAktion.ts) – ohne vollständige Vorschau gäbe es nichts zur
 * Freigabe zu zeigen.
 */
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { sendeVorschauFreigabeAnfrageAction } from '@/lib/actions/proofRequestActions';

export function RequestProofApprovalButton({ orderId, deaktiviert }: { orderId: string; deaktiviert: boolean }) {
  const router = useRouter();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  function senden() {
    starte(async () => {
      const r = await sendeVorschauFreigabeAnfrageAction(orderId);
      setMeldung({ ok: r.ok, text: r.meldung });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={laeuft || deaktiviert}
        onClick={senden}
        title={deaktiviert ? 'Für mindestens eine Ansicht fehlt noch die Druckvorschau.' : undefined}
        className="rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
      >
        {laeuft ? 'Wird gesendet …' : 'Vorschau zur Freigabe senden'}
      </button>
      {meldung && (
        <p className={`text-[10px] ${meldung.ok ? 'text-gray-500' : 'text-red-700'}`}>{meldung.text}</p>
      )}
    </div>
  );
}
