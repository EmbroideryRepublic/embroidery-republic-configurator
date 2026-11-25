# Angepasste Tests im Redesign – was, warum, und warum die Schutzfunktion bleibt

Stand 24.11.2026. Alle 1.711 Tests bestehen. In sechs Testdateien wurde ausschließlich der **erwartete Wert** geändert, weil sich der geprüfte Text oder Farbwert absichtlich geändert hat. Keine Prüfung wurde gelöscht, gelockert oder auskommentiert; verglichen wird weiterhin dasselbe mit demselben.

## A. Die zwei Tests durch das Redesign (Farben und Startseite)

### 1. `src/components/__tests__/benutzerfreundlichkeit.test.ts` – „Kontrast: Die Goldtöne in der Konfiguration sind die geprüften Werte“
- **Was der Test schützt:** Die drei Farbtöne mit festen Rollen dürfen nicht unbemerkt geändert werden, weil jeder einen gerechneten Kontrast einhält: große Fläche/Grafik, kleiner Text, Knopf mit weißer Schrift.
- **Vorher (Gold):** `DEFAULT #aa864e` (3,0–3,4 : 1), `dark #7d6035` (5,2–5,8 : 1), `btn #8a6a3a` (5,0 : 1).
- **Nachher (Orange):** `DEFAULT #e8590c` (3,35 : 1 gegen Papier, genügt für Grafik ab 3 : 1, **nicht** für kleinen Text), `dark #b93a0a` (5,35 : 1, kleiner Text), `btn #c2410c` (5,18 : 1, weiße Schrift auf Knopf).
- **Warum notwendig:** Das Redesign tauscht die Markenfarbe von Gold auf Orange. Der Test hat den alten Wert zu Recht gemeldet.
- **Warum die Schutzfunktion bleibt:** Er prüft weiter, dass genau diese drei Rollenfarben in der Konfiguration stehen. Ein Nachbartest im selben File (kein `bg-gold` mit `text-white`, Kontrast 3,6 : 1 scheitert) bleibt unverändert und greift auch für das Orange. Die Kontrastwerte wurden mit der WCAG-Formel nachgerechnet.

### 2. `src/components/shop/__tests__/veredelungsverfahren.test.ts` – „Produktseite, Shop und Startseite lesen den Betreiberschalter für ihre Stickerei-Texte“
- **Was der Test schützt:** Texte zur Stickerei dürfen nicht fest verdrahtet sein, sondern müssen den Betriebsschalter `veredelungVerfuegbar('embroidery')` lesen. Solange die Stickerei pausiert ist, darf nichts sie versprechen.
- **Vorher:** Die Startseite prüfte die Zeile der Vorteilsleiste `veredelungVerfuegbar('embroidery') ? 'Stickerei & DTF-Transferdruck' : 'DTF-Transferdruck'`.
- **Nachher:** Die neue Vorteilsleiste nennt kein Verfahren mehr (Referenz: „Ab 1 Stück“, „Live-Konfigurator“, Produktionszeit, Versand). Der Test prüft deshalb die Stelle, an der die Startseite den Schalter weiterhin liest: die Seitenbeschreibung (`veredelungVerfuegbar('embroidery') ? 'Hochwertige Stickerei und DTF-Transferdruck …' : 'DTF-Transferdruck für Unternehmen, Vereine und Marken …'`).
- **Warum notwendig:** Die geprüfte Zeile gibt es nicht mehr.
- **Warum die Schutzfunktion bleibt:** Der Schutz (Startseite liest den Schalter) gilt weiter, an der Beschreibung. Zusätzlich lesen jetzt auch die Überschrift und der Text des Abschnitts „So kommt dein Motiv aufs Textil“, die Marken-Karte und die Fußzeile den Schalter.

## B. Vier Tests durch die Du-Umstellung (nur erwarteter Text)

Wortlaut im Shop von „Sie“ auf „du“ umgestellt; die Tests hielten den alten Wortlaut als erwarteten Wert fest.

| Datei | Test | vorher | nachher |
|---|---|---|---|
| `src/lib/seo/__tests__/anlassSeiten.test.ts` | Auflösungs-Ratgeber nennen das Hochskalieren ehrlich | `/nicht hochgeladen\|verlässt Ihren Rechner nicht/` | `/nicht hochgeladen\|verlässt deinen Rechner nicht/` |
| `src/lib/seo/__tests__/dtfSeiten.test.ts` | Ablauf: Zeiten kommen aus der Konfiguration; Schritt 3 verspricht keine Stickerei | `'DTF-Druck bestellen Sie direkt im Konfigurator.'` | `'DTF-Druck bestellst du direkt im Konfigurator.'` |
| `src/config/__tests__/stickereiPause.test.ts` | Hinweistexte stehen auf Deutsch und Englisch und nennen den Grund | `/DTF-Transferdruck können Sie weiterhin bestellen/` | `/DTF-Transferdruck kannst du weiterhin bestellen/` |
| `src/lib/orders/__tests__/eingabeRobustheit.test.ts` | submitOrder/submitInquiry ohne Kontaktblock; Kontaktformular mit kaputten Feldern (4 erwartete Meldungen) | „Bitte versuchen Sie es in ein paar Minuten erneut.“, „Bitte geben Sie Ihren Namen an (2–100 Zeichen).“, „… eine gültige E-Mail-Adresse an.“, „Bitte formulieren Sie Ihre Nachricht (10–5000 Zeichen).“ | „Bitte versuche es in ein paar Minuten erneut.“, „Bitte gib deinen Namen an (2–100 Zeichen).“, „Bitte gib eine gültige E-Mail-Adresse an.“, „Bitte formuliere deine Nachricht (10–5000 Zeichen).“ |

**Schutzfunktion:** Alle vier prüfen weiter dasselbe (Auflösungs-Ratgeber ohne unbelegte Versprechen, Ablauf ohne Stickerei-Zusage, Pausen-Hinweis nennt den Grund, Fehlerfälle liefern eine freundliche Meldung statt eines `TypeError`). Geändert ist nur die Anrede im erwarteten Text.

## C. Du-Umstellung der E-Mails (Betreiber-Freigabe 25.11.2026)

Der Betreiber hat die Du-Form im gesamten Bestellablauf freigegeben (Rechtstexte AGB, Datenschutz und Impressum bleiben förmlich). Die E-Mails sind umgestellt; Tests, die den Mail-Wortlaut als erwarteten Wert festhielten, haben nur den erwarteten Text bekommen:

| Datei | was sich im erwarteten Wert ändert |
|---|---|
| `src/lib/orders/__tests__/mailfluss.test.ts` | Betreff „Deine Anfrage ER-2026-ANF001 ist eingegangen“; Vertragssatz „… wenn du dieses Angebot annimmst …“ |
| `src/lib/email/__tests__/betreiberBenachrichtigung.test.ts` | „Deine Anfrage ER-2026-ANF001“ und derselbe Vertragssatz |
| `src/lib/email/__tests__/anmerkungMail.test.ts` | „Deine Anmerkung zur Bestellung …“, „Deine Nachricht ist bei uns angekommen.“ (auch im Testnamen) |
| `src/lib/email/__tests__/orderConfirmationRechnung.test.ts` | „Rechnung erhältst du in Kürze“ |

**Eine Regel dreht die Richtung (`src/lib/email/__tests__/vorlagenSmoke.test.ts`).** Die Schutzregel „Du-Anrede statt Sie“ verbot ein großes „Du/Dein/Dir“ in den Mails, weil die Mails förmlich waren. Sie wurde in zwei Regeln mit gleicher Strenge aufgeteilt: Eine Sie-Anrede (Sie, Ihr, Ihre, Ihnen, …) lässt den Test scheitern (Ausnahme: „Sie ist bei uns eingegangen“, dort ist „Sie“ die Anfrage), und ein groß geschriebenes „Du/Dein/Dir“ mitten im Satz lässt ihn scheitern (am Satzanfang und nach Doppelpunkt ist es richtig). Keine Assertion wurde gelöscht; geprüft werden weiterhin alle Mailvorlagen gegen verdächtige Muster. Die neue Regel fängt außerdem die alte Förmlichkeit, die sich in neue Vorlagen einschleichen könnte.

## D. Stickerei-Pause: keine falschen Leistungsversprechen (Betreiber-Auftrag 25.11.2026)

- `src/config/__tests__/stickereiAussagen.test.ts` (neu): Mit pausierter Stickerei darf in FAQ, Über uns, Kontakt-Hinweis, Manifest und der Methodenkachel des Konfigurators kein Wort „besticken/Stickerei/gestickt/Stickdaten/Garnfarben/Digitalisierung“ stehen, auch nicht im strukturierten FAQ-Datenblock; zusätzlich prüft er, dass der bisherige Wortlaut hinter dem Schalter erhalten bleibt (Wiederaufnahme).
- `src/lib/seo/__tests__/produktTitel.test.ts` (erweitert, nichts geändert): Bei pausierter Stickerei kein Titel mit „besticken“; im ganzen Katalog passen alle Titel in 60 Zeichen, enthalten den vollen Produktnamen, sind verschieden und tragen zu über 80 % „bedrucken“.

## E. Nicht angefasst

Rechtstexte AGB, Datenschutzerklärung und Impressum und die zugehörigen Tests; Rechnungs-PDF.

## F. Ergänzungen nach dem unabhängigen Review (24.11.2026)

- `benutzerfreundlichkeit.test.ts`, Test „Kontrast: Weiße Schrift steht auf bg-gold-btn …“: Der Suchausdruck erkennt jetzt auch Zustandspräfixe (`hover:bg-gold`, `focus:bg-gold`). Das **verschärft** den Test; er fand zwei Stellen, die behoben wurden.
- `veredelungsverfahren.test.ts`: fünf zusätzliche Assertions, dass Abschnittsüberschrift, Marken-Karte, Fußzeilenbeschreibung, Fußzeilenzeile und Standardtitel im Layout den Betriebsschalter lesen. Das **erweitert** die Abdeckung der Stickerei-Pause.
