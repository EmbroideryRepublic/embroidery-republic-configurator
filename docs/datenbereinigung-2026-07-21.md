# Datenbereinigung: Testbestellungen entfernt (21.07.2026)

## Was entfernt wurde

**19 Bestellungen** aus Entwicklungs- und Abnahmeläufen vom 17.–20. Juli 2026,
samt zugehöriger Positionen, Motive und Historie (23 Positionen, 19 Motive,
13 Ereignisse – über `ON DELETE CASCADE`).

| Datum | Kundenname | Adresse | Anlass |
|---|---|---|---|
| 17.07. 09:22 | E2E Test | ihsanuzun@live.de | Abnahmelauf |
| 17.07. 14:15 | Error Test | ihsanuzun@live.de | Fehlerpfad geprüft |
| 17.07. 14:24 | Stage D | ihsanuzun@live.de | Stufenabnahme |
| 17.07. 14:55 | Email Test | ihsanuzun@live.de | E-Mail-Versand geprüft |
| 17.07. 15:44 | Stufe A-Test | ihsanuzun@live.de | Stufenabnahme |
| 17.07. 16:49 | FOTL Pilot-Test | ihsanuzun@live.de | Produktpilot |
| 18.07. 21:17 | Supplier-Engine Test | ihsanuzun@live.de | Lieferantenautomatik |
| 19.07. 05:12 | Auto Test | auto-test@example.com | automatisierter Lauf |
| 19.07. 09:00 | E2E Test | …@embroidery-republic.test | Abnahmelauf |
| 19.07. 09:02 | E2E Test | …@embroidery-republic.test | Abnahmelauf |
| 19.07. 18:25 | Test Bestellung | info@embroidery-republic.com | manuelle Prüfung |
| 19.07. 18:28 | Audit Test | info@embroidery-republic.com | Anfrage, 0 € |
| 19.07. 19:01 | TG-E2E Testlauf | info@embroidery-republic.com | Lieferantenanbindung |
| 19.07. 19:25 | TG-E2E Einzelgroesse | info@embroidery-republic.com | Lieferantenanbindung |
| 19.07. 19:42 | TG-E2E Audit | info@embroidery-republic.com | Lieferantenanbindung |
| 19.07. 20:03 | TG-E2E Warenkorbnachweis | info@embroidery-republic.com | Lieferantenanbindung |
| 20.07. 09:43 | Storno Testfall1 | info@embroidery-republic.com | Stornoablauf |
| 20.07. 10:11 | Ereignis Testfall2 | info@embroidery-republic.com | Historie |
| 20.07. 10:14 | Lieferantenstart Testfall3 | info@embroidery-republic.com | Lieferantenauslösung |

## Warum

Diese Datensätze stammen aus der Zeit vor dem Testmodus. Damals erzeugte jede
Abnahme eine echte Bestellung in der Datenbank. Sie erschienen im
Adminbereich zwischen den echten Vorgängen und hätten jede Auswertung
verfälscht – bei der Zahlungsabwicklung wären sie zusätzlich in Umsatzzahlen
eingeflossen.

Seit dem Testmodus tritt das nicht mehr auf: `npm run test:e2e` räumt seine
Bestellung selbst wieder ab (siehe `docs/testmodus-und-abnahme.md`).

## Wie – und was dagegen sprach, es einfacher zu machen

Gelöscht wurde über eine **explizite Namensliste**
(`scripts/entferneTestbestellungen.mjs`), nicht über ein Suchmuster. Ein
Muster wie `%Test%` träfe irgendwann eine echte Kundin namens „Testorf" –
und niemandem fiele es auf.

Vier Vorkehrungen:

1. **Geschützte Namen brechen ab.** Wäre „Ihsan Uzun" oder
   „Embroidery Republic" in der Auswahl gelandet, hätte das Skript
   abgebrochen statt gelöscht.
2. **Anzahlprüfung.** Weicht die gefundene Menge von den erwarteten 19 ab,
   Abbruch – der Bestand könnte sich geändert haben.
3. **Sicherung vor dem Löschen.** Vollständiger JSON-Export aller betroffenen
   Datensätze inklusive Positionen, Motive und Historie. Der erste Lauf
   brach ab, weil das Sicherungsverzeichnis fehlte – genau wie vorgesehen.
4. **Eine Transaktion.** Ein Fehler hätte alles zurückgerollt.

## Ergebnis

| | vorher | nachher |
|---|---|---|
| Bestellungen | 29 | **10** |
| Summe | 8.575,89 € | **5.705,34 €** |
| verwaiste Positionen/Ereignisse | – | **0** |

**Unberührt geblieben** sind alle 10 Bestellungen unter „Ihsan Uzun" und
„Embroidery Republic" mit echter Lieferadresse (Sandweg 148, Köln) – darunter
die Bestellung vom 21.07. über 548,48 €, die nach der Migration aufgegeben
wurde und bereits `payment_method = 'invoice'` trägt.

Die Sicherung liegt außerhalb des Projektverzeichnisses (Arbeitsverzeichnis
dieser Sitzung) und enthält Kundendaten – sie gehört nicht ins Repository.
