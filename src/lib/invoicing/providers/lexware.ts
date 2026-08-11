/**
 * ═══════════════════════════════════════════════════════════════════════
 * LEXWARE-ANBIETER – Adapter für den Rechnungs-Port
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die EINZIGE Datei, die die Lexware-Office-API (api.lexware.io, vormals
 * lexoffice.io) kennt. Erfüllt exakt den Port (`erstelle`) und übersetzt
 * zwischen Lexwares Begriffen und unseren.
 *
 * ── Kein SDK ────────────────────────────────────────────────────────────
 * Lexware bietet kein offizielles Node-SDK; die API ist ein einfaches
 * REST/JSON-Interface mit Bearer-Token. Aufruf über das native `fetch`
 * (Next.js-Server-Runtime) statt einer zusätzlichen HTTP-Abhängigkeit.
 *
 * ── Die Rechnungsnummer kommt von Lexware ──────────────────────────────
 * `POST /v1/invoices?finalize=true` stellt die Rechnung SOFORT verbindlich
 * und vergibt dabei die fortlaufende Nummer – das erfüllt § 14 Abs. 4 Nr. 4
 * UStG, ohne dass der Shop selbst eine Nummernvergabe betreiben muss.
 *
 * ── Keine Sandbox ───────────────────────────────────────────────────────
 * Jeder Aufruf hier trifft das ECHTE Lexware-Konto. Der Schutz gegen einen
 * versehentlichen Testlauf liegt beim Testmodus-Vorrang in registry.ts, NICHT
 * hier – diese Datei tut nichts anderes, als brav das zu tun, wofür sie
 * aufgerufen wird.
 */
import {
  RechnungsTeilerfolgFehler,
  type RechnungsAnbieter,
  type Rechnungsauftrag,
  type Rechnungserstellung,
} from '../types';
import { leseApiSchluessel } from './lexwareKonfiguration';

const BASIS_URL = 'https://api.lexware.io';

async function lexwareFetch(pfad: string, init: RequestInit): Promise<Response> {
  const antwort = await fetch(`${BASIS_URL}${pfad}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${leseApiSchluessel()}`,
      ...init.headers,
    },
  });
  return antwort;
}

interface LexwareRechnungAntwort {
  id: string;
  voucherNumber?: string;
}

export const lexwareAnbieter: RechnungsAnbieter = {
  id: 'lexware',

  async erstelle(auftrag: Rechnungsauftrag): Promise<Rechnungserstellung> {
    const body = {
      voucherDate: `${auftrag.rechnungsdatum}T00:00:00.000+01:00`,
      address: {
        name: auftrag.kaeufer.firma || auftrag.kaeufer.name,
        street: auftrag.kaeufer.strasse,
        zip: auftrag.kaeufer.plz,
        city: auftrag.kaeufer.ort,
        countryCode: laenderCode(auftrag.kaeufer.land),
        ...(auftrag.kaeufer.ustIdNr ? { vatRegistrationId: auftrag.kaeufer.ustIdNr } : {}),
      },
      lineItems: [
        ...auftrag.positionen.map((p) => ({
          type: 'custom',
          name: p.bezeichnung,
          quantity: p.menge,
          unitName: 'Stück',
          unitPrice: {
            currency: auftrag.waehrung,
            grossAmount: p.einzelpreisBruttoCent / 100,
            taxRatePercentage: p.steuersatzProzent,
          },
        })),
        // !== 0 statt > 0: Ein negativer Rest (Ausgleichszeile, siehe
        // Rechnungsauftrag.versandkostenBruttoCent) darf nicht wie ein
        // echtes 0 verschwinden – sonst wiese die Rechnung unbemerkt einen
        // höheren Betrag aus, als tatsächlich autoritativ berechnet wurde.
        ...(auftrag.versandkostenBruttoCent !== 0
          ? [
              {
                type: 'custom',
                name: 'Versand',
                quantity: 1,
                unitName: 'Stück',
                unitPrice: {
                  currency: auftrag.waehrung,
                  grossAmount: auftrag.versandkostenBruttoCent / 100,
                  taxRatePercentage: auftrag.positionen[0]?.steuersatzProzent ?? 19,
                },
              },
            ]
          : []),
      ],
      totalPrice: { currency: auftrag.waehrung },
      taxConditions: { taxType: 'gross' },
      shippingConditions: {
        shippingType: 'service',
        shippingDate: `${auftrag.rechnungsdatum}T00:00:00.000+01:00`,
      },
      // Zahlungsziel: 0 Tage = sofort fällig (bereits per Karte/PayPal
      // bezahlt, die Rechnung dokumentiert nur noch den Vorgang), sonst der
      // reguläre Wert aus config/company.ts (PAYMENT_TERM_DAYS).
      paymentConditions: {
        paymentTermLabel: auftrag.zahlungszielTage > 0 ? `Zahlbar innerhalb von ${auftrag.zahlungszielTage} Tagen ohne Abzug.` : 'Bereits bezahlt.',
        paymentTermDuration: auftrag.zahlungszielTage,
      },
      title: `Bestellung ${auftrag.bestellnummer}`,
      remark: `Bezug: Bestellung ${auftrag.bestellnummer}`,
    };

    const anlage = await lexwareFetch('/v1/invoices?finalize=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!anlage.ok) {
      const fehlertext = await anlage.text().catch(() => '');
      throw new Error(`Lexware-Rechnungserstellung fehlgeschlagen (${anlage.status}): ${fehlertext.slice(0, 500)}`);
    }
    const angelegt = (await anlage.json()) as LexwareRechnungAntwort;

    // Rechnungsnummer aus der Anlage-Antwort, sonst per GET nachladen – je
    // nach exakter Antwortform (gegen die echte API zu verifizieren, siehe
    // Plan §8) ist voucherNumber ggf. erst nach dem Finalisieren gesetzt.
    //
    // AB HIER ist der Beleg bei Lexware bereits angelegt (angelegt.id ist
    // ein echter, irreversibler Beleg) – jeder Fehlschlag ab jetzt wirft
    // RechnungsTeilerfolgFehler statt eines gewöhnlichen Error, damit der
    // Aufrufer (orderCompletion.ts) die bereits bekannte Kennung sichern
    // kann, statt sie zu verlieren und bei einem Retry erneut anzulegen.
    let rechnungsnummer = angelegt.voucherNumber;
    if (!rechnungsnummer) {
      const geladen = await lexwareFetch(`/v1/invoices/${angelegt.id}`, { method: 'GET' });
      if (geladen.ok) {
        const details = (await geladen.json()) as LexwareRechnungAntwort;
        rechnungsnummer = details.voucherNumber;
      }
    }
    if (!rechnungsnummer) {
      throw new RechnungsTeilerfolgFehler(
        `Lexware-Rechnung ${angelegt.id} angelegt, aber ohne Rechnungsnummer in der Antwort.`,
        angelegt.id
      );
    }

    const pdfAntwort = await lexwareFetch(`/v1/invoices/${angelegt.id}/file`, {
      method: 'GET',
      headers: { Accept: 'application/pdf' },
    });
    if (!pdfAntwort.ok) {
      throw new RechnungsTeilerfolgFehler(
        `Lexware-Rechnung ${angelegt.id} (Nr. ${rechnungsnummer}) angelegt, PDF-Abruf fehlgeschlagen (${pdfAntwort.status}).`,
        angelegt.id,
        rechnungsnummer
      );
    }
    const pdf = Buffer.from(await pdfAntwort.arrayBuffer());

    return { rechnungsId: angelegt.id, rechnungsnummer, pdf };
  },
};

/** Lexware erwartet ISO-3166-1-Alpha-2-Ländercodes. Diese Anwendung liefert
 *  aktuell ausschließlich nach Deutschland (config/shipping.ts) – der Code
 *  bleibt trotzdem allgemein, statt "DE" hart zu verdrahten. */
function laenderCode(land: string): string {
  const bekannt: Record<string, string> = { Deutschland: 'DE', Germany: 'DE' };
  return bekannt[land] ?? 'DE';
}
