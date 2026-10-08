# Datenschutzerklärung – Wortlaut zum Besucherzähler (ENTWURF, nicht freigegeben)

Datei: `src/app/datenschutz/page.tsx` · Sprache: nur Deutsch (die Seite hat keine
Übersetzung) · Anrede: „Wir/Sie“ wie im bisherigen Text.

**Nichts davon ist in der Datenschutzerklärung eingebaut.** Der Zähler ist ebenfalls
noch nicht eingebunden; ein Wächter-Test verhindert das, solange diese Änderung fehlt
(siehe `docs/besucherzaehler.md`, § 6).

Änderungen an fünf Stellen. Alles andere bleibt unverändert.

---

## 1. Ziffer 2 „Grundsätze“ – der fett gesetzte Satz

**Bisher:**

> **Wir setzen kein Tracking, keine Analyse-Werkzeuge, keine Werbe-Netzwerke und keine Social-Media-Plugins ein.** Es findet kein Profiling und keine automatisierte Entscheidungsfindung statt. Ein Cookie-Banner ist daher nicht erforderlich (siehe Ziffer 7).

**Neu** (dieser Satz ist mit dem Zähler nicht mehr wahr, er würde ihm widersprechen):

> **Wir setzen keine Werbe-Netzwerke, keine Social-Media-Plugins und keine Analyse-Dienste von Drittanbietern ein und verfolgen Sie weder über mehrere Tage noch über andere Websites hinweg.** Lediglich die Zahl der Besucherinnen und Besucher messen wir mit einem eigenen, cookielosen Zähler, der Ihre IP-Adresse nicht speichert (siehe Ziffer 3, „Reichweitenmessung“). Es findet kein Profiling und keine automatisierte Entscheidungsfindung statt. Ein Cookie-Banner ist daher nicht erforderlich (siehe Ziffer 7).

---

## 2. Ziffer 3 „Aufruf der Website“ – drei neue Absätze am Ende

> **Reichweitenmessung.** Um zu erfahren, wie viele Menschen unsere Website besuchen und welche Seiten sie aufrufen, nutzen wir einen eigenen Zähler. Bei jedem Seitenaufruf wird dazu nur die Adresse der aufgerufenen Seite (ohne Suchbegriffe und Anker) an unseren Server gemeldet und – falls in der aufgerufenen Adresse enthalten – die Kennzeichnung des Links, über den Sie zu uns gelangt sind (z. B. „instagram“). Auf Ihrem Endgerät wird dafür nichts gespeichert und nichts ausgelesen: Wir setzen keine Cookies und nutzen weder Local Storage noch Merkmale Ihres Geräts wie die Bildschirmgröße.
>
> Aus Ihrer IP-Adresse und der Kennung Ihres Browsers bildet unser Server kurzzeitig einen nicht umkehrbaren Kennwert (Hash). Der dazu verwendete geheime Schlüssel wechselt täglich. Der Kennwert dient allein dazu, mehrere Seitenaufrufe desselben Tages als einen Besucher zu zählen. Ihre IP-Adresse selbst wird für die Reichweitenmessung nicht in unserer Datenbank gespeichert, und eine Wiedererkennung an einem anderen Tag ist nicht möglich. Dauerhaft bleiben ausschließlich Zahlen ohne Personenbezug (z. B. Zahl der Besucher je Tag und Seite). Zur Abwehr massenhafter automatisierter Aufrufe wird zusätzlich ein weiterer Kennwert Ihrer IP-Adresse (nicht die Adresse im Klartext) für höchstens 24 Stunden gespeichert.
>
> Nicht gezählt werden Aufrufe, bei denen Ihr Browser „Do Not Track“ oder „Global Privacy Control“ signalisiert, sowie Aufrufe durch Suchmaschinen und andere automatische Programme. Die Verarbeitung erfolgt bei den in den Ziffern 4 und 5 genannten Dienstleistern. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer datensparsamen Erfolgskontrolle unseres Angebots). Sie können dieser Verarbeitung jederzeit widersprechen (Art. 21 DSGVO, siehe Ziffer 14).

---

## 3. Ziffer 7 „Cookies und lokale Speicherung im Browser“ – ein Satz am Ende

> Die Reichweitenmessung (Ziffer 3) speichert nichts auf Ihrem Endgerät und setzt keine Cookies.

---

## 4. Ziffer 13 „Speicherdauer“ – ein neuer Absatz am Ende

> Die für die Reichweitenmessung gebildeten Kennwerte (Ziffer 3) löschen wir mit Ablauf des jeweiligen Tages, den zur Abwehr automatisierter Aufrufe gebildeten Kennwert spätestens 24 Stunden nach der jeweiligen Zählung. Die verbleibenden Besucherzahlen enthalten keinen Personenbezug und werden unbefristet gespeichert.

---

## 5. „Stand“ unter der Überschrift

**Bisher:** `Stand: Juli 2026`  →  **Neu:** `Stand: Oktober 2026`

---

## Was ich geprüft habe und was offen bleibt

Jede technische Aussage im Wortlaut ist durch Code oder Test belegt:

| Aussage | Beleg |
|---|---|
| nichts auf dem Endgerät gespeichert/ausgelesen, keine Cookies | `besuchWaechter.test.ts` – Komponente enthält kein `localStorage`, `document.cookie`, `document.referrer`, Geräteabfragen |
| nur Seitenadresse (ohne Suchteil/Anker) und Linkkennzeichnung werden gemeldet | `Besuchszaehler.tsx` (`JSON.stringify({ pfad, quelle })`), `normalisierePfad` |
| Hash aus IP + Browserkennung, Schlüssel wechselt täglich, nicht umkehrbar | `bildeKennung` (HMAC, Tag im Schlüssel), `erfassen.test.ts` |
| keine Wiedererkennung an einem anderen Tag | `erfassen.test.ts`: dieselbe Person hat an jedem Tag eine andere Kennung |
| IP-Adresse nicht in der Datenbank | keine IP-Spalte (`besuchWaechter.test.ts`, `npm run besuch:pruefen`); Rate-Limit nutzt Kennwert statt Klartext (`rateLimit.test.ts`) |
| Kennwert mit Ablauf des Tages gelöscht | Cron alle 10 Minuten **und** Löschung durch den ersten Besucher des Folgetags (in der Datenbank nachgewiesen) |
| Rate-Limit-Kennwert höchstens 24 Stunden | `raeume_rate_limit_auf()` |
| Do Not Track / Global Privacy Control / Roboter nicht gezählt | `ausschlussGrund`, `erfassen.test.ts` |

**Offen – das kann ich nicht beurteilen:**

1. **Rechtliche Prüfung.** Die Einschätzung („keine Einwilligung nötig, Art. 6 Abs. 1 lit. f
   DSGVO trägt“) ist eine fachliche Einordnung, keine Rechtsberatung. Die bestehende
   Datenschutzerklärung empfiehlt ohnehin eine Prüfung vor dem Go-live; dieser Absatz
   gehört dazu.
2. **„nicht umkehrbar“** gilt, solange das Betriebsgeheimnis nicht bekannt ist. Wer es kennt
   *und* die Adresse eines Besuchers vermutet, könnte für den laufenden Tag prüfen, ob dieser
   Besucher gezählt wurde – nach Tagesende existiert die Kennung nicht mehr. Wollen Sie die
   Formulierung strenger („für den laufenden Tag nur mit geheimem Schlüssel prüfbar“), kann
   ich sie so fassen.
3. **Vercel-Logs** (IP-Adresse in Server-Logfiles, bereits in Ziffer 3, erster Absatz) bleiben
   unverändert; der Zähler ändert daran nichts.
