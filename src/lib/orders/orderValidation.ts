/**
 * VOLLSTÄNDIGE SERVERSEITIGE PRÜFUNG EINES BESTELLEINGANGS.
 *
 * ── Warum es diese Schicht gibt ───────────────────────────────────────
 * Alles, was aus dem Browser kommt, ist eine BEHAUPTUNG, keine Tatsache.
 * Preise werden bereits serverseitig neu berechnet (serverPricing.ts) – aber
 * eine Bestellung kann auch dann unbrauchbar sein, wenn der Preis stimmt:
 * eine Größe, die es beim Produkt nicht gibt, eine Farbe aus einem anderen
 * Produkt, eine Menge von 0 oder −5, ein Motiv, das größer ist als die
 * bedruckbare Fläche. Solche Bestellungen sind nicht fertigbar und dürfen
 * gar nicht erst entstehen.
 *
 * ── Abgrenzung ────────────────────────────────────────────────────────
 * Diese Datei prüft die FACHLICHE GÜLTIGKEIT einer Bestellung.
 * Sie berechnet KEINE Preise (das tut die Preispipeline) und sie speichert
 * NICHTS (das tut lib/actions/orders.ts). Sie kennt weder Oberfläche noch
 * Datenbank und ist damit ebenso aus einer API, einem Adminwerkzeug oder
 * einem Hintergrundjob nutzbar.
 *
 * ── Grundsatz: blockieren statt raten ─────────────────────────────────
 * Jeder Befund nennt einen maschinenlesbaren Code (für das Protokoll) UND
 * einen für Kundschaft verständlichen deutschen Satz. Es gibt bewusst keine
 * "Reparaturversuche" – eine unklare Bestellung wird abgewiesen, nicht
 * stillschweigend zurechtgebogen.
 */
import { getProduct } from '@/config/products';
import { getPrintAreas } from '@/config/printAreas';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import type { CartItem, PrintMethod } from '@/types';

/**
 * TECHNISCHE SCHUTZGRENZEN – ausdrücklich KEINE Geschäftsentscheidungen.
 *
 * Sie fangen Zahlenmüll und Missbrauch ab (etwa eine Menge von 10 Millionen
 * aus einem manipulierten Request), nicht echte Aufträge. Sie sind deshalb
 * bewusst weit über jeder realistischen Bestellung angesetzt. Wenn hier
 * jemals ein echter Auftrag anschlägt, ist die Grenze zu ändern – nicht der
 * Auftrag.
 */
export const GRENZEN = {
  /** Stückzahl je Größe. */
  maxMengeJeGroesse: 100_000,
  /** Stückzahl je Warenkorbposition. */
  maxMengeJePosition: 100_000,
  /** Positionen je Bestellung. */
  maxPositionen: 100,
  /** Motive/Texte je Position (4 Ansichten × mehrere Elemente). */
  maxElementeJePosition: 40,
  /** Zeichen je Textelement. */
  maxTextLaenge: 500,
  /** Zeichen je Kontaktfeld – schützt die Datenbank vor Riesen-Eingaben. */
  maxFeldLaenge: 200,
  /**
   * Zugabe in cm beim Vergleich Motivgröße ↔ Druckfläche. Deckt
   * Rundungsdifferenzen zwischen Browser-Darstellung (Pixel) und
   * Zentimeterwerten ab, ohne echte Überschreitungen durchzulassen.
   */
  toleranzCm: 0.5,
} as const;

const ERLAUBTE_VEREDELUNGEN: readonly PrintMethod[] = ['dtf', 'embroidery'];

export interface OrderValidationIssue {
  /** Maschinenlesbar, für Protokoll und Auswertung. */
  code: string;
  /** Verständlicher Satz – so wie er der Kundschaft angezeigt werden darf. */
  message: string;
  /** Betroffene Warenkorbposition, sofern zuordenbar. */
  itemId?: string;
}

export interface OrderValidationResult {
  valid: boolean;
  issues: OrderValidationIssue[];
  /**
   * Anzeigetext für die Kundschaft: der erste Befund, bei mehreren Befunden
   * mit einem Hinweis auf die Gesamtzahl. Nie eine technische Meldung.
   */
  customerMessage?: string;
  /**
   * Zeitpunkt, zu dem DIESE Prüfung die AGB-/Datenschutz-Zustimmung als
   * erfüllt bestätigt hat – nur gesetzt bei `valid === true` und einer
   * echten Bestellung (orderType 'order'), NIE bei einer Anfrage. Einzige
   * Stelle, die diesen Zeitpunkt festlegt (server-seitig, nicht der Client):
   * lib/actions/orders.ts übernimmt ihn nur noch nach `orders.terms_accepted_at`
   * (Migration 0025), berechnet ihn nicht selbst neu.
   */
  termsAcceptedAt?: string;
}

export interface OrderValidationInput {
  orderType: 'order' | 'inquiry';
  items: CartItem[];
  email: string;
  customerName: string;
  /** Nur bei echten Bestellungen vorhanden. */
  shipping?: { street: string; zip: string; city: string; country: string };
  /** Nur bei echten Bestellungen relevant – ohne Zustimmung keine Bestellung. */
  acceptedTerms?: boolean;
}

/**
 * E-Mail-Prüfung: bewusst pragmatisch statt regelkonform nach RFC 5322.
 * Ziel ist, Tippfehler und offensichtlichen Unsinn abzufangen – ob die
 * Adresse wirklich existiert, zeigt erst die Zustellung.
 */
export function istPlausibleEmail(email: string): boolean {
  const wert = email.trim();
  if (wert.length < 5 || wert.length > GRENZEN.maxFeldLaenge) return false;
  if (/\s/.test(wert)) return false;
  return /^[^@]+@[^@.]+(\.[^@.]+)+$/.test(wert);
}

/**
 * Deutsche Postleitzahl: exakt fünf Ziffern.
 *
 * Einzige Stelle, die dieses Format kennt – Checkout (CartDrawer.tsx) UND
 * Konto-Adressbuch (lib/account/validation.ts) nutzen dieselbe Regel, damit
 * eine PLZ nicht an der einen Stelle akzeptiert und an der anderen abgelehnt
 * wird. Solange ausschließlich nach Deutschland verkauft wird (siehe
 * config/shipping.ts), ist ein einzelnes, festes Format ausreichend.
 */
export const PLZ_MUSTER = /^\d{5}$/;

export function istGueltigePlz(plz: string): boolean {
  return PLZ_MUSTER.test(plz.trim());
}

/** Endliche Zahl (kein NaN, kein Infinity, kein String, kein null). */
function istZahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert);
}

/**
 * Prüft einen Bestelleingang vollständig gegen den Katalog.
 *
 * Reihenfolge: erst die Angaben zur Person (billig zu prüfen), dann der
 * Warenkorb Position für Position. Es wird NICHT beim ersten Fehler
 * abgebrochen – so sieht die Kundschaft alle Probleme auf einmal, statt sie
 * nacheinander zu entdecken.
 */
export async function validateSubmission(input: OrderValidationInput): Promise<OrderValidationResult> {
  const issues: OrderValidationIssue[] = [];
  const istBestellung = input.orderType === 'order';

  // ── 1. Angaben zur Person ───────────────────────────────────────────
  if (!input.customerName.trim()) {
    issues.push({ code: 'name_fehlt', message: 'Bitte geben Sie Ihren Namen an.' });
  } else if (input.customerName.length > GRENZEN.maxFeldLaenge) {
    issues.push({ code: 'name_zu_lang', message: 'Der eingegebene Name ist zu lang.' });
  }

  if (!istPlausibleEmail(input.email)) {
    issues.push({ code: 'email_ungueltig', message: 'Bitte geben Sie eine gültige E-Mail-Adresse an.' });
  }

  if (istBestellung) {
    const versand = input.shipping;
    if (!versand?.street?.trim() || !versand?.zip?.trim() || !versand?.city?.trim() || !versand?.country?.trim()) {
      issues.push({ code: 'adresse_unvollstaendig', message: 'Bitte füllen Sie die Lieferadresse vollständig aus.' });
    } else {
      const zuLang = [versand.street, versand.zip, versand.city, versand.country].some(
        (feld) => feld.trim().length > GRENZEN.maxFeldLaenge
      );
      if (zuLang) {
        issues.push({ code: 'adresse_zu_lang', message: 'Eine Angabe in der Lieferadresse ist zu lang.' });
      } else if (!istGueltigePlz(versand.zip)) {
        issues.push({ code: 'plz_ungueltig', message: 'Bitte geben Sie eine gültige Postleitzahl an (5 Ziffern).' });
      }
    }

    // AGB-Zustimmung ist Voraussetzung für eine Bestellung, nicht nur eine
    // UI-Bequemlichkeit – der Client prüft das bereits, aber nur eine
    // serverseitige Prüfung verhindert eine Bestellung ohne Zustimmung
    // zuverlässig (siehe CartDrawer.tsx `acceptedTerms`).
    if (!input.acceptedTerms) {
      issues.push({
        code: 'agb_nicht_akzeptiert',
        message: 'Bitte akzeptieren Sie die AGB und die Datenschutzerklärung, um die Bestellung abzuschließen.',
      });
    }
  }

  // ── 2. Warenkorb als Ganzes ─────────────────────────────────────────
  // Eine unverbindliche Anfrage darf leer sein (reine Kontaktaufnahme),
  // eine echte Bestellung nicht.
  if (istBestellung && input.items.length === 0) {
    issues.push({ code: 'warenkorb_leer', message: 'Ihr Warenkorb ist leer.' });
  }
  if (input.items.length > GRENZEN.maxPositionen) {
    issues.push({
      code: 'zu_viele_positionen',
      message: `Ihr Warenkorb enthält zu viele Positionen (maximal ${GRENZEN.maxPositionen}). Bitte fragen Sie größere Aufträge direkt bei uns an.`,
    });
  }

  // ── 3. Jede Position einzeln gegen den Katalog ──────────────────────
  for (const item of input.items) {
    issues.push(...(await pruefePosition(item, istBestellung)));
  }

  const ergebnis = baueErgebnis(issues);
  // Der Zeitstempel entsteht GENAU hier, im Moment der bestätigten Prüfung –
  // nicht erst später beim Speichern (lib/actions/orders.ts) und nicht aus
  // einer Client-Angabe. "Eine Berechnung, ein Ort": Der Ort, der die
  // Zustimmung prüft, ist auch der Ort, der ihren Zeitpunkt festhält.
  if (ergebnis.valid && istBestellung) {
    ergebnis.termsAcceptedAt = new Date().toISOString();
  }
  return ergebnis;
}

/**
 * Prüft EINE Warenkorbposition gegen Katalog und Druckflächen.
 *
 * `istBestellung` steuert ausschließlich die Personalisierungspflicht unten:
 * Eine unverbindliche Anfrage darf noch ohne fertiges Motiv verschickt
 * werden (der Kunde klärt die Gestaltung ja erst persönlich mit uns), eine
 * echte Bestellung nicht – siehe Geschäftsregel vom 2026-08-19.
 */
async function pruefePosition(item: CartItem, istBestellung: boolean): Promise<OrderValidationIssue[]> {
  const issues: OrderValidationIssue[] = [];
  const itemId = item.id;
  // Für die Anzeige: der Produktname ist der Kundschaft vertraut, die ID nicht.
  const produkt = getProduct(item.productId);

  if (!produkt) {
    return [
      {
        code: 'produkt_unbekannt',
        message: 'Ein Artikel in Ihrem Warenkorb ist nicht mehr verfügbar. Bitte entfernen Sie ihn und stellen Sie den Warenkorb neu zusammen.',
        itemId,
      },
    ];
  }
  const name = produkt.name;

  // ── Veredelungsart ────────────────────────────────────────────────
  if (!ERLAUBTE_VEREDELUNGEN.includes(item.printMethod)) {
    issues.push({
      code: 'veredelung_ungueltig',
      message: `Für „${name}" ist keine gültige Veredelungsart ausgewählt.`,
      itemId,
    });
  }

  // ── Farbe ─────────────────────────────────────────────────────────
  if (!produkt.colors.some((c) => c.id === item.colorId)) {
    issues.push({
      code: 'farbe_unbekannt',
      message: `Die gewählte Farbe ist für „${name}" nicht verfügbar. Bitte wählen Sie eine andere Farbe.`,
      itemId,
    });
  }

  // ── Größen und Mengen ─────────────────────────────────────────────
  const groessen = Object.entries(item.sizeQuantities ?? {});
  for (const [groesse, menge] of groessen) {
    if (!produkt.sizes.includes(groesse)) {
      issues.push({
        code: 'groesse_unbekannt',
        message: `Die Größe „${groesse}" gibt es bei „${name}" nicht. Bitte passen Sie die Auswahl an.`,
        itemId,
      });
      continue;
    }
    if (!istZahl(menge) || !Number.isInteger(menge) || menge < 0) {
      issues.push({
        code: 'menge_ungueltig',
        message: `Bitte geben Sie für „${name}" in Größe „${groesse}" eine gültige Stückzahl an.`,
        itemId,
      });
      continue;
    }
    if (menge > GRENZEN.maxMengeJeGroesse) {
      issues.push({
        code: 'menge_zu_gross',
        message: `Die Stückzahl für „${name}" in Größe „${groesse}" ist zu hoch. Für Großaufträge erstellen wir Ihnen gern ein persönliches Angebot.`,
        itemId,
      });
    }
  }

  // Die Gesamtmenge kommt aus derselben Regel wie überall sonst
  // (quantity.ts) – NICHT aus dem mitgeschickten item.quantity.
  const menge = sumSizeQuantities(item.sizeQuantities ?? {});
  if (menge <= 0) {
    issues.push({
      code: 'menge_null',
      message: `Bitte wählen Sie für „${name}" mindestens ein Stück in einer Größe.`,
      itemId,
    });
  } else if (menge > GRENZEN.maxMengeJePosition) {
    issues.push({
      code: 'positionsmenge_zu_gross',
      message: `Die Gesamtstückzahl für „${name}" ist zu hoch. Für Großaufträge erstellen wir Ihnen gern ein persönliches Angebot.`,
      itemId,
    });
  }

  // ── Motive und Texte ──────────────────────────────────────────────
  const elemente = item.elements ?? [];
  // Geschäftsregel vom 2026-08-19: Wir verkaufen ausschließlich
  // personalisierte Ware. Farbe, Größe, Menge und die Wahl von DTF oder
  // Stickerei zählen dabei NICHT als Personalisierung – erst mindestens
  // ein tatsächliches Logo- oder Textelement macht eine Position zu einer
  // individuellen Anfertigung. Gilt nur für echte Bestellungen (istBestellung);
  // eine unverbindliche Anfrage darf die Gestaltung noch offen lassen.
  if (istBestellung && elemente.length === 0) {
    issues.push({
      code: 'kein_element',
      message: `Für „${name}" fehlt noch ein Logo oder ein Text. Bitte fügen Sie mindestens ein Element hinzu, bevor Sie bestellen.`,
      itemId,
    });
  }
  if (elemente.length > GRENZEN.maxElementeJePosition) {
    issues.push({
      code: 'zu_viele_elemente',
      message: `Für „${name}" sind zu viele Motive angelegt.`,
      itemId,
    });
  }

  // Druckflächen einmal je Position laden, nicht je Element.
  const druckflaechen = ERLAUBTE_VEREDELUNGEN.includes(item.printMethod)
    ? await getPrintAreas(item.productId, item.printMethod)
    : [];

  for (const element of elemente) {
    // Ansicht datengetrieben prüfen: gültig ist eine Ansicht genau dann, wenn
    // das PRODUKT für die gewählte Veredelung eine Druckfläche dieser Ansicht
    // führt (keine globale 4er-Whitelist mehr). Behebt zugleich, dass ein Motiv
    // auf einer vom Produkt gar nicht geführten Ansicht früher akzeptiert wurde.
    // Bei ungültiger Veredelungsart ist druckflaechen leer – das meldet ein
    // separater Veredelungsfehler, hier nicht doppelt.
    const flaeche = druckflaechen.find((a) => a.view === element.view);
    if (ERLAUBTE_VEREDELUNGEN.includes(item.printMethod) && !flaeche) {
      issues.push({
        code: 'ansicht_ungueltig',
        message: `Ein Motiv auf „${name}" liegt auf einer für dieses Produkt nicht verfügbaren Position.`,
        itemId,
      });
      continue;
    }

    const masseGueltig =
      istZahl(element.xCm) &&
      istZahl(element.yCm) &&
      istZahl(element.widthCm) &&
      istZahl(element.heightCm) &&
      istZahl(element.rotationDeg) &&
      element.widthCm > 0 &&
      element.heightCm > 0;

    if (!masseGueltig) {
      issues.push({
        code: 'elementmasse_ungueltig',
        message: `Ein Motiv auf „${name}" hat ungültige Maße. Bitte platzieren Sie es im Konfigurator neu.`,
        itemId,
      });
      continue;
    }

    if (element.type === 'text' && element.content.length > GRENZEN.maxTextLaenge) {
      issues.push({
        code: 'text_zu_lang',
        message: `Ein Text auf „${name}" ist zu lang.`,
        itemId,
      });
    }

    // ── Passt das Motiv überhaupt auf die bedruckbare Fläche? ───────
    // Geprüft wird die GRÖSSE, nicht die Position: die Größe ist
    // serverseitig eindeutig in Zentimetern vergleichbar, während die
    // Position vom Bildmaßstab der jeweiligen Ansicht abhängt und der
    // Konfigurator sie ohnehin an der Fläche festhält.
    if (flaeche) {
      const zuBreit = element.widthCm > flaeche.maxWidthCm + GRENZEN.toleranzCm;
      const zuHoch = element.heightCm > flaeche.maxHeightCm + GRENZEN.toleranzCm;
      if (zuBreit || zuHoch) {
        issues.push({
          code: 'element_ueberschreitet_druckflaeche',
          message:
            `Ein Motiv auf „${name}" ist größer als die bedruckbare Fläche ` +
            `(maximal ${flaeche.maxWidthCm} × ${flaeche.maxHeightCm} cm). Bitte verkleinern Sie es im Konfigurator.`,
          itemId,
        });
      }
    }
  }

  return issues;
}

/** Fasst die Befunde zu einem Ergebnis samt Anzeigetext zusammen. */
function baueErgebnis(issues: OrderValidationIssue[]): OrderValidationResult {
  if (issues.length === 0) return { valid: true, issues: [] };

  const erster = issues[0]!.message;
  const customerMessage =
    issues.length === 1 ? erster : `${erster} (Es gibt ${issues.length} Punkte, die noch nicht stimmen.)`;

  return { valid: false, issues, customerMessage };
}
