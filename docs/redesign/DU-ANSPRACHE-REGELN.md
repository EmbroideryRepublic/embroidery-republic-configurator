# Du-Ansprache im gesamten Shop – Regeln für die Umstellung

Entscheidung des Betreibers (24.11.2026): Der Shop spricht durchgehend per **Du**. Die Startseite, der Konfigurator und die neue Kopfzeile duzen bereits („Gestalte dein Textil“, „Für dich. Für dein Team.“). Jetzt folgen alle übrigen Kundentexte.

## Was umgestellt wird

Jeder **für Besucher sichtbare** deutsche Text im Shop: Seiteninhalte, Überschriften, Beschreibungen, Meta-Beschreibungen, Formulare und Beschriftungen, Hinweise, Fehlermeldungen, Bestätigungen, FAQ, Ratgeber, Kategorie- und Anlassseiten, Warenkorb, Kasse, Konto.

## Was NICHT angefasst wird

- **Rechtstexte:** `src/app/datenschutz`, `src/app/agb`, `src/app/impressum` (und alles, was Widerruf, Rückerstattung, Gewährleistung, Haftung regelt). Sie bleiben vorerst in der Sie-Form, bis der Betreiber den Wortlaut freigibt.
- **E-Mail-Vorlagen** (`src/lib/email/**`): kommen als eigener Schritt mit Wortlaut-Vorlage zur Freigabe.
- **Admin-Bereich** (`src/app/admin`, `src/components/admin`): interne Oberfläche.
- **Code-Kommentare, Variablennamen, Funktionsnamen, Dateinamen, Testnamen, Protokolltexte für Entwickler.** Nur Zeichenketten, die ein Besucher auf Seite, in einer Meldung oder in einem Formular sieht.
- Zahlen, Preise, Fristen, Paragraphen, Platzhalter (`{anzahl}`, `{produktion}`, `${…}`), HTML-/JSX-Struktur, Schlüsselnamen der Übersetzungen.

## Sprachregeln

- Kleinschreibung: **du, dein, deine, deinen, deinem, deiner, dir, dich** (nicht „Du“ – auch nicht am Satzanfang, außer es ist normaler Satzanfang).
- Verben richtig umstellen: „Sie können“ → „du kannst“, „Sie erhalten“ → „du erhältst“, „Sie müssen“ → „du musst“, „Sie sehen“ → „du siehst“, „Sie haben“ → „du hast“, „Sie sind“ → „du bist“, „Sie werden“ → „du wirst“, „Sie möchten“ → „du möchtest“, „Sie wählen“ → „du wählst“.
- Aufforderungen: „Wählen Sie“ → „Wähle“, „Laden Sie hoch“ → „Lade hoch“, „Geben Sie ein“ → „Gib ein“, „Bitte beachten Sie“ → „Bitte beachte“, „Sehen Sie“ → „Sieh“, „Prüfen Sie“ → „Prüfe“, „Lesen Sie“ → „Lies“, „Fügen Sie hinzu“ → „Füge hinzu“, „Wenden Sie sich an“ → „Wende dich an“, „Nehmen Sie“ → „Nimm“.
- Possessiva: „Ihr Logo“ → „dein Logo“, „Ihre Bestellung“ → „deine Bestellung“, „Ihren Warenkorb“ → „deinen Warenkorb“, „Ihnen“ → „dir“, „Sie“ (Akkusativ) → „dich“, „sich“ je nach Satz → „dich“/„dir“.
- **Vorsicht bei „Sie/sie“ als „they“:** „Sie werden angezeigt“ kann „sie“ (Plural, dritte Person) meinen. Immer den Satz lesen, nicht blind ersetzen. Nur die Höflichkeitsform wird umgestellt.
- Ton: freundlich, klar, nicht anbiedernd, keine Ausrufezeichen-Flut, nichts Neues dazuerfinden. Bedeutung und Rechtsgehalt bleiben exakt gleich (z. B. „vom Widerruf ausgeschlossen“ bleibt inhaltlich unverändert).
- Mehrere Personen/Teams: „euer Team“ ist nicht nötig; bleibe bei „dein Team“, wenn der Text eine Person anspricht, und bei „euer“ nur, wenn der Text schon vorher mehrere Personen ansprach.
- Fachliche Aussagen bleiben unverändert (Produktionszeit, Versandkosten, Staffelpreise, Dateiformate).

## Tests

- Es gilt: **Die Schutzfunktion der Tests bleibt erhalten.** Wenn ein Test den alten Wortlaut als erwarteten Wert festhält (z. B. `assert.match(text, /Sie können/)`), wird nur dieser **erwartete Text** auf die Du-Form umgestellt – die Prüfung selbst (was gegen was verglichen wird) bleibt gleich. Keine Assertion wird gelöscht, gelockert oder auskommentiert.
- Jeder angepasste Test wird im Bericht aufgeführt: Datei, Testname, vorher/nachher, Grund.
- Vor dem Abschluss: `npx tsc --noEmit`, `npx eslint <geänderte Dateien>` und die betroffenen Tests bzw. `npm test` (ca. 40 s) laufen lassen und müssen grün sein.

## Abschluss

Eigener Commit im zugewiesenen Worktree (`git add` nur die geänderten Dateien, Commit-Nachricht „Du-Ansprache: <Bereich>“, mit der Zeile `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`). **Nicht pushen.** Im Bericht: Liste der geänderten Dateien, Anzahl umgestellter Texte, angepasste Tests (siehe oben), Stellen, bei denen die Umstellung unsicher war.
