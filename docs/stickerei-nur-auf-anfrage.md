# Stickerei nur auf Anfrage – und sofortige Meldung an den Betreiber

Stand: 2026-11-08 · Entscheidung des Betreibers

## Was gilt

- **Stickerei gibt es ausschließlich auf Anfrage.** Kundschaft konfiguriert wie bisher, sieht den
  dynamisch berechneten Preis – dieser gilt aber ausdrücklich nur als **unverbindliche
  Kostenschätzung** (die Stichzahl steht erst nach der Digitalisierung fest).
- Aus Stickerei entsteht **keine Bestellung, keine automatische Auftragsannahme, keine Zahlung**.
  Ablauf: **Anfrage → manuelle Prüfung → individuelles Angebot → Auftragsbestätigung.**
- **DTF-Transferdruck** bleibt unverändert: Warenkorb → Kasse → Bestellung (Rechnung/Karte/PayPal).
- **Gemischter Warenkorb** (Druck + Stickerei): Sobald eine Position Stickerei enthält, geht der
  **gesamte** Warenkorb als Anfrage. Die Oberfläche weist darauf hin.
- **Der Betreiber wird bei jedem Eingang sofort per E-Mail informiert** (Bestellung wie Anfrage).

## Wo die Regel lebt (eine Stelle)

`src/config/bestellweg.ts` – `NUR_AUF_ANFRAGE`, `istNurAufAnfrage()`, `warenkorbNurAlsAnfrage()`.
Soll eine weitere Veredelungsart nur auf Anfrage laufen, genügt ein Eintrag dort.

| Schicht | Datei | Verhalten |
|---|---|---|
| Server (maßgeblich) | `lib/orders/orderValidation.ts` | `submitOrder` mit Stickerei → Befund `nur_auf_anfrage`, steht an erster Stelle |
| Konfigurator | `SummaryPanel.tsx`, `KonfigUebersicht.tsx`, `Stepper.tsx`, `MethodSwitcher.tsx` | „Geschätzter Gesamtpreis (unverbindlich)“, „Zur Anfrage hinzufügen“, „Bereit zur Anfrage“ |
| Warenkorb | `CartDrawer.tsx` | keine Kasse, „Anfrage senden“, Hinweis; Stickerei-Anfrage leert den Warenkorb |
| Texte | `lib/i18n/translations.ts` (DE/EN), `app/agb`, `app/faq` | siehe Textfreigabe in der Konversation vom 2026-11-08 |

Die Anfrage selbst (`submitInquiry`) war schon vorhanden und bleibt technisch unverändert: gleiche
Datenhaltung (`orders.order_type = 'inquiry'`), gleiche serverseitige Preisberechnung, gleiches
Produktionsblatt. Anfragen erscheinen im Adminbereich neben den Bestellungen.

## Meldung an den Betreiber

- **Sofort** statt nach der Stornofrist: `INTERNE_BENACHRICHTIGUNG_VERZOEGERUNG_MS = 0`
  (`config/orderProcess.ts`). Vorher kam die Meldung zu *Bestellungen* erst nach 2 Stunden;
  Anfragen gingen schon immer sofort.
- **Inhalt** (`templates/InternalOrderNotificationEmail.tsx`): Kunde (Name, Firma, E-Mail, Telefon,
  bei Bestellungen Lieferadresse, USt-IdNr.), Nachricht, je Position Produkt/Farbe/Veredelung/
  Größen/Menge, je Motiv Position, Maße, bei Stickerei geschätzte Stichzahl, **Link auf die
  Originaldatei** (7 Tage gültig), Preis (Anfrage: „Geschätzter Gesamtpreis (unverbindlich)“,
  Bestellung: Zwischensumme, Versand, Gesamtsumme), Link auf das Produktionsblatt.
- **Antworten** auf diese Mail gehen direkt an die Kundschaft (`replyTo`) – so entsteht das
  individuelle Angebot.
- **Bestellung innerhalb der Stornofrist storniert:** Die Eingangsmeldung nennt das Fristende
  („erst danach beschaffen“); bei einer Selbststornierung folgt die Mail „Bestellung storniert“
  (`templates/InternalOrderCancelledEmail.tsx`). Eine noch *geplante* Meldung (Altbestand) wird
  weiterhin zurückgezogen.
- **Keine Doppelmeldung:** Der Marker `orders.internal_notification_email_id` gilt jetzt auch für
  Anfragen. Vorher hätte eine wiederholte Absendung derselben Anfrage zwei Mails ausgelöst.

## Kundenmail zur Anfrage

`OrderConfirmationEmail` unterscheidet bei Stickerei-Anfragen: „Geschätzter Preis (unverbindliche
Kostenschätzung)“ und der Absatz „So geht es weiter“. Anfragen mit reinem Druck bleiben wie bisher.

## Bewusst offen

- **AGB § 8 (Stornierung)** regelt die Zwei-Stunden-Frist für Bestellungen über den Konfigurator.
  Wie lange ein Kunde nach Annahme eines Stickerei-Angebots zurücktreten kann, legt der Betreiber im
  Angebot bzw. in der Auftragsbestätigung fest – dafür gibt es noch keine AGB-Regel.
- **Marketingmaterial** (Beitrag „Erst den Preis sehen. Dann bestellen.“ u. a. in
  `docs/marketing/`) ist auf Stickerei noch nicht angepasst.
- **Angebotserstellung** ist manuell (Antwort auf die Eingangsmail); ein Angebotswerkzeug im
  Adminbereich gibt es nicht.

## Testen

`npm test` (u. a. `config/__tests__/bestellweg.test.ts`, `orders/__tests__/orderValidation.test.ts`,
`orders/__tests__/sofortigeMeldung.test.ts`, `email/__tests__/betreiberBenachrichtigung.test.ts`).
**Keine Test-Bestellungen gegen die Produktionsdatenbank absenden:** Der Testmodus fängt nur
E-Mails, Dateien und Lieferantenaufträge ab, die Datenbank bleibt echt.

## Pause: Stickerei vorübergehend abgeschaltet (seit 2026-11-11)

Auf Wunsch des Betreibers wird Stickerei wegen Wartungs- und Umbauarbeiten vorübergehend nicht angeboten. Der Schalter liegt
an EINER Stelle: `BETRIEBSSCHALTER.pausierteVeredelungen` in `src/config/bestellweg.ts` (ausgeliefert: `['embroidery']`).

| Wo | Verhalten solange pausiert |
| --- | --- |
| Konfigurator, Methodenwahl | Kachel „Stickerei“ ist ausgegraut (halb durchsichtig), nicht klickbar; darunter ein gut lesbarer Hinweis |
| Gespeicherter Konfigurator-Stand, „Bearbeiten“ aus dem Warenkorb | fällt auf DTF zurück (`erlaubteVeredelung`) |
| Warenkorb | Positionen mit Stickerei tragen den Hinweis „Derzeit nicht verfügbar“; „Anfrage senden“ bzw. „Zur Kasse“ sind gesperrt, bis sie entfernt sind; DTF-Positionen lassen sich danach bestellen |
| Server (`validateSubmission`) | Bestellung UND Anfrage mit Stickerei werden abgelehnt (Code `veredelung_pausiert`), auch bei manipuliertem Client |
| Unverändert | DTF-Bestellprozess, Preise, Kontaktformular, Rechtstexte, Marketingtexte |

**Wieder einschalten:** `pausierteVeredelungen` auf `[]` setzen und ausliefern. Dann gilt wieder „Stickerei nur auf Anfrage“ (siehe oben).
Abgesichert durch `src/config/__tests__/stickereiPause.test.ts`.
