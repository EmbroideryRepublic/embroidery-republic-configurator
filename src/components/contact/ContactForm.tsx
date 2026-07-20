'use client';

import { useState, type FormEvent } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { submitContactMessage } from '@/lib/actions/contact';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 5000;

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-brand outline-none transition-colors placeholder:text-brand/30 focus:border-gold focus:ring-1 focus:ring-gold';
const invalidClass = 'border-red-300 focus:border-red-400 focus:ring-red-300';

export function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const nameValid = form.name.trim().length >= 2;
  const emailValid = EMAIL_RE.test(form.email.trim());
  const messageValid = form.message.trim().length >= 10;
  const isValid = nameValid && emailValid && messageValid;

  function update(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function markTouched(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!isValid || status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    try {
      const result = await submitContactMessage(form);
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(result.error ?? 'Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
      }
    } catch {
      setStatus('error');
      setError('Ihre Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-gold/20 bg-white p-6 text-center shadow-elegant">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h2 className="mt-3 font-serif text-lg font-semibold text-brand">Nachricht gesendet</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-brand/60">
          Vielen Dank für Ihre Nachricht! Wir melden uns persönlich bei Ihnen zurück – in der Regel
          innerhalb eines Werktags.
        </p>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setTouched({});
            setStatus('idle');
          }}
          className="mt-4 rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40"
        >
          Weitere Nachricht schreiben
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-4 rounded-xl border border-gold/20 bg-white p-5 shadow-elegant sm:p-6"
      noValidate
    >
      {/* Honeypot: bewusst offscreen (nicht display:none), damit auch Bots,
          die versteckte Felder trotzdem befüllen, hängen bleiben. Für echte
          Nutzer:innen unsichtbar und aus der Tab-Reihenfolge genommen. */}
      <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website (bitte leer lassen)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1 block text-xs font-medium text-brand/70">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            autoComplete="name"
            placeholder="Vor- und Nachname"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => markTouched('name')}
            className={`${inputClass} ${touched.name && !nameValid ? invalidClass : ''}`}
          />
          {touched.name && !nameValid && (
            <p className="mt-1 text-xs text-red-500">Bitte geben Sie Ihren Namen an.</p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block text-xs font-medium text-brand/70">
            E-Mail <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@firma.de"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => markTouched('email')}
            className={`${inputClass} ${touched.email && !emailValid ? invalidClass : ''}`}
          />
          {touched.email && !emailValid && (
            <p className="mt-1 text-xs text-red-500">Bitte geben Sie eine gültige E-Mail-Adresse an.</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-xs font-medium text-brand/70">
          Betreff <span className="text-brand/30">(optional)</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          maxLength={150}
          placeholder="Worum geht es?"
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-xs font-medium text-brand/70">
          Nachricht <span className="text-red-400">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder="Ihre Frage oder Ihr Anliegen – z.B. Wunschmenge, Motiv, Termin …"
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          onBlur={() => markTouched('message')}
          className={`${inputClass} resize-y ${touched.message && !messageValid ? invalidClass : ''}`}
        />
        <div className="mt-1 flex items-center justify-between">
          {touched.message && !messageValid ? (
            <p className="text-xs text-red-500">Bitte formulieren Sie Ihre Nachricht (mind. 10 Zeichen).</p>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-brand/30">
            {form.message.length}/{MESSAGE_MAX}
          </span>
        </div>
      </div>

      {status === 'error' && error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || status === 'submitting'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-medium text-white shadow-elegant transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === 'submitting' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Wird gesendet …
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Nachricht senden
          </>
        )}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-brand/40">
        Mit dem Absenden werden Ihre Angaben zur Bearbeitung Ihrer Anfrage verarbeitet. Es entsteht
        keine Bestellung und keine Zahlungsverpflichtung.
      </p>
    </form>
  );
}
