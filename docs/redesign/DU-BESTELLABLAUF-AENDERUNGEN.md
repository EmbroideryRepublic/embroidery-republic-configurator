# Du-Ansprache im Bestellablauf: alle geänderten Sätze

Stand 25.11.2026, Branch `arbeit-du-5`. Umgesetzt sind die vom Betreiber freigegebenen Punkte 1 bis 5 der Liste `WORTLAUT-ZUR-FREIGABE-DU.md` (Widerrufsausschluss, Zahlungsbedingungen, Storno und Rückerstattung, Freigabe der Vorschau, Datenschutz-Hinweise und Einwilligungsmeldungen). Der Inhalt jedes Satzes ist unverändert, geändert ist nur die Anrede. Punkt 6 (E-Mails) und Punkt 7 (Rechtstexte) sind nicht Teil dieser Änderung.

Insgesamt 29 Zeichenketten in 8 Dateien. Platzhalter wie `{PAYMENT_TERM_DAYS}` und `[Zeitpunkt]` (Datum und Uhrzeit der Stornofrist) stehen unverändert im Satz.

## 1. Widerrufsausschluss (Warenkorb und Kasse)

| Datei | vorher | nachher |
|---|---|---|
| `src/lib/i18n/translations.ts` (`cart_no_returns`) | Alle Produkte werden mit Logo oder Text individuell für Sie gefertigt und sind vom Widerruf ausgeschlossen. | Alle Produkte werden mit Logo oder Text individuell für dich gefertigt und sind vom Widerruf ausgeschlossen. |
| `src/lib/i18n/translations.ts` (`checkout_terms_no_withdrawal`) | Alle Produkte werden mit Logo oder Text individuell für Sie gefertigt und sind vom Widerruf ausgeschlossen. | Alle Produkte werden mit Logo oder Text individuell für dich gefertigt und sind vom Widerruf ausgeschlossen. |

## 2. Zahlungsbedingungen

| Datei | vorher | nachher |
|---|---|---|
| `src/lib/i18n/translations.ts` (`checkout_payment_invoice_note`) | Zahlung bequem auf Rechnung, zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug. Die Rechnung erhalten Sie separat mit der Auftragsbearbeitung – im Checkout wird nichts abgebucht. | Zahlung bequem auf Rechnung, zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug. Die Rechnung erhältst du separat mit der Auftragsbearbeitung – im Checkout wird nichts abgebucht. |
| `src/lib/i18n/translations.ts` (`checkout_no_prepay`) | Keine Vorkasse – Sie zahlen erst nach Erhalt der Ware. | Keine Vorkasse – du zahlst erst nach Erhalt der Ware. |
| `src/app/bestellung/[token]/page.tsx` (Rechnungshinweis) | Die Rechnung erhalten Sie separat, zahlbar innerhalb von {PAYMENT_TERM_DAYS} Tagen ohne Abzug. | Die Rechnung erhältst du separat, zahlbar innerhalb von {PAYMENT_TERM_DAYS} Tagen ohne Abzug. |

## 3. Storno und Rückerstattung

Bestellseite per Link (`src/app/bestellung/[token]/page.tsx`):

| Zustand | vorher | nachher |
|---|---|---|
| storniert, keine Zahlung | Es entstehen Ihnen keine Kosten. | Es entstehen dir keine Kosten. |
| storniert | Eine Bestätigung haben wir Ihnen per E-Mail gesendet. | Eine Bestätigung haben wir dir per E-Mail gesendet. |
| stornierbar, Überschrift | Sie können diese Bestellung noch stornieren | Du kannst diese Bestellung noch stornieren |
| stornierbar, Text | Innerhalb von zwei Stunden nach Bestelleingang können Sie Ihre Bestellung selbst stornieren. Danach geht sie in die Bearbeitung und wir beschaffen die Ware. | Innerhalb von zwei Stunden nach Bestelleingang kannst du deine Bestellung selbst stornieren. Danach geht sie in die Bearbeitung und wir beschaffen die Ware. |
| Frist abgelaufen | Die zweistündige Stornofrist ist am [Zeitpunkt] abgelaufen. Ihre Bestellung ist inzwischen in Bearbeitung. | Die zweistündige Stornofrist ist am [Zeitpunkt] abgelaufen. Deine Bestellung ist inzwischen in Bearbeitung. |
| Frist abgelaufen, Rückfrage | Sie haben trotzdem eine Frage oder einen Sonderfall? Melden Sie sich gern direkt bei uns – wir schauen, was sich machen lässt. | Du hast trotzdem eine Frage oder einen Sonderfall? Melde dich gern direkt bei uns – wir schauen, was sich machen lässt. |

Bestellseite im Kundenkonto (`src/app/konto/bestellungen/[id]/page.tsx`):

| Zustand | vorher | nachher |
|---|---|---|
| storniert, keine Zahlung | Es sind Ihnen keine Kosten entstanden. | Es sind dir keine Kosten entstanden. |
| stornierbar, Überschrift | Sie können diese Bestellung noch stornieren | Du kannst diese Bestellung noch stornieren |
| stornierbar, Text | Innerhalb von zwei Stunden nach Bestelleingang können Sie Ihre Bestellung selbst stornieren. Danach geht sie in die Bearbeitung und wir beschaffen die Ware. | Innerhalb von zwei Stunden nach Bestelleingang kannst du deine Bestellung selbst stornieren. Danach geht sie in die Bearbeitung und wir beschaffen die Ware. |
| Frist abgelaufen | Die zweistündige Stornofrist ist am [Zeitpunkt] abgelaufen. Ihre Bestellung ist inzwischen in Bearbeitung. | Die zweistündige Stornofrist ist am [Zeitpunkt] abgelaufen. Deine Bestellung ist inzwischen in Bearbeitung. |
| Link unter „Fragen zu dieser Bestellung?“ | Kontaktieren Sie uns direkt | Kontaktiere uns direkt |

Die Rückfrage-Zeile „Melden Sie sich gern …“ und der Link „Kontaktieren Sie uns direkt“ stehen jeweils nur auf einer der beiden Seiten (Rückfrage auf der Link-Seite, Link auf der Konto-Seite). Die Liste hatte beide Formulierungen unter Punkt 3 zusammengefasst; geändert ist jede dort, wo sie vorkommt.

Stornoknopf (`src/components/orders/CancelOrderButton.tsx`):

| vorher | nachher |
|---|---|
| Die Stornierung kann nicht rückgängig gemacht werden. Sie erhalten anschließend eine Bestätigung per E-Mail. | Die Stornierung kann nicht rückgängig gemacht werden. Du erhältst anschließend eine Bestätigung per E-Mail. |

Fehlermeldungen beim Stornieren (`src/lib/actions/orderCancellation.ts`):

| Fall | vorher | nachher |
|---|---|---|
| Bestellung nicht gefunden | Die Bestellung wurde nicht gefunden. Bitte kontaktieren Sie uns direkt. | Die Bestellung wurde nicht gefunden. Bitte kontaktiere uns direkt. |
| Frist abgelaufen | Die Stornofrist ist inzwischen abgelaufen. Bitte kontaktieren Sie uns – wir prüfen, was sich noch machen lässt. | Die Stornofrist ist inzwischen abgelaufen. Bitte kontaktiere uns – wir prüfen, was sich noch machen lässt. |
| Anfrage statt Bestellung | Für Anfragen gibt es keine Stornierung. Bitte kontaktieren Sie uns direkt. | Für Anfragen gibt es keine Stornierung. Bitte kontaktiere uns direkt. |
| bereits abgeschlossen | Diese Bestellung ist bereits abgeschlossen und kann nicht mehr storniert werden. Bitte kontaktieren Sie uns direkt. | Diese Bestellung ist bereits abgeschlossen und kann nicht mehr storniert werden. Bitte kontaktiere uns direkt. |
| technischer Fehler | Die Stornierung konnte technisch nicht abgeschlossen werden. Bitte kontaktieren Sie uns direkt. | Die Stornierung konnte technisch nicht abgeschlossen werden. Bitte kontaktiere uns direkt. |
| Sitzung abgelaufen (Konto) | Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an. | Deine Sitzung ist abgelaufen. Bitte melde dich erneut an. |
| Link ungültig (Token) | Dieser Link ist nicht mehr gültig. Bitte kontaktieren Sie uns direkt. | Dieser Link ist nicht mehr gültig. Bitte kontaktiere uns direkt. |

Die Liste nannte die Meldungen mit „Bitte kontaktieren Sie uns direkt“ nur als Gruppe; alle fünf Stellen dieser Art in der Datei sind umgestellt. Damit ist der gesamte Storno-Bereich (Bestellseite per Link, Kundenkonto, Stornoknopf, Fehlermeldungen) durchgängig in der Du-Form.

## 4. Freigabe der Vorschau (Haftungsverlagerung)

| Datei | vorher | nachher |
|---|---|---|
| `src/components/orders/KundenfreigabeBereich.tsx` | Mit der Freigabe bestätigen Sie, dass die Vorschau genau dem entspricht, was produziert werden soll. Wir beginnen danach mit der Fertigung. | Mit der Freigabe bestätigst du, dass die Vorschau genau dem entspricht, was produziert werden soll. Wir beginnen danach mit der Fertigung. |

## 5. Datenschutz-Hinweise und Einwilligungsmeldungen

| Datei | vorher | nachher |
|---|---|---|
| `src/lib/i18n/translations.ts` (`inquiry_privacy_prefix`) | Ihre Angaben verwenden wir nur, um Ihre Anfrage zu bearbeiten. Mehr dazu in der | Deine Angaben verwenden wir nur, um deine Anfrage zu bearbeiten. Mehr dazu in der |
| `src/lib/i18n/translations.ts` (`contact_form_disclaimer`) | Mit dem Absenden werden Ihre Angaben zur Bearbeitung Ihrer Anfrage verarbeitet. Es entsteht keine Bestellung und keine Zahlungsverpflichtung. | Mit dem Absenden werden deine Angaben zur Bearbeitung deiner Anfrage verarbeitet. Es entsteht keine Bestellung und keine Zahlungsverpflichtung. |
| `src/lib/orders/orderValidation.ts` (Kasse, AGB nicht akzeptiert) | Bitte akzeptieren Sie die AGB und die Datenschutzerklärung, um die Bestellung abzuschließen. | Bitte akzeptiere die AGB und die Datenschutzerklärung, um die Bestellung abzuschließen. |
| `src/lib/account/validation.ts` (Registrierung, Einwilligung) | Bitte bestätigen Sie die AGB und die Datenschutzerklärung. | Bitte bestätige die AGB und die Datenschutzerklärung. |

## Test-Anpassungen

Keine. Kein bestehender Test hielt einen dieser Wortlaute als erwarteten Wert fest; alle 1.711 Tests laufen unverändert grün. Es wurde keine Assertion gelöscht, abgeschwächt oder geändert, und die Mailfluss-Tests (`src/lib/orders/__tests__/mailfluss.test.ts`) sind unberührt.

## Bewusst nicht geändert

- Rechtstexte `src/app/agb`, `src/app/datenschutz`, `src/app/impressum` (bleiben in der Sie-Form).
- E-Mail-Vorlagen `src/lib/email/**` und die Betreffzeilen in `src/lib/actions/konto.ts` (eigener Schritt).
- Admin-Bereich, Code-Kommentare, Variablennamen, Logik, Preise, Zahlung, DHL, Rechnungen und PDFs.
- Treffer, in denen „Sie“ nicht die Höflichkeitsform ist, sondern „sie“ (Fläche, Stickerei, Bestellung) am Satzanfang, zum Beispiel „Nein. Sie wächst mit der Größe …“ in `src/config/seo/anlassSeiten.ts`.
