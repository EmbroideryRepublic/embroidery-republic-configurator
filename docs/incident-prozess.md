# Incident-Prozess

Was zu tun ist, wenn im Produktivbetrieb etwas ausfällt. Bewusst knapp: Ein
Prozess, den man im Ernstfall erst lesen muss, hilft nicht.

Der Betrieb ist klein (Einzelbetrieb, kein Bereitschaftsdienst). Der Prozess ist
darauf zugeschnitten – kein Ticketsystem, keine Eskalationsstufen über mehrere
Personen, aber eine feste Reihenfolge und ein Protokoll.

---

## Schweregrade

| Grad | Bedeutung | Beispiel | Reaktion |
|---|---|---|---|
| **S1 – kritisch** | Kein Verkauf möglich oder Daten in Gefahr | Seite down, Datenbank weg, Bestellungen scheitern, Datenleck | sofort, alles andere liegen lassen |
| **S2 – hoch** | Verkauf läuft, aber ein Kernweg ist gestört | Keine Bestellbestätigungen, Zahlung schlägt fehl, Adminbereich unerreichbar | am selben Tag |
| **S3 – mittel** | Einschränkung ohne Umsatzwirkung | PDF-Upload defekt, Filter fehlerhaft, Bild fehlt | innerhalb einer Woche |
| **S4 – niedrig** | Kosmetik, Verbesserung | Abstand verrutscht, Text unklar | bei Gelegenheit |

**Einordnung im Zweifel eine Stufe höher.** Zurückstufen ist billig,
Hochstufen zu spät ist teuer.

---

## Ablauf

### 1. Feststellen (2 Minuten)

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/api/health
```

Notieren: **Wann** hat es begonnen, **was genau** ist kaputt, **wer** meldet es.
Ohne diese drei Angaben ist die Ursachensuche Raten.

### 2. Eindämmen vor Reparieren

Erst den Schaden begrenzen, dann die Ursache suchen.

- **Nach einer Auslieferung aufgetreten?** → Auf das vorige Deployment
  zurückrollen (Vercel → *Deployments* → funktionierendes Deployment →
  *Promote to Production*). Das ist der schnellste Weg zurück und immer
  richtig, wenn der Zusammenhang zeitlich passt.
- **Datenleck vermutet?** → Betroffene Schlüssel sofort rotieren
  (Supabase, Resend, Stripe), erst danach analysieren.
- **Fehlerhafte Bestellungen laufen weiter ein?** → Erwägen, den Shop kurz
  auf Wartung zu setzen, statt fehlerhafte Aufträge zu sammeln.

### 3. Ursache eingrenzen

Reihenfolge nach Wahrscheinlichkeit:

1. **Was hat sich zuletzt geändert?** Deployment, Umgebungsvariable, DNS,
   Migration, Paket-Update. Fast jede Störung folgt einer Änderung.
2. **Externer Dienst?** Statusseiten von Vercel, Supabase, Resend, Stripe.
3. **Protokolle:** Vercel → *Logs*; in der Datenbank `system_ereignisse`
   (strukturiertes Protokoll, siehe [betriebsbeobachtung.md](betriebsbeobachtung.md)).

### 4. Beheben und verifizieren

Nach jeder Korrektur der **volle** Prüflauf, nicht nur der offensichtliche Teil:

```bash
npm run typecheck && npm run lint && npm test && npm run build && npm run test:e2e
```

Eine Korrektur ohne grünen E2E-Lauf gilt als nicht abgeschlossen.

### 5. Nacharbeiten

Kurz festhalten (eine halbe Seite genügt), in `docs/`:

- Was ist passiert, ab wann, wie lange?
- Was war die Ursache – nicht das Symptom?
- Was hat die Erkennung verzögert?
- Welche eine Maßnahme verhindert die Wiederholung?

**Keine Schuldsuche.** Die nützliche Frage ist, warum das System den Fehler
zugelassen hat, nicht wer ihn gemacht hat.

---

## Datenschutzvorfall (Sonderfall)

Bei Verdacht auf unbefugten Zugriff auf personenbezogene Daten gilt eine
**gesetzliche Frist: 72 Stunden** zur Meldung an die Aufsichtsbehörde
(Art. 33 DSGVO), gerechnet ab Kenntnis.

1. Zugang schließen, Schlüssel rotieren.
2. Umfang feststellen: welche Daten, wie viele Personen, welcher Zeitraum.
3. Dokumentieren – auch wenn die Meldung am Ende entfällt, ist die
   Dokumentation Pflicht.
4. Rechtlichen Rat einholen, bevor betroffene Personen informiert werden.

Verarbeitete Datenarten stehen in
[datenbankschema.md](datenbankschema.md) und in der Datenschutzerklärung.

---

## Wiederherstellung

Datenverlust oder beschädigte Datenbank → [restore-drill.md](restore-drill.md).

> **Offener Punkt:** Der Restore-Drill ist vorbereitet und lesend validiert,
> aber noch **nie echt durchgespielt** worden (bewusste Entscheidung wegen des
> kostenlosen Supabase-Tarifs). Bis das nachgeholt ist, gilt die
> Wiederherstellungszeit als **unbekannt** – das ist das größte verbleibende
> Betriebsrisiko.
