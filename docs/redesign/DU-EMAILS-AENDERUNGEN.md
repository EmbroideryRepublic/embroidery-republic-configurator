# Du-Ansprache in den Kunden-E-Mails – alle Änderungen

Stand 25.11.2026, Branch `arbeit-du-6`. Auftrag des Betreibers (Punkt 6 der Wortlaut-Freigabe `WORTLAUT-ZUR-FREIGABE-DU.md`): Die E-Mails an die Kundschaft sprechen jetzt per Du, damit Bestellablauf (Shop und Mails) einheitlich ist. **Der Inhalt ist unverändert**, geändert wurde nur die Anrede (Pronomen, Verbformen, Imperative, Possessiva). Regeln: `DU-ANSPRACHE-REGELN.md` (du/dein im Satz klein, groß nur am Satzanfang, auch nach „Gute Nachrichten:“ wie im übrigen Shop, z. B. „Deine Bestellung ist unterwegs.“).

Geprüft: `npx tsc --noEmit` (0 Fehler), `npx eslint` auf alle 22 geänderten Dateien (0 Meldungen), `npm test` (1.711 von 1.711 Tests grün).

Für jede Mail gilt: **Betreff, Titel im Mailkopf und Vorschautext (Preheader) sind in diesem Projekt derselbe Text** (`previewText={title}`). Eine Zeile unten gilt daher für alle drei.

## 1. Betreffzeilen

| Datei | vorher | nachher |
|---|---|---|
| `src/lib/email/orderEmails.tsx` (Anfrage nur Stickerei) | Ihre Anfrage {Nr.} ist eingegangen | Deine Anfrage {Nr.} ist eingegangen |
| `src/lib/email/orderEmails.tsx` (übrige Anfragen) | Ihre Anfrage {Nr.} | Deine Anfrage {Nr.} |
| `src/lib/email/orderEmails.tsx` (Versand) | Ihre Bestellung {Nr.} ist unterwegs | Deine Bestellung {Nr.} ist unterwegs |
| `src/lib/email/orderEmails.tsx` (In Produktion) | Ihre Bestellung {Nr.} ist in Produktion | Deine Bestellung {Nr.} ist in Produktion |
| `src/lib/email/contactEmails.tsx` (Kontakt-Autoreply) | Ihre Nachricht ist bei uns angekommen | Deine Nachricht ist bei uns angekommen |
| `src/lib/actions/konto.ts` (Konto bestätigen) | Bitte bestätigen Sie Ihre E-Mail-Adresse | Bitte bestätige deine E-Mail-Adresse |
| `src/lib/actions/konto.ts` (Passwort ändern im Profil und per „Passwort vergessen“, 2 Stellen) | Ihr Passwort wurde geändert | Dein Passwort wurde geändert |

Betreffzeilen **ohne** Anrede, daher unverändert: „Bestellbestätigung {Nr.}“, „Bitte Druckvorschau für {Nr.} freigeben“, „Stornierung bestätigt: {Nr.}“, „Bestellung {Nr.} abgeschlossen“, „Zahlung nicht erfolgreich: {Nr.}“ (`paymentService.ts`), „Rechnung {Rechnungsnr.} zu Bestellung {Nr.}“ (`orderCompletion.ts`), „Passwort zurücksetzen“, „Willkommen bei Embroidery Republic“, „Newsletter-Anmeldung bestätigt“.

## 2. Titel (= Mailkopf und Vorschautext) und Mailtexte

Alle Pfade unter `src/lib/email/templates/`. „Anfrage“ = Anfrage-Variante der Bestätigung, „Bestellung“ = Bestell-Variante.

### OrderConfirmationEmail.tsx (Bestellbestätigung / Anfrage-Eingang)

| Stelle | vorher | nachher |
|---|---|---|
| Titel Anfrage | Ihre Anfrage {Nr.} | Deine Anfrage {Nr.} |
| Einleitung Bestellung | Vielen Dank für Ihre Bestellung! Wir haben sie unter der Nummer {Nr.} erhalten und beginnen mit der Produktion, sobald alles final geprüft ist. | Vielen Dank für deine Bestellung! Wir haben sie unter der Nummer {Nr.} erhalten und beginnen mit der Produktion, sobald alles final geprüft ist. |
| Einleitung Anfrage (Stickerei) | Vielen Dank für Ihre Anfrage! Sie ist bei uns eingegangen und wird jetzt von uns geprüft. Diese E-Mail bestätigt nur den Eingang – sie ist keine Auftragsbestätigung. Bis dahin ist nichts bestellt, nichts bezahlt und kein Vertrag geschlossen. | Vielen Dank für deine Anfrage! Sie ist bei uns eingegangen und wird jetzt von uns geprüft. Diese E-Mail bestätigt nur den Eingang – sie ist keine Auftragsbestätigung. Bis dahin ist nichts bestellt, nichts bezahlt und kein Vertrag geschlossen. |
| Einleitung Anfrage (Druck) | Vielen Dank für Ihre Anfrage! Wir melden uns in Kürze persönlich bei Ihnen. Bis dahin ist nichts verbindlich bestellt und nichts bezahlt. | Vielen Dank für deine Anfrage! Wir melden uns in Kürze persönlich bei dir. Bis dahin ist nichts verbindlich bestellt und nichts bezahlt. |
| Überblick (Stickerei) | Ihre Anfrage im Überblick – alle Preise sind unverbindliche Schätzwerte: | Deine Anfrage im Überblick – alle Preise sind unverbindliche Schätzwerte: |
| So geht es weiter (Stickerei) | So geht es weiter: Wir prüfen Ihre Anfrage und kalkulieren den endgültigen Preis – bei Stickerei steht die genaue Stichzahl erst fest, wenn Ihr Motiv digitalisiert ist. Anschließend senden wir Ihnen ein individuelles, verbindliches Angebot. Ein Vertrag kommt erst zustande, wenn Sie dieses Angebot annehmen und wir den Auftrag bestätigen. | So geht es weiter: Wir prüfen deine Anfrage und kalkulieren den endgültigen Preis – bei Stickerei steht die genaue Stichzahl erst fest, wenn dein Motiv digitalisiert ist. Anschließend senden wir dir ein individuelles, verbindliches Angebot. Ein Vertrag kommt erst zustande, wenn du dieses Angebot annimmst und wir den Auftrag bestätigen. |
| Anmerkung (Bestellung) | Ihre Anmerkung zur Bestellung ist bei uns angekommen. | Deine Anmerkung zur Bestellung ist bei uns angekommen. |
| Nachricht (Anfrage) | Ihre Nachricht ist bei uns angekommen. | Deine Nachricht ist bei uns angekommen. |
| Rechnung mit PDF | Zahlungsart: Kauf auf Rechnung. Die Rechnung {Rechnungsnr.} finden Sie als PDF im Anhang dieser E-Mail; sie ist innerhalb von {n} Tagen ab Rechnungsdatum ohne Abzug zu begleichen. | Zahlungsart: Kauf auf Rechnung. Die Rechnung {Rechnungsnr.} findest du als PDF im Anhang dieser E-Mail; sie ist innerhalb von {n} Tagen ab Rechnungsdatum ohne Abzug zu begleichen. |
| Rechnung ohne PDF | Zahlungsart: Kauf auf Rechnung. Die Rechnung senden wir Ihnen separat mit der Auftragsbearbeitung zu; sie ist innerhalb von {n} Tagen ab Rechnungsdatum ohne Abzug zu begleichen. | Zahlungsart: Kauf auf Rechnung. Die Rechnung senden wir dir separat mit der Auftragsbearbeitung zu; sie ist innerhalb von {n} Tagen ab Rechnungsdatum ohne Abzug zu begleichen. |
| Zahlung eingegangen | Zahlung eingegangen. Ihre Zahlung per {Zahlart} über {Betrag} ist bei uns eingegangen – vielen Dank! | Zahlung eingegangen. Deine Zahlung per {Zahlart} über {Betrag} ist bei uns eingegangen – vielen Dank! |
| Zahlung, Rechnung mit PDF | Die Rechnung {Rechnungsnr.} finden Sie als PDF im Anhang dieser E-Mail. | Die Rechnung {Rechnungsnr.} findest du als PDF im Anhang dieser E-Mail. |
| Zahlung, Rechnung später | Die Rechnung erhalten Sie in Kürze in einer separaten E-Mail. | Die Rechnung erhältst du in Kürze in einer separaten E-Mail. |
| Stornofrist | Sie können diese Bestellung noch stornieren. Innerhalb von {n} Stunden nach Bestelleingang können Sie sie ohne Angabe von Gründen selbst stornieren – es entstehen Ihnen dann keine Kosten. Nach Ablauf dieser Frist beginnen wir mit der Bearbeitung und beschaffen die Ware; eine Selbststornierung ist dann nicht mehr möglich. | Du kannst diese Bestellung noch stornieren. Innerhalb von {n} Stunden nach Bestelleingang kannst du sie ohne Angabe von Gründen selbst stornieren – es entstehen dir dann keine Kosten. Nach Ablauf dieser Frist beginnen wir mit der Bearbeitung und beschaffen die Ware; eine Selbststornierung ist dann nicht mehr möglich. |
| Link-Zeile | Ihre Bestellung ansehen und bei Bedarf stornieren: {Link} | Deine Bestellung ansehen und bei Bedarf stornieren: {Link} |

### OrderProofRequestEmail.tsx (Freigabe der Druckvorschau / Korrekturabzug)

| Stelle | vorher | nachher |
|---|---|---|
| Absatz 1 | Für Ihre Bestellung {Nr.} liegt jetzt die finale Druckvorschau vor – so, wie Ihre Motive tatsächlich auf dem Kleidungsstück platziert werden. | Für deine Bestellung {Nr.} liegt jetzt die finale Druckvorschau vor – so, wie deine Motive tatsächlich auf dem Kleidungsstück platziert werden. |
| Absatz 2 | Bitte sehen Sie sich die Vorschau kurz an und geben Sie sie frei, damit wir mit der Produktion beginnen können: | Bitte sieh dir die Vorschau kurz an und gib sie frei, damit wir mit der Produktion beginnen können: |
| Hinweis | Passt etwas nicht, können Sie dort statt der Freigabe auch eine Änderung wünschen – wir melden uns dann umgehend bei Ihnen. | Passt etwas nicht, kannst du dort statt der Freigabe auch eine Änderung wünschen – wir melden uns dann umgehend bei dir. |

### OrderInProductionEmail.tsx

| Stelle | vorher | nachher |
|---|---|---|
| Titel | Ihre Bestellung {Nr.} ist in Produktion | Deine Bestellung {Nr.} ist in Produktion |
| Absatz 1 | Gute Nachrichten: Wir haben mit der Fertigung Ihrer Bestellung {Nr.} begonnen. | Gute Nachrichten: Wir haben mit der Fertigung deiner Bestellung {Nr.} begonnen. |
| Absatz 2 | Sobald die Ware versandbereit ist, erhalten Sie von uns eine Versandbestätigung mit Sendungsverfolgung. | Sobald die Ware versandbereit ist, erhältst du von uns eine Versandbestätigung mit Sendungsverfolgung. |

### OrderShippedEmail.tsx

| Stelle | vorher | nachher |
|---|---|---|
| Titel | Ihre Bestellung {Nr.} ist unterwegs | Deine Bestellung {Nr.} ist unterwegs |
| Absatz 1 | Gute Nachrichten: Ihre Bestellung {Nr.} hat unser Haus verlassen und ist auf dem Weg zu Ihnen. | Gute Nachrichten: Deine Bestellung {Nr.} hat unser Haus verlassen und ist auf dem Weg zu dir. |
| Hinweis | Sollte etwas nicht stimmen, melden Sie sich bitte kurz bei uns — wir kümmern uns darum. | Sollte etwas nicht stimmen, melde dich bitte kurz bei uns — wir kümmern uns darum. |

### OrderCompletedEmail.tsx (Abgeschlossen)

| Stelle | vorher | nachher |
|---|---|---|
| Absatz 1 | Ihre Bestellung {Nr.} ist abgeschlossen. Wir hoffen, die Ware gefällt Ihnen! | Deine Bestellung {Nr.} ist abgeschlossen. Wir hoffen, die Ware gefällt dir! |
| Absatz 2 | Sollte doch einmal etwas nicht passen, melden Sie sich bitte zeitnah bei uns – wir finden eine Lösung. | Sollte doch einmal etwas nicht passen, melde dich bitte zeitnah bei uns – wir finden eine Lösung. |
| Schlusszeile | Vielen Dank für Ihr Vertrauen in Embroidery Republic – wir freuen uns auf die nächste Bestellung. | Vielen Dank für dein Vertrauen in Embroidery Republic – wir freuen uns auf die nächste Bestellung. |

### OrderCancellationEmail.tsx (Storno)

| Stelle | vorher | nachher |
|---|---|---|
| Absatz 1 | Ihre Bestellung {Nr.} wurde am {Datum} storniert. | Deine Bestellung {Nr.} wurde am {Datum} storniert. |
| Absatz 2 (nichts bezahlt) | Es entstehen Ihnen dadurch keine Kosten. Eine Rechnung wird nicht gestellt, und wir beschaffen keine Ware für diesen Auftrag. | Es entstehen dir dadurch keine Kosten. Eine Rechnung wird nicht gestellt, und wir beschaffen keine Ware für diesen Auftrag. |
| Absatz 3 | Falls Sie die Bestellung versehentlich storniert haben oder etwas anpassen möchten, geben Sie uns gern kurz Bescheid – wir helfen Ihnen weiter. | Falls du die Bestellung versehentlich storniert hast oder etwas anpassen möchtest, gib uns gern kurz Bescheid – wir helfen dir weiter. |

(Der Absatz 2 bei bereits bezahlter Bestellung – „Der bereits gezahlte Betrag wird vollständig zurückerstattet. …“ – enthält keine Anrede und ist unverändert.)

### PaymentFailedEmail.tsx (Zahlung fehlgeschlagen)

| Stelle | vorher | nachher |
|---|---|---|
| Absatz 1 | Die Zahlung für Ihre Bestellung {Nr.} konnte leider nicht abgeschlossen werden – sei es durch einen Abbruch, eine Ablehnung durch Ihre Bank oder eine Zeitüberschreitung. | Die Zahlung für deine Bestellung {Nr.} konnte leider nicht abgeschlossen werden – sei es durch einen Abbruch, eine Ablehnung durch deine Bank oder eine Zeitüberschreitung. |
| Absatz 2 | Keine Sorge: Es wurde nichts abgebucht und es läuft noch keine Produktion. Sie können es gern erneut versuchen. | Keine Sorge: Es wurde nichts abgebucht und es läuft noch keine Produktion. Du kannst es gern erneut versuchen. |

### InvoiceEmail.tsx (Rechnung per Mail, Nachtragsmail)

| Stelle | vorher | nachher |
|---|---|---|
| Text | Zu Ihrer Bestellung {Nr.} finden Sie anbei die Rechnung {Rechnungsnr.} vom {Datum} als PDF. | Zu deiner Bestellung {Nr.} findest du anbei die Rechnung {Rechnungsnr.} vom {Datum} als PDF. |

### ContactAutoReplyEmail.tsx (Kontakt-Autoreply)

| Stelle | vorher | nachher |
|---|---|---|
| Titel | Ihre Nachricht ist bei uns angekommen | Deine Nachricht ist bei uns angekommen |
| Anrede | Hallo {Name}, | unverändert (Hallo {Name},) – war schon duz-tauglich |
| Absatz | vielen Dank für Ihre Nachricht. Wir melden uns persönlich bei Ihnen zurück – in der Regel innerhalb eines Werktags. | vielen Dank für deine Nachricht. Wir melden uns persönlich bei dir zurück – in der Regel innerhalb eines Werktags. |
| Telefon | Bei dringenden Fragen erreichen Sie uns auch telefonisch: {Telefon} | Bei dringenden Fragen erreichst du uns auch telefonisch: {Telefon} |

### KontoBestaetigenEmail.tsx (Konto bestätigen)

| Stelle | vorher | nachher |
|---|---|---|
| Titel | Bitte bestätigen Sie Ihre E-Mail-Adresse | Bitte bestätige deine E-Mail-Adresse |
| Absatz 1 | Vielen Dank für Ihre Registrierung bei Embroidery Republic! Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren. | Vielen Dank für deine Registrierung bei Embroidery Republic! Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren. |
| Link-Hinweis | Funktioniert die Schaltfläche nicht? Kopieren Sie diesen Link in Ihren Browser: | Funktioniert die Schaltfläche nicht? Kopiere diesen Link in deinen Browser: |
| Hinweis | Haben Sie sich nicht registriert? Dann können Sie diese Nachricht ignorieren – es wurde kein Konto ohne diesen Bestätigungsschritt angelegt. | Hast du dich nicht registriert? Dann kannst du diese Nachricht ignorieren – es wurde kein Konto ohne diesen Bestätigungsschritt angelegt. |

### KontoWillkommenEmail.tsx (Willkommen)

| Stelle | vorher | nachher |
|---|---|---|
| Absatz 1 | Ihre E-Mail-Adresse ist bestätigt und Ihr Konto ist ab sofort einsatzbereit. Sie können jetzt Adressen hinterlegen, Ihre Bestellungen an einem Ort verfolgen und beim nächsten Einkauf schneller zur Kasse gehen. | Deine E-Mail-Adresse ist bestätigt und dein Konto ist ab sofort einsatzbereit. Du kannst jetzt Adressen hinterlegen, deine Bestellungen an einem Ort verfolgen und beim nächsten Einkauf schneller zur Kasse gehen. |
| Hinweis | Hinweis: Ein Konto ist bei uns nie Voraussetzung fürs Bestellen – Sie können jederzeit auch als Gast bestellen. Das Konto ist ein zusätzlicher, bequemer Weg, keine Pflicht. | Hinweis: Ein Konto ist bei uns nie Voraussetzung fürs Bestellen – du kannst jederzeit auch als Gast bestellen. Das Konto ist ein zusätzlicher, bequemer Weg, keine Pflicht. |

### PasswortVergessenEmail.tsx

| Stelle | vorher | nachher |
|---|---|---|
| Absatz 1 | Wir haben eine Anfrage erhalten, das Passwort Ihres Kontos bei Embroidery Republic zurückzusetzen. Klicken Sie auf die Schaltfläche unten, um ein neues Passwort zu vergeben. | Wir haben eine Anfrage erhalten, das Passwort deines Kontos bei Embroidery Republic zurückzusetzen. Klicke auf die Schaltfläche unten, um ein neues Passwort zu vergeben. |
| Link-Hinweis | Funktioniert die Schaltfläche nicht? Kopieren Sie diesen Link in Ihren Browser: | Funktioniert die Schaltfläche nicht? Kopiere diesen Link in deinen Browser: |
| Hinweis | Haben Sie diese Anfrage nicht gestellt? Dann können Sie diese Nachricht ignorieren – Ihr Passwort bleibt unverändert. | Hast du diese Anfrage nicht gestellt? Dann kannst du diese Nachricht ignorieren – dein Passwort bleibt unverändert. |

### PasswortGeaendertEmail.tsx

| Stelle | vorher | nachher |
|---|---|---|
| Titel | Ihr Passwort wurde geändert | Dein Passwort wurde geändert |
| Absatz 1 | Das Passwort Ihres Kontos bei Embroidery Republic wurde soeben geändert. | Das Passwort deines Kontos bei Embroidery Republic wurde soeben geändert. |
| Absatz 2 | Waren Sie das nicht? Kontaktieren Sie uns bitte umgehend – wir helfen Ihnen, Ihr Konto abzusichern. | Warst du das nicht? Kontaktiere uns bitte umgehend – wir helfen dir, dein Konto abzusichern. |

### NewsletterOptInEmail.tsx (Newsletter-Anmeldung)

| Stelle | vorher | nachher |
|---|---|---|
| Absatz 1 | Sie erhalten ab sofort gelegentlich Neuigkeiten und Angebote von Embroidery Republic per E-Mail. | Du erhältst ab sofort gelegentlich Neuigkeiten und Angebote von Embroidery Republic per E-Mail. |
| Widerruf | Sie können die Newsletter-Einwilligung jederzeit widerrufen – öffnen Sie dazu einfach Ihr Profil und deaktivieren die entsprechende Option. | Du kannst die Newsletter-Einwilligung jederzeit widerrufen – öffne dazu einfach dein Profil und deaktiviere die entsprechende Option. |

Titel ohne Anrede, unverändert: „Bestellbestätigung {Nr.}“, „Stornierung bestätigt: {Nr.}“, „Bestellung {Nr.} abgeschlossen“, „Bitte Druckvorschau für {Nr.} freigeben“, „Zahlung nicht erfolgreich: {Nr.}“, „Rechnung {Rechnungsnr.}“, „Willkommen bei Embroidery Republic“, „Passwort zurücksetzen“, „Newsletter-Anmeldung bestätigt“. Ebenfalls ohne Anrede: Schaltflächen („E-Mail-Adresse bestätigen“, „Zu meinem Konto“, „Neues Passwort vergeben“, „Erneut versuchen“), Linktexte („Bestellung ansehen“, „Vorschau ansehen und freigeben“, „Sendung bei DHL verfolgen“), Fußzeile („Embroidery Republic Germany“).

## 3. Rechtsnahe Stellen (gesondert genannt)

Angeredet wurde nur die Person; **Paragraphen, Fristen, Beträge und Firmenangaben sind unverändert**.

1. **Selbststornierung innerhalb der Frist** (`OrderConfirmationEmail`, Absatz „Du kannst diese Bestellung noch stornieren …“): Frist `{n} Stunden`, „ohne Angabe von Gründen“, „keine Kosten“, „danach nicht mehr möglich“ wortgleich.
2. **Storno-Bestätigung** (`OrderCancellationEmail`): „Es entstehen dir dadurch keine Kosten“; der Erstattungsabsatz hat keine Anrede und ist nicht angefasst.
3. **Vertragsschluss bei Stickerei-Anfrage** (`OrderConfirmationEmail`): „Ein Vertrag kommt erst zustande, wenn du dieses Angebot annimmst und wir den Auftrag bestätigen.“ Nur Pronomen und Verb geändert, Aussage gleich. „kein Vertrag geschlossen“ und „keine Auftragsbestätigung“ unverändert.
4. **Zahlungsziel auf Rechnung** (`OrderConfirmationEmail`): Der Satzteil „sie ist innerhalb von {n} Tagen ab Rechnungsdatum ohne Abzug zu begleichen“ ist unverändert; geändert nur der Hauptsatz davor („findest du“, „senden wir dir“).
5. **Steuerhinweis** „Kein Steuerausweis (§ 19 UStG)“ (Bestellbestätigung): enthält keine Anrede, nicht angefasst.
6. **Zahlung** (`PaymentFailedEmail`, „Zahlung eingegangen“-Absatz der Bestellbestätigung): nur Anrede.
7. **Newsletter-Einwilligung und Widerruf** (`NewsletterOptInEmail`): datenschutz-/wettbewerbsrechtlich relevant; Inhalt (jederzeit widerrufbar über das Profil) gleich.
8. **Rechnungsmail** (`InvoiceEmail`): § 14 UStG-Pflichtangaben stehen im PDF, nicht in der Mail; nur die Anrede im Mailtext geändert.

In den Vorlagen gibt es **keinen Verweis auf Widerrufsbelehrung, AGB oder Datenschutzerklärung** (Fußzeile ist nur „Embroidery Republic Germany“); dazu gab es nichts umzustellen.

## 4. Test-Anpassungen (Schutzwirkung bleibt erhalten)

| Datei | Test / Stelle | vorher | nachher | Grund |
|---|---|---|---|---|
| `src/lib/orders/__tests__/mailfluss.test.ts` | „Anfrage mit Stickerei: Die Kundschaft bekommt nur eine Eingangsbestätigung …“, Betreff | `'Ihre Anfrage ER-2026-ANF001 ist eingegangen'` | `'Deine Anfrage ER-2026-ANF001 ist eingegangen'` | Betreff jetzt Du-Form |
| `src/lib/orders/__tests__/mailfluss.test.ts` | derselbe Test, Vertragssatz | `/Ein Vertrag kommt erst zustande, wenn Sie dieses Angebot annehmen und wir den\s+Auftrag bestätigen/` | `/Ein Vertrag kommt erst zustande, wenn du dieses Angebot annimmst und wir den\s+Auftrag bestätigen/` | Mailtext jetzt Du-Form |
| `src/lib/email/__tests__/betreiberBenachrichtigung.test.ts` | „Bestätigung einer Stickerei-Anfrage: Kostenschätzung, kein Vertrag, so geht es weiter“ | `/Ihre Anfrage ER-2026-ANF001/` | `/Deine Anfrage ER-2026-ANF001/` | Titel jetzt Du-Form |
| `src/lib/email/__tests__/betreiberBenachrichtigung.test.ts` | derselbe Test | `/Vertrag kommt erst zustande, wenn Sie dieses Angebot annehmen und wir den\s+Auftrag bestätigen/` | `/Vertrag kommt erst zustande, wenn du dieses Angebot annimmst und wir den\s+Auftrag bestätigen/` | Mailtext jetzt Du-Form |
| `src/lib/email/__tests__/anmerkungMail.test.ts` | „Bestellbestätigung bestätigt nur den Eingang der Anmerkung …“ | `html.includes('Ihre Anmerkung zur Bestellung ist bei uns angekommen.')` | `html.includes('Deine Anmerkung zur Bestellung ist bei uns angekommen.')` | Mailtext jetzt Du-Form |
| `src/lib/email/__tests__/anmerkungMail.test.ts` | „Bestellbestätigung bei einer Anfrage: …“ (Prüfung) | `html.includes('Ihre Nachricht ist bei uns angekommen.')` | `html.includes('Deine Nachricht ist bei uns angekommen.')` | Mailtext jetzt Du-Form |
| `src/lib/email/__tests__/anmerkungMail.test.ts` | derselbe Test, **nur der in Anführungszeichen zitierte Teil des Testnamens** | „Ihre Nachricht ist bei uns angekommen“ | „Deine Nachricht ist bei uns angekommen“ | Der Name zitiert den erwarteten Mailtext; sonst stünde dort ein falsches Zitat (einzige Namensänderung) |
| `src/lib/email/__tests__/orderConfirmationRechnung.test.ts` | „OHNE rechnung-Prop behauptet der Text NICHT, eine Rechnung sei angehängt (PayPal/Karte)“ | `/Rechnung erhalten Sie in Kürze/` | `/Rechnung erhältst du in Kürze/` | Mailtext jetzt Du-Form |
| `src/lib/email/__tests__/vorlagenSmoke.test.ts` | Liste `VERDAECHTIG` (Muster, die in KEINER gerenderten Mail vorkommen dürfen), Zeile „Du-Anrede statt Sie“ | `['Du-Anrede statt Sie', /\b(Du\|Dein\|Deine\|Deinem\|Deinen\|Dir)\b/]` | `['Sie-Anrede statt Du', /\b(Ihr\|Ihre\|Ihren\|Ihrem\|Ihrer\|Ihres\|Ihnen)\b\|\bSie\b(?! ist bei uns eingegangen)/]` und `['groß geschriebenes Du mitten im Satz', /[a-zäöüß,;–—] (Du\|Dein\|Deine\|Deinem\|Deinen\|Deiner\|Deines\|Dir\|Dich)\b/]` | Die alte Zeile war eine **Schutzregel für die Sie-Form** (jedes große „Du/Dein/Dir“ ließ den Test scheitern). Sie würde jetzt bei jedem Satzanfang wie „Deine Bestellung …“ anschlagen (beim ersten Lauf 14 Prüffälle in 10 Vorlagen). Entscheidung des Betreibers kehrt die Regel um, deshalb: (1) jede Sie-Anrede (Ihr-Formen, „Sie“ außer „Sie ist bei uns eingegangen“ für die Anfrage) lässt den Test scheitern, (2) großes „Du/Dein/Dir“ mitten im Satz (Briefform) lässt ihn scheitern, am Satzanfang und nach Doppelpunkt ist es erlaubt. Die Prüfschleife (`for … of VERDAECHTIG`) und alle übrigen Regeln bleiben unverändert. **Bitte bei der Durchsicht besonders ansehen**, weil das keine reine Textersetzung ist. |

Keine Assertion wurde gelöscht oder auskommentiert. Zur Gegenprobe wurde die neue Regel an den alten Texten geprüft („Bitte bestätigen Sie Ihre E-Mail“, „wenn Sie dieses Angebot annehmen“, „Klicken Sie auf“, „wir helfen Dir weiter“ schlagen an; „Sie ist bei uns eingegangen“, „Gute Nachrichten: Deine Bestellung“, „bei dir“ nicht). Zusätzlich wurden alle 20 Mailvarianten (inkl. Rechnung mit/ohne PDF, PayPal, Stickerei-Anfrage) einmal gerendert und gegen beide Muster geprüft: keine Treffer.

## 5. Belassene Treffer

| Fundstelle | Grund |
|---|---|
| `templates/InternalOrderNotificationEmail.tsx` (Z. 5 und 218) | Interne Mail an den Betreiber. Beide Treffer sind Code-Kommentare („Sie soll alles enthalten …“ = die Meldung). Nicht angefasst. |
| `templates/InternalOrderCancelledEmail.tsx` Z. 36 („ihr Stand steht im Adminbereich“) | Interne Mail; „ihr“ = der Rückerstattung (dritte Person), keine Anrede. |
| `templates/ProofFeedbackEmail.tsx`, `templates/ContactMessageEmail.tsx` | Interne Mails an den Betreiber, ohne Sie-Anrede. Nicht angefasst. |
| Betreffzeilen der Betreiber-Mails in `orderEmails.tsx` („Neue Bestellung/Neue Anfrage: …“, „Bestellung storniert: …“, „Vorschau freigegeben: …“, „Änderung gewünscht: …“) und `contactEmails.tsx` („Kontaktanfrage: …“) | Intern, keine Anrede. |
| `OrderConfirmationEmail.tsx` Z. 46 „Sie ist bei uns eingegangen“, „sie ist keine Auftragsbestätigung“, „sie ist innerhalb von … zu begleichen“, „kannst du sie … stornieren“ | „Sie/sie“ = die Anfrage bzw. die Rechnung bzw. die Bestellung (dritte Person), keine Höflichkeitsform. |
| `OrderProofRequestEmail.tsx` Z. 3 (Kommentar zitiert „erhalten Sie eine finale Vorschau“ aus der FAQ) | Code-Kommentar, laut Auftrag nicht anfassen. |
| Kommentare in `orderEmails.tsx`, `resendClient.ts`, `scheduledEmails.ts`, `sendEmail.ts` („Sie wird in der Bestell-Historie …“, „sich“ …) | Kommentare, kein Mailtext. |
| Rechnungs-PDF (`src/lib/invoicing/**`) | Keine Änderung; dort wurde außerhalb von Kommentaren keine Sie-Anrede gefunden. |
| `src/app/agb`, `src/app/datenschutz`, `src/app/impressum` | Rechtstexte, laut Auftrag nicht angefasst. |

## 6. Auffälligkeiten außerhalb des Auftrags

- `src/app/bestellung/[token]/page.tsx` (Z. 172, 185) und `src/app/konto/bestellungen/[id]/page.tsx` (Z. 77, 90) zeigen im Storno-Bereich noch die Sie-Form („können Sie Ihre Bestellung selbst stornieren“, „Ihre Bestellung ist …“). Das sind Webseiten, keine Mails, und Teil der Freigabeliste „Kasse/Storno“. Die Storno-Mail und die Bestellbestätigung sprechen jetzt per Du, die Storno-Seite dazu noch per Sie, bis dieser Bereich umgestellt ist.
- Die Mail-Anrede „Hallo {Name}“ steht nur im Kontakt-Autoreply (Name wie im Formular eingegeben, Datenquelle unverändert). Alle anderen Mails haben keine persönliche Anrede im Text und bekommen auch keine neue.
