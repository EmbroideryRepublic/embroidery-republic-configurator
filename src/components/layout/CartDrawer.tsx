'use client';

import { useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { X, Trash2, Pencil, ShoppingCart, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useCartStore, getCartTotal } from '@/stores/cartStore';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { getProduct } from '@/config/products';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import { submitOrder, submitInquiry } from '@/lib/actions/orders';
import { useSubmitGuard } from '@/lib/hooks/useSubmitGuard';
import { SHIPPING_COUNTRIES, SHIPPING_RATES, calculateShipping } from '@/config/shipping';
import type { CartItem } from '@/types';

interface CartDrawerProps {
  onClose: () => void;
}

type DrawerStep = 'cart' | 'checkout' | 'confirmed' | 'inquiry' | 'inquiry-sent';

export function CartDrawer({ onClose }: CartDrawerProps) {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clear);
  const loadCartItemForEditing = useConfiguratorStore((s) => s.loadCartItemForEditing);
  const router = useRouter();
  const pathname = usePathname();
  const [step, setStep] = useState<DrawerStep>('cart');
  const [orderNumber, setOrderNumber] = useState('');
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);

  const total = getCartTotal(items);

  function handleOrderPlaced(realOrderNumber: string) {
    setOrderNumber(realOrderNumber);
    clearCart();
    setStep('confirmed');
  }

  // "Bearbeiten": Design + Konfiguration aus dieser Warenkorb-Position
  // zurück in den Editor laden. Die Position wird aus dem Warenkorb
  // entfernt, damit sie nicht doppelt existiert – nach dem erneuten
  // Anpassen legt der Kunde sie über "In den Warenkorb" wieder ab.
  function handleEditItem(item: CartItem) {
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-brand/[0.08] px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-brand">
            {(step === 'checkout' || step === 'inquiry') && (
              <button type="button" onClick={() => setStep('cart')} className="rounded-md p-0.5 hover:bg-cream">
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
                    : `${t('cart_title')} ${items.length > 0 ? `(${items.length})` : ''}`}
          </h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-brand/40 hover:bg-cream">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'cart' && (
          <>
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
                              {color?.name ?? '–'} ·{' '}
                              {item.printMethod === 'embroidery' ? 'Stickerei' : 'DTF-Transferdruck'}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-brand/70">{sizeSummary || `${item.quantity}×`}</p>
                            <p className="text-xs text-brand/40">
                              {logoCount} Logo, {textCount} Text
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
                              title="Entfernen"
                              aria-label="Position entfernen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-brand/40">{item.quantity} Stück gesamt</span>
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
          <CheckoutForm items={items} total={total} formatPrice={formatPrice} onOrderPlaced={handleOrderPlaced} />
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
}

/**
 * Echtes Bestellformular (Adresse, Zahlungsart, AGB-Zustimmung) statt einer
 * reinen "Anfrage"-Vorschau.
 *
 * Zahlungsart: bis zur Stripe-Anbindung ausschließlich RECHNUNG. Karte und
 * PayPal sind bewusst ausgeblendet (nicht entfernt) – die paymentMethod-Union
 * und die serverseitige Verarbeitung bleiben erhalten, sodass sie sich später
 * ohne Umbau reaktivieren lassen. Es wird im Checkout nichts abgebucht; die
 * Rechnung folgt separat mit der Auftragsbearbeitung.
 */
function CheckoutForm({ items, total, formatPrice, onOrderPlaced }: CheckoutFormProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  // Bis zur Stripe-Anbindung ist Rechnung die einzige Zahlungsart. Die Union
  // ('card' | 'paypal' | 'invoice') und die serverseitige Verarbeitung in
  // submitOrder bleiben bewusst unverändert erhalten, damit Karte/PayPal
  // später ohne Umbau wieder aktiviert werden können – hier wird lediglich
  // fest 'invoice' übermittelt und die Auswahl-UI ausgeblendet.
  const paymentMethod = 'invoice' as const;
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

  // Versand aus Lieferland + Warenwert. Rein zur ANZEIGE – verbindlich ist
  // die identische Berechnung auf dem Server (serverPricing.ts).
  const shipping = calculateShipping(form.country, total);
  const grandTotal = total + (shipping?.cost ?? 0);

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim().includes('@') &&
    form.street.trim() &&
    form.zip.trim() &&
    form.city.trim() &&
    shipping !== null &&
    acceptedTerms;

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
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
        clientRequestId,
      })
    );
    // undefined = abgewiesen (läuft bereits) oder fehlgeschlagen; die Meldung
    // steht in dem Fall bereits im Hook.
    if (!result) return;

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
              onWert={(v) => update('firstName', v)} autoComplete="given-name" pflicht />
            <Feld id="nachname" label={t('checkout_last_name')} wert={form.lastName}
              onWert={(v) => update('lastName', v)} autoComplete="family-name" pflicht />
            <Feld id="firma" label={t('checkout_company')} wert={form.companyName}
              onWert={(v) => update('companyName', v)} autoComplete="organization" spalten />
            <Feld id="email" label={t('checkout_email')} wert={form.email}
              onWert={(v) => update('email', v)} autoComplete="email" type="email" pflicht spalten />
            <Feld id="telefon" label={t('checkout_phone')} wert={form.phone}
              onWert={(v) => update('phone', v)} autoComplete="tel" type="tel" spalten />
            <Feld id="strasse" label={t('checkout_street')} wert={form.street}
              onWert={(v) => update('street', v)} autoComplete="street-address" pflicht spalten />
            <Feld id="plz" label={t('checkout_zip')} wert={form.zip}
              onWert={(v) => update('zip', v)} autoComplete="postal-code" inputMode="numeric" pflicht />
            <Feld id="ort" label={t('checkout_city')} wert={form.city}
              onWert={(v) => update('city', v)} autoComplete="address-level2" pflicht />
            {/* Auswahl kommt aus config/shipping.ts – es sind ausschließlich
                Länder wählbar, für die ein Versandtarif hinterlegt ist. */}
            <div className="col-span-2">
              <label htmlFor="land" className="sr-only">{t('checkout_country')}</label>
              <select
                id="land"
                autoComplete="country-name"
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                className={FELD_KLASSE}
              >
                {SHIPPING_COUNTRIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/50">{t('checkout_payment_heading')}</h3>
          {/* Nur Rechnung bis Stripe live ist – Karte/PayPal bewusst
              ausgeblendet (nicht entfernt). Ein statischer, informativer
              Hinweis statt einer Auswahl mit nur einer Option. */}
          <div className="rounded-lg border border-gold bg-gold-light/30 px-3 py-2.5">
            <p className="text-sm font-medium text-brand">{t('checkout_payment_invoice')}</p>
            {/* Zentrales Kaufargument zuerst und hervorgehoben: keine Vorkasse. */}
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gold-dark">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              {t('checkout_no_prepay')}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-brand/60">{t('checkout_payment_invoice_note')}</p>
          </div>
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
            Ich akzeptiere die{' '}
            <a href="/agb" target="_blank" className="text-gold-dark hover:underline">
              AGB
            </a>{' '}
            und{' '}
            <a href="/datenschutz" target="_blank" className="text-gold-dark hover:underline">
              Datenschutzerklärung
            </a>
            . Personalisierte Produkte sind vom Widerruf ausgeschlossen.
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
            <div className="mt-2 flex items-center justify-between border-t border-gold/15 pt-1.5 text-sm font-semibold text-brand">
              <span>{t('inquiry_estimated_price')}</span>
              <span>{formatPrice(total)}</span>
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


/** Einheitliche Feldoptik – eine Stelle statt zwölf Wiederholungen. */
const FELD_KLASSE =
  'w-full rounded-lg border border-brand/20 px-2.5 py-1.5 text-sm text-brand transition-colors focus:border-gold focus:outline-none';

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
  id, label, wert, onWert, autoComplete, type = 'text', pflicht = false, inputMode, spalten,
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
}) {
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
        className={FELD_KLASSE}
      />
    </div>
  );
}
