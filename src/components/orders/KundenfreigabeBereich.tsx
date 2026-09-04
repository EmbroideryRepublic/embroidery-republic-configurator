'use client';

/**
 * Der verbindliche Freigabeschritt vor Produktionsstart (FAQ: "Vor
 * Produktionsstart erhalten Sie eine finale Vorschau zur Freigabe").
 *
 * Zeigt die bereits in Phase 2 gerenderten Druckvorschauen (Kleidungsstück +
 * Motive exakt wie im Editor platziert) je Position/Ansicht und verlangt eine
 * ausdrückliche Kundenentscheidung: "Design freigeben" (zweistufig, wie
 * CancelOrderButton.tsx – nicht umkehrbar, schaltet die Produktion frei) oder
 * "Änderung wünschen" mit Kommentar (reines Kommunikationssignal, siehe
 * proofApproval.ts – keine Bestellbearbeitung).
 *
 * Zwei Aufrufkontexte, dieselbe Komponente: signierter Gast-Token
 * (/bestellung/[token]) oder Kundenkonto (/konto/bestellungen/[id]) – exakt
 * dasselbe Prop-Muster wie CancelOrderButton.tsx.
 */
import { useState, useTransition } from 'react';
import Image from 'next/image';
import { freigebeVorschauAction, wuenscheAenderungAction, type FreigabeAnfrage } from '@/lib/actions/proofApproval';
import { PRINT_VIEW_LABELS } from '@/lib/actions/orderTypes';

interface KundenfreigabePosition {
  produktName: string;
  farbe: string;
  veredelung: 'DTF-Transferdruck' | 'Stickerei';
  previewUrlByView: Partial<Record<string, string>>;
}

type KundenfreigabeBereichProps = {
  positionen: KundenfreigabePosition[];
} & ({ token: string; orderId?: never } | { orderId: string; token?: never });

function ansichtLabel(view: string): string {
  return PRINT_VIEW_LABELS[view as keyof typeof PRINT_VIEW_LABELS] ?? view;
}

export function KundenfreigabeBereich({ token, orderId, positionen }: KundenfreigabeBereichProps) {
  const [modus, setModus] = useState<'ansicht' | 'freigabe-bestaetigen' | 'aenderung'>('ansicht');
  const [kommentar, setKommentar] = useState('');
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const anfrage: FreigabeAnfrage = token ? { art: 'token', token } : { art: 'konto', orderId: orderId as string };
  const hatStickerei = positionen.some((p) => p.veredelung === 'Stickerei');

  if (erfolg) {
    return (
      <section className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h2 className="text-sm font-semibold text-green-900">Danke für Ihre Rückmeldung</h2>
        <p className="mt-1 text-sm text-green-800">{erfolg}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gold/40 bg-gold-light/30 p-4">
      <h2 className="text-sm font-semibold text-brand">Bitte Druckvorschau freigeben</h2>
      <p className="mt-1 text-sm text-brand/70">
        So werden Ihre Motive tatsächlich platziert. Bitte prüfen Sie die Vorschau und geben Sie sie frei, damit wir
        mit der Produktion beginnen können.
      </p>

      {hatStickerei && (
        <p className="mt-2 text-xs text-brand/60">
          Für Stickerei digitalisiert unser Team Ihr Logo anschließend manuell in Garnfarben – die Vorschau zeigt die
          Platzierung, nicht das finale Stickbild.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {positionen.map((pos, i) => {
          const ansichten = Object.entries(pos.previewUrlByView).filter(
            (eintrag): eintrag is [string, string] => Boolean(eintrag[1])
          );
          if (ansichten.length === 0) return null;
          return (
            <div key={i}>
              <p className="text-xs font-medium text-brand/70">
                {pos.produktName} – {pos.farbe}
              </p>
              <div className="mt-1 flex flex-wrap gap-3">
                {ansichten.map(([view, url]) => (
                  <div key={view} className="text-center">
                    <div className="relative h-32 w-32 overflow-hidden rounded border border-brand/10 bg-white">
                      <Image src={url} alt={`${pos.produktName} ${ansichtLabel(view)}`} fill sizes="128px" className="object-contain p-1" />
                    </div>
                    <p className="mt-1 text-[10px] text-brand/50">{ansichtLabel(view)}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {fehler && <p className="mt-3 text-xs font-medium text-red-700">{fehler}</p>}

      {modus === 'ansicht' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setFehler(null);
              setModus('freigabe-bestaetigen');
            }}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
          >
            Design freigeben
          </button>
          <button
            type="button"
            onClick={() => {
              setFehler(null);
              setModus('aenderung');
            }}
            className="rounded-md border border-brand/20 bg-white px-4 py-2 text-sm text-brand/70 transition-colors hover:bg-cream/60"
          >
            Änderung wünschen
          </button>
        </div>
      )}

      {modus === 'freigabe-bestaetigen' && (
        <div className="mt-4 rounded-md border border-brand/20 bg-white p-4">
          <p className="text-sm font-medium text-brand">Vorschau wirklich freigeben?</p>
          <p className="mt-1 text-xs text-brand/70">
            Mit der Freigabe bestätigen Sie, dass die Vorschau genau dem entspricht, was produziert werden soll. Wir
            beginnen danach mit der Fertigung.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setFehler(null);
                  const r = await freigebeVorschauAction(anfrage);
                  if (!r.ok) {
                    setFehler(r.fehler ?? 'Die Freigabe war nicht möglich.');
                    setModus('ansicht');
                  } else {
                    setErfolg('Vielen Dank – die Vorschau ist freigegeben, wir beginnen mit der Produktion.');
                  }
                })
              }
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {isPending ? 'Wird übermittelt …' : 'Ja, Design freigeben'}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setModus('ansicht')}
              className="rounded-md border border-brand/20 bg-white px-4 py-2 text-sm text-brand/70 transition-colors hover:bg-cream/60 disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {modus === 'aenderung' && (
        <div className="mt-4">
          <textarea
            value={kommentar}
            onChange={(e) => setKommentar(e.target.value)}
            rows={3}
            placeholder="Was möchten Sie geändert haben?"
            className="w-full rounded-md border border-brand/20 p-2 text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending || !kommentar.trim()}
              onClick={() =>
                startTransition(async () => {
                  setFehler(null);
                  const r = await wuenscheAenderungAction(anfrage, kommentar);
                  if (!r.ok) setFehler(r.fehler ?? 'Die Rückmeldung konnte nicht übermittelt werden.');
                  else setErfolg('Vielen Dank – wir melden uns bei Ihnen, um die gewünschte Änderung zu klären.');
                })
              }
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50"
            >
              {isPending ? 'Wird übermittelt …' : 'Änderung absenden'}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setModus('ansicht')}
              className="rounded-md border border-brand/20 bg-white px-4 py-2 text-sm text-brand/70 transition-colors hover:bg-cream/60 disabled:opacity-50"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
