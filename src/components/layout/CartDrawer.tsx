'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Trash2, Pencil, ShoppingCart, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Receipt, CreditCard, Wallet } from 'lucide-react';
import { useCartStore, getCartTotal, getCartItemCount } from '@/stores/cartStore';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { getProduct } from '@/config/products';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import { submitOrder, submitInquiry, istPaypalVerfuegbar } from '@/lib/actions/orders';
import { ladeCheckoutVorbelegung } from '@/lib/actions/konto';
import { useSubmitGuard } from '@/lib/hooks/useSubmitGuard';
import { SHIPPING_RATES, calculateShipping, landCodeForCountry } from '@/config/shipping';
import { steuersatzFuer, steueranteil, STANDARDLAND } from '@/config/pricing/steuer';
import { istPlausibleEmail, istGueltigePlz } from '@/lib/orders/orderValidation';
import { FELD_KLASSE } from '@/lib/ui/feldKlasse';
import { formatiereFarbname } from '@/lib/products/farben';
import type { OrderPaymentMethod } from '@/lib/actions/orderTypes';
import type { CartItem } from '@/types';

interface CartDrawerProps {
  onClose: () => void;
  /** true = die Schublade wurde soeben durch ein erfolgreiches "In den
   *  Warenkorb" geöffnet – zeigt oben eine kurze Bestätigung, damit der
   *  Erfolg nicht nur am Badge-Zähler in der Kopfzeile ablesbar ist. */
  geradeHinzugefuegt?: boolean;
}

type DrawerStep = 'cart' | 'checkout' | 'confirmed' | 'inquiry' | 'inquiry-sent';

export function CartDrawer({ onClose, geradeHinzugefuegt = false }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clear);
  const loadCartItemForEditing = useConfiguratorStore((s) => s.loadCartItemForEditing);
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<DrawerStep>('cart');
  const [orderNumber, setOrderNumber] = useState('');
  // Von CheckoutForm gemeldet: eine laufende Bestellübermittlung darf nicht
  // durch den Zurück-Button unterbrochen werden (siehe handleSubmit dort).
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Fokusmanagement für den modalen Dialog: beim Öffnen den Fokus in die
  // Schublade setzen, beim Schliessen (Unmount) auf das auslösende Element
  // zurückgeben – ohne das verliert Tastatur-/Screenreader-Nutzung den Kontext.
  useEffect(() => {
    const zuvorFokussiertesElement = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      zuvorFokussiertesElement?.focus();
    };
  }, []);

  // Escape schliesst die Schublade wie jeden modalen Dialog. Tab wird als
  // echte Tastatur-Fokus-Falle behandelt: ohne sie verlässt Tab am letzten
  // bzw. Shift+Tab am ersten fokussierbaren Element die Schublade und landet
  // im dahinterliegenden, unsichtbar unter dem Overlay liegenden Seiteninhalt
  // (Footer-Links, Konfigurator-Elemente) – live reproduziert.
  useEffect(() => {
    function fokussierbareElemente(): HTMLElement[] {
      const container = dialogRef.current;
      if (!container) return [];
      return Array.from(
        container.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const elemente = fokussierbareElemente();
      if (elemente.length === 0) return;
      const erstes = elemente[0]!;
      const letztes = elemente[elemente.length - 1]!;
      const aktiv = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        // Shift+Tab am ersten Element (oder mit Fokus noch auf dem
        // Dialog-Container selbst, direkt nach dem Öffnen) → zum letzten.
        if (aktiv === erstes || !aktiv || !elemente.includes(aktiv)) {
          e.preventDefault();
          letztes.focus();
        }
      } else if (aktiv === letztes) {
        e.preventDefault();
        erstes.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const total = getCartTotal(items);
  // Dieselbe Zahl wie das Header-Badge (SiteHeader), damit am selben
  // Warenkorb nicht zwei unterschiedliche Zahlen auftauchen.
  const positionCount = getCartItemCount(items);

  function handleOrderPlaced(realOrderNumber: string) {
    setOrderNumber(realOrderNumber);
    clearCart();
    setStep('confirmed');
  }

  // "Bearbeiten": Design + Konfiguration aus dieser Warenkorb-Position
  // zurück in den Editor laden. Die Position wird aus dem Warenkorb
  // entfernt, damit sie nicht doppelt existiert – nach dem erneuten
  // Anpassen legt der Kunde sie über "In den Warenkorb" wieder ab.
  //
  // Liegt im Konfigurator bereits ein ungespeichertes Design (platzierte
  // Elemente), würde loadCartItemForEditing es samt Undo-Historie
  // stillschweigend überschreiben. Ein einfacher Bestätigungsdialog genügt
  // hier – es geht nicht um einen komplexen Workflow, nur um eine bewusste
  // Entscheidung statt eines stillen Datenverlusts.
  function handleEditItem(item: CartItem) {
    const bestehendeElemente = useConfiguratorStore.getState().elements;
    if (bestehendeElemente.length > 0) {
      const bestaetigt = window.confirm(
        'Im Konfigurator liegt bereits ein ungespeichertes Design vor. Beim Laden dieser Warenkorb-Position geht es verloren. Fortfahren?'
      );
      if (!bestaetigt) return;
    }
    loadCartItemForEditing({
      printMethod: item.printMethod,
      productId: item.productId,
      colorId: item.colorId,
      sizeQuantities: item.sizeQuantities,
      elements: item.elements,
    });
    removeItem(item.id);
    onClose();
    // Aus dem GLOBALEN Warenkorb (Shop-Seiten) muss zum Konfigurator gewechselt
    // werden, damit das geladene Design auch sichtbar bearbeitet werden kann.
    // Im Konfigurator selbst ist man bereits dort – kein Wechsel nötig.
    if (!pathname?.startsWith('/konfigurator')) router.push('/konfigurator');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={t('cart_title')}
      ref={dialogRef}
      tabIndex={-1}
      onClick={onClose}
    >
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand/[0.08] px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-brand">
            {(step === 'checkout' || step === 'inquiry') && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                aria-label="Zurück"
                disabled={step === 'checkout' && checkoutSubmitting}
                className="rounded-md p-0.5 hover:bg-cream disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <ShoppingCart className="h-4 w-4" />
            {step === 'checkout'
              ? t('cart_checkout_title')
              : step === 'confirmed'
                ? t('cart_order_confirmed_title')
                : step === 'inquiry'
                  ? t('cart_inquiry_title')
                  : step === 'inquiry-sent'
                    ? t('cart_inquiry_sent_title')
                    : `${t('cart_title')} ${positionCount > 0 ? `(${positionCount})` : ''}`}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common_close')}
            className="rounded-md p-1 text-brand/40 hover:bg-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'cart' && (
          <>
            {geradeHinzugefuegt && (
              <div className="flex items-center justify-between gap-3 border-b border-green-100 bg-green-50 px-4 py-2.5">
                <p className="flex items-center gap-2 text-[13px] font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden />
                  {t('cart_added_banner')}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-shrink-0 whitespace-nowrap text-[12px] font-medium text-green-700 underline-offset-2 hover:underline"
                >
                  {t('cart_continue_shopping')}
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <p className="mt-8 text-center text-sm text-brand/40">{t('cart_empty')}</p>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => {
                    const product = getProduct(item.productId);
                    const color = product?.colors.find((c) => c.id === item.colorId);
                    const logoCount = item.elements.filter((el) => el.type === 'logo').length;
                    const textCount = item.elements.filter((el) => el.type === 'text').length;
                    const sizeSummary = Object.entries(item.sizeQuantities ?? {})
                      .map(([size, qty]) => `${qty}× ${size}`)
                      .join(', ');

                    return (
                      <li key={item.id} className="rounded-lg border border-brand/[0.08] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-brand">{product?.name ?? 'Produkt'}</p>
                            <p className="text-xs text-brand/60">
                              {color ? formatiereFarbname(color.name) : '–'} ·{' '}
                              {item.printMethod === 'embroidery' ? t('method_embroidery') : t('method_dtf')}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-brand/70">{sizeSummary || `${item.quantity}×`}</p>
                            <p className="text-xs text-brand/40">
                              {t('cart_item_summary', {
                                logoCount,
                                logoWord: t(logoCount === 1 ? 'cart_logo_singular' : 'cart_logo_plural'),
                                textCount,
                                textWord: t(textCount === 1 ? 'cart_text_singular' : 'cart_text_plural'),
                              })}
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleEditItem(item)}
                              className="rounded-md p-1 text-brand/30 transition-colors hover:bg-gold-light hover:text-gold-dark"
                              title={t('cart_edit_item')}
                              aria-label={t('cart_edit_item')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-md p-1 text-brand/30 transition-colors hover:bg-red-50 hover:text-red-500"
                              title={t('cart_remove_item')}
                              aria-label={t('cart_remove_item')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-brand/40">
                            {item.quantity} {t('size_table_total')}
                          </span>
                          <span className="text-sm font-medium">{formatPrice(item.totalPrice)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-brand/[0.08] px-4 py-3">
                <div className="mb-3 flex items-center justify-between text-base font-semibold">
                  <span>{t('cart_total')}</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <p className="mb-3 text-xs text-brand/60">
                  {/* Vor der Länderwahl gilt der DE-Tarif als Orientierung;
                      verbindlich wird der Versand im Checkout berechnet. */}
                  {total >= SHIPPING_RATES.DE.freeFrom
                    ? t('cart_free_shipping')
                    : t('cart_shipping_remaining', {
                        amount: formatPrice(SHIPPING_RATES.DE.freeFrom - total),
                      })}{' '}
                  {t('cart_no_returns')}
                </p>
                <button
                  type="button"
                  onClick={() => setStep('checkout')}
                  className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark"
                >
                  {t('cart_go_checkout')}
                </button>

                <div className="mt-4 rounded-lg bg-cream/60 p-3 text-center">
                  <p className="text-xs leading-relaxed text-brand/60">
                    {t('cart_unsure_hint')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setStep('inquiry')}
                    className="mt-1.5 text-xs font-semibold text-gold-dark underline decoration-gold/40 underline-offset-2 hover:text-gold"
                  >
                    {t('cart_inquiry_link')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {step === 'checkout' && (
          <CheckoutForm
            items={items}
            total={total}
            formatPrice={formatPrice}
            onOrderPlaced={handleOrderPlaced}
            onSubmittingChange={setCheckoutSubmitting}
          />
        )}

        {step === 'inquiry' && (
          <InquiryForm items={items} total={total} formatPrice={formatPrice} onSent={() => setStep('inquiry-sent')} />
        )}

        {step === 'confirmed' && <OrderConfirmed orderNumber={orderNumber} onClose={onClose} />}
        {step === 'inquiry-sent' && <InquirySent onClose={onClose} />}
      </div>
    </div>
  );
}

interface CheckoutFormProps {
  items: CartItem[];
  total: number;
  formatPrice: (amount: number) => string;
  onOrderPlaced: (orderNumber: string) => void;
  /** Meldet isSubmitting an die übergeordnete Schublade, damit der
   *  Zurück-Button im Header während der Übermittlung deaktiviert werden
   *  kann (siehe dortiger Kommentar). */
  onSubmittingChange: (submitting: boolean) => void;
}

/**
 * Echtes Bestellformular (Adresse, Zahlungsart, AGB-Zustimmung) statt einer
 * reinen "Anfrage"-Vorschau.
 *
 * Zahlungsart: Rechnung, Karte (Stripe) oder PayPal, echte Auswahl. Bei Karte
 * oder PayPal eröffnet der Server nach dem Speichern der Bestellung einen
 * Bezahlvorgang beim gewählten Anbieter (lib/orders/paymentService.ts) und
 * liefert eine `checkoutUrl` zurück – handleSubmit leitet dorthin per
 * Full-Page-Redirect weiter, STATT die Erfolgsmeldung hier im Drawer zu
 * zeigen. Ob die Bestellung als bezahlt gilt, entscheidet ausschließlich der
 * Zahlungs-Webhook (paymentService.ts) – niemals dieser Redirect selbst.
 */
function CheckoutForm({ items, total, formatPrice, onOrderPlaced, onSubmittingChange }: CheckoutFormProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('invoice');
  // Standardmäßig verborgen (fail-safe), bis der Server bestätigt, dass
  // PayPal produktiv einsatzbereit ist (istPaypalVerfuegbar spiegelt
  // payments/registry.ts) – niemals eine Sandbox-Zahlung anbieten, nur weil
  // die Prüfung noch nicht zurück ist.
  const [zahlungsoptionVerfuegbar, setZahlungsoptionVerfuegbar] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // Mehrfachklick, Zeitüberschreitung und Verbindungsabbruch liegen gebündelt
  // im Hook (lib/hooks/useSubmitGuard.ts) – nicht in jedem Formular erneut.
  const {
    isSubmitting,
    error: submitError,
    setError: setSubmitError,
    submit,
    reset: resetSubmitGuard,
  } = useSubmitGuard(
    {
      timeout: t('submit_timeout_error'),
      offline: t('submit_offline_error'),
      fallback: t('checkout_submit_error_fallback'),
    },
    // Eigener Schlüssel je Vorgangsart: eine Bestellung darf nie als
    // Wiederholung einer vorangegangenen Anfrage gelten.
    'er-absendung-bestellung'
  );

  // isSubmitting an die Schublade weiterreichen, damit deren Zurück-Button
  // während der Übermittlung deaktiviert werden kann.
  useEffect(() => {
    onSubmittingChange(isSubmitting);
  }, [isSubmitting, onSubmittingChange]);

  // Unmount-Guard nach demselben Muster wie bei der Checkout-Vorbelegung
  // unten: Wird dieses Formular während einer laufenden Übermittlung
  // trotzdem entfernt (Schließen der Schublade per X/Escape/Klick auf das
  // Overlay – der Zurück-Button allein deckt das nicht ab), darf das
  // spät eintreffende Ergebnis nicht mehr onOrderPlaced() aufrufen: das
  // würde auf der bereits verlassenen, inzwischen ggf. veränderten
  // Elternkomponente den Warenkorb leeren und den Schritt wechseln.
  const abgebrochenRef = useRef(false);
  useEffect(() => {
    return () => {
      abgebrochenRef.current = true;
    };
  }, []);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    street: '',
    zip: '',
    city: '',
    country: 'Deutschland',
  });

  // Vorbelegung für angemeldete Kund:innen aus der Standardadresse des
  // Kundenkontos (lib/actions/konto.ts, ladeCheckoutVorbelegung) – reine
  // Bequemlichkeit, ändert nichts an der verbindlichen Serverberechnung.
  // Läuft genau einmal beim Öffnen dieses Schritts; ein Gast ohne Sitzung
  // bekommt `null` zurück und das Formular bleibt unverändert leer. Kein
  // Überschreiben laufender Eingaben nötig – das Formular ist an dieser
  // Stelle immer frisch (CheckoutForm mountet neu, sobald der Schritt
  // wieder auf 'checkout' wechselt).
  useEffect(() => {
    let abgebrochen = false;
    ladeCheckoutVorbelegung().then((vorbelegung) => {
      if (!vorbelegung || abgebrochen) return;
      setForm((f) => ({
        ...f,
        firstName: f.firstName || vorbelegung.firstName,
        lastName: f.lastName || vorbelegung.lastName,
        companyName: f.companyName || vorbelegung.companyName,
        email: f.email || vorbelegung.email,
        phone: f.phone || vorbelegung.phone,
        street: f.street || vorbelegung.street,
        zip: f.zip || vorbelegung.zip,
        city: f.city || vorbelegung.city,
      }));
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  // Ob die PayPal-Kachel angezeigt werden darf – siehe Kommentar oben am
  // State für diese Zahlungsoption. Läuft einmal beim Öffnen des Formulars,
  // exakt wie die Checkout-Vorbelegung oben.
  useEffect(() => {
    let abgebrochen = false;
    istPaypalVerfuegbar().then((verfuegbar) => {
      if (!abgebrochen) setZahlungsoptionVerfuegbar(verfuegbar);
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  // Versand aus Lieferland + Warenwert. Rein zur ANZEIGE – verbindlich ist
  // die identische Berechnung auf dem Server (serverPricing.ts).
  const shipping = calculateShipping(form.country, total);
  const grandTotal = total + (shipping?.cost ?? 0);

  // Enthaltene Umsatzsteuer – rein zur ANZEIGE, dieselbe Auflösung
  // (Land → Code → Satz) wie serverseitig in orderStage.ts/serverPricing.ts.
  // Da die Preise brutto sind (pricesIncludeTax), wird sie nur ausgewiesen,
  // nicht aufgeschlagen.
  const landCode = landCodeForCountry(form.country) ?? STANDARDLAND;
  const taxRate = steuersatzFuer(landCode).satz;
  // Zentrale Funktion statt eigener Inline-Formel (config/pricing/steuer.ts) –
  // dieselbe Rundung wie überall sonst im Projekt.
  const taxAmount = steueranteil(grandTotal, landCode);

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    istPlausibleEmail(form.email) &&
    form.street.trim() &&
    istGueltigePlz(form.zip) &&
    form.city.trim() &&
    shipping !== null &&
    acceptedTerms;

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Für die Fehleranzeige pro Pflichtfeld: erst nach Berühren (onBlur) sichtbar
  // (siehe Feld-Komponente unten). Ohne das bekäme ein Tastatur-/Screenreader-
  // Nutzer nie mitgeteilt, WARUM der Absenden-Button deaktiviert bleibt – der
  // Button fällt dabei aus der Tab-Reihenfolge, eine reine Client-Validierung
  // löst sonst keine Ansage aus.
  const [beruehrteFelder, setBeruehrteFelder] = useState<Partial<Record<keyof typeof form, boolean>>>({});
  function beruehren(feld: keyof typeof form) {
    setBeruehrteFelder((b) => ({ ...b, [feld]: true }));
  }

  function feldFehler(feld: keyof typeof form): string | undefined {
    if (!beruehrteFelder[feld]) return undefined;
    switch (feld) {
      case 'firstName':
        return form.firstName.trim() ? undefined : t('checkout_error_first_name');
      case 'lastName':
        return form.lastName.trim() ? undefined : t('checkout_error_last_name');
      case 'email':
        if (!form.email.trim()) return t('checkout_error_email_required');
        return istPlausibleEmail(form.email) ? undefined : t('checkout_error_email_invalid');
      case 'street':
        return form.street.trim() ? undefined : t('checkout_error_street');
      case 'zip':
        if (!form.zip.trim()) return t('checkout_error_zip_required');
        return istGueltigePlz(form.zip) ? undefined : t('checkout_error_zip_invalid');
      case 'city':
        return form.city.trim() ? undefined : t('checkout_error_city');
      default:
        return undefined;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    // `submit` lässt nur einen Vorgang gleichzeitig zu und reicht dieselbe
    // Absendekennung an jede Wiederholung weiter – daraus entsteht auf dem
    // Server niemals eine zweite Bestellung.
    const result = await submit((clientRequestId) =>
      submitOrder({
        items,
        contact: {
          firstName: form.firstName,
          lastName: form.lastName,
          companyName: form.companyName,
          email: form.email,
          phone: form.phone,
        },
        shipping: { street: form.street, zip: form.zip, city: form.city, country: form.country },
        paymentMethod,
        acceptedTerms,
        clientRequestId,
      })
    );

    // Die Schublade wurde während der Übermittlung geschlossen (X/Escape/
    // Overlay-Klick) – die Elternkomponente ist ggf. nicht mehr in diesem
    // Zustand. Weder Erfolg noch Fehler dürfen jetzt noch auf sie wirken.
    if (abgebrochenRef.current) return;

    // undefined = abgewiesen (läuft bereits) oder fehlgeschlagen; die Meldung
    // steht in dem Fall bereits im Hook.
    if (!result) return;

    if (result.success && result.checkoutUrl) {
      // Karte/PayPal: die Bestellung existiert bereits (payment_status
      // 'pending'), der Bezahlvorgang beim Anbieter wurde eröffnet. Kein
      // resetSubmitGuard() davor – die Seite wird ohnehin verlassen; bricht
      // der Redirect selbst ab (z.B. Browser-Zurück), schützt die weiterhin
      // gespeicherte clientRequestId gegen eine zweite Bestellung bei einem
      // erneuten Versuch. Keine Erfolgsmeldung hier: Bezahlt ist die
      // Bestellung erst nach dem Webhook, nicht durch diesen Redirect.
      window.location.href = result.checkoutUrl;
      return;
    }

    if (result.success && result.orderNumber) {
      resetSubmitGuard();
      onOrderPlaced(result.orderNumber);
    } else {
      // Fachliche Ablehnung vom Server (ungültige Größe, blockierter Preis …):
      // Der Server liefert bereits einen verständlichen Satz.
      setSubmitError(result.error ?? t('checkout_submit_error_fallback'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 px-4 py-3">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/50">{t('checkout_contact_heading')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <Feld id="vorname" label={t('checkout_first_name')} wert={form.firstName}
              onWert={(v) => update('firstName', v)} autoComplete="given-name" pflicht
              fehler={feldFehler('firstName')} onBeruehrt={() => beruehren('firstName')} />
            <Feld id="nachname" label={t('checkout_last_name')} wert={form.lastName}
              onWert={(v) => update('lastName', v)} autoComplete="family-name" pflicht
              fehler={feldFehler('lastName')} onBeruehrt={() => beruehren('lastName')} />
            <Feld id="firma" label={t('checkout_company')} wert={form.companyName}
              onWert={(v) => update('companyName', v)} autoComplete="organization" spalten />
            <Feld id="email" label={t('checkout_email')} wert={form.email}
              onWert={(v) => update('email', v)} autoComplete="email" type="email" pflicht spalten
              fehler={feldFehler('email')} onBeruehrt={() => beruehren('email')} />
            <Feld id="telefon" label={t('checkout_phone')} wert={form.phone}
              onWert={(v) => update('phone', v)} autoComplete="tel" type="tel" spalten />
            <Feld id="strasse" label={t('checkout_street')} wert={form.street}
              onWert={(v) => update('street', v)} autoComplete="street-address" pflicht spalten
              fehler={feldFehler('street')} onBeruehrt={() => beruehren('street')} />
            <Feld id="plz" label={t('checkout_zip')} wert={form.zip}
              onWert={(v) => update('zip', v)} autoComplete="postal-code" inputMode="numeric" pflicht
              fehler={feldFehler('zip')} onBeruehrt={() => beruehren('zip')} />
            <Feld id="ort" label={t('checkout_city')} wert={form.city}
              onWert={(v) => update('city', v)} autoComplete="address-level2" pflicht
              fehler={feldFehler('city')} onBeruehrt={() => beruehren('city')} />
            {/* Land kommt aus config/shipping.ts – aktuell ausschließlich
                Deutschland (siehe Entscheidung 2026-08-06 dort). Solange nur
                ein Land lieferbar ist, ein statischer Hinweis statt einer
                Auswahl mit nur einer Option – derselbe Grundsatz wie bei der
                Zahlungsart unten. `form.country` bleibt technisch bestehen
                (submitOrder erwartet es), ist hier nur nicht mehr editierbar. */}
            <div className="col-span-2 rounded-lg border border-brand/10 bg-cream/50 px-3 py-2.5">
              <p className="text-sm font-medium text-brand">{form.country}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-brand/60">{t('checkout_country_notice')}</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/50">{t('checkout_payment_heading')}</h3>
          {/* Echte Auswahl: Rechnung, Karte (Stripe) oder PayPal. Bei Karte/
              PayPal übernimmt der Server nach dem Speichern der Bestellung
              die Weiterleitung zum jeweiligen gehosteten Checkout – hier wird
              nur die Absicht der Kundschaft festgehalten, abgebucht wird
              nichts im Drawer selbst. */}
          <div className="grid grid-cols-3 gap-1.5">
            {(['invoice', 'card', 'paypal'] as const)
              .filter((methode) => methode !== 'paypal' || zahlungsoptionVerfuegbar)
              .map((methode) => {
              const Icon = methode === 'invoice' ? Receipt : methode === 'card' ? CreditCard : Wallet;
              const ausgewaehlt = paymentMethod === methode;
              return (
                <button
                  key={methode}
                  type="button"
                  onClick={() => setPaymentMethod(methode)}
                  aria-pressed={ausgewaehlt}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-center transition-colors ${
                    ausgewaehlt ? 'border-gold bg-gold-light/30' : 'border-brand/10 hover:border-brand/20'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${ausgewaehlt ? 'text-gold-dark' : 'text-brand/50'}`} aria-hidden />
                  <span className={`text-xs font-medium ${ausgewaehlt ? 'text-brand' : 'text-brand/70'}`}>
                    {t(
                      methode === 'invoice'
                        ? 'checkout_payment_invoice'
                        : methode === 'card'
                          ? 'checkout_payment_card'
                          : 'checkout_payment_paypal'
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {paymentMethod === 'invoice' ? (
            <div className="mt-2 rounded-lg border border-gold bg-gold-light/30 px-3 py-2.5">
              {/* Zentrales Kaufargument zuerst und hervorgehoben: keine Vorkasse. */}
              <p className="flex items-center gap-1.5 text-xs font-medium text-gold-dark">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                {t('checkout_no_prepay')}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-brand/60">{t('checkout_payment_invoice_note')}</p>
            </div>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-brand/60">{t('checkout_payment_redirect_note')}</p>
          )}
        </section>

        <section className="rounded-lg bg-cream/70 p-3 text-sm">
          <div className="mb-2 space-y-1 text-xs text-brand/60">
            {items.map((item) => {
              const product = getProduct(item.productId);
              return (
                <div key={item.id} className="flex items-center justify-between">
                  <span>
                    {product?.name} ({item.quantity}×)
                  </span>
                  <span>{formatPrice(item.totalPrice)}</span>
                </div>
              );
            })}
          </div>
          {/* Versand transparent ausweisen: Zwischensumme, Versandkosten (mit
              Hinweis auf die Freigrenze) und erst dann die Endsumme. */}
          <div className="flex items-center justify-between border-t border-gold/15 pt-1.5 text-xs text-brand/60">
            <span>{t('checkout_subtotal')}</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-brand/60">
            <span>{t('checkout_shipping')}</span>
            <span>
              {shipping
                ? shipping.isFree
                  ? t('checkout_shipping_free')
                  : formatPrice(shipping.cost)
                : '—'}
            </span>
          </div>
          {shipping && !shipping.isFree && (
            <p className="mt-1 text-[11px] text-gold-dark">
              {t('checkout_shipping_hint', { amount: formatPrice(shipping.amountUntilFree) })}
            </p>
          )}
          {/* Steuerzeile: bei Bruttopreisen (pricesIncludeTax) nur AUSGEWIESEN,
              verändert die Summe nicht – exakt dieselbe Semantik wie
              orderStage.ts. Pflicht gegenüber Verbrauchern (Preisangabenverordnung). */}
          <div className="mt-1 flex items-center justify-between text-xs text-brand/60">
            <span>{t('checkout_tax_line', { rate: taxRate })}</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-gold/15 pt-1.5 text-base font-semibold text-brand">
            <span>{t('checkout_grand_total')}</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </section>

        <label className="flex items-start gap-2 text-xs text-brand/60">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded-md border-brand/30 accent-gold"
          />
          <span>
            {t('checkout_terms_prefix')}{' '}
            <a href="/agb" target="_blank" className="text-gold-dark hover:underline">
              {t('checkout_terms_agb_link')}
            </a>{' '}
            {t('checkout_terms_and')}{' '}
            <a href="/datenschutz" target="_blank" className="text-gold-dark hover:underline">
              {t('checkout_terms_privacy_link')}
            </a>
            . {t('checkout_terms_no_withdrawal')}
          </span>
        </label>
      </div>

      <div className="border-t border-brand/[0.08] px-4 py-3">
        {submitError && (
          <div role="alert" className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
        {/* Dezente Vertrauenszeile am Entscheidungspunkt – aus den bestehenden
            zweisprachigen Trust-Schlüsseln, damit sie in DE wie EN stimmt. */}
        <p className="mb-2.5 text-center text-[11px] leading-relaxed text-brand/45">
          {t('trust_check')} · {t('trust_germany')} · {t('trust_express')}
        </p>
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-medium text-white shadow-elegant transition-all duration-200 ease-out hover:bg-gold-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('checkout_processing')}
            </>
          ) : (
            `${t('checkout_submit')} · ${formatPrice(grandTotal)}`
          )}
        </button>
        {/* Dezente Sicherheitszusage direkt unter dem Absenden – nimmt die
            letzte Unsicherheit, ohne Badge-Lärm. */}
        <p className="mt-2 text-center text-[11px] text-brand/40">{t('checkout_secure_note')}</p>
      </div>
    </form>
  );
}

interface InquiryFormProps {
  items: CartItem[];
  total: number;
  formatPrice: (amount: number) => string;
  onSent: () => void;
}

/**
 * Unverbindliche Anfrage – bewusst schlanker als der Kaufprozess: keine
 * Lieferadresse, keine Zahlungsart, keine AGB-Zustimmung nötig, da noch
 * nichts verbindlich bestellt wird. Für Kund:innen, die vor einer
 * größeren Bestellung noch Fragen klären oder sich einfach noch nicht
 * sicher sind.
 */
function InquiryForm({ items, total, formatPrice, onSent }: InquiryFormProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  // Gleiche Absicherung wie im Bestellformular (siehe useSubmitGuard).
  const {
    isSubmitting,
    error: submitError,
    setError: setSubmitError,
    submit,
    reset: resetSubmitGuard,
  } = useSubmitGuard(
    {
      timeout: t('submit_timeout_error'),
      offline: t('submit_offline_error'),
      fallback: t('inquiry_submit_error_fallback'),
    },
    'er-absendung-anfrage'
  );
  const [form, setForm] = useState({ name: '', companyName: '', email: '', phone: '', message: '' });

  // Dieselbe Vorbelegung wie im Bestellformular (siehe dortiger Kommentar) –
  // hier nur auf das schlankere Anfrageformular gemappt (ein einzelnes
  // `name`-Feld statt firstName/lastName getrennt).
  useEffect(() => {
    let abgebrochen = false;
    ladeCheckoutVorbelegung().then((vorbelegung) => {
      if (!vorbelegung || abgebrochen) return;
      const vollerName = `${vorbelegung.firstName} ${vorbelegung.lastName}`.trim();
      setForm((f) => ({
        ...f,
        name: f.name || vollerName,
        companyName: f.companyName || vorbelegung.companyName,
        email: f.email || vorbelegung.email,
        phone: f.phone || vorbelegung.phone,
      }));
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  const isValid = form.name.trim() && form.email.trim().includes('@');

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const result = await submit((clientRequestId) =>
      submitInquiry({
        items,
        contact: { name: form.name, companyName: form.companyName, email: form.email, phone: form.phone },
        message: form.message,
        clientRequestId,
      })
    );
    if (!result) return;

    if (result.success) {
      resetSubmitGuard();
      onSent();
    } else {
      setSubmitError(result.error ?? t('inquiry_submit_error_fallback'));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 px-4 py-3">
        <p className="rounded-lg bg-cream/70 p-3 text-xs leading-relaxed text-brand/70">
          {t('inquiry_intro')}
        </p>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/50">{t('inquiry_contact_heading')}</h3>
          <div className="space-y-2">
            <Feld id="a-name" label={t('inquiry_name')} wert={form.name}
              onWert={(v) => update('name', v)} autoComplete="name" pflicht />
            <Feld id="a-firma" label={t('checkout_company')} wert={form.companyName}
              onWert={(v) => update('companyName', v)} autoComplete="organization" />
            <Feld id="a-email" label={t('checkout_email')} wert={form.email}
              onWert={(v) => update('email', v)} autoComplete="email" type="email" pflicht />
            <Feld id="a-telefon" label={t('checkout_phone')} wert={form.phone}
              onWert={(v) => update('phone', v)} autoComplete="tel" type="tel" />
            <div>
              <label htmlFor="a-nachricht" className="sr-only">{t('inquiry_message_placeholder')}</label>
              <textarea
                id="a-nachricht"
                placeholder={t('inquiry_message_placeholder')}
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                rows={4}
                className={`${FELD_KLASSE} resize-y`}
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-cream/70 p-3 text-sm">
          <p className="mb-2 text-xs font-medium text-brand/60">{t('inquiry_config_heading')}</p>
          <div className="space-y-1 text-xs text-brand/60">
            {items.length === 0 ? (
              <p className="text-brand/40">{t('inquiry_config_empty')}</p>
            ) : (
              items.map((item) => {
                const product = getProduct(item.productId);
                return (
                  <div key={item.id} className="flex items-center justify-between">
                    <span>
                      {product?.name} ({item.quantity}×)
                    </span>
                    <span>{formatPrice(item.totalPrice)}</span>
                  </div>
                );
              })
            )}
          </div>
          {items.length > 0 && (
            <div className="mt-2 border-t border-gold/15 pt-1.5">
              <div className="flex items-center justify-between text-sm font-semibold text-brand">
                <span>{t('inquiry_estimated_price')}</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-brand/40">
                {t('checkout_tax_line', { rate: steuersatzFuer(STANDARDLAND).satz })}
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="border-t border-brand/[0.08] px-4 py-3">
        {submitError && (
          <div role="alert" className="mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-gold py-2.5 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('inquiry_sending')}
            </>
          ) : (
            t('inquiry_submit')
          )}
        </button>
      </div>
    </form>
  );
}

function InquirySent({ onClose }: { onClose: () => void }) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <CheckCircle2 className="h-12 w-12 text-gold-dark" />
      <h3 className="text-lg font-semibold text-brand">{t('cart_inquiry_sent_title')}</h3>
      <p className="max-w-xs text-sm text-brand/60">
        {t('inquiry_sent_text')}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40"
      >
        {t('common_close')}
      </button>
    </div>
  );
}

function OrderConfirmed({ orderNumber, onClose }: { orderNumber: string; onClose: () => void }) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <CheckCircle2 className="h-12 w-12 text-green-600" />
      <h3 className="text-lg font-semibold text-brand">{t('cart_order_confirmed_title')}</h3>
      <p className="text-sm text-brand/60">
        {t('checkout_order_number_label')} <span className="font-medium text-brand">{orderNumber}</span>
      </p>
      <p className="max-w-xs text-xs text-brand/40">
        {t('checkout_order_confirmed_text')}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40"
      >
        {t('common_close')}
      </button>
    </div>
  );
}


/**
 * Ein Eingabefeld in Warenkorb und Anfrage.
 *
 * Bündelt drei Dinge, die zuvor an JEDEM Feld einzeln fehlten:
 *  • eine echte Beschriftung (visuell versteckt) – ein Platzhalter ist keine
 *    Beschriftung: Vorlesehilfen brauchen sie, und beim Tippen verschwindet er;
 *  • `autoComplete`, damit Browser Name und Anschrift ausfüllen können – im
 *    Checkout ein spürbarer Unterschied für die Abschlussquote;
 *  • die einheitliche Optik samt sichtbarem Fokus.
 */
function Feld({
  id, label, wert, onWert, autoComplete, type = 'text', pflicht = false, inputMode, spalten, fehler, onBeruehrt,
}: {
  id: string;
  label: string;
  wert: string;
  onWert: (wert: string) => void;
  autoComplete: string;
  type?: 'text' | 'email' | 'tel';
  pflicht?: boolean;
  inputMode?: 'numeric' | 'tel' | 'email' | 'text';
  spalten?: boolean;
  /**
   * Sichtbare Fehlermeldung für dieses Feld – vom Elternformular erst nach
   * Berühren (onBeruehrt) geliefert, damit niemand vor der ersten Eingabe
   * mit einer Fehlermeldung begrüßt wird. Bei Client-seitiger Validierung
   * bleibt sonst ein deaktivierter Absenden-Button die einzige Rückmeldung –
   * für Tastatur-/Screenreader-Nutzung unsichtbar, da der Button dann aus
   * der Tab-Reihenfolge fällt.
   */
  fehler?: string;
  /** Meldet dem Elternformular, dass dieses Feld einmal verlassen wurde. */
  onBeruehrt?: () => void;
}) {
  const fehlerId = fehler ? `${id}-fehler` : undefined;
  return (
    <div className={spalten ? 'col-span-2' : undefined}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        required={pflicht}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={label}
        value={wert}
        onChange={(e) => onWert(e.target.value)}
        onBlur={onBeruehrt}
        aria-invalid={fehler ? true : undefined}
        aria-describedby={fehlerId}
        className={FELD_KLASSE}
      />
      {fehler && (
        // role="alert" statt einer gemeinsamen aria-live-Region: einfacher und
        // hier ausreichend, da jede Meldung genau ein Feld betrifft und beim
        // Erscheinen (nicht beim erneuten Rendern desselben Texts) angesagt wird.
        <p id={fehlerId} role="alert" className="mt-1 text-[11px] text-red-600">
          {fehler}
        </p>
      )}
    </div>
  );
}
