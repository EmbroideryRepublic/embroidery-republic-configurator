/**
 * ═══════════════════════════════════════════════════════════════════════
 * DHL-ANBIETER – Adapter für den Versand-Port
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Die EINZIGE Datei, die die DHL Parcel DE Shipping API v2 kennt. Erfüllt
 * exakt den Port (`erstelleSendung`) und übersetzt zwischen DHLs Begriffen
 * und unseren.
 *
 * ── Kein SDK ────────────────────────────────────────────────────────────
 * DHL bietet kein offizielles Node-SDK für die REST-API v2; Aufruf über das
 * native `fetch`, wie bei lib/invoicing/providers/lexware.ts.
 *
 * ── OAuth2 (Password-Grant/ROPC) statt Legacy-Basic-Auth ────────────────
 * DHL markiert Basic Auth ausdrücklich als auslaufend ("we will no longer
 * offer Basic Auth in future API versions", developer.dhl.com) und
 * empfiehlt OAuth2. Diese Datei holt sich deshalb VOR jedem `/orders`-
 * Aufruf ein Bearer-Token von der DHL Authentication API
 * (POST .../auth/ropc/v1/token, grant_type=password) – exakt nach dem
 * Vorbild von `paypal.ts`s `holeZugriffstoken()`, nur mit den zusätzlichen
 * Feldern `username`/`password`, die der Password-Grant gegenüber PayPals
 * Client-Credentials-Grant zusätzlich verlangt. Das Token ist laut DHL-
 * Dokumentation 30 Minuten gültig; wie bei PayPal wird es prozessweit
 * zwischengespeichert (kein Token-Holen je Bestellung) und 60 Sekunden vor
 * Ablauf vorsorglich erneuert.
 *
 * Anders als im Legacy-Weg (dhl-api-key-Header + HTTP-Basic) genügt für
 * `/orders` unter OAuth2 laut Dokumentation ausschließlich der Bearer-
 * Token – der `dhl-api-key`-Header entfällt dabei (er gehört zum Legacy-
 * Schema bzw. zu anderen DHL-APIs, nicht zum OAuth2-Fluss von Parcel DE
 * Shipping v2).
 *
 * ── Keine Idempotenz seitens DHL ────────────────────────────────────────
 * Anders als Stripe (idempotencyKey) und PayPal (PayPal-Request-Id) bietet
 * DHLs Orders-Endpunkt KEINEN Idempotenzschlüssel. Der Schutz gegen doppelte
 * Label-Erstellung liegt deshalb VOLLSTÄNDIG in der Datenbank (Migration
 * 0026, beanspruche_versandlabel) – diese Datei muss sich darauf verlassen,
 * dass sie nur einmal pro Bestellung aufgerufen wird, und tut selbst nichts
 * zur Absicherung.
 */
import { COMPANY } from '@/config/company';
import {
  VersandTeilerfolgFehler,
  type VersandAnbieter,
  type Versandauftrag,
  type Versanderstellung,
} from '../types';
import { leseZugangsdaten, dhlBasisUrl, dhlAuthUrl } from './dhlKonfiguration';

/** Standard-Paketversand innerhalb Deutschlands, bis 31,5 kg. Andere
 *  Produkte (Sperrgut, Express) sind von keiner Anforderung dieses Batches
 *  verlangt – wächst mit Bedarf. */
const PRODUKT = 'V01PAK';
const GRUPPENPROFIL = 'STANDARD_GRUPPENPROFIL';

interface Token {
  wert: string;
  gueltigBis: number;
}

/** Zwischengespeicherter OAuth2-Token je Prozess – dieselbe Überlegung wie
 *  bei paypal.ts: ein Token je Bestellung zu holen wäre reine
 *  Verschwendung, DHLs Token gilt 30 Minuten. 60 Sekunden Sicherheitsabstand
 *  vor Ablauf, damit ein knapp noch gültiger Token nicht mitten im Aufruf
 *  abläuft. */
let token: Token | null = null;

async function holeZugriffstoken(): Promise<string> {
  if (token && token.gueltigBis > Date.now()) return token.wert;

  const zugang = leseZugangsdaten();
  const antwort = await fetch(dhlAuthUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    // DHLs Password-Grant (ROPC) verlangt client_id/client_secret als
    // Form-Feld, NICHT als HTTP-Basic-Header wie bei PayPals
    // Client-Credentials-Grant – siehe Kopfkommentar/Recherchequelle.
    body: new URLSearchParams({
      grant_type: 'password',
      username: zugang.username,
      password: zugang.password,
      client_id: zugang.apiKey,
      client_secret: zugang.apiSecret,
    }).toString(),
  });

  if (!antwort.ok) {
    const fehlertext = await antwort.text().catch(() => '');
    throw new Error(`DHL-OAuth-Token nicht erhalten (${antwort.status}): ${fehlertext.slice(0, 300)}`);
  }

  const daten = (await antwort.json()) as { access_token?: string; expires_in?: number };
  if (!daten.access_token) {
    throw new Error('DHL-OAuth-Antwort ohne access_token.');
  }
  // expires_in fehlt laut Dokumentation nicht, aber ein defensiver
  // Rückfallwert (knapp unter den dokumentierten 30 Minuten) verhindert,
  // dass ein fehlendes Feld einen Token fälschlich als unbegrenzt gültig
  // erscheinen lässt.
  const gueltigkeitSekunden = daten.expires_in ?? 1700;
  token = { wert: daten.access_token, gueltigBis: Date.now() + (gueltigkeitSekunden - 60) * 1000 };
  return token.wert;
}

interface DhlOrdersAntwort {
  items?: {
    shipmentNo?: string;
    label?: { b64?: string; url?: string };
    validationMessages?: { property: string; validationMessage: string }[];
  }[];
}

export const dhlAnbieter: VersandAnbieter = {
  id: 'dhl',

  async erstelleSendung(auftrag: Versandauftrag): Promise<Versanderstellung> {
    const zugang = leseZugangsdaten();
    const zugriffstoken = await holeZugriffstoken();

    const antwort = await fetch(`${dhlBasisUrl()}/orders?includeDocs=include&docFormat=PDF`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${zugriffstoken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: GRUPPENPROFIL,
        shipments: [
          {
            product: PRODUKT,
            billingNumber: zugang.billingNumber,
            refNo: auftrag.bestellnummer,
            shipper: {
              name1: COMPANY.legalName,
              addressStreet: COMPANY.street,
              postalCode: COMPANY.zip,
              city: COMPANY.city,
              country: 'DEU',
              email: COMPANY.email,
              phone: COMPANY.phone,
            },
            consignee: {
              name1: auftrag.empfaenger.name,
              addressStreet: auftrag.empfaenger.strasse,
              postalCode: auftrag.empfaenger.plz,
              city: auftrag.empfaenger.ort,
              country: laenderCode(auftrag.empfaenger.land),
            },
            details: {
              weight: { uom: 'kg', value: auftrag.gewichtKg },
            },
          },
        ],
      }),
    });

    if (!antwort.ok) {
      const fehlertext = await antwort.text().catch(() => '');
      throw new Error(`DHL-Versandlabel für ${auftrag.bestellnummer} nicht erstellt (${antwort.status}): ${fehlertext.slice(0, 500)}`);
    }

    const daten = (await antwort.json()) as DhlOrdersAntwort;
    const sendung = daten.items?.[0];
    if (!sendung?.shipmentNo) {
      // Noch NICHTS angelegt (DHL hat die Anfrage abgelehnt, z.B.
      // Validierungsfehler) – ein gewöhnlicher Error genügt, der Aufrufer
      // darf den Claim gefahrlos freigeben.
      const meldungen = sendung?.validationMessages?.map((m) => `${m.property}: ${m.validationMessage}`).join('; ');
      throw new Error(`DHL-Antwort für ${auftrag.bestellnummer} ohne Sendungsnummer${meldungen ? ` (${meldungen})` : ''}.`);
    }
    if (!sendung.label?.b64) {
      // AB HIER ist die Sendung bei DHL bereits angelegt (shipmentNo ist
      // eine echte, abrechnungswirksame Sendungsnummer) – nur das
      // eingebettete Label fehlt in der Antwort. VersandTeilerfolgFehler
      // statt eines gewöhnlichen Error, damit der Aufrufer
      // (shippingService.ts) die bereits bekannte Sendungsnummer sichern
      // kann, statt sie zu verlieren und bei einem Retry eine zweite Sendung
      // anzulegen.
      throw new VersandTeilerfolgFehler(
        `DHL-Sendung ${sendung.shipmentNo} angelegt, aber ohne eingebettetes Label.`,
        sendung.shipmentNo
      );
    }

    return {
      sendungsnummer: sendung.shipmentNo,
      label: Buffer.from(sendung.label.b64, 'base64'),
    };
  },
};

/** DHL erwartet ISO-3166-1-Alpha-3-Ländercodes ("DEU" statt "DE"). Diese
 *  Anwendung liefert aktuell ausschließlich nach Deutschland
 *  (config/shipping.ts) – der Code bleibt trotzdem allgemein. */
function laenderCode(land: string): string {
  const bekannt: Record<string, string> = { Deutschland: 'DEU', Germany: 'DEU' };
  return bekannt[land] ?? 'DEU';
}
