/**
 * Upload-Helfer für den "production-files"-Storage-Bucket (Original-
 * Logodateien + erzeugtes Produktionsblatt-PDF je Bestellung). Läuft
 * ausschließlich serverseitig (Server Actions) über den Admin-Client, da
 * der Bucket bewusst privat ist (siehe supabase/migrations/0002_...).
 */
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
// Als nodePath eingebunden: die Funktionen dieser Datei haben einen
// Parameter namens `path` (den Storage-Pfad), der sonst verdeckt würde.
import nodePath from 'node:path';
import { createAdminClient } from './server';
import { istTestmodus, meldeAbgefangen } from '@/config/testmodus';
import { UnsichererPfadFehler, istSichererSpeicherpfad, pruefeDataUrl } from '@/lib/upload/pruefeUpload';
import { basisUrl } from '@/lib/seo/basisUrl';

const PRODUCTION_FILES_BUCKET = 'production-files';

/**
 * ── Testmodus: lokale Ablage statt Supabase Storage ──────────────────
 *
 * Hier wird bewusst ERSETZT und nicht unterdrückt. Grund: Das
 * Druckvorschau-Rendering lädt die zuvor hochgeladenen Logos wieder
 * HERUNTER (renderPrintView → downloadProductionFile). Würde der Upload nur
 * verschluckt, schlüge der Download fehl – und weil dieser Schritt in
 * orders.ts bewusst nicht-fatal abgefangen ist, liefe ein Testlauf grün
 * durch, während Rendering und Produktionsblatt stillschweigend
 * übersprungen würden. Das wäre exakt der blinde Fleck, dessentwegen es den
 * Testmodus gibt.
 *
 * Mit einer lokalen Ablage laufen Upload, Download und damit das gesamte
 * Rendering echt – nur eben nicht gegen den Bucket.
 */
const TESTABLAGE = nodePath.join(process.cwd(), '.testablage', PRODUCTION_FILES_BUCKET);

function testPfad(schluessel: string): string {
  // Storage-Pfade enthalten "/" – im Dateisystem als Unterverzeichnisse
  // abbilden statt zu ersetzen, damit die Struktur nachvollziehbar bleibt.
  return nodePath.join(TESTABLAGE, ...schluessel.split('/'));
}

/**
 * Fehler bei abgelehntem Upload.
 *
 * Trägt zwei Texte: `message` ist für die Kundschaft bestimmt und nennt nur
 * Änderbares; `protokoll` enthält den technischen Grund und gehört
 * ausschließlich ins Serverprotokoll. Ein Angreifer soll aus der Antwort nicht
 * ableiten können, welche Prüfung gegriffen hat.
 */
export class UploadAbgelehntFehler extends Error {
  readonly protokoll: string;
  readonly grund: string;

  constructor(kundenMeldung: string, grund: string, protokoll: string) {
    super(kundenMeldung);
    this.name = 'UploadAbgelehntFehler';
    this.grund = grund;
    this.protokoll = protokoll;
  }
}

/**
 * Lädt eine Data-URL (z.B. LogoElement.fileUrl) oder einen fertigen Buffer
 * (z.B. das gerenderte Produktionsblatt-PDF) in den privaten
 * "production-files"-Bucket hoch und gibt den Storage-Pfad zurück.
 */
export async function uploadProductionFile(
  path: string,
  content: string | Buffer,
  contentType?: string
): Promise<string> {
  // Der Pfad enthält Werte, die mittelbar vom Client stammen (Element-IDs).
  // Geprüft wird hier an der Engstelle statt bei jedem Aufrufer – so ist auch
  // ein künftiger Aufrufer abgesichert, ohne daran denken zu müssen.
  if (!istSichererSpeicherpfad(path)) {
    console.warn(`[upload] Pfad abgewiesen: ${JSON.stringify(path)}`);
    throw new UnsichererPfadFehler(path);
  }

  // Data-URLs stammen von der Kundschaft und werden vollständig geprüft:
  // Größe vor dem Dekodieren, tatsächlicher Typ über die Signatur,
  // Abmessungen aus dem Header (lib/upload/pruefeUpload.ts).
  //
  // Fertige Puffer entstehen dagegen serverseitig – Produktionsblatt-PDF und
  // Druckvorschauen. Sie durchlaufen die Prüfung bewusst nicht: Sie kommen
  // nicht von außen, und ein PDF würde an der PNG-Whitelist scheitern.
  let bytes: Buffer;
  let resolvedContentType: string;

  if (typeof content === 'string') {
    const geprueft = pruefeDataUrl(content);
    if (!geprueft.ok) {
      console.warn(`[upload] Abgelehnt (${geprueft.grund}) für "${path}": ${geprueft.protokoll}`);
      throw new UploadAbgelehntFehler(geprueft.kundenMeldung, geprueft.grund, geprueft.protokoll);
    }
    bytes = geprueft.bytes;
    // Der Typ stammt aus der SIGNATUR, nicht aus der Deklaration des
    // Aufrufers. Damit stimmt der im Bucket gespeicherte Content-Type
    // nachweislich mit dem Inhalt überein.
    resolvedContentType = geprueft.mime;
  } else {
    bytes = content;
    resolvedContentType = contentType ?? 'application/octet-stream';
  }

  if (istTestmodus()) {
    const ziel = testPfad(path);
    await mkdir(nodePath.dirname(ziel), { recursive: true });
    await writeFile(ziel, bytes);
    meldeAbgefangen('Datei-Upload', `${path} (${bytes.length} Bytes) → lokale Testablage`);
    return path;
  }

  const admin = createAdminClient();
  const { error } = await admin.storage.from(PRODUCTION_FILES_BUCKET).upload(path, bytes, {
    contentType: resolvedContentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`uploadProductionFile: Upload nach "${path}" fehlgeschlagen: ${error.message}`);
  }

  return path;
}

/** Lädt eine zuvor hochgeladene Produktionsdatei (z.B. das angezeigte
 *  Logo-Bild) aus dem privaten Bucket herunter – genutzt vom Druckvorschau-
 *  Rendering (src/lib/rendering/), das bewusst nur aus PERSISTIERTEN
 *  Bestelldaten arbeitet, nicht aus dem transienten Warenkorb-State. */
export async function downloadProductionFile(path: string): Promise<Buffer> {
  // Auch beim Lesen: Der Pfad stammt aus der Datenbank, wurde dort aber
  // ursprünglich aus Client-Werten gebaut.
  if (!istSichererSpeicherpfad(path)) {
    console.warn(`[download] Pfad abgewiesen: ${JSON.stringify(path)}`);
    throw new UnsichererPfadFehler(path);
  }
  // Gegenstück zum Upload oben: Ohne dieses Lesen aus der Testablage
  // scheiterte das Druckvorschau-Rendering im Testmodus – und zwar
  // stillschweigend, weil orders.ts es nicht-fatal abfängt.
  if (istTestmodus()) {
    return readFile(testPfad(path));
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(PRODUCTION_FILES_BUCKET).download(path);
  if (error || !data) {
    throw new Error(`downloadProductionFile: Download von "${path}" fehlgeschlagen: ${error?.message}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Erzeugt eine zeitlich begrenzte Signed-URL für eine hochgeladene Produktionsdatei (privater Bucket). */
export async function getProductionFileSignedUrl(path: string, expiresInSeconds = 60 * 60 * 24 * 7): Promise<string | null> {
  // Eine Signed URL auf einen manipulierten Pfad wäre der direkteste Weg,
  // fremde Dateien auszuleiten.
  if (!istSichererSpeicherpfad(path)) {
    console.warn(`[signedUrl] Pfad abgewiesen: ${JSON.stringify(path)}`);
    return null;
  }
  // Im Testmodus existiert keine echte Signed-URL. Eine ECHTE, absolute
  // HTTP-URL auf die Testablage (api/testablage/[...path], Fund vom
  // 2026-08-31) ist ehrlicher als null: Jeder Aufrufer – interne
  // Benachrichtigung UND die Admin-Produktionsvorschau (next/image) –
  // durchläuft damit denselben Zweig wie produktiv. Ein zuvor genutzter
  // `file://`-Verweis erfüllte das nur für reine Text-Links: next/image
  // lehnt `file://` als src ab, und Browser blockieren `file://`-Abrufe von
  // einer http(s)-Seite ohnehin – die Admin-Detailseite stürzte dadurch im
  // Testmodus auf jeder personalisierten Bestellung ab.
  if (istTestmodus()) {
    return `${basisUrl()}/api/testablage/${path}`;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(PRODUCTION_FILES_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}

export interface ProductionFileInfo {
  size: number;
  mimeType: string | null;
}

/**
 * Größe/MIME-Typ ALLER Dateien direkt unter einem Speicherpfad-Präfix (z.B.
 * "orders/<id>") – EIN Aufruf statt eines Downloads je Datei. Grundlage für
 * die Admin-Kundendateien-Übersicht (Größe/Typ anzeigen, fehlende Dateien
 * erkennen), ohne dafür jede Datei tatsächlich herunterzuladen.
 *
 * Liefert eine leere Map bei unsicherem Präfix oder wenn der Ordner (noch)
 * nicht existiert – wirft nicht, dieselbe "fail closed, aber nicht fatal"-
 * Haltung wie getProductionFileSignedUrl.
 */
export async function listProductionFileInfo(prefix: string): Promise<Map<string, ProductionFileInfo>> {
  if (!istSichererSpeicherpfad(prefix)) {
    console.warn(`[listInfo] Präfix abgewiesen: ${JSON.stringify(prefix)}`);
    return new Map();
  }

  if (istTestmodus()) {
    const dir = testPfad(prefix);
    try {
      const namen = await readdir(dir);
      const eintraege = await Promise.all(
        namen.map(async (name) => {
          const info = await stat(nodePath.join(dir, name));
          return [name, { size: info.size, mimeType: null }] as const;
        })
      );
      return new Map(eintraege);
    } catch {
      return new Map();
    }
  }

  // .list() liefert client-seitig standardmäßig NUR 100 Einträge (Supabase-
  // Vorgabe, siehe DEFAULT_SEARCH_OPTIONS im storage-js-Paket) – ohne
  // Paginierung wären Dateien einer großen Bestellung (viele Positionen ×
  // Ansichten × Original-/Anzeige-/Vorschau-Datei) ab dem 101. Eintrag für
  // diese Funktion unsichtbar und würden fälschlich als "nicht vorhanden"
  // gelten. scripts/dsgvoAltdateien.mts kennt dieselbe Grenze bereits und
  // setzt dort ausdrücklich ein höheres Limit – hier stattdessen eine echte
  // Schleife, die keine feste Obergrenze mehr braucht.
  const admin = createAdminClient();
  const SEITENGROESSE = 1000;
  const ergebnis = new Map<string, ProductionFileInfo>();
  let offset = 0;
  for (;;) {
    const { data, error } = await admin.storage
      .from(PRODUCTION_FILES_BUCKET)
      .list(prefix, { limit: SEITENGROESSE, offset });
    if (error || !data) break;

    for (const f of data) {
      if (!f.metadata) continue;
      ergebnis.set(f.name, {
        size: Number(f.metadata.size ?? 0),
        mimeType: (f.metadata.mimetype as string | undefined) ?? null,
      });
    }

    if (data.length < SEITENGROESSE) break;
    offset += SEITENGROESSE;
  }

  return ergebnis;
}
