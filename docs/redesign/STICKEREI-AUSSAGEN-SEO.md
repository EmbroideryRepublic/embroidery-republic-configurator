# Stickerei-Aussagen in den SEO-Seiten (Kategorie-, Anlass-, DTF-Seiten, Metadaten)

Stand: 2026-11-25 · Branch `arbeit-stick-1` · Betriebsschalter `BETRIEBSSCHALTER.pausierteVeredelungen = ['embroidery']` (`src/config/bestellweg.ts`).

**Auftrag des Betreibers:** „Es darf keine falschen Leistungsversprechen geben.“ Solange die Stickerei pausiert ist, darf kein sichtbarer Kundentext sie als verfügbare Leistung nahelegen. Erlaubt sind nur die ausdrücklichen Pause-Hinweise (`HINWEIS_STICKEREI_PAUSIERT`, Kartenkennzeichnung `KARTE_STICKEREI_PAUSIERT`).

**Wiederaufnahme:** Wird der Schalter geleert (`[]`), kommt der bisherige Wortlaut samt Stickerei-Angebot vollständig zurück. Dafür bleibt der normale Wortlaut in `src/config/seo/kategorieSeiten.ts` unverändert stehen (auch die drei Titel, die vorher dauerhaft auf „…, DTF-Druck“ standen, stehen dort wieder in der Fassung vor der Pause); der Pausen-Wortlaut liegt daneben (`beiPause` je Seite und je Frage) und wird nur bei pausierter Stickerei gewählt (`seitenTexte()` in `src/lib/seo/kategorieSeite.ts`). Ein Test (`stickereiPauseSeiten.test.ts`) rendert die Seiten mit leerem Schalter und prüft den bisherigen Wortlaut.

Alle Zeilen unten beschreiben, was bei **pausierter Stickerei** ausgeliefert wird („vorher“ = Stand `b8d1f0f8`, „nachher“ = dieser Commit). Platzhalter sind mit den heutigen Katalogwerten befüllt (Hoodies: 30 Modelle, Marken B&C, Fruit of the Loom, Build Your Brand; T-Shirts: 64, Fruit of the Loom, B&C, James+Nicholson; Polos: 26, B&C, Russell, James+Nicholson).

## 1. Geänderte Stellen (Wortlaut bei pausierter Stickerei)

### Kategorieseiten `/hoodies-bedrucken-besticken`, `/t-shirts-bedrucken-besticken`, `/poloshirts-besticken-bedrucken`

Dateien: `src/config/seo/kategorieSeiten.ts` (Wortlaut), `src/lib/seo/kategorieSeite.ts` (Auswahl `seitenTexte`), `src/app/[kategorie]/page.tsx` (Seite und Metadaten).

| Datei | Stelle | vorher | nachher |
|---|---|---|---|
| `[kategorie]/page.tsx` | H1 und Seitenname im JSON-LD (Hoodies) | Hoodies bedrucken & besticken lassen | Hoodies bedrucken lassen |
| dto. | H1 / JSON-LD (T-Shirts) | T-Shirts bedrucken & besticken lassen | T-Shirts bedrucken lassen |
| dto. | H1 / JSON-LD (Poloshirts) | Poloshirts besticken & bedrucken lassen | Poloshirts bedrucken lassen |
| dto. | Meta-Beschreibung, Open Graph, JSON-LD `description` (Hoodies) | 30 Hoodies von B&C, Fruit of the Loom, Build Your Brand u. a. mit Logo oder Motiv veredeln: DTF-Transferdruck oder Stickerei, live im Konfigurator, ab 1 Stück. | 30 Hoodies von B&C, Fruit of the Loom, Build Your Brand u. a. per DTF-Transferdruck mit Logo oder Motiv bedrucken – ab 1 Stück, live im Konfigurator. |
| dto. | Meta-Beschreibung (T-Shirts) | 64 T-Shirts von Fruit of the Loom, B&C, James+Nicholson u. a. mit Logo oder Motiv veredeln: DTF-Transferdruck oder Stickerei, live im Konfigurator, ab 1 Stück. | 64 T-Shirts von Fruit of the Loom, B&C, James+Nicholson u. a. per DTF-Transferdruck mit Logo oder Motiv bedrucken – ab 1 Stück, live im Konfigurator. |
| dto. | Meta-Beschreibung (Poloshirts) | 26 Poloshirts von B&C, Russell, James+Nicholson u. a. mit Firmenlogo besticken oder bedrucken: live im Konfigurator gestalten, ab 1 Stück, ohne Mindestmenge. | 26 Poloshirts von B&C, Russell, James+Nicholson u. a. per DTF-Transferdruck mit Firmenlogo bedrucken – ab 1 Stück, live im Konfigurator, ohne Mindestmenge. |
| dto. | Seitentitel (alle drei) | schon ohne „besticken“ (Freigabe 2026-11-24): „Hoodies / T-Shirts / Poloshirts bedrucken lassen – ab 1 Stück, DTF-Druck“ | unverändert (jetzt als `beiPause.titel`; der normale Titel steht wieder in der Fassung vor der Pause: „Hoodies bedrucken & besticken lassen – ab 1 Stück“, „T-Shirts bedrucken & besticken lassen – ab 1 Stück“, „Poloshirts besticken & bedrucken lassen – ab 1 Stück“) |
| dto. | Einleitung, 1. Absatz (nur Poloshirts) | Das Poloshirt ist der klassische Auftritt für Betrieb, Verein und Team – mit gesticktem Logo auf der Brust wirkt es sofort einheitlich. Wähle aus 26 Polo-Modellen von 8 Marken, platziere dein Logo live im Konfigurator und sieh den Preis in Echtzeit. | Das Poloshirt ist der klassische Auftritt für Betrieb, Verein und Team – mit dem Logo auf der Brust wirkt es sofort einheitlich. Wähle aus 26 Polo-Modellen von 8 Marken, platziere dein Logo live im Konfigurator und sieh den Preis in Echtzeit. |
| dto. | Abschnittsüberschrift „Verfahren“ (alle drei) | DTF-Transferdruck oder Stickerei? | So kommt dein Motiv aufs Textil (wie auf der Startseite bei Pause) |
| dto. | Stickerei-Karte, Beschreibung (Hoodies) | Für Logos, Monogramme und Schriftzüge ist die Stickerei die hochwertige Wahl: Sie wirkt erhaben, besteht aus echtem Garn und ist besonders langlebig und waschbeständig. Sie arbeitet mit einer begrenzten Zahl fester Garnfarben und eignet sich vor allem für kompaktere Motive wie ein Brustlogo. | entfällt; die Karte zeigt nur „Stickerei“ und die Kennzeichnung „Derzeit nicht verfügbar“ |
| dto. | Stickerei-Karte, Beschreibung (T-Shirts) | Ein dezentes Brustlogo oder ein Schriftzug wirkt gestickt besonders hochwertig: erhaben, aus echtem Garn, langlebig und waschbeständig. Stickerei arbeitet mit einer begrenzten Zahl fester Garnfarben ohne Farbverläufe und eignet sich für kompaktere Motive. | entfällt (wie oben) |
| dto. | Stickerei-Karte, Beschreibung (Poloshirts) | Ein gesticktes Brustlogo ist der Klassiker auf dem Poloshirt: erhaben, aus echtem Garn, besonders langlebig und waschbeständig. Stickerei arbeitet mit einer begrenzten Zahl fester Garnfarben ohne Farbverläufe. Dein Logo digitalisiert unser Team vor der Produktion in Garnfarben und legt es dir zur Freigabe vor. | entfällt (wie oben) |
| dto. | Stickerei-Karte, Darstellung | ganze Karte abgeblendet (`opacity-70`) | nur das Symbol abgeblendet (`bg-brand/50`), wie bei `Veredelungsverfahren` auf der Startseite (eine durchscheinende Karte unterschritt das Kontrastverhältnis, Lighthouse 2026-11-24) |
| dto. | DTF-Karte (nur Poloshirts) | Ist dein Motiv farbenreich, hat Verläufe oder ist ein Foto, ist der DTF-Transferdruck die bessere Wahl: vollfarbig, auch großflächig, mit flexiblem Griff, der sich mit dem Stoff bewegt. („bessere Wahl“ setzt die Stickerei als Gegenstück voraus) | Auch farbenreiche Motive, Verläufe und Fotos gelingen auf dem Poloshirt mit DTF-Transferdruck: vollfarbig, auch großflächig, mit flexiblem Griff, der sich mit dem Stoff bewegt. |
| dto. | Reihenfolge der Karten (nur Poloshirts) | Stickerei-Karte vor der DTF-Karte | DTF-Karte zuerst (bei Wiederaufnahme wieder Stickerei zuerst) |
| dto. | FAQ 1 Frage (Hoodies) | Kann ich auch nur einen einzelnen Hoodie bedrucken oder besticken lassen? | Kann ich auch nur einen einzelnen Hoodie bedrucken lassen? (Antwort unverändert: „Ja. Es gibt keine Mindestbestellmenge – …“) |
| dto. | FAQ 1 Frage (T-Shirts) | Kann ich auch nur ein einzelnes T-Shirt bedrucken oder besticken lassen? | Kann ich auch nur ein einzelnes T-Shirt bedrucken lassen? |
| dto. | FAQ 1 Frage (Poloshirts) | Kann ich auch nur ein einzelnes Poloshirt besticken lassen? | Kann ich auch nur ein einzelnes Poloshirt bedrucken lassen? |
| dto. | FAQ „Druck oder Stickerei“ (Hoodies) | Was ist besser für einen Hoodie: Druck oder Stickerei? — Das hängt vom Motiv ab. DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Stickerei ist langlebiger und hochwertiger in der Haptik, arbeitet aber mit einer begrenzten Anzahl fester Garnfarben (keine Farbverläufe) und eignet sich vor allem für kompaktere Motive wie Brustlogos. | Wofür eignet sich der DTF-Transferdruck bei einem Hoodie? — DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Der Griff bleibt flexibel und bewegt sich mit dem Stoff. (wortgleich mit den DTF-Seiten) |
| dto. | FAQ „Druck oder Stickerei“ (T-Shirts) | Was ist besser für ein T-Shirt: Druck oder Stickerei? — (Antwort wie oben) | Wofür eignet sich der DTF-Transferdruck bei einem T-Shirt? — (Antwort wie oben, nachher) |
| dto. | FAQ „Stickerei oder Druck“ (Poloshirts) | Was ist besser für ein Poloshirt: Stickerei oder Druck? — (Antwort wie oben) | Wofür eignet sich der DTF-Transferdruck bei einem Poloshirt? — (Antwort wie oben, nachher) |
| dto. | FAQ „Digitalisierung“ (nur Poloshirts) | Wie läuft die Digitalisierung meines Logos für die Stickerei ab? — Für Stickerei digitalisiert unser Team dein Logo manuell in Garnfarben. Vor Produktionsstart erhältst du eine finale Vorschau zur Freigabe. Die Vorschau im Konfigurator zeigt die Platzierung, nicht das finale Stickbild. | Frage entfällt (ohne Stickerei gibt es nichts zu digitalisieren); die Seite hat danach fünf Fragen, im JSON-LD (FAQPage) ebenso |
| dto. | FAQ „Welche Dateien …“ Antwort (alle drei) | SVG, PNG, JPG/JPEG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren. Für Stickerei digitalisiert unser Team dein Logo anschließend manuell in Garnfarben – die Vorschau im Konfigurator zeigt die Platzierung, nicht das finale Stickbild. | SVG, PNG, JPG/JPEG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren. (wortgleich mit den DTF-Seiten) |
| dto. | FAQ „Wie lange dauert …“ Antwort (alle drei) | Die Produktion beginnt nach Bestellfreigabe, sobald alle Druck- bzw. Stickdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, … | Die Produktion beginnt nach Bestellfreigabe, sobald alle Druckdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, … (Rest unverändert, wortgleich mit den DTF-Seiten) |

Schon vor diesem Commit korrekt und **unverändert**: Eyebrow „DTF-Transferdruck“, Einleitung 2. Absatz (`EINLEITUNG_DTF`), Hinweis mit `HINWEIS_STICKEREI_PAUSIERT`, Preisbeispiele ohne Stickerei-Zeilen (Fußnote zu Stichen entfällt von selbst), Ablauf mit „DTF-Druck bestellst du direkt im Konfigurator.“, FAQ „Welche Hoodies/T-Shirts/Poloshirts gibt es …“, T-Shirt-Frage „Wo auf dem T-Shirt kann ich mein Motiv platzieren?“.

### Metadaten und strukturierte Daten

| Datei | Stelle | vorher | nachher |
|---|---|---|---|
| `src/app/manifest.ts` | Web-App-Manifest `description` | Firmen- und Teambekleidung individuell veredeln: DTF-Transferdruck und Stickerei, live im Konfigurator gestaltet. | Firmen- und Teambekleidung individuell veredeln: DTF-Transferdruck, live im Konfigurator gestaltet. |
| `src/lib/seo/strukturierteDaten.ts` | `sammlungSchema` (JSON-LD der Seite `/produkt`), `description` | 182 individuell veredelbare Produkte etablierter Marken – mit DTF-Transferdruck oder Stickerei, ab 1 Stück. | 182 individuell veredelbare Produkte etablierter Marken – mit DTF-Transferdruck, ab 1 Stück. (Zahl = Anzahl der Katalogprodukte) |

## 2. Geprüft und bereits korrekt (keine Änderung nötig)

Alle Seiten wurden im Test tatsächlich gerendert (Text, Attribute, JSON-LD) und die Metadaten-Funktionen aufgerufen; Treffer für „Stick…“, „gestickt“, „Garn(farben)“, „Stiche“, „digitalisier…“ gibt es dort nicht.

- Alle 18 Anlass- und Ratgeberseiten (`src/config/seo/anlassSeiten.ts`, `AnlassLandingpage`, `anlassMetadata`), alle DTF-Seiten für Marken und Produktarten (`dtfSeiten.ts`, `DtfLandingpage`, `dtfMetadata`, einschließlich Kinder- und Sportbekleidung): kein Stickerei-Text.
- Geschäftsanfrage (`config/seo/geschaeftsanfrage.ts`, `GeschaeftsanfrageForm`): keine Stickerei-Auswahl und kein Stickerei-Text.
- `src/lib/seo/shopBeschreibung.ts` (Meta-Beschreibung von `/produkt`), `src/lib/seo/produktFakten.ts` (Produktseiten-Fakten, bekommt den Schalter übergeben), `organisationSchema` (Startseite), `llmsText.ts`, Sitemap, Fußzeilen-Links (`FooterSeoLinks`).

## 3. Bewusst belassene Treffer

| Treffer | Grund |
|---|---|
| Adressen `hoodies-bedrucken-besticken`, `t-shirts-bedrucken-besticken`, `poloshirts-besticken-bedrucken` (Sitemap, Canonical, Links, JSON-LD `url`/`item`) | Indexierte Adressen; dürfen sich nicht ändern (Weiterleitungen/Canonicals unverändert). |
| `HINWEIS_STICKEREI_PAUSIERT` im Kasten „Hinweis:“ auf den drei Kategorieseiten | Ausdrücklicher Pause-Hinweis, ausdrücklich erlaubt. |
| Stickerei-Karte „Stickerei · Derzeit nicht verfügbar“ (`KARTE_STICKEREI_PAUSIERT`) auf den drei Kategorieseiten | Ausdrückliche Kennzeichnung der Pause, ausdrücklich erlaubt; die Karte trägt nur Name und Kennzeichnung, keine Beschreibung. |
| llms.txt: „Die Stickerei ist wegen Wartungs- und Umbauarbeiten vorübergehend nicht verfügbar.“ (`lib/seo/llmsText.ts`) | Ausdrückliche Pause-Aussage (Bestandstext); verhindert, dass KI-Assistenten ein Stickerei-Angebot annehmen. |
| Markenname „Embroidery Republic Germany“ (Titel-Vorlage, JSON-LD `name`, Manifest, Vorschaubild `opengraph-image.jpg`) | Firmenname, keine Leistungsaussage. |
| Farbname „Garnet“ in den Produktkacheln | Produktfarbe, kein Stickerei-Bezug (der Test sucht deshalb „Garnfarb…“ und das Wort „Garn“ allein). |
| Anlassseite „DTF oder Siebdruck“ (Siebdruck) | Sachlicher Vergleich; sagt ausdrücklich „Siebdruck bieten wir nicht an“. Kein Stickerei-Bezug. |
| Code-Kommentare und der unveränderte normale Wortlaut in `kategorieSeiten.ts` | Nicht ausgeliefert, solange die Stickerei pausiert ist; werden bei Wiederaufnahme gebraucht. |

## 4. Tests

**Neu:** `src/lib/seo/__tests__/stickereiPauseSeiten.test.ts` (8 Tests)

- Pause: Kategorieseiten (3), alle Anlass- und Ratgeberseiten, alle DTF-Seiten, Fußzeilen-Links, Geschäftsanfrage-Formular, llms.txt, Manifest, Sitemap, Sammlungs- und Organisations-Schema, Meta-Beschreibung der Produktübersicht werden gerendert bzw. aufgerufen; im Text, in Attributtexten (alt/title/aria-label), in JSON-LD und in Titel/Beschreibung/Open Graph darf kein „Stick…“, „gestickt“, „digitalisier…“, „Garn“, „Garnfarben“, „Stiche“ stehen – außer Adressen, `HINWEIS_STICKEREI_PAUSIERT` und der Kartenkennzeichnung. Zusätzlich: Hinweis und Kennzeichnung sind vorhanden, die Überschrift bietet keine Wahl mehr an, die FAQ-Auszeichnung ist wortgleich mit der sichtbaren Seite, die Seitenüberschrift im JSON-LD ist der Pausen-Wortlaut.
- Pause: Titel höchstens 60 Zeichen und eindeutig, Beschreibung 70–160 Zeichen und eindeutig, mindestens vier eindeutige Fragen, keine offenen Platzhalter; Pausen-Antworten wortgleich mit den DTF-Seiten.
- Wiederaufnahme (Schalter leer): Titel, Überschrift, Beschreibung, alle Fragen, Einleitung, Stickerei-Karte, Hinweis „zwischen ihnen wechseln“, Ablauf („Stickerei gibt es nur auf Anfrage“), Preisbeispiele mit Stichen, Reihenfolge der Karten, Manifest, Schemas und Beschreibung entsprechen wieder dem bisherigen Wortlaut; kein Pause-Hinweis, keine Kennzeichnung.
- Gegenprobe durchgeführt: Mit absichtlich zurückgenommenen Korrekturen (Pausen-Wortlaut, Karten-Text, Manifest) schlagen die Pause-Tests fehl.

**Angepasst (nur erwarteter Wert, keine Assertion entfernt oder abgeschwächt):** `src/lib/seo/__tests__/kategorieSeite.test.ts`, Test „Stickerei pausiert: die Einleitung bietet nicht mehr „wahlweise Stickerei“ an, sonst bleibt sie gleich“: Der erste Absatz bleibt unverändert, außer dort, wo er selbst die Stickerei nennt (Poloshirt: „gesticktem Logo“). Erwartet wird jetzt `seite.beiPause.einleitung?.[0] ?? seite.einleitung[0]` statt `seite.einleitung[0]`.

Unverändert grün (laufen weiter gegen den neuen Stand): `anlassSeiten.test.ts`, `dtfSeiten.test.ts`, `geschaeftsanfrage.test.ts`, `produktFakten.test.ts`, `shopBeschreibung.test.ts`, `strukturierteDaten.test.ts`, `stickereiPause.test.ts`, `veredelungsverfahren.test.ts`.

## 5. Außerhalb dieses Auftrags aufgefallen (nicht angefasst)

- `src/components/shop/Veredelungsverfahren.tsx` (auf Startseite und Produktseite): Die Stickerei-Karte trägt bei Pause die Kennzeichnung „Derzeit nicht verfügbar“, zeigt aber weiter ihre Kurzbeschreibung und drei Merkmale („Hochwertig & langlebig, ideal für Firmenlogos“, „Edler, erhabener Auftritt aus echtem Garn“ …). Gehört zu Startseite/Produktseite und ist durch `veredelungsverfahren.test.ts` festgeschrieben.
- Die Filterleiste auf `/produkt` kennt „Stickerei“ als Wert der Veredelung (`filterBausteine.tsx`); das Menü bleibt ausgeblendet, solange jedes Produkt beide Verfahren zulässt; bei einem Aufruf mit `?veredelung=embroidery` würde der Wert „Stickerei“ aber als aktiver Filter erscheinen.
