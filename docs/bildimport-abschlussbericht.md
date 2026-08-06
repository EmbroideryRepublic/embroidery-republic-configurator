# Bildimport – Abschlussbericht

_Generiert von `scripts/bildimportBericht.mts` aus dem Asset-Manifest, den Importjobs
und den dokumentierten Ausnahmen. Nicht von Hand pflegen._

## Was im Shop steht

| | |
|---|---|
| Produkte | **154** |
| Farbvarianten im Katalog | **2282** |
| davon mit echtem Herstellerbild | **2277** (99.8 %) |
| im Shop auswählbar | **2273** |
| ausgeblendet (siehe unten) | **9** |
| Farben mit echter Rückansicht | **1890** |
| Farben mit Rückseiten-Platzhalter | **383** |
| Produkte mit Ärmelansicht für alle Farben | **68** von 154 |

**Kein auswählbares Kleidungsstück zeigt eine Silhouette.** Jede Farbe, die der Kunde
anklicken kann, hat ein echtes Foto des richtigen Artikels in der richtigen Farbe.
Abgesichert durch Wächtertests in `src/lib/products/__tests__/farben.test.ts`.

## Ausgeblendete Farben

Diese Farben stehen weiterhin in der Produktdefinition (Bestellvalidierung und
Lieferanten-Mapping brauchen die vollständige Palette), werden im Shop aber nicht
angeboten – anzubieten, was wir nicht zeigen können, wäre ein Versprechen ohne Deckung.

| Produkt | Farbe | Grund |
|---|---|---|
| T-Shirt #E150 | 101145 | Doppelter Katalogeintrag – zeigt dasselbe Foto wie eine andere Farbe desselben Produkts. |
| Light Cotton Adult T-Shirt | Ash Grey (Heather) | Fuer Gildan 3000 in Ash (Ash Grey, 99/1) existiert bei keiner geprueften Quelle eine Freisteller-Aufnahme – ueberall nur On-Model. Geprueft: (1) d1l2kcmc130e06.cloudfront.net Bucket /3/ … |
| Men`s Polo Shirt Perfect | 01509D | Doppelter Katalogeintrag – zeigt dasselbe Foto wie eine andere Farbe desselben Produkts. |
| Softstyle® Midweight Sweat Adult Hoodie | Paragon | Nur On-Model beschaffbar. shirtspace.com fuehrt fuer SF500/Paragon front, back und side (alle HTTP 200) - alle drei zeigen einen Menschen; einzeln gesichtet. ralawise GD067 fuehrt Paragon nicht. Da … |
| Softstyle® Midweight Sweat Adult Hoodie | Light Pink | Nur On-Model beschaffbar. shirtspace.com SF500 Light Pink: front/back/side vorhanden, alle mit Model (gesichtet: Frau im rosa Hoodie). ralawise GD067 fuehrt die Farbe nicht. Ausgeblendet. |
| Softstyle® Midweight Sweat Adult Hoodie | White | Nur On-Model beschaffbar. shirtspace.com SF500 White: front/side mit Model (gesichtet: Frau im weissen Hoodie). ralawise GD067 fuehrt Weiss nicht im Freistellersatz. Ausgeblendet. |
| Softstyle® Midweight Sweat Adult Hoodie | Carolina Blue | Nur On-Model beschaffbar. shirtspace.com SF500 Carolina Blue: front mit Model (gesichtet). ralawise GD067 fuehrt die Farbe nicht. Ausgeblendet. |
| Ultra Heavy Cotton Box Hoody | E8E7E3 | Doppelter Katalogeintrag – zeigt dasselbe Foto wie eine andere Farbe desselben Produkts. |
| Men`s Long Sleeve T-Shirt | B8B8B8 | Doppelter Katalogeintrag – zeigt dasselbe Foto wie eine andere Farbe desselben Produkts. |

## Rückansichten, die es nirgends gibt

Bei 48 Produkten zeigt der Klick auf „Rückseite" einen neutralen
Platzhalter statt eines Fotos. Rückendruck bleibt buchbar; die Fläche ist über den
Umriss der Vorderansicht vermessen. Der häufigste Grund: Die Hersteller fotografieren
die Rückseite nur am Modell, und On-Model-Aufnahmen sind ausgeschlossen (Begründung unten).

| Produkt | Marke | ohne Rückansicht |
|---|---|---|
| Ultra Cotton T-Shirt | Gildan | 44 von 52 |
| Stedman Classic-T | Stedman | 33 von 34 |
| Softstyle® Midweight Sweat Adult Hoodie | Gildan | 24 von 34 |
| Comfort-T | Stedman | 20 von 21 |
| My Eco Polo 65/35 Women_° | B&C | 18 von 20 |
| Light Cotton Adult T-Shirt | Gildan | 17 von 24 |
| Classic-T V-Neck for women | Stedman | 16 von 18 |
| Classic-T V-Neck | Stedman | 15 von 16 |
| My Polo 180 | B&C | 13 von 30 |
| Inspire T /Men | B&C | 11 von 18 |
| Clive Crew Neck | Stedman | 11 von 13 |
| Long Sleeve Cool T | Just Cool | 11 von 11 |
| Ladies` Poloshirt 65/35 | Russell | 10 von 10 |
| Signature Heavyweight Sweat | Just Hoods | 10 von 10 |
| Women`s Fleecejacket North | SOL'S | 10 von 17 |
| Hammer Maxweight Adult Hooded Sweatshirt | Gildan | 9 von 9 |
| Microfleece-Duo ID501 | B&C | 9 von 9 |
| Unisex Organic Longsleeve T-Shirt | EarthPositive | 8 von 8 |
| Microfleece-Duo ID501 / Women | B&C | 8 von 9 |
| My Eco Polo 65/35_° | B&C | 7 von 20 |
| Heavy Blend Hooded Sweatshirt | Gildan | 7 von 40 |
| Inspire V T / Men | B&C | 6 von 6 |
| Inspire V T /Women | B&C | 6 von 6 |
| Poloshirt 65/35 | Russell | 6 von 13 |
| Ladies` Long Sleeve T-Shirt | Neutral | 6 von 23 |
| Recycled Performance Long Sleeve T-Shirt | Neutral | 6 von 6 |
| Men´s Pure Organic Heavy Tee | Russell | 4 von 4 |
| Ladies´ Pure Organic Heavy Tee | Russell | 4 von 4 |
| Classic-T for women | Stedman | 4 von 34 |
| Lightweight Hooded Sweat | Fruit of the Loom | 4 von 12 |
| Ladies` Fit T-Shirt | Neutral | 3 von 31 |
| Men`s Classic Cotton Polo | Russell | 3 von 8 |
| Men´s T-Shirt #E190 Long Sleeve (Exact) | B&C | 3 von 10 |
| Unisex Polo ID.001 | B&C | 2 von 20 |
| KING Hooded Sweat | B&C | 2 von 21 |
| #Inspire E150 T-Shirt | B&C | 1 von 21 |
| T-Shirt #E150 / Women | B&C | 1 von 41 |
| Men`s Basic-T | James+Nicholson | 1 von 29 |
| Mens Bio Workwear T-Shirt | James+Nicholson | 1 von 17 |
| Ladies` BIO Workwear T-Shirt | James+Nicholson | 1 von 17 |
| Russell Classic T | Russell | 1 von 21 |
| Jersey Polo Shirt | EarthPositive | 1 von 1 |
| Men`s Ultimate Cotton Polo | Russell | 1 von 10 |
| Unisex Pulse Polo Shirt | SOL'S | 1 von 20 |
| Influence Hoodie | B&C | 1 von 6 |
| Earth Positive Super Heavy Hoodie | EarthPositive | 1 von 1 |
| Ultra Cotton Long Sleeve T- Shirt | Gildan | 1 von 21 |
| Men`s Long Sleeve T-Shirt | Neutral | 1 von 23 |

## Warum keine On-Model-Aufnahmen

Nicht nur eine Stilfrage. Der Druckflächen-Generator vermisst die **Kontur des Bildes**,
um zu bestimmen, wo auf dem Kleidungsstück gedruckt werden kann. Ist ein Mensch
abgebildet, wird der Mensch vermessen: Beim Gildan Ultra Cotton Longsleeve lag die
Druckfläche dadurch über Kopf und Schultern des Models statt auf dem Stoff.

`scripts/jobsOnModelFilter.mts` lehnt solche Bilder deshalb VOR dem Import ab. Die
Erkennung kann sich nicht auf den Hautanteil stützen – ein rosa Freisteller erfüllt die
Hautfarbregel zu 48 %, eine echte On-Model-Aufnahme nur zu 10 %, weil der Stoff selbst
hautfarben ist. Gezählt werden deshalb nur Hautpixel, die weit von der dominanten
Stofffarbe entfernt liegen.

Bisher abgelehnt: **55 Bilder**.

**Im Shop liegt derzeit keine einzige On-Model-Aufnahme.** Zwischenzeitlich waren 23
Farben des Gildan Softstyle Hoodie so importiert worden – besser als 23 ausgeblendete
Farben –, sie sind inzwischen alle durch Freisteller ersetzt.

Geprüfte Fehlalarme des Audits (warme Stofffarben, kein Mensch im Bild):

- **fotl-ladies-valueweight-t** – KEIN On-Model – Fehlalarm des Hautton-Detektors. Die Farben Pink/Fuchsia/Sand erfüllen dieselbe RGB-Regel wie Hautton. Sichtprüfung (fotl-ladies-valueweight-t-pink/front): sauberer Studio-Freisteller ohne Person, …
- **fotl-ladies-iconic195-t** – KEIN On-Model – Fehlalarm des Hautton-Detektors (Pink/Fuchsia). Sichtprüfung (fotl-ladies-iconic195-t-pink/front): sauberer Studio-Freisteller ohne Person.
- **gildan-softstyle-midweight-sweat-adult-hoodie** – GEPRUEFT, KEIN On-Model: Der Kandidat t-orange/front wurde gesichtet - sauberer Freisteller ohne Person. Die Quote von 41 % entsteht durch die warmen Stofffarben des Produkts (Tangerine, T. Orange, Mustard, Dusty Rose, …

## Technisch nicht beschaffbar

685 Einträge (Farbe oder einzelne Ansicht) sind mit Begründung und
geprüften Quellen dokumentiert. Die Agenten haben dafür je Fall bis zu 15 Händler, die
Hersteller-Mediathek und das Wayback-Archiv abgesucht. Vollständig in
`scripts/import/nichtbeschaffbar_*.json`; hier die betroffenen Produkte:

| Produkt | Einträge |
|---|---|
| stedman-stedman-classic-t | 66 |
| stedman-comfort-t | 61 |
| bundc-my-eco-polo-6535-women | 55 |
| gildan-softstyle-midweight-sweat-adult-hoodie | 51 |
| gildan-heavy-blend-hooded-sweatshirt | 50 |
| stedman-classic-t-v-neck-for-women | 49 |
| stedman-classic-t-v-neck | 45 |
| gildan-ultra-cotton-t-shirt | 44 |
| bundc-my-polo-180 | 39 |
| stedman-classic-t-for-women | 38 |
| stedman-clive-crew-neck | 23 |
| bundc-my-eco-polo-6535 | 22 |
| bundc-inspire-e150-t-shirt | 20 |
| bundc-unisex-polo-id-001 | 20 |
| gildan-light-cotton-adult-t-shirt | 18 |
| bundc-inspire-t-women | 13 |
| build-your-brand-fluffy-hoody | 10 |
| neutral-ladies-classic-t-shirt | 6 |
| russell-poloshirt-6535 | 6 |
| fruit-of-the-loom-lightweight-hooded-sweat | 4 |
| sols-men-s-long-sleeve-t-shirt-imperial | 4 |
| earthpositive-unisex-organic-pullover-hood-ep | 3 |
| bundc-t-shirt-e150-women | 3 |
| russell-men-s-classic-cotton-polo | 3 |
| bundc-mens-t-shirt-e190-long-sleeve-exact | 3 |
| sols-men-s-polo-shirt-perfect | 3 |
| russell-authentic-hooded-sweat | 2 |
| id-identity-microfleece-jacke | 2 |
| jamesnicholson-men-s-basic-t | 2 |
| jamesnicholson-classic-polo | 2 |
| jamesnicholson-classic-polo-ladies | 2 |
| russell-strapazierfaehiges-poloshirt-599 | 2 |
| sols-women-s-fleecejacket-north | 2 |
| build-your-brand-ultra-heavy-cotton-box-hoody | 1 |
| sols-women-s-polo-shirt-prime | 1 |
| earthpositive-earthpositive-organic-mensunisex-pullover-hoodie | 1 |
| neutral-unisex-performance-t-shirt | 1 |
| russell-men-s-ultimate-cotton-polo | 1 |
| jamesnicholson-round-t-heavy | 1 |
| jamesnicholson-ladies-active-t | 1 |
| jamesnicholson-ladies-basic-t | 1 |
| jamesnicholson-mens-bio-workwear-t-shirt | 1 |
| jamesnicholson-ladies-bio-workwear-t-shirt | 1 |
| russell-russell-classic-t | 1 |
| jamesnicholson-men-s-bio-workwear-polo | 1 |

## Bildquellen

| Quelle | Farbbildsätze |
|---|---|
| groener-schulze.com | 574 |
| sportyfied.com | 237 |
| cdn.shopify.com | 199 |
| stedman.eu | 157 |
| shop.ralawise.com | 80 |
| tbi.cdn.pacerace.de | 78 |
| assets.myworkwear.co.uk | 73 |
| bc-collection.eu | 67 |
| images.allmyclothes.de | 49 |
| cdn.fruitoftheloom.eu | 48 |
| stickx.de | 40 |
| s7g3.scene7.com | 39 |
| cdn.earthpositiveonline.com | 38 |
| images.shirtspace.com | 35 |
| rexlander.com | 27 |
| freewear.de | 22 |
| textil-grosshandel.eu | 19 |
| coozo.co.uk | 19 |
| neutral.com | 19 |
| cottonclassics.com | 18 |
| d1l2kcmc130e06.cloudfront.net | 18 |
| promociel.fr | 13 |
| awdis.com | 12 |
| falk-ross.eu | 12 |
| shirtplus.net | 10 |

