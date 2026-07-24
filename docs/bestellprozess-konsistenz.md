# Konsistenz des Bestellprozesses

Was innerhalb und was außerhalb der Transaktion geschieht – und warum.
Stand 2026-07-22, umgesetzt und nachgewiesen.

---

## Der Grundsatz

> Entweder die Bestellung entsteht vollständig, oder sie entsteht nicht.
> Ein Zwischenzustand ist nicht beobachtbar.

---

## Was vorher falsch war

Eine Bestellung entstand in drei getrennten Aufrufen ohne Transaktion:

```
insert orders                  → Erfolg
insert order_items             → Fehler
insert configuration_elements  → nie erreicht
```

Zurück blieb eine Bestellung ohne Positionen. Die Anwendung meldete einen
Fehler, die Kundschaft versuchte es erneut – und traf auf die Idempotenzsperre
aus Migration 0011. Die lieferte **den Torso als Erfolg** zurück.
Bestätigungsmail raus, Produktion unmöglich, Auffallen frühestens beim Öffnen
des Produktionsblatts.

---

## Die vier Phasen

### Phase 0 — Prüfen und Rechnen (keine Wirkung)

Validierung der Eingaben, autoritative Preisberechnung, Idempotenzprüfung.
Rein lesend. Ein Abbruch hinterlässt nichts.

### Phase 1a — Dateien ablegen (**außerhalb** der Transaktion)

Die Logodateien werden vor der Transaktion hochgeladen. Dafür wird die
Bestellkennung in der Anwendung erzeugt (`randomUUID()`) statt von der
Datenbank vergeben – nur so steht der endgültige Speicherpfad schon fest.

**Warum außerhalb:** Uploads sind externe Wirkungen auf einen fremden Dienst.
Sie lassen sich nicht zurückrollen, und eine offene Datenbanktransaktion, die
auf einen Netzwerkaufruf wartet, hält Sperren und Verbindungen. Unter Last ist
das der nächste Ausfall.

**Fehlerfall:** Bricht ein Upload ab, endet der Vorgang hier. In der Datenbank
ist noch nichts entstanden – der sauberste denkbare Zustand.

**Restrisiko, bewusst getragen:** Gelingt der Upload und scheitert die
Transaktion danach, bleiben verwaiste Dateien im Speicher. Kein Datenverlust,
kein falscher Zustand, nur belegter Platz. Ein Aufräumlauf kann sie an
fehlenden Bestellungen erkennen (offen, unkritisch).

### Phase 1b — Die Transaktion (**alles oder nichts**)

`create_order_atomic(p_order, p_items)` legt in **einer** Transaktion an:

1. `orders`
2. alle `order_items`
3. alle `configuration_elements`

Postgres rollt vollständig zurück, wenn irgendetwas fehlschlägt – auch bei
Verbindungsabbruch, Zeitüberschreitung oder Prozessabsturz. Genau das
unterscheidet die Datenbankfunktion von einem Aufräumpfad im Anwendungscode:
Ein `catch`-Block hilft nur, solange der Prozess lebt.

**Nachgewiesen am 2026-07-22:** Ein absichtlicher Fehler in der zweiten
Position (fehlendes Pflichtfeld) rollte die bereits eingefügte Bestellung und
die erste Position vollständig zurück. Bestand vorher und nachher identisch
(10 / 19 / 20), keine Bestellung mit der Probekennung vorhanden.

### Phase 2 — Folgeprozesse (**außerhalb**, danach)

Erst wenn die Transaktion steht: Druckvorschauen, Produktionsblatt,
Bestellbestätigung, interne Benachrichtigung.

**Warum außerhalb:** Auch das sind externe, nicht zurückrollbare Wirkungen.
Eine verschickte E-Mail lässt sich nicht zurücknehmen; würde sie innerhalb
der Transaktion ausgelöst und diese rollte zurück, wäre eine Bestätigung für
eine nicht existierende Bestellung unterwegs.

`schliesseBestellungAb()` wirft deshalb nicht, sondern **berichtet**. Eine
gespeicherte Bestellung darf an dieser Stelle nicht mehr scheitern: Sie
existiert, sie ist gültig, und ein fehlgeschlagenes Vorschaubild ändert daran
nichts. Probleme werden protokolliert und lassen sich nachholen.

**Lieferantenprozess:** Läuft bewusst gar nicht hier, sondern erst nach
Ablauf der Stornofrist, ausgelöst durch das Öffnen im Adminbereich. Während
der Frist darf kein Lieferantenauftrag entstehen – dann muss auch nichts
zurückgenommen werden.

---

## Übersicht

| Schritt | in der Transaktion | Grund |
|---|---|---|
| Validierung, Preisberechnung | – | rein lesend |
| Datei-Uploads | **nein** | extern, nicht zurückrollbar, langsam |
| `orders` | **ja** | Kern der Bestellung |
| `order_items` | **ja** | ohne sie ist die Bestellung wertlos |
| `configuration_elements` | **ja** | ohne sie ist keine Produktion möglich |
| Vorschau-Rendering | **nein** | teuer, nachholbar |
| Produktionsblatt | **nein** | teuer, nachholbar |
| E-Mails | **nein** | nicht zurücknehmbar |
| Lieferantenauftrag | **nein** | erst nach der Stornofrist |

---

## Race Conditions

### Doppelte Absendung — gelöst

Zwei Riegel:

1. **Vorabprüfung** auf `client_request_id`. Deckt den häufigen Fall ab: Die
   Absendung war erfolgreich, aber die Antwort kam nicht an.
2. **Der eindeutige Index** (Migration 0011) als letzter Schiedsrichter.

Zwischen beiden liegt immer eine Lücke. Seit die Bestellung atomar entsteht,
ist der zweite Riegel jedoch verlässlich: Treffen zwei Anfragen gleichzeitig
ein, blockiert die zweite am Index, bis die erste abgeschlossen ist. Danach
sieht sie entweder eine **vollständige** Bestellung (Konflikt 23505 →
bestehende zurückgeben) oder **gar keine** (die erste wurde zurückgerollt →
selbst anlegen).

Der frühere Fehler – eine unvollständige Bestellung als Erfolg auszugeben –
ist damit strukturell ausgeschlossen, nicht nur unwahrscheinlich gemacht.

### Ergebnis ohne Kennung — abgefangen

Liefert die Transaktion kein Ergebnis, ohne einen Fehler zu melden, gilt das
**nicht** als Erfolg. Sonst würde eine nicht existierende Bestellung
bestätigt.

### Gleichzeitige Statuswechsel — bereits gelöst

`orderService.ts:92` setzt den Status mit `.eq('status', von)`. Zwei
gleichzeitige Klicks im Adminbereich führen dazu, dass nur der erste wirkt.

### Doppelt zugestellte Zahlungsereignisse — bereits gelöst

`paymentService.ts` aktualisiert mit `.eq('payment_status', 'pending')`. Ein
zweites Mal zugestelltes Ereignis findet keine Zeile mehr und läuft ins Leere,
statt eine bereits bestätigte Zahlung erneut zu verarbeiten.

---

## Abgesichert durch

| Test | prüft |
|---|---|
| `phasentrennung.test.ts` | kein direkter Insert in die drei Tabellen mehr |
| `phasentrennung.test.ts` | Uploads liegen vor der Transaktion |
| `phasentrennung.test.ts` | Abschluss läuft nach der Transaktion |
| `phasentrennung.test.ts` | Ergebnis ohne Kennung gilt nicht als Erfolg |
| `scripts/e2eBestellung.mts` | 21 Prüfungen über den echten Serverweg |

Die Wächter im Phasentest sind bewusst textbasiert: Sie schlagen an, sobald
jemand wieder einen Einzelinsert einbaut – auch in einem Jahr, auch von
jemandem, der diese Datei nie gelesen hat.
