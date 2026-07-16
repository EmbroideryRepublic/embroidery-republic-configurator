'use client';

/**
 * ══════════════════════════════════════════════════════════════════════
 * REGELBASIERTE HINTERGRUNDENTFERNUNG (kein ML-Modell verfügbar)
 * ══════════════════════════════════════════════════════════════════════
 * Deutlich robustere Version als zuvor. Verbesserungen im Detail:
 *
 * 1. LOKALER statt GLOBALER Farbvergleich: Vorher wurde JEDES Pixel mit
 *    EINER einzigen Ecken-Farbe verglichen – bei einem Farbverlauf im
 *    Hintergrund (z.B. Studio-Foto mit leichtem Schatten) versagte das,
 *    da die gegenüberliegende Ecke schon zu weit von der Startfarbe
 *    abwich. Jetzt wird von JEDEM Randpixel aus geflutet, und jeder
 *    Schritt vergleicht nur mit dem UNMITTELBAREN Nachbarn – so werden
 *    auch Verläufe sauber als "ein zusammenhängender Hintergrund" erkannt.
 *
 * 2. ADAPTIVE TOLERANZ: Wird automatisch aus der tatsächlichen
 *    Farbstreuung am Bildrand berechnet, statt eines festen Werts – ein
 *    sehr gleichmäßiger Hintergrund bekommt eine strengere Toleranz
 *    (schneidet näher am Motiv), ein leicht verrauschter/körniger
 *    Hintergrund eine großzügigere.
 *
 * 3. WEICHE KANTEN (Alpha-Feathering): Statt hart "entweder komplett
 *    sichtbar oder komplett transparent" wird nahe der Kante ein
 *    weicher Übergang berechnet – das Ergebnis wirkt nicht mehr
 *    ausgefranst/treppenstufig.
 *
 * 4. ENTRAUSCHEN: Einzelne isolierte "Inseln" (z.B. ein einzelnes
 *    fälschlich erkanntes Pixel mitten im Motiv) werden nach dem
 *    Fluten geglättet.
 *
 * Trotzdem WICHTIG: das ist kein echtes KI-Freistellen (Segmentierung).
 * Bei komplexen/fotografischen Hintergründen (z.B. ein Logo vor einer
 * Häuserfront) bleibt das Ergebnis unzuverlässig – dafür bräuchte es ein
 * echtes ML-Modell (z.B. wie remove.bg), das hier nicht verfügbar ist.
 * Am besten funktioniert es weiterhin bei einfarbigem oder sanft
 * verlaufendem Hintergrund (Studiofoto, Screenshot, Scan).
 * ══════════════════════════════════════════════════════════════════════
 */

const WORKING_MAX_DIM = 900; // Maskenberechnung läuft auf einer verkleinerten Kopie (Performance), Ergebnis wird auf Originalauflösung angewendet

export async function removeSimpleBackground(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const fullW = img.naturalWidth || img.width;
  const fullH = img.naturalHeight || img.height;

  // --- 1. Maske auf verkleinerter Arbeitskopie berechnen (schnell) ---
  const scale = Math.min(1, WORKING_MAX_DIM / Math.max(fullW, fullH));
  const workW = Math.max(1, Math.round(fullW * scale));
  const workH = Math.max(1, Math.round(fullH * scale));

  const workCanvas = document.createElement('canvas');
  workCanvas.width = workW;
  workCanvas.height = workH;
  const workCtx = workCanvas.getContext('2d');
  if (!workCtx) return dataUrl;
  workCtx.drawImage(img, 0, 0, workW, workH);
  const workData = workCtx.getImageData(0, 0, workW, workH);

  const alphaMask = computeBackgroundAlphaMask(workData);
  despeckle(alphaMask, workW, workH);
  const backgroundColor = estimateBackgroundColor(workData);

  // --- 2. Maske auf Originalauflösung hochskalieren und anwenden ---
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = workW;
  maskCanvas.height = workH;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return dataUrl;
  const maskImageData = maskCtx.createImageData(workW, workH);
  for (let i = 0; i < alphaMask.length; i++) {
    maskImageData.data[i * 4 + 3] = alphaMask[i] ?? 0;
  }
  maskCtx.putImageData(maskImageData, 0, 0);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = fullW;
  outCanvas.height = fullH;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return dataUrl;

  // Bild in Originalqualität zeichnen …
  outCtx.drawImage(img, 0, 0, fullW, fullH);
  const outData = outCtx.getImageData(0, 0, fullW, fullH);

  // … Maske hochskaliert (mit Glättung durch drawImage) separat rendern …
  const maskUpscaleCanvas = document.createElement('canvas');
  maskUpscaleCanvas.width = fullW;
  maskUpscaleCanvas.height = fullH;
  const maskUpscaleCtx = maskUpscaleCanvas.getContext('2d');
  if (!maskUpscaleCtx) return dataUrl;
  maskUpscaleCtx.imageSmoothingEnabled = true;
  maskUpscaleCtx.drawImage(maskCanvas, 0, 0, fullW, fullH);
  const maskUpscaleData = maskUpscaleCtx.getImageData(0, 0, fullW, fullH);

  // … und die hochskalierte Alpha-Maske auf das volle Bild anwenden,
  // dabei halbtransparente Kantenpixel von der alten Hintergrundfarbe
  // befreien (Farbentmischung) – sonst bliebe ein farbiger Schleier vom
  // Hintergrund an jeder weichen Kante zurück (z.B. ein rosa Rand um ein
  // rotes Logo, das vorher auf Weiß lag).
  for (let i = 0; i < fullW * fullH; i++) {
    const a = maskUpscaleData.data[i * 4 + 3] ?? 0;
    outData.data[i * 4 + 3] = a;

    if (a > 0 && a < 250) {
      const alphaFrac = a / 255;
      const o = i * 4;
      const r = outData.data[o] ?? 0;
      const g = outData.data[o + 1] ?? 0;
      const b = outData.data[o + 2] ?? 0;
      // F = (C - (1-alpha)*B) / alpha  – löst die Alpha-Überblend-Formel
      // nach der reinen Vordergrundfarbe F auf.
      outData.data[o] = clampByte((r - (1 - alphaFrac) * backgroundColor[0]) / alphaFrac);
      outData.data[o + 1] = clampByte((g - (1 - alphaFrac) * backgroundColor[1]) / alphaFrac);
      outData.data[o + 2] = clampByte((b - (1 - alphaFrac) * backgroundColor[2]) / alphaFrac);
    }
  }
  outCtx.putImageData(outData, 0, 0);

  return outCanvas.toDataURL('image/png');
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** Durchschnittliche Hintergrundfarbe aus den Randpixeln – Grundlage für
 *  die Farbentmischung an halbtransparenten Kanten. */
function estimateBackgroundColor(imageData: ImageData): [number, number, number] {
  const { data, width, height } = imageData;
  let r = 0, g = 0, b = 0, count = 0;
  const step = Math.max(1, Math.floor(width / 40));
  for (let x = 0; x < width; x += step) {
    for (const y of [0, height - 1]) {
      const o = (y * width + x) * 4;
      r += data[o] ?? 0;
      g += data[o + 1] ?? 0;
      b += data[o + 2] ?? 0;
      count++;
    }
  }
  const stepY = Math.max(1, Math.floor(height / 40));
  for (let y = 0; y < height; y += stepY) {
    for (const x of [0, width - 1]) {
      const o = (y * width + x) * 4;
      r += data[o] ?? 0;
      g += data[o + 1] ?? 0;
      b += data[o + 2] ?? 0;
      count++;
    }
  }
  return count > 0 ? [r / count, g / count, b / count] : [255, 255, 255];
}

/**
 * Berechnet eine Alpha-Maske (0 = komplett entfernt, 255 = komplett
 * sichtbar) via lokal-ähnlichkeitsbasiertem Fluten von allen Randpixeln
 * aus, mit weichem Übergang an der erkannten Kante.
 */
function computeBackgroundAlphaMask(imageData: ImageData): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const n = width * height;

  // Adaptive Toleranz aus der tatsächlichen Farbstreuung am Rand schätzen.
  const tolerance = estimateBorderTolerance(data, width, height);

  const visited = new Uint8Array(n); // 0 = unbesucht, 1 = Hintergrund, 2 = Motiv-Grenze (im Warteschlangen-Randbereich abgebrochen)
  const alpha = new Uint8ClampedArray(n).fill(255);

  const queue = new Int32Array(n);
  let qHead = 0;
  let qTail = 0;

  function pushSeed(idx: number) {
    if (!visited[idx]) {
      visited[idx] = 1;
      alpha[idx] = 0;
      queue[qTail++] = idx;
    }
  }

  // Von ALLEN Randpixeln aus starten (nicht nur den 4 Ecken) – robuster
  // gegen Vignettierung/leichte Schatten an einzelnen Rändern.
  for (let x = 0; x < width; x++) {
    pushSeed(x); // oben
    pushSeed((height - 1) * width + x); // unten
  }
  for (let y = 0; y < height; y++) {
    pushSeed(y * width); // links
    pushSeed(y * width + (width - 1)); // rechts
  }

  function colorAt(idx: number): [number, number, number] {
    const o = idx * 4;
    return [data[o] ?? 0, data[o + 1] ?? 0, data[o + 2] ?? 0];
  }

  while (qHead < qTail) {
    const idx = queue[qHead++] ?? 0;
    const x = idx % width;
    const y = (idx / width) | 0;
    const [r, g, b] = colorAt(idx);

    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1,
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
    ];

    for (const nIdx of neighbors) {
      if (nIdx < 0 || visited[nIdx]) continue;
      const [nr, ng, nb] = colorAt(nIdx);
      const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb);

      if (diff <= tolerance) {
        visited[nIdx] = 1;
        alpha[nIdx] = 0;
        queue[qTail++] = nIdx;
      } else if (diff <= tolerance * 2.2) {
        // Weicher Übergangsbereich: nicht komplett entfernen, aber
        // abschwächen – ergibt eine sanfte statt hart ausgefranste Kante.
        visited[nIdx] = 1;
        const softness = (diff - tolerance) / (tolerance * 1.2);
        alpha[nIdx] = Math.round(Math.min(1, Math.max(0, softness)) * 255);
      }
    }
  }

  return alpha;
}

/** Schätzt eine sinnvolle Toleranz aus der Farbstreuung der Randpixel. */
function estimateBorderTolerance(data: Uint8ClampedArray, width: number, height: number): number {
  const samples: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(width / 60));
  for (let x = 0; x < width; x += step) {
    samples.push(pixelAt(data, width, x, 0));
    samples.push(pixelAt(data, width, x, height - 1));
  }
  const stepY = Math.max(1, Math.floor(height / 60));
  for (let y = 0; y < height; y += stepY) {
    samples.push(pixelAt(data, width, 0, y));
    samples.push(pixelAt(data, width, width - 1, y));
  }

  const avg: [number, number, number] = [0, 0, 0];
  for (const s of samples) {
    avg[0] += s[0];
    avg[1] += s[1];
    avg[2] += s[2];
  }
  avg[0] /= samples.length;
  avg[1] /= samples.length;
  avg[2] /= samples.length;

  let maxDiff = 0;
  for (const s of samples) {
    const diff = Math.abs(s[0] - avg[0]) + Math.abs(s[1] - avg[1]) + Math.abs(s[2] - avg[2]);
    if (diff > maxDiff) maxDiff = diff;
  }

  // Untergrenze/Obergrenze, damit die Toleranz nie zu streng (Rauschen
  // bleibt stehen) oder zu großzügig (frisst ins Motiv) wird.
  return Math.min(60, Math.max(14, maxDiff * 1.4));
}

function pixelAt(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number] {
  const o = (y * width + x) * 4;
  return [data[o] ?? 0, data[o + 1] ?? 0, data[o + 2] ?? 0];
}

/**
 * Entfernt einzelne isolierte "Inseln" in der Maske (z.B. ein einzelnes
 * fälschlich als Hintergrund erkanntes Pixel mitten im Motiv, oder
 * umgekehrt) durch einen einfachen Mehrheitsentscheid-Filter.
 */
function despeckle(alpha: Uint8ClampedArray, width: number, height: number) {
  const copy = alpha.slice();
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const isTransparent = (copy[idx] ?? 0) < 128;
      let sameCount = 0;
      const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
      for (const nIdx of neighbors) {
        const nIsTransparent = (copy[nIdx] ?? 0) < 128;
        if (nIsTransparent === isTransparent) sameCount++;
      }
      // Steht ein Pixel isoliert (keiner der 4 Nachbarn stimmt überein),
      // an den Nachbar-Mehrheitswert angleichen.
      if (sameCount === 0) {
        alpha[idx] = copy[idx - 1] ?? 0;
      }
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
    img.src = src;
  });
}
