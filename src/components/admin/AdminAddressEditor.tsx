'use client';

/**
 * Adresskorrektur durch den Betreiber – der häufigste Support-Fall
 * ("habe mich bei der Hausnummer vertippt") ist damit in 30 Sekunden
 * erledigt statt per vollständigem Storno. Erscheint nur, solange kein
 * DHL-Label erstellt wurde (siehe orderService.ts::korrigiereLieferadresseDurchAdmin).
 */
import { useState, useTransition } from 'react';
import { korrigiereLieferadresseAction } from '@/lib/actions/addressCorrectionActions';

export function AdminAddressEditor({
  orderId,
  customerName,
  shipping,
}: {
  orderId: string;
  customerName: string;
  shipping: { street: string; zip: string; city: string; country: string } | null;
}) {
  const [offen, setOffen] = useState(false);
  const [name, setName] = useState(customerName);
  const [strasse, setStrasse] = useState(shipping?.street ?? '');
  const [plz, setPlz] = useState(shipping?.zip ?? '');
  const [ort, setOrt] = useState(shipping?.city ?? '');
  const [land, setLand] = useState(shipping?.country ?? '');
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  if (!offen) {
    return (
      <button
        type="button"
        onClick={() => setOffen(true)}
        className="mt-2 text-xs text-gray-500 underline hover:text-gray-800"
      >
        Name/Adresse korrigieren
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded border border-gray-200 bg-gray-50/60 p-3">
      <label className="block text-xs">
        <span className="text-gray-600">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="text-gray-600">Straße &amp; Hausnummer</span>
        <input
          value={strasse}
          onChange={(e) => setStrasse(e.target.value)}
          className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs">
          <span className="text-gray-600">PLZ</span>
          <input
            value={plz}
            onChange={(e) => setPlz(e.target.value)}
            className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-gray-600">Ort</span>
          <input
            value={ort}
            onChange={(e) => setOrt(e.target.value)}
            className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm"
          />
        </label>
      </div>
      <label className="block text-xs">
        <span className="text-gray-600">Land</span>
        <input
          value={land}
          onChange={(e) => setLand(e.target.value)}
          className="mt-0.5 w-full rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      {meldung && (
        <p className={`text-xs ${meldung.ok ? 'text-green-700' : 'text-red-700'}`}>{meldung.text}</p>
      )}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={laeuft}
          onClick={() =>
            starte(async () => {
              setMeldung(null);
              const r = await korrigiereLieferadresseAction(orderId, {
                customerName: name,
                strasse,
                plz,
                ort,
                land,
              });
              setMeldung({ ok: r.ok, text: r.meldung });
              if (r.ok) setOffen(false);
            })
          }
          className="rounded bg-gray-800 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
        >
          {laeuft ? 'Wird gespeichert …' : 'Speichern'}
        </button>
        <button
          type="button"
          disabled={laeuft}
          onClick={() => setOffen(false)}
          className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}
