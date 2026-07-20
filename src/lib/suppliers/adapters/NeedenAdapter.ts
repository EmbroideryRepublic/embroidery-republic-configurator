/**
 * Adapter für needen.de (Wordans-Plattform).
 *
 * Alle Selektoren stammen aus VERIFIZIERTER Analyse der öffentlichen
 * needen-Seiten (Juli 2026, Produkte GN182 / GN647 / GN960 – identische
 * Struktur, kein Login zum Ansehen nötig). Der Adapter enthält bewusst nur
 * Selektor-Pläne; die Interaktion leisten die gemeinsamen Engines
 * (selectionEngine.ts, shopActions.ts).
 *
 * ── Farbe ──────────────────────────────────────────────────────────────
 * Das eigentliche Radio `input.color-controller` ist `display:none`; sichtbar
 * und klickbar ist der Swatch als LABEL:
 *   <label class="tag shop-color" for="farbe_2305" title="Navy"
 *          data-url="navy" style="background-color:#31394c">
 * Der `title` entspricht exakt dem Farb-NAMEN (`data-color` des Radios) und ist
 * je Produktseite eindeutig – deshalb label-basierte Auswahl über `title`.
 * Verifiziert: Klick auf das Label selektiert das zugehörige Radio.
 * `data-color-id` (im `for="farbe_<id>"`) ist PRODUKTSPEZIFISCH (Navy=2305 bei
 * GN182, =345 bei GN960) und wird daher nicht als variantId gepflegt; der
 * variant-id-Selektor zielt dennoch – korrekt – auf dasselbe sichtbare Label.
 *
 * ── Größe/Menge ────────────────────────────────────────────────────────
 * Mengen-Matrix je Größe als Tabellenzeile:
 *   <tr class="size-class-2XL"><th class="size-fixed">2XL</th> …
 *      <input name="qty[<sizeId>]" class="product-quantity" …></tr>
 * Die Zeilen-Klasse trägt das Größen-LABEL exakt (S/M/L/XL/2XL/3XL). Der
 * Selektor `tr.size-class-<Label> input.product-quantity` trifft VERIFIZIERT
 * genau EIN (nicht-Bulk) Mengenfeld der aktiven Farbe. `<sizeId>` ist
 * produktspezifisch und wird deshalb NICHT gepflegt – das Label genügt.
 * Wichtig: needen nutzt „2XL"/„3XL" statt „XXL" → siehe Mapping-Tabelle.
 *
 * ── Login ──────────────────────────────────────────────────────────────
 * Über das Header-Modal jeder Seite (`a[href="#signinModal"]` lädt das
 * Formular per AJAX): `#user_login` + `#user_password`, Absenden
 * `button#submit`, Formular postet an `/sign_in`.
 *
 * ── Warenkorb ──────────────────────────────────────────────────────────
 * Primärer (nicht-Bulk) Button `input.add-to-cart-submit`, aktiviert sich nach
 * Mengeneingabe; Erfolg = aktualisierter Warenkorb-Zähler `a.cart-qty`.
 * Verifiziert: Hinzufügen funktioniert auch als Gast (Login ordnet den Korb nur
 * dem B2B-Konto zu).
 *
 * ── Offen (bewusst nicht implementiert) ────────────────────────────────
 *  - checkout(): Warenkorb-Review/Kasse liegen HINTER dem Login und lösen eine
 *    echte, kostenpflichtige B2B-Bestellung aus – DOM ohne Zugangsdaten nicht
 *    verifizierbar, echte Bestellung nicht Teil der Verifikation. Bleibt
 *    notImplemented (Fail-Fast); der Standard-Modus ist ohnehin 'prepare-cart'.
 *  - Login-Erfolgssignal (Login-Trigger verschwindet) ist die einzige
 *    Annahme, die ohne echte Zugangsdaten nicht direkt beobachtet werden konnte.
 */
import { BaseSupplierAdapter } from './SupplierAdapter';
import type { ControlSelectionPlan } from './selectionEngine';
import type { AddToCartPlan, LoginPlan } from './shopActions';
import type { SupplierId } from '../types';

const NEEDEN_COLOR_PLAN: ControlSelectionPlan = {
  control: 'Farbe',
  targets: {
    // Beide Strategien klicken das SICHTBARE Label (nie das display:none-Radio).
    'variant-id': { kind: 'click', template: 'label.shop-color[for="farbe_{value}"]' },
    label: { kind: 'click', template: 'label.shop-color[title="{value}"]' },
  },
};

const NEEDEN_SIZE_PLAN: ControlSelectionPlan = {
  control: 'Größe',
  targets: {
    // {value} = Größen-Label (S/M/L/XL/2XL/…); trifft genau das Mengenfeld
    // der aktiven Farbe. setSizeQuantity() füllt die Menge ein.
    label: { kind: 'fill', template: 'tr.size-class-{value} input.product-quantity' },
  },
};

const NEEDEN_LOGIN_PLAN: LoginPlan = {
  // loginUrl bewusst offen → nutzt ctx.baseUrl (Header-Modal auf jeder Seite).
  openTrigger: 'a[href="#signinModal"]',
  usernameSelector: '#signinModal #user_login',
  passwordSelector: '#signinModal #user_password',
  submitSelector: '#signinModal button#submit',
  // Erfolg: der Login-Trigger im Header wird nach der Anmeldung ausgeblendet.
  successSelector: 'a[href="#signinModal"]',
  successState: 'detached',
};

const NEEDEN_ADD_TO_CART_PLAN: AddToCartPlan = {
  // Nicht-Bulk-Button der Einzelfarb-Matrix (Bulk-Buttons ausgeschlossen).
  submitSelector: 'input.add-to-cart-submit:not(.bulk-add-to-cart-submit)',
  confirmationSelector: 'a.cart-qty',
};

export class NeedenAdapter extends BaseSupplierAdapter {
  readonly supplierId: SupplierId = 'needen';
  protected override colorPlan = NEEDEN_COLOR_PLAN;
  protected override sizePlan = NEEDEN_SIZE_PLAN;
  protected override loginPlan = NEEDEN_LOGIN_PLAN;
  protected override addToCartPlan = NEEDEN_ADD_TO_CART_PLAN;
  // checkout() bleibt bewusst der notImplemented-Basisimplementierung
  // überlassen (siehe Datei-Kopf: hinter Login, echte Bestellung).
}

