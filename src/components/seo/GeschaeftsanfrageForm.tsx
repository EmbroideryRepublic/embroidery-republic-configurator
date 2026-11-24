'use client';

/**
 * Geschäftsanfrage auf /geschaeftskunden: kurzes Formular mit festen Auswahlfeldern (Texte: config/seo/geschaeftsanfrage.ts, Logik: lib/seo/geschaeftsanfrage.ts).
 *
 * Kennung aus dem Brief: Sie kommt über den QR-Link (`?ref=B2B-0011`), wird beim ersten Besuch im Tab gemerkt (sessionStorage – bleibt bei Neuladen und beim
 * Wechsel auf andere Seiten und zurück erhalten) und steht sichtbar und änderbar im Formular. Wer die Seite von Hand öffnet, kann sie von Hand eintragen.
 * Die Seite selbst bleibt statisch erzeugt; die Kennung wird erst im Browser gelesen.
 */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Paperclip, Send, X } from 'lucide-react';
import { submitGeschaeftsanfrage } from '@/lib/actions/geschaeftsanfrage';
import { BRANCHEN, FORMULAR_TEXTE as T, KLEIDUNG, MENGEN, VEREDELUNG, normalisiereKennung } from '@/config/seo/geschaeftsanfrage';
import { pruefeGeschaeftsanfrage, pruefeLogoAuswahl, type FeldFehler, type FeldName, type KennungQuelle } from '@/lib/seo/geschaeftsanfrage';

const SPEICHER_SCHLUESSEL = 'er-geschaeftsanfrage-kennung';

// Mobil: 16 px Schrift (iOS zoomt bei kleineren Feldern), Felder mindestens 48 px hoch.
const FELD = 'w-full min-h-[48px] rounded-lg border border-brand/20 bg-white px-3 py-2.5 text-base text-brand transition-colors focus:border-gold focus:outline-none';
const FELD_FEHLER = 'border-red-400 focus:border-red-500';
const LABEL = 'mb-1.5 block text-sm font-medium text-brand';
const HINWEIS = 'font-normal text-brand/70';
const FEHLER_TEXT = 'mt-1.5 text-sm text-red-700';

function liesAlsDataUrl(datei: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Die Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(datei);
  });
}

function speicherLesen(): string | null {
  try {
    return window.sessionStorage.getItem(SPEICHER_SCHLUESSEL);
  } catch {
    return null; // privates Fenster, blockierter Speicher: die Kennung bleibt trotzdem über den Link und das Feld nutzbar
  }
}
function speicherSchreiben(kennung: string): void {
  try {
    window.sessionStorage.setItem(SPEICHER_SCHLUESSEL, kennung);
  } catch {
    /* ohne Speicher geht es auch */
  }
}

const LEER = { firma: '', branche: '', kleidung: [] as string[], menge: '', veredelung: 'dtf', name: '', email: '', telefon: '', anmerkung: '', kennung: '', website: '' };

export function GeschaeftsanfrageForm() {
  const [werte, setWerte] = useState(LEER);
  const [quelle, setQuelle] = useState<KennungQuelle>('eingegeben');
  const [kennungUrsprung, setKennungUrsprung] = useState<string | null>(null);
  const [felder, setFelder] = useState<FeldFehler>({});
  const [logos, setLogos] = useState<File[]>([]);
  const [logoFehler, setLogoFehler] = useState<string | null>(null);
  const [status, setStatus] = useState<'bereit' | 'sendet' | 'erfolg'>('bereit');
  const [sendefehler, setSendefehler] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Kennung aus dem QR-Link, sonst aus dem gemerkten Wert dieses Tabs
  useEffect(() => {
    const ausLink = normalisiereKennung(new URLSearchParams(window.location.search).get('ref'));
    if (ausLink) {
      speicherSchreiben(ausLink);
      setWerte((w) => ({ ...w, kennung: ausLink }));
      setQuelle('qr');
      setKennungUrsprung(ausLink);
      return;
    }
    const gemerkt = normalisiereKennung(speicherLesen());
    if (gemerkt) {
      setWerte((w) => ({ ...w, kennung: gemerkt }));
      setQuelle('gespeichert');
      setKennungUrsprung(gemerkt);
    }
  }, []);

  function setze<K extends keyof typeof LEER>(feld: K, wert: (typeof LEER)[K]) {
    setWerte((w) => ({ ...w, [feld]: wert }));
    setFelder((f) => {
      if (!(feld in f)) return f;
      const rest = { ...f };
      delete rest[feld as FeldName];
      return rest;
    });
  }

  function kleidungUmschalten(id: string) {
    setze('kleidung', werte.kleidung.includes(id) ? werte.kleidung.filter((k) => k !== id) : [...werte.kleidung, id]);
  }

  function logosWaehlen(dateien: FileList | null) {
    if (!dateien || dateien.length === 0) return;
    const neu = Array.from(dateien);
    const problem = pruefeLogoAuswahl(logos, neu);
    if (problem) {
      setLogoFehler(problem);
      return;
    }
    setLogoFehler(null);
    setLogos((l) => [...l, ...neu]);
  }

  async function absenden(e: FormEvent) {
    e.preventDefault();
    if (status === 'sendet') return;
    const eingabe = { ...werte, kennungQuelle: quelle };
    const geprueft = pruefeGeschaeftsanfrage(eingabe);
    if (!geprueft.ok) {
      setFelder(geprueft.felder);
      setSendefehler(null);
      // zum ersten fehlerhaften Feld springen
      const erstes = (['firma', 'branche', 'kleidung', 'menge', 'veredelung', 'name', 'email', 'telefon', 'anmerkung', 'kennung'] as FeldName[]).find((f) => geprueft.felder[f]);
      if (erstes) formRef.current?.querySelector<HTMLElement>(`[data-feld="${erstes}"]`)?.focus();
      return;
    }
    setStatus('sendet');
    setSendefehler(null);
    try {
      const attachments = await Promise.all(logos.map(async (d) => ({ dateiname: d.name, dataUrl: await liesAlsDataUrl(d) })));
      const ergebnis = await submitGeschaeftsanfrage({ ...eingabe, attachments });
      if (ergebnis.success) {
        setStatus('erfolg');
        return;
      }
      if (ergebnis.felder) setFelder(ergebnis.felder);
      setSendefehler(ergebnis.error ?? T.sendefehler);
    } catch {
      setSendefehler(T.sendefehler);
    }
    setStatus('bereit');
  }

  if (status === 'erfolg') {
    return (
      <div role="status" className="rounded-xl border border-gold/20 bg-white p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-700" aria-hidden />
        <h3 className="mt-3 font-serif text-xl font-semibold text-brand">{T.erfolgTitel}</h3>
        <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-brand/80">{T.erfolgText}</p>
        <button
          type="button"
          onClick={() => {
            setWerte({ ...LEER, kennung: werte.kennung });
            setLogos([]);
            setFelder({});
            setStatus('bereit');
          }}
          className="mt-5 min-h-[48px] rounded-lg border border-gold/40 px-5 py-2.5 text-base font-medium text-gold-dark transition-colors hover:bg-gold-light/40"
        >
          {T.erfolgNochmal}
        </button>
      </div>
    );
  }

  const hatFehler = Object.keys(felder).length > 0;
  const beschreibt = (feld: FeldName) => (felder[feld] ? `fehler-${feld}` : undefined);
  const feldKlasse = (feld: FeldName) => `${FELD} ${felder[feld] ? FELD_FEHLER : ''}`;
  const fehlerZeile = (feld: FeldName) => (felder[feld] ? <p id={`fehler-${feld}`} className={FEHLER_TEXT}>{felder[feld]}</p> : null);

  return (
    <form ref={formRef} onSubmit={absenden} noValidate className="relative space-y-6" aria-label="Geschäftsanfrage">
      {/* Honeypot: offscreen, nicht display:none; für Menschen unsichtbar und aus der Tab-Reihenfolge genommen. */}
      <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website (bitte leer lassen)
          <input type="text" tabIndex={-1} autoComplete="off" value={werte.website} onChange={(e) => setze('website', e.target.value)} />
        </label>
      </div>

      <div>
        <label htmlFor="ga-firma" className={LABEL}>
          {T.firma} <span aria-hidden className="text-red-700">*</span>
        </label>
        <input
          id="ga-firma"
          data-feld="firma"
          type="text"
          required
          autoComplete="organization"
          placeholder={T.firmaPlatzhalter}
          value={werte.firma}
          onChange={(e) => setze('firma', e.target.value)}
          aria-invalid={Boolean(felder.firma)}
          aria-describedby={beschreibt('firma')}
          className={feldKlasse('firma')}
        />
        {fehlerZeile('firma')}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="ga-branche" className={LABEL}>
            {T.branche} <span aria-hidden className="text-red-700">*</span>
          </label>
          <select
            id="ga-branche"
            data-feld="branche"
            required
            value={werte.branche}
            onChange={(e) => setze('branche', e.target.value)}
            aria-invalid={Boolean(felder.branche)}
            aria-describedby={beschreibt('branche')}
            className={feldKlasse('branche')}
          >
            <option value="">{T.brancheLeer}</option>
            {BRANCHEN.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
          {fehlerZeile('branche')}
        </div>
        <div>
          <label htmlFor="ga-menge" className={LABEL}>
            {T.menge} <span aria-hidden className="text-red-700">*</span>
          </label>
          <select
            id="ga-menge"
            data-feld="menge"
            required
            value={werte.menge}
            onChange={(e) => setze('menge', e.target.value)}
            aria-invalid={Boolean(felder.menge)}
            aria-describedby={beschreibt('menge')}
            className={feldKlasse('menge')}
          >
            <option value="">{T.mengeLeer}</option>
            {MENGEN.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          {fehlerZeile('menge')}
        </div>
      </div>

      <fieldset aria-describedby={beschreibt('kleidung')}>
        <legend className={LABEL}>
          {T.kleidung} <span aria-hidden className="text-red-700">*</span> <span className={HINWEIS}>({T.kleidungHinweis})</span>
        </legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {KLEIDUNG.map((k, i) => (
            <label
              key={k.id}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-base text-brand transition-colors ${
                werte.kleidung.includes(k.id) ? 'border-gold bg-gold-light/30' : 'border-brand/20 bg-white hover:border-gold/50'
              }`}
            >
              <input
                type="checkbox"
                data-feld={i === 0 ? 'kleidung' : undefined}
                checked={werte.kleidung.includes(k.id)}
                onChange={() => kleidungUmschalten(k.id)}
                className="h-5 w-5 flex-shrink-0 accent-gold-btn"
              />
              {k.label}
            </label>
          ))}
        </div>
        {fehlerZeile('kleidung')}
      </fieldset>

      <fieldset aria-describedby={beschreibt('veredelung')}>
        <legend className={LABEL}>
          {T.veredelung} <span aria-hidden className="text-red-700">*</span>
        </legend>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {VEREDELUNG.map((v, i) => (
            <label
              key={v.id}
              className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-base text-brand transition-colors ${
                werte.veredelung === v.id ? 'border-gold bg-gold-light/30' : 'border-brand/20 bg-white hover:border-gold/50'
              }`}
            >
              <input
                type="radio"
                name="ga-veredelung"
                data-feld={i === 0 ? 'veredelung' : undefined}
                checked={werte.veredelung === v.id}
                onChange={() => setze('veredelung', v.id)}
                className="h-5 w-5 flex-shrink-0 accent-gold-btn"
              />
              {v.label}
            </label>
          ))}
        </div>
        {fehlerZeile('veredelung')}
      </fieldset>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="ga-name" className={LABEL}>
            {T.name} <span aria-hidden className="text-red-700">*</span>
          </label>
          <input
            id="ga-name"
            data-feld="name"
            type="text"
            required
            autoComplete="name"
            value={werte.name}
            onChange={(e) => setze('name', e.target.value)}
            aria-invalid={Boolean(felder.name)}
            aria-describedby={beschreibt('name')}
            className={feldKlasse('name')}
          />
          {fehlerZeile('name')}
        </div>
        <div>
          <label htmlFor="ga-email" className={LABEL}>
            {T.email} <span aria-hidden className="text-red-700">*</span>
          </label>
          <input
            id="ga-email"
            data-feld="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            value={werte.email}
            onChange={(e) => setze('email', e.target.value)}
            aria-invalid={Boolean(felder.email)}
            aria-describedby={beschreibt('email')}
            className={feldKlasse('email')}
          />
          {fehlerZeile('email')}
        </div>
      </div>

      <div>
        <label htmlFor="ga-telefon" className={LABEL}>
          {T.telefon} <span className={HINWEIS}>({T.telefonHinweis})</span>
        </label>
        <input
          id="ga-telefon"
          data-feld="telefon"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={werte.telefon}
          onChange={(e) => setze('telefon', e.target.value)}
          aria-invalid={Boolean(felder.telefon)}
          aria-describedby={beschreibt('telefon')}
          className={feldKlasse('telefon')}
        />
        {fehlerZeile('telefon')}
      </div>

      <div>
        <label htmlFor="ga-logo" className={LABEL}>
          {T.logo}
        </label>
        <p className="mb-2 text-sm text-brand/70">{T.logoHinweis}</p>
        <label
          htmlFor="ga-logo"
          className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-brand/30 px-3 py-3 text-base text-brand/80 transition-colors hover:border-gold hover:text-gold-dark"
        >
          <Paperclip className="h-4 w-4" aria-hidden />
          {T.logoWaehlen}
        </label>
        <input
          id="ga-logo"
          type="file"
          accept="image/png,image/jpeg,application/pdf"
          multiple
          className="sr-only"
          onChange={(e) => {
            logosWaehlen(e.target.files);
            e.target.value = '';
          }}
        />
        {logoFehler && <p role="alert" className={FEHLER_TEXT}>{logoFehler}</p>}
        {logos.length > 0 && (
          <ul className="mt-3 space-y-2">
            {logos.map((d, i) => (
              <li key={`${d.name}-${i}`} className="flex items-center justify-between gap-2 rounded-md bg-cream/60 px-3 py-2 text-sm text-brand/80">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
                  <span className="truncate">{d.name}</span>
                  <span className="flex-shrink-0">({(d.size / (1024 * 1024)).toFixed(1).replace('.', ',')} MB)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLogos((l) => l.filter((_, j) => j !== i));
                    setLogoFehler(null);
                  }}
                  aria-label={`${d.name} entfernen`}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded text-brand/70 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label htmlFor="ga-anmerkung" className={LABEL}>
          {T.anmerkung} <span className={HINWEIS}>({T.anmerkungHinweis})</span>
        </label>
        <textarea
          id="ga-anmerkung"
          data-feld="anmerkung"
          rows={4}
          maxLength={1500}
          value={werte.anmerkung}
          onChange={(e) => setze('anmerkung', e.target.value)}
          aria-invalid={Boolean(felder.anmerkung)}
          aria-describedby={beschreibt('anmerkung')}
          className={`${feldKlasse('anmerkung')} resize-y`}
        />
        {fehlerZeile('anmerkung')}
      </div>

      <div>
        <label htmlFor="ga-kennung" className={LABEL}>
          {T.kennung} <span className={HINWEIS}>({T.kennungHinweis})</span>
        </label>
        <input
          id="ga-kennung"
          data-feld="kennung"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="B2B-0000"
          value={werte.kennung}
          onChange={(e) => {
            setze('kennung', e.target.value);
            // Eine unveränderte Kennung behält ihre Herkunft; jede Änderung gilt als Eingabe von Hand
            setQuelle(normalisiereKennung(e.target.value) === kennungUrsprung && kennungUrsprung ? quelle : 'eingegeben');
          }}
          aria-invalid={Boolean(felder.kennung)}
          aria-describedby={`${beschreibt('kennung') ?? ''} ${werte.kennung && werte.kennung === kennungUrsprung ? 'ga-kennung-hinweis' : ''}`.trim() || undefined}
          className={`${feldKlasse('kennung')} sm:max-w-[16rem]`}
        />
        {werte.kennung && werte.kennung === kennungUrsprung && <p id="ga-kennung-hinweis" className="mt-1.5 text-sm text-brand/70">{T.kennungUebernommen}</p>}
        {fehlerZeile('kennung')}
      </div>

      {(sendefehler || hatFehler) && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
          <span>{sendefehler ?? T.sammelfehler}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'sendet'}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-gold-btn px-5 py-3 text-base font-medium text-white shadow-elegant transition-colors hover:bg-gold-dark disabled:cursor-wait disabled:opacity-60"
      >
        {status === 'sendet' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            {T.sendet}
          </>
        ) : (
          <>
            <Send className="h-5 w-5" aria-hidden />
            {T.senden}
          </>
        )}
      </button>

      <p className="text-center text-sm leading-relaxed text-brand/70">{T.datenschutz}</p>
    </form>
  );
}
