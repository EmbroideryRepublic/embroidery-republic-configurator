'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Star, Trash2, Plus } from 'lucide-react';
import type { KundenAdresse } from '@/lib/account/types';
import {
  adresseAnlegenAction,
  adresseAktualisierenAction,
  adresseLoeschenAction,
  adresseAlsStandardAction,
  type KontoActionResult,
} from '@/lib/actions/konto';
import { AdressForm } from './AdressForm';

export function AdressListe({ adressen }: { adressen: KundenAdresse[] }) {
  const [bearbeiteId, setBearbeiteId] = useState<string | null>(null);
  const [neuOffen, setNeuOffen] = useState(adressen.length === 0);
  // Zweistufige Sicherheitsabfrage vorm Löschen – dasselbe Muster wie
  // CancelOrderButton.tsx: ein versehentlicher Klick (z.B. auf dem Handy)
  // soll die Adresse nicht sofort und unwiderruflich entfernen.
  const [loescheBestaetigenId, setLoescheBestaetigenId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const router = useRouter();

  // Zwei Aktionen (Standard setzen, Löschen) brauchen kein eigenes Formular
  // mit Fehlerzustand – ein Klick, ein Ergebnis. `<form action={...}>`
  // erwartet eine void-zurückgebende Funktion; die Server Actions liefern
  // aber KontoActionResult zurück (für die Formulare, die eine Fehlermeldung
  // anzeigen). Deshalb hier bewusst per Klick statt Formular ausgelöst,
  // Router-Refresh holt den neuen Stand serverseitig nach.
  function ausloesen(aktion: () => Promise<KontoActionResult>) {
    setFehler(null);
    startTransition(async () => {
      const ergebnis = await aktion();
      if (!ergebnis.success) setFehler(ergebnis.error ?? 'Das hat leider nicht funktioniert.');
      router.refresh();
    });
  }

  function loeschenBestaetigt(adresseId: string) {
    setLoescheBestaetigenId(null);
    ausloesen(() => adresseLoeschenAction(adresseId));
  }

  return (
    <div className="space-y-4">
      {fehler && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {fehler}
        </p>
      )}
      {adressen.map((adresse) =>
        bearbeiteId === adresse.id ? (
          <div key={adresse.id} className="rounded-2xl border border-gold/20 bg-white p-4 shadow-elegant">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand/50">Adresse bearbeiten</p>
            <AdressForm
              action={adresseAktualisierenAction.bind(null, adresse.id)}
              bestehend={adresse}
              onAbbrechen={() => setBearbeiteId(null)}
              onErfolg={() => setBearbeiteId(null)}
              submitLabel="Speichern"
              submitPendingLabel="Wird gespeichert …"
            />
          </div>
        ) : (
          <div key={adresse.id} className="rounded-2xl border border-gold/20 bg-white p-4 shadow-elegant">
            <div className="flex items-start justify-between gap-3">
              <div className="text-sm text-brand/80">
                {adresse.isDefault && (
                  <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-gold-light px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-dark">
                    <Star className="h-2.5 w-2.5 fill-current" /> Standard
                  </span>
                )}
                {adresse.label && <p className="text-xs font-medium text-brand/50">{adresse.label}</p>}
                <p className="font-medium text-brand">
                  {adresse.firstName} {adresse.lastName}
                </p>
                {adresse.company && <p>{adresse.company}</p>}
                <p>{adresse.street}</p>
                <p>
                  {adresse.zip} {adresse.city}, {adresse.country}
                </p>
                {adresse.phone && <p className="text-brand/50">{adresse.phone}</p>}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setBearbeiteId(adresse.id)}
                  className="inline-flex items-center gap-1 text-brand/50 hover:text-gold-dark"
                >
                  <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                </button>
                {!adresse.isDefault && (
                  <button
                    type="button"
                    onClick={() => ausloesen(() => adresseAlsStandardAction(adresse.id))}
                    className="inline-flex items-center gap-1 text-brand/50 hover:text-gold-dark"
                  >
                    <Star className="h-3.5 w-3.5" /> Als Standard
                  </button>
                )}
                {loescheBestaetigenId === adresse.id ? (
                  <div className="flex flex-col items-end gap-1 rounded-lg border border-red-200 bg-red-50 p-2 text-right">
                    <p className="text-[11px] font-medium text-red-900">Wirklich löschen?</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => loeschenBestaetigt(adresse.id)}
                        className="font-medium text-red-600 hover:text-red-700"
                      >
                        Ja, löschen
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoescheBestaetigenId(null)}
                        className="text-brand/50 hover:text-brand"
                      >
                        Abbrechen
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLoescheBestaetigenId(adresse.id)}
                    className="inline-flex items-center gap-1 text-brand/50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Löschen
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}

      {neuOffen ? (
        <div className="rounded-2xl border border-gold/20 bg-white p-4 shadow-elegant">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand/50">Neue Adresse</p>
          <AdressForm
            action={adresseAnlegenAction}
            onAbbrechen={adressen.length > 0 ? () => setNeuOffen(false) : undefined}
            onErfolg={() => setNeuOffen(false)}
            submitLabel="Adresse speichern"
            submitPendingLabel="Wird gespeichert …"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setNeuOffen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold/40 py-4 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/20"
        >
          <Plus className="h-4 w-4" /> Neue Adresse hinzufügen
        </button>
      )}
    </div>
  );
}
