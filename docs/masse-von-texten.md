# Maße von Texten im echten Maßstab

Stand: 2026-11-08 · Anlass: Bestellung ER-2026-F5EE03 („20,9 × 11,4 cm“ wirkte neben dem Bild unplausibel)

## Wo Maße entstehen und wo sie erscheinen

* **Entstehen:** Im Konfigurator (cm relativ zur Fläche). Logos werden im echten Maßstab gezogen
  (`ConfiguratorCanvas`), Texte aus der gemessenen Textgröße in Pixeln umgerechnet
  (`lib/canvas/textSizing.ts::computeTextBoxCm`).
* **Erscheinen:** Konfigurator (Beschriftung am Motiv, „Live-Maße“ in der Werkzeugleiste),
  Adminbereich (Personalisierung), Produktionsblatt (PDF), Mail an den Betreiber.
  **Nicht** angezeigt werden Maße im Warenkorb, in der Konfigurations-Übersicht und in den
  E-Mails an die Kundschaft – dort gibt es nichts abzugleichen.
* Überall wird derselbe gespeicherte Wert gezeigt (eine Quelle). Neu ist eine einheitliche
  Schreibweise (`lib/format.ts::motivMass`: eine Nachkommastelle, deutsches Komma; der englische
  Konfigurator schreibt mit Punkt) – vorher „20.9“ in Konfigurator/Admin/PDF, „20,9“ in der Mail.

## Befund: Text-Boxen wurden mit dem falschen Maßstab in cm umgerechnet

`computeTextBoxCm` rechnete mit Prozenten der **Leinwand**, der Konfigurator zeichnet die Fläche
aber im Maßstab des **Produktfotos** (Lineale, Vorschau, Produktionsblatt, Logos). Beide sind nur
gleich, wenn das Foto die Leinwand ausfüllt. Gemessen über alle 860 Kombinationen aus Produkt,
Ansicht und Veredelung (Verhältnis Näherung ÷ gezeichneter Maßstab):

| | |
| --- | --- |
| kleinster Wert | 0,79 (T-Shirt Ärmel: Text zu **groß** gemeldet) |
| Median | 1,03 (Hoodie Rückseite: Text 3 % zu **klein** gemeldet) |
| größter Wert | 1,18 (Iconic-T: Text 18 % zu klein gemeldet) |
| über 1,05 | 64 Kombinationen, über 1,10: 20 |

Ein Text wurde also je nach Foto-Format bis zu −21 % / +18 % neben dem echten Maß gemeldet. Bei
der Bestellung ER-2026-F5EE03 kam hinzu, dass Vorschau und Produktionsblatt den zweizeiligen Text
auf **einer** Zeile zeigten (siehe `text-als-jpg-und-mehrzeilentext.md`) – das Bild (34 × 6 cm)
passte nicht zu den Maßen (20,9 × 11,4 cm). Die Maße selbst waren fast richtig (Breite ±1 %, Höhe
−6 %); falsch war vor allem das Bild. Dass die Konfiguration des Kunden zwei Zeilen hatte, ist im
Konfigurator mit denselben Einstellungen nachgebaut (Hoodie grau, Rückseite, Impact 48 px, fett,
kursiv, zwei Zeilen): bisheriger Rechenweg 21,1 × 11,4 cm, jetzt 21,7 × 11,8 cm. In EINER Zeile
verkleinert der Konfigurator die Schrift selbst auf rund 42 px (30,4 × 5,5 cm), weil der Text sonst
breiter als die Fläche wäre.

## Korrektur

* `computeTextBoxCm(…, pxPerCm?)` nimmt den tatsächlich gezeichneten Maßstab entgegen; ohne Angabe
  gilt unverändert die alte Näherung.
* `ConfiguratorCanvas` gleicht jede Text-Box der aktiven Ansicht an diesen Maßstab an
  („Text-Boxen an den Maßstab angleichen“, `textSizing.ts::gleicheTextBoxAn`). Position,
  Schriftgröße und Aussehen bleiben, nur die Maße (und die daraus abgeleitete Stichschätzung)
  ändern sich; kein Undo-Schritt.
* Beispiel Hoodie Rückseite: „20,9 × 11,4 cm“ → „21,7 × 11,8 cm“.

## Die DTF-Regeln bleiben, wie sie sind

* **Preis:** unverändert. DTF hängt an Zahl der Ansichten und Menge, nicht an der Fläche (lokal
  nachgerechnet: 37,99 € je Stück bleibt 37,99 €, egal wie groß die Box ist).
* **Größenregel:** Ein Text darf die empfohlene Maximalgröße der Fläche nicht überschreiten – der
  Konfigurator verkleinert die Schrift automatisch, die Bestellprüfung lehnt Motive über der
  Maximalgröße ab. Beides gilt unverändert. Weil jetzt mit den echten Maßen gemessen wird, wird die
  Schrift in dem Fall verkleinert, in dem sie bisher nur scheinbar passte (bis 18 % größer als die
  Fläche); sonst würde so ein Text erst beim Absenden abgewiesen. Was jemand bewusst über die
  Maximalgröße hinaus zieht, wird nicht angetastet (`gleicheTextBoxAn`).
* **Stickerei:** Die Rechenformel ist unverändert, aber die Fläche, mit der sie rechnet, ist jetzt
  die echte. Die Stichschätzung für **Text** ändert sich dadurch mit dem Quadrat des Maßstabsfehlers
  (Hoodie Rückseite: +7 %; Spanne über alle Produkte rund −38 % … +39 %). Stickerei läuft nur als
  Anfrage, der Preis ist ohnehin eine unverbindliche Kostenschätzung.

## Bekannte Grenzen

* Andere Ansichten als die gerade angezeigte werden erst angeglichen, wenn sie einmal angezeigt
  wurden (das Foto der Ansicht ist die einzige Quelle des Maßstabs). Wer Text auf der Rückseite
  setzt und dann nur die Vorderseite offen hat, legt eine Position mit dem bisherigen Näherungswert
  in den Warenkorb – höchstens wenige Prozent daneben, in der Regel 3 %.
* Die gespeicherte Höhe eines mehrzeiligen Textes misst den Zeilenabstand mit 1,0, der Konfigurator
  zeichnet mit 1,2 (bei 2 Zeilen ≈ 6 % Unterschied zur sichtbaren Tintenhöhe). Das wurde nicht
  angefasst: Es hängt in Stichschätzung und Tintenmessung.

## Tests

`lib/canvas/__tests__/textSizing.test.ts` (Umrechnung mit echtem Maßstab, Rückfall auf die Näherung,
Größenregel bleibt, keine Endlosschleife), Gesamtlauf `npm test`. Zusätzlich im laufenden
Konfigurator geprüft: Maße in Beschriftung und Werkzeugleiste mit Komma, kein Fehler in der Konsole.
