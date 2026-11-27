# Preisaktion „Black Week 2026“ (BLACK10)

Stand 2026-11-27. Auftrag des Betreibers: Aus der Seite eine Black Week machen – **10 % Rabatt auf alle Produkte bis 15.12.2026**, übersichtlich dargestellt, und im Warenkorb soll **„Black10“ automatisch erscheinen**, ohne dass die Kundschaft etwas eingeben muss.

## Was gilt
- **10 %** auf den Gesamtpreis **jeder Position** (Textil, Veredelung, Einrichtung bei Kleinstmengen), **nach** Mengenstaffel und Mengenpreis-Deckel. Versand ist ausgenommen; die Versand-Freigrenze (75 € DE) wird am rabattierten Warenwert geprüft.
- Zeitraum **27.11.2026 00:00 bis 15.12.2026 24:00** (Berliner Zeit; technisch: Ende ausschließlich 16.12.2026 00:00 +01:00). Maßgeblich ist der Zeitpunkt des Absendens (Serveruhr).
- Der Code **BLACK10** ist **reine Anzeige**: kein Eingabefeld, kein Einlösen, nicht mehrfach/nicht umgehbar. Ein Wächtertest (`aktion.test.ts`) verbietet `<input>`/Gutschein-Wörter in der Anzeige.

## Wo es sitzt
| Baustein | Datei |
|---|---|
| Zeitraum, Satz, Code (einzige Quelle) | `src/config/aktion.ts` |
| Rechnung des Rabatts (`aktion` in `calculatePrice`, `wendeAktionAn`) | `src/lib/pricing/calculatePrice.ts` |
| Eigene Preiszeile „Black Week: −10 % (Code BLACK10)“ | `src/lib/pricing/stages/positionStage.ts` |
| Serverpreis (autoritativ) | `src/lib/pricing/serverPricing.ts` (`priceCart(items, land, aktion)`), `src/lib/actions/orders.ts` |
| Warenkorb nach Neuladen | `src/lib/cart/preiseAktualisieren.ts`, `src/stores/cartStore.ts` |
| Bestellbearbeitung (rechnet mit der Aktion **zum Bestelldatum**) | `src/lib/orders/orderEdit.ts`, `orderEditService.ts` |
| Anzeige | `src/components/aktion/*` (Leiste, Startseiten-Band, Plakette, Warenkorb-Box), `SummaryPanel.tsx`, `CartDrawer.tsx`, `src/app/black-week/page.tsx`, Produktseite |

**Standard ist „keine Aktion“:** `calculatePrice`, `priceCart`, `berechnePreiseNeu` rabattieren nur, wenn `aktion` übergeben wird. Echte Aufrufstellen übergeben `aktuelleAktion()`; Tests und statische SEO-Preisbeispiele (`kategorieSeite.ts`) rechnen ohne – so hängt nichts am Datum. Ein Wächtertest prüft, dass die echten Aufrufstellen die Aktion übergeben.

## Rechnung und Buchhaltung
Der Rabatt steckt in den **Positionsgesamtpreisen** (`order_items.total_price`) und damit in der Bestellsumme. Die Lexware-Rechnung nimmt jeden Positionsgesamtpreis als Zeile und leitet den Versand als „Endsumme minus Positionen“ ab – das bleibt richtig. **Die Rechnung weist den Rabatt nicht als eigene Zeile aus** (Rechnungslayout wurde nicht angefasst). Die Bestellung speichert keinen Code; erkennbar ist die Aktion am Bestelldatum.

## Rundung
Rabattiert wird der Gesamtpreis (auf Cent), der Stückpreis ist Gesamtpreis ÷ Menge. Dadurch bleibt „größere Bestellung kostet nie weniger“ mit Aktion erhalten (Test über alle Modelle, Mengen 1–1.500). Folge: „Stückpreis × Menge“ kann um wenige Cent vom Gesamtpreis abweichen; der Konfigurator zeigt dann „≈ 17,09 €/Stk. × 10“.

## Nach dem 15.12.
Nichts abzuschalten: Ab 16.12. 00:00 (Berlin) rechnen Server und Browser wieder ohne Rabatt; Leiste, Band und Plakette verschwinden (Server beim nächsten Neuaufbau, Browser sofort); offene Warenkörbe werden beim Laden neu gerechnet. `/black-week` zeigt „Aktion beendet“. Aufräumen (optional): Eintrag in `PREIS_AKTIONEN` stehen lassen oder entfernen.

## Rechtlicher Hinweis (bitte prüfen lassen)
- **Preisangabenverordnung § 11 / 30-Tage-Tiefstpreis:** Beworben wird „10 % auf alles“ als Prozentsatz auf den Shop-Preis, ohne durchgestrichene Statt-Preise. Die Preise wurden am 12./13.11. und 18.11.2026 geändert; ob für die Prozent-Werbung eine Tiefstpreis-Angabe nötig ist, ist eine Rechtsfrage und nicht von uns entschieden.
- Die Tabelle „Was du konkret sparst“ nennt „Preis ohne Rabatt“ (aktueller Shop-Preis), nicht „früherer Preis“.
- Keine Änderung an AGB/Datenschutz/Impressum.
