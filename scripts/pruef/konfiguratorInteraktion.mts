/**
 * Interaktive Sichtpruefung: Rotation (Schieberegler vs. Ziehgriff),
 * Drag-Clamping, Resize-Clamping, Sperrzonen. FIND-Phase, read-only,
 * Wegwerf-Skript. Jeder Testblock nutzt einen frischen Browser-Kontext
 * (eigene IndexedDB/localStorage), damit Elemente aus fruehren Bloecken
 * nicht ueber die Persistenz des Stores in den naechsten Block bluten.
 */
import { chromium, type Browser } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASIS = process.env.QA_BASIS ?? 'http://localhost:3007';
const OUT = path.join(__dirname, 'screens');
mkdirSync(OUT, { recursive: true });
const LOGO_PATH = path.join(__dirname, 'testlogo.png');
const LOGO_PATH_BLAU = path.join(__dirname, 'testlogo-blau.png');

async function freshPage(browser: Browser) {
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  return { ctx, page };
}

async function main() {
  const browser = await chromium.launch();

  // ── Test 1: TEXT-Element per Rotations-Schieberegler drehen ──────────
  {
    console.log('\n=== Test 1: Text-Rotation per Schieberegler (gildan-heavy-t, front) ===');
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASIS}/konfigurator?produkt=gildan-heavy-t`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-konfigbild]').first().waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: 'Text', exact: true }).click();
    await page.waitForTimeout(200);
    const textInput = page.locator('input[placeholder="Text eingeben …"]');
    await textInput.click();
    await textInput.type('FIRMENNAME GMBH', { delay: 20 });
    await page.getByRole('button', { name: 'Hinzufügen' }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/interaktion__text-1-hinzugefuegt.png` });

    const rotSlider = page.locator('input[type="range"][min="0"][max="359"]');
    await rotSlider.waitFor({ state: 'visible', timeout: 5000 });
    await rotSlider.fill('45');
    await rotSlider.dispatchEvent('change');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/interaktion__text-2-rotiert-45deg-slider.png` });

    const badgeVisible = await page.getByText('außerhalb', { exact: false }).isVisible().catch(() => false);
    console.log('  Badge "außerhalb" nach Text-Rotation via Slider sichtbar:', badgeVisible);
    await ctx.close();
  }

  // ── Test 2: LOGO hochladen (ohne BG-Entfernung), dann per Schieberegler rotieren ─
  {
    console.log('\n=== Test 2: Logo-Rotation per Schieberegler (gildan-heavy-t, front) ===');
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASIS}/konfigurator?produkt=gildan-heavy-t`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-konfigbild]').first().waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.waitForTimeout(200);
    await page.locator('label:has-text("Weißen Hintergrund") input[type="checkbox"]').uncheck().catch(() => {});
    await page.locator('input#logo-upload').setInputFiles(LOGO_PATH);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/interaktion__logo-1-hochgeladen.png` });

    const rotSlider2 = page.locator('input[type="range"][min="0"][max="359"]');
    await rotSlider2.waitFor({ state: 'visible', timeout: 5000 });
    await rotSlider2.fill('45');
    await rotSlider2.dispatchEvent('change');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/interaktion__logo-2-rotiert-45deg-slider.png` });

    const badgeVisibleLogo = await page.getByText('außerhalb', { exact: false }).isVisible().catch(() => false);
    console.log('  Badge "außerhalb" nach Logo-Rotation via Slider (45°) sichtbar:', badgeVisibleLogo);

    await rotSlider2.fill('90');
    await rotSlider2.dispatchEvent('change');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/interaktion__logo-3-rotiert-90deg-slider.png` });
    const badgeVisibleLogo90 = await page.getByText('außerhalb', { exact: false }).isVisible().catch(() => false);
    console.log('  Badge "außerhalb" nach Logo-Rotation via Slider (90°) sichtbar:', badgeVisibleLogo90);

    await rotSlider2.fill('180');
    await rotSlider2.dispatchEvent('change');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/interaktion__logo-3b-rotiert-180deg-slider.png` });

    await ctx.close();
  }

  // ── Test 3: Logo per Ziehgriff (Konva-Transformer) drehen, zum Vergleich ─
  {
    console.log('\n=== Test 3: Logo-Rotation per Canvas-Ziehgriff (Vergleich) ===');
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASIS}/konfigurator?produkt=gildan-heavy-t`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-konfigbild]').first().waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.waitForTimeout(200);
    await page.locator('label:has-text("Weißen Hintergrund") input[type="checkbox"]').uncheck().catch(() => {});
    await page.locator('input#logo-upload').setInputFiles(LOGO_PATH);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/interaktion__logo-4-vor-drehgriff.png` });

    // Rotationsgriff des Konva-Transformers: liegt oberhalb der oberen
    // Mitte des Elements, Offset 22px * stageScale. Wir lesen die
    // Element-Bounding-Box (weisse Kreis-Handles) aus dem Screenshot indirekt,
    // indem wir stattdessen ueber Tastatur/Property-Panel testen (robuster als
    // blindes Pixel-Dragging). Zusaetzlich: Drag-Test des Elements weit nach
    // rechts aussen, um Clamping zu pruefen.
    const stageCanvas = page.locator('.konvajs-content canvas').first();
    const box = await stageCanvas.boundingBox();
    console.log('  Stage bounding box:', box);

    if (box) {
      // Das Element sitzt mittig im Druckbereich. Der Rotations-Ziehgriff
      // (Konva-Transformer) liegt ueber der oberen Mitte der Bounding-Box,
      // rotateAnchorOffset=22px * stageScale. Wir lesen die Element-Position
      // aus dem vorherigen Screenshot (Logo bei ca. y=596..652 im 1500x950-
      // Fenster, x=720..830 -> Griff bei ca. x=775, y=596-22=574).
      const handleX = 775;
      const handleY = 574;
      await page.mouse.move(handleX, handleY);
      await page.mouse.down();
      // Um den Element-Mittelpunkt (ca. 775, 624) 90 Grad im Uhrzeigersinn
      // ziehen: vom oberen Griff (12-Uhr-Position) zur 3-Uhr-Position.
      const centerX = 775;
      const centerY = 624;
      const radius = 50;
      await page.mouse.move(centerX + radius, centerY, { steps: 20 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${OUT}/interaktion__logo-5-drehgriff-90grad.png` });
    }

    await ctx.close();
  }

  // ── Test 4: Logo per Eck-Ziehgriff weit ueber maxWidthCm/maxHeightCm skalieren ─
  // Blaues Test-Logo (statt rot), damit ein roter isOutOfBounds-Rahmen nicht
  // mit der Motivfarbe selbst verwechselt werden kann. Langsamere,
  // mehrstufige Ziehgeste mit Zwischenpausen, damit der Konva-Transformer
  // die Geste sicher als vollstaendigen Drag erkennt.
  {
    console.log('\n=== Test 4: Logo-Resize per Eck-Ziehgriff (ueber Druckflaechen-Maximum) ===');
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASIS}/konfigurator?produkt=gildan-heavy-t`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-konfigbild]').first().waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.waitForTimeout(200);
    await page.locator('label:has-text("Weißen Hintergrund") input[type="checkbox"]').uncheck().catch(() => {});
    await page.locator('input#logo-upload').setInputFiles(LOGO_PATH_BLAU);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/interaktion__logo-6a-vor-resize.png` });

    const breiteVorher = await page
      .locator('span:has-text("Breite")')
      .locator('xpath=..')
      .textContent()
      .catch(() => null);
    console.log('  Breite VOR Resize (Panel):', breiteVorher?.trim());

    // Bottom-right Ziehgriff (siehe interaktion__logo-6a-vor-resize.png):
    // Logo-Box ca. (720,596)-(830,652) im 1500x950-Fenster.
    const handleX = 830;
    const handleY = 652;
    await page.mouse.move(handleX, handleY, { steps: 5 });
    await page.waitForTimeout(150);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.move(950, 720, { steps: 15 });
    await page.waitForTimeout(80);
    await page.mouse.move(1100, 800, { steps: 15 });
    await page.waitForTimeout(80);
    await page.mouse.move(1250, 900, { steps: 15 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/interaktion__logo-6b-resize-ueber-maximum.png` });

    const breiteNachher = await page
      .locator('span:has-text("Breite")')
      .locator('xpath=..')
      .textContent()
      .catch(() => null);
    console.log('  Breite NACH Resize (Panel):', breiteNachher?.trim());
    const hoeheNachher = await page
      .locator('span:has-text("Höhe")')
      .locator('xpath=..')
      .textContent()
      .catch(() => null);
    console.log('  Hoehe NACH Resize (Panel):', hoeheNachher?.trim());
    const outOfBoundsSichtbar = await page.getByText('außerhalb', { exact: false }).isVisible().catch(() => false);
    console.log('  Badge "außerhalb" nach Extrem-Resize sichtbar:', outOfBoundsSichtbar);

    // Nach einem Klick ausserhalb + erneuter Auswahl erzwingen wir einen
    // React-Rerender, um auszuschliessen, dass der Screenshot nur einen
    // Konva-internen Zwischenzustand zeigt, der nie ins React-State
    // committet wurde.
    await page.mouse.click(400, 700);
    await page.waitForTimeout(150);
    await page.mouse.click(handleX - 30, handleY - 20);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/interaktion__logo-6c-nach-reselect.png` });

    await ctx.close();
  }

  // ── Test 5: Drag weit ueber den Druckbereich hinaus (Clamping) ────────
  {
    console.log('\n=== Test 5: Logo weit nach rechts aussen ziehen (Drag-Clamping) ===');
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASIS}/konfigurator?produkt=gildan-heavy-t`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-konfigbild]').first().waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.waitForTimeout(200);
    await page.locator('label:has-text("Weißen Hintergrund") input[type="checkbox"]').uncheck().catch(() => {});
    await page.locator('input#logo-upload').setInputFiles(LOGO_PATH_BLAU);
    await page.waitForTimeout(900);

    // Element-Mitte ca. (775, 624) - siehe interaktion__logo-6a-vor-resize.png.
    await page.mouse.move(775, 624, { steps: 5 });
    await page.waitForTimeout(100);
    await page.mouse.down();
    await page.mouse.move(1350, 624, { steps: 25 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/interaktion__logo-7-weit-rechts-gezogen.png` });

    await ctx.close();
  }

  // ── Test 6: Sperrzone Polo (Knopfleiste) – Logo direkt darauf ziehen ──
  {
    console.log('\n=== Test 6: Logo auf Knopfleiste ziehen (Polo, Sperrzone) ===');
    const { ctx, page } = await freshPage(browser);
    await page.goto(`${BASIS}/konfigurator?produkt=gildan-softstyle-polo`, { waitUntil: 'domcontentloaded' });
    await page.locator('[data-konfigbild]').first().waitFor({ state: 'attached', timeout: 20000 });
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Logo', exact: true }).click();
    await page.waitForTimeout(200);
    await page.locator('label:has-text("Weißen Hintergrund") input[type="checkbox"]').uncheck().catch(() => {});
    await page.locator('input#logo-upload').setInputFiles(LOGO_PATH_BLAU);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/interaktion__polo-1-vor-sperrzone.png` });

    // Element von seiner Startposition (Mitte ca. 775,644 - siehe
    // interaktion__polo-1-vor-sperrzone.png) auf die Knopfleiste (rote
    // Sperrzone, ca. x=750-793, y=372-460) ziehen.
    await page.mouse.move(775, 644, { steps: 5 });
    await page.waitForTimeout(100);
    await page.mouse.down();
    await page.mouse.move(772, 415, { steps: 20 });
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/interaktion__polo-2-auf-sperrzone-gezogen.png` });

    await ctx.close();
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
