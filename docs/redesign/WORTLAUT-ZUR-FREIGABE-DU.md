# Wortlaut: rechtsnahe Texte in der Du-Form

> **Erledigt am 25.11.2026.** Der Betreiber hat die Du-Form im gesamten Bestellablauf freigegeben (Punkte 1 bis 6). Die geänderten Sätze stehen vollständig in `DU-BESTELLABLAUF-AENDERUNGEN.md` und `DU-EMAILS-AENDERUNGEN.md`. Punkt 7 (AGB, Datenschutzerklärung, Impressum) bleibt förmlich, wie vom Betreiber festgelegt.

Ursprünglicher Stand 24.11.2026. Der Shop spricht überall per Du, **außer** den folgenden Texten. Sie regeln Widerruf, Zahlung, Storno, Haftung oder Datenschutz und gehen deshalb erst nach Ihrer Freigabe in die Du-Form. Der Inhalt bleibt jeweils exakt gleich, geändert ist nur die Anrede. Mit „go“ stelle ich alle Texte dieser Liste in einem Schritt um (Stellen im Code stehen jeweils dabei).

## 1. Widerrufsausschluss (Warenkorb und Kasse)
- `src/lib/i18n/translations.ts` `cart_no_returns` und `checkout_terms_no_withdrawal` (deutsche Tabelle).
- Jetzt: „Alle Produkte werden mit Logo oder Text individuell für Sie gefertigt und sind vom Widerruf ausgeschlossen.“
- Vorschlag: „Alle Produkte werden mit Logo oder Text individuell für dich gefertigt und sind vom Widerruf ausgeschlossen.“

## 2. Zahlungsbedingungen
- `translations.ts` `checkout_payment_invoice_note`: „… Die Rechnung erhalten Sie separat mit der Auftragsbearbeitung – im Checkout wird nichts abgebucht.“ → „… Die Rechnung erhältst du separat mit der Auftragsbearbeitung – im Checkout wird nichts abgebucht.“
- `translations.ts` `checkout_no_prepay`: „Keine Vorkasse – Sie zahlen erst nach Erhalt der Ware.“ → „Keine Vorkasse – du zahlst erst nach Erhalt der Ware.“
- `src/app/bestellung/[token]/page.tsx` (Rechnungshinweis): „Die Rechnung erhalten Sie separat, zahlbar innerhalb von {PAYMENT_TERM_DAYS} Tagen ohne Abzug.“ → „Die Rechnung erhältst du separat, zahlbar innerhalb von {PAYMENT_TERM_DAYS} Tagen ohne Abzug.“

## 3. Storno und Rückerstattung (Bestellseite per Link und Kundenkonto)
- `src/app/bestellung/[token]/page.tsx` und `src/app/konto/bestellungen/[id]/page.tsx`:
  - „Es entstehen Ihnen keine Kosten.“ → „Es entstehen dir keine Kosten.“ (Konto: „Es sind Ihnen keine Kosten entstanden.“ → „Es sind dir keine Kosten entstanden.“)
  - „Eine Bestätigung haben wir Ihnen per E-Mail gesendet.“ → „Eine Bestätigung haben wir dir per E-Mail gesendet.“
  - Überschrift „Sie können diese Bestellung noch stornieren“ → „Du kannst diese Bestellung noch stornieren“.
  - „Innerhalb von zwei Stunden nach Bestelleingang können Sie Ihre Bestellung selbst stornieren. Danach geht sie in die Bearbeitung und wir beschaffen die Ware.“ → „… kannst du deine Bestellung selbst stornieren. …“
  - „Die zweistündige Stornofrist ist am … abgelaufen. Ihre Bestellung ist inzwischen in Bearbeitung.“ → „… Deine Bestellung ist inzwischen in Bearbeitung.“
  - „Sie haben trotzdem eine Frage oder einen Sonderfall? Melden Sie sich gern direkt bei uns …“ → „Du hast trotzdem eine Frage oder einen Sonderfall? Melde dich gern direkt bei uns …“; Knopf „Kontaktieren Sie uns direkt“ → „Kontaktiere uns direkt“.
- `src/components/orders/CancelOrderButton.tsx`: „… Sie erhalten anschließend eine Bestätigung per E-Mail.“ → „… Du erhältst anschließend eine Bestätigung per E-Mail.“
- `src/lib/actions/orderCancellation.ts`: Meldungen „Bitte kontaktieren Sie uns direkt.“ / „… Bitte kontaktieren Sie uns – wir prüfen, was sich noch machen lässt.“ / „Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.“ → „kontaktiere uns direkt“ / „kontaktiere uns – …“ / „Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.“

## 4. Freigabe der Vorschau (Haftungsverlagerung)
- `src/components/orders/KundenfreigabeBereich.tsx`: „Mit der Freigabe bestätigen Sie, dass die Vorschau genau dem entspricht, was produziert werden soll.“ → „Mit der Freigabe bestätigst du, …“

## 5. Datenschutz-Hinweise und Einwilligungsmeldungen
- `translations.ts` `inquiry_privacy_prefix`: „Ihre Angaben verwenden wir nur, um Ihre Anfrage zu bearbeiten.“ → „Deine Angaben verwenden wir nur, um deine Anfrage zu bearbeiten.“
- `translations.ts` `contact_form_disclaimer`: „Mit dem Absenden werden Ihre Angaben zur Bearbeitung Ihrer Anfrage verarbeitet. …“ → „… werden deine Angaben zur Bearbeitung deiner Anfrage verarbeitet. …“
- `src/lib/orders/orderValidation.ts:260`: „Bitte akzeptieren Sie die AGB und die Datenschutzerklärung, um die Bestellung abzuschließen.“ → „Bitte akzeptiere die AGB und die Datenschutzerklärung, um die Bestellung abzuschließen.“
- `src/lib/account/validation.ts:55`: „Bitte bestätigen Sie die AGB und die Datenschutzerklärung.“ → „Bitte bestätige die AGB und die Datenschutzerklärung.“

## 6. E-Mails (Betreffzeilen und Vorlagen)
Betreff und Vorlage müssen zusammen umgestellt werden. Betroffen: `src/lib/email/**` (alle Vorlagen), Betreffzeilen in `src/lib/actions/konto.ts` („Bitte bestätigen Sie Ihre E-Mail-Adresse“, „Ihr Passwort wurde geändert“) und der Test `src/lib/orders/__tests__/mailfluss.test.ts`. Die Vorlagen bekommt ihr als eigene Wortlaut-Vorlage; heute stehen sie in der Sie-Form.

## 7. Rechtstexte
`src/app/datenschutz`, `src/app/agb`, `src/app/impressum` bleiben bis zu einer gesonderten Entscheidung in der Sie-Form (Rechtstexte in der Du-Form sind möglich, sollten aber rechtlich geprüft werden).

## Folge bis zur Freigabe
Im Kassen- und Storno-Bereich steht für diese Aussagen noch „Sie“ neben „du“ an anderer Stelle. Das ist sichtbar, aber bewusst: lieber eine kurze Mischform als rechtsnahe Texte ohne Ihre Freigabe zu ändern.
