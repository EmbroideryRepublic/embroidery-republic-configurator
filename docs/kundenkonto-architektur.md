# Kundenkonto-Architektur

Wie das Kundenkonto aufgebaut ist – additiv zum bestehenden Gastkauf. Stand
2026-08-07.

Verwandte Dokumente:
[Entscheidungsprotokoll](entscheidungen-produktionsreife.md) (Abschnitt 5,
volle Entscheidungshistorie) ·
[Bestellablauf](bestellablauf.md) ·
[DSGVO-Löschkonzept](dsgvo-loeschkonzept.md) ·
[Next-Upgrade-Entscheidung](next-upgrade-entscheidung.md) (Middleware-Advisories).

---

## 1. Zweck & Architekturprinzip

Bis zu dieser Sitzung war der bewusste Stand: **kein Kundenkonto**, Gastkauf
mit E-Mail-Bestätigung und signiertem Link
(`bestellung/[token]`, `orderAccess.ts`). Der neue Auftrag verlangt ein
vollwertiges Konto – die Auflösung ist **additiv**: das Konto kommt
**hinzu**, es **ersetzt nichts**.

- Der Gast-/Token-Checkout bleibt vollständig unverändert nutzbar. Niemand
  muss sich registrieren, um zu bestellen.
- Ein Konto ist ein **zusätzliches** Angebot für wiederkehrende Kundschaft
  (gespeicherte Adressen, Bestellübersicht, Checkout-Vorbelegung) – keine
  Voraussetzung.
- Dieser Weg war im Code bereits vorgezeichnet: `orderAccess.ts` trug lange
  vor dem Konto den Kommentar, wie eine künftige Anbindung aussehen sollte
  („Bestellzugriff um `{ art: 'konto'; kundenId }` erweitern … fertig") –
  genau so wurde es umgesetzt (siehe Abschnitt 5).

Jede neue Tabelle, Spalte und Funktion ist entweder komplett neu oder
nullable/additiv an Bestehendes angehängt. Nichts am Gastweg musste dafür
geändert werden.

---

## 2. Datenmodell

Migrationen [0023_kundenkonto.sql](../supabase/migrations/0023_kundenkonto.sql)
und
[0024_bestellung_kundenkonto_verknuepfung.sql](../supabase/migrations/0024_bestellung_kundenkonto_verknuepfung.sql).

### `customer_profiles` – 1:1 zu `auth.users`

| Spalte | Bedeutung |
|---|---|
| `id` | Primärschlüssel, zugleich Fremdschlüssel auf `auth.users(id)` (Kaskade beim Löschen) |
| `display_name`, `phone`, `company`, `vat_id`, `avatar_url` | optionale Profilangaben |
| `newsletter_opt_in`, `newsletter_opt_in_at` | eigene, von der Registrierung getrennt geführte DSGVO-Einwilligung (Zweckbindung) |
| `created_at`, `updated_at` | Zeitstempel |

Ein Datenbank-Trigger (`lege_kundenprofil_an()`, feuert `after insert on
auth.users`) legt die Profilzeile automatisch an, sobald irgendwo ein Konto
entsteht – unabhängig vom Anlageweg. Ein Profil ohne Konto oder ein Konto
ohne Profil kann dadurch nicht entstehen.

### `customer_addresses` – Adressbuch, mehrere Zeilen je Kunde

| Spalte | Bedeutung |
|---|---|
| `id` | Primärschlüssel |
| `customer_id` | Fremdschlüssel auf `auth.users(id)`, Kaskade |
| `label` | frei, z. B. „Zuhause"/„Büro" – rein zur Orientierung |
| `first_name`, `last_name`, `company`, `street`, `zip`, `city`, `country`, `phone` | Adressfelder |
| `is_default` | genau eine Zeile je Kunde darf `true` sein |

Ein partieller Unique-Index
(`customer_addresses_ein_standard_je_kunde … where is_default`) erzwingt
„höchstens eine Standardadresse je Kunde" auf Datenbankebene – kein
Anwendungscode kann das auseinanderlaufen lassen, auch nicht bei einem
Fehler mitten in `setzeStandardadresse()` (siehe Abschnitt 5).

### Verknüpfung zu `orders`

`orders.customer_id` (Migration 0023, nullable, Fremdschlüssel auf
`auth.users(id) on delete set null`): `NULL` bedeutet Gastbestellung – nach
wie vor der Normalfall. Gesetzt wird sie nur, wenn beim Checkout ein Konto
angemeldet war. `create_order_atomic()` (ursprünglich Migration 0015) wurde
in Migration 0024 um genau diese eine Spalte im `INSERT` erweitert; fehlt
`customer_id` im übergebenen JSON (Gastkauf), bleibt sie `NULL` – exakt das
bisherige Verhalten, keine Änderung an Transaktion, Idempotenz oder
Rückgabewert.

### RLS

Row Level Security ist auf beiden Tabellen aktiv (`auth.uid() = id` bzw.
`auth.uid() = customer_id`), aber **Verteidigung in der Tiefe**, nicht der
primäre Zugriffsweg – wie überall im Projekt (siehe
[architektur.md](architektur.md) §5) läuft der App-Zugriff über den
Service-Role-Client und umgeht RLS. `anon`/`authenticated` haben keine
Grants; die Policies greifen nur, falls der Publishable-Key je direkt
verwendet würde.

---

## 3. Authentifizierung

**Supabase Auth**, kein zweites System. Supabase ist bereits Datenbank- und
Storage-Anbieter des Projekts; Auth (`auth.users`, GoTrue) ist Teil
desselben Kontos – kein neuer externer Dienst, dieselbe Begründung, mit der
Redis/Sentry bereits abgelehnt wurden. Passwort-Hashing, E-Mail-Bestätigung
und Reset-Tokens übernimmt Supabase selbst.

### PKCE-Callback-Flow (`/auth/callback`)

Jeder Auth-Link (Registrierung bestätigen, Passwort zurücksetzen) führt über
[app/auth/callback/route.ts](../src/app/auth/callback/route.ts). Supabases
eigener Verify-Endpunkt prüft den Link zuerst selbst und leitet erst danach
mit einem PKCE-`code` im Query-String hierher weiter (`@supabase/ssr`
Standardablauf). Die Route tauscht den Code gegen eine Sitzung – danach ist
das Cookie gesetzt.

Der Query-Parameter `typ` (von `konto.ts` beim Linkerzeugen mitgegeben)
steuert das Ziel:

- `typ=registrierung` → Konto ist bestätigt, Willkommensmail wird
  verschickt, Weiterleitung zum Konto-Dashboard. War beim Registrieren der
  Newsletter-Haken gesetzt (`newsletter=1` im Redirect-Ziel), wird jetzt –
  und nur jetzt – der Opt-in aktiviert (siehe Abschnitt 7).
- `typ=zuruecksetzen` → Weiterleitung zur Passwort-Eingabeseite
  (`/konto/passwort-zuruecksetzen`); die aus dem Recovery-Link getauschte
  Sitzung erlaubt dort ausschließlich das Setzen eines neuen Passworts
  (siehe Abschnitt 4).

Schlägt der Code-Tausch fehl, geht es zurück zu
`/konto/anmelden?fehler=link-ungueltig`.

### Warum `admin.generateLink()` statt Supabases Standard-E-Mails

`admin.generateLink()` erzeugt den Bestätigungs-/Reset-Link, **ohne** dass
Supabase selbst eine E-Mail verschickt. Verschickt wird sie stattdessen über
den im Projekt längst etablierten `sendEmail()`-Weg (Resend), mit denselben
Marken-Vorlagen wie die Bestellbestätigung. Der Grund: Supabases eigene
Standard-Vorlagen sind generisch – ohne diesen Umweg bekäme ein
Konto-Vorgang ein sichtbar anderes, unmarkiertes Niveau als jede sonstige
Mail im Projekt. Vier eigene Vorlagen decken das ab:
`KontoBestaetigenEmail`, `PasswortVergessenEmail`, `PasswortGeaendertEmail`,
`KontoWillkommenEmail` (plus `NewsletterOptInEmail`, siehe Abschnitt 7).

Einzige bewusste Ausnahme: **E-Mail-Adresse ändern**
(`emailAendernAction`) läuft **über Supabases eigenen** Bestätigungsablauf
(`supabase.auth.updateUser({ email })`), nicht über `generateLink()`. Anders
als Registrierung/Reset ist das eine seltene, sicherheitskritische Änderung
– Supabases serverseitig erzwungene Bestätigung an **beide** Adressen
(alte und neue) ist hier der vorsichtigere Weg als eine selbst gebaute
Umleitung.

### `middleware.ts` – bewusst eng gehalten

[src/middleware.ts](../src/middleware.ts) ist die **erste** Middleware in
diesem Projekt. `next-upgrade-entscheidung.md` führte „keine `middleware.ts`"
bis dahin als Beleg dafür an, dass zwei Middleware-spezifische
npm-Advisories nicht anwendbar sind. Mit dem Konto kommt jetzt genau eine
hinzu – aber so eng wie möglich:

1. **Nur für `/konto/*` und `/auth/*`** (`matcher`). Der gesamte übrige Shop
   (Produktseiten, Konfigurator, Checkout) bleibt exakt so unberührt wie
   zuvor.
2. **Keine Redirects.** Die Middleware ruft ausschließlich
   `supabase.auth.getUser()` auf, um die Sitzungs-Cookies aufzufrischen
   (`getUser()` statt `getSession()`: prüft den Token gegen den Auth-Server
   nach, statt ihn nur ungeprüft aus dem Cookie zu lesen). Die
   Zugriffskontrolle für geschützte `/konto`-Unterseiten passiert weiterhin
   in der jeweiligen Seite selbst (`redirect()` in der Server-Component,
   nicht in der Middleware).

Der zweite Punkt ist der Grund, warum das zuvor ausgeschlossene
Redirect-Cache-Poisoning-Advisory weiterhin nicht greift: Es betrifft
Middleware, die selbst umleitet – diese tut das nicht.
`next-upgrade-entscheidung.md` ist entsprechend aktualisiert.

Ohne konfigurierte Supabase-Zugangsdaten (z. B. eine lokale Umgebung ohne
Projekt) würde `createServerClient` synchron werfen – eine Middleware ohne
Auffangnetz hätte damit jede Anfrage an `/konto/*` und `/auth/*` mit 500
beantwortet. Deshalb läuft der gesamte Supabase-Aufruf in einem
try/catch: Ohne Zugangsdaten oder bei einem sonstigen Fehler läuft die
Anfrage unverändert durch, statt die gesamte Kontostrecke lahmzulegen.

---

## 4. Sicherheitsmaßnahmen

**Re-Authentifizierung bei E-Mail-/Passwortänderung.** Vor einem
Passwortwechsel (`passwortAendernAction`) prüft
`supabase.auth.signInWithPassword()` zunächst das eingegebene *aktuelle*
Passwort erneut. Ohne diese Prüfung könnte eine noch gültige, aber z. B. an
einem fremden Gerät vergessene Sitzung das Passwort ändern, ohne dass die
Kontoinhaberin es je selbst eingeben musste – dieselbe Gefahr, gegen die
Bank- und Mail-Anbieter mit „aktuelles Passwort bestätigen" schützen.

**Recovery-Sitzungs-Prüfung auf der Reset-Seite.**
[app/konto/passwort-zuruecksetzen/page.tsx](../src/app/konto/passwort-zuruecksetzen/page.tsx)
unterscheidet eine frische Recovery-Sitzung (aus dem Link der
„Passwort vergessen"-Mail) von einer ganz normalen, bereits angemeldeten
Sitzung. `supabase.auth.getClaims()` liefert den `amr`-Claim
(Authentication Method Reference); nur wenn er `recovery` enthält, gilt die
Seite als erreichbar. Jeder Fehler oder unklare Zustand fällt auf „keine
Recovery-Sitzung" zurück (fail-closed) – ohne diese Prüfung könnte jede
aktive Sitzung über diese Seite ein neues Passwort setzen, ohne das alte zu
kennen.

**Open-Redirect-Schutz beim `?weiter=`-Parameter.** Geschützte
`/konto`-Seiten leiten nicht angemeldete Aufrufer auf
`/konto/anmelden?weiter=<ursprüngliches-Ziel>` um. `AnmeldenForm.tsx`
(`sicheresWeiterZiel()`) lässt als Ziel **ausschließlich** einen Pfad
beginnend mit `/` zu, weder eine absolute URL noch einen
protokollrelativen Pfad (`//fremd.de`) noch `/\fremd.de` – sonst könnte der
Parameter nach dem Login auf eine fremde Domain umleiten.

**Rate-Limits auf allen schreibenden Actions**
([config/rateLimits.ts](../src/config/rateLimits.ts)):

| Limit | Grenze | Merkmal | Schützt |
|---|---|---|---|
| `kontoAnmeldung` | 8 / 15 Min. | IP + E-Mail | Passwort-Raten gegen ein Konto |
| `kontoRegistrierung` | 5 / Std. | IP | automatisiertes Massenanlegen |
| `kontoPasswortVergessen` | 5 / Std. | IP + E-Mail | E-Mail-Versand als Belästigungsvektor |
| `kontoAenderung` | 20 / Std. | IP + Kunden-ID | gemeinsames Limit für Profil-, E-Mail-, Passwortänderung und alle vier Adressbuch-Aktionen – die Sitzung ist das schützenswerte Gut, nicht das einzelne Feld |

**IDOR-Schutz.** Jede Adress- oder Bestell-Aktion prüft Eigentümerschaft,
nicht nur Anmeldung. `lib/account/data.ts` filtert Adress-Updates/-Löschungen
zusätzlich zur `id` immer auch mit `.eq('customer_id', kundenId)` – eine
falsche oder erratene Adress-ID kann so nie eine fremde Zeile treffen, selbst
bei einem Fehler weiter oben im Aufrufer. Für Bestellungen übernimmt das
`gehoertBestellungKunden()`: der `'konto'`-Zweig von `pruefeBestellzugriff()`
(`lib/orders/orderAccess.ts`) fasst „existiert nicht" und „gehört einem
anderen Konto" bewusst zur selben Antwort `ungueltig` zusammen – dieselbe
Zusammenfassung wie beim Token-Zugriff des Gastwegs.

---

## 5. Server Actions

Alle Actions liegen in
[lib/actions/konto.ts](../src/lib/actions/konto.ts) (552 Zeilen). Zwei
Zugriffsmuster nebeneinander:

- **Auth-Operationen** (anmelden/abmelden/Passwort setzen) laufen über den
  SSR-Client (`lib/supabase/server.ts`, `createClient()`) – er liest **und**
  schreibt die Sitzungs-Cookies innerhalb desselben Server-Action-Aufrufs.
- **Profil-/Adressdaten** laufen wie überall im Projekt über den
  Admin-Client (`createAdminClient()`), aber immer **erst nachdem**
  `aktuellerKunde()` ([lib/account/session.ts](../src/lib/account/session.ts))
  die Sitzung geprüft hat. `aktuellerKunde()` ist die einzige Stelle, die den
  SSR-Client für die Sitzungsprüfung verwendet – kein Aufrufer ruft
  `createClient().auth.*` direkt (dasselbe Muster wie `lib/admin/auth.ts`
  für Admin-Auth).

Gruppiert:

| Gruppe | Actions |
|---|---|
| Registrierung | `registrierenAction` |
| Anmeldung/Abmeldung | `anmeldenAction`, `abmeldenAction` |
| Passwort vergessen/zurücksetzen | `passwortVergessenAction`, `passwortZuruecksetzenAction` |
| Profil | `profilAktualisierenAction`, `emailAendernAction`, `passwortAendernAction` |
| Konto löschen | `kontoLoeschenAction` |
| Adressbuch | `adresseAnlegenAction`, `adresseAktualisierenAction`, `adresseLoeschenAction`, `adresseAlsStandardAction` |
| Checkout/Callback-Helfer | `ladeCheckoutVorbelegung`, `sendeWillkommensMailFuerBestaetigung`, `aktiviereNewsletterNachBestaetigung` |

Fehlerrückgaben folgen demselben Muster wie der Rest des Projekts
(`KontoActionResult { success, error? }` – `error` doppelt genutzt für
Statusmeldung bei Erfolg *und* Fehlergrund bei Misserfolg, analog zu
`beendeAlleSitzungenAction` in `lib/actions/admin.ts`). Nutzernachrichten
verraten bewusst kein internes Detail (z. B. bei fehlgeschlagener Anmeldung
nie, *ob* die E-Mail unbekannt oder das Passwort falsch war); die konkrete
Ursache geht ausschließlich ins Protokoll (`protokoll.*`).

---

## 6. Checkout-Vorbelegung

`ladeCheckoutVorbelegung()` füllt den Warenkorb-Checkout für angemeldete
Kund:innen aus der hinterlegten Standardadresse vor – reine Ausfüllhilfe,
ändert nichts an Preis- oder Steuerberechnung (die bleibt vollständig
serverseitig, siehe [bestellablauf.md](bestellablauf.md)). Telefon/Firma
kommen notfalls aus dem Profil, falls die Adresse selbst keine Angabe trägt.

`CartDrawer.tsx` ruft die Funktion clientseitig **einmalig** beim Öffnen des
jeweiligen Schritts auf – sowohl beim Checkout- als auch beim
Anfrageformular – und befüllt dabei **ausschließlich leere Felder**
(`f.firstName || vorbelegung.firstName`, usw.). Ein Gast ohne Sitzung
bekommt `null` zurück, das Formular bleibt unverändert leer wie zuvor –
niemand wird zur Anmeldung gezwungen, der Gastweg ist rein additiv
unberührt.

Bemerkenswert an der Historie: `ladeAdressen()`/`ladeStandardadresse()`
(`lib/account/data.ts`) waren ursprünglich extra für diesen Zweck angelegt
worden, aber zunächst nirgends verdrahtet. `ladeCheckoutVorbelegung()` holt
das nach, statt die Funktionen als toten Code stehen zu lassen.

---

## 7. Newsletter-Kopplung

Der Newsletter-Opt-in wird **nicht** sofort bei der Registrierung aktiv,
selbst wenn die Person beim Registrieren den Haken setzt. Die Absicht
reist nur als Query-Parameter (`&newsletter=1`) im Bestätigungslink mit
(`registrierenAction` baut `redirectTo` entsprechend). Geschrieben und
verschickt wird der Opt-in **erst** im Auth-Callback
(`aktiviereNewsletterNachBestaetigung()`), nachdem der Klick auf den Link
die E-Mail-Adresse tatsächlich bestätigt hat.

Der Grund: Vorher zu schreiben hieße, eine noch **unbestätigte** Adresse in
den Newsletterverteiler aufzunehmen und ihr sofort eine Mail zu schicken –
erst der bestätigte Code-Tausch beweist, dass die E-Mail-Adresse wirklich
dieser Person gehört.

Dieselbe Prüfung gilt beim nachträglichen Aktivieren über das Profil
(`profilAktualisierenAction`): Der vorherige Stand wird zuerst geladen, die
Bestätigungsmail (`NewsletterOptInEmail`) geht **nur** bei einem echten
Übergang `false → true` raus – nicht bei jedem Speichern des Profils, auch
wenn sich an dieser Option nichts geändert hat.

---

## 8. DSGVO-Bezug

Die vollständige Löschungs-/Anonymisierungslogik – Fristen, Abläufe,
Umsetzungsstand – steht in
[dsgvo-loeschkonzept.md](dsgvo-loeschkonzept.md). Kurz zusammengefasst für
das Konto (Abschnitt 3.3 dort): Kontoprofil und gespeicherte Adressen sind
**nicht** rechnungsrelevant und unterliegen keiner 10-Jahres-Pflicht – ein
Löschwunsch kann sie sofort entfernen, auch wenn zugehörige **Bestellungen**
weiter aufbewahrt bleiben müssen (die Bestellzeile bleibt dann ohne
verknüpftes Konto bestehen, exakt wie bei einem Gastkauf – dafür ist
`orders.customer_id` `on delete set null`, nicht `on delete cascade`,
siehe Abschnitt 2).

Die Newsletter-Einwilligung ist bewusst als **eigene** Spalte
(`newsletter_opt_in`) getrennt von der Registrierung geführt –
Zweckbindung: Newsletter ist ein eigener Zweck, nicht Teil der
Vertragsdurchführung.

---

## 9. Bekannte Grenzen / offene Punkte

- ~~**Keine Selbstlöschfunktion für das Konto.**~~ Behoben: `kontoLoeschenAction`
  (`lib/actions/konto.ts`) löscht auf eigenen Wunsch der Kundschaft
  (Passwort-Reeingabe + zweistufige UI-Bestätigung, `KontoLoeschenButton.tsx`
  auf `/konto/profil`) den `auth.users`-Eintrag über
  `admin.auth.admin.deleteUser()`. Genau wie hier ursprünglich vorgesehen
  übernehmen die Fremdschlüssel aus 0023 den Rest: `customer_profiles` und
  `customer_addresses` verschwinden automatisch mit (`on delete cascade`),
  betroffene `orders.customer_id` werden automatisch auf `NULL` gesetzt
  (`on delete set null`, Bestellzeile bleibt wie ein Gastkauf bestehen,
  siehe Abschnitt 2/8) – keine zusätzliche Anwendungslogik dafür nötig.
- **Keine E2E-Testabdeckung.** Das Projekt hat fünf E2E-Suiten
  (`npm run test:e2e[:zahlung|:ratelimit|:adminauth|:stripe]`), keine davon
  deckt den Kundenkonto-Weg ab. Grund: E2E-Läufe brauchen eine echte
  Supabase-Verbindung, die in dieser Entwicklungsumgebung nicht verfügbar
  ist (siehe `entscheidungen-produktionsreife.md`, Abschnitt 3). Geprüft ist
  das Konto bislang über die 657 grünen Unit-Tests (u. a.
  `lib/account/__tests__/validation.test.ts`) sowie `tsc`/`eslint`/Build –
  nicht gegen eine echte Auth-/DB-Instanz.
- **„Erneut bestellen" / gespeicherte Designs sind bewusst nicht gebaut.**
  Ein Motiv originalgetreu aus gespeicherten `configuration_elements` in
  den Konfigurator zurückzuladen ist ein eigener, nicht-trivialer Baustein
  – zumal hochgeladene Motivdateien nach der DSGVO-Frist (24 Monate)
  ohnehin gelöscht werden. Bewusst nicht als Placebo-Knopf abgeliefert.
- **Favoriten bleiben lokal (Local Storage), nicht kontoweit.** Eine
  konto-weite Synchronisierung ist eine sinnvolle spätere Ergänzung, kein
  Blocker für den heutigen Stand.
- **Migrationen 0023/0024 sind geschrieben, aber in dieser Umgebung nicht
  gegen eine echte Datenbank angewendet/verifiziert** – dieselbe
  Einschränkung wie bei allen anderen offenen Migrationen dieser Sitzung
  (fehlende Supabase-Zugangsdaten, siehe
  `entscheidungen-produktionsreife.md`, Abschnitt 3).
