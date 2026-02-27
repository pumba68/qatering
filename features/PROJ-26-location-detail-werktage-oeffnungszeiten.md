# PROJ-26: Location Detail-Seite – Werktage & Öffnungszeiten

## Status: 🔵 Planned

## Übersicht

Der bisherige Location-Sheet (Name, Adresse, Telefon, E-Mail) wird durch eine vollwertige **Detail-Seite pro Standort** (`/admin/locations/[id]`) ersetzt. Diese Seite enthält neben den Stammdaten auch individuelle Werktage mit Öffnungszeiten **pro Wochentag**. Die generische "Einstellungen → Werktage"-Seite wird damit obsolet und entfernt.

---

## Abhängigkeiten

- Benötigt: PROJ-3 (Multi-Location Manager) – bestehende Location-CRUD-API
- Wird erweitert durch: PROJ-27 (Mitarbeiter-Zuweisung) – die Detail-Seite nimmt einen weiteren Tab auf

---

## User Stories

- Als **Admin** möchte ich auf einer eigenen Seite pro Standort alle Details sehen und bearbeiten, um eine übersichtlichere Pflege zu haben als im kleinen Slide-Out-Sheet.
- Als **Admin** möchte ich pro Wochentag individuell festlegen, ob ein Tag aktiv ist und welche Öffnungszeiten (Von–Bis) gelten, damit z. B. Mittwoch kürzere Zeiten hat als Montag.
- Als **Admin** möchte ich auf der Standortliste einen direkten Link zur Detail-Seite haben, anstatt den Sheet öffnen zu müssen.
- Als **Admin** möchte ich, dass die Werktag-Konfiguration beim Speichern sofort im System aktiv ist, damit der Menüplaner und Bestellprozess die korrekten Tage anzeigen.
- Als **Admin** möchte ich den alten "Einstellungen → Werktage"-Bereich nicht mehr vorfinden, da die Konfiguration jetzt direkt am Standort liegt.

---

## Acceptance Criteria

### Neue Detail-Seite (`/admin/locations/[id]`)

- [ ] Die Route `/admin/locations/[id]` existiert und ist für ADMIN/SUPER_ADMIN zugänglich.
- [ ] Auf der Standortliste (`/admin/locations`) führt der "Bearbeiten"-Button zur Detail-Seite statt zum Sheet.
- [ ] Die Detail-Seite hat **drei klar getrennte Sektionen** (keine Tabs, untereinander gezeigt oder als Cards): **Stammdaten**, **Werktage & Öffnungszeiten**, **Mitarbeiter** (Mitarbeiter-Sektion ist Platzhalter, wird mit PROJ-27 befüllt).
- [ ] Die Seite zeigt den Standort-Namen als Seitenüberschrift + Breadcrumb zurück zur Liste.
- [ ] Jede Sektion hat einen eigenen Speichern-Button (nicht: ein globaler Button für alles).
- [ ] Ladestate: Skeleton während der Datensatz geladen wird.
- [ ] Fehlerstate: Klare Fehlermeldung wenn Standort nicht gefunden (z. B. 404).

### Stammdaten-Sektion (Migration aus Sheet)

- [ ] Felder: Name (Pflicht), Adresse, Telefon, E-Mail, Aktiv-Toggle.
- [ ] Validierung: Name darf nicht leer sein; E-Mail muss gültiges Format haben.
- [ ] Speichern aktualisiert die bestehenden Location-Felder via `PUT /api/admin/locations/[id]`.

### Werktage & Öffnungszeiten-Sektion

- [ ] Darstellung: 7 Zeilen, eine pro Wochentag (Mo–So), analog zu den Wochentagen 0–6.
- [ ] Jede Zeile zeigt: Toggle (aktiv/inaktiv) + Wochentag-Label + Von-Zeitfeld + Bis-Zeitfeld.
- [ ] Von/Bis-Felder sind `<input type="time">` im Format HH:MM.
- [ ] Von/Bis-Felder sind ausgegraut/disabled wenn der Tag inaktiv (Toggle aus) ist.
- [ ] Beim Aktivieren eines Tags werden Von/Bis auf einen sinnvollen Default befüllt (z. B. 11:00–14:00).
- [ ] Validierung: Bis muss nach Von liegen – wenn nicht, wird Speichern blockiert mit Fehlermeldung.
- [ ] Speichern schreibt `workingDays: number[]` (nur aktive Tage) **und** `openingHours: { "1": { from: "11:00", to: "14:00" }, ... }` ins Location-Modell via `PUT /api/admin/locations/[id]`.
- [ ] Beim Laden der Seite werden die gespeicherten Werte korrekt angezeigt (aktive Tage + Zeiten).
- [ ] Für aktive Tage ohne gespeicherte Zeiten (Migrationsszenario) wird der Default-Wert 11:00–14:00 angezeigt.

### Settings-Seite Migration

- [ ] Der "Einstellungen → Werktage"-Abschnitt auf `/admin/settings` wird entfernt.
- [ ] Falls `/admin/settings` danach leer ist: Seite zeigt einen Hinweis "Werktage werden jetzt direkt am Standort gepflegt" mit Link zur Standort-Liste.
- [ ] Existierende `workingDays`-Daten aus dem Location-Modell bleiben vollständig erhalten (kein Datenverlust).

---

## Edge Cases

- **Keine Öffnungszeiten gespeichert** (openingHours = null): Aktive Tage werden mit Default 11:00–14:00 angezeigt.
- **Alle Tage deaktiviert**: Erlaubt – Standort kann inaktive Perioden haben; Speichern möglich, `workingDays: []`.
- **Von = Bis** (z. B. beide 12:00): Validierungsfehler "Endzeit muss nach Startzeit liegen".
- **Mitternacht-übergreifende Zeiten** (z. B. 22:00–02:00): Out of Scope für MVP – wird als Validierungsfehler abgewiesen ("Endzeit muss am selben Tag liegen").
- **Standort-ID nicht gefunden**: 404-Fehlermeldung + Button zurück zur Liste.
- **Nicht autorisiert**: Nur ADMIN/SUPER_ADMIN – andere Rollen werden auf `/unauthorized` geleitet.
- **Gleichzeitiges Speichern** beider Sektionen: Beide Speichern-Buttons deaktiviert während jeweils aktiv gespeichert wird.
- **Browser-Zurück-Button**: Änderungen ohne Speichern gehen verloren – kein Warn-Dialog für MVP.

---

## Technische Anforderungen

- **Neue Route**: `app/admin/locations/[id]/page.tsx`
- **API-Erweiterung**: `PUT /api/admin/locations/[id]` muss `workingDays` + `openingHours` akzeptieren (prüfen ob bereits vorhanden)
- **`openingHours` Datenformat** im JSON-Feld:
  ```json
  {
    "1": { "from": "11:00", "to": "14:00" },
    "2": { "from": "11:00", "to": "14:00" },
    "5": { "from": "11:00", "to": "13:00" }
  }
  ```
  Key = Wochentag-Nummer (0=So, 1=Mo, …, 6=Sa), nur aktive Tage enthalten.
- **DB-Migration**: Kein Schema-Change nötig – `openingHours Json?` und `workingDays Int[]` existieren bereits.
- **`GET /api/admin/locations/[id]`**: Falls noch nicht vorhanden, anlegen. Muss `openingHours` + `workingDays` zurückgeben.
- **Settings-API** (`/api/admin/settings`): Nach Migration kann der `workingDays`-Handler dort entfernt werden.

---

## Betroffene Dateien (voraussichtlich)

| Datei | Änderung |
|---|---|
| `app/admin/locations/[id]/page.tsx` | NEU – Detail-Seite |
| `app/admin/locations/page.tsx` | "Bearbeiten"-Button → Link statt Sheet |
| `app/admin/settings/page.tsx` | Werktage-Sektion entfernen |
| `app/api/admin/locations/[id]/route.ts` | PUT um workingDays + openingHours erweitern; GET prüfen |

---

## Out of Scope

- Mitternacht-übergreifende Öffnungszeiten
- Pausenzeiten / mehrere Zeitslots pro Tag
- Öffentliche Anzeige der Öffnungszeiten auf der Menü-Seite (Follow-up)
- Feiertags-Ausnahmen

---

## Git Commit Convention

```bash
git commit -m "feat(PROJ-26): Location detail page with per-day working hours"
```
