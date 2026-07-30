# Soft-Launch-Checkliste — Embroidery Republic Germany

Stand: Juli 2026. Grundlage ist eine **reale End-to-End-Prüfung** der laufenden
Anwendung (echte Bestellungen, echter E-Mail-Versand, echte Datenbank), nicht
eine Code-Durchsicht. Punkte, die nachweislich funktionieren, sind ausdrücklich
als erledigt markiert.

---

## ✅ Nachweislich erledigt (real getestet)

| Bereich | Nachweis |
|---|---|
| **Produktions-Build** | `npm run build` erfolgreich, 16 Seiten generiert |
| **Statische Qualität** | TypeScript 0 Fehler, ESLint 0 Fehler, 100/100 Tests grün |
| **Alle Seiten erreichbar** | `/`, `/faq`, `/ueber-uns`, `/kontakt`, `/impressum`, `/agb`, `/datenschutz`, `/admin` → HTTP 200 |
| **Bestellung E2E** | `ER-2026-33AF40` angelegt, gespeichert, bestätigt |
| **Serverseitige Preisberechnung** | Manipulierter Client-Preis (1 €) ignoriert → korrekt 74,92 € |
| **Versandkosten** | DE 50 €→7,99 · DE 75 €→frei · AT 99 €→11,99 · AT 100 €→frei · CH→abgelehnt (kein Tarif) |
| **Bestellmenge** | ab 1 Stück – keine Mindestmenge; Rüstkosten einmalig je Position |
| **E-Mail-Versand** | Kundenbestätigung + interne Benachrichtigung über eigene verifizierte Domain, mit Resend-IDs |
| **Absenderdomain** | `info@send.embroidery-republic.com` (DKIM/SPF verifiziert), Reply-To `info@ergermany.de` |
| **Produktionsblatt (PDF)** | erzeugt in ~350–580 ms, in Storage abgelegt |
| **Unverbindliche Anfrage** | `ER-2026-389E78` inkl. beider E-Mails |
| **Kontaktformular** | real abgesendet → `POST /kontakt 200`, E-Mail zugestellt (ID `e1bccd5a…`) |
| **Lieferanten-Einreihung** | +1 Auftrag automatisch erzeugt (Gildan G5000 → textil-grosshandel) |
| **Datenbank-Sicherheit (RLS)** | Öffentlicher Schlüssel kann **weder einfügen noch lesen** — verifiziert |
| **Bestellperformance** | 3,3 s (vorher 32 s) |
| **Rechtstexte** | Impressum, AGB, Datenschutz vollständig, konsistent, ohne kundensichtbare Platzhalter |

---

## 🔴 Kritisch — muss vor dem Launch behoben werden

**K1 — USt-IdNr. bzw. Steuernummer fehlt.**
Pflichtangabe im Impressum (§ 5 DDG) und auf jeder Rechnung. Im Impressum
sichtbar als offener Punkt markiert. → *Nur von dir zu ergänzen.*

**K2 — Umsatzsteuerliche Preisauszeichnung ungeklärt.**
AGB § 4 lässt offen, ob die angezeigten Preise netto oder brutto sind bzw. ob
§ 19 UStG (Kleinunternehmer) gilt. Bei Verkauf an Verbraucher ist die
Bruttopreis-Auszeichnung Pflicht (PAngV). Betrifft auch alle Preise im
Konfigurator. → *Entscheidung + ggf. Anpassung der Preisanzeige.*

**K3 — Hosting nicht entschieden / nicht deployt.**
Die Anwendung läuft ausschließlich lokal. Ohne Hosting kein Launch. Betrifft
zusätzlich: Datenschutzerklärung (Anbieter + Serverstandort sind Pflichtangaben)
und `metadataBase` (siehe H1).

**K4 — Testdaten in der Produktivdatenbank.**
20 Bestellungen und 7 Lieferantenaufträge — überwiegend Testläufe. Vor dem
Launch bereinigen, sonst verfälschen sie Auswertungen und der Adminbereich
startet unübersichtlich. → *Von dir freizugeben (Löschen ist irreversibel).*

---

## 🟠 Hoch — sollte vor dem Launch behoben werden

**H1 — `metadataBase` nicht gesetzt.**
Build-Warnung: Vorschaubilder für Social/Messenger lösen auf
`http://localhost:3000` auf. Beim Teilen des Shops erscheint kein Bild.
Einzeiler in `layout.tsx`, sobald die Domain feststeht.

**H2 — Kein Missbrauchsschutz auf dem Bestellformular.**
Das Kontaktformular hat Honeypot + Rate-Limit, der **Bestell-/Anfrageweg nicht**.
Jede Absendung löst E-Mails, Storage-Uploads und PDF-Erzeugung aus (Body bis
15 MB). Ohne Bremse ist das ein Kosten- und Spam-Risiko.

**H3 — ~~Lieferantenautomatisierung~~ → erledigt, real verifiziert.**
Der komplette Ablauf läuft über den Produktionspfad durch: Testbestellung →
automatische Einreihung → Cron-Endpoint → Playwright → Login → Produkt → Farbe
→ Größen → Warenkorb. Verifiziert mit **ER-2026-D5EDB5** (zwei Größen) und
**ER-2026-03C705** (eine Größe), beide `cart_prepared` im ersten Versuch.
Behoben wurden dabei vier Konfigurations- und **drei echte Code-Fehler**
(abgefangener Login-Klick; `fill()` ohne Tastatur-Ereignisse ⇒
Einzelgrößen-Bestellungen scheiterten; **der befüllte Warenkorb überlebte die
Browser-Sitzung nicht** ⇒ neuer Pflichtschritt `confirmCart`). Details:
`docs/tg-automatisierung-ursachenanalyse.md`. Es wird weiterhin ausschließlich
der Warenkorb befüllt, **keine Bestellung ausgelöst**.

**H3b — needen: Warenkorb-Nachweis fehlt.** Für needen ist kein
`cartConfirmationPlan` hinterlegt (Warenkorbseite hinter dem Login, keine
Zugangsdaten). Damit ist **nicht belegt**, dass ein befüllter needen-Warenkorb
die Sitzung überdauert — bei textil-grosshandel tat er das ohne diesen Schritt
nachweislich nicht. Der Lauf meldet dort `not_implemented` statt Erfolg.

**H4 — Keine Fehler-Benachrichtigung.**
Schlägt eine Lieferantenbestellung dauerhaft fehl oder bricht der E-Mail-Versand
ab, erfährt das niemand aktiv — es steht nur im Server-Log. Bei kleinem
Bestellvolumen durch tägliche Admin-Kontrolle ersetzbar.

**H5 — 13 Fruit-of-the-Loom-Produkte ohne Lieferantenzuordnung.**
Bestellungen darauf werden gespeichert, erzeugen aber **keinen**
Lieferantenauftrag (real beobachtet). Bis zur Zuordnung müssen diese Aufträge
manuell beschafft werden — oder die Produkte vorerst ausblenden.

---

## 🟡 Mittel — kann nach dem Launch erfolgen

**M1 — 22 unverifizierte Farben** im Coverage-Report (Nutzer-Entscheidungen,
z. B. mehrere Blau-/Schwarztöne bei AWDis). Betrifft nur die automatische
Lieferantenbestellung, nicht den Verkauf.

**M2 — Schweiz nicht bestellbar.** Aus der Länderauswahl entfernt, da kein
Versandtarif definiert (kein EU-Mitglied). Sobald du einen Satz nennst,
wieder aktivierbar.

**M3 — Keine Content-Security-Policy.** Übrige Sicherheitsheader sind gesetzt.
CSP muss gegen Canvas/`data:`-URLs getestet werden.

**M4 — Kein Scheduler für den Cron-Endpoint.** `CRON_SECRET` ist gesetzt, der
Endpoint ist scharf. Lokal gibt es aber naturgemäß keinen Scheduler, der ihn
regelmäßig aufruft — die Verarbeitung wird bis zum Hosting per Admin-Klick
bzw. `curl` ausgelöst.

**M5 — Rechnungsstellung ist manuell.** Die Anwendung erzeugt keine Rechnung;
sie wird laut AGB separat übermittelt. Für den Start bewusst so.

**M6 — Online-Zahlung fehlt** (Stripe pausiert). Rechnungskauf ist als
alleinige Zahlart sauber umgesetzt und kommuniziert.

---

## 🟢 Niedrig — reine Verbesserungen

**N1 — Admin-Anmeldung** nutzt das Passwort direkt als Cookie-Wert. Für einen
Einzel-Admin akzeptabel; ein signiertes Session-Token wäre sauberer.

**N2 — Info-/Rechtsseiten nur auf Deutsch**, obwohl die Oberfläche DE/EN kann.

**N3 — Logo fehlt in E-Mails.** Benötigt eine absolute URL, also die Live-Domain.

**N4 — Ungenutzte DB-Tabellen** (`brands`, `products` …) aus Migration 0001;
der Katalog liegt in TypeScript.

**N5 — Werbeaussagen bestätigen.** „Veredelung in Deutschland",
„Kostenlose Designprüfung", „Produktion 3–4 Werktage" — inhaltlich von dir
freizugeben.

---

## Realistische Einschätzung

Technisch ist die Plattform **launchfähig**: Bestellprozess, Preis- und
Versandberechnung, E-Mail-Versand, PDF, Datenbank und Absicherung funktionieren
nachweislich fehlerfrei.

Die verbleibenden kritischen Punkte sind **keine Softwarefehler**, sondern
Geschäfts- und Betriebsentscheidungen: Steuernummer, Umsatzsteuer-Auszeichnung,
Hosting und Testdaten-Bereinigung. Von den vier kritischen Punkten sind drei
reine Dateneingaben.

**Empfehlung für den Soft Launch:** K1–K4 abarbeiten, H1 und H2 mitnehmen
(beide klein), H3/H5 bewusst mit manueller Lieferantenbestellung überbrücken.
Alles Weitere kann im laufenden Betrieb folgen.
