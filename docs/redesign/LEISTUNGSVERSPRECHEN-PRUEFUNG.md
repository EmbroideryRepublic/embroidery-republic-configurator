# Prüfung der Leistungsversprechen gegen die tatsächlichen Shopbedingungen (24.11.2026)

Quellen der Wahrheit: `src/config/company.ts` (`PRODUKTIONSTAGE` 3–4 Werktage, `VERSANDTAGE` 1–2 Werktage), `src/config/shipping.ts` (Deutschland: 6,90 €, versandkostenfrei ab 75 €), `src/config/bestellweg.ts` (Betriebsschalter: Stickerei pausiert), Katalog (Ansichten je Produkt), FAQ und AGB.

| Versprechen im neuen Auftritt | Prüfung | Ergebnis |
|---|---|---|
| „3–4 Werktage Produktion“ (Vorteilsleiste, Produktseite) | kommt aus `PRODUKTIONSTAGE`, nicht von Hand | stimmt |
| „Versandkostenfrei ab 75,00 €“ (Vorteilsleiste, Produktseite, Warenkorb) | kommt aus `SHIPPING_RATES.DE.freeFrom`; Warenkorb zeigt „Kostenloser Versand“ nur bei Summe ≥ 75 €, darunter „Noch … bis zum kostenlosen Versand“ (Logik in `CartDrawer.tsx`, `total >= freeFrom`) | stimmt. Hinweis: Der Text „… (DE, ab 75 €)“ in `cart_shipping_remaining` enthält die 75 € fest; sie stimmt heute mit der Konfiguration überein |
| „Ab 1 Stück“ | FAQ und Preisengine: keine Mindestbestellmenge | stimmt |
| Hero-Karte „3–4 Werktage von Bestellung bis Versand“ | FAQ: Produktion beginnt nach Bestellfreigabe, Versand folgt innerhalb von 1–2 Werktagen. Die Zeile „von Bestellung bis Versand“ war ungenau | **korrigiert:** „3–4 Werktage – Produktion ab Bestellfreigabe“ |
| Band „Vier Ansichten: vorne, hinten und beide Ärmel“ | Katalog: 147 von 182 Produkten haben vier Ansichten, 35 nur Vorder- und Rückseite | **korrigiert:** „Bis zu vier Ansichten … je nach Modell“; der Text „auf Vorderseite, Rückseite und Ärmeln“ nennt die Ärmel jetzt „je nach Modell“ |
| „Staffelpreis ab fünf Stück“ | Preisregeln: Staffel ab 5 Stück | stimmt |
| Stickerei in Fußzeile, „Marke“-Karte, Abschnitt „Zwei Wege …“ | Stickerei ist seit 11.11. pausiert | **korrigiert:** alle drei lesen den Betriebsschalter und nennen die Stickerei nur, wenn sie angeboten wird |
| Standardtitel, Vorschautitel und Schlagwörter im Layout nannten „besticken“ | Betriebsschalter | **korrigiert:** nur bei verfügbarer Stickerei |
| Preise, Staffelpreise, Vorschau und Gesamtpreis im Konfigurator | Durchlauf im Produktions-Build: 12 × 17,99 € = 215,88 € (Staffelhinweis „Noch 8 Stück – dann nur noch 16,99 €“) | stimmt, unverändert |

**Noch offen (Entscheidung des Betreibers):** Die Produkttitel „… bedrucken & besticken | Marke“ auf 182 Produktseiten nennen weiter die Stickerei (`src/lib/seo/produktTitel.ts`). Vorschlag „{Name} bedrucken | {Marke}“, Wortlaut zur Freigabe.

## Nachtrag nach dem unabhängigen Review (24.11.2026)

- **Stickerei in FAQ und „Über uns“ ohne Betriebsschalter** (`src/app/faq/page.tsx`, `src/app/ueber-uns/page.tsx`, `kontakt_helper_1_text` in den Übersetzungen): Sie sagen „Stickerei gibt es nur auf Anfrage“. Solange die Stickerei pausiert ist, lehnen Bestellung und Anfrage sie ab. Das lag schon vor dem Redesign so und ist **offen**; Vorschlag: gleiche Schalterlogik wie auf der Startseite, Wortlaut zur Freigabe.
- **Gefunden und behoben:** weiße Schrift auf dem hellen Orange beim Hover (3,58 : 1) am Knopf „Konfigurator öffnen“ und im Admin; der Kontrasttest erkennt jetzt auch Zustandspräfixe (`hover:` usw.).
- **Gefunden und behoben:** Shop-Menü schloss sich beim langsamen Hinabfahren mit der Maus (Lücke zwischen Link und Liste).
- **Gefunden und behoben:** im Storno-Kasten standen „Sie“ und „du“ nebeneinander. Der Storno-Bereich bleibt bis zur Freigabe vollständig in der Sie-Form (`WORTLAUT-ZUR-FREIGABE-DU.md`).
