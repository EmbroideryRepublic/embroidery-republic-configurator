/**
 * ═══════════════════════════════════════════════════════════════════════
 * AUFTRAG NACHTRÄGLICH ÄNDERN – reine Fachlogik (kein Datenbankzugriff)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Der Betreiber kann bei einer BESTEHENDEN Bestellung eine Position entfernen
 * oder die Stückzahl einer Position verringern („der Kunde hat versehentlich
 * 2 Hoodies bestellt“). Erhöhen und Hinzufügen gibt es bewusst nicht: Dafür
 * braucht es eine neue Bestellung, denn mehr Ware heißt mehr Preis, und den
 * kann diese Funktion weder einziehen noch dem Kunden gegenüber verbindlich
 * machen.
 *
 * Diese Datei entscheidet nur:
 *   1. ob eine Bestellung im jetzigen Zustand überhaupt änderbar ist,
 *   2. ob die gewünschte Änderung zulässig ist,
 *   3. was die Bestellung danach kostet (über die BESTEHENDE Serverpreis-
 *      Berechnung `priceCart`, nie über eine eigene Rechnung),
 *   4. was dabei in Datenbank, Historie und Kundenmail stehen muss.
 *
 * Gespeichert, protokolliert und verschickt wird anderswo (orderEditService.ts);
 * hier gibt es nichts mit Nebenwirkung. Dadurch ist jede Regel ohne Datenbank
 * prüfbar – siehe __tests__/orderEdit.test.ts.
 *
 * ── Warum die Neuberechnung nur nach einer „Gegenprobe“ gilt ───────────────
 * `priceCart` rechnet mit dem KATALOG VON HEUTE. Eine Bestellung, die vor einer
 * Preisänderung aufgegeben wurde, würde dadurch nach dem Entfernen EINER
 * Position plötzlich an den übrigen Positionen einen anderen Preis tragen –
 * die Kundschaft zahlte mehr oder weniger, ohne dass sie etwas geändert hätte.
 * Außerdem stehen manche Preisgrundlagen gar nicht in der Datenbank (die
 * Stichzahl bei Stickerei, der Füllgrad eines Motivs).
 *
 * Deshalb wird zuerst die UNVERÄNDERTE Bestellung mit denselben Daten neu
 * berechnet. Stimmt das nicht auf den Cent mit dem gespeicherten Stand
 * überein (jede Position und die Endsumme), wird NICHT geändert, sondern
 * abgelehnt und der Unterschied benannt. Nur wenn die Gegenprobe aufgeht, ist
 * die Neuberechnung der geänderten Bestellung im selben Preisrahmen
 * verlässlich – dann gilt automatisch alles, was `priceCart` kennt:
 * Mengenstaffeln, Einrichtungsgebühr, Rundung auf ,99 €, Versandkosten und
 * die Freigrenze für kostenlosen Versand. (Gutscheine/Rabattcodes gibt es in
 * diesem Shop nicht: `DEFAULT_CART_CONFIG.vouchers` ist leer und `priceCart`
 * reicht keinen Code durch. Käme je einer hinzu, müsste er hier ebenfalls
 * mitgeführt und in der Gegenprobe wiederholt werden.)
 *
 * ── Der Preis darf nicht steigen ──────────────────────────────────────────
 * Weniger Ware kann rechnerisch teurer werden (unter der Versandfreigrenze
 * kommt Versand dazu, bei höchstens zwei Stück fällt die Einrichtungsgebühr an,
 * kleinere Mengen haben einen höheren Stückpreis). Das wäre eine Preiserhöhung
 * wegen einer Verringerung – ohne Zustimmung der Kundschaft nicht zulässig und
 * bei bereits bezahlter Ware auch nicht einziehbar. Solche Fälle werden
 * abgelehnt; der Betreiber klärt sie mit der Kundschaft.
 */
import { priceCart, type ServerCartPricing } from '@/lib/pricing/serverPricing';
import { aktuelleAktion } from '@/config/aktion';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import { euroZuCent } from '@/lib/payments/betrag';
import { formatiereGeld } from '@/lib/format';
import type { CartItem, ConfigElement, LogoElement, TextElement } from '@/types';

// ═══════════════════════════════════════════════════════════════════════
// Eingabe: der gespeicherte Stand (als einfache Daten, aus der Datenbank geladen)
// ═══════════════════════════════════════════════════════════════════════

/** Ein gespeichertes Motiv – nur, was die Preisberechnung braucht. */
export interface AenderungsElement {
  type: 'logo' | 'text';
  view: string;
  xCm: number;
  yCm: number;
  widthCm: number;
  heightCm: number;
  /** Speicherpfade der Logodateien – nur für das Protokoll (was ist verwaist?). */
  logoPfade?: string[];
}

/** Eine gespeicherte Bestellposition (`order_items` samt `configuration_elements`). */
export interface AenderungsPosition {
  id: string;
  productId: string;
  colorId: string;
  productName: string;
  colorName: string;
  printMethod: string | null;
  sizeQuantities: Record<string, number>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  elements: AenderungsElement[];
}

/** Die Bestellung selbst – nur, was für Zulässigkeit, Preis und Text nötig ist. */
export interface AenderungsBestellung {
  id: string;
  orderNumber: string;
  orderType: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  /** Gespeicherte Endsumme (brutto, inkl. Versand). */
  totalPrice: number;
  /** `orders.quantity` – kann bei sehr alten Zeilen fehlen. */
  quantity: number | null;
  /** Steuer zum Kaufzeitpunkt (Migration 0014); null bei Bestellungen davor. */
  taxRate: number | null;
  shippingCountry: string | null;
  invoiceNumber: string | null;
  /** ISO-Datum (yyyy-mm-dd) der aktuellen Rechnung – für den Satz „ersetzt die Rechnung … vom …“ in der Mail. */
  invoiceDate?: string | null;
  /**
   * `orders.rechnung_unklarer_zustand` (Migration 0026): Der manuelle Klärungsfall der ersten Rechnung. Dann
   * gibt es keine automatische Ersatzrechnung (die Datenbankfunktion lehnt sie ab).
   */
  rechnungUnklarerZustand?: boolean;
  email: string | null;
  /**
   * `orders.created_at` (ISO). Bestimmt, welche Preisaktion (config/aktion.ts) beim Nachrechnen gilt: die zum BESTELLDATUM gültige – eine
   * Bestellung aus der Black Week wird auch nach deren Ende mit dem Aktionsrabatt nachgerechnet, sonst stimmte die Gegenprobe nie. Ohne
   * Angabe (alte Datensätze, Tests) wird ohne Aktion gerechnet.
   */
  createdAt?: string | null;
}

/** Status der Lieferantenaufträge dieser Bestellung (`supplier_orders.status`). */
export type LieferantenStatus = string;

export interface AenderungsStand {
  bestellung: AenderungsBestellung;
  positionen: AenderungsPosition[];
  lieferantenStatus: LieferantenStatus[];
}

// ═══════════════════════════════════════════════════════════════════════
// Die gewünschte Änderung
// ═══════════════════════════════════════════════════════════════════════

export type Aenderung =
  | { art: 'entfernen'; positionId: string }
  | {
      art: 'verringern';
      positionId: string;
      /**
       * Neue Stückzahl je Größe. Eine Größe, die hier FEHLT, bleibt unverändert;
       * eine Größe mit 0 entfällt. Jede Zahl muss zwischen 0 und dem
       * bisherigen Wert liegen – Erhöhen ist nicht möglich.
       */
      neueMengen: Record<string, number>;
    };

export const MAX_AENDERUNGEN = 50;

/**
 * Liest eine vom Browser kommende Änderungsliste. Eine Server Action bekommt
 * beliebiges JSON – nichts davon wird ungeprüft übernommen.
 */
export function liesAenderungen(roh: unknown): { ok: true; aenderungen: Aenderung[] } | { ok: false; meldung: string } {
  if (!Array.isArray(roh) || roh.length === 0) return { ok: false, meldung: 'Es wurde keine Änderung übergeben.' };
  if (roh.length > MAX_AENDERUNGEN) return { ok: false, meldung: 'Zu viele Änderungen auf einmal.' };

  const ergebnis: Aenderung[] = [];
  for (const eintrag of roh) {
    if (typeof eintrag !== 'object' || eintrag === null) return { ok: false, meldung: 'Ungültige Änderung.' };
    const e = eintrag as Record<string, unknown>;
    const positionId = e.positionId;
    if (typeof positionId !== 'string' || positionId.length === 0 || positionId.length > 64) {
      return { ok: false, meldung: 'Ungültige Position.' };
    }
    if (e.art === 'entfernen') {
      ergebnis.push({ art: 'entfernen', positionId });
      continue;
    }
    if (e.art === 'verringern') {
      const mengen = e.neueMengen;
      if (typeof mengen !== 'object' || mengen === null || Array.isArray(mengen)) {
        return { ok: false, meldung: 'Ungültige Stückzahlen.' };
      }
      const neueMengen: Record<string, number> = {};
      for (const [groesse, wert] of Object.entries(mengen as Record<string, unknown>)) {
        if (groesse.length === 0 || groesse.length > 20) return { ok: false, meldung: 'Ungültige Größe.' };
        if (typeof wert !== 'number' || !Number.isInteger(wert) || wert < 0 || wert > 100000) {
          return { ok: false, meldung: 'Stückzahlen müssen ganze Zahlen ab 0 sein.' };
        }
        neueMengen[groesse] = wert;
      }
      ergebnis.push({ art: 'verringern', positionId, neueMengen });
      continue;
    }
    return { ok: false, meldung: 'Unbekannte Art der Änderung.' };
  }
  return { ok: true, aenderungen: ergebnis };
}

// ═══════════════════════════════════════════════════════════════════════
// 1. Ist die Bestellung im jetzigen Zustand änderbar?
// ═══════════════════════════════════════════════════════════════════════

export type SperreCode =
  | 'keine-bestellung'
  | 'storniert'
  | 'in-produktion'
  | 'versendet'
  | 'abgeschlossen'
  | 'zahlung-offen'
  | 'zahlung-fehlgeschlagen'
  | 'zahlungsstatus-unbekannt'
  | 'status-unbekannt'
  | 'lieferant-laeuft';

/**
 * Was der Betreiber VOR dem Speichern ausdrücklich bestätigen muss, weil das
 * System es nicht selbst erledigt:
 *  - `rechnung-korrektur`: Es existiert schon eine Rechnung. Der Code erzeugt
 *    keine Storno-/Korrekturrechnung (der Rechnungsanbieter-Port kennt nur
 *    `erstelle`); die Korrektur ist Handarbeit.
 *  - `erstattung-manuell`: Die Bestellung ist bezahlt, die Differenz geht
 *    zurück. Es gibt nur eine VOLLE automatische Erstattung (refundService.ts);
 *    eine Teilerstattung muss der Betreiber selbst beim Zahlungsanbieter
 *    auslösen.
 *  - `ware-bereits-bestellt`: Beim Lieferanten wurde schon bestellt (oder der
 *    Warenkorb gefüllt). Überzählige Ware muss der Betreiber dort klären.
 */
export type BestaetigungsCode = 'rechnung-korrektur' | 'erstattung-manuell' | 'ware-bereits-bestellt';

export interface Sperre {
  code: SperreCode;
  text: string;
}

export interface Aenderbarkeit {
  erlaubt: boolean;
  sperren: Sperre[];
  /** Bestätigungen, die schon aus dem Zustand folgen (die Erstattung kommt erst mit dem Preis hinzu). */
  bestaetigungen: BestaetigungsCode[];
  hinweise: string[];
}

/** Lieferantenstände, in denen schon bestellt wurde oder ein Warenkorb beim Lieferanten gefüllt ist. */
const WARE_BESTELLT: readonly string[] = ['cart_prepared', 'ordered'];

/**
 * Was mit der Rechnung der Bestellung geschieht:
 *  - `keine`:       Es gibt noch keine. Sie entsteht später ohnehin mit den neuen Beträgen.
 *  - `automatisch`: Es gibt eine, und das System erzeugt eine NEUE, die sie ersetzt
 *                   (orderInvoiceReplacement.ts) – nur mit dem internen Rechnungsanbieter und
 *                   solange der manuelle Klärungsfall der ersten Rechnung (Migration 0026) nicht gesetzt ist.
 *  - `manuell`:     Es gibt eine, das System kann keine Ersatzrechnung erzeugen – der Betreiber
 *                   korrigiert selbst und bestätigt das (BestaetigungsCode 'rechnung-korrektur').
 */
export type RechnungsErsatzArt = 'keine' | 'automatisch' | 'manuell';

export function bestimmeRechnungErsatz(
  bestellung: { invoiceNumber: string | null; rechnungUnklarerZustand?: boolean },
  ersatzMoeglich: boolean
): RechnungsErsatzArt {
  if (!bestellung.invoiceNumber) return 'keine';
  return ersatzMoeglich && !bestellung.rechnungUnklarerZustand ? 'automatisch' : 'manuell';
}

/**
 * Entscheidet, ob eine Bestellung geändert werden darf. Rein lesend.
 *
 * ── Warum diese Zustände ──────────────────────────────────────────────────
 *  - Nur `new`: Ab „In Produktion“ ist Ware beschafft und veredelt; eine
 *    Stückzahländerung am System ändert daran nichts mehr, wohl aber die
 *    Papierlage (Produktionsblatt, Versand). Versendet/abgeschlossen/
 *    storniert sind Endstände.
 *  - Zahlung `not_required` (Rechnungskauf) oder `paid`: Bei `pending`/`failed`
 *    liegt der Betrag beim Zahlungsanbieter fest (Checkout-Sitzung) und der
 *    Webhook prüft ihn gegen `total_price` – eine Änderung würde die Zahlung
 *    unbrauchbar machen.
 *  - Lieferantenauftrag nicht in Verarbeitung: Der Worker liest den
 *    gespeicherten Stand und würde ihn mitten im Lauf überholt sehen.
 */
export function pruefeAenderbarkeit(
  stand: {
    /** Nur diese Felder entscheiden – die Detailseite kennt sie schon, ohne die Positionen laden zu müssen. */
    bestellung: Pick<AenderungsBestellung, 'orderType' | 'status' | 'paymentStatus' | 'invoiceNumber'> &
      Partial<Pick<AenderungsBestellung, 'rechnungUnklarerZustand'>>;
    lieferantenStatus: LieferantenStatus[];
  },
  optionen: { rechnungsErsatzMoeglich?: boolean } = {}
): Aenderbarkeit {
  const { bestellung, lieferantenStatus } = stand;
  const sperren: Sperre[] = [];

  if (bestellung.orderType !== 'order') {
    sperren.push({ code: 'keine-bestellung', text: 'Anfragen lassen sich hier nicht ändern – nur Bestellungen.' });
  }

  switch (bestellung.status) {
    case 'new':
      break;
    case 'cancelled':
      sperren.push({ code: 'storniert', text: 'Die Bestellung ist storniert.' });
      break;
    case 'in_production':
      sperren.push({
        code: 'in-produktion',
        text: 'Die Bestellung ist bereits in Produktion – danach ist keine Änderung am System mehr vorgesehen.',
      });
      break;
    case 'shipped':
      sperren.push({ code: 'versendet', text: 'Die Bestellung ist bereits versendet.' });
      break;
    case 'completed':
      sperren.push({ code: 'abgeschlossen', text: 'Die Bestellung ist abgeschlossen.' });
      break;
    default:
      sperren.push({ code: 'status-unbekannt', text: `Unbekannter Bestellstatus „${bestellung.status}“.` });
  }

  switch (bestellung.paymentStatus) {
    case 'not_required':
    case 'paid':
      break;
    case 'pending':
      sperren.push({
        code: 'zahlung-offen',
        text: 'Die Zahlung steht noch aus. Der Betrag liegt beim Zahlungsanbieter fest und lässt sich nicht nachträglich ändern.',
      });
      break;
    case 'failed':
      sperren.push({
        code: 'zahlung-fehlgeschlagen',
        text: 'Die Zahlung ist fehlgeschlagen. Der Betrag liegt beim Zahlungsanbieter fest und lässt sich nicht nachträglich ändern.',
      });
      break;
    default:
      sperren.push({ code: 'zahlungsstatus-unbekannt', text: `Unbekannter Zahlungsstatus „${bestellung.paymentStatus}“.` });
  }

  if (lieferantenStatus.includes('processing')) {
    sperren.push({
      code: 'lieferant-laeuft',
      text: 'Ein Lieferantenauftrag wird gerade verarbeitet. Bitte in ein paar Minuten erneut versuchen.',
    });
  }

  const bestaetigungen: BestaetigungsCode[] = [];
  const hinweise: string[] = [];
  if (bestimmeRechnungErsatz(bestellung, optionen.rechnungsErsatzMoeglich ?? false) === 'automatisch') {
    // Seit 2026-11-26: Das System erzeugt die Ersatzrechnung selbst – nichts zu bestätigen, aber zwei Dinge zu wissen.
    hinweise.push(
      `Zu dieser Bestellung gibt es bereits die Rechnung ${bestellung.invoiceNumber}. Es wird eine NEUE Rechnung mit den ` +
        'geänderten Positionen und Beträgen erzeugt, die sie ersetzt (die bisherige bleibt als PDF erhalten). ' +
        'Sie wird der Kundschaft mit der Mail geschickt.',
      'Die lokale Buchhaltungs-App übernimmt die neue Rechnung nicht von selbst: Ist die Bestellung dort schon importiert, ' +
        'bleibt dort die bisherige Rechnung stehen und muss von Hand angepasst werden.'
    );
  } else if (bestellung.invoiceNumber) {
    bestaetigungen.push('rechnung-korrektur');
    hinweise.push(
      `Zu dieser Bestellung gibt es bereits die Rechnung ${bestellung.invoiceNumber}. Sie wird NICHT automatisch korrigiert – ` +
        'die Korrektur (Storno/Gutschrift und neue Rechnung) musst du selbst veranlassen.'
    );
  }
  if (lieferantenStatus.some((s) => WARE_BESTELLT.includes(s))) {
    bestaetigungen.push('ware-bereits-bestellt');
    hinweise.push(
      'Die Ware wurde beim Lieferanten schon bestellt (oder der Warenkorb dort ist gefüllt). Überzählige Ware musst du dort selbst stornieren oder behalten.'
    );
  }

  return { erlaubt: sperren.length === 0, sperren, bestaetigungen, hinweise };
}

// ═══════════════════════════════════════════════════════════════════════
// 2. Plan: Zulässigkeit der Änderung + Neuberechnung
// ═══════════════════════════════════════════════════════════════════════

export type AblehnungsCode =
  | SperreCode
  | 'keine-aenderung'
  | 'ungueltige-aenderung'
  | 'position-unbekannt'
  | 'menge-null'
  | 'letzte-position'
  | 'stickerei-nicht-berechenbar'
  | 'produkt-unbekannt'
  | 'versandland'
  | 'preis-blockiert'
  | 'preis-abweichung'
  | 'preis-steigt'
  // Nur im Service: Ablauf-Fehler.
  | 'nicht-gefunden'
  | 'vorschau-veraltet'
  | 'bestaetigung-fehlt'
  | 'stand-geaendert'
  | 'fehler';

export interface Abgelehnt {
  ok: false;
  grund: AblehnungsCode;
  meldung: string;
  /** Einzelheiten, z. B. die Abweichungen der Gegenprobe. */
  details?: string[];
}

/** Eine Seite der Rechnung (vorher/nachher). Alle Beträge in Cent. */
export interface Summen {
  gesamtCent: number;
  warenwertCent: number;
  versandCent: number;
  menge: number;
}

export interface PlanPosition {
  id: string;
  name: string;
  aktion: 'unveraendert' | 'entfernt' | 'verringert';
  alt: { sizeQuantities: Record<string, number>; menge: number; gesamtCent: number };
  /** null bei einer entfernten Position. */
  neu: { sizeQuantities: Record<string, number>; menge: number; gesamtCent: number } | null;
  /** Speicherpfade der Logodateien einer ENTFERNTEN Position – bleiben im Speicher liegen, stehen aber im Protokoll. */
  verwaisteDateien: string[];
}

/** Was in `order_items` geschrieben wird – Euro-Beträge, wie die Spalten. */
export type PositionsSchreibung =
  | { id: string; aktion: 'entfernen' }
  | {
      id: string;
      aktion: 'aendern';
      sizeQuantities: Record<string, number>;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      netTotalPrice: number | null;
    };

export interface ErwarteterStand {
  status: string;
  paymentStatus: string;
  /** Euro. */
  totalPrice: number;
  quantity: number | null;
  invoiceNumber: string | null;
  positionen: Array<{ id: string; sizeQuantities: Record<string, number>; totalPrice: number }>;
}

export interface AenderungsPlan {
  alt: Summen;
  neu: Summen;
  /** alt − neu, nie negativ (ein steigender Preis wird abgelehnt). */
  differenzCent: number;
  positionen: PlanPosition[];
  /** Für Protokoll, Vorschau und Kundenmail – ein Satz je Änderung. */
  aenderungszeilen: string[];
  bestellungNeu: { quantity: number; totalPrice: number; taxAmount: number | null; netTotal: number | null };
  schreibungen: PositionsSchreibung[];
  erwartet: ErwarteterStand;
  bestaetigungen: BestaetigungsCode[];
  hinweise: string[];
  /** Bei bezahlten Bestellungen: Betrag, den der Betreiber selbst erstatten muss. 0 sonst. */
  erstattungNoetigCent: number;
  rechnungKorrekturNoetig: boolean;
  /** Was mit der Rechnung geschieht – siehe RechnungsErsatzArt. */
  rechnungErsatz: RechnungsErsatzArt;
  /** Existiert nach der Änderung noch eine Position je Lieferant? Für das Aufräumen der Lieferantenaufträge. */
  verbleibendePositionen: Array<{ productId: string; colorId: string; sizeQuantities: Record<string, number> }>;
}

/**
 * Was der Betreiber vor dem Speichern sieht: der berechnete Plan, die Hinweise
 * und der Wortlaut der Kundenmail. Reine Daten (JSON-tauglich), damit die
 * Oberfläche sie ohne weitere Abfrage anzeigen kann.
 */
export interface AenderungsVorschau {
  alt: Summen;
  neu: Summen;
  differenzCent: number;
  positionen: PlanPosition[];
  aenderungszeilen: string[];
  bestaetigungen: BestaetigungsCode[];
  hinweise: string[];
  erstattungNoetigCent: number;
  rechnungKorrekturNoetig: boolean;
  rechnungErsatz: RechnungsErsatzArt;
  rechnungsnummer: string | null;
  zahlungsstatus: string;
  kundenmail: {
    /** null = keine Adresse hinterlegt → es kann keine Mail gehen. */
    empfaenger: string | null;
    betreff: string;
    /** Klartext-Fassung genau der Mail, die rausgehen würde. */
    text: string;
  };
}

function runde2(wert: number): number {
  return Math.round(wert * 100) / 100;
}

function cent(euro: number): number {
  return euroZuCent(Math.max(0, euro));
}

function euro(centBetrag: number): number {
  return Number((centBetrag / 100).toFixed(2));
}

/** „2 × L, 1 × M“ – wie die Positionstabellen im Shop und in den Mails. */
export function groessenText(sizeQuantities: Record<string, number>): string {
  return Object.entries(sizeQuantities)
    .filter(([, menge]) => menge > 0)
    .map(([groesse, menge]) => `${menge} × ${groesse}`)
    .join(', ');
}

function positionsName(p: Pick<AenderungsPosition, 'productName' | 'colorName'>): string {
  return `${p.productName} · ${p.colorName}`;
}

/**
 * Ein Motiv in die Form bringen, die `priceCart` erwartet. Alles, was die
 * Datenbank nicht kennt (Füllgrad, Stichzahl), bekommt exakt den Vorgabewert,
 * den die Preisberechnung selbst verwendet – die Gegenprobe zeigt, ob das für
 * diese Bestellung genügt.
 */
function alsConfigElement(element: AenderungsElement, index: number): ConfigElement {
  const basis = {
    id: `edit-${index}`,
    view: element.view,
    xCm: element.xCm,
    yCm: element.yCm,
    widthCm: element.widthCm,
    heightCm: element.heightCm,
    rotationDeg: 0,
    isOutOfBounds: false,
    extraPrice: 0,
    estimatedStitches: 0,
    name: '',
    locked: false,
    hidden: false,
  };
  if (element.type === 'text') {
    const text: TextElement = {
      ...basis,
      type: 'text',
      content: '',
      fontFamily: '',
      fontSizePx: 0,
      color: '#000000',
      bold: false,
      italic: false,
      align: 'left',
      letterSpacing: 0,
      lineHeight: 1,
      hasShadow: false,
      hasOutline: false,
      outlineColor: '#000000',
      inkCoverageRatio: 0.35,
      isTemplatePlaceholder: false,
    };
    return text;
  }
  const logo: LogoElement = {
    ...basis,
    type: 'logo',
    fileUrl: '',
    fileName: '',
    originalWidthPx: 0,
    originalHeightPx: 0,
    originalFileUrl: '',
    backgroundRemoved: false,
    contentFillRatio: 0.85,
  };
  return logo;
}

function alsCartItem(position: AenderungsPosition, sizeQuantities: Record<string, number>): CartItem {
  return {
    id: position.id,
    printMethod: position.printMethod === 'embroidery' ? 'embroidery' : 'dtf',
    productId: position.productId,
    colorId: position.colorId,
    sizeQuantities,
    quantity: sumSizeQuantities(sizeQuantities),
    elements: position.elements.map(alsConfigElement),
    // Wird von priceCart ohnehin ignoriert (der Client-Preis zählt nie).
    unitPrice: 0,
    totalPrice: 0,
    addedAt: 0,
  };
}

/** Größen mit Menge 0 entfallen – so steht es auch in der Datenbank. */
function ohneNullen(sizeQuantities: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(sizeQuantities).filter(([, menge]) => menge > 0));
}

function summenAus(pricing: ServerCartPricing): Summen {
  return {
    gesamtCent: cent(pricing.totalPrice),
    warenwertCent: cent(pricing.subtotal),
    versandCent: cent(pricing.shippingCost),
    menge: pricing.totalQuantity,
  };
}

/** Prüft eine Berechnung auf alles, was sie unbrauchbar macht. null = brauchbar. */
function berechnungsProblem(pricing: ServerCartPricing, land: string | null): Abgelehnt | null {
  if (pricing.unpriceable.length > 0) {
    return {
      ok: false,
      grund: 'produkt-unbekannt',
      meldung: `Ein Produkt ist im Katalog nicht mehr vorhanden (${pricing.unpriceable.join(', ')}) – der Preis lässt sich nicht neu berechnen.`,
    };
  }
  if (pricing.shippingUnavailable || !land) {
    return {
      ok: false,
      grund: 'versandland',
      meldung: `Für das Lieferland „${land ?? 'unbekannt'}“ gibt es keinen hinterlegten Versandtarif – der Preis lässt sich nicht neu berechnen.`,
    };
  }
  if (pricing.blocked) {
    return {
      ok: false,
      grund: 'preis-blockiert',
      meldung: 'Die Preisberechnung meldet Beanstandungen und gilt als nicht belastbar.',
      details: pricing.issues,
    };
  }
  return null;
}

/**
 * Berechnet eine Änderung vollständig, ohne etwas zu speichern.
 *
 * Reihenfolge: Zulässigkeit des Zustands → Gültigkeit der Änderung → Gegenprobe
 * → Neuberechnung → Plausibilität (Preis darf nicht steigen). Jede Stufe, die
 * nicht aufgeht, lehnt mit Grund ab – es gibt keinen Ausweichpreis.
 *
 * `rechnungsErsatzMoeglich`: Kann das System zu einer vorhandenen Rechnung eine
 * Ersatzrechnung erzeugen (interner Rechnungsanbieter)? Entscheidet nur, was der
 * Plan der Rechnung zuordnet (`rechnungErsatz`) – gerechnet wird davon nichts.
 */
export async function berechneAenderung(
  stand: AenderungsStand,
  aenderungen: Aenderung[],
  optionen: { rechnungsErsatzMoeglich?: boolean } = {}
): Promise<{ ok: true; plan: AenderungsPlan } | Abgelehnt> {
  const { bestellung, positionen } = stand;
  const rechnungErsatz = bestimmeRechnungErsatz(bestellung, optionen.rechnungsErsatzMoeglich ?? false);

  // ── Zustand ───────────────────────────────────────────────────────────
  const zustand = pruefeAenderbarkeit(stand, { rechnungsErsatzMoeglich: optionen.rechnungsErsatzMoeglich });
  if (!zustand.erlaubt) {
    const erste = zustand.sperren[0]!;
    return { ok: false, grund: erste.code, meldung: zustand.sperren.map((s) => s.text).join(' ') };
  }

  // ── Gültigkeit der Änderung ───────────────────────────────────────────
  if (aenderungen.length === 0) {
    return { ok: false, grund: 'keine-aenderung', meldung: 'Es wurde nichts geändert.' };
  }
  const nachId = new Map(positionen.map((p) => [p.id, p]));
  const gesehen = new Set<string>();
  /** positionId → neue Größenmengen; null = Position entfällt. */
  const ziele = new Map<string, Record<string, number> | null>();

  for (const aenderung of aenderungen) {
    const position = nachId.get(aenderung.positionId);
    if (!position) {
      return { ok: false, grund: 'position-unbekannt', meldung: 'Eine der Positionen gehört nicht (mehr) zu dieser Bestellung.' };
    }
    if (gesehen.has(aenderung.positionId)) {
      return { ok: false, grund: 'ungueltige-aenderung', meldung: 'Pro Position ist nur eine Änderung möglich.' };
    }
    gesehen.add(aenderung.positionId);

    if (aenderung.art === 'entfernen') {
      ziele.set(position.id, null);
      continue;
    }

    const alt = position.sizeQuantities;
    const neu: Record<string, number> = { ...alt };
    let verringert = false;
    for (const [groesse, menge] of Object.entries(aenderung.neueMengen)) {
      const bisher = alt[groesse];
      if (bisher === undefined) {
        return {
          ok: false,
          grund: 'ungueltige-aenderung',
          meldung: `Die Größe „${groesse}“ gibt es in „${positionsName(position)}“ nicht – Größen hinzufügen ist nicht möglich.`,
        };
      }
      if (!Number.isInteger(menge) || menge < 0) {
        return { ok: false, grund: 'ungueltige-aenderung', meldung: 'Stückzahlen müssen ganze Zahlen ab 0 sein.' };
      }
      if (menge > bisher) {
        return {
          ok: false,
          grund: 'ungueltige-aenderung',
          meldung: `„${positionsName(position)}“, Größe ${groesse}: Die Stückzahl lässt sich nur verringern (bisher ${bisher}, gewünscht ${menge}). Mehr Ware braucht eine neue Bestellung.`,
        };
      }
      if (menge < bisher) verringert = true;
      neu[groesse] = menge;
    }
    if (!verringert) {
      return { ok: false, grund: 'keine-aenderung', meldung: `„${positionsName(position)}“: Die Stückzahl wurde nicht verringert.` };
    }
    const bleibt = ohneNullen(neu);
    if (sumSizeQuantities(bleibt) === 0) {
      return {
        ok: false,
        grund: 'menge-null',
        meldung: `„${positionsName(position)}“: Alle Größen auf 0 gesetzt – dafür gibt es „Position entfernen“.`,
      };
    }
    ziele.set(position.id, bleibt);
  }

  const verbleibend = positionen.filter((p) => ziele.get(p.id) !== null);
  if (verbleibend.length === 0) {
    return {
      ok: false,
      grund: 'letzte-position',
      meldung: 'Mindestens eine Position muss bleiben. Soll der ganze Auftrag entfallen, ist das die Stornierung.',
    };
  }

  // Stickerei: Die Stichzahl, an der der Preis hängt, steht nicht in der Datenbank.
  const stickerei = positionen.find((p) => p.printMethod === 'embroidery');
  if (stickerei) {
    return {
      ok: false,
      grund: 'stickerei-nicht-berechenbar',
      meldung: `„${positionsName(stickerei)}“ ist Stickerei: Der Preis hängt an der Stichzahl, und die wird nicht gespeichert. Eine Neuberechnung wäre geraten.`,
    };
  }

  // ── Gegenprobe: stimmt die unveränderte Bestellung auf den Cent? ──────────
  const land = bestellung.shippingCountry;
  const gespeichertCent = cent(bestellung.totalPrice);
  // Die zum Bestelldatum gültige Preisaktion (z. B. Black Week) – die Bestellung behält ihren Rabatt, auch wenn die Aktion inzwischen endete.
  const bestelldatum = bestellung.createdAt ? new Date(bestellung.createdAt) : null;
  const aktion = bestelldatum && Number.isFinite(bestelldatum.getTime()) ? aktuelleAktion(bestelldatum) : null;
  const urspruenglich = await priceCart(
    positionen.map((p) => alsCartItem(p, p.sizeQuantities)),
    land ?? undefined,
    aktion
  );
  const problemAlt = berechnungsProblem(urspruenglich, land);
  if (problemAlt) return problemAlt;

  const abweichungen: string[] = [];
  positionen.forEach((p, i) => {
    const berechnet = urspruenglich.items[i]!;
    if (cent(berechnet.totalPrice) !== cent(p.totalPrice) || berechnet.quantity !== p.quantity) {
      abweichungen.push(
        `${positionsName(p)}: gespeichert ${formatiereGeld(p.totalPrice)} für ${p.quantity} Stück, heute berechnet ${formatiereGeld(berechnet.totalPrice)} für ${berechnet.quantity} Stück`
      );
    }
  });
  if (cent(urspruenglich.totalPrice) !== gespeichertCent) {
    abweichungen.push(
      `Gesamtsumme: gespeichert ${formatiereGeld(bestellung.totalPrice)}, heute berechnet ${formatiereGeld(urspruenglich.totalPrice)}`
    );
  }
  if (abweichungen.length > 0) {
    return {
      ok: false,
      grund: 'preis-abweichung',
      meldung:
        'Die Bestellung lässt sich nicht automatisch neu berechnen: Mit den gespeicherten Daten und den heutigen Preisen kommt nicht derselbe Betrag heraus wie bei der Bestellung (Katalogpreis seit der Bestellung geändert, oder Preisgrundlagen sind nicht gespeichert). Ein geratener Preis wäre falsch.',
      details: abweichungen,
    };
  }

  // ── Neuberechnung der geänderten Bestellung ───────────────────────────
  const neueItems: CartItem[] = [];
  for (const p of positionen) {
    const ziel = ziele.get(p.id);
    if (ziel === null) continue; // entfernt
    neueItems.push(alsCartItem(p, ziel ?? p.sizeQuantities));
  }
  const neuePreise = await priceCart(neueItems, land ?? undefined, aktion);
  const problemNeu = berechnungsProblem(neuePreise, land);
  if (problemNeu) return problemNeu;

  const alt = summenAus(urspruenglich);
  const neu = summenAus(neuePreise);
  if (neu.gesamtCent > alt.gesamtCent) {
    const grundTexte: string[] = [];
    if (neu.versandCent > alt.versandCent) {
      grundTexte.push(`Versand ${formatiereGeld(euro(alt.versandCent))} → ${formatiereGeld(euro(neu.versandCent))}`);
    }
    grundTexte.push(`Warenwert ${formatiereGeld(euro(alt.warenwertCent))} → ${formatiereGeld(euro(neu.warenwertCent))}`);
    return {
      ok: false,
      grund: 'preis-steigt',
      meldung:
        `Die Änderung würde die Gesamtsumme ERHÖHEN (${formatiereGeld(euro(alt.gesamtCent))} → ${formatiereGeld(euro(neu.gesamtCent))}), ` +
        'etwa durch Versandkosten unter der Freigrenze, die Einrichtungsgebühr bei höchstens zwei Stück oder einen höheren Stückpreis bei kleinerer Menge. ' +
        'Eine Preiserhöhung durch eine Verringerung ist ohne Zustimmung der Kundschaft nicht zulässig – bitte mit ihr klären.',
      details: grundTexte,
    };
  }

  // ── Plan zusammensetzen ───────────────────────────────────────────────
  // Positionsnummern in `neuePreise.items` entsprechen der Reihenfolge von `neueItems`.
  const neuPreisJePosition = new Map<string, (typeof neuePreise.items)[number]>();
  neueItems.forEach((item, i) => neuPreisJePosition.set(item.id, neuePreise.items[i]!));

  const taxRate = bestellung.taxRate;
  const netto = (brutto: number): number | null =>
    taxRate === null ? null : taxRate > 0 ? runde2(brutto / (1 + taxRate / 100)) : brutto;

  const planPositionen: PlanPosition[] = [];
  const schreibungen: PositionsSchreibung[] = [];
  const aenderungszeilen: string[] = [];

  for (const p of positionen) {
    const ziel = ziele.get(p.id);
    const altTeil = { sizeQuantities: p.sizeQuantities, menge: p.quantity, gesamtCent: cent(p.totalPrice) };

    if (ziel === undefined) {
      planPositionen.push({ id: p.id, name: positionsName(p), aktion: 'unveraendert', alt: altTeil, neu: altTeil, verwaisteDateien: [] });
      continue;
    }

    if (ziel === null) {
      planPositionen.push({
        id: p.id,
        name: positionsName(p),
        aktion: 'entfernt',
        alt: altTeil,
        neu: null,
        verwaisteDateien: p.elements.flatMap((e) => e.logoPfade ?? []),
      });
      schreibungen.push({ id: p.id, aktion: 'entfernen' });
      aenderungszeilen.push(`${positionsName(p)} (${groessenText(p.sizeQuantities)}) komplett entfernt`);
      continue;
    }

    const berechnet = neuPreisJePosition.get(p.id)!;
    planPositionen.push({
      id: p.id,
      name: positionsName(p),
      aktion: 'verringert',
      alt: altTeil,
      neu: { sizeQuantities: ziel, menge: berechnet.quantity, gesamtCent: cent(berechnet.totalPrice) },
      verwaisteDateien: [],
    });
    schreibungen.push({
      id: p.id,
      aktion: 'aendern',
      sizeQuantities: ziel,
      quantity: berechnet.quantity,
      unitPrice: berechnet.unitPrice,
      totalPrice: berechnet.totalPrice,
      netTotalPrice: netto(berechnet.totalPrice),
    });
    const weniger = p.quantity - berechnet.quantity;
    const geaendert = Object.entries(p.sizeQuantities)
      .filter(([groesse, menge]) => (ziel[groesse] ?? 0) !== menge)
      .map(([groesse, menge]) => `${groesse}: ${menge} → ${ziel[groesse] ?? 0}`)
      .join(', ');
    aenderungszeilen.push(
      `${weniger} × ${positionsName(p)} entfernt (${geaendert}; jetzt ${berechnet.quantity} statt ${p.quantity} Stück)`
    );
  }

  const gesamtNeu = euro(neu.gesamtCent);
  const steuerBetrag =
    taxRate === null ? null : taxRate > 0 ? runde2(gesamtNeu - gesamtNeu / (1 + taxRate / 100)) : 0;
  const nettoGesamt = steuerBetrag === null ? null : runde2(gesamtNeu - steuerBetrag);

  const differenzCent = alt.gesamtCent - neu.gesamtCent;
  const bestaetigungen = [...zustand.bestaetigungen];
  const hinweise = [...zustand.hinweise];
  const bezahlt = bestellung.paymentStatus === 'paid';
  const erstattungNoetigCent = bezahlt ? differenzCent : 0;
  if (bezahlt && differenzCent > 0) {
    // Der ausführliche Hinweis („Differenz X € muss erstattet werden …“) steht in der Oberfläche als eigener,
    // auffälliger Block – er hängt an `erstattungNoetigCent`, nicht an einem Text in dieser Liste.
    bestaetigungen.push('erstattung-manuell');
  }

  return {
    ok: true,
    plan: {
      alt,
      neu,
      differenzCent,
      positionen: planPositionen,
      aenderungszeilen,
      bestellungNeu: { quantity: neu.menge, totalPrice: gesamtNeu, taxAmount: steuerBetrag, netTotal: nettoGesamt },
      schreibungen,
      erwartet: {
        status: bestellung.status,
        paymentStatus: bestellung.paymentStatus,
        totalPrice: bestellung.totalPrice,
        quantity: bestellung.quantity,
        invoiceNumber: bestellung.invoiceNumber,
        positionen: positionen.map((p) => ({ id: p.id, sizeQuantities: p.sizeQuantities, totalPrice: p.totalPrice })),
      },
      bestaetigungen,
      hinweise,
      erstattungNoetigCent,
      rechnungKorrekturNoetig: Boolean(bestellung.invoiceNumber),
      rechnungErsatz,
      verbleibendePositionen: verbleibend.map((p) => ({
        productId: p.productId,
        colorId: p.colorId,
        sizeQuantities: ziele.get(p.id) ?? p.sizeQuantities,
      })),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 3. Übergabe an die Datenbankfunktion
// ═══════════════════════════════════════════════════════════════════════

/**
 * Der Inhalt von `aendere_bestellpositionen` (Migration 0038). Snake_case wie
 * die Spalten – die Funktion liest es direkt als JSON.
 *
 * `stand` ist der Zustand, auf dem der Plan berechnet wurde. Die Funktion
 * vergleicht ihn unter Zeilensperre mit der Datenbank und bricht ab, wenn sich
 * inzwischen etwas geändert hat (zweiter Admin-Tab, Statuswechsel, Storno) –
 * dann gälte der berechnete Preis nicht mehr.
 */
export function baueRpcNutzlast(
  plan: AenderungsPlan,
  ereignis: { reason: string; detail: Record<string, unknown> }
): Record<string, unknown> {
  return {
    stand: {
      status: plan.erwartet.status,
      payment_status: plan.erwartet.paymentStatus,
      total_price: plan.erwartet.totalPrice,
      quantity: plan.erwartet.quantity,
      invoice_number: plan.erwartet.invoiceNumber,
      positionen: plan.erwartet.positionen.map((p) => ({
        id: p.id,
        size_quantities: p.sizeQuantities,
        total_price: p.totalPrice,
      })),
    },
    bestellung: {
      quantity: plan.bestellungNeu.quantity,
      total_price: plan.bestellungNeu.totalPrice,
      tax_amount: plan.bestellungNeu.taxAmount,
      net_total: plan.bestellungNeu.netTotal,
    },
    aenderungen: plan.schreibungen.map((s) =>
      s.aktion === 'entfernen'
        ? { id: s.id, aktion: 'entfernen' }
        : {
            id: s.id,
            aktion: 'aendern',
            size_quantities: s.sizeQuantities,
            quantity: s.quantity,
            unit_price: s.unitPrice,
            total_price: s.totalPrice,
            net_total_price: s.netTotalPrice,
          }
    ),
    ereignis,
  };
}

/** Der strukturierte Teil des Historien-Eintrags (`order_events.detail`). */
export function baueEreignisDetail(
  plan: AenderungsPlan,
  zusatz: { begruendung: string; zahlungsstatus: string; rechnungsnummer: string | null; kundenmail: 'geplant' | 'abgewaehlt' | 'keine-adresse' }
): Record<string, unknown> {
  return {
    quelle: 'admin',
    begruendung: zusatz.begruendung,
    alt: plan.alt,
    neu: plan.neu,
    differenzCent: plan.differenzCent,
    zahlungsstatus: zusatz.zahlungsstatus,
    rechnungsnummer: zusatz.rechnungsnummer,
    rechnungKorrekturNoetig: plan.rechnungKorrekturNoetig,
    // 'automatisch' = die Änderung hat eine Ersatzrechnung ausgelöst (orderInvoiceReplacement.ts). Dieses Feld IST der
    // atomar mitgespeicherte Auftrag dazu: Fehlt die Ersatzrechnung später (Absturz, Fehlschlag), leitet
    // ermittleAusstehendeErsetzung() daraus ab, dass noch eine aussteht. 'manuell'/'keine' lösen nichts aus.
    rechnungErsatz: plan.rechnungErsatz,
    // Nur bei bezahlten Bestellungen > 0. Grundlage der Anzeige „Differenz X € muss erstattet werden“.
    erstattungNoetigCent: plan.erstattungNoetigCent,
    kundenmail: zusatz.kundenmail,
    aenderungen: plan.aenderungszeilen,
    positionen: plan.positionen
      .filter((p) => p.aktion !== 'unveraendert')
      .map((p) => ({
        id: p.id,
        name: p.name,
        aktion: p.aktion,
        alt: p.alt,
        neu: p.neu,
        // Bleiben im Speicher liegen (nicht gelöscht): ein Versehen lässt sich so noch nachvollziehen.
        verwaisteDateien: p.verwaisteDateien,
      })),
  };
}

export function baueEreignisGrund(plan: AenderungsPlan, begruendung: string): string {
  const zeilen = plan.aenderungszeilen.join('; ');
  const summe = `Summe ${formatiereGeld(euro(plan.alt.gesamtCent))} → ${formatiereGeld(euro(plan.neu.gesamtCent))}`;
  return `Auftrag durch den Betreiber geändert: ${zeilen}. ${summe}. Grund: ${begruendung}`;
}

// ═══════════════════════════════════════════════════════════════════════
// 4. Daten für die Kundenmail „Dein Auftrag wurde geändert“
// ═══════════════════════════════════════════════════════════════════════

/**
 * Was die Mail über die Rechnung sagt – bestimmt allein durch das, was der Code
 * TATSÄCHLICH tut:
 *  - `entsteht`: Es gibt noch keine Rechnung. Fehlt sie wegen eines
 *    Fehlschlags, baut der Nachholweg (`holeOffeneRechnungenNach`) sie aus den
 *    gespeicherten – jetzt geänderten – Daten. Die Rechnung entsteht also
 *    gleich mit dem neuen Stand.
 *  - `folgt-separat`: Die Rechnung existiert (Nummer) und gilt für den alten
 *    Stand. Eine angepasste schickt der Betreiber von Hand nach (das System
 *    erzeugt keine Korrekturrechnung). Die Mail sagt deshalb nur, dass eine
 *    angepasste Rechnung separat folgt – nicht, dass die alte „ungültig“ oder
 *    „storniert“ wäre (das wäre eine rechtliche Aussage). Dasselbe gilt, wenn
 *    die automatische Ersatzrechnung gescheitert ist: Der Betreiber holt sie
 *    über die Schaltfläche im Admin nach und schickt sie dann mit.
 *  - `ersetzt`: Die Ersatzrechnung ist erzeugt und hängt als PDF an der Mail.
 *    Die Mail nennt die neue und die ersetzte Rechnung – mehr nicht.
 *    `neueRechnungsnummer` ist nur in der Vorschau null (die Nummer wird erst
 *    beim Speichern vergeben).
 */
export type RechnungsHinweis =
  | { art: 'entsteht' }
  | { art: 'folgt-separat'; rechnungsnummer: string }
  | {
      art: 'ersetzt';
      neueRechnungsnummer: string | null;
      alteRechnungsnummer: string;
      /** ISO-Datum (yyyy-mm-dd) der ersetzten Rechnung; null, wenn nicht bekannt. */
      alteRechnungsdatum: string | null;
    };

/** Wie weit die Ersatzrechnung ist, wenn die Mail gebaut wird. */
export type ErsatzFuerMail = { status: 'vorschau' } | { status: 'erstellt'; neueNummer: string } | { status: 'fehlgeschlagen' };

export interface KundenmailDaten {
  orderNumber: string;
  /** Ein Satz je Änderung. */
  aenderungen: string[];
  altGesamtCent: number;
  neuGesamtCent: number;
  differenzCent: number;
  versandAltCent: number;
  versandNeuCent: number;
  /** Rechnungskauf oder bereits bezahlt – bestimmt den Satz zur Zahlung. */
  zahlung: 'rechnung' | 'bezahlt';
  rechnung: RechnungsHinweis;
  bestellansichtUrl?: string | null;
}

export function baueKundenmailDaten(
  plan: AenderungsPlan,
  bestellung: Pick<AenderungsBestellung, 'orderNumber' | 'paymentStatus' | 'invoiceNumber'> & Partial<Pick<AenderungsBestellung, 'invoiceDate'>>,
  bestellansichtUrl?: string | null,
  /** Nur bei `plan.rechnungErsatz === 'automatisch'` von Bedeutung. Ohne Angabe wie in der Vorschau. */
  ersatz: ErsatzFuerMail = { status: 'vorschau' }
): KundenmailDaten {
  const ersetzt =
    plan.rechnungErsatz === 'automatisch' && bestellung.invoiceNumber && ersatz.status !== 'fehlgeschlagen'
      ? ({
          art: 'ersetzt',
          neueRechnungsnummer: ersatz.status === 'erstellt' ? ersatz.neueNummer : null,
          alteRechnungsnummer: bestellung.invoiceNumber,
          alteRechnungsdatum: bestellung.invoiceDate ?? null,
        } satisfies RechnungsHinweis)
      : null;
  return {
    orderNumber: bestellung.orderNumber,
    aenderungen: plan.aenderungszeilen,
    altGesamtCent: plan.alt.gesamtCent,
    neuGesamtCent: plan.neu.gesamtCent,
    differenzCent: plan.differenzCent,
    versandAltCent: plan.alt.versandCent,
    versandNeuCent: plan.neu.versandCent,
    zahlung: bestellung.paymentStatus === 'paid' ? 'bezahlt' : 'rechnung',
    rechnung:
      ersetzt ??
      (bestellung.invoiceNumber
        ? { art: 'folgt-separat', rechnungsnummer: bestellung.invoiceNumber }
        : { art: 'entsteht' }),
    bestellansichtUrl: bestellansichtUrl ?? null,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// 5. Offene Erstattung aus der Historie (kein eigener Zustand in der Datenbank)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Was nach Auftragsänderungen noch an den Kunden zurückzuzahlen ist: die
 * Summe aller `erstattungNoetigCent` der Änderungs-Ereignisse minus der
 * vermerkten manuellen Erstattungen.
 *
 * Bewusst aus dem append-only-Protokoll abgeleitet statt aus einer Spalte –
 * derselbe Grundsatz wie bei den Zahlungsversuchen (docs/zahlungsarchitektur.md,
 * Abschnitt 4a): aktueller Zustand an `orders`, Verlauf in `order_events`; eine
 * zweite Buchführung daneben liefe auseinander.
 */
export function berechneOffeneErstattungCent(
  ereignisse: Array<{ eventType: string; detail: Record<string, unknown> | null }>
): number {
  let offen = 0;
  for (const e of ereignisse) {
    if (e.eventType === 'order_items_edited') {
      const betrag = Number(e.detail?.erstattungNoetigCent ?? 0);
      if (Number.isFinite(betrag) && betrag > 0) offen += Math.round(betrag);
    } else if (e.eventType === 'manual_refund_noted') {
      const betrag = Number(e.detail?.betragCent ?? 0);
      if (Number.isFinite(betrag) && betrag > 0) offen -= Math.round(betrag);
    }
  }
  return Math.max(0, offen);
}

// ═══════════════════════════════════════════════════════════════════════
// 6. Steht noch eine Ersatzrechnung aus? (aus der Historie abgeleitet)
// ═══════════════════════════════════════════════════════════════════════

export interface AusstehendeErsetzung {
  /** Die Rechnung, die noch ersetzt werden muss (= die aktuelle Rechnung der Bestellung). */
  alteNummer: string;
  /** Hatte der Betreiber beim Speichern die Kundenmail vorgesehen? Vorgabe für „Rechnung auch per Mail senden“. */
  kundenmailVorgesehen: boolean;
}

/**
 * Leitet aus der Bestell-Historie ab, ob nach der LETZTEN Auftragsänderung noch
 * eine automatische Ersatzrechnung aussteht.
 *
 * Regel: Die jüngste Änderung (`order_items_edited`) hat eine Ersatzrechnung
 * ausgelöst (`detail.rechnungErsatz === 'automatisch'`) und merkt sich, welche
 * Rechnung sie ablösen soll (`detail.rechnungsnummer`). Trägt die Bestellung
 * noch GENAU diese Rechnung, ist der Ersatz offen. Trägt sie schon eine andere
 * (der Tausch in Migration 0039 hat stattgefunden), ist er erledigt.
 *
 * Warum aus der Historie statt aus einem Merker an der Bestellung: Das Ereignis
 * entsteht in DERSELBEN Transaktion wie die Änderung (Migration 0038). Es kann
 * also weder fehlen, wenn die Änderung gespeichert ist, noch vorhanden sein,
 * wenn sie es nicht ist – anders als ein Merker, den die Anwendung hinterher
 * setzen müsste und der bei einem Absturz dazwischen verloren ginge.
 *
 * Ältere Änderungen (vor Einführung der Ersatzrechnung) tragen das Feld nicht
 * und lösen nichts aus; für sie bleibt es bei der manuellen Korrektur.
 *
 * `ereignisse`: neueste zuerst (wie `getOrderDetail`); fehlt `at`, zählt die Reihenfolge.
 */
export function ermittleAusstehendeErsetzung(
  ereignisse: Array<{ eventType: string; at?: string | null; detail: Record<string, unknown> | null }>,
  aktuelleRechnungsnummer: string | null
): AusstehendeErsetzung | null {
  if (!aktuelleRechnungsnummer) return null;
  const aenderungen = ereignisse.filter((e) => e.eventType === 'order_items_edited');
  if (aenderungen.length === 0) return null;
  const neueste = [...aenderungen].sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))[0]!;
  const detail = neueste.detail;
  if (!detail || detail.rechnungErsatz !== 'automatisch') return null;
  if (typeof detail.rechnungsnummer !== 'string' || detail.rechnungsnummer !== aktuelleRechnungsnummer) return null;
  return { alteNummer: detail.rechnungsnummer, kundenmailVorgesehen: detail.kundenmail === 'geplant' };
}
