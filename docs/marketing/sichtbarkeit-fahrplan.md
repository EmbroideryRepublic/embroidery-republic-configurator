# Sichtbarkeit in Suchmaschinen und KI-Assistenten – Fahrplan

Stand: 2026-10-09 (A/B/C am selben Tag veröffentlicht und live geprüft; Köln-Fakten vom Betreiber
bestätigt) · Ziel: Die Suchalgorithmen (Google, Bing und die KI-Assistenten, die auf diese
Indizes zugreifen) sollen **ergermany.de empfehlen, wenn jemand nach Bestickung, Bedruckung,
Firmen-, Vereins- oder Teamkleidung sucht.**

Dieses Dokument trennt strikt, was **fertig**, was **vorbereitet und wartet auf Ihre
Textfreigabe** und was **nur Sie tun können** (Konten, Bewertungen, Budget) ist. Es enthält keine
erfundenen Zahlen: Alles, was auf Recherche beruht, steht mit Quelle und Datum in § 14.

---

## 0. Ehrliche Einordnung

- **Niemand kann „Platz 1" zusichern** – auch keine Agentur. Google und Bing entscheiden; wer
  anderes verspricht, verkauft etwas.
- Eine neue Website braucht für umkämpfte Begriffe („T-Shirt bedrucken") **Monate**, nicht
  Wochen. Für konkrete Suchen („Poloshirt mit Logo besticken lassen ab 1 Stück") geht es
  schneller.
- **Der wichtigste Befund** der letzten Tage war kein Mangel an Inhalten, sondern ein
  technischer: Die Adressen mit und ohne „www" widersprachen sich, Google konnte die Seite
  nicht sauber zuordnen. Das ist behoben und live (Commits `022c78c0`, `08d03bc8`, `cb6a74af`).
- Schneller als organisch geht nur **bezahlt** (Anzeigen, § 7). Das ist eine Budgetentscheidung.

---

## 1. Wie Algorithmen entscheiden – und wo wir stehen

| Frage des Algorithmus | Was sie prüft | Unser Stand | Nächster Schritt |
|---|---|---|---|
| **Kann ich die Seite lesen und zuordnen?** (Crawling, Indexierung) | Erreichbarkeit, Canonical, Sitemap, robots, Weiterleitungen | **Behoben und live.** Prüfskript `npm run seo:pruefen` live am 2026-10-09: **16 von 16 bestanden** (166 Seiten, 166 verschiedene Titel). Bing/Co. wurden per IndexNow benachrichtigt (166 Adressen angenommen). | Search Console und Bing Webmaster Tools bestätigen (**Sie**, § 6). |
| **Passt die Seite zur Suchabsicht?** (Relevanz) | Titel, Überschriften, Text, Strukturdaten pro Anfrage | 3 Kategorieseiten (Hoodies, T-Shirts, Polos) und neue Produkttitel **live seit 2026-10-09** (Freigaben B und C) | Ausbau nach § 3 |
| **Vertraut man der Seite?** (Autorität) | Verweise von anderen Seiten, Erwähnungen, Bewertungen, Alter | **Größte Lücke** – neu, keine Bewertungen, keine Verweise | § 4 |
| **Ist sie angenehm nutzbar?** (Seitenerlebnis) | Ladezeit, mobil, Stabilität | Lighthouse (lokaler Produktions-Build, mobil): **Leistung 90–91, SEO 100, Best Practices 100, Barrierefreiheit 92–96**, keine Layout-Sprünge. Der größte sichtbare Inhalt lädt auf dem lokalen Build (ohne Netzwerkverzögerung) in unter 1 s; die 3,5 s im Lighthouse-Drosselmodell sind simuliert. | Echte Messwerte kommen aus der Search Console, sobald Besucher da sind. Kein Handlungsbedarf. |
| **Ist sie aktuell und gründlich?** | Tiefe, Aktualität, eigene Daten | Preisbeispiele sind aus der echten Preis-Engine berechnet (Konkurrenz zeigt kaum Preise) | Ratgeber, § 3 |
| **Ist sie lokal relevant?** | Standort, Verzeichnisse, Google-Unternehmensprofil | Einschränkung beim Unternehmensprofil, § 5 | Verzeichnisse, § 4/5 |

### KI-Assistenten (ChatGPT-Suche, Perplexity, Gemini, Google-KI-Übersichten)

Sie holen sich Seiten aus denselben Indizes (u. a. Bing und Google) und fassen sie zusammen.
Zitiert wird, was **indexiert, gut lesbar und faktenreich** ist und was **andere erwähnen**. Das
heißt für uns:

1. **Bing-Indexierung ist keine Nebensache** – IndexNow ist eingerichtet, die Bestätigung bei
   Bing Webmaster Tools fehlt noch (§ 6).
2. **Klare, zitierfähige Fakten auf den Seiten**: „ab 1 Stück", Preisbeispiele, Produktionszeit,
   Dateiformate. Die Kategorieseiten enthalten das.
3. **Erwähnungen Dritter** (Verzeichnisse, Vergleichsseiten, Vereinsseiten) – § 4.
4. `robots.txt` sperrt **keine** KI-Crawler (nur Admin, Konto, Bestell-Links) – geprüft.
5. Eine `llms.txt` wurde **bewusst nicht** angelegt: Für diese Datei ist kein belegter Nutzen
   bekannt. Sobald sich das ändert, ist sie in Minuten gebaut.

**Keine Garantie, auch hier.** Es gibt keinen Schalter, der KI-Assistenten zum Empfehlen zwingt.

---

## 2. Was bereits erledigt ist

| Bereich | Stand |
|---|---|
| Ursache der Unsichtbarkeit (www-Konflikt, Canonical, Sitemap, Vorschaubilder) | **live** |
| `*.vercel.app` per `noindex` gesperrt (keine Doppel-Indexierung) | **live** |
| IndexNow (Bing, DuckDuckGo, Ecosia, ChatGPT-Suche) | **live**, nach jedem Deploy erneut |
| Live-Prüfung `npm run seo:pruefen` | vorhanden |
| 154 Produktseiten mit Strukturdaten (Product, Breadcrumb) | **live** |
| 3 Kategorieseiten + Strukturdaten (CollectionPage, FAQPage, BreadcrumbList) | **live seit 2026-10-09** (Freigabe B) |
| Neue Produkttitel (22 abgeschnittene, 1 doppelter behoben); Startseitentitel bewusst unverändert | **live seit 2026-10-09** (Freigabe C) |
| Besucherzähler mit Auswertung nach Kanal | **live seit 2026-10-09** (Freigabe A): Migration 0037 angewendet, Datenschutz ergänzt. Livetest: Testbesuch gezählt, Rate-Limit-Schlüssel ohne IP |
| Bestätigungs-Tags für Google/Bing über Vercel-Variablen | gebaut (`GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`), wirkt erst nach Setzen der Variable |
| Druckfertige QR-Codes mit Kanalkennzeichnung | `docs/marketing/qr/` (Flyer, Visitenkarte, Schaufenster, Paketbeilage, Messe) |
| Textbausteine für Verzeichnisse, Social, Presse, Anzeigen, Bewertungen | `docs/marketing/textbausteine.md` |

---

## 3. Seitenplan: Welche Suchanfrage bekommt welche Seite?

**Beleg aus der Recherche (Stand 08.10.2026):** Der am häufigsten gefundene Wettbewerber mit
„ohne Mindestmenge" (Printful) betreibt **je Produkt und Verfahren eine eigene Seite**, z. B.
„Polo-Shirts besticken lassen", „Hoodie besticken lassen", „T-Shirts besticken lassen",
„T-Shirt bedrucken", „Hoodies bedrucken", „Kleidung besticken". Lokale Betriebe in Köln werben
dagegen mit **Vereins- und Firmenkleidung** und verlangen bei Stickerei oft Mindestmengen
(laut deren Einträgen z. B. ab 5, ab 10 oder über 30 Stück). **„Stickerei ab 1 Stück, online
konfigurierbar, mit Preis in Echtzeit" ist damit ein echtes Alleinstellungsmerkmal** – es steht
in allen Titeln und Beschreibungen der Kategorieseiten. Seit der Bestätigung vom 2026-10-09
kommt hinzu: **in Köln produziert, Abholung möglich** (Printful fertigt Stickerei laut eigener
Angabe in Riga und Barcelona). Das ist für lokale Suchen und für Vertrauen ein weiteres
Argument – als Kundentext aber erst nach Ihrer Freigabe.

### Phase 1 – fertig und live seit 2026-10-09 (Freigabe B)

| Suchabsicht (Beispiele) | Seite |
|---|---|
| „Hoodie bedrucken lassen", „Hoodie besticken", „Hoodie mit Logo" | `/hoodies-bedrucken-besticken` |
| „T-Shirt bedrucken lassen ab 1 Stück", „T-Shirt mit eigenem Motiv" | `/t-shirts-bedrucken-besticken` |
| „Poloshirt besticken lassen", „Polo mit Firmenlogo" | `/poloshirts-besticken-bedrucken` |

### Phase 2 – Zielgruppen (Vorschlag, noch nicht geschrieben)

Andere Suchabsicht, B2B-nah, die lokalen Wettbewerber besetzen sie bereits. Pro Seite eigener
Text mit echten Beispielen – **keine Kopie der Produktseiten**.

| Seite | Titel (Vorschlag, Zeichen) | Zielanfragen |
|---|---|---|
| `/vereinskleidung-besticken-bedrucken` | Vereinskleidung besticken & bedrucken – ab 1 Stück (50) | Vereinskleidung, Teamkleidung, Vereinsshirts, Trikots-Alternativen |
| `/firmenbekleidung-besticken-bedrucken` | Firmenbekleidung besticken & bedrucken – ab 1 Stück (51) | Firmenbekleidung, Arbeitskleidung mit Logo, Mitarbeiterkleidung |

Inhaltlich je Seite: typische Teile (Polo, Hoodie, Softshell), Mengen und Staffelpreise aus der
Preis-Engine, Ablauf mit Freigabe der Vorschau, Fristen (Produktion 3–4 Werktage + Versand 1–2).

### Phase 3 – Ratgeber (Vorschlag)

Beantworten Fragen, die vor dem Kauf gestellt werden, und sind die Seiten, auf die andere gern
verlinken (§ 4). Unser Vorteil: **eigene Daten** (echte Preise), die sonst kaum jemand zeigt.

| Seite | Titel (Vorschlag, Zeichen) |
|---|---|
| `/ratgeber/stickerei-preise` | Was kostet Stickerei auf Textilien? Preise & Beispiele (54) |
| `/ratgeber/logo-fuer-stickerei-vorbereiten` | Logo für die Stickerei vorbereiten – Dateien & Tipps (52) |
| `/ratgeber/stickerei-oder-druck` | Stickerei oder Druck? So wählen Sie das richtige Verfahren (58) |
| `/ratgeber/vereinskleidung-bestellen-checkliste` | Vereinskleidung bestellen: Checkliste für Vereine (49) |

Der Wettbewerber bietet „Richtlinien für Stickdateien" und eine Stichprobenbestellung an – ein
Ratgeber zur Dateivorbereitung ist also genau das, was Suchende bei diesem Thema erwarten.

### Phase 4 – weitere Kategorien (nach Katalogumfang)

| Produktart | Modelle im Katalog | Empfehlung |
|---|---|---|
| T-Shirts | 64 | fertig (Phase 1) |
| Hoodies | 30 | fertig (Phase 1); die 6 Zip-Hoodies gehören dorthin |
| Polos | 26 | fertig (Phase 1) |
| Longsleeves | 15 | eigene Kategorieseite lohnt |
| Jacken | 11 | eigene Kategorieseite lohnt |
| Zip-Hoodies | 6 | bei den Hoodies mitführen |
| Sweater | 2 | zu klein für eine eigene Seite |

### Bewusst zurückgestellt: getrennte Seiten „besticken" und „bedrucken" je Produkt

Der Wettbewerber trennt sie, wir führen sie zusammen. Zwei Seiten für dasselbe Produkt
konkurrieren leicht miteinander und wirken schnell wie Doppelinhalt – das schadet mehr als es
nützt. **Erst messen, dann teilen:** Zeigt die Search Console nach 4–8 Wochen, dass Anfragen mit
„besticken" und „bedrucken" auf getrennten Wegen kommen und die Kombiseite eine Seite verliert,
lohnt die Trennung – dann mit klar unterschiedlichem Inhalt (Stickerei: Stickfläche, Stiche,
Garnfarben, Digitalisierung; DTF: Motivgröße, Farbverläufe, Fotos, Waschbeständigkeit).

### Nicht: Städteseiten

Seiten wie „Stickerei Köln", „Stickerei Düsseldorf", „Stickerei Bonn" ohne echten Ortsbezug sind
sogenannte Brückenseiten und werden von Google abgewertet. **Köln** nur dort, wo es stimmt (§ 5).

---

## 4. Autorität aufbauen: Verzeichnisse, Bewertungen, Verweise

**Beleg:** Bei der Suche nach Stickereien in Köln stehen in den Treffern vor allem
**Verzeichnisse und Bewertungsportale**, nicht die einzelnen Betriebe: Cylex, Das Örtliche,
koeln.de (Branchenbuch), Sellwerk (Firmenprofile), ProvenExpert. Wer dort mit korrekten Daten
steht, wird auch für lokale Suchen gefunden, lange bevor die eigene Seite oben steht.

### 4.1 Verzeichnisse (Reihenfolge nach Wirkung und Aufwand)

Immer **identische Firmendaten** verwenden (Name, Adresse, Telefon – exakter Block in
`textbausteine.md` § 1). Abweichungen schwächen das Signal.

| Verzeichnis | Nutzen | Hinweis |
|---|---|---|
| Das Örtliche, Gelbe Seiten | breit bekannt, Link zur Website | Basiseinträge, Zusatzprodukte sind kostenpflichtig – **nichts Kostenpflichtiges ohne Ihre Entscheidung** |
| koeln.de Branchenbuch | lokaler Bezug | Eintrag unter „Textilveredelung/Stickerei/Werbetechnik" |
| Cylex | Verzeichnis, erscheint in den Treffern | kostenloser Basiseintrag |
| Sellwerk (Firmenprofil) | B2B, erscheint in den Treffern | passt zu Firmen-/Vereinskleidung |
| ProvenExpert | Bewertungsprofil, erscheint in den Treffern | siehe 4.2 |
| IHK Köln, Branchenverbände | seriöse Verweise | Mitgliedschaft nur, falls ohnehin vorhanden |

### 4.2 Bewertungen – nur echte

- **Echte Kunden um Bewertungen bitten.** Wege: Karte in der Paketbeilage mit QR-Code
  (`qr-paketbeilage`) – unproblematisch; Nachfass-E-Mail nach Lieferung nur unter den
  Bedingungen von § 7 Abs. 3 UWG (§ 9).
- **Niemals** Bewertungen kaufen, selbst schreiben oder Gefälligkeitsbewertungen erbitten: Das
  ist wettbewerbswidrig (UWG), und Plattformen sperren dafür Profile.
- Auf jede Bewertung antworten (Vorlagen in `textbausteine.md` § 8).
- Bewertungen später **auf der Website** zeigen – erst, wenn echte vorliegen, mit Quelle.

### 4.3 Verweise von anderen Seiten (nachhaltig, nicht gekauft)

| Weg | Wie | Aufwand |
|---|---|---|
| **Vereine und Teams** | Ein Verein, den Sie ausstatten, nennt „Ausstatter: ergermany.de" auf seiner Website. Das ist der natürlichste Verweis überhaupt. | gering, wiederholbar |
| **Sponsoring lokal** | Jugendmannschaft/Karnevalsgruppe ausstatten gegen Namensnennung mit Link | mittel, kostet Ware |
| **Vergleichs- und Ratgeberseiten** | Seiten wie die Anbietervergleiche für T-Shirt-Druck (z. B. trusted.de) führen Anbieter auf; Redaktion mit sachlichem Hinweis auf das Alleinstellungsmerkmal (Stickerei ab 1 Stück, Preis live) anschreiben – **ohne Erfolgsgarantie** | gering |
| **Ratgeber mit eigenen Daten** | Die Preis- und Dateiratgeber (§ 3, Phase 3) sind das, was andere gern zitieren | mittel (Texte nach Freigabe) |
| **Lokale Presse** | Pressemitteilung (Entwurf in `textbausteine.md` § 6), z. B. „Online-Konfigurator mit Preis in Echtzeit" | gering |
| **Social-Profile** | Verweise sind meist „nofollow", stärken aber die Marke und werden in KI-Antworten gefunden | gering |

### 4.4 Was ich nicht empfehle

Gekaufte Links, Linktauschringe, automatisch erzeugte Verzeichniseinträge, gekaufte Bewertungen.
Das kann die Seite dauerhaft aus dem Index werfen.

---

## 5. Lokal (Köln)

### Google-Unternehmensprofil – Einschränkung

Nach Googles Richtlinien sind **reine Online-Unternehmen nicht zugelassen**; vorausgesetzt wird
**persönlicher Kundenkontakt** (ein Ort, den Kunden aufsuchen können, oder Besuche beim Kunden)
**während angegebener Zeiten**. Ob eine Abholstelle ohne Kundenverkehr genügt, ist aus den
Quellen nicht eindeutig. Entscheidung:

| Ihre Situation | Empfehlung |
|---|---|
| Kunden können in Köln abholen/beraten (mit festen Zeiten oder nach Termin) | **Trifft zu (bestätigt 2026-10-09: Abholung möglich).** Profil anlegen; die Bedingung „angegebene Zeiten bzw. Termin" muss erfüllt sein, die Adresse wird öffentlich angezeigt; vorab die aktuelle Richtlinie lesen oder Google fragen |
| Nur Versand, kein Kundenverkehr | **Kein Profil erzwingen** (Sperrrisiko). Stattdessen Verzeichnisse (§ 4.1) und Google Merchant Center (§ 7.3) |

### Köln-Bezug auf der Website

„Köln" steht im Impressum und auf der Kontaktseite. **Bestätigt (2026-10-09):** in Köln
produziert, Abholung möglich. **Offen:** wie die Abholung abläuft (feste Zeiten, nach Termin,
nach Anruf) und an welcher Adresse – davon hängen der Text und das Google-Profil ab (§ 12).
Neuer Kundentext zu Köln braucht Ihre Freigabe; nichts davon ist veröffentlicht.

**Warum das wichtig ist:** Eine Seite „Stickerei & Textildruck in Köln – Produktion und
Abholung" ist **keine Brückenseite**, weil Produktion und Abholung tatsächlich dort stattfinden.
Sie bedient Suchen wie „Stickerei Köln" und „T-Shirts bedrucken Köln", bei denen heute vor
allem Verzeichnisse stehen (§ 4).

### Chancen, die zu Köln passen (Ideen, keine Zusicherung)

- **Karneval:** Die Session beginnt traditionell am 11.11.; Karnevalsgesellschaften, Tanzgruppen
  und Vereine brauchen bestickte Jacken, Hoodies, Polos.
- **Vereine und Schulen:** Sport, Schützen, Feuerwehr-Fördervereine, Abi-Jahrgänge.
- **Messen:** Köln ist Messestadt – Teamkleidung für Messeauftritte.
- **Betriebe:** Handwerk, Gastronomie, Pflege, Büros – wiederkehrende Mengen.
- **Weihnachtsgeschäft:** Firmengeschenke und Team-Hoodies; Fristen beachten (Produktion
  3–4 Werktage + Versand 1–2).

---

## 6. Einrichtung bei Google und Bing (Sie, ca. 20 Minuten)

Diese Konten gehören Ihnen; ich lege sie nicht an und gebe nie Zugangsdaten ein. Ich führe Sie
Schritt für Schritt.

### Google Search Console (der Weg zu Google)

1. https://search.google.com/search-console öffnen und mit Ihrem Google-Konto anmelden.
2. **„Property hinzufügen"** → am besten **„Domain"** wählen (erfasst mit/ohne www) und den
   DNS-Eintrag setzen (Domain-Anbieter). **Ohne DNS-Zugang:** „URL-Präfix"
   `https://www.ergermany.de/` wählen → Verfahren **„HTML-Tag"** → den **Code aus dem Tag**
   (nur den Wert hinter `content="…"`) in Vercel als Variable `GOOGLE_SITE_VERIFICATION`
   (Production) eintragen → neu deployen (ich löse das aus) → in der Search Console
   „Bestätigen".
3. **Sitemaps** → `sitemap.xml` eintragen.
4. **URL-Prüfung** → Startseite und die Kategorieseiten eingeben → **„Indexierung beantragen"**
   (beschleunigt die erste Aufnahme; täglich nur wenige Anfragen möglich).

### Bing Webmaster Tools (Bing, DuckDuckGo, Ecosia, ChatGPT-Suche)

1. https://www.bing.com/webmasters → anmelden.
2. **„Aus Google Search Console importieren"** (ein Klick, übernimmt Property und Sitemap) –
   oder manuell mit dem Tag-Wert als `BING_SITE_VERIFICATION` in Vercel.
3. IndexNow läuft bereits; nach Bestätigung sehen Sie dort die eingegangenen Adressen.

### Vercel-Variable setzen (falls HTML-Tag)

Vercel → Projekt → Settings → Environment Variables → Name `GOOGLE_SITE_VERIFICATION` bzw.
`BING_SITE_VERIFICATION`, Wert = **nur der Code**, Environment **Production** → Speichern →
anschließend Redeploy. Der Code ist öffentlich sichtbar (steht im HTML) und kein Geheimnis.

---

## 7. Bezahlt (optional, nur mit Ihrem Budget)

### 7.1 Google Ads (Suchnetzwerk)

Der einzige Weg, **sofort** oben zu stehen – als „Anzeige" gekennzeichnet, Abrechnung pro Klick.
Aufbau in `textbausteine.md` § 9 (Anzeigengruppen, Suchbegriffe, auszuschließende Begriffe,
Anzeigentexte mit geprüften Zeichenlängen).

- **Landeseiten = die Kategorieseiten**, nicht die Startseite – bessere Passung, bessere Qualität.
- **Auszuschließende Begriffe** sind entscheidend („selber", „kostenlos", „Anleitung",
  „Stickmaschine", „Vorlage" …), sonst fließt Budget in Suchen ohne Kaufabsicht.
- **Keine Markennamen der Textilhersteller** in Anzeigen (Markenbeschwerden möglich).
- **Messung ohne Einwilligungsbanner:** Ein Google-Conversion-Tag setzt Cookies und braucht nach
  deutscher Rechtslage in der Regel eine Einwilligung. Stattdessen: Anzeigenlinks mit
  `utm_source=google-ads` – der Besucherzähler zeigt die Besucher je Quelle, die Bestellungen
  stehen im Admin. „Kosten der Kampagne ÷ Bestellungen im selben Zeitraum" ergibt eine **grobe**
  Rechnung; eine genaue Zuordnung je Bestellung ist ohne Einwilligung nicht möglich.
- **Wirtschaftlichkeit vorab rechnen:** Deckungsbeitrag je Bestellung gegen Kosten je Klick und
  Anteil der Klicks, die bestellen. Mit ein paar Dutzend Klicks lässt sich das nicht belegen –
  klein starten, Tagesbudget selbst festlegen, nach 2–4 Wochen auswerten.

### 7.2 Microsoft Advertising (Bing)

Kleinere Reichweite, aber der Import bestehender Google-Kampagnen ist ein Klick; sinnvoll **nach**
einer erprobten Google-Kampagne.

### 7.3 Google Merchant Center – kostenlose Produkteinträge (Shopping-Reiter)

Laut Googles Hilfe sind **kostenlose Einträge** möglich (ohne Werbekonto): Merchant-Center-
Konto, bestätigte Domain, Produktfeed (CSV/XML), Versand- und Rückgabeangaben. Erscheinen können
sie u. a. im Shopping-Reiter, in der Bildersuche und in der Google-Suche. **Vorbehalt:** Unsere
Produkte sind **personalisiert** (Preis hängt von Veredelung ab); ob und wie Google das im Feed
akzeptiert, muss vorab gegen die Richtlinien geprüft werden. Wenn Sie das wollen, baue ich
einen Feed aus dem Katalog – der Rückgabe-Teil ist **rechtlicher Text** und braucht Ihre
Freigabe.

---

## 8. Social und Inhalte

Texte, Beitragsideen und Skripte: `textbausteine.md` § 4–5. Grundsätze:

- **Echte Arbeiten zeigen**: Stickprozess, Vorher/Nachher, „Logo → Stickbild", Verpackung. Kurze
  Videos haben auf Instagram, TikTok und YouTube Shorts die größte Reichweite.
- **Jeder Link mit Kennzeichnung** (`?utm_source=instagram` usw.), damit der Zähler zeigt, was
  bringt.
- **Pinterest** wird oft übersehen: Produktbilder mit Link zur passenden Kategorieseite.
- **Rhythmus** statt Masse: 2–3 Beiträge pro Woche, die man durchhält.
- Kundenarbeiten **nur mit Erlaubnis** zeigen (Logo, Marken, Personen).

---

## 9. Rechtliches Minimum im Marketing (Deutschland – keine Rechtsberatung)

- **Impressum** gehört auch auf Social-Media-Profile (Link zum Impressum der Website).
- **Keine unerbetene Werbung per E-Mail** (§ 7 UWG). Auch B2B-Kaltakquise per E-Mail ist ohne
  Einwilligung unzulässig. Zulässig sind Brief, persönlicher Besuch, Anzeigen, Messen,
  Partnerschaften – und **Anfragen, die der Kunde selbst stellt**.
- **Bestandskunden-Ausnahme** (§ 7 Abs. 3 UWG): E-Mail zu ähnlichen eigenen Waren nur, wenn die
  Adresse beim Kauf erhoben wurde, der Kunde nicht widersprochen hat und bei Erhebung **und**
  jeder Nutzung auf die Widerspruchsmöglichkeit hingewiesen wurde. Eine reine
  Bewertungsbitte kann bereits als Werbung gelten – im Zweifel Paketbeilage statt E-Mail.
- **Newsletter:** Double-Opt-in (die Website hat die Einwilligung mit Bestätigungslink).
- **Preisangaben:** „ab"-Preise und Kleinunternehmer-Hinweis (§ 19 UStG) wie auf der Website
  verwenden – dieselben Aussagen auf Social Media.
- **Gewinnspiele** brauchen Teilnahmebedingungen und Datenschutzhinweise.
- **Keine Superlative ohne Beleg** („der beste", „Nr. 1", „günstigster").
- **Herkunftsangaben** („aus Köln", „Made in Germany") nur, soweit zutreffend. „Sitz in Köln"
  und „in Köln produziert" stimmen (bestätigt 2026-10-09). „Made in Germany" nicht pauschal
  verwenden: Die Textilien selbst stammen von Herstellern; veredelt wird in Köln.
- **Marken und Logos Dritter** nur mit Berechtigung bedrucken/besticken und zeigen.

---

## 10. Was nicht tun

Links oder Bewertungen kaufen · Keyword-Texte ohne Mehrwert · dieselbe Seite mit anderer Stadt
vervielfältigen · Text vor Besuchern verstecken · Crawler aussperren · nach der Indexierung
Adressen ändern (immer mit dauerhafter Weiterleitung) · Mengen von KI-Texten ohne Prüfung
veröffentlichen · die Domain wechseln, ohne die Weiterleitungen zu planen.

---

## 11. 30-60-90-Tage-Plan

| Zeitraum | Ich (Claude) | Sie |
|---|---|---|
| **Sofort** | **Erledigt am 2026-10-09:** Freigaben A/B/C umgesetzt, live geprüft (`seo:pruefen` 16/16, IndexNow 166 Adressen), Zähler eingeschaltet | Freigaben A, B, C waren erteilt |
| **Woche 1** | Bestätigungs-Tags auslösen, Sitemap/URL-Prüfung begleiten · Phase-2-Texte entwerfen (Freigabe) | Search Console + Bing bestätigen · 5 Verzeichnisse mit identischen Daten anlegen · Instagram/Facebook-Profil mit Link und Impressum |
| **Woche 2–4** | Zielgruppenseiten (Verein, Firma) nach Freigabe · Weitere Kategorien (Longsleeves, Jacken) · QR-Codes in Druckvorlagen | Paketbeilage mit Bewertungs-QR einlegen · 2–3 Beiträge pro Woche · 3 Vereine/Betriebe persönlich ansprechen |
| **Woche 5–8** | Search Console auswerten: Welche Suchanfragen bringen Impressionen? Seiten daraufhin schärfen · Ratgeber (Preise, Stickdatei) | Erste Bewertungen sammeln und beantworten · ggf. kleine Anzeigenkampagne starten |
| **Monat 3** | Entscheidung getrennte Verfahrensseiten · Merchant-Center-Feed prüfen · Kosten-Nutzen der Anzeigen | Verweise von Vereinsseiten erbitten · Referenzen (mit Erlaubnis) zeigen |

---

## 12. Fragen an Sie – Stand 2026-10-09

**Beantwortet:**

1. **Wo wird produziert?** → **In Köln** (bestätigt). Damit ist „in Köln produziert" eine wahre
   Aussage und darf – nach Freigabe des Wortlauts – auf der Website stehen.
2. **Abholung möglich?** → **Ja** (bestätigt). **Noch offen:** Zeiten oder Termin? An welcher
   Adresse (Ingendorferweg 81)? Gibt es dabei Beratung vor Ort? (Entscheidet über Text und
   Google-Unternehmensprofil.)
3. **Ist die Digitalisierung der Stickerei im Preis enthalten?** → **Nein**; sie „ergibt sich erst
   nach dem Hinzufügen der Motive". Folge: **nicht** als „inklusive/kostenlos" bewerben; die
   Website sagt weiterhin nur, dass das Team das Logo digitalisiert und der Preis live im
   Konfigurator entsteht, sobald das Motiv liegt.

**Weiterhin offen:**

4. **Gibt es schon Profile** (Instagram, Facebook, TikTok, LinkedIn)? Wenn ja, welche Adressen?
5. **Fotos echter Arbeiten**, Kundenlogos als Referenz (mit Erlaubnis)?
6. **Gründungsjahr/Geschichte** für „Über uns" und Pressemitteilung?
7. **Anzeigenbudget** (Tagesbudget), falls gewünscht?
8. **Rabattaktionen** für Vereine/Erstbestellung gewünscht? (Geschäftsentscheidung, Preis-Engine
   und Rabattdeckel beachten.)

---

## 13. Wochen-Routine (15 Minuten)

1. Search Console → **Leistung**: Impressionen und Klicks der letzten 28 Tage; **Suchanfragen** und
   **Seiten** ansehen – welche Anfrage steht schon bei Position 8–20? Dort lohnt Feinarbeit.
2. **Seitenindexierung**: Wie viele der 166 Seiten sind indexiert? Fehlen Seiten, den Grund lesen.
3. `/admin/besucher`: Besucher je Kanal – was bringt etwas?
4. Einen Beitrag veröffentlichen, eine Bewertung beantworten, einen Eintrag ergänzen.
5. Nach größeren Änderungen: `npm run seo:pruefen`, danach `npm run seo:indexnow`.

---

## 14. Quellen der Recherche (Stand 08.10.2026)

Angaben stammen größtenteils von den Anbietern selbst oder aus Verzeichnissen und können sich
ändern; sie wurden nicht unabhängig überprüft.

- Printful (Seitenstruktur, „keine Mindestbestellmenge", Digitalisierungsgebühr, Produktseiten je
  Verfahren): [Poloshirts besticken lassen](https://www.printful.com/de/poloshirts-besticken-lassen),
  [Hoodie besticken lassen](https://www.printful.com/de/hoodie-besticken-lassen),
  [T-Shirt bedrucken](https://www.printful.com/de/t-shirt-bedrucken),
  [Kleidung besticken](https://www.printful.com/de/kleidung-besticken)
- Anbietervergleich T-Shirt-Druck: [trusted.de](https://trusted.de/t-shirt-druck)
- Köln/Verzeichnisse und Mindestmengen:
  [Cylex Stickerei-Service Köln](https://web2.cylex.de/suche/stickerei-service/Koeln),
  [Das Örtliche Bestickungen](https://www.dasoertliche.de/Themen/Bestickungen.html),
  [koeln.de Branchenbuch](https://www.koeln.de/branchen/eintrag/332/digitaldrucke/werbe-werkstatt-beate-stanek-ek),
  [Sellwerk Mixprint Textildruck](https://sellwerk.de/firmenprofil/mixprint-textildruck),
  [ProvenExpert getme.koeln](https://www.provenexpert.com/getme-koeln-atelier-fuer-maschinen-stickerei-und-textilgestaltung/),
  [Logostickerei-Vergleich business-on.de](https://www.business-on.de/logostickerei-firmen-vergleich.html)
- Google-Unternehmensprofil, Zulassung:
  [Business eligibility and ownership guidelines](https://support.google.com/business/answer/13763036)
- Google Merchant Center, kostenlose Einträge:
  [Cost-free listings for products](https://support.google.com/merchants/answer/13889434),
  [Kostenlose Einträge (Entwicklerdoku)](https://developers.google.com/shopping-content/guides/review-free-listings?hl=de)
