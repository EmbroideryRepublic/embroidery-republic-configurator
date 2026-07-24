# Audit Produktionsreife – Embroidery Republic

Externe Architektur- und Sicherheitsprüfung vor Freigabe für den
Produktivbetrieb. Erhoben am 2026-07-22 gegen den laufenden Code und die
Produktivdatenbank.

**Umfang:** 230 Quelldateien, 35.720 Zeilen, 14 Migrationen, 378 Tests grün.

**Gesamturteil: NICHT freigabefähig.** Drei kritische Befunde führen im
Echtbetrieb zu Datenverlust bzw. rechtlichen Problemen. Sie sind mit
überschaubarem Aufwand behebbar; die Architektur selbst ist tragfähig und
überdurchschnittlich sauber dokumentiert.

---

## Zusammenfassung

| Prio | Anzahl | Kernpunkte |
|---|---|---|
| **kritisch** | 3 | Bestellung nicht atomar · Upload ungeprüft · kein Zahlungsanbieter |
| **hoch** | 7 | Admin-Cookie = Secret · kein Rate-Limit auf Bestellungen · RLS-Lücke · kein Monitoring · DSGVO-Löschkonzept · Rechtstexte · keine CI |
| **mittel** | 8 | Admin-Paginierung · Testlücken · In-Memory-Rate-Limit · fehlende Indizes · keine Schema-Validierung · Backup unerprobt · Preisfreigabe · EU-Steuer |
| **niedrig** | 4 | Markenname verdrahtet · Timing-Vergleich · Logging unstrukturiert · Accessibility ungeprüft |

---

# KRITISCH

## K1 – Eine Bestellung entsteht in drei Schritten ohne Transaktion

**Wo:** `src/lib/actions/orders.ts:324–450`

Die Bestellung wird in drei getrennten Datenbankaufrufen gespeichert:

```
1. insert orders                  → bei Fehler: Abbruch, sauber
2. insert order_items             → bei Fehler: Abbruch, orders BLEIBT
3. insert configuration_elements  → bei Fehler: Abbruch, orders + items BLEIBEN
```

Es gibt keine Transaktion und kein Aufräumen. Schlägt Schritt 2 oder 3 fehl
– Netzwerkabbruch, Zeitüberschreitung, Constraint-Verletzung –, bleibt ein
Torso in der Datenbank.

**Warum das schlimm ist:** Der eigentliche Schaden entsteht danach. Die
Kundschaft sieht „Bitte versuchen Sie es erneut" und versucht es erneut. Die
`client_request_id` ist aber bereits vergeben, also greift die Idempotenz aus
Migration 0011 – und liefert die **kaputte Bestellung als Erfolg zurück**.

Ergebnis: Eine Bestellung ohne Positionen oder ohne Konfigurationselemente
gilt als bestätigt. Die Bestätigungsmail geht raus. In der Produktion fehlen
die Motivdaten. Der Fehler fällt erst auf, wenn jemand das Produktionsblatt
öffnet.

**Im Betrieb:** Bei 10.000 Bestellungen ist das kein Randfall. Schon eine
Fehlerquote von 0,1 % bedeutet zehn nicht produzierbare Bestellungen, die
bezahlt sind.

**Lösung:** Eine Postgres-Funktion (`create_order_atomic`) über `rpc()`, die
alle drei Inserts in einer Transaktion ausführt. Alternativ ein
Kompensations-Pfad, der bei Fehler in Schritt 2/3 die bereits angelegte
Bestellung wieder löscht **und** die `client_request_id` freigibt – sonst
bleibt der Kunde dauerhaft blockiert.

Empfohlen ist die RPC-Variante: Sie ist die einzige, die auch bei Absturz des
Node-Prozesses konsistent bleibt.

**Aufwand:** 4–6 Stunden inkl. Migration und Test.
**Go-live:** Nein. Muss vorher behoben sein.

---

## K2 – Datei-Uploads ohne Größen- und Typprüfung

**Wo:** `src/lib/supabase/storage.ts:39–60`

`decodeDataUrl()` zerlegt eine Data-URL und übernimmt den MIME-Typ, wie er
kommt: `contentType ?? 'application/octet-stream'`. Es gibt

- keine Größenbegrenzung,
- keine Whitelist erlaubter Typen,
- keine Prüfung, ob der Inhalt zum angegebenen Typ passt.

**Warum das schlimm ist:** Der Konfigurator lädt Kundenlogos hoch. Ein
manipulierter Client kann beliebig große Dateien senden – der Server nimmt
sie an, hält sie im Speicher und schreibt sie in den Storage. Eine einzige
500-MB-Data-URL genügt für einen Speicherüberlauf der Serverinstanz.

Zweitens: Ein als `image/png` deklariertes SVG mit eingebettetem Skript
landet im Storage. Wird es später in einem Browser-Kontext ausgeliefert, ist
das ein XSS-Vektor.

**Im Betrieb:** Ein einzelner böswilliger Aufruf kann den Dienst
lahmlegen. Ohne Rate-Limit (siehe H2) beliebig wiederholbar.

**Lösung:** Vor dem Upload prüfen: Höchstgröße (z.B. 10 MB), Whitelist
(`image/png`, `image/jpeg`, `image/svg+xml`, `application/pdf`), und den
tatsächlichen Dateikopf gegen den angegebenen Typ abgleichen (Magic Bytes).
SVG zusätzlich bereinigen oder ausschließlich als Rasterbild weiterverarbeiten.

**Aufwand:** 3–4 Stunden.
**Go-live:** Nein.

---

## K3 – Es gibt keinen funktionsfähigen Zahlungsanbieter

**Wo:** `src/lib/payments/registry.ts:32` → `stripe: null`

Die gesamte Zahlungsarchitektur steht: Port mit drei Methoden, dynamische
Webhook-Route, Idempotenz über eine WHERE-Bedingung, Ereignisprotokoll,
Testanbieter als Referenz, E2E-geprüft. Der Stripe-Adapter selbst fehlt.

Live ist ausschließlich Rechnungskauf. Für einen Shop mit Privatkundschaft
als Kernzielgruppe bedeutet das: Vorleistung ohne Zahlungssicherung bei
personalisierter, nicht weiterverkäuflicher Ware.

**Lösung:** Adapter gegen die drei Portmethoden, Webhook-Endpunkt bei Stripe
einrichten, Schlüssel hinterlegen, E2E gegen den Stripe-Testmodus.

**Aufwand:** 1–2 Tage.
**Go-live:** Nur wenn Rechnungskauf als einzige Zahlart bewusst akzeptiert
wird. Dann kein Blocker, aber ein Geschäftsrisiko.

---

# HOCH

## H1 – Das Admin-Cookie *ist* das Admin-Secret

**Wo:** `src/lib/admin/auth.ts:26–29`

```ts
return Boolean(cookieValue && cookieValue === process.env.ADMIN_SECRET);
```

Der Cookie-Wert ist eine wortgleiche Kopie des Secrets aus der Umgebung. Das
Cookie ist `httpOnly`, damit ist der offensichtliche Weg zu (XSS greift
nicht). Aber jedes Leck des Cookies – Proxy-Log, Browser-Erweiterung,
Fehlerbericht, versehentlicher Screenshot – gibt das **dauerhaft gültige
Betriebsgeheimnis** preis, nicht nur eine Sitzung.

Zusätzlich: kein Ablauf, keine Möglichkeit, eine einzelne Sitzung zu
beenden. Wer das Secret hat, hat es bis zur Rotation der Umgebungsvariablen.

**Lösung:** Statt des Secrets einen davon abgeleiteten, signierten Token mit
Ablaufzeit setzen (HMAC über Zeitstempel). Der Vergleich sollte zusätzlich
zeitkonstant erfolgen (`crypto.timingSafeEqual`).

**Aufwand:** 2–3 Stunden. **Go-live:** Behebbar, sollte aber vorher passieren.

## H2 – Bestellungen haben kein Rate-Limit

**Wo:** `src/lib/actions/orders.ts` (fehlt), Vergleich: `contact.ts:38–50`

Das Kontaktformular ist begrenzt (5 Nachrichten / 10 Minuten / IP). Der
Bestellvorgang – der teure Pfad mit Datei-Upload, Bildverarbeitung,
Datenbankschreibvorgängen und E-Mail-Versand – ist **ungeschützt**.

**Im Betrieb:** Ein Skript kann beliebig viele Bestellungen erzeugen. Jede
löst Uploads, Vorschaubilder, Produktionsblatt und zwei E-Mails aus. Das
kostet Rechenzeit, Speicher und Resend-Kontingent.

**Lösung:** Dieselbe Begrenzung wie beim Kontaktformular auf den
Bestellpfad, mit höherem Limit. Zusammen mit H3 auf einen geteilten Speicher
umstellen.

**Aufwand:** 2 Stunden. **Go-live:** Nein, sollte vorher behoben sein.

## H3 – Rate-Limit liegt im Prozessspeicher

**Wo:** `src/lib/actions/contact.ts:40`

`const recentSubmissions = new Map<...>()` – gültig je Serverinstanz. Auf
einer serverlosen Plattform (Vercel) bekommt praktisch jeder Aufruf eine
eigene Instanz; das Limit greift dann faktisch nie. Zusätzlich wächst die
Map unbegrenzt, da Schlüssel nie entfernt werden – ein langsames Speicherleck
bei langlebigen Instanzen.

Der Code benennt die Einschränkung selbst („best effort"). Als
Grundschutz vertretbar, als einziger Schutz nicht.

**Lösung:** Geteilter Zähler (Upstash Redis oder eine Postgres-Tabelle mit
TTL). Aufräumen alter Schlüssel.

**Aufwand:** 3–4 Stunden. **Go-live:** Ja, mit dokumentiertem Restrisiko.

## H4 – `categories` ohne Row Level Security

**Wo:** Datenbank, geprüft am 2026-07-22

Zwölf von dreizehn Tabellen haben RLS aktiviert, `categories` nicht.
Vermutlich ein Versehen aus Migration 0008. Die Tabelle enthält keine
personenbezogenen Daten, aber der publizierbare Schlüssel erlaubt damit
potenziell Schreibzugriff, sofern keine Policy greift.

**Lösung:** RLS aktivieren, Lesepolicy für alle, Schreibrechte nur
Service-Role. **Aufwand:** 30 Minuten. **Go-live:** Nein, trivial zu beheben.

## H5 – Kein Monitoring, keine Fehlerbenachrichtigung

Es gibt 26 `console.error`-Aufrufe im Kernpfad und keine Stelle, die sie
einsammelt. Ein Fehler beim Bestellabschluss fällt auf, wenn Kundschaft
sich meldet – oder gar nicht.

**Im Betrieb:** Ein stiller Fehler im Zahlungs-Webhook bleibt tagelang
unbemerkt. Genau dieser Fall ist bereits einmal eingetreten (Migration 0011
war nicht angewendet; sichtbar wurde es erst durch einen Test).

**Lösung:** Sentry o.ä. für Server- und Client-Fehler, mit Benachrichtigung
bei Fehlern im Bestell- und Zahlungspfad. Strukturierte Logs statt
`console.error` mit Bestellnummer als Korrelations-ID.

**Aufwand:** 4–6 Stunden. **Go-live:** Dringend empfohlen.

## H6 – Kein DSGVO-Löschkonzept

Es gibt keine Aufbewahrungsfrist, keine Anonymisierung, keinen Mechanismus
für Auskunft oder Löschung. Gespeichert werden Name, Anschrift,
E-Mail-Adresse, Telefonnummer und hochgeladene Kundenlogos – zeitlich
unbegrenzt.

**Lösung:** Aufbewahrungsfrist festlegen (steuerlich 10 Jahre für
Rechnungsdaten, aber Kundenlogos und Vorschaubilder können früher weg),
Anonymisierungslauf, dokumentierter Auskunfts- und Löschprozess.

**Aufwand:** 1 Tag inkl. Dokumentation. **Go-live:** Rechtlich erforderlich.

## H7 – Rechtstexte unvollständig

Drei offene Stellen (nach Behebung der AGB-Steuerangabe am 2026-07-22):
USt-IdNr. im Impressum, Hosting-Anbieter und Supabase-Region in der
Datenschutzerklärung.

**Aufwand:** 1 Stunde, sobald die Angaben vorliegen. **Go-live:** Nein.

## H8 – Keine CI

Kein `.github/workflows`. `tsc`, ESLint und die 378 Tests laufen
ausschließlich lokal und nur, wenn jemand daran denkt.

**Im Betrieb mit mehreren Mitarbeitern:** Der erste Beitrag, der die Tests
bricht, landet unbemerkt in der Produktion.

**Lösung:** Workflow mit `tsc --noEmit`, `next lint`, `npm test` bei jedem
Push. **Aufwand:** 2 Stunden. **Go-live:** Ja, aber vor dem zweiten
Mitarbeiter zwingend.

---

# MITTEL

## M1 – Adminliste ohne Paginierung

`src/lib/admin/data.ts:188` – `.limit(200)`. Bei 10.000 Bestellungen sind
9.800 unerreichbar. Es gibt keine Suche, keinen Filter, kein Blättern.

**Lösung:** Serverseitige Paginierung, Suche nach Bestellnummer, Name und
E-Mail. **Aufwand:** 4–6 Stunden.

## M2 – Testlücken in den Kernpfaden

| Bereich | Dateien | Tests |
|---|---|---|
| `lib/actions` | 6 | **0** |
| `components/configurator` | 19 | **0** |
| `lib/orders` | 9 | 4 |
| `lib/pricing` | 9 | 4 |

`lib/actions` enthält den vollständigen Bestellvorgang – die riskanteste
Stelle des Systems – und hat keinen einzigen Unit-Test. Abgedeckt ist sie nur
indirekt über `scripts/e2eBestellung.mts`.

**Lösung:** Tests für `submitOrder` mit simulierten Datenbankfehlern; genau
die Fälle aus K1. **Aufwand:** 1–2 Tage.

## M3 – Keine Schema-Validierung eingehender Daten

Kein Zod o.ä. Alle Prüfungen sind handgeschrieben
(`lib/orders/orderValidation.ts`). Das ist sorgfältig gemacht, aber jede neue
Eingabe erfordert manuelle Sorgfalt, und Typen und Laufzeitprüfung können
auseinanderlaufen.

**Lösung:** Zod-Schemata an den Serveraktionen. **Aufwand:** 1 Tag.

## M4 – Fehlende Indizes für den Adminbetrieb

Vorhanden: `orders(status, created_at)`, `order_items(order_id)`,
`configuration_elements(order_item_id)`, `order_events(order_id, at)`.

Fehlt: Index auf `orders(email)` und `orders(order_number)`. Beides sind die
natürlichen Suchfelder im Adminbereich (siehe M1). Bei 10.000 Zeilen ist ein
Full Scan noch erträglich, bei 100.000 nicht.

**Aufwand:** 30 Minuten.

## M5 – Backup unerprobt

Supabase sichert je nach Tarif automatisch. Ob der Tarif das leistet und ob
eine Wiederherstellung funktioniert, ist nie geprüft worden. Ein Backup, das
nie zurückgespielt wurde, ist kein Backup.

**Lösung:** Tarif prüfen, Testwiederherstellung in ein separates Projekt,
Ablauf dokumentieren. **Aufwand:** halber Tag.

## M6 – Verkaufspreise nicht freigegeben

25 von 43 Katalogpreisen weichen vom belegten Einkaufspreis ab. Offen sind
Stichsatz (0,10 € gegen 0,76 €/1,40 €) und Gewinnsatz (25 % ist ein Vorschlag,
keine Entscheidung).

**Go-live:** Nein – man kann nicht verkaufen, ohne die Preise entschieden zu
haben.

## M7 – EU-Lieferungen mit deutschem Steuersatz

`SHIPPING_COUNTRIES` erlaubt 26 EU-Länder, `orderStage` rechnet immer mit
19 %. Unterhalb der Lieferschwelle korrekt, darüber gilt das
Bestimmungslandprinzip (OSS).

**Lösung:** Entweder Lieferländer auf Deutschland begrenzen (ein Eintrag) oder
die Sätze in `steuer.ts` ergänzen und auf das Lieferland umstellen. Die
Struktur trägt beides.

**Aufwand:** 1 Stunde bzw. 1 Tag. **Go-live:** Begrenzung genügt vorerst.

## M8 – Steuerausweis noch nicht überall

Nach A1 fehlen: Bestellbestätigung, Adminansicht, Konfigurator und
Warenkorb. Die Bestätigung ist bei Rechnungskauf faktisch der Beleg.

**Aufwand:** 4–6 Stunden.

---

# NIEDRIG

## N1 – Markenname an 25 Stellen verdrahtet

„Embroidery Republic" steht 25-mal direkt im Code. Für das zweite Projekt
(eigene Marke, eigene Website) ist das kein Hindernis – es wird ein eigenes
System. Sollte jedoch je ein zweiter Shop aus dieser Codebasis entstehen,
wäre eine zentrale `marke.ts` der Ansatzpunkt.

**Empfehlung:** Nicht jetzt anfassen. Ausdrücklicher Wunsch: kein
Multi-Brand-Ausbau vor 1.0.

## N2 – Nicht zeitkonstanter Secret-Vergleich

`auth.ts:28` vergleicht mit `===`. Über Netzwerk kaum ausnutzbar, aber
zusammen mit H1 zu beheben.

## N3 – Unstrukturierte Logs

26 `console.error` ohne einheitliches Format, ohne Bestellbezug. Erschwert
die Fehlersuche im Betrieb. Zusammen mit H5 lösen.

## N4 – Accessibility ungeprüft

Kein Audit erfolgt. Der Konfigurator ist canvas-basiert und damit für
Screenreader grundsätzlich schwer zugänglich. Für einen Shop mit
Firmenkundschaft (teils öffentliche Auftraggeber) mittelfristig relevant.

**Aufwand:** 1 Tag Prüfung, Umsetzung je nach Befund.

---

# Was gut ist

Damit die Bewertung nicht schief wirkt – dieses Projekt liegt in mehreren
Punkten deutlich über dem, was ich in vergleichbaren Systemen sehe:

- **Preisarchitektur.** Drei getrennte Stufen, serverseitig autoritativ,
  Client-Preise werden nachweislich ignoriert. Ein Test belegt das.
- **Nachvollziehbarkeit.** Jeder Preisposten trägt Herkunft und Begründung.
  Das ist selten und im Streitfall Gold wert.
- **Fail-fast statt stiller Annahmen.** Kein hinterlegter Versandtarif,
  Steuersatz oder DTF-Bogen führt zu einer Fehlermeldung, nie zu einem
  geratenen Wert.
- **Idempotenz** über eine einzige WHERE-Bedingung statt einer
  Zustandsmaschine – schlicht und korrekt.
- **Dokumentation.** 15 Fachdokumente, die Entscheidungen *und ihre
  Begründung* festhalten, inklusive verworfener Alternativen.
- **Wächter-Tests** gegen Doppellogik (Geldformatierung, Steuersätze,
  Architekturreinheit). Sie verhindern genau die Erosion, die solche
  Systeme über Jahre zerstört.

Die technische Schuld liegt nicht in der Architektur, sondern in der
Betriebsreife: Transaktionen, Eingangsvalidierung, Überwachung, CI.

---

# Empfohlene Reihenfolge

**Vor dem Produktivstart zwingend:**

1. K1 Transaktion (4–6 h) — Datenverlustrisiko
2. K2 Upload-Validierung (3–4 h) — Angriffsfläche
3. H4 RLS `categories` (0,5 h) — trivial
4. H2 Rate-Limit Bestellungen (2 h)
5. H1 Admin-Token (2–3 h)
6. H7 Rechtstexte (1 h) + H6 DSGVO-Konzept (1 d)
7. M6 Preise freigeben — Geschäftsentscheidung
8. M7 Lieferländer begrenzen (1 h)

**Summe: rund 3 Arbeitstage** plus Ihre Entscheidungen.

**Kurz danach:**

9. H5 Monitoring · H8 CI · M8 Steuerausweis · M5 Backup-Test

**Version 1.1:** K3 Stripe · M1 Paginierung · M2 Tests · M3 Zod · M4 Indizes
