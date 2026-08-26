/**
 * Regressionstest für den Fund vom 2026-08-26 (Produktionsreife-Audit,
 * security_rls): `istTestmodus()` ist der EINZIGE globale Schalter, der
 * E-Mail/Storage/Lieferanten-Automatisierung UND (weil `istTestmodus()` in
 * `waehleZahlungsAnbieter()` VOR jeder anderen Prüfung ausgewertet wird) auch
 * die Zahlungs-Anbieterwahl steuert. Der explizite Testanbieter selbst war
 * bereits gegen Produktivbetrieb abgesichert (Sicherheitsfund 2026-08-19,
 * siehe payments/registry.ts::istEinsatzbereit()) – dieser globale Schalter
 * hier überstimmt jenen Schutz aber vollständig, wenn er versehentlich in der
 * Produktionsumgebung gesetzt wäre (z.B. Kopierfehler beim Vercel-Env-
 * Scoping). Bislang war die einzige Absicherung organisatorische Disziplin.
 *
 * Anders als die übrigen Regressionstests dieser Audit-Serie ist dies KEIN
 * reiner Quelltext-Test: `istTestmodus()` ist eine pure Funktion über
 * `process.env`, lässt sich also direkt am Verhalten prüfen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

/** NODE_ENV ist bei @types/node als readonly typisiert – für diesen Test
 *  muss es dennoch veränderbar sein, deshalb der gezielte Cast an EINER
 *  Stelle statt an jeder Zuweisung einzeln. */
function setzeNodeEnv(wert: string | undefined): void {
  (process.env as Record<string, string | undefined>).NODE_ENV = wert;
}

async function frischeIstTestmodus() {
  // Modul-Cache umgehen, damit jeder Testfall mit garantiert unverändertem
  // Modulzustand startet (istTestmodus() liest zwar bei jedem Aufruf neu aus
  // process.env, hat aber keinen internen State – der Cache-Bust ist hier
  // nicht zwingend nötig, macht die Testabsicht aber robust gegen künftige
  // Änderungen an der Datei).
  const mod = await import('../testmodus');
  return mod.istTestmodus;
}

test('istTestmodus(): E2E_TESTMODUS=aktiv ohne NODE_ENV=production liefert true', async () => {
  const zuvorTestmodus = process.env.E2E_TESTMODUS;
  const zuvorNodeEnv = process.env.NODE_ENV;
  try {
    process.env.E2E_TESTMODUS = 'aktiv';
    setzeNodeEnv('test');
    const istTestmodus = await frischeIstTestmodus();
    assert.equal(istTestmodus(), true);
  } finally {
    process.env.E2E_TESTMODUS = zuvorTestmodus;
    setzeNodeEnv(zuvorNodeEnv);
  }
});

test('istTestmodus(): E2E_TESTMODUS=aktiv UND NODE_ENV=production wirft statt still false/true zu liefern', async () => {
  const zuvorTestmodus = process.env.E2E_TESTMODUS;
  const zuvorNodeEnv = process.env.NODE_ENV;
  try {
    process.env.E2E_TESTMODUS = 'aktiv';
    setzeNodeEnv('production');
    const istTestmodus = await frischeIstTestmodus();
    assert.throws(
      () => istTestmodus(),
      /E2E_TESTMODUS=aktiv und NODE_ENV=production/,
      'diese Kombination darf NIE vorkommen (würde u.a. die Signaturprüfung des Zahlungs-Testanbieters ' +
        'umgehen) – ein stiller false/true-Rückgabewert hätte den Fehler unbemerkt gelassen, genau wie der ' +
        'im Kopfkommentar der Datei dokumentierte frühere Vorfall'
    );
  } finally {
    process.env.E2E_TESTMODUS = zuvorTestmodus;
    setzeNodeEnv(zuvorNodeEnv);
  }
});

test('istTestmodus(): NODE_ENV=production ohne E2E_TESTMODUS bleibt unauffällig false', async () => {
  const zuvorTestmodus = process.env.E2E_TESTMODUS;
  const zuvorNodeEnv = process.env.NODE_ENV;
  try {
    delete process.env.E2E_TESTMODUS;
    setzeNodeEnv('production');
    const istTestmodus = await frischeIstTestmodus();
    assert.equal(istTestmodus(), false, 'der Normalfall in Produktion darf nicht durch die neue Sperre betroffen sein');
  } finally {
    process.env.E2E_TESTMODUS = zuvorTestmodus;
    setzeNodeEnv(zuvorNodeEnv);
  }
});

test('istTestmodus(): ein falscher Wert ("true", "1") schaltet den Testmodus nicht ein', async () => {
  const zuvorTestmodus = process.env.E2E_TESTMODUS;
  const zuvorNodeEnv = process.env.NODE_ENV;
  try {
    process.env.E2E_TESTMODUS = 'true';
    setzeNodeEnv('production');
    const istTestmodus = await frischeIstTestmodus();
    assert.equal(istTestmodus(), false, 'nur der exakte Wert "aktiv" darf greifen');
  } finally {
    process.env.E2E_TESTMODUS = zuvorTestmodus;
    setzeNodeEnv(zuvorNodeEnv);
  }
});
