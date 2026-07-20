/**
 * Upload-Helfer für den "production-files"-Storage-Bucket (Original-
 * Logodateien + erzeugtes Produktionsblatt-PDF je Bestellung). Läuft
 * ausschließlich serverseitig (Server Actions) über den Admin-Client, da
 * der Bucket bewusst privat ist (siehe supabase/migrations/0002_...).
 */
import { createAdminClient } from './server';

const PRODUCTION_FILES_BUCKET = 'production-files';

/** Zerlegt eine Data-URL ("data:image/png;base64,...") in MIME-Typ + Bytes. */
function decodeDataUrl(dataUrl: string): { contentType: string; bytes: Buffer } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('uploadDataUrl: erwartet eine base64-kodierte Data-URL.');
  }
  const [, contentType, base64] = match;
  return { contentType: contentType ?? 'application/octet-stream', bytes: Buffer.from(base64 ?? '', 'base64') };
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
  const { bytes, contentType: resolvedContentType } =
    typeof content === 'string' ? decodeDataUrl(content) : { bytes: content, contentType: contentType ?? 'application/octet-stream' };

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
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(PRODUCTION_FILES_BUCKET).download(path);
  if (error || !data) {
    throw new Error(`downloadProductionFile: Download von "${path}" fehlgeschlagen: ${error?.message}`);
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Erzeugt eine zeitlich begrenzte Signed-URL für eine hochgeladene Produktionsdatei (privater Bucket). */
export async function getProductionFileSignedUrl(path: string, expiresInSeconds = 60 * 60 * 24 * 7): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(PRODUCTION_FILES_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
