/**
 * ═══════════════════════════════════════════════════════════════════════
 * LOGO-UPLOAD – Grenzen an einer Stelle
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Kundschaft darf Bilder bis 25 MB hochladen (Betreiberwunsch 2026-11-20).
 *
 * ── Warum es einen Zwischenspeicher gibt ──────────────────────────────
 * Die Logos reisten bisher als Data-URL im Aufruf der Server-Action `submitOrder` mit (Original UND Anzeigebild). Vercel lässt für
 * einen Funktionsaufruf aber höchstens 4,5 MB Anfragekörper zu (gemessen am 2026-11-20 gegen ergermany.de: 4 MB gehen durch, 5 MB
 * werden mit 413 FUNCTION_PAYLOAD_TOO_LARGE abgewiesen) – das alte 10-MB-Limit hat also nie bis zur Bestellung getragen.
 *
 * Große Dateien gehen deshalb in Teilen von höchstens 3 MB an `POST /api/upload/teil` und liegen unter `staging/` im Speicher. Die
 * Bestellung trägt nur noch eine Referenz (`staged:…`); der Server setzt die Teile zusammen, prüft die Datei vollständig
 * (lib/upload/pruefeUpload.ts) und legt sie am endgültigen Ort ab. Kleine Dateien reisen weiter direkt in der Bestellung.
 */

/** Größte Quelldatei, die der Browser annimmt (PNG, JPG, SVG, PDF). */
export const QUELLDATEI_MAX_MB = 25;

/** Größe eines Teils in Bytes. Durch 3 teilbar, damit ein Teil genau 4/3 so viele Base64-Zeichen ergibt (Teile ohne Rest-Füllzeichen). */
export const TEIL_MAX_BYTES = 3 * 1024 * 1024;

/**
 * Data-URLs bis zu dieser Länge (Zeichen) reisen weiter direkt in der Bestellung. Alles darüber geht über den Zwischenspeicher, damit
 * der Bestell-Aufruf mit vielen Logos sicher unter 4,5 MB bleibt.
 */
export const DIREKT_MAX_ZEICHEN = 256 * 1024;

/** Mehr Teile akzeptiert der Server je Datei nicht: 15 × 3 MB = 45 MB, passend zu UPLOAD_GRENZEN.maxBytes (lib/upload/pruefeUpload.ts). */
export const MAX_TEILE = 15;

/** Speicherordner der Zwischenablage im Bucket „production-files“. */
export const ZWISCHENABLAGE_ORDNER = 'staging';

/** Zwischenablage-Ordner (je Kalendertag) werden nach so vielen Tagen gelöscht. Verwaiste Teile aus abgebrochenen Bestellungen. */
export const ZWISCHENABLAGE_VERFALL_TAGE = 2;

/** Ein Aufruf der Bestellung darf höchstens so viele verschiedene Dateien aus der Zwischenablage zusammensetzen. */
export const MAX_ZWISCHENABLAGE_DATEIEN_JE_BESTELLUNG = 24;

/**
 * Gesamtgröße aller Zwischenablage-Dateien EINER Bestellung. Bewusst knapp: Bei Stickerei wird das Anzeigebild für die Stichzahl als Data-URL
 * (4/3 der Größe) vorgehalten, beim Zusammensetzen liegen Teile UND Ergebnis gleichzeitig im Speicher – der Spitzenbedarf ist ein Mehrfaches.
 */
export const MAX_ZWISCHENABLAGE_BYTES_JE_BESTELLUNG = 100 * 1024 * 1024;

/** Wie viele Dateien der Server gleichzeitig (über alle Bestellungen einer Instanz) zusammensetzt. Weitere warten in der Reihe. */
export const MAX_ZUSAMMENSETZEN_GLEICHZEITIG = 2;

/** Zeitlimit für das Laden EINES Teils aus dem Speicher. Eine hängende Verbindung hält sonst einen Platz für alle anderen Bestellungen. */
export const TEIL_LADE_TIMEOUT_MS = 30_000;

/** Wie lange eine Bestellung auf einen freien Platz zum Zusammensetzen wartet, bevor sie abgewiesen wird (statt ewig zu hängen). */
export const PLATZ_WARTEZEIT_MS = 60_000;

/** Zeitlimit für das Zusammensetzen EINER Datei insgesamt (alle Teile). Kürzer als die Laufzeit einer Funktion, damit der Platz sicher frei wird. */
export const ZUSAMMENSETZEN_GESAMT_TIMEOUT_MS = 45_000;

/** Höchstzahl der Verweise EINER Bestellung, Mehrfachverwendungen mitgezählt (Original und Anzeigebild je Logo). */
export const MAX_ZWISCHENABLAGE_VERWEISE_JE_BESTELLUNG = 48;

/**
 * Auflösungshinweise im Konfigurator (Betreiberwunsch 2026-11-27): AUS.
 *
 * Der Betreiber skaliert hochgeladene Bilder bei Bedarf selbst hoch. Deshalb zeigt der Konfigurator Kundinnen und Kunden weder die
 * Auflösungs-Ampel („Ungeeignet (≈ 97 dpi) …“, direkt nach dem Hochladen und dauerhaft am Logo) noch den Knopf „Hochskalieren (×n)“ samt
 * „Original wiederherstellen“. Die Hinweis-Logik (lib/canvas/logoQualitaet.ts, lib/upload/hochskalieren*.ts) bleibt vollständig erhalten;
 * auf `true` gestellt, erscheint alles wieder. Nicht betroffen: das kostenlose Werkzeug „Druckdatei prüfen“ und der Auflösungsrechner
 * (eigene Seiten) sowie der Hinweis „Zu nah an Naht/Rand“. Die Ratgebertexte (config/seo/anlassSeiten.ts) versprechen deshalb keine
 * Ampel und keinen Hochskalieren-Knopf im Konfigurator – ein Test hält das fest (anlassSeiten.test.ts).
 */
export const AUFLOESUNGSHINWEISE_IM_KONFIGURATOR = false;

/**
 * „Weißen Hintergrund entfernen“ im Konfigurator (Betreiberwunsch 2026-11-27): AUS.
 *
 * Die einfache, regelbasierte Freistellung im Browser liefert nur mäßige Ergebnisse; die DTF-Software des Betreibers kann das deutlich besser
 * und arbeitet mit dem Originalbild. Der Betreiber bereitet hochgeladene Bilder deshalb selbst auf. Deshalb gibt es für Kundinnen und Kunden weder den Schalter am ausgewählten
 * Logo („Weißen Hintergrund entfernen“) noch das Häkchen beim Hochladen („Weißen Hintergrund automatisch entfernen“); hochgeladene Bilder
 * werden unverändert übernommen. Die Freistellung selbst (lib/canvas/removeBackground) bleibt erhalten; auf `true` gestellt, erscheinen beide
 * Bedienelemente wieder. Nicht betroffen: der Schalter in der Admin-Stickdatei (components/admin/StickdateiKnoepfe.tsx).
 */
export const HINTERGRUND_ENTFERNEN_IM_KONFIGURATOR = false;
