import type { PricingRule, PrintMethod } from '@/types';

/**
 * MOCK-Preisregeln – getrennt nach Veredelungsart. Gleiche Architektur wie
 * `printAreas.ts`: eine asynchrone Loader-Funktion mit der Signatur einer
 * künftigen Supabase-Abfrage. Der Preisrechner (`calculatePrice.ts`) kennt
 * nur `PricingRule[]`, nicht die Datenquelle oder Veredelungsart selbst –
 * dadurch funktioniert exakt derselbe Rechenkern für beide Konfiguratoren.
 *
 * DTF: Preis richtet sich vor allem nach Fläche und Position.
 * Stickerei: höhere Grundkosten durch Digitalisierung (einmalige
 * Einrichtung des Stickmusters), danach vor allem Flächen-/Stichzahl-
 * getrieben – bei kleinen Logos oft teurer als DTF, bei sehr großen
 * Flächen unwirtschaftlich (deshalb auch kleinere Druckbereiche, siehe
 * printAreas.ts).
 */
const DTF_PRICING_RULES: PricingRule[] = [
  // Grundgebühren deaktiviert (auf Wunsch nicht mehr separat ausgewiesen)
  // – stattdessen in den Flächenpreis eingerechnet (0,02 € → 0,05 €/cm²).
  // Deaktiviert statt gelöscht, damit die vorherige Kalkulationsgrundlage
  // im Code nachvollziehbar bleibt.
  { id: 'dtf-logo-base', ruleType: 'per_logo', price: 4.5, label: 'DTF-Transfer (Basis)', isActive: false },
  { id: 'dtf-text-base', ruleType: 'per_text', price: 3.5, label: 'Text-Transfer (Basis)', isActive: false },

  { id: 'dtf-pos-front', ruleType: 'per_position', printView: 'front', price: 0, label: 'Position: Brust', isActive: true },
  { id: 'dtf-pos-back', ruleType: 'per_position', printView: 'back', price: 2, label: 'Position: Rücken', isActive: true },
  { id: 'dtf-pos-sleeve-l', ruleType: 'per_position', printView: 'sleeve_left', price: 1.5, label: 'Position: Ärmel links', isActive: true },
  { id: 'dtf-pos-sleeve-r', ruleType: 'per_position', printView: 'sleeve_right', price: 1.5, label: 'Position: Ärmel rechts', isActive: true },

  // Reiner Materialdurchschlag der DTF-Folie (kein Aufschlag – die Marge
  // liegt komplett im Produkt-Grundpreis, siehe products.ts). Berechnet
  // aus echten Folienpreisen: 297×420mm (A3) für 7,49€ = 0,006 €/cm².
  // Kalibriert auf Basis eines T-Shirts mit 4,90€ Blankokosten, 1€
  // Verpackung, 5,50€ Versand (÷5 wegen Mindestbestellmenge 5 = 1,10€/
  // Shirt), 1,4 Min. Arbeitszeit bei 20€/h sowie 5€ Zielgewinn pro Shirt
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
  // marktkalibrierten Niveau zu halten. Bitte an echten Beispielen prüfen.
  { id: 'dtf-area', ruleType: 'per_cm2', price: 0.019, label: 'Flächenpreis DTF (0,019 €/cm²)', isActive: true },
];

const EMBROIDERY_PRICING_RULES: PricingRule[] = [
  // Grundgebühr deaktiviert (auf Wunsch nicht mehr separat ausgewiesen) –
  // stattdessen in den Stichpreis eingerechnet.
  { id: 'emb-logo-base', ruleType: 'per_logo', price: 6.9, label: 'Stickerei-Digitalisierung', isActive: false },
  { id: 'emb-text-base', ruleType: 'per_text', price: 5.5, label: 'Schriftzug-Digitalisierung', isActive: false },

  { id: 'emb-pos-front', ruleType: 'per_position', printView: 'front', price: 0, label: 'Position: Brust', isActive: true },
  { id: 'emb-pos-back', ruleType: 'per_position', printView: 'back', price: 2.5, label: 'Position: Rücken', isActive: true },
  { id: 'emb-pos-sleeve-l', ruleType: 'per_position', printView: 'sleeve_left', price: 2, label: 'Position: Ärmel links', isActive: true },
  { id: 'emb-pos-sleeve-r', ruleType: 'per_position', printView: 'sleeve_right', price: 2, label: 'Position: Ärmel rechts', isActive: true },

  { id: 'emb-area', ruleType: 'per_cm2', price: 0.15, label: 'Flächenpreis Stickerei (0,15 €/cm²) – ersetzt durch Stichzahl-Preis', isActive: false },

  // Erhöht von 1,25 € auf 1,40 € pro 1.000 Stiche, um die entfallene
  // Digitalisierungs-Grundgebühr aufzufangen. Bitte an eure echte
  // Kalkulation anpassen, das ist nur ein plausibler Ausgangswert.
  { id: 'emb-stitches', ruleType: 'per_1000_stitches', price: 1.4, label: 'Stichpreis (1,40 € / 1.000 Stiche)', isActive: true },
];

export async function getPricingRules(printMethod: PrintMethod): Promise<PricingRule[]> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const source = printMethod === 'embroidery' ? EMBROIDERY_PRICING_RULES : DTF_PRICING_RULES;
  return source.filter((rule) => rule.isActive);
}
