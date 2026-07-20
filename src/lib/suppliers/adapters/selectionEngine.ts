/**
 * Auswahl-Engine der Browser-Automatisierung.
 *
 * Verbindet die (zentrale, lieferantenunabhängige) Auswahl-STRATEGIE aus der
 * Mapping-Schicht mit der (lieferantenspezifischen) DOM-INTERAKTION des
 * jeweiligen Shops. Die Adapter enthalten dadurch KEINE eigene
 * Übersetzungslogik mehr – sie liefern nur noch einen "SelectionPlan"
 * (welche stabile Kennung/welches Label über welchen CSS-Selektor
 * angesteuert wird), die Engine entscheidet und protokolliert.
 *
 * Strategie-Wahl = Schnittmenge aus dem, was die VARIANTE bietet
 * (variantId/selectValue/sku/label, siehe preferredVariantSelector) und
 * dem, was der SHOP-Plan unterstützt – in absteigender Stabilität:
 *   variant-id → select-value → sku → label
 * Stabile IDs werden also automatisch bevorzugt; das Label bleibt der
 * garantierte Fallback (sofern der Shop label-basierte Auswahl erlaubt).
 * Lässt sich keine Strategie anwenden, wirft die Engine (Fail-Fast) – der
 * Worker protokolliert den Schritt als fehlgeschlagen und überspringt die
 * Position, statt eine falsche Variante zu bestellen.
 */
import type { AutomationPage } from '../types';
import type { SupplierVariant } from '../mapping/types';
import { VARIANT_STRATEGY_ORDER, variantValueFor, type VariantSelectorStrategy } from '../mapping/selectors';

/** Wie im Shop mit dem Zielelement interagiert wird. `fill` schreibt einen
 *  Wert in ein Eingabefeld (Mengen-Matrix) – der Selektor wird wie bei
 *  click/check aus dem Template gebildet, das eigentliche Befüllen leistet
 *  {@link setSizeQuantity}. */
export type InteractionKind = 'click' | 'check' | 'select-option' | 'goto' | 'fill';

/**
 * Ein Shop-Ziel für EINE Strategie: der Selektor-/URL-Template mit dem
 * Platzhalter `{value}` (wird durch die stabile ID bzw. das Label ersetzt)
 * und die Art der Interaktion.
 *
 * Beispiele (aus realer Shop-Analyse):
 *   needen Farbe (Radio):  { kind: 'check', template: 'input.color-controller[data-color="{value}"]' }
 *   TG Farbe (Hex-Button): { kind: 'click', template: 'button.switch-to[data-key="{value}"]' }
 *   generisches Dropdown:  { kind: 'select-option', template: 'select#size' }
 */
export interface StrategyTarget {
  kind: InteractionKind;
  template: string;
}

/** Alle vom Shop unterstützten Strategien für EIN Bedienelement (Farbe
 *  oder Größe). Fehlt eine Strategie, kann die Engine sie nicht wählen. */
export interface ControlSelectionPlan {
  /** Menschlicher Name des Bedienelements für Logs, z.B. "Farbe". */
  control: string;
  targets: Partial<Record<VariantSelectorStrategy, StrategyTarget>>;
}

/** Ergebnis einer Auswahl – für Protokoll und Step-Result. */
export interface VariantSelectionResult {
  strategy: VariantSelectorStrategy;
  value: string;
  kind: InteractionKind;
  selector: string;
}

/** Escaped einen Wert für die Einbettung in einen doppelt gequoteten
 *  Attribut-Selektor (`[attr="…"]`). Shop-Werte sind simpel; wir sichern
 *  dennoch Backslash und Anführungszeichen ab. */
function escapeSelectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/**
 * Bestimmt (ohne Browser-Zugriff) die anzuwendende Strategie für eine
 * Variante auf einem Shop-Plan. Exportiert für Unit-Tests. Wirft, wenn
 * weder eine stabile Kennung noch ein Label anwendbar ist.
 */
export function resolveSelection(
  variant: SupplierVariant,
  plan: ControlSelectionPlan
): { strategy: VariantSelectorStrategy; value: string; target: StrategyTarget; selector: string } {
  for (const strategy of VARIANT_STRATEGY_ORDER) {
    const value = variantValueFor(variant, strategy);
    const target = plan.targets[strategy];
    if (value && target) {
      const selector =
        target.kind === 'goto' || target.kind === 'select-option'
          ? target.template // {value} steckt in URL bzw. wird an selectOption übergeben
          : target.template.replace('{value}', escapeSelectorValue(value));
      return { strategy, value, target, selector };
    }
  }
  throw new Error(
    `Keine anwendbare Auswahlstrategie für ${plan.control} "${variant.label}" – ` +
      `weder passende stabile Kennung noch label-basierte Auswahl im Shop-Plan vorhanden.`
  );
}

/**
 * Wählt eine Variante (Farbe) im Browser aus: löst die Strategie auf,
 * führt die Interaktion aus, protokolliert die tatsächlich genutzte
 * Methode und liefert sie zurück.
 */
export async function selectVariant(
  page: AutomationPage,
  variant: SupplierVariant,
  plan: ControlSelectionPlan,
  log: (message: string) => void
): Promise<VariantSelectionResult> {
  const { strategy, value, target, selector } = resolveSelection(variant, plan);

  switch (target.kind) {
    case 'click':
      try {
        await page.click(selector);
      } catch (err) {
        // Sichtbarkeits-Fallback: manche Steuerelemente (z.B. TG-Farb-Swatches
        // in einem Swiper-Karussell) fallen außerhalb des sichtbaren Fensters
        // auf 0×0 zusammen und gelten für Playwright als „nicht sichtbar",
        // obwohl der Button voll funktionsfähig ist. Dann direkt per JS klicken
        // (verifiziert: löst denselben Farbwechsel + Matrix-Update aus).
        if (!page.evaluate) throw err;
        const clicked = await page.evaluate((sel: string) => {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (!el) return false;
          el.scrollIntoView({ block: 'center' });
          el.click();
          return true;
        }, selector);
        if (!clicked) throw err;
        log(`[selection] ${plan.control}: Sichtbarkeits-Fallback – per JS geklickt ("${selector}")`);
      }
      break;
    case 'check':
      await page.check(selector);
      break;
    case 'select-option':
      await page.selectOption(selector, value);
      break;
    case 'goto':
      await page.goto(target.template.replace('{value}', value));
      break;
    case 'fill':
      // 'fill' beschreibt ein Mengenfeld; die Farb-/Varianten-Auswahl nutzt
      // es nicht. Bewusst Fail-Fast, falls ein Plan es hier fehleinsetzt.
      throw new Error(
        `Interaktion 'fill' ist für die Varianten-Auswahl (${plan.control}) ungültig – ` +
          `sie gehört in den Größen-/Mengen-Plan (setSizeQuantity).`
      );
  }

  log(`[selection] ${plan.control} via ${strategy}="${value}" → ${target.kind} "${selector}"`);
  return { strategy, value, kind: target.kind, selector };
}

/**
 * Trägt für eine Größe die Menge ein: lokalisiert das Mengen-Eingabefeld
 * über den Größen-Plan (bevorzugt stabile Kennung, sonst Label) und füllt
 * die Menge. Protokolliert die genutzte Lokalisierungs-Methode.
 */
export async function setSizeQuantity(
  page: AutomationPage,
  sizeVariant: SupplierVariant,
  plan: ControlSelectionPlan,
  quantity: number,
  log: (message: string) => void
): Promise<VariantSelectionResult> {
  const { strategy, value, target, selector } = resolveSelection(sizeVariant, plan);
  await page.fill(selector, String(quantity));
  await commitFieldValue(page, selector);
  log(`[selection] ${plan.control} via ${strategy}="${value}" → fill "${selector}" = ${quantity}`);
  return { strategy, value, kind: target.kind, selector };
}

/**
 * Bestätigt den eingetragenen Wert mit einem ECHTEN, wertneutralen Tastendruck.
 *
 * Hintergrund (am realen Shop gemessen, nicht angenommen): `page.fill()` setzt
 * den Feldwert direkt und erzeugt dabei KEINE Tastatur-Ereignisse.
 * textil-grosshandel schaltet seine Schaltfläche „In den Warenkorb" aber genau
 * darauf frei. Messung auf der Produktseite F272:
 *
 *   nach fill(S=12)            → toBasket disabled = true
 *   nach press(feld, 'End')    → toBasket disabled = false   (Feldwert bleibt 12)
 *
 * „End" ist bewusst gewählt: es setzt den Cursor ans Zeilenende und verändert
 * den Wert nicht, löst aber keydown/keyup aus. Nie fatal – ein Shop, der keine
 * Tastatur-Ereignisse braucht, bleibt davon unberührt.
 */
async function commitFieldValue(page: AutomationPage, selector: string): Promise<void> {
  if (!page.press) return;
  try {
    await page.press(selector, 'End');
  } catch {
    /* nie fatal */
  }
}
