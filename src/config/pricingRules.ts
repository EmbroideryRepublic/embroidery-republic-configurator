import type { PricingRule, PrintMethod } from '@/types';
import { STICKKOSTEN_JE_1000_STICHE } from './pricing/selbstkosten';

/**
 * MOCK-Preisregeln – getrennt nach Veredelungsart. Gleiche Architektur wie
 * `printAreas.ts`: eine asynchrone Loader-Funktion mit der Signatur einer
 * künftigen Supabase-Abfrage. Der Preisrechner (`calculatePrice.ts`) kennt
 * nur `PricingRule[]`, nicht die Datenquelle oder Veredelungsart selbst –
 * dadurch funktioniert exakt derselbe Rechenkern für beide Konfiguratoren.
 *
 * DTF: Positionsstaffel (erste/zweite/weitere Ansicht, je Stückzahlstufe).
 * Stickerei (seit 2026-09-03): DIESELBE Positionsstaffel wie DTF plus ein
 * Aufpreis je 1.000 geschätzte Stiche – Stickerei ist damit bei gleichem
 * Motiv immer teurer als DTF, und zwar umso mehr, je stichreicher das Motiv
 * ist. Bei sehr großen Flächen unwirtschaftlich (deshalb auch kleinere
 * Druckbereiche, siehe printAreas.ts).
 */

/** Verkaufssatz je 1.000 geschätzte Stiche (Betreiber-Entscheidung 2026-09-03). */
export const STICH_AUFPREIS_JE_1000 = 1.2;

/**
 * Deckel für den Mengenrabatt auf den Stichaufpreis (PricingRule.maxDiscountPercent).
 *
 * Die Mengenstaffel QUANTITY_TIERS rabattiert die Veredelung bis zu 90 %. Auf
 * den Stichaufpreis angewandt fiele der Erlös je 1.000 Stiche ab 20 Stück auf
 * bzw. unter die Fremdkosten des Stickpartners (STICKKOSTEN_JE_1000_STICHE,
 * 0,76 €). Der Deckel begrenzt den Rabatt so, dass genau diese Untergrenze
 * nie unterschritten wird: bei 1,20 € Satz sind das 36,6 % (exakt 36,67 %,
 * auf eine Nachkommastelle ABgerundet – aufgerundet läge der Erlös mit
 * 0,7596 € knapp unter der Grenze). Ändert sich einer der beiden Beträge,
 * folgt der Deckel automatisch.
 */
export const STICH_RABATT_MAX_PROZENT =
  Math.floor((1 - STICKKOSTEN_JE_1000_STICHE / STICH_AUFPREIS_JE_1000) * 1000) / 10;
const DTF_PRICING_RULES: PricingRule[] = [
  // Grundgebühren deaktiviert (auf Wunsch nicht mehr separat ausgewiesen)
  // – stattdessen in den Flächenpreis eingerechnet (0,02 € → 0,05 €/cm²).
  // Deaktiviert statt gelöscht, damit die vorherige Kalkulationsgrundlage
  // im Code nachvollziehbar bleibt.
  { id: 'dtf-logo-base', ruleType: 'per_logo', price: 4.5, label: 'DTF-Transfer (Basis)', isActive: false },
  { id: 'dtf-text-base', ruleType: 'per_text', price: 3.5, label: 'Text-Transfer (Basis)', isActive: false },

  // ── Einmalige Rüstkosten – TECHNISCH VORBEREITET, FACHLICH AUS ──────
  // Standardmäßig 0 € und inaktiv: Die Preisstrategie wird später anhand der
  // echten Einkaufspreise, Produktionszeiten und Margenziele festgelegt.
  // Zum Aktivieren genügt `isActive: true` + ein Preis – am Rechenkern ist
  // dafür NICHTS zu ändern.
  //
  // `multiplier` steuert, wie oft der Betrag anfällt:
  //   'once'         – einmal je Auftragsposition
  //   'per_position' – je genutzter Fläche (Brust, Rücken, Ärmel …)
  //   'per_element'  – je Motiv
  // Mit `printView` lässt sich eine Regel auf eine Ansicht begrenzen, mit
  // `minQuantity`/`maxQuantity` auf ein Mengenfenster, mit `validFrom`/
  // `validUntil` auf einen Aktionszeitraum.
  { id: 'dtf-setup', ruleType: 'setup_fee', multiplier: 'per_position', price: 0, label: 'Einrichtung DTF (einmalig je Position)', isActive: false },

  // ── Je-Ansicht-Aufschläge (front/back/sleeve, unterschiedlich hoch je
  // Position) – ABGELÖST durch das Positionsstaffel-Modell unten (erste
  // Ansicht 9€ pauschal, jede weitere 5€, unabhängig davon WELCHE Ansicht).
  // Deaktiviert statt gelöscht, damit die vorherige Kalkulationsgrundlage im
  // Code nachvollziehbar bleibt.
  { id: 'dtf-pos-front', ruleType: 'per_position', printView: 'front', price: 0, label: 'Position: Brust', isActive: false },
  { id: 'dtf-pos-back', ruleType: 'per_position', printView: 'back', price: 2, label: 'Position: Rücken', isActive: false },
  { id: 'dtf-pos-sleeve-l', ruleType: 'per_position', printView: 'sleeve_left', price: 1.5, label: 'Position: Ärmel links', isActive: false },
  { id: 'dtf-pos-sleeve-r', ruleType: 'per_position', printView: 'sleeve_right', price: 1.5, label: 'Position: Ärmel rechts', isActive: false },

  // Reiner Materialdurchschlag der DTF-Folie (kein Aufschlag – die Marge
  // liegt komplett im Produkt-Grundpreis, siehe products.ts). Berechnet
  // aus echten Folienpreisen: 297×420mm (A3) für 7,49€ = 0,006 €/cm².
  // Kalibriert auf Basis eines T-Shirts mit 4,90€ Blankokosten, 1€
  // Verpackung, 5,50€ Versand (historisch ÷5 gerechnet, als noch eine
  // Mindestbestellmenge von 5 galt = 1,10€/Shirt – diese Annahme gilt seit
  // dem Wegfall der Mindestmenge nicht mehr und ist beim nächsten
  // Kalkulationsdurchgang zu prüfen),
  // 1,4 Min. Arbeitszeit bei 20€/h sowie 5€ Zielgewinn pro Shirt
  // (unabhängig von der Motivgröße – dafür wird die Fläche 1:1
  // durchgereicht statt zusätzlich Marge draufzuschlagen).
  // Auf 0,035 €/cm² angepasst (0,06€ war zu hoch).
  // Gesenkt von 0,045€ auf 0,03€/cm² nach Marktvergleich (echte Preise
  // eines etablierten deutschen Anbieters, siehe Kalkulations-Historie) –
  // die Marge liegt jetzt weniger in der Fläche, dafür wird die Fläche bei
  // größeren Motiven/Stückzahlen steiler rabattiert (siehe QUANTITY_TIERS
  // in calculatePrice.ts), wie es am Markt üblich ist.
  // Auf 0,04 €/cm² erhöht (dafür Produkt-Grundpreis gesenkt, siehe products.ts).
  // Von 0,04 € auf 0,019 € gesenkt: die Pixel-zu-cm-Umrechnung wurde
  // korrigiert (nutzte vorher fälschlich die maximale Motivgröße statt
  // der echten Körperhöhe als Referenz) – dadurch werden Flächen jetzt
  // automatisch ~2x größer (und realistisch) berechnet. Satz entsprechend
  // gesenkt, um die Ausgangspreise ungefähr auf dem zuvor
  // marktkalibrierten Niveau zu halten.
  //
  // ABGELÖST (auf Wunsch des Betreibers) durch das Positionsstaffel-Modell
  // unten: der Preis richtet sich nicht mehr nach der Motivfläche, sondern
  // ausschließlich danach, wie viele Ansichten bedruckt werden. Deaktiviert
  // statt gelöscht.
  { id: 'dtf-area', ruleType: 'per_cm2', price: 0.019, label: 'Flächenpreis DTF (0,019 €/cm²)', isActive: false },

  // ── Positionsstaffel (aktuelles Modell) ──────────────────────────────
  // 9 € für die erste bedruckte Ansicht (Vorderseite, Rückseite oder Ärmel –
  // welche, ist egal), +5 € für jede weitere tatsächlich genutzte Ansicht.
  // Gilt je Stück, unabhängig von der Zahl oder Größe der Motive auf einer
  // Ansicht. Siehe lib/pricing/ruleEngine.ts (first_position/
  // additional_position) und lib/pricing/calculatePrice.ts
  // (getPositionTierRulePrices).
  { id: 'dtf-erste-position', ruleType: 'first_position', price: 9, label: 'Bedruckung – erste Ansicht', isActive: true },
  { id: 'dtf-zusatz-position', ruleType: 'additional_position', price: 5, label: 'Bedruckung – jede weitere Ansicht', isActive: true },
];

const EMBROIDERY_PRICING_RULES: PricingRule[] = [
  // Grundgebühr deaktiviert (auf Wunsch nicht mehr separat ausgewiesen) –
  // stattdessen in den Stichpreis eingerechnet.
  { id: 'emb-logo-base', ruleType: 'per_logo', price: 6.9, label: 'Stickerei-Digitalisierung', isActive: false },
  { id: 'emb-text-base', ruleType: 'per_text', price: 5.5, label: 'Schriftzug-Digitalisierung', isActive: false },

  // ── Einmalige Rüstkosten Stickerei – ebenfalls vorbereitet, aus ──────
  // Getrennte Regel je Veredelungsart: Dadurch sind „nur Stickerei",
  // „nur DTF" oder unterschiedliche Beträge je Verfahren allein über die
  // Konfiguration abbildbar.
  { id: 'emb-setup', ruleType: 'setup_fee', multiplier: 'per_position', price: 0, label: 'Digitalisierung & Einrichtung (einmalig je Position)', isActive: false },

  // ── Je-Ansicht-Aufschläge – ABGELÖST (2026-09-03) durch die Positionsstaffel
  // unten (dieselbe wie bei DTF). Deaktiviert statt gelöscht, damit die
  // vorherige Kalkulationsgrundlage im Code nachvollziehbar bleibt.
  { id: 'emb-pos-front', ruleType: 'per_position', printView: 'front', price: 0, label: 'Position: Brust', isActive: false },
  { id: 'emb-pos-back', ruleType: 'per_position', printView: 'back', price: 2.5, label: 'Position: Rücken', isActive: false },
  { id: 'emb-pos-sleeve-l', ruleType: 'per_position', printView: 'sleeve_left', price: 2, label: 'Position: Ärmel links', isActive: false },
  { id: 'emb-pos-sleeve-r', ruleType: 'per_position', printView: 'sleeve_right', price: 2, label: 'Position: Ärmel rechts', isActive: false },

  { id: 'emb-area', ruleType: 'per_cm2', price: 0.15, label: 'Flächenpreis Stickerei (0,15 €/cm²) – ersetzt durch Stichzahl-Preis', isActive: false },

  // ── Positionsstaffel (seit 2026-09-03 auch für Stickerei) ────────────
  // Betreiber-Entscheidung: Stickerei kostet dieselbe Positionsstaffel wie
  // DTF (DTF_POSITION_TIERS in calculatePrice.ts – 9 € erste Ansicht, 5 €
  // zweite, 4 € jede weitere, je Stückzahlstufe günstiger) PLUS den
  // Stichaufpreis unten. Vorher ERSETZTE der Stichpreis (1,40 €/1.000) die
  // Positionsstaffel vollständig – ein typisches 8×4-cm-Brustlogo (~6.400
  // Stiche) kostete bestickt praktisch dasselbe wie bedruckt (25,95 € statt
  // 25,99 €) und ab 5 Stück weniger; kleine Logos waren bestickt immer
  // günstiger. Der `price` hier ist wie bei DTF nur der Aktivierungswert –
  // die tatsächlichen Beträge je Stufe stehen in DTF_POSITION_TIERS.
  { id: 'emb-erste-position', ruleType: 'first_position', price: 9, label: 'Bestickung – erste Ansicht', isActive: true },
  { id: 'emb-zusatz-position', ruleType: 'additional_position', price: 5, label: 'Bestickung – jede weitere Ansicht', isActive: true },

  // Stichaufpreis ZUSÄTZLICH zur Positionsstaffel: 1,20 € je 1.000 geschätzte
  // Stiche (vorher 1,40 € als alleiniger Stickpreis). Der Mengenrabatt der
  // Staffel ist auf STICH_RABATT_MAX_PROZENT gedeckelt (siehe oben).
  {
    id: 'emb-stitches',
    ruleType: 'per_1000_stitches',
    price: STICH_AUFPREIS_JE_1000,
    maxDiscountPercent: STICH_RABATT_MAX_PROZENT,
    label: 'Stichaufpreis (1,20 € / 1.000 Stiche)',
    isActive: true,
  },
];

/** Asynchrone Signatur beibehalten (spätere DB-Anbindung = reiner
 *  Implementierungstausch), aber ohne die frühere künstliche 100ms-
 *  Wartezeit – sie verzögerte nur die erste Preisberechnung. */
export async function getPricingRules(printMethod: PrintMethod): Promise<PricingRule[]> {
  const source = printMethod === 'embroidery' ? EMBROIDERY_PRICING_RULES : DTF_PRICING_RULES;
  return source.filter((rule) => rule.isActive);
}
