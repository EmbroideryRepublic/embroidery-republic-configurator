# Seitentitel – Wortlaut (Produkttitel FREIGEGEBEN 2026-10-09)

**Freigabe:** Die Produkttitel-Regel (§ 1) hat der Betreiber am 2026-10-09 ausdrücklich
freigegeben („A B und C -> JA") und ist umgesetzt. **Der Startseitentitel (§ 2) ist am
2026-10-09 umgesetzt:** Der Betreiber hat die Auswahl unter vier vorgelegten Varianten mir überlassen
(„alle OK"). Gewählt: **„Textilien bedrucken & besticken lassen | Embroidery Republic"** (60 Zeichen);
bewusst ohne Ortsbezug, weil der Betreiber auf der Website nichts zu Köln veröffentlichen will.

Der `<title>` ist die blaue Überschrift in der Google-Trefferliste und der Text im
Browser-Tab. Er gehört zu den stärksten Signalen, wofür eine Seite gefunden wird – und
ist Kundentext. Deshalb steht hier alles ausgeschrieben.

Stand der Messung am echten Katalog: **154 Produkte**.

---

## 1. Produktseiten – Regel (umgesetzt im Arbeitsverzeichnis, nicht veröffentlicht)

### Das Problem heute

Das Root-Layout hängt an jeden Titel „ | Embroidery Republic Germany" an (29 Zeichen). Für
das Produkt bleiben dadurch **31 Zeichen**. Folge, gemessen:

| Befund | Anzahl von 154 |
|---|---|
| Name wird **mitten im Wort abgeschnitten** („Iconic 195 Ringspun Premium…") | 22 |
| Marke fehlt im Titel | 100 |
| Zwei verschiedene Produkte mit **identischem Titel** | 1 Paar |

Das Paar: *T-Shirt #E150 Long Sleeve / Unisex (Exact)* und *… / Women (Exact)* (beide B&C)
tragen heute beide „T-Shirt #E150 Long Sleeve /… | Embroidery Republic Germany".

### Die neue Regel

Der Titel steht ohne Shop-Anhang (wie bei den neuen Kategorieseiten) und nimmt die erste
Stufe, die in 60 Zeichen passt:

1. `{Name} bedrucken & besticken | {Marke}`
2. `{Name} bedrucken | {Marke}`
3. `{Name} | {Marke}`
4. `{Name} bedrucken`
5. `{Name}`

Gekürzt wird erst, wenn selbst der Name nicht passt (heute der Fall bei 0 Produkten; der
längste Name hat 49 Zeichen).

### Vorher / Nachher – echte Produkte

| | Titel |
|---|---|
| vorher | T-Shirt #E150 Long Sleeve /… \| Embroidery Republic Germany |
| **nachher** | **T-Shirt #E150 Long Sleeve / Unisex (Exact) bedrucken \| B&C** |
| vorher | T-Shirt #E150 Long Sleeve /… \| Embroidery Republic Germany |
| **nachher** | **T-Shirt #E150 Long Sleeve / Women (Exact) bedrucken \| B&C** |
| vorher | Iconic 195 Ringspun Premium… \| Embroidery Republic Germany |
| **nachher** | **Iconic 195 Ringspun Premium Long Sleeve T bedrucken** |
| vorher | Softstyle Ladies V-Neck… \| Embroidery Republic Germany |
| **nachher** | **Softstyle Ladies V-Neck T-Shirt bedrucken \| Gildan** |
| vorher | Strapazierfähiges Poloshirt… \| Embroidery Republic Germany |
| **nachher** | **Strapazierfähiges Poloshirt 599 bedrucken \| Russell** |
| vorher | Heavy T \| Fruit of the Loom \| Embroidery Republic Germany |
| **nachher** | **Heavy T bedrucken & besticken \| Fruit of the Loom** |
| vorher | Classic-T Fitted \| Stedman \| Embroidery Republic Germany |
| **nachher** | **Classic-T Fitted bedrucken & besticken \| Stedman** |
| vorher | Men's Bio Workwear Polo \| Embroidery Republic Germany |
| **nachher** | **Men's Bio Workwear Polo bedrucken \| James+Nicholson** |
| vorher | Microfleece Jacke \| Embroidery Republic Germany |
| **nachher** | **Microfleece Jacke bedrucken & besticken \| ID Identity** |

### Preis dafür

Der Name des Shops steht in diesen Titeln nicht mehr. Er erscheint in Google trotzdem
(WebSite-Daten der Startseite) und steht auf der Seite selbst. Wer lieber den Shopnamen im
Titel behält, bekommt dafür weniger Platz für das Produkt – das war genau die Ursache der
abgeschnittenen Titel.

Abgesichert durch Tests über den **echten Katalog** (`produktTitel.test.ts`): kein Titel
länger als 60 Zeichen, keiner mit „…" abgeschnitten, alle verschieden, jeder enthält den
vollständigen Namen. Fügt jemand später ein Produkt mit zu langem oder doppeltem Namen
hinzu, schlägt der Test an.

---

## 2. Startseite – UMGESETZT 2026-10-09 (Variante „Textilien bedrucken & besticken lassen")

**Heute (72 Zeichen, in Google hinten abgeschnitten):**

> Textilveredelung mit Stickerei & DTF-Druck | Embroidery Republic Germany

„Textilveredelung" ist Fachsprache; gesucht wird eher „Firmenbekleidung bedrucken",
„Hoodies besticken", „T-Shirts bedrucken lassen".

**Vorschlag (60 Zeichen, passt genau):**

> Firmenbekleidung bedrucken & besticken | Embroidery Republic

Die Beschreibung darunter bleibt unverändert:
„Hochwertige Stickerei und DTF-Transferdruck für Unternehmen, Vereine und Marken. Selbst
gestalten im Konfigurator – ab 1 Stück, ohne Mindestbestellmenge."

Das ist eine Geschäftsentscheidung: „Firmenbekleidung" spricht Unternehmen an, nicht
Privatkunden mit Einzelwünschen („Hoodie mit eigenem Motiv"). Wenn beide Gruppen
wichtig sind, wäre die Alternative: *„Textilien bedrucken & besticken lassen | Embroidery
Republic"* (ebenfalls 60 Zeichen).
