/**
 * Adapter für textil-grosshandel.eu (Hastedt eCommerce GmbH, OXID eShop).
 *
 * Alle Selektoren aus VERIFIZIERTER Analyse der öffentlichen Shop-Seiten
 * (Juli 2026, Gildan Heavy Cotton G5000; kein Login zum Ansehen/Warenkorb).
 * Wie needen enthält der Adapter nur Selektor-Pläne; Interaktion +
 * Protokollierung leisten selectionEngine.ts und shopActions.ts.
 *
 * ── Farbe (per HEX, PRODUKTSPEZIFISCH) ─────────────────────────────────
 * Farbwahl über Bild-Swatch-Buttons `button.switch-to[data-key="<HEX>"]`
 * (data-key = Gildan-Hex, z.B. Navy=263147). Die Buttons tragen KEINEN
 * Namen; der ausgewählte Name erscheint erst nach Klick in
 * `#chosenColorName`, der Farbname steckt sonst nur im `alt` der
 * Galerie-Bilder (`div.swiper-slide[data-key=HEX] img` → "T-Shirts in
 * <Name>: …"). Label-basierte Auswahl ist daher NICHT möglich – die stabile
 * Kennung ist der Hex. Da der Hex je Marke/Produkt variiert, wird er NICHT
 * per-Lieferant, sondern als `variantId` je Produkt in
 * `mapping/tables/textilGrosshandel.ts` → productOverrides gepflegt. Ohne
 * gepflegten Hex schlägt die Farbwahl bewusst fehl (Fail-Fast).
 *
 * ── Größe/Menge (per LABEL) ────────────────────────────────────────────
 * Nach der Farbwahl zeigt die Mengen-Matrix genau EINE Zeile je Größe:
 *   <tr data-artnum="<varId>"><td class="cell-size">M</td> …
 *      <td class="cell-amount"><input name="aproducts[<varId>][am]"></td></tr>
 * Das Mengenfeld wird über das Größen-LABEL der Zeile adressiert – der
 * produktspezifische varId wird NICHT benötigt. TG nutzt „XXL"/„3XL" (wie
 * unsere internen Labels), keine Umbenennung nötig.
 *
 * ── Login ──────────────────────────────────────────────────────────────
 * Eigene Seite `/mein-konto/`: `#loginUser` + `#loginPwd`, Absenden
 * `#loginButton`. Erfolg = das Login-Formular (`#loginUser`) verschwindet.
 *
 * ── Warenkorb ──────────────────────────────────────────────────────────
 * Primärer Button `button[name="toBasket"]` (aktiviert sich nach
 * Mengeneingabe; `#toBasket`/kprgt führt dagegen NUR zur Warenkorb-Seite).
 * Erfolg = Mini-Warenkorb-Anzeige `#basketItemCountAndPrice`. Verifiziert:
 * Hinzufügen funktioniert auch als Gast.
 *
 * ── Offen ──────────────────────────────────────────────────────────────
 *  - Farb-Hex je Produkt: nur für gildan-heavy-t gepflegt (6 eindeutige
 *    Namenstreffer). Weitere Produkte/Marken brauchen ihre eigenen,
 *    verifizierten Hex-Werte (aus dem jeweiligen Produkt-DOM).
 *  - Mehrdeutige Farben (grey/charcoal/…) = Nutzerentscheidung, nicht raten.
 *  - checkout(): wie needen bewusst notImplemented (hinter Login, echte
 *    Bestellung; Standard-Modus 'prepare-cart').
 *  - B2B-Zugangsdaten SUPPLIER_TG_* (bestehendes Konto, kein Kontoanlegen).
 */
import { BaseSupplierAdapter } from './SupplierAdapter';
import type { ControlSelectionPlan } from './selectionEngine';
import type { AddToCartPlan, CartConfirmationPlan, LoginPlan } from './shopActions';
import type { SupplierId } from '../types';

const TG_COLOR_PLAN: ControlSelectionPlan = {
  control: 'Farbe',
  targets: {
    // Nur Hex (variantId) – die Swatches tragen keinen Namen, daher KEIN
    // label-Ziel: eine Farbe ohne gepflegten Hex ist nicht auswählbar.
    'variant-id': { kind: 'click', template: 'button.switch-to[data-key="{value}"]' },
  },
};

const TG_SIZE_PLAN: ControlSelectionPlan = {
  control: 'Größe',
  targets: {
    // {value} = Größen-Label; adressiert die Mengen-Zeile über den
    // Größen-Text und füllt das Mengenfeld (nach erfolgter Farbwahl genau 1).
    label: {
      kind: 'fill',
      template: 'tr:has(td.cell-size:text-is("{value}")) td.cell-amount input[name$="[am]"]',
    },
  },
};

const TG_LOGIN_PLAN: LoginPlan = {
  loginUrl: 'https://www.textil-grosshandel.eu/mein-konto/',
  usernameSelector: '#loginUser',
  passwordSelector: '#loginPwd',
  submitSelector: '#loginButton',
  successSelector: '#loginUser',
  successState: 'detached',
};

const TG_ADD_TO_CART_PLAN: AddToCartPlan = {
  submitSelector: 'button[name="toBasket"]',
  confirmationSelector: '#basketItemCountAndPrice',
};

/** Der Marker wurde in BEIDE Richtungen am realen Shop geprüft:
 *  befüllter Warenkorb → 1 Treffer, leerer (Gast-)Warenkorb → 0 Treffer. */
const TG_CART_CONFIRMATION_PLAN: CartConfirmationPlan = {
  url: 'https://www.textil-grosshandel.eu/warenkorb/',
  nonEmptySelector: '[id^="table_cartItem_"]',
};

export class TextilGrosshandelAdapter extends BaseSupplierAdapter {
  readonly supplierId: SupplierId = 'textil-grosshandel';
  protected override colorPlan = TG_COLOR_PLAN;
  protected override sizePlan = TG_SIZE_PLAN;
  protected override loginPlan = TG_LOGIN_PLAN;
  protected override addToCartPlan = TG_ADD_TO_CART_PLAN;
  protected override cartConfirmationPlan = TG_CART_CONFIRMATION_PLAN;
  // checkout() bleibt notImplemented (Basisklasse) – siehe Datei-Kopf.
}

// Für gezielte Tests der verifizierten Pläne exportiert.
export const TG_PLANS = {
  color: TG_COLOR_PLAN,
  size: TG_SIZE_PLAN,
  login: TG_LOGIN_PLAN,
  addToCart: TG_ADD_TO_CART_PLAN,
};
