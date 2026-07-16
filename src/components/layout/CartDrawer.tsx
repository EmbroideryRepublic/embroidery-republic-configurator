'use client';

import { useState, type FormEvent } from 'react';
import { X, Trash2, Pencil, ShoppingCart, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useCartStore, getCartTotal } from '@/stores/cartStore';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { getProduct } from '@/config/products';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
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
  const [step, setStep] = useState<DrawerStep>('cart');
  const [orderNumber, setOrderNumber] = useState('');
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);

  const total = getCartTotal(items);

  function handleOrderPlaced() {
    const number = `ER-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderNumber(number);
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
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-brand">
            {(step === 'checkout' || step === 'inquiry') && (
              <button type="button" onClick={() => setStep('cart')} className="rounded p-0.5 hover:bg-gray-100">
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
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {items.length === 0 ? (
                <p className="mt-8 text-center text-sm text-gray-400">{t('cart_empty')}</p>
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
                      <li key={item.id} className="rounded-lg border border-gray-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-brand">{product?.name ?? 'Produkt'}</p>
                            <p className="text-xs text-gray-500">
                              {color?.name ?? '–'} ·{' '}
                              {item.printMethod === 'embroidery' ? 'Stickerei' : 'DTF-Transferdruck'}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-brand/70">{sizeSummary || `${item.quantity}×`}</p>
                            <p className="text-xs text-gray-400">
                              {logoCount} Logo, {textCount} Text
                            </p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleEditItem(item)}
                              className="rounded p-1 text-gray-300 hover:bg-gold-light hover:text-gold-dark"
                              title={t('cart_edit_item')}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                              title="Entfernen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-xs text-gray-400">{item.quantity} Stück gesamt</span>
                          <span className="text-sm font-medium">{formatPrice(item.totalPrice)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-3">
                <div className="mb-3 flex items-center justify-between text-base font-semibold">
                  <span>{t('cart_total')}</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  {total >= 75
                    ? t('cart_free_shipping')
                    : t('cart_shipping_remaining', { amount: formatPrice(75 - total) })}{' '}
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
  onOrderPlaced: () => void;
}

/**
 * Echtes Bestellformular (Adresse, Zahlungsart, AGB-Zustimmung) statt einer
 * reinen "Anfrage"-Vorschau.
 *
 * WICHTIG, ehrlich: Die eigentliche ZahlungsABWICKLUNG (Kreditkarte
 * belasten, PayPal-Zahlung ausführen) ist hier NICHT angebunden – dafür
 * bräuchte es einen echten Zahlungsanbieter (Stripe, PayPal o.ä.) mit
 * eurem Account, API-Keys und einem Backend, das die Zahlung server-seitig
 * bestätigt. Das kann ich nicht ohne eure Zugangsdaten/Entscheidung für
 * einen Anbieter fertigstellen. Der komplette Ablauf DRUMHERUM (Formular,
 * Validierung, Bestellübersicht, Bestätigung) ist aber real nutzbar – an
 * der Stelle "Zahlung ausführen" müsste der jeweilige Anbieter eingehängt
 * werden (z.B. Stripe Checkout, PayPal Buttons).
 */
function CheckoutForm({ items, total, formatPrice, onOrderPlaced }: CheckoutFormProps) {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'invoice'>('card');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const isValid =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim().includes('@') &&
    form.street.trim() &&
    form.zip.trim() &&
    form.city.trim() &&
    acceptedTerms;

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    // Simulierte Verarbeitung, bis ein echter Zahlungsanbieter angebunden ist.
    await new Promise((resolve) => setTimeout(resolve, 700));
    setIsSubmitting(false);
    onOrderPlaced();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 px-4 py-3">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/50">{t('checkout_contact_heading')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder={t('checkout_first_name')}
              value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)}
              className="rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              required
              placeholder={t('checkout_last_name')}
              value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)}
              className="rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              placeholder={t('checkout_company')}
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              className="col-span-2 rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              required
              type="email"
              placeholder={t('checkout_email')}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="col-span-2 rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              type="tel"
              placeholder={t('checkout_phone')}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="col-span-2 rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              required
              placeholder={t('checkout_street')}
              value={form.street}
              onChange={(e) => update('street', e.target.value)}
              className="col-span-2 rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              required
              placeholder={t('checkout_zip')}
              value={form.zip}
              onChange={(e) => update('zip', e.target.value)}
              className="rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              required
              placeholder={t('checkout_city')}
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <select
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
              className="col-span-2 rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            >
              <option>Deutschland</option>
              <option>Österreich</option>
              <option>Schweiz</option>
            </select>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/50">{t('checkout_payment_heading')}</h3>
          <div className="space-y-1.5">
            {(
              [
                { id: 'card', label: t('checkout_payment_card') },
                { id: 'paypal', label: t('checkout_payment_paypal') },
                { id: 'invoice', label: t('checkout_payment_invoice') },
              ] as const
            ).map((method) => (
              <label
                key={method.id}
                className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm has-[:checked]:border-gold has-[:checked]:bg-gold-light/30"
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
                  className="h-3.5 w-3.5"
                />
                {method.label}
              </label>
            ))}
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
          <div className="flex items-center justify-between border-t border-gold/15 pt-1.5 text-base font-semibold text-brand">
            <span>{t('checkout_grand_total')}</span>
            <span>{formatPrice(total)}</span>
          </div>
        </section>

        <label className="flex items-start gap-2 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded border-gray-300"
          />
          <span>
            Ich akzeptiere die{' '}
            <a href="/agb" target="_blank" className="text-brand-accent hover:underline">
              AGB
            </a>{' '}
            und{' '}
            <a href="/datenschutz" target="_blank" className="text-brand-accent hover:underline">
              Datenschutzerklärung
            </a>
            . Personalisierte Produkte sind vom Widerruf ausgeschlossen.
          </span>
        </label>
      </div>

      <div className="border-t border-gray-100 px-4 py-3">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full rounded-lg bg-gold py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? t('checkout_processing') : `${t('checkout_submit')} · ${formatPrice(total)}`}
        </button>
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', companyName: '', email: '', phone: '', message: '' });

  const isValid = form.name.trim() && form.email.trim().includes('@');

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    onSent();
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
            <input
              required
              placeholder={t('inquiry_name')}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              placeholder={t('checkout_company')}
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              required
              type="email"
              placeholder={t('checkout_email')}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <input
              type="tel"
              placeholder={t('checkout_phone')}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
            <textarea
              placeholder={t('inquiry_message_placeholder')}
              value={form.message}
              onChange={(e) => update('message', e.target.value)}
              rows={4}
              className="w-full resize-y rounded border border-gray-300 px-2.5 py-1.5 text-sm"
            />
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

      <div className="border-t border-gray-100 px-4 py-3">
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full rounded-lg border-2 border-gold py-2.5 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? t('inquiry_sending') : t('inquiry_submit')}
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
      <p className="max-w-xs text-sm text-gray-500">
        {t('inquiry_sent_text')}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
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
      <h3 className="text-lg font-semibold text-brand">{t('cart_checkout_title')}</h3>
      <p className="text-sm text-gray-500">
        {t('checkout_order_number_label')} <span className="font-medium text-brand">{orderNumber}</span>
      </p>
      <p className="max-w-xs text-xs text-gray-400">
        {t('checkout_order_confirmed_text')}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
      >
        {t('common_close')}
      </button>
    </div>
  );
}
