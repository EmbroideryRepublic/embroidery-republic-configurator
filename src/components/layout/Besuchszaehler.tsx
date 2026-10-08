'use client';

/**
 * Meldet jeden Seitenaufruf an den eigenen, cookielosen Besucherzähler
 * (POST /api/besuch). Rendert nichts.
 *
 * Bewusst minimal – nichts vom Endgerät wird gespeichert oder ausgelesen:
 *   • kein Cookie, kein Local Storage, kein IndexedDB
 *   • gesendet wird nur die Adresse der aufgerufenen Seite (ohne Suchteil und
 *     ohne Anker) und – falls vorhanden – der Wert `utm_source` aus DERSELBEN
 *     Adresse. Das ist Information, die der Server mit dem Seitenaufruf ohnehin
 *     erhalten hat.
 *   • kein `document.referrer`, keine Bildschirmgröße, keine Geräteangaben
 *
 * Nicht öffentliche Bereiche (Admin, Konto, Bestell-Links mit Zugriffstoken)
 * werden hier gar nicht erst gemeldet; der Server prüft zusätzlich selbst.
 * Datenschutz und Grenzen: docs/besucherzaehler.md.
 */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NICHT_MELDEN = ['/admin', '/api', '/bestellung', '/konto', '/auth'];

export function Besuchszaehler() {
  const pfad = usePathname();

  useEffect(() => {
    if (!pfad || NICHT_MELDEN.some((p) => pfad === p || pfad.startsWith(`${p}/`))) return;

    const quelle = new URLSearchParams(window.location.search).get('utm_source') ?? undefined;
    const nutzlast = JSON.stringify({ pfad, quelle });

    try {
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon('/api/besuch', new Blob([nutzlast], { type: 'application/json' }));
      } else {
        void fetch('/api/besuch', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: nutzlast,
          keepalive: true,
        }).catch(() => undefined);
      }
    } catch {
      // Die Zählung ist nie wichtiger als die Seite – Fehler bleiben still.
    }
  }, [pfad]);

  return null;
}
