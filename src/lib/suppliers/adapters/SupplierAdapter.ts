/**
 * Gemeinsames Adapter-Interface der Supplier Engine + abstrakte Basisklasse.
 *
 * JEDER Lieferant bekommt genau einen Adapter (TextilGrosshandelAdapter,
 * NeedenAdapter, …), der dieses Interface implementiert. Der Playwright-
 * Worker (worker/supplierWorker.ts) kennt AUSSCHLIESSLICH dieses Interface.
 *
 * WICHTIG – keine eigene Übersetzungslogik im Adapter: Die Umwandlung
 * interner Werte → Lieferantenbezeichnungen/-kennungen leistet allein die
 * Mapping-Schicht; der Worker übergibt bereits aufgelöste
 * {@link SupplierVariant}-Deskriptoren. Der Adapter liefert nur noch
 * SHOP-SPEZIFISCHE Auswahlpläne (welcher CSS-Selektor je Strategie), die
 * gemeinsame {@link selectVariant}/{@link setSizeQuantity}-Engine
 * entscheidet daraus (bevorzugt stabile ID, Fallback Label) und
 * protokolliert die genutzte Methode.
 *
 * Fehlt der verifizierte Auswahlplan eines Shops, bleibt die jeweilige
 * Methode bewusst `notImplemented` (Fail-Fast statt geratener Selektoren).
 */
import {
  NotImplementedError,
  type SupplierAutomationContext,
  type SupplierId,
  type SupplierOrderPosition,
} from '../types';
import type { SupplierVariant } from '../mapping/types';
import {
  selectVariant,
  setSizeQuantity,
  type ControlSelectionPlan,
  type VariantSelectionResult,
} from './selectionEngine';
import {
  confirmCart,
  dismissConsent,
  performAddToCart,
  performLogin,
  type AddToCartPlan,
  type CartConfirmationPlan,
  type LoginPlan,
} from './shopActions';

export interface SupplierAdapter {
  readonly supplierId: SupplierId;

  /** Meldet sich mit den Konto-Zugangsdaten beim Lieferanten-Shop an.
   *  Wird pro Job genau EINMAL aufgerufen (vor der ersten Position). */
  login(ctx: SupplierAutomationContext): Promise<void>;

  /** Öffnet die Produkt-Detailseite DIREKT über position.productUrl. */
  openProduct(ctx: SupplierAutomationContext, position: SupplierOrderPosition): Promise<void>;

  /** Wählt die Farbvariante über die zentrale Auswahl-Engine (bevorzugt
   *  stabile Kennung, Fallback Label) und liefert die tatsächlich genutzte
   *  Methode zurück (für das Schrittprotokoll). */
  selectColor(
    ctx: SupplierAutomationContext,
    position: SupplierOrderPosition,
    colorVariant: SupplierVariant
  ): Promise<VariantSelectionResult | void>;

  /** Trägt für EINE Größe die Menge ein und liefert die genutzte
   *  Lokalisierungs-Methode zurück. */
  setQuantity(
    ctx: SupplierAutomationContext,
    size: string,
    quantity: number,
    sizeVariant: SupplierVariant
  ): Promise<VariantSelectionResult | void>;

  /** Legt die aktuell konfigurierte Position in den Warenkorb. */
  addToCart(ctx: SupplierAutomationContext): Promise<void>;

  /** Ruft am Ende des Jobs (nach ALLEN Positionen) die Warenkorb-Seite auf und
   *  belegt, dass die Positionen dort wirklich liegen. Ohne diesen Schritt
   *  kann der Warenkorb mit der Browser-Sitzung verloren gehen, obwohl jeder
   *  addToCart erfolgreich gemeldet wurde – real bei textil-grosshandel
   *  aufgetreten. */
  confirmCart(ctx: SupplierAutomationContext): Promise<void>;

  /** Führt den Checkout aus. Läuft NUR im Modus 'checkout'. */
  checkout(ctx: SupplierAutomationContext): Promise<void>;
}

/**
 * Basisklasse mit dem gemeinsamen Verhalten. Konkrete Adapter setzen die
 * verifizierten Auswahlpläne (colorPlan/sizePlan) aus der realen
 * Shop-Analyse; solange ein Plan fehlt, liefert die Basisklasse ein
 * sauberes, protokollierbares "noch nicht implementiert".
 */
export abstract class BaseSupplierAdapter implements SupplierAdapter {
  abstract readonly supplierId: SupplierId;

  /** Shop-Auswahlplan für die FARB-Variante (aus verifizierter Analyse). */
  protected colorPlan?: ControlSelectionPlan;
  /** Shop-Auswahlplan für die GRÖSSEN-/Mengenauswahl. */
  protected sizePlan?: ControlSelectionPlan;
  /** Verifizierter Anmelde-Ablauf des Shops (Selektoren). */
  protected loginPlan?: LoginPlan;
  /** Verifizierter In-den-Warenkorb-Ablauf des Shops (Selektoren). */
  protected addToCartPlan?: AddToCartPlan;
  /** Verifizierter Nachweis, dass der Warenkorb beim Konto liegt. */
  protected cartConfirmationPlan?: CartConfirmationPlan;

  protected notImplemented(method: string): never {
    throw new NotImplementedError(`${this.constructor.name}.${method}()`);
  }

  async login(ctx: SupplierAutomationContext): Promise<void> {
    const plan = this.loginPlan;
    if (!plan) {
      ctx.log(`[${this.supplierId}] login als ${ctx.credentials.username} – kein verifizierter Login-Plan`);
      this.notImplemented('login');
    }
    await performLogin(ctx.page, ctx.credentials, plan, ctx.log, plan.loginUrl ?? ctx.baseUrl);
  }

  async openProduct(ctx: SupplierAutomationContext, position: SupplierOrderPosition): Promise<void> {
    ctx.log(`[${this.supplierId}] openProduct ${position.articleNumber} → ${position.productUrl}`);
    await ctx.page.goto(position.productUrl);
    // Consent-Overlay auch auf der Produktseite verwerfen (falls beim Login nur
    // per DOM-Entfernung ohne Cookie erledigt) – sonst blockiert es Farb-/
    // Mengen-/Warenkorb-Klicks.
    await dismissConsent(ctx.page, ctx.log);
  }

  async selectColor(
    ctx: SupplierAutomationContext,
    position: SupplierOrderPosition,
    colorVariant: SupplierVariant
  ): Promise<VariantSelectionResult | void> {
    const plan = this.colorPlan;
    if (!plan) {
      ctx.log(`[${this.supplierId}] selectColor ${position.colorId} – kein verifizierter Farb-Auswahlplan`);
      this.notImplemented('selectColor');
    }
    return selectVariant(ctx.page, colorVariant, plan, ctx.log);
  }

  async setQuantity(
    ctx: SupplierAutomationContext,
    size: string,
    quantity: number,
    sizeVariant: SupplierVariant
  ): Promise<VariantSelectionResult | void> {
    const plan = this.sizePlan;
    if (!plan) {
      ctx.log(`[${this.supplierId}] setQuantity ${size} × ${quantity} – kein verifizierter Größen-Auswahlplan`);
      this.notImplemented('setQuantity');
    }
    return setSizeQuantity(ctx.page, sizeVariant, plan, quantity, ctx.log);
  }

  async addToCart(ctx: SupplierAutomationContext): Promise<void> {
    const plan = this.addToCartPlan;
    if (!plan) {
      ctx.log(`[${this.supplierId}] addToCart – kein verifizierter Warenkorb-Plan`);
      this.notImplemented('addToCart');
    }
    await performAddToCart(ctx.page, plan, ctx.log);
  }

  async confirmCart(ctx: SupplierAutomationContext): Promise<void> {
    const plan = this.cartConfirmationPlan;
    if (!plan) {
      // Bewusst notImplemented statt stillem Überspringen: ohne diesen Schritt
      // ist NICHT belegt, dass der Warenkorb den Lauf überlebt – und genau das
      // ist die Zusage des Modus 'prepare-cart'.
      ctx.log(`[${this.supplierId}] confirmCart – kein verifizierter Warenkorb-Nachweis hinterlegt`);
      this.notImplemented('confirmCart');
    }
    await confirmCart(ctx.page, plan, ctx.log);
  }

  async checkout(ctx: SupplierAutomationContext): Promise<void> {
    ctx.log(`[${this.supplierId}] checkout`);
    this.notImplemented('checkout');
  }
}
