'use client';

import { useState, type FormEvent } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2, Paperclip, X } from 'lucide-react';
import { submitContactMessage } from '@/lib/actions/contact';
import { FELD_KLASSE } from '@/lib/ui/feldKlasse';
import { useLanguageStore, translate } from '@/stores/languageStore';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MESSAGE_MAX = 5000;

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

// Client-seitige Grenzen sind reine Benutzerführung, kein Schutz – die
// autoritative Prüfung liegt serverseitig in pruefeKontaktAnhang.ts
// (gleiche Werte, dort maßgeblich).
const ANHANG_ERLAUBTE_TYPEN = ['image/png', 'image/jpeg', 'application/pdf'];
const ANHANG_MAX_DATEIGROESSE_MB = 5;
const ANHANG_MAX_ANZAHL = 3;

function liesAlsDataUrl(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Die Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(datei);
  });
}

const inputClass = FELD_KLASSE;
const invalidClass = 'border-red-300 focus:border-red-400 focus:ring-red-300';

export function ContactForm() {
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [anhaenge, setAnhaenge] = useState<File[]>([]);
  const [anhangFehler, setAnhangFehler] = useState<string | null>(null);

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

  function handleAnhangAuswahl(dateien: FileList | null) {
    if (!dateien || dateien.length === 0) return;
    setAnhangFehler(null);
    const neu = Array.from(dateien);

    if (anhaenge.length + neu.length > ANHANG_MAX_ANZAHL) {
      setAnhangFehler(`Bitte fügen Sie höchstens ${ANHANG_MAX_ANZAHL} Dateien an.`);
      return;
    }
    for (const datei of neu) {
      if (!ANHANG_ERLAUBTE_TYPEN.includes(datei.type)) {
        setAnhangFehler('Dieses Dateiformat wird nicht unterstützt. Erlaubt sind PNG, JPEG und PDF.');
        return;
      }
      if (datei.size > ANHANG_MAX_DATEIGROESSE_MB * 1024 * 1024) {
        setAnhangFehler(`Eine Datei ist zu groß (maximal ${ANHANG_MAX_DATEIGROESSE_MB} MB).`);
        return;
      }
    }
    setAnhaenge((a) => [...a, ...neu]);
  }

  function entferneAnhang(index: number) {
    setAnhaenge((a) => a.filter((_, i) => i !== index));
    setAnhangFehler(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!isValid || status === 'submitting') return;
    setStatus('submitting');
    setError(null);
    try {
      const attachments = await Promise.all(
        anhaenge.map(async (datei) => ({ dateiname: datei.name, dataUrl: await liesAlsDataUrl(datei) }))
      );
      const result = await submitContactMessage({ ...form, attachments });
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(result.error ?? t('contact_form_generic_error'));
      }
    } catch {
      setStatus('error');
      setError(t('contact_form_generic_error'));
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl border border-gold/20 bg-white p-6 text-center shadow-elegant">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
        <h2 className="mt-3 font-serif text-lg font-semibold text-brand">{t('contact_form_success_title')}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-brand/60">{t('contact_form_success_text')}</p>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setTouched({});
            setStatus('idle');
            setAnhaenge([]);
            setAnhangFehler(null);
          }}
          className="mt-4 rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold-dark transition-colors hover:bg-gold-light/40"
        >
          {t('contact_form_success_reset')}
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
          Nutzer:innen unsichtbar und aus der Tab-Reihenfolge genommen –
          bewusst unübersetzt, da nie von einem echten Menschen gelesen. */}
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
            {t('contact_form_name_label')} <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-name"
            type="text"
            required
            autoComplete="name"
            placeholder={t('contact_form_name_placeholder')}
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            onBlur={() => markTouched('name')}
            aria-invalid={touched.name && !nameValid}
            aria-describedby={touched.name && !nameValid ? 'contact-name-fehler' : undefined}
            className={`${inputClass} ${touched.name && !nameValid ? invalidClass : ''}`}
          />
          {touched.name && !nameValid && (
            <p id="contact-name-fehler" className="mt-1 text-xs text-red-500">{t('contact_form_name_error')}</p>
          )}
        </div>

        <div>
          <label htmlFor="contact-email" className="mb-1 block text-xs font-medium text-brand/70">
            {t('contact_form_email_label')} <span className="text-red-400">*</span>
          </label>
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            placeholder={t('contact_form_email_placeholder')}
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            onBlur={() => markTouched('email')}
            aria-invalid={touched.email && !emailValid}
            aria-describedby={touched.email && !emailValid ? 'contact-email-fehler' : undefined}
            className={`${inputClass} ${touched.email && !emailValid ? invalidClass : ''}`}
          />
          {touched.email && !emailValid && (
            <p id="contact-email-fehler" className="mt-1 text-xs text-red-500">{t('contact_form_email_error')}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="mb-1 block text-xs font-medium text-brand/70">
          {t('contact_form_subject_label')} <span className="text-brand/30">{t('contact_form_subject_optional')}</span>
        </label>
        <input
          id="contact-subject"
          type="text"
          maxLength={150}
          placeholder={t('contact_form_subject_placeholder')}
          value={form.subject}
          onChange={(e) => update('subject', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1 block text-xs font-medium text-brand/70">
          {t('contact_form_message_label')} <span className="text-red-400">*</span>
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          maxLength={MESSAGE_MAX}
          placeholder={t('contact_form_message_placeholder')}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          onBlur={() => markTouched('message')}
          aria-invalid={touched.message && !messageValid}
          aria-describedby={touched.message && !messageValid ? 'contact-message-fehler' : undefined}
          className={`${inputClass} resize-y ${touched.message && !messageValid ? invalidClass : ''}`}
        />
        <div className="mt-1 flex items-center justify-between">
          {touched.message && !messageValid ? (
            <p id="contact-message-fehler" className="text-xs text-red-500">
              {t('contact_form_message_error')}
            </p>
          ) : (
            <span />
          )}
          <span className="text-[11px] text-brand/30">
            {form.message.length}/{MESSAGE_MAX}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="contact-anhang" className="mb-1 block text-xs font-medium text-brand/70">
          {t('contact_form_attachment_label')}{' '}
          <span className="text-brand/30">{t('contact_form_attachment_optional', { maxMb: ANHANG_MAX_DATEIGROESSE_MB })}</span>
        </label>
        <label
          htmlFor="contact-anhang"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand/20 px-3 py-3 text-xs text-brand/50 transition-colors hover:border-gold/40 hover:text-gold-dark"
        >
          <Paperclip className="h-3.5 w-3.5" />
          {t('contact_form_attachment_dropzone')}
        </label>
        <input
          id="contact-anhang"
          type="file"
          accept={ANHANG_ERLAUBTE_TYPEN.join(',')}
          multiple
          className="sr-only"
          onChange={(e) => {
            handleAnhangAuswahl(e.target.files);
            e.target.value = '';
          }}
        />
        {anhangFehler && <p className="mt-1 text-xs text-red-500">{anhangFehler}</p>}
        {anhaenge.length > 0 && (
          <ul className="mt-2 space-y-1">
            {anhaenge.map((datei, index) => (
              <li
                key={`${datei.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md bg-cream/60 px-2.5 py-1.5 text-xs text-brand/70"
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <Paperclip className="h-3 w-3 flex-shrink-0 text-brand/30" />
                  <span className="truncate">{datei.name}</span>
                  <span className="flex-shrink-0 text-brand/30">({(datei.size / (1024 * 1024)).toFixed(1)} MB)</span>
                </span>
                <button
                  type="button"
                  onClick={() => entferneAnhang(index)}
                  aria-label={`${datei.name} entfernen`}
                  className="flex-shrink-0 rounded p-0.5 text-brand/30 hover:bg-red-50 hover:text-red-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status === 'error' && error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
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
            {t('contact_form_submitting')}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t('contact_form_submit')}
          </>
        )}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-brand/40">{t('contact_form_disclaimer')}</p>
    </form>
  );
}
