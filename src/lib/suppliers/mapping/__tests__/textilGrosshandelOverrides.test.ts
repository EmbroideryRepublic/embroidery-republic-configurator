/**
 * Tests der VERIFIZIERTEN textil-grosshandel-Farb-Hex-Overrides
 * (textilGrosshandelColorHex.ts): korrekte Struktur, produktspezifische
 * Auflösung über die variantId (Hex) und der bewusste Fail-Back bei nicht
 * gepflegten (mehrdeutigen) Farben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getVariantMap, normalizeVariant, resolveColorVariant } from '..';

const map = getVariantMap('textil-grosshandel');

test('jede Override-Farbe ist verifiziert und trägt einen gültigen data-key als variantId', () => {
  const overrides = map.productOverrides ?? {};
  let count = 0;
  for (const [productId, override] of Object.entries(overrides)) {
    for (const [colorId, entry] of Object.entries(override.colors ?? {})) {
      const v = normalizeVariant(entry);
      assert.equal(v.verified, true, `${productId}/${colorId} sollte verified sein`);
      // Einfarbig: 6-stelliger Hex. Kontrastmodell: kombinierter data-key
      // „<HauptHex>_<KontrastHex>".
      assert.match(
        v.variantId ?? '',
        /^[0-9A-F]{6}(_[0-9A-F]{6})?$/,
        `${productId}/${colorId} data-key ungültig: ${v.variantId}`
      );
      count += 1;
    }
  }
  assert.ok(count >= 60, `erwartet viele verifizierte Overrides, waren ${count}`);
});

test('Farb-Hex wird PRODUKT-/MARKENSPEZIFISCH aufgelöst (variantId bevorzugt)', () => {
  // Gleiche interne Farbe, unterschiedliche Marken → unterschiedlicher Hex.
  assert.equal(resolveColorVariant(map, 'navy', 'gildan-heavy-t').variantId, '263147');
  assert.equal(resolveColorVariant(map, 'navy', 'jn-active-t').variantId, '003254');
  assert.equal(resolveColorVariant(map, 'navy', 'neutral-classic-polo').variantId, '1F2A44');
  assert.equal(resolveColorVariant(map, 'navy', 'bandc-inspire-hoodie').variantId, '1F2532');
  // Weitere Marken/Farben stichprobenartig.
  assert.equal(resolveColorVariant(map, 'royal', 'neutral-classic-polo').variantId, '0033A0');
  assert.equal(resolveColorVariant(map, 'red', 'jn-active-t').variantId, 'C80A25');
  assert.equal(resolveColorVariant(map, 'sage', 'bandc-inspire-zip-hood').variantId, 'AAC1B3');
  assert.equal(resolveColorVariant(map, 'black', 'russell-authentic-t').variantId, '000000');
});

test('Kategorie-2-Einzelkandidaten (abweichender Shop-Name) verifiziert', () => {
  // Nur EINDEUTIGE Einzelkandidaten – Label trägt den echten Shop-Namen.
  const russellNavy = resolveColorVariant(map, 'navy', 'russell-authentic-t');
  assert.equal(russellNavy.variantId, '021E42');
  assert.equal(russellNavy.label, 'French Navy');
  assert.equal(resolveColorVariant(map, 'royal', 'russell-workwear-t').label, 'Bright Royal');
  assert.equal(resolveColorVariant(map, 'red', 'russell-ladies-authentic-t').label, 'Classic Red');
  assert.equal(resolveColorVariant(map, 'royal', 'fotl-premium-polo').label, 'Royal Blue');
  assert.equal(resolveColorVariant(map, 'black', 'sols-imperial-t').label, 'Deep Black');
  assert.equal(resolveColorVariant(map, 'black', 'bandc-inspire-hoodie').label, 'Black Pure');
  assert.equal(resolveColorVariant(map, 'navy', 'stedman-slimfit-t').label, 'Navy Blue');
});

test('Business-Farbe Kelly Green: verifizierte Einzelkandidaten je Produkt', () => {
  assert.equal(resolveColorVariant(map, 'kelly-green', 'gildan-ladies-t').variantId, '009E69');
  assert.equal(resolveColorVariant(map, 'kelly-green', 'gildan-ladies-t').label, 'Irish Green');
  assert.equal(resolveColorVariant(map, 'kelly-green', 'justhoods-awdis-sweat').variantId, '009A44');
  assert.equal(resolveColorVariant(map, 'kelly-green', 'jn-active-t').variantId, '009A41');
});

test('Business-Farbe Burgundy: verifizierte Einzelkandidaten je Produkt', () => {
  assert.equal(resolveColorVariant(map, 'burgundy', 'fotl-ladies-premium-polo').variantId, '77002F');
  assert.equal(resolveColorVariant(map, 'burgundy', 'russell-authentic-t').variantId, '5A032C');
  assert.equal(resolveColorVariant(map, 'burgundy', 'neutral-rollsleeve-t').variantId, '6C1D45');
  assert.equal(resolveColorVariant(map, 'burgundy', 'neutral-rollsleeve-t').label, 'Bordeaux');
  assert.equal(resolveColorVariant(map, 'burgundy', 'justhoods-zoodie').variantId, '651C32');
  assert.equal(resolveColorVariant(map, 'burgundy', 'bandc-inspire-hoodie').variantId, '5B263D');
});

test('Business-Farbe Bottle Green: nur eindeutige Einzelkandidaten, Mehrfach bleibt offen', () => {
  // Eindeutig (genau ein „Bottle Green" im Produkt) → verifiziert.
  assert.equal(resolveColorVariant(map, 'bottle-green', 'fotl-premium-polo').variantId, '1E4026');
  assert.equal(resolveColorVariant(map, 'bottle-green', 'russell-workwear-t').variantId, '00461C');
  assert.equal(resolveColorVariant(map, 'bottle-green', 'russell-ladies-authentic-t').variantId, '00461C');
  // Mehrere gleichwertige dunkle Grüns → bewusst OFFEN (kein Hex, kein Raten):
  // Neutral („Bottle Green" vs „Military"), Just-Hoods-College (4 dunkle Grüns).
  assert.equal(resolveColorVariant(map, 'bottle-green', 'neutral-classic-polo').variantId, undefined);
  assert.equal(resolveColorVariant(map, 'bottle-green', 'justhoods-college-hoodie').variantId, undefined);
});

test('Business-Farbe Grey: markenspezifischer Standard-Mittelgrau (eindeutig)', () => {
  assert.equal(resolveColorVariant(map, 'grey', 'gildan-heavy-t').variantId, '97999B'); // Sport Grey
  assert.equal(resolveColorVariant(map, 'grey', 'gildan-ladies-polo').label, 'Sport Grey (Heather)');
  assert.equal(resolveColorVariant(map, 'grey', 'sols-imperial-t').variantId, '8F8B8B'); // Grey Melange
  assert.equal(resolveColorVariant(map, 'grey', 'russell-authentic-t').label, 'Light Oxford (Heather)');
  assert.equal(resolveColorVariant(map, 'grey', 'neutral-classic-polo').label, 'Sports Grey');
  assert.equal(resolveColorVariant(map, 'grey', 'bandc-inspire-hoodie').variantId, 'B1B3B4');
  assert.equal(resolveColorVariant(map, 'grey', 'stedman-slimfit-t').label, 'Grey Heather');
});

test('Business-Farbe Charcoal: dunkler Anthrazit (nur wo genutzt: gildan-heavy)', () => {
  const c = resolveColorVariant(map, 'charcoal', 'gildan-heavy-t');
  assert.equal(c.variantId, '66676C');
  assert.equal(c.label, 'Charcoal (Solid)');
});

test('Grey bleibt offen wo mehrdeutig: FOTL (zwei Heather) + AWDis/Just-Hoods', () => {
  // FOTL: „Heather Grey" UND „Athletic Heather" → keine eindeutige Wahl.
  assert.equal(resolveColorVariant(map, 'grey', 'fotl-premium-polo').variantId, undefined);
  assert.equal(resolveColorVariant(map, 'grey', 'fotl-ladies-premium-polo').variantId, undefined);
  // Just-Hoods: mehrere ähnliche Grautöne → bewusst offen.
  assert.equal(resolveColorVariant(map, 'grey', 'justhoods-awdis-sweat').variantId, undefined);
  assert.equal(resolveColorVariant(map, 'grey', 'justhoods-college-hoodie').variantId, undefined);
});

test('Kontrastmodelle: FOTL-Baseball als kombinierter data-key (eindeutig verifiziert)', () => {
  // Kontrast = EIN wählbares Element mit data-key „<HauptHex>_<KontrastHex>".
  const wn = resolveColorVariant(map, 'white-navy', 'fotl-baseball-t');
  assert.equal(wn.variantId, 'FFFFFF_000F33');
  assert.equal(wn.label, 'White|Deep Navy');
  assert.equal(resolveColorVariant(map, 'white-black', 'fotl-baseball-t').variantId, 'FFFFFF_120F14');
  assert.equal(resolveColorVariant(map, 'white-royal', 'fotl-baseball-longsleeve').variantId, 'FFFFFF_004D9F');
});

test('Kontrastmodell Varsity (AWDis) bleibt offen (mehrdeutige Grund-/Kontrastfarben)', () => {
  // Just-Hoods führt mehrere Navy-/Schwarz-/Rot-/Grautöne → keine eindeutige
  // Kontrast-Zuordnung; kein Raten.
  for (const cid of ['navy-grey', 'black-red', 'grey-navy', 'burgundy-anthracite', 'red-white']) {
    assert.equal(
      resolveColorVariant(map, cid, 'justhoods-contrast-hoodie').variantId,
      undefined,
      `${cid} sollte offen bleiben`
    );
  }
});

test('Label der Override-Variante ist der exakte englische Shop-Name', () => {
  assert.equal(resolveColorVariant(map, 'navy', 'gildan-heavy-t').label, 'Navy');
  assert.equal(resolveColorVariant(map, 'yellow', 'jn-active-t').label, 'Yellow');
});

test('NICHT gepflegte Farbe (noch offen) fällt auf die Basis ohne Hex zurück', () => {
  // green ist bei gildan-softstyle-polo noch nicht verifiziert (kein Standard-
  // Namenstreffer) → Basis-Eintrag ohne variantId; die Farbwahl scheitert
  // dadurch später (Fail-Fast/blocked), statt einen geratenen Ton zu bestellen.
  const green = resolveColorVariant(map, 'green', 'gildan-softstyle-polo');
  assert.equal(green.variantId, undefined);
  assert.equal(green.verified ?? false, false);
});

test('echt mehrdeutige Farbe (mehrere gleichwertige Kandidaten) bleibt ohne Hex', () => {
  // AWDis-Sweat führt mehrere gleichwertige Blau-/Schwarztöne (z.B. „Royal
  // Blue" UND „Bright Royal") → bewusst NICHT zugeordnet, Basis ohne Hex.
  assert.equal(resolveColorVariant(map, 'royal', 'justhoods-awdis-sweat').variantId, undefined);
  assert.equal(resolveColorVariant(map, 'navy', 'justhoods-awdis-sweat').variantId, undefined);
  assert.equal(resolveColorVariant(map, 'black', 'justhoods-awdis-sweat').variantId, undefined);
});
