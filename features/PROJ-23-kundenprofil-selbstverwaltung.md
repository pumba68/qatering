# PROJ-23: Kundenprofil – Selbstverwaltung

## Status: 🔵 Planned

## Kontext & Ziel

Kunden der Plattform haben aktuell keine Möglichkeit, ihre eigenen Daten einzusehen oder zu ändern. Name, E-Mail, Passwort, Allergene, Präferenzen und Benachrichtigungseinstellungen sind nur über den Admin-Bereich verwaltbar. Das ist eine kritische Lücke für Selbstständigkeit und DSGVO-Compliance.

**Ziel:** Eine dedizierte Profil-Seite unter `/profil` auf der sich eingeloggte Kunden eigenständig um ihre Stammdaten, Sicherheitseinstellungen, Präferenzen und Kommunikationseinstellungen kümmern können.

### Aufteilung

| ID | Name | Kurzbeschreibung |
|---|---|---|
| PROJ-23a | Profil-Route & Mini-Dashboard | Route `/profil`, Auth-Guard, Navigations-Einstieg, Wallet-Stand & letzte Bestellung |
| PROJ-23b | Stammdaten-Verwaltung | Name und E-Mail-Adresse ändern (E-Mail per Bestätigungslink) |
| PROJ-23c | Sicherheitseinstellungen | Passwort-Änderung via E-Mail-Link, Konto-Anonymisierung (DSGVO Soft-Delete) |
| PROJ-23d | Präferenzen & Allergene (Kundenseitig) | Explizite Allergene/Diätkategorien setzen; KI-Vorschläge bestätigen oder ignorieren |
| PROJ-23e | Benachrichtigungseinstellungen | Marketing-E-Mail Opt-in/Opt-out, Push-Benachrichtigungen de-/aktivieren |

## Abhängigkeiten

- Benötigt: PROJ-6 (Wallet) — für Wallet-Stand im Mini-Dashboard
- Benötigt: PROJ-20 (CDP Präferenzen & Allergene) — `CustomerPreference`-Tabelle für Präferenzverwaltung
- Benötigt: PROJ-9 (E-Mail-Versand) — für Bestätigungsmail E-Mail-Änderung + Passwort-Reset-Link
- Benötigt: PROJ-10 (Push Integration) — für Push-Abo-Verwaltung

---

## User Stories

### PROJ-23a – Profil-Route & Mini-Dashboard

- Als **eingeloggter Kunde** möchte ich über die Navigation einen direkten Link zu meinem Profil haben, damit ich jederzeit schnell auf meine Einstellungen zugreifen kann.
- Als **eingeloggter Kunde** möchte ich auf meiner Profil-Seite sofort meinen aktuellen Wallet-Stand und die letzte Bestellung sehen, damit ich einen schnellen Kontext-Überblick habe, ohne die Seite wechseln zu müssen.
- Als **nicht eingeloggter Besucher**, der `/profil` aufruft, möchte ich automatisch zum Login weitergeleitet werden, damit keine Profildaten ohne Authentifizierung abrufbar sind.
- Als **Admin**, der `/profil` aufruft, möchte ich automatisch zu `/admin` weitergeleitet werden, damit Admins nicht versehentlich ihren Kunden-Account bearbeiten.

### PROJ-23b – Stammdaten-Verwaltung

- Als **Kunde** möchte ich meinen angezeigten Namen (Vor-/Nachname) jederzeit ändern können, damit ich stets unter meinem richtigen Namen bestellen kann.
- Als **Kunde** möchte ich meine E-Mail-Adresse ändern können, wobei mir ein Bestätigungslink an die **neue** Adresse geschickt wird, damit die neue Adresse erst aktiv wird, wenn ich sie bestätigt habe — und kein Unbefugter meine E-Mail übernehmen kann.
- Als **Kunde** möchte ich während einer laufenden E-Mail-Änderung (Bestätigung noch ausstehend) sehen, dass eine Änderung beantragt ist und welche Adresse bestätigt werden muss, damit ich den Status nachvollziehen kann.
- Als **Kunde** möchte ich eine ausstehende E-Mail-Änderung abbrechen können, bevor ich den Bestätigungslink angeklickt habe.

### PROJ-23c – Sicherheitseinstellungen

- Als **Kunde** möchte ich mein Passwort ändern können, indem ich auf „Passwort ändern" klicke und mir daraufhin ein Reset-Link an meine aktuelle E-Mail geschickt wird — identischer Flow wie „Passwort vergessen", damit ich kein altes Passwort eingeben muss und der Prozess vertraut wirkt.
- Als **Kunde** möchte ich meinen Account dauerhaft löschen lassen können, wobei mir klar kommuniziert wird, was genau gelöscht wird (Name, E-Mail, Bild, Präferenzen) und was erhalten bleibt (anonymisierte Bestelldaten für die Buchhaltung).
- Als **Kunde** möchte ich vor der Konto-Löschung aufgefordert werden, meine E-Mail-Adresse einzugeben, um die Löschung zu bestätigen, damit ich nicht versehentlich meinen Account lösche.

### PROJ-23d – Präferenzen & Allergene (Kundenseitig)

- Als **Kunde** möchte ich meine Allergene (alle 14 EU-Pflichtallergene) explizit angeben oder entfernen können, damit das System und die Küche über meine Unverträglichkeiten informiert sind.
- Als **Kunde** möchte ich meine Diätkategorien (vegan, vegetarisch, halal, etc.) angeben oder entfernen können.
- Als **Kunde** möchte ich von der KI abgeleitete Präferenz-Vorschläge sehen können und diese einzeln **bestätigen** oder **ignorieren**, damit ich die Kontrolle über meine Profildaten habe und automatisch erkannte Muster validieren kann.
- Als **Kunde** möchte ich einen klaren Hinweis sehen, wenn noch keine Präferenzen gesetzt sind, damit ich weiß, dass ich sie aktiv setzen muss.

### PROJ-23e – Benachrichtigungseinstellungen

- Als **Kunde** möchte ich meinen Marketing-E-Mail-Einwilligungsstatus (Opt-in/Opt-out) einsehen und jederzeit ändern können, damit ich selbst entscheide, ob ich Werbekommunikation erhalten möchte.
- Als **Kunde** möchte ich sehen, ob ich aktuell Push-Benachrichtigungen abonniert habe, und das Abo aktivieren oder deaktivieren können, damit ich die Kontrolle über Systembenachrichtigungen behalte.
- Als **Kunde** möchte ich bei deaktivierten Push-Benachrichtigungen einen Hinweis sehen, was ich verpasse (z. B. Bestellstatus-Updates), damit ich eine informierte Entscheidung treffen kann.

---

## Acceptance Criteria

### PROJ-23a – Profil-Route & Mini-Dashboard

- [ ] Die Route `/profil` existiert und ist nur für eingeloggte User zugänglich
- [ ] Nicht eingeloggte Besucher werden zu `/login?callbackUrl=/profil` weitergeleitet
- [ ] Nutzer mit Rolle `ADMIN` oder `SUPER_ADMIN` oder `KITCHEN_STAFF` werden zu `/admin` weitergeleitet (kein Profil für diese Rollen)
- [ ] Im Navigations-Header (Navbar/User-Menü) gibt es einen sichtbaren Link „Mein Profil" der zu `/profil` führt — sichtbar für eingeloggte Kunden
- [ ] Am Seitenanfang von `/profil` gibt es ein Mini-Dashboard mit:
  - Aktueller Wallet-Stand (mit Link zu `/wallet`)
  - Letzte Bestellung (Datum + Status, mit Link zu `/order/[id]` falls vorhanden); bei keiner Bestellung: Leerstate „Noch keine Bestellungen"
- [ ] Die Profil-Seite ist als Single Scroll-Page strukturiert mit klar getrennten Sektionen:
  1. Mini-Dashboard (Wallet + letzte Bestellung)
  2. Stammdaten (Name, E-Mail)
  3. Sicherheit (Passwort, Konto löschen)
  4. Präferenzen & Allergene
  5. Benachrichtigungen (Marketing-E-Mail, Push)
- [ ] Jede Sektion hat einen sichtbaren Sektions-Header und visuellen Trenner

### PROJ-23b – Stammdaten-Verwaltung

#### Name
- [ ] Der aktuelle Name des Kunden ist im Name-Feld vorausgefüllt
- [ ] Name kann geändert und per „Speichern"-Button gespeichert werden
- [ ] Name-Feld erlaubt max. 200 Zeichen; leerer Name ist nicht erlaubt
- [ ] Nach erfolgreicher Speicherung erscheint eine Erfolgsbestätigung (Toast/Inline-Meldung)
- [ ] Der geänderte Name wird sofort in der Navbar/Session sichtbar (Session-Update)

#### E-Mail-Änderung
- [ ] Die aktuelle E-Mail-Adresse ist im Feld angezeigt (nicht editierbar als Freitext; separate Änderungsmaske)
- [ ] Klick auf „E-Mail ändern" öffnet ein Formular zur Eingabe der neuen E-Mail-Adresse
- [ ] Nach Absenden wird eine Bestätigungsmail an die **neue** Adresse gesendet mit einem zeitlich begrenzten Bestätigungslink (Token, gültig 24h)
- [ ] Die E-Mail-Adresse im System ändert sich **erst**, wenn der Bestätigungslink geklickt wurde
- [ ] Solange die Bestätigung aussteht, erscheint auf der Profil-Seite ein Banner: „E-Mail-Änderung ausstehend: Bitte bestätige [neue-email@...]" mit Option „Abbrechen"
- [ ] Klick auf „Abbrechen" löscht den ausstehenden Token und behält die alte E-Mail
- [ ] Bestätigungslink landet auf einer Bestätigungsseite (`/profil/email-bestaetigen?token=...`) die den Token validiert, die E-Mail wechselt und auf `/profil` weiterleitet mit Erfolgsmeldung
- [ ] Bereits verwendete oder abgelaufene Tokens geben eine klare Fehlermeldung
- [ ] Bei Bestätigungs-Link-Klick wird die Session sofort mit der neuen E-Mail aktualisiert

### PROJ-23c – Sicherheitseinstellungen

#### Passwort-Änderung
- [ ] In der Sicherheits-Sektion gibt es einen Button „Passwort ändern"
- [ ] Klick sendet sofort einen Passwort-Reset-Link an die aktuelle E-Mail (identischer Flow wie „Passwort vergessen" auf der Login-Seite)
- [ ] Eine Inline-Meldung bestätigt: „Wir haben dir einen Link zum Zurücksetzen deines Passworts an [email] gesendet."
- [ ] Kein altes Passwort muss eingegeben werden

#### Konto-Anonymisierung (Soft-Delete)
- [ ] In der Sicherheits-Sektion gibt es eine „Konto löschen"-Sektion mit rotem Warnbereich
- [ ] Der Bereich zeigt klar, was gelöscht wird: Name, E-Mail, Profilbild, Präferenzen, Push-Subscriptions
- [ ] Der Bereich zeigt klar, was erhalten bleibt (anonymisiert): Bestelldaten für Buchhaltung und gesetzliche Aufbewahrungsfristen
- [ ] Klick auf „Konto löschen" öffnet ein Bestätigungs-Modal
- [ ] Im Modal muss der Kunde seine aktuelle E-Mail-Adresse eintippen, um die Löschung zu bestätigen
- [ ] Bei Bestätigung: `User.name` → `null`, `User.email` → anonymisierte UUID-Adresse, `User.image` → `null`, alle `CustomerPreference`-Einträge werden gelöscht, alle `PushSubscription`-Einträge werden gelöscht, `User.marketingEmailConsent` → `false`
- [ ] Nach Anonymisierung wird die Session beendet und der Nutzer auf die Login-Seite weitergeleitet mit Meldung: „Dein Konto wurde gelöscht."
- [ ] Bestelldaten, Wallet-Transaktionen und CompanyEmployee-Einträge bleiben erhalten (nur User-Referenz auf anonymisierte ID)

### PROJ-23d – Präferenzen & Allergene

- [ ] Die Sektion zeigt alle 14 EU-Pflichtallergene als Checkboxen (oder Toggle-Chips)
- [ ] Die Sektion zeigt alle verfügbaren Diätkategorien als Checkboxen (vegan, vegetarisch, halal, koscher, glutenfrei, laktosefrei, low-carb, diabetiker oder was in der Metadata-Tabelle als `DIET_CATEGORY` aktiv ist)
- [ ] Aktuell explizit gesetzte Präferenzen (`type: EXPLICIT`, `ignored: false`) sind als aktiv angezeigt
- [ ] Aktivieren/Deaktivieren einer Checkbox speichert die Änderung sofort (kein separater Speichern-Button nötig, oder alternativ ein Speichern-Button am Ende der Sektion)
- [ ] Abschnitt „Von KI erkannt" zeigt alle `type: DERIVED`-Einträge, die noch **nicht** `ignored: true` sind und noch **nicht** als EXPLICIT bestätigt wurden
- [ ] Jeder KI-Vorschlag hat zwei Aktions-Buttons: „Bestätigen" und „Ignorieren"
  - „Bestätigen" → `type` wird auf `EXPLICIT` geändert (keine neue Zeile, Update der bestehenden)
  - „Ignorieren" → `ignored: true` gesetzt
- [ ] Wenn keine KI-Vorschläge vorhanden sind, wird der Abschnitt nicht angezeigt (kein leerer Bereich)
- [ ] Wenn noch keine expliziten Präferenzen gesetzt sind: „Noch keine Präferenzen hinterlegt. Wähle deine Allergene und Ernährungsweise aus."

### PROJ-23e – Benachrichtigungseinstellungen

#### Marketing-E-Mail
- [ ] Der aktuelle Status von `User.marketingEmailConsent` (true/false) ist als Toggle/Checkbox sichtbar
- [ ] Änderung des Toggles speichert den Wert sofort in der Datenbank
- [ ] Label erklärt was Marketing-E-Mails sind: „Erhalte Neuigkeiten, Aktionen und personalisierten Angebote per E-Mail"
- [ ] Opt-out zeigt einen Hinweis: „Du kannst dich jederzeit wieder anmelden."

#### Push-Benachrichtigungen
- [ ] Der aktuelle Abo-Status wird angezeigt (Abo aktiv = mind. eine aktive `PushSubscription` im Browser)
- [ ] „Aktivieren": Browser-Permission-Dialog öffnet sich; bei Erlaubnis wird die Subscription gespeichert
- [ ] „Deaktivieren": Alle `PushSubscription`-Einträge des Users werden gelöscht (serverseitig)
- [ ] Falls Browser-Permissions verweigert wurden: Hinweis mit Anleitung, wie Push in den Browser-Einstellungen reaktiviert werden kann
- [ ] Info-Text: Was Push-Benachrichtigungen enthalten (z.B. „Bestellstatus-Updates, Aktionen deiner Kantine")

---

## Edge Cases

- **Gleichzeitige Sessions:** Wenn Kunde auf Gerät A eine E-Mail-Änderung beantragt und auf Gerät B bestätigt → Session auf A soll beim nächsten Reload die neue E-Mail zeigen (kein Absturz)
- **Token abgelaufen (E-Mail-Bestätigung nach >24h):** Fehlermeldung „Dieser Link ist abgelaufen. Bitte beantrage die E-Mail-Änderung erneut." + Button „Erneut beantragen"
- **Neue E-Mail bereits vergeben:** Wenn jemand anderes diese E-Mail bereits hat, 409-Fehler bei Beantragung mit Message: „Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet."
- **Passwort-Link bei Social-Login (kein Passwort gesetzt):** Falls der User sich nur über Google/Social eingeloggt hat und kein `passwordHash` existiert, lautet die Meldung: „Du hast dich mit einem externen Anbieter registriert. Eine Passwortänderung ist für deinen Account nicht erforderlich." — Button ist ausgegraut
- **Falsche E-Mail bei Konto-Löschung:** Wenn die eingegebene E-Mail nicht mit der aktuellen übereinstimmt, wird die Löschung abgelehnt: „Die eingegebene E-Mail stimmt nicht überein."
- **Konto-Löschung während ausstehender Bestellungen:** Hinweis im Lösch-Modal: „Du hast noch eine laufende Bestellung. Dein Konto wird erst nach Abschluss dieser Bestellung anonymisiert." — alternativ sofort anonymisieren aber Bestelldaten bleiben erhalten
- **Push-Subscription in mehreren Browsern:** Deaktivieren löscht alle Subscriptions des Users, nicht nur die des aktuellen Browsers. Hinweis: „Push-Benachrichtigungen werden auf allen deinen Geräten deaktiviert."
- **KI-Vorschlag, der bereits explizit gesetzt ist:** Ein DERIVED-Eintrag kann nur erscheinen, wenn er noch nicht als EXPLICIT existiert — serverseitig sicherstellen, dass keine Duplikate entstehen (`@@unique([userId, key])` verhindert das)
- **Name-Änderung bei anonymem Account (`isAnonymous: true`):** Profil-Seite zeigt keinen Name-Bereich oder deaktivierten Zustand; anonyme Accounts können keinen Namen setzen
- **Rate Limiting:** E-Mail-Bestätigungsanfragen und Passwort-Reset-Links werden auf max. 3 Anfragen / 10 Minuten pro User limitiert um E-Mail-Spam zu verhindern
- **Token mehrfach klicken:** E-Mail-Bestätigungslink darf nur einmal verarbeitet werden; zweites Klicken zeigt: „Dieser Link wurde bereits verwendet."
- **Browser verweigert Push-Permission dauerhaft:** Klick auf „Aktivieren" erkennt den `denied`-Status und zeigt sofort die Anleitung zum Entsperren (kein unnötiger Dialog-Aufruf)

---

## Technische Anforderungen

### Neue API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/profil` | Aktuelle Userdaten + Wallet-Stand + letzte Bestellung + Präferenzen + Push-Status |
| `PATCH` | `/api/profil/stammdaten` | Name updaten |
| `POST` | `/api/profil/email-aendern` | E-Mail-Änderung beantragen (Token erzeugen + Mail senden) |
| `DELETE` | `/api/profil/email-aendern` | Ausstehende E-Mail-Änderung abbrechen |
| `GET` | `/api/profil/email-bestaetigen` | Token validieren + E-Mail wechseln |
| `POST` | `/api/profil/passwort-reset` | Passwort-Reset-Link an aktuelle E-Mail senden |
| `POST` | `/api/profil/konto-loeschen` | Konto anonymisieren (mit E-Mail-Bestätigung im Body) |
| `PATCH` | `/api/profil/einstellungen` | Marketing-Consent updaten |
| `DELETE` | `/api/profil/push-subscription` | Alle Push-Subscriptions des Users löschen |

### Token-Verwaltung (E-Mail-Änderung)
- Neues Modell `EmailChangeToken` (oder Nutzung des bestehenden `VerificationToken`-Modells): `{ userId, newEmail, token, expiresAt }`
- Token ist ein kryptografisch sicherer Zufallswert (z.B. `crypto.randomBytes(32).toString('hex')`)
- TTL: 24 Stunden
- Nach Verwendung sofort invalidiert (gelöscht)

### Datenschutz & Sicherheit
- Alle `/api/profil/*`-Endpunkte erfordern aktive Session mit Rolle `CUSTOMER` (kein Admin-Zugriff über diesen Pfad)
- Rate Limiting auf E-Mail-sensitiven Aktionen (E-Mail-Änderung, Passwort-Reset, Konto-Löschung)
- Konto-Löschung prüft E-Mail-Eingabe serverseitig (nicht nur client-seitig)

### Performance
- `/profil` Seitenaufruf: alle Daten in maximal 2 parallelen API-Calls geladen
- Präferenzen-Updates: Optimistic UI (sofortiges visuelles Feedback, async Speicherung)

---

## Out of Scope

- Profilbild-Upload durch den Kunden (nur Lesen falls vorhanden; Verwaltung durch Admin)
- Telefonnummer oder Adressfelder (kein Feld im aktuellen User-Modell)
- 2-Faktor-Authentifizierung (→ späteres Security-Feature)
- OAuth-Account-Verknüpfung / -Trennung (→ späteres Feature)
- Passwort-Stärke-Anforderungen über den bestehenden Reset-Flow hinaus
- Export der Kundendaten (DSGVO Art. 20 Datenübertragbarkeit → separates Feature)
- Admin-gesteuerte Profil-Locks (z.B. „E-Mail kann nicht geändert werden") → nicht MVP

---

---

## UI-Konzept (UI Designer)

### Design-Prinzipien

Das Kundenprofil ist die persönlichste Seite der App. Das Design folgt drei Leitgedanken:

1. **Vertrauen durch Klarheit** — Sicherheits-relevante Aktionen (E-Mail, Passwort, Konto löschen) werden visuell deutlich von unkritischen Einstellungen getrennt. Destructive Aktionen sitzen immer ganz unten in einer roten „Gefahrenzone".
2. **Konsistenz mit der bestehenden App** — Die Profil-Seite nutzt dieselbe visuelle Sprache wie `app/login`, `app/wallet` und die Admin-Drawer-Komponenten: abgerundete Karten (`rounded-xl`), Blue/Indigo-Gradients, Glass-Morphism-Akzente und durchgängige Dark-Mode-Unterstützung.
3. **Progressive Disclosure** — Gefährliche oder seltene Aktionen (Konto löschen, E-Mail-Änderung) sind hinter einem zusätzlichen Klick versteckt. Häufige Aktionen (Name ändern, Präferenz-Toggle) sind direkt zugänglich.

---

### Farbsystem & Tokens

| Bereich | Token / Klasse | Verwendung |
|---|---|---|
| Seiten-Hintergrund | `from-blue-50 via-indigo-50 to-purple-50` | Gradient Hero-Header |
| Karten | `bg-card border border-border/50 rounded-xl shadow-sm` | Alle Sektions-Cards |
| Primär-CTA | `bg-gradient-to-r from-primary to-purple-600` | Speichern, Bestätigen |
| Allergen-Chip aktiv | `bg-amber-100 text-amber-700 border-amber-300` | Aktive Allergen-Toggles |
| Allergen-Chip inaktiv | `bg-muted/50 text-muted-foreground border-border` | Inaktive Allergen-Toggles |
| Diät-Chip aktiv | `bg-green-100 text-green-700 border-green-300` | Aktive Diät-Toggles |
| Diät-Chip inaktiv | `bg-muted/50 text-muted-foreground border-border` | Inaktive Diät-Toggles |
| KI-Vorschlag Banner | `bg-amber-50 border-amber-200 dark:bg-amber-950/30` | DERIVED-Präferenzen |
| E-Mail ausstehend | `bg-blue-50 border-blue-200 dark:bg-blue-950/30` | Pending E-Mail-Änderung |
| Gefahrenzone | `bg-red-50/50 border border-red-200 rounded-xl` | Konto löschen Bereich |
| Erfolg Toast | `bg-green-50 border-green-200 text-green-700` | Inline-Bestätigung |

---

### Seitenstruktur — Gesamtlayout

```
┌─────────────────────────────────────────────────────────┐
│  NAVBAR  [🍽 Menü]  [🌐 Wiki]  ········  [👤 Max M. ▾]  │
│                                            ↳ Mein Profil │
│                                            ↳ Abmelden    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ░░ HERO-HEADER (gradient from-blue-50 to-purple-50) ░░ │
│                                                          │
│     ╭─────╮                                             │
│     │ MM  │   Max Mustermann                            │
│     │ 🎨  │   max@example.com                           │
│     ╰─────╯   Mitglied seit April 2024                  │
│     (Avatar-Kreis, Initialen oder Bild)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  MINI-DASHBOARD                                         │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  💰 Guthaben      │  │  📦 Letzte Bestellung         │ │
│  │                  │  │                              │ │
│  │   12,50 €  →     │  │  Heute, 12:15 Uhr      →    │ │
│  │  [zum Wallet]    │  │  ● Bereit zur Abholung      │ │
│  └──────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  ✏️  STAMMDATEN                                          │
│  ─────────────────────────────────────────────────────  │
│  Name          [Max Mustermann          ] [Speichern]    │
│                                                          │
│  E-Mail        max@example.com                          │
│                                      [E-Mail ändern ▾]  │
│                                                          │
│  ╔═══════════════════════════════════════════════════╗  │
│  ║ ℹ️  E-Mail-Änderung ausstehend                    ║  │
│  ║ Bitte bestätige: neu@example.com                  ║  │
│  ║                               [Abbrechen]         ║  │
│  ╚═══════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔒  SICHERHEIT                                         │
│  ─────────────────────────────────────────────────────  │
│  Passwort       ••••••••••••                            │
│                 [Passwort-Link senden]                   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔴 Konto löschen                  (aufklappbar) │    │
│  │ Was wird gelöscht / Was bleibt erhalten          │    │
│  │                           [Konto löschen ›]      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🌿  PRÄFERENZEN & ALLERGENE                            │
│  ─────────────────────────────────────────────────────  │
│  Allergene                                              │
│  [🌾 Gluten ✓] [🦐 Krebst.] [🥚 Eier ✓] [🐟 Fisch]    │
│  [🥜 Erdnüsse] [🌿 Soja]   [🥛 Milch ✓] [🌰 Nüsse]    │
│  ...                                                    │
│                                                          │
│  Ernährungsweise                                        │
│  [🌱 Vegan ✓] [🥦 Vegetarisch] [☪ Halal] [✡ Koscher]   │
│  [🌾 Glutenfrei] [🥛 Laktosefrei] [📉 Low Carb]        │
│                                                          │
│  ╔═══════════════════════════════════════════════════╗  │
│  ║ 🤖 Von KI erkannt — bitte bestätigen              ║  │
│  ║                                                   ║  │
│  ║  🌱 Vegan (Konfidenz: 87%)                        ║  │
│  ║  [✓ Bestätigen]  [✗ Ignorieren]                  ║  │
│  ║                                                   ║  │
│  ║  🌾 Glutenfrei (Konfidenz: 72%)                   ║  │
│  ║  [✓ Bestätigen]  [✗ Ignorieren]                  ║  │
│  ╚═══════════════════════════════════════════════════╝  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  🔔  BENACHRICHTIGUNGEN                                 │
│  ─────────────────────────────────────────────────────  │
│  Marketing-E-Mails                                      │
│  Aktionen, Angebote & Neuigkeiten         [ON ●──]      │
│  "Du erhältst Newsletter an max@..."                    │
│                                                          │
│  Push-Benachrichtigungen                                │
│  Bestellstatus, Aktionen deiner Kantine   [OFF ──●]     │
│  "Aktiviere Push um Bestellstatus-        [Aktivieren]  │
│   Updates in Echtzeit zu erhalten."                     │
└─────────────────────────────────────────────────────────┘
```

---

### Komponenten-Spezifikationen

#### A — Hero-Header

```
Höhe: ~120px auf Mobile, ~160px auf Desktop
Hintergrund: bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
             dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30
Layout: flex items-center gap-4 px-4 md:px-6 py-8

Avatar:
  Größe: w-16 h-16 (64px)
  Stil: rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg
  Fallback (keine image):
    Hintergrund: bg-gradient-to-br from-primary to-purple-600
    Text: text-white font-bold text-xl (Initialen)

Name: text-xl font-bold text-foreground
E-Mail: text-sm text-muted-foreground mt-0.5
Registrierungsdatum: text-xs text-muted-foreground/70 mt-1 (z.B. "Mitglied seit April 2024")
```

#### B — Mini-Dashboard (2-Spalten-Grid)

```
Layout: grid grid-cols-2 gap-3 px-4

Wallet-Card:
  Klassen: bg-card rounded-xl border border-border/50 p-4
           hover:shadow-md hover:scale-[1.02] transition-all duration-200 cursor-pointer
  Icon: Wallet-Icon, w-8 h-8, bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg p-1.5
  Label: text-xs text-muted-foreground
  Betrag: text-xl font-bold text-foreground (z.B. "12,50 €")
  Link: gesamte Karte ist als <Link href="/wallet"> geklickt

Bestellungs-Card:
  Klassen: identisch zur Wallet-Card
  Icon: Package-Icon, w-8 h-8, bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg p-1.5
  Datum: text-xs text-muted-foreground
  Status-Pill: kleines farbiges Badge (z.B. "Bereit zur Abholung" → green)
  Leerstate: text-sm text-muted-foreground italic "Noch keine Bestellungen"
```

#### C — Sektions-Container (wiederholtes Pattern)

```
Jede Hauptsektion:
  Wrapper: px-4 space-y-3

  Sektions-Header:
    Layout: flex items-center gap-2 mb-3
    Icon: w-4 h-4 text-muted-foreground
    Text: text-base font-semibold text-foreground
    Trenner: <Separator /> darunter (1px Linie, border-border/50)

  Sektions-Card:
    Klassen: bg-card rounded-xl border border-border/50 overflow-hidden
    Padding innen: p-4 oder divide-y divide-border/50 für mehrzeilige Bereiche
```

#### D — Name-Feld (Inline-Edit)

```
Zustand: ANZEIGE
  Layout: flex items-center justify-between p-4
  Links: Label "Name" (text-sm text-muted-foreground) + aktueller Name (text-sm font-medium)
  Rechts: Button "Ändern" (variant="ghost" size="sm")

Zustand: BEARBEITUNGS-MODUS (nach Klick auf "Ändern")
  Smooth expand: max-h Transition von 0 → auto
  Input: rounded-xl border border-input focus:ring-2 focus:ring-primary
  Buttons: [Abbrechen (ghost)] [Speichern (primary gradient)]

Zustand: GESPEICHERT (Toast)
  Inline-Feedback: grüner Checkmark + "Gespeichert" erscheint für 2s neben dem Feld
```

#### E — E-Mail-Änderung (Expand-Panel)

```
Normaler Zustand:
  Layout: flex justify-between items-center p-4
  E-Mail angezeigt: text-sm font-medium (grau, nicht klickbar)
  Button: [E-Mail ändern] (variant="outline" size="sm")

Expandiert (Eingabe-Maske):
  Neues Feld mit Label "Neue E-Mail-Adresse"
  Input: wie Name-Feld
  Hinweis-Text: text-xs text-muted-foreground
    "Ein Bestätigungslink wird an die neue Adresse gesendet.
     Deine aktuelle E-Mail bleibt aktiv bis zur Bestätigung."
  Buttons: [Abbrechen] [Link senden →]

Ausstehend-Banner (wenn Token noch aktiv):
  Klassen: bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-xl p-3
  Icon: Clock-Icon text-blue-500
  Text: "Bestätigung ausstehend für neu@example.com"
  Sub: text-xs text-muted-foreground "Gesendet vor 5 Minuten · Link gültig für 23 Std."
  Button: [Abbrechen] (text-destructive, variant="ghost" size="sm")
```

#### F — Präferenz-Chips (Toggle-Chips statt Checkboxen)

```
Konzept: Jeder Allergen / Diät-Typ als klickbarer Chip
Layout: flex flex-wrap gap-2

Chip INAKTIV:
  Klassen: inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
           border border-border bg-muted/30 text-muted-foreground text-sm
           cursor-pointer hover:border-primary/50 hover:bg-muted/60 transition-colors

Chip AKTIV (Allergen):
  Klassen: inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
           border border-amber-300 bg-amber-100 text-amber-700 text-sm font-medium
           dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400
           cursor-pointer ring-2 ring-amber-200/50

Chip AKTIV (Diät):
  Klassen: identisch aber green statt amber
  border-green-300 bg-green-100 text-green-700

Optimistic Update:
  Sofortiger visueller Wechsel AKTIV ↔ INAKTIV beim Klick
  Async API-Call im Hintergrund
  Bei Fehler: Revert + roter Toast "Speichern fehlgeschlagen"

Chip-Inhalt:
  Emoji-Icon + Label (z.B. "🌾 Gluten", "🌱 Vegan")
  Aktiv: zusätzlich ✓-Icon rechts (w-3.5 h-3.5)
```

#### G — KI-Vorschläge Banner

```
Container: bg-amber-50 dark:bg-amber-950/20 border border-amber-200
           dark:border-amber-800 rounded-xl p-4 space-y-3

Header:
  Layout: flex items-center gap-2
  Icon: Bot-Icon (Lucide) w-4 h-4 text-amber-600
  Text: "Von der KI erkannt — bitte bestätigen"
        text-sm font-semibold text-amber-800 dark:text-amber-300
  Sub: text-xs text-amber-600/80 "Basierend auf deinen bisherigen Bestellungen"

Pro Vorschlag:
  Layout: flex items-center justify-between bg-white/60 dark:bg-amber-950/30
          rounded-lg px-3 py-2
  Links: Emoji + Label + Konfidenz-Badge (z.B. "87%" in grünem Pill)
  Rechts: [✓ Ja] [✗ Nein] (zwei kompakte Buttons)
    Bestätigen: bg-green-100 text-green-700 hover:bg-green-200 rounded-lg px-2.5 py-1 text-xs
    Ignorieren: bg-red-100 text-red-600 hover:bg-red-200 rounded-lg px-2.5 py-1 text-xs
    → Nach Klick: Chip verschwindet mit fade-out Animation (opacity-0 → entfernt nach 200ms)
```

#### H — Benachrichtigungs-Toggles

```
Pro Toggle-Zeile:
  Layout: flex items-center justify-between p-4
  Links:
    Icon: Mail/Bell (w-8 h-8, farbiger runder Hintergrund, passend zum Typ)
    Text-Stack:
      Titel: text-sm font-medium text-foreground
      Beschreibung: text-xs text-muted-foreground mt-0.5 (max 2 Zeilen)
  Rechts:
    Toggle-Switch (Custom, kein nativer Checkbox):
      ON: bg-primary rounded-full w-11 h-6 + weißer Kreis rechts
      OFF: bg-muted rounded-full w-11 h-6 + weißer Kreis links
      Transition: translate-x smooth 200ms

Status-Hinweis (Push deaktiviert):
  Klassen: mt-2 mx-4 p-2.5 rounded-lg bg-muted/50
  Text: text-xs text-muted-foreground mit Link-Icon
  Text: "Aktiviere Push um Bestellstatus-Updates sofort zu erhalten →"
```

#### I — Gefahrenzone (Konto löschen)

```
Wrapper: bg-red-50/50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/50
         rounded-xl p-4 mt-2

Header:
  Layout: flex items-center gap-2
  Icon: AlertTriangle w-4 h-4 text-red-500
  Text: "Gefahrenzone" — text-sm font-semibold text-red-700 dark:text-red-400

Inhalt (initial eingeklappt, per Klick erweiterbar):
  Titel: "Konto löschen"
  Beschreibung: text-sm text-muted-foreground

  Was gelöscht wird (Aufzählung mit ✗ Icons, text-red-600):
    ✗ Dein Name und E-Mail-Adresse
    ✗ Dein Profilbild
    ✗ Alle gespeicherten Präferenzen und Allergene
    ✗ Push-Benachrichtigungsabos

  Was erhalten bleibt (Aufzählung mit ✓ Icons, text-muted-foreground):
    ✓ Bestellhistorie (anonymisiert, für Buchhaltung)
    ✓ Wallet-Transaktionen (anonymisiert)

  Button: [Konto unwiderruflich löschen]
    variant="destructive" — voll rot, am unteren Rand
    Icon: Trash2 w-4 h-4

Bestätigungs-Dialog (Modal):
  Titel: "Bist du sicher?"
  Beschreibung: "Diese Aktion kann nicht rückgängig gemacht werden."
  Input: "Gib deine E-Mail zur Bestätigung ein"
    Placeholder: deine@email.de
  Buttons: [Abbrechen] [Endgültig löschen] (nur aktiv wenn E-Mail korrekt)
```

---

### Navigation — Navbar-Integration

```
Bestehender User-Bereich in der Navbar:
  Aktuell: [Avatar / Name] → Dropdown mit "Abmelden"

  Erweiterung: Dropdown ergänzen um "Mein Profil" Eintrag

  Dropdown-Struktur:
    ┌─────────────────────────────┐
    │  👤 Max Mustermann          │
    │  max@example.com            │
    ├─────────────────────────────┤
    │  👤  Mein Profil      →     │  ← NEU
    │  💰  Wallet           →     │
    ├─────────────────────────────┤
    │  🚪  Abmelden               │
    └─────────────────────────────┘

  Stil: User-Info-Block grau hinterlegt (bg-muted/50),
        Links mit hover:bg-accent, Trennlinien mit Separator
```

---

### Interaktions-Flows

#### Flow 1 — E-Mail-Änderung

```
[User klickt "E-Mail ändern"]
        ↓
[Inline-Formular expandiert mit slide-down Animation]
        ↓
[User gibt neue E-Mail ein, klickt "Link senden"]
        ↓
[Button zeigt Spinner "Sende..."]
        ↓
[Erfolg: Formular klappt zu, ausstehend-Banner erscheint mit fade-in]
        ↓ (User öffnet Posteingang, klickt Link)
[Bestätigungsseite /profil/email-bestaetigen]
        ↓
[Weiterleitung zurück zu /profil mit grünem Success-Toast]
"Deine E-Mail wurde erfolgreich geändert."
```

#### Flow 2 — Präferenz-Toggle (Optimistic UI)

```
[User klickt Chip "🌾 Gluten"]
        ↓
[Sofort: Chip wechselt visuell zu AKTIV (amber, ✓)]
[Im Hintergrund: API PATCH]
        ↓
Erfolg: kein weiteres Feedback nötig (Chip bleibt aktiv)
Fehler: Chip springt zurück zu INAKTIV + roter Toast unten
        "Speichern fehlgeschlagen. Bitte erneut versuchen."
```

#### Flow 3 — KI-Vorschlag bestätigen

```
[User klickt "✓ Ja" bei "🌱 Vegan (87%)"]
        ↓
[Bestätigungs-Animation: Chip wird grün mit fade-in Scale]
[KI-Vorschlag-Zeile verschwindet mit fade-out (200ms)]
[Im Bereich "Ernährungsweise": Diät-Chip "Vegan" wechselt sofort zu AKTIV]
        ↓
[Wenn alle KI-Vorschläge abgearbeitet: Banner verschwindet mit slide-up]
```

#### Flow 4 — Konto löschen

```
[User klickt "Konto unwiderruflich löschen"]
        ↓
[Modal öffnet sich mit scale-in Animation]
        ↓
[User tippt E-Mail ein]
[Button "Endgültig löschen" aktiviert sich erst wenn E-Mail stimmt]
        ↓
[Button zeigt Spinner "Lösche..."]
        ↓
[Session-Ende → Redirect zu /login]
[Login-Seite zeigt Toast: "Dein Konto wurde gelöscht."]
```

---

### Responsive Design

```
Mobile (< 640px sm):
  - Alle Cards: full-width, kein Grid
  - Mini-Dashboard: grid-cols-2 bleibt (kompakte Karten)
  - Präferenz-Chips: flex-wrap, kleinere Chips (text-xs)
  - Hero: Avatar 48px, kompaktere Abstände

Tablet/Desktop (≥ 640px):
  - Content-Max-Width: max-w-lg mx-auto (wie Login-Seite)
  - Alle Sektionen zentriert
  - Hero: Avatar 64px, mehr Weißraum
  - Sticky Navbar bleibt erhalten (bestehendes Layout)
```

---

### Animationen & Micro-Interactions

| Element | Animation | Dauer |
|---|---|---|
| Formular-Expand (Name, E-Mail) | `max-height` 0→auto + `opacity` 0→1 | 200ms ease-out |
| KI-Vorschlag entfernen | `opacity` 1→0 + `scale` 1→0.95 + `height` auto→0 | 200ms |
| Präferenz-Chip toggle | `background-color` + `border-color` cross-fade | 150ms |
| Toast-Benachrichtigung | Slide-in von unten (`translate-y` 100%→0) | 250ms spring |
| Konto-Lösch-Modal | `scale` 0.95→1 + `opacity` 0→1 | 200ms |
| Toggle-Switch Thumb | `translate-x` smooth | 200ms ease |
| Passwort-Link Feedback | Inline Text fade-in | 200ms |

---

### Accessibility

- Alle interaktiven Elemente haben `focus-visible:ring-2 focus-visible:ring-ring` Fokus-Indikator
- Präferenz-Chips haben `role="checkbox"` und `aria-checked` Attribut
- Toggle-Switches haben `role="switch"` und `aria-checked`
- Destructive-Modal hat `role="alertdialog"` mit `aria-labelledby` und `aria-describedby`
- Farbkodierung (amber/green/red) wird niemals als einziger Informationsträger eingesetzt (immer Icon + Farbe + Text)
- Mindest-Touch-Target für Chips: 40px Höhe auf Mobile
- Screenreader-freundliche Labels für alle Icon-Buttons (`aria-label`)

---

## Checklist (Requirements Engineer)

- [x] User Stories pro Sub-Feature definiert
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases dokumentiert (12 Cases)
- [x] Feature-ID vergeben (PROJ-23a–e)
- [x] Abhängigkeiten beschrieben (PROJ-6, PROJ-9, PROJ-10, PROJ-20)
- [x] Scope und Out-of-Scope klar abgegrenzt
- [ ] User Review: Spec lesen und freigeben
