'use client';

/**
 * Auftrag bearbeiten: Positionen entfernen oder Stückzahlen verringern.
 *
 * Der Ablauf hat bewusst DREI Schritte, damit nichts passiert, was der
 * Betreiber nicht vorher gesehen hat:
 *
 *   1. ändern      Je Position „Entfernen“ oder weniger Stück je Größe eintragen.
 *   2. Vorschau    „Vorschau berechnen“ schreibt NICHTS. Der Server rechnet den
 *                  Preis neu (Serverpreis-Berechnung des Shops) und zeigt alter
 *                  Preis, neuer Preis, Differenz, Hinweise und den Wortlaut der
 *                  Kundenmail.
 *   3. speichern   Erst nach Grund, den nötigen Bestätigungen und dem Klick auf
 *                  „Änderung speichern“. Die Mail an die Kundschaft lässt sich
 *                  abwählen.
 *
 * Wird irgendetwas im Formular geändert, verfällt die Vorschau – gespeichert
 * wird immer nur, was zuletzt berechnet und angezeigt wurde (der Server prüft
 * das zusätzlich anhand der Summen).
 *
 * Nur VERRINGERN und ENTFERNEN. Mehr Ware oder neue Positionen gibt es hier
 * nicht – dafür ist eine neue Bestellung der richtige Weg.
 */
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  berechneAuftragsaenderung,
  vermerkeErstattungVonHand,
  wendeAuftragsaenderungAn,
} from '@/lib/actions/orderEditActions';
import { erzeugeProduktionsunterlagenNeuAktion } from '@/lib/actions/productionPreviewActions';
import type { AenderungsVorschau, BestaetigungsCode } from '@/lib/orders/orderEdit';
import { formatiereGeld } from '@/lib/format';
import { baueAenderungen, begrenzeMenge, startEingaben, type EditPosition, type Eingabe } from './orderEditEingabe';

function euro(cent: number): string {
  return formatiereGeld(cent / 100);
}

const BESTAETIGUNGS_LABEL = (v: AenderungsVorschau): Record<BestaetigungsCode, string> => ({
  'rechnung-korrektur': `Die Rechnung${v.rechnungsnummer ? ` ${v.rechnungsnummer}` : ''} wird nicht automatisch korrigiert. Ich veranlasse die Korrektur (Storno/Gutschrift und neue Rechnung) selbst.`,
  'erstattung-manuell': `Ich erstatte die Differenz von ${euro(v.erstattungNoetigCent)} selbst beim Zahlungsanbieter – das System erstattet nichts.`,
  'ware-bereits-bestellt': 'Die Ware ist beim Lieferanten schon bestellt. Überzählige Ware kläre ich dort selbst.',
});

export function OrderEditControl({
  orderId,
  positionen,
  sperren,
}: {
  orderId: string;
  positionen: EditPosition[];
  /** Gründe, warum die Bestellung jetzt nicht änderbar ist (leer = änderbar). */
  sperren: string[];
}) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [eingaben, setEingaben] = useState<Record<string, Eingabe>>({});
  const [vorschau, setVorschau] = useState<AenderungsVorschau | null>(null);
  const [vorschauFuer, setVorschauFuer] = useState('');
  const [fehler, setFehler] = useState<{ text: string; details?: string[] } | null>(null);
  const [bestaetigt, setBestaetigt] = useState<Set<BestaetigungsCode>>(new Set());
  const [begruendung, setBegruendung] = useState('');
  const [mailSenden, setMailSenden] = useState(true);
  const [ergebnis, setErgebnis] = useState<{ ok: boolean; zeilen: string[] } | null>(null);
  const [laeuft, starte] = useTransition();
  const [schritt, setSchritt] = useState<string | null>(null);

  const aenderungen = useMemo(() => baueAenderungen(positionen, eingaben), [positionen, eingaben]);
  const aenderungenJson = JSON.stringify(aenderungen);
  const vorschauGueltig = vorschau !== null && vorschauFuer === aenderungenJson;

  function oeffnen() {
    setEingaben(startEingaben(positionen));
    setVorschau(null);
    setFehler(null);
    setErgebnis(null);
    setBestaetigt(new Set());
    setBegruendung('');
    setMailSenden(true);
    setOffen(true);
  }

  function schliessen() {
    setOffen(false);
    setVorschau(null);
    setFehler(null);
  }

  function setzeEntfernen(positionId: string, entfernen: boolean) {
    setEingaben((alt) => ({ ...alt, [positionId]: { ...alt[positionId]!, entfernen } }));
    setVorschau(null);
  }

  function setzeMenge(position: EditPosition, groesse: string, roh: string) {
    const menge = begrenzeMenge(position.sizeQuantities[groesse] ?? 0, roh);
    setEingaben((alt) => ({
      ...alt,
      [position.id]: { ...alt[position.id]!, mengen: { ...alt[position.id]!.mengen, [groesse]: menge } },
    }));
    setVorschau(null);
  }

  function berechnen() {
    setFehler(null);
    starte(async () => {
      const r = await berechneAuftragsaenderung(orderId, aenderungen);
      if (!r.ok) {
        setVorschau(null);
        setFehler({ text: r.meldung, details: r.details });
        return;
      }
      setVorschau(r.vorschau);
      setVorschauFuer(aenderungenJson);
      setBestaetigt(new Set());
      setMailSenden(r.vorschau.kundenmail.empfaenger !== null);
    });
  }

  function speichern() {
    if (!vorschau || !vorschauGueltig) return;
    setFehler(null);
    starte(async () => {
      setSchritt('Änderung wird gespeichert …');
      const r = await wendeAuftragsaenderungAn(orderId, aenderungen, {
        begruendung,
        mailSenden,
        bestaetigungen: [...bestaetigt],
        erwartet: { altCent: vorschau.alt.gesamtCent, neuCent: vorschau.neu.gesamtCent },
      });
      if (!r.ok) {
        setSchritt(null);
        setFehler({ text: r.meldung, details: r.details });
        return;
      }

      const zeilen = [r.meldung, ...r.ausgang.probleme];
      setOffen(false);
      setVorschau(null);

      // Produktionsunterlagen neu: Die Vorschau-Bilder sind nach Position und Reihenfolge benannt, das
      // Produktionsblatt nennt die Stückzahlen – beides muss zum neuen Stand passen. Eigener Aufruf, damit der
      // Speichervorgang oben nicht an der Rechenzeit des Renderns hängt.
      setSchritt('Druckvorschauen und Produktionsblatt werden neu erzeugt …');
      try {
        const u = await erzeugeProduktionsunterlagenNeuAktion(orderId);
        zeilen.push(
          u.ok
            ? u.meldung
            : `Vorschauen/Produktionsblatt NICHT vollständig neu erzeugt: ${u.meldung} Bitte „Vorschau & Produktionsblatt neu erzeugen“ unter „Personalisierung“ nutzen, bevor produziert wird.`
        );
        setErgebnis({ ok: u.ok && r.ausgang.probleme.length === 0, zeilen });
      } catch {
        zeilen.push(
          'Vorschauen/Produktionsblatt konnten nicht neu erzeugt werden. Bitte „Vorschau & Produktionsblatt neu erzeugen“ unter „Personalisierung“ nutzen, bevor produziert wird.'
        );
        setErgebnis({ ok: false, zeilen });
      }
      setSchritt(null);
      router.refresh();
    });
  }

  const ergebnisBlock = ergebnis && (
    <div
      role="status"
      className={`mt-3 space-y-1 rounded px-3 py-2 text-sm ${ergebnis.ok ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'}`}
    >
      {ergebnis.zeilen.map((z, i) => (
        <p key={i}>{z}</p>
      ))}
    </div>
  );

  // ── Nicht änderbar ─────────────────────────────────────────────────────
  if (sperren.length > 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Auftrag bearbeiten</h2>
        <p className="mt-1 text-xs text-gray-500">Positionen entfernen oder Stückzahlen verringern.</p>
        <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
          Jetzt nicht möglich: {sperren.join(' ')}
        </p>
        {ergebnisBlock}
      </div>
    );
  }

  // ── Zugeklappt ─────────────────────────────────────────────────────────
  if (!offen) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-900">Auftrag bearbeiten</h2>
        <p className="mt-1 text-xs text-gray-500">
          Z. B. wenn die Kundschaft versehentlich zu viel bestellt hat: Position entfernen oder Stückzahl verringern. Der Preis wird
          neu berechnet, die Änderung steht in der Historie, die Kundschaft kann per Mail informiert werden. Mehr Ware oder neue
          Positionen gibt es hier nicht.
        </p>
        <button
          type="button"
          onClick={oeffnen}
          disabled={laeuft}
          className="mt-3 w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Positionen bearbeiten …
        </button>
        {schritt && <p className="mt-3 text-sm text-gray-600">{schritt}</p>}
        {ergebnisBlock}
      </div>
    );
  }

  // ── Bearbeiten ─────────────────────────────────────────────────────────
  const nurEinePosition = positionen.length === 1;

  return (
    <div className="rounded-lg border border-amber-300 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-900">Auftrag bearbeiten</h2>
      <p className="mt-1 text-xs text-gray-500">
        Stückzahl je Größe verringern oder eine Position entfernen. Erhöhen ist nicht möglich. Nichts wird gespeichert, bevor du
        unten ausdrücklich bestätigst.
      </p>

      <ul className="mt-3 space-y-3">
        {positionen.map((p) => {
          const e = eingaben[p.id];
          if (!e) return null;
          return (
            <li key={p.id} className={`rounded border px-3 py-2 ${e.entfernen ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={`text-sm font-medium ${e.entfernen ? 'text-red-800 line-through' : 'text-gray-900'}`}>{p.name}</p>
                {!nurEinePosition && (
                  <label className="flex items-center gap-1.5 text-xs text-gray-700">
                    <input
                      type="checkbox"
                      checked={e.entfernen}
                      disabled={laeuft}
                      onChange={(ev) => setzeEntfernen(p.id, ev.target.checked)}
                    />
                    Position entfernen
                  </label>
                )}
              </div>
              {!e.entfernen && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(p.sizeQuantities)
                    .filter(([, menge]) => menge > 0)
                    .map(([groesse, bisher]) => (
                      <label key={groesse} className="flex items-center gap-1.5 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm">
                        <span className="font-medium text-gray-900">{groesse}</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={bisher}
                          step={1}
                          value={e.mengen[groesse] ?? bisher}
                          disabled={laeuft}
                          onChange={(ev) => setzeMenge(p, groesse, ev.target.value)}
                          aria-label={`${p.name}, Größe ${groesse}: neue Stückzahl`}
                          className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-right tabular-nums"
                        />
                        <span className="text-xs text-gray-500">von {bisher}</span>
                      </label>
                    ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {nurEinePosition && (
        <p className="mt-2 text-xs text-gray-500">
          Dies ist die einzige Position – sie lässt sich nicht entfernen. Soll der ganze Auftrag entfallen, ist das die Stornierung.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={berechnen}
          disabled={laeuft || aenderungen.length === 0}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand/90 disabled:opacity-50"
        >
          {laeuft && !schritt ? 'Wird berechnet …' : 'Vorschau berechnen'}
        </button>
        <button
          type="button"
          onClick={schliessen}
          disabled={laeuft}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Abbrechen
        </button>
      </div>
      {aenderungen.length === 0 && <p className="mt-2 text-xs text-gray-500">Noch nichts geändert.</p>}

      {fehler && (
        <div role="alert" className="mt-3 rounded bg-red-50 px-3 py-2 text-sm text-red-800">
          <p>{fehler.text}</p>
          {fehler.details && fehler.details.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
              {fehler.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {vorschau && vorschauGueltig && (
        <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900">Vorschau – noch nichts gespeichert</h3>

          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-1 text-gray-600">Alter Gesamtpreis</td>
                <td className="py-1 text-right tabular-nums">{euro(vorschau.alt.gesamtCent)}</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-1 font-medium text-gray-900">Neuer Gesamtpreis</td>
                <td className="py-1 text-right font-medium tabular-nums">{euro(vorschau.neu.gesamtCent)}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-600">Differenz</td>
                <td className="py-1 text-right tabular-nums">{euro(vorschau.differenzCent)}</td>
              </tr>
            </tbody>
          </table>
          {vorschau.alt.versandCent !== vorschau.neu.versandCent && (
            <p className="text-xs text-gray-600">
              Versand: {vorschau.alt.versandCent === 0 ? 'kostenlos' : euro(vorschau.alt.versandCent)} →{' '}
              {vorschau.neu.versandCent === 0 ? 'kostenlos' : euro(vorschau.neu.versandCent)} (Warenwert {euro(vorschau.alt.warenwertCent)}{' '}
              → {euro(vorschau.neu.warenwertCent)})
            </p>
          )}

          <ul className="list-disc space-y-0.5 pl-5 text-sm text-gray-800">
            {vorschau.aenderungszeilen.map((z, i) => (
              <li key={i}>{z}</li>
            ))}
          </ul>

          {vorschau.erstattungNoetigCent > 0 && (
            <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              Bereits bezahlt: Differenz {euro(vorschau.erstattungNoetigCent)} muss erstattet werden. Das System erstattet nichts
              automatisch – den Teilbetrag erstattest du selbst beim Zahlungsanbieter.
            </p>
          )}
          {vorschau.hinweise.map((h, i) => (
            <p key={i} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {h}
            </p>
          ))}

          {vorschau.bestaetigungen.length > 0 && (
            <fieldset className="space-y-1.5">
              <legend className="mb-1 text-xs font-medium text-gray-700">Bitte bestätigen</legend>
              {vorschau.bestaetigungen.map((b) => (
                <label key={b} className="flex items-start gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={bestaetigt.has(b)}
                    disabled={laeuft}
                    onChange={(ev) =>
                      setBestaetigt((alt) => {
                        const neu = new Set(alt);
                        if (ev.target.checked) neu.add(b);
                        else neu.delete(b);
                        return neu;
                      })
                    }
                  />
                  <span>{BESTAETIGUNGS_LABEL(vorschau)[b]}</span>
                </label>
              ))}
            </fieldset>
          )}

          <label className="block">
            <span className="text-xs text-gray-600">Grund (Pflicht, steht in der Bestell-Historie – nicht in der Mail)</span>
            <textarea
              value={begruendung}
              onChange={(e) => setBegruendung(e.target.value)}
              rows={2}
              maxLength={500}
              disabled={laeuft}
              placeholder="z. B. Kunde hat per Mail/Telefon gemeldet, dass er versehentlich zu viel bestellt hat"
              className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
          </label>

          <div className="rounded border border-gray-200 px-3 py-2">
            <label className="flex items-start gap-2 text-sm text-gray-800">
              <input
                type="checkbox"
                className="mt-1"
                checked={mailSenden && vorschau.kundenmail.empfaenger !== null}
                disabled={laeuft || vorschau.kundenmail.empfaenger === null}
                onChange={(e) => setMailSenden(e.target.checked)}
              />
              <span>
                {vorschau.kundenmail.empfaenger
                  ? `Kundschaft per Mail informieren („${vorschau.kundenmail.betreff}“ an ${vorschau.kundenmail.empfaenger})`
                  : 'Keine E-Mail-Adresse hinterlegt – es kann keine Mail an die Kundschaft gehen.'}
              </span>
            </label>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-800">Wortlaut der Mail ansehen</summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-2 text-xs text-gray-800">
                {vorschau.kundenmail.text}
              </pre>
            </details>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={speichern}
              disabled={
                laeuft ||
                begruendung.trim().length < 3 ||
                vorschau.bestaetigungen.some((b) => !bestaetigt.has(b))
              }
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {laeuft
                ? (schritt ?? 'Wird gespeichert …')
                : mailSenden && vorschau.kundenmail.empfaenger
                  ? 'Änderung speichern und Kundschaft informieren'
                  : 'Änderung speichern (ohne Mail)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Zeigt eine noch offene Teilerstattung aus einer Auftragsänderung an einer
 * BEZAHLTEN Bestellung – und lässt den Betreiber vermerken, dass er sie selbst
 * ausgezahlt hat. Das System erstattet nichts und erfährt nur, dass der Betrag
 * erledigt ist (lib/orders/orderEditService.ts::vermerkeManuelleErstattung).
 *
 * Erscheint nur, solange etwas offen ist.
 */
export function OffeneErstattung({ orderId, offenCent, storniert }: { orderId: string; offenCent: number; storniert: boolean }) {
  const router = useRouter();
  const [notiz, setNotiz] = useState('');
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const [laeuft, starte] = useTransition();

  if (offenCent <= 0 && !meldung) return null;

  function vermerken() {
    starte(async () => {
      const r = await vermerkeErstattungVonHand(orderId, offenCent, notiz);
      setMeldung({ ok: r.ok, text: r.meldung });
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-red-300 bg-red-50/60 p-4">
      <h2 className="text-sm font-semibold text-red-900">Offene Erstattung nach Auftragsänderung</h2>
      {offenCent > 0 && (
        <>
          <p className="mt-1 text-sm text-red-900">
            Differenz <strong>{euro(offenCent)}</strong> muss erstattet werden. Die Bestellung war bereits bezahlt, der Auftrag wurde
            danach verringert. Das System erstattet nichts automatisch – bitte den Teilbetrag beim Zahlungsanbieter (Stripe/PayPal)
            selbst zurückzahlen und hier vermerken.
          </p>
          <p className="mt-1 text-xs text-red-800">
            Achtung: Wird {storniert ? 'diese Bestellung storniert' : 'die Bestellung noch storniert'}, erstattet das System automatisch nur
            die AKTUELLE Bestellsumme. Diese offene Differenz bleibt zusätzlich offen.
          </p>
          <label className="mt-3 block">
            <span className="text-xs text-red-900">Notiz (z. B. Referenz der Erstattung)</span>
            <input
              value={notiz}
              onChange={(e) => setNotiz(e.target.value)}
              maxLength={200}
              disabled={laeuft}
              className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={vermerken}
            disabled={laeuft}
            className="mt-3 w-full rounded-md border border-red-400 bg-white px-4 py-2 text-sm font-medium text-red-800 transition hover:bg-red-50 disabled:opacity-50"
          >
            {laeuft ? 'Wird vermerkt …' : `Als von Hand erstattet vermerken (${euro(offenCent)})`}
          </button>
        </>
      )}
      {meldung && (
        <p role="status" className={`mt-3 rounded px-3 py-2 text-sm ${meldung.ok ? 'bg-green-50 text-green-800' : 'bg-white text-red-800'}`}>
          {meldung.text}
        </p>
      )}
    </div>
  );
}
