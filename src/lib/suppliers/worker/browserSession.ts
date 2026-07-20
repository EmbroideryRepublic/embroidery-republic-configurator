/**
 * Browser-Sitzungs-Abstraktion des Playwright-Workers – der EINZIGE
 * Playwright-Integrationspunkt.
 *
 * Startet einen echten Chromium-Browser über Playwright und liefert die
 * Seite als strukturell kompatible {@link AutomationPage} zurück (Playwrights
 * `Page` erfüllt die Signaturen goto/click/fill/check/selectOption/
 * waitForSelector). Adapter und Worker bleiben dadurch von Playwright
 * entkoppelt.
 *
 * Playwright wird BEWUSST per dynamischem Import geladen (nicht per
 * top-level import): so zieht der Next.js-Build die Bibliothek nicht eager
 * in Client-/Server-Bundles, und die App bleibt lauffähig, solange der
 * Worker nicht tatsächlich gestartet wird. Fehlt der Browser (kein
 * `npx playwright install chromium`), wirft der Start mit klarer Meldung –
 * der Worker verwandelt das in einen protokollierten Fehlschlag statt
 * eines Absturzes.
 */
import type { AutomationPage } from '../types';

export interface BrowserSession {
  page: AutomationPage;
  /** Räumt Browser-Ressourcen auf – vom Worker in einem finally-Block
   *  aufgerufen, auch wenn der Lauf fehlschlägt. */
  dispose(): Promise<void>;
}

/** Headless per Default; über SUPPLIER_HEADFUL=1 sichtbar (Debugging). */
function isHeadless(): boolean {
  return process.env.SUPPLIER_HEADFUL !== '1';
}

export async function createBrowserSession(): Promise<BrowserSession> {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (err) {
    throw new Error(
      'Playwright ist nicht installiert – bitte "npm install playwright" ausführen. ' +
        `(${err instanceof Error ? err.message : String(err)})`
    );
  }

  const browser = await chromium.launch({ headless: isHeadless() });
  const context = await browser.newContext();
  const page = await context.newPage();

  return {
    // Playwrights Page erfüllt AutomationPage strukturell.
    page: page as unknown as AutomationPage,
    dispose: async () => {
      await context.close().catch(() => {});
      await browser.close().catch(() => {});
    },
  };
}
