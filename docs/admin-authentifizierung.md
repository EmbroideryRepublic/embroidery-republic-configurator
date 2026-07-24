# Admin-Authentifizierung

Sitzungsverwaltung für den Adminbereich. Stand 2026-07-22.

---

## 1. Was vorher falsch war

```ts
cookies().set(ADMIN_COOKIE_NAME, key, { … });          // key === ADMIN_SECRET
return Boolean(cookieValue && cookieValue === process.env.ADMIN_SECRET);
```

**Das Cookie war wortgleich das Admin-Secret.** Daraus folgen vier Probleme,
von denen nur das erste offensichtlich ist:

**Ein Cookie-Leck gibt das Betriebsgeheimnis preis.** `httpOnly` schützt vor
XSS, aber nicht vor einem Proxy-Log, einer Browser-Erweiterung, einem
Fehlerbericht oder einem Screenshot. Wer das Cookie sieht, hat nicht eine
Sitzung, sondern **das Secret selbst** – und damit dauerhaften Zugriff.

**Keine Sitzung ließ sich einzeln beenden.** Ein vergessener Zugang auf
einem fremden Rechner konnte nur beendet werden, indem das Secret in der
Umgebung geändert wurde – womit auch alle anderen Zugänge ausgesperrt waren.

**Kein serverseitiger Ablauf.** Das Cookie hatte zwar `maxAge: 12h`, aber
das ist eine Bitte an den Browser, keine Durchsetzung. Ein kopiertes Cookie
galt unbegrenzt.

**Nicht zeitkonstanter Vergleich.** `===` bricht beim ersten
unterschiedlichen Zeichen ab. Über ein Netzwerk kaum ausnutzbar, aber
unnötig.

---

## 2. Weitere Stellen mit Secrets

Im Zuge dieser Arbeit vollständig geprüft:

| Stelle | Befund |
|---|---|
| `orderAccessToken.ts` | **vorbildlich** – HMAC + `timingSafeEqual`. Dient hier als Muster. |
| **Cron-Route** | **`?secret=<CRON_SECRET>` als Query-Parameter** – siehe unten |
| Cron-Route | nicht zeitkonstanter Vergleich |
| `AdminLoginForm.tsx` | nennt „ADMIN_SECRET aus .env.local" in der öffentlichen Oberfläche |
| `stripeKonfiguration.ts` | erwähnt nur Präfixe (`sk_test_`), nie Werte – in Ordnung |
| E-Mail, Supabase | Schlüssel nur serverseitig, nie in Antworten – in Ordnung |

### Der Query-Parameter ist der ernsteste Fund

```
GET /api/cron/process-supplier-orders?secret=GEHEIM
```

Query-Parameter landen in Server-Zugriffsprotokollen, in der
Browser-Historie, im `Referer`-Header beim Weiterklicken und in
Fehlerberichten. Ein Secret gehört dort nicht hin – deshalb existiert der
`Authorization`-Header.

**Maßnahme:** Der Query-Weg entfällt. Nur noch
`Authorization: Bearer <CRON_SECRET>`, verglichen zeitkonstant.

---

## 3. Zielbild

### Sitzungen statt Secret-Kopie

```
Anmeldung mit ADMIN_SECRET
        ↓  Secret wird zeitkonstant geprüft und danach VERWORFEN
Zufälliges Sitzungstoken (32 Byte aus crypto.randomBytes)
        ↓  Klartext geht ins Cookie
Datenbank speichert nur den SHA-256-HASH
        ↓
Jeder Zugriff: Cookie → Hash → Sitzung suchen → Ablauf prüfen
```

**Das Secret verlässt den Server nie.** Es wird bei der Anmeldung geprüft
und danach nicht mehr benötigt.

### Warum nur der Hash gespeichert wird

Dieselbe Überlegung wie bei Passwörtern: Wer Lesezugriff auf die Datenbank
erlangt – ein Backup, ein versehentlich geteilter Auszug, ein Leck – könnte
sich mit einem Klartext-Token sofort als Betreiber ausgeben. Aus dem Hash
lässt sich der Token nicht zurückrechnen.

Ein einfacher SHA-256 genügt hier, anders als bei Passwörtern: Der Token ist
32 Byte aus einem kryptografischen Zufallsgenerator. Er ist nicht erratbar,
also braucht es keine Schlüsselstreckung (bcrypt/argon2), die gegen
Wörterbuchangriffe auf schwache Passwörter schützt.

### Session Fixation

Der Token entsteht **erst nach** erfolgreicher Prüfung des Secrets, auf dem
Server, aus einem Zufallsgenerator. Ein Angreifer kann keinen Token
vorgeben, den das Opfer dann benutzt – die Voraussetzung für Session
Fixation fehlt strukturell. Ein bereits gesetztes Cookie wird bei der
Anmeldung überschrieben.

### Mehrere gleichzeitige Sitzungen

Jede Anmeldung erzeugt eine eigene Zeile. Zugänge von mehreren Geräten
laufen unabhängig; das Beenden des einen berührt den anderen nicht.

### Widerruf

| Fall | Wirkung |
|---|---|
| Abmelden | genau diese Sitzung |
| „Alle Zugänge beenden" | alle Sitzungen, Secret bleibt gültig |
| Secret in der Umgebung ändern | keine neue Anmeldung mehr möglich; bestehende Sitzungen laufen bis zum Ablauf weiter |

Der mittlere Fall war vorher unmöglich und ist der eigentliche Gewinn.

### Cookie-Einstellungen

| Einstellung | Wert | Grund |
|---|---|---|
| `httpOnly` | true | kein Zugriff aus JavaScript |
| `secure` | in Produktion | nie unverschlüsselt übertragen |
| `sameSite` | `lax` | schützt vor CSRF aus fremden Seiten; `strict` bräche Links aus E-Mails |
| `path` | `/` | der Adminbereich liegt unter mehreren Pfaden |
| `maxAge` | 12 h | gleichlaufend mit dem serverseitigen Ablauf |

Der serverseitige Ablauf ist maßgeblich. Die Cookie-Lebensdauer ist nur eine
Bitte an den Browser; ein kopiertes Cookie hilft nach Ablauf nicht mehr.

### Fehlerfälle

| Fall | Verhalten |
|---|---|
| kein Cookie | nicht angemeldet |
| Cookie mit unbekanntem Token | nicht angemeldet, Protokolleintrag |
| Sitzung abgelaufen | nicht angemeldet, Zeile bleibt für den Aufräumlauf |
| Sitzung widerrufen | nicht angemeldet |
| Datenbank nicht erreichbar | **nicht angemeldet** |

Der letzte Punkt unterscheidet sich bewusst vom Rate-Limit: Dort lässt ein
Ausfall durch, hier sperrt er aus. Ein Rate-Limit schützt vor Missbrauch;
seine Störung darf nicht den Shop lahmlegen. Eine Authentifizierung schützt
Kundendaten – bei Zweifel wird nicht hereingelassen.

---

## 4. Aufräumen (auch der offene Punkt aus H2)

Zwei Tabellen wachsen ohne Pflege: abgelaufene Sitzungen und alte
Rate-Limit-Fenster.

**Entscheidung: beide an die bestehende Cron-Route anhängen.**

Sie läuft ohnehin regelmäßig, ist über `CRON_SECRET` abgesichert und
benötigt keinen zusätzlichen Zeitplan, keinen weiteren Dienst und keine
neue Route. Eine eigene Wartungsroute wäre eine zweite Stelle, die man
absichern, überwachen und einplanen müsste – für zwei `delete`-Anweisungen.

Das Aufräumen darf die eigentliche Aufgabe der Route nicht gefährden: Es
läuft **nach** der Lieferantenverarbeitung und wird einzeln abgefangen. Ein
Fehler beim Aufräumen erscheint in der Antwort, lässt die Route aber
erfolgreich enden.

| Was | Frist | Begründung |
|---|---|---|
| Rate-Limit-Fenster | 24 h | längstes verwendetes Fenster ist eine Stunde |
| Admin-Sitzungen | 7 Tage nach Ablauf | die Zeile bleibt kurz erhalten, damit ein Zugriff mit abgelaufenem Token noch als „abgelaufen" statt „unbekannt" erkennbar ist |

---

## 5. Umsetzungsstand (2026-07-22)

| Baustein | Stand |
|---|---|
| Migration 0018: `admin_sitzungen` + Aufräumfunktion | **angewendet** |
| Secret nur noch in `auth.ts`, zeitkonstant verglichen | **fertig** |
| Zufälliges Sitzungstoken (32 Byte), nur Hash gespeichert | **fertig** |
| Serverseitiger Ablauf (12 h) | **fertig** |
| Einzelne Sitzung widerrufen | **fertig** |
| Alle Sitzungen beenden, ohne das Secret zu ändern | **fertig** |
| Mehrere gleichzeitige Sitzungen | **fertig** |
| Sitzungsübersicht (`aktiveSitzungen()`) | **Funktion fertig**, Oberfläche offen |
| Cookie-Einstellungen geprüft | **fertig** |
| Abmelden widerruft serverseitig | **fertig** |
| Cron-Route: Query-Parameter entfernt, zeitkonstanter Vergleich | **fertig** |
| Wartung (Rate-Limit + Sitzungen) an der Cron-Route | **fertig** |

### Nachgewiesen

**`npm run test:e2e:adminauth` – 19 Prüfungen gegen die echte Datenbank:**
Ablauf, Widerruf einzelner und aller Sitzungen, drei Geräte gleichzeitig,
zehn parallele Prüfungen derselben Sitzung, Aufräumlauf. Dazu fünf negative
Fälle: unbekannter, veränderter, gekürzter und leerer Token – und der Hash
selbst, der als Token nicht gilt.

Ein eigener Test belegt, dass der **Klartext-Token nirgends** in der
Datenbank steht, sondern ausschließlich sein Hash.

**13 Tests in `lib/admin/__tests__/auth.test.ts`**, darunter die Wächter:
Nur `auth.ts` liest `process.env.ADMIN_SECRET`, und nirgends im Projekt wird
das Secret in ein Cookie geschrieben. Beide durchsuchen den gesamten
Quelltext.

### Der Cookie-Name hat sich geändert

`er_admin_key` → `er_admin_session`. Zwei Gründe: „key" legte nahe, dass
dort ein Schlüssel liegt – genau das war das Problem. Und der Wechsel sorgt
dafür, dass alte Cookies mit dem Secret als Wert nicht mehr gelesen werden;
alle bestehenden Zugänge müssen sich einmal neu anmelden.

### Offen: Oberfläche für die Sitzungsübersicht

`aktiveSitzungen()` und `widerrufeSitzungAction()` sind vorhanden und
getestet, es fehlt die Darstellung im Adminbereich – eine Liste mit
Herkunft, letztem Zugriff und einem Knopf je Zeile. Ein kleiner, eigener
Schritt.
