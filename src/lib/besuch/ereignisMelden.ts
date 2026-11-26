/**
 * Meldet einen Schritt des Bestellwegs („Konfigurator geöffnet“, „Motiv hochgeladen“ …) an den cookielosen Zähler (POST /api/ereignis).
 *
 * Wie der Besucherzähler (components/layout/Besuchszaehler.tsx): nichts vom Endgerät wird gespeichert oder ausgelesen – kein Cookie, kein
 * Local/Session Storage. Gesendet wird NUR der Name des Ereignisses aus einer festen Liste. Weder Inhalt noch Name der Datei, weder Produkt
 * noch Farbe, Menge, Preis oder Bestelldaten gehören in die Meldung.
 *
 * Die Messung hängt an keiner Bestell- oder Zahlungslogik: Sie wird nur NACH einer erfolgreichen Anzeige-Aktion aufgerufen, wirft nie und
 * wartet auf nichts. Fällt sie aus, merkt der Kunde nichts. Pro Seitenaufruf wird jedes Ereignis höchstens einmal gesendet; ob derselbe
 * Besucher am selben Tag mehrfach meldet, löst der Server mit der Tageskennung (zählt einmal).
 *
 * Schalter: config/besuch.ts → EREIGNIS_MESSUNG_AKTIV.
 */
import { EREIGNIS_MESSUNG_AKTIV, type BesuchEreignis } from '@/config/besuch';

const gemeldet = new Set<BesuchEreignis>();

export function meldeBestellwegSchritt(ereignis: BesuchEreignis): void {
  if (!EREIGNIS_MESSUNG_AKTIV || typeof window === 'undefined' || gemeldet.has(ereignis)) return;
  gemeldet.add(ereignis);
  try {
    const nutzlast = JSON.stringify({ ereignis });
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/ereignis', new Blob([nutzlast], { type: 'application/json' }));
    } else {
      void fetch('/api/ereignis', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: nutzlast,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // Die Messung ist nie wichtiger als die Seite – Fehler bleiben still.
  }
}
