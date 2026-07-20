/**
 * Gemeinsame, lieferantenübergreifende Browser-Aktionen der Supplier Engine.
 *
 * Ergänzt die Varianten-Auswahl-Engine (selectionEngine.ts) um die beiden
 * anderen wiederkehrenden Muster praktisch jedes Shops: ANMELDEN und
 * IN-DEN-WARENKORB. Nach demselben Prinzip wie dort enthalten die Adapter
 * KEINE eigene DOM-Logik – sie liefern nur einen aus der realen Shop-Analyse
 * VERIFIZIERTEN Selektor-Plan, diese Helfer führen die Interaktion aus und
 * protokollieren sie einheitlich.
 *
 * Dadurch reduziert sich ein neuer Lieferant auf „welche Selektoren?" statt
 * „welche Klick-/Warte-Reihenfolge?" – die Reihenfolge (Trigger → Formular
 * abwarten → ausfüllen → absenden → Erfolg bestätigen) lebt genau einmal hier.
 */
import type { AutomationPage, SupplierCredentials } from '../types';

// ── Cookie-Consent verwerfen ────────────────────────────────────────────

/** „Alle ablehnen"-Schaltflächen gängiger Consent-Manager (datensparsam –
 *  es wird KEIN Consent erteilt; das Ablehnen setzt ein Cookie und gilt so
 *  für alle Folgeseiten der Sitzung). Usercentrics (textil-grosshandel) zuerst. */
const CONSENT_DENY_SELECTORS = [
  '[data-testid="uc-deny-all-button"]',
  '[data-testid="uc-deny-all"]',
  'button#uc-btn-deny-banner',
];

/** Kopfzeilen-Selektoren, die typischerweise „mitscrollen" und dadurch über
 *  einer Schaltfläche liegen können. Bewusst eng gefasst auf Kopfzeilen –
 *  ein pauschales Neutralisieren aller `position: fixed`-Elemente würde z.B.
 *  needens Login-MODAL zerstören, das exakt darauf angewiesen ist. */
const STICKY_HEADER_SELECTORS = 'header, .fixed-header, .header-wrapper, .sticky-header, [class*="fixed-header"]';

/**
 * Neutralisiert Elemente, die zwar sichtbar sind, aber Klicks abfangen: eine
 * klebende Kopfzeile liegt beim Scrollen über der Zielschaltfläche, sodass
 * Playwright den Klick zwar ausführt, er aber auf dem Header landet
 * („…intercepts pointer events") und die Aktion in einen Timeout läuft.
 *
 * Real beobachtet bei textil-grosshandel: der Klick auf `#loginButton` wurde
 * von `<div class="header-wrapper oxid-header fixed-header">` abgefangen.
 * Nie fatal – ein Shop ohne klebende Kopfzeile ist der Normalfall.
 */
async function clearClickObstructions(page: AutomationPage, log: (message: string) => void): Promise<void> {
  if (!page.evaluate) return;
  try {
    const neutralized = await page.evaluate((selectors: string) => {
      let n = 0;
      document.querySelectorAll<HTMLElement>(selectors).forEach((el) => {
        const pos = getComputedStyle(el).position;
        if (pos === 'fixed' || pos === 'sticky') { el.style.position = 'static'; n++; }
      });
      return n;
    }, STICKY_HEADER_SELECTORS);
    if (neutralized > 0) log(`[layout] ${neutralized} klebende Kopfzeile(n) neutralisiert (fingen sonst Klicks ab)`);
  } catch {
    /* nie fatal */
  }
}

/**
 * Verwirft ein etwaiges Cookie-Consent-Overlay, damit es Klicks (Login,
 * Warenkorb) nicht mehr abfängt. Bewusst NIE fatal: ein Shop ohne Banner ist
 * der Normalfall, und Consent ist für die Automatisierung nicht erforderlich.
 * Datenschutz: es wird ausschließlich abgelehnt bzw. das Overlay entfernt –
 * niemals „akzeptiert".
 */
export async function dismissConsent(page: AutomationPage, log: (message: string) => void): Promise<void> {
  // 1) Offizielle Usercentrics-API bevorzugen: denyAllConsents() lehnt ALLE
  //    Dienste ab (datensparsam), setzt das Consent-Cookie (gilt für die ganze
  //    Sitzung) und schließt das Overlay zuverlässig – ohne Re-Injektion, wie
  //    sie ein bloßes DOM-Entfernen provoziert. Deterministisch statt
  //    Klick-Timing gegen ein Shadow-DOM.
  if (page.evaluate) {
    try {
      // WICHTIG: Auf die Initialisierung WARTEN. Der Consent-Manager wird
      // asynchron nachgeladen; direkt nach page.goto() existiert UC_UI oft noch
      // nicht. Ohne dieses Warten fiel der Aufruf durch und das Overlay fing
      // anschließend die Klicks auf Login-/Warenkorb-Schaltflächen ab.
      const handled = await page.evaluate(async () => {
        type UcApi = { denyAllConsents?: () => unknown; closeCMP?: () => unknown };
        const deadline = Date.now() + 8000;
        while (Date.now() < deadline) {
          const ui = (window as unknown as { UC_UI?: UcApi }).UC_UI;
          if (ui && typeof ui.denyAllConsents === 'function') {
            try { ui.denyAllConsents(); } catch { /* ignore */ }
            try { ui.closeCMP?.(); } catch { /* ignore */ }
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
        return false;
      });
      if (handled) {
        log('[consent] Usercentrics: alle Dienste abgelehnt (UC_UI.denyAllConsents)');
        await page.waitForSelector('#usercentrics-root', { state: 'hidden', timeout: 4000 }).catch(() => {});
        await clearClickObstructions(page, log);
        return;
      }
    } catch {
      /* API nicht verfügbar → Klick-/Entfernungs-Fallback */
    }
  }
  // 2) Fallback: „Alle ablehnen"-Button klicken (Playwright durchsucht offenes
  //    Shadow-DOM automatisch). Setzt ebenfalls das Cookie.
  for (const sel of CONSENT_DENY_SELECTORS) {
    try {
      await page.waitForSelector(sel, { state: 'visible', timeout: 2000 });
      await page.click(sel);
      log(`[consent] Cookies abgelehnt ("${sel}")`);
      await clearClickObstructions(page, log);
      return;
    } catch {
      /* kein solcher Button → nächster Kandidat */
    }
  }
  // 3) Letzter Fallback: Overlay im DOM entfernen (kein Consent erteilt) +
  //    Scroll-Lock lösen. Nur die echte Playwright-Page hat evaluate().
  if (page.evaluate) {
    try {
      const removed = await page.evaluate(() => {
        let n = 0;
        const ids = ['usercentrics-root', 'usercentrics-cmp-ui', 'cmpbox', 'CybotCookiebotDialog'];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el) { el.remove(); n++; }
        }
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        return n;
      });
      if (removed > 0) log('[consent] Overlay entfernt (kein Consent erteilt)');
    } catch {
      /* nie fatal */
    }
  }
  await clearClickObstructions(page, log);
}

// ── Login ──────────────────────────────────────────────────────────────

/** Verifizierter Anmelde-Ablauf eines Shops. */
export interface LoginPlan {
  /** Absolute Login-Start-URL. Fehlt sie, wird die Basis-URL des Shops
   *  (ctx.baseUrl) genutzt: needen z.B. meldet über ein Header-Modal an, das
   *  auf jeder Seite verfügbar ist; andere Shops haben eine eigene Seite. */
  loginUrl?: string;
  /** Optionaler Auslöser, der das Login-Formular erst sichtbar macht bzw.
   *  nachlädt (z.B. needens Modal-Trigger `a[href="#signinModal"]`). */
  openTrigger?: string;
  /** Eingabefeld für Benutzername/E-Mail. */
  usernameSelector: string;
  /** Eingabefeld für das Passwort. */
  passwordSelector: string;
  /** Absende-Schaltfläche des Login-Formulars. */
  submitSelector: string;
  /** Selektor, dessen Zustandswechsel den Login-Erfolg belegt. Standardmäßig
   *  wird erwartet, dass er VERSCHWINDET (z.B. der Login-Trigger wird nach der
   *  Anmeldung ausgeblendet) – siehe successState. */
  successSelector: string;
  /** Erwarteter Zustand von successSelector NACH erfolgreicher Anmeldung.
   *  'detached'/'hidden' = Element ist weg (ausgeblendeter Login-Link),
   *  'attached'/'visible' = Element erscheint (z.B. Konto-Menü). Default:
   *  'detached'. */
  successState?: 'attached' | 'detached' | 'visible' | 'hidden';
}

/**
 * Meldet sich mit den Konto-Zugangsdaten an: navigiert zur Start-URL, macht
 * (falls nötig) das Formular sichtbar, füllt Benutzer + Passwort, sendet ab
 * und wartet auf das verifizierte Erfolgssignal.
 */
export async function performLogin(
  page: AutomationPage,
  credentials: SupplierCredentials,
  plan: LoginPlan,
  log: (message: string) => void,
  startUrl: string
): Promise<void> {
  await page.goto(startUrl);

  // Cookie-Consent VOR jeder Interaktion verwerfen – sonst fängt das Overlay
  // (z.B. Usercentrics bei textil-grosshandel) die Klicks auf Login/Absenden ab.
  await dismissConsent(page, log);

  if (plan.openTrigger) {
    await page.click(plan.openTrigger);
    // Das Formular kann per AJAX nachgeladen werden – auf das Feld warten,
    // bevor wir tippen (statt blind gegen ein noch leeres Modal zu füllen).
    await page.waitForSelector(plan.usernameSelector, { state: 'visible' });
  }

  await page.fill(plan.usernameSelector, credentials.username);
  await page.fill(plan.passwordSelector, credentials.password);
  await page.click(plan.submitSelector);

  const successState = plan.successState ?? 'detached';
  try {
    await page.waitForSelector(plan.successSelector, { state: successState });
  } catch (err) {
    // Ohne diesen Zweig meldet ein fehlgeschlagener Login nur „Timeout 30000ms
    // exceeded" – daraus lässt sich NICHT ableiten, ob die Zugangsdaten falsch
    // sind, ein Selektor veraltet ist oder der Klick abgefangen wurde. Der Shop
    // schreibt den Grund aber selbst auf die Seite; den lesen wir hier aus und
    // hängen ihn an die Fehlermeldung an.
    const reason = await readPageError(page);
    throw new Error(
      reason
        ? `Anmeldung fehlgeschlagen – Meldung des Shops: „${reason}"`
        : `Anmeldung fehlgeschlagen – keine Erfolgsbestätigung ("${plan.successSelector}" → ${successState}) und keine Fehlermeldung auf der Seite. Ursprung: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  log(`[login] angemeldet als ${credentials.username} (Bestätigung: "${plan.successSelector}" → ${successState})`);
}

/** Liest die sichtbare Fehlermeldung der aktuellen Seite (Shops schreiben den
 *  Grund einer abgelehnten Anmeldung dorthin, z.B. OXID: „Falsche E-Mail-Adresse
 *  oder falsches Passwort!"). Gibt undefined zurück, wenn nichts auffindbar ist. */
async function readPageError(page: AutomationPage): Promise<string | undefined> {
  if (!page.evaluate) return undefined;
  try {
    return await page.evaluate(() => {
      const nodes = document.querySelectorAll('.alert, .alert-danger, .text-danger, [class*="error"]');
      for (const node of Array.from(nodes)) {
        const text = (node.textContent ?? '').trim().replace(/\s+/g, ' ');
        // Sehr lange Treffer sind meist Container, die halbe Seiten umschließen.
        if (text.length > 0 && text.length <= 200) return text;
      }
      return undefined;
    });
  } catch {
    return undefined;
  }
}

// ── In den Warenkorb ───────────────────────────────────────────────────

/** Verifizierter In-den-Warenkorb-Ablauf einer konfigurierten Position. */
export interface AddToCartPlan {
  /** Absende-Schaltfläche „In den Warenkorb" der Produktseite. */
  submitSelector: string;
  /** Element, dessen Erscheinen den erfolgreichen Warenkorb-Stand belegt
   *  (z.B. needens Warenkorb-Zähler `a.cart-qty` nach dem Hinzufügen). */
  confirmationSelector: string;
}

/**
 * Legt die aktuell konfigurierte Position (Farbe + Mengen) in den Warenkorb
 * und bestätigt den Erfolg über das Warenkorb-Signal des Shops.
 */
export async function performAddToCart(
  page: AutomationPage,
  plan: AddToCartPlan,
  log: (message: string) => void
): Promise<void> {
  try {
    await page.click(plan.submitSelector);
  } catch (err) {
    // Ein deaktivierter „In den Warenkorb"-Button liefert sonst nur einen
    // nichtssagenden 30-Sekunden-Timeout („element is not enabled"). Der Shop
    // deaktiviert ihn aus fachlichen Gründen – zu geringer Bestand,
    // Mindestabnahme, Staffelgebinde. Welchen, sagt uns die Seite selbst.
    const blocker = await readSubmitBlockReason(page, plan.submitSelector);
    throw new Error(
      blocker
        ? `In den Warenkorb nicht möglich – ${blocker}`
        : `In den Warenkorb nicht möglich (${err instanceof Error ? err.message : String(err)})`
    );
  }
  await page.waitForSelector(plan.confirmationSelector);
  log(`[cart] Position in den Warenkorb gelegt (Bestätigung: "${plan.confirmationSelector}")`);
}

// ── Warenkorb dauerhaft sichern ────────────────────────────────────────

/** Verifizierter Nachweis, dass der Warenkorb wirklich beim Konto liegt. */
export interface CartConfirmationPlan {
  /** Absolute URL der Warenkorb-Seite des Shops. */
  url: string;
  /** Selektor, den es NUR bei mindestens einer Warenkorb-Position gibt.
   *  Muss in BEIDE Richtungen am realen Shop geprüft sein (vorhanden bei
   *  befülltem, abwesend bei leerem Warenkorb). */
  nonEmptySelector: string;
}

/**
 * Ruft nach dem Hinzufügen die Warenkorb-Seite auf und belegt, dass die
 * Positionen dort tatsächlich stehen.
 *
 * Das ist KEINE Kosmetik, sondern der Kern der Zusage „der Warenkorb ist
 * vorbereitet". Real gemessen bei textil-grosshandel: der Shop übernimmt den
 * Warenkorb erst beim NÄCHSTEN Seitenaufruf dauerhaft ins Konto. Wurde der
 * Browser unmittelbar nach dem Hinzufügen geschlossen (so lief es zuvor),
 * bestätigte der Shop den Klick zwar – der Inhalt starb aber mit der
 * flüchtigen Sitzung und war für den Betreiber nie sichtbar.
 *
 * Nachweis: Sitzung mit anschließendem Warenkorb-Aufruf → Position bleibt.
 * Sitzung ohne → Position weg. Deshalb ist dieser Schritt Teil des Ablaufs.
 */
export async function confirmCart(
  page: AutomationPage,
  plan: CartConfirmationPlan,
  log: (message: string) => void
): Promise<void> {
  await page.goto(plan.url);
  await dismissConsent(page, log);
  try {
    await page.waitForSelector(plan.nonEmptySelector, { state: 'attached', timeout: 15000 });
  } catch {
    throw new Error(
      `Warenkorb beim Lieferanten ist nach dem Hinzufügen LEER (${plan.url}, erwartet: "${plan.nonEmptySelector}"). ` +
        'Die Positionen wurden nicht dauerhaft übernommen.'
    );
  }
  log(`[cart] Warenkorb beim Lieferanten bestätigt (${plan.url})`);
}

/** Ermittelt, WARUM die Warenkorb-Schaltfläche nicht klickbar war: fehlt sie,
 *  ist sie deaktiviert, und welchen Hinweis (Bestand/Mindestmenge) zeigt die
 *  Seite dazu an. */
async function readSubmitBlockReason(page: AutomationPage, submitSelector: string): Promise<string | undefined> {
  if (!page.evaluate) return undefined;
  try {
    return await page.evaluate((selector: string) => {
      const btn = document.querySelector(selector) as HTMLButtonElement | null;
      if (!btn) return `Schaltfläche "${selector}" nicht vorhanden`;
      if (!btn.disabled) return undefined;
      const hints: string[] = [];
      document.querySelectorAll('.alert, .stock, .availability, [class*="stock"], [class*="minimum"]').forEach((n) => {
        const t = (n.textContent ?? '').trim().replace(/\s+/g, ' ');
        if (t && t.length <= 160) hints.push(t);
      });
      const hint = [...new Set(hints)].slice(0, 3).join(' | ');
      return `Schaltfläche ist deaktiviert${hint ? ` – Hinweis der Seite: „${hint}"` : ' (kein Hinweistext auf der Seite)'}`;
    }, submitSelector);
  } catch {
    return undefined;
  }
}
