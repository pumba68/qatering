# PROJ-27: Location Mitarbeiter-Zuweisung mit Standort-Rolle

## Status: 🔵 Planned

## Übersicht

Auf der Location Detail-Seite (PROJ-26) kann ein Admin Mitarbeiter/User direkt einem Standort zuweisen und ihnen dabei eine **Standort-Rolle** (Küchenpersonal oder Standort-Admin) vergeben. Das bestehende `UserLocation`-Modell wird um ein `role`-Feld erweitert. Die Suche erfolgt über ein durchsuchbares Dropdown aller Nutzer der Organisation.

---

## Abhängigkeiten

- Benötigt: PROJ-26 (Location Detail-Seite) – stellt die Detail-Seite bereit, in die die Mitarbeiter-Sektion eingebettet wird
- Benötigt: PROJ-3 (Multi-Location Manager) – UserLocation-Modell

---

## User Stories

- Als **Admin** möchte ich auf der Location Detail-Seite alle aktuell zugewiesenen Mitarbeiter sehen, damit ich jederzeit weiß, wer Zugriff auf welchen Standort hat.
- Als **Admin** möchte ich einen Mitarbeiter über ein durchsuchbares Dropdown (Name/E-Mail) zu einem Standort hinzufügen, damit ich nicht durch eine lange Liste scrollen muss.
- Als **Admin** möchte ich beim Hinzufügen die Standort-Rolle festlegen (Küche oder Standort-Admin), damit die Rechte direkt korrekt gesetzt werden.
- Als **Admin** möchte ich eine bestehende Standort-Rolle eines Mitarbeiters direkt in der Liste ändern können, ohne ihn entfernen und neu hinzuzufügen.
- Als **Admin** möchte ich einen Mitarbeiter von einem Standort entfernen können, ohne seinen Account zu löschen.
- Als **KITCHEN_STAFF**-Mitarbeiter möchte ich nur die Standorte sehen und bedienen können, denen ich explizit zugewiesen wurde.

---

## Acceptance Criteria

### Mitarbeiter-Sektion auf der Location Detail-Seite

- [ ] Die Sektion "Mitarbeiter" zeigt eine Liste aller aktuell dem Standort zugewiesenen User.
- [ ] Pro User-Zeile: Avatar/Initialen, Name, E-Mail, Standort-Rolle (Badge), Aktions-Buttons (Rolle ändern, Entfernen).
- [ ] Ladestate: Skeleton während Nutzer geladen werden.
- [ ] Empty State: "Noch keine Mitarbeiter zugewiesen" mit CTA "Mitarbeiter hinzufügen".

### Mitarbeiter hinzufügen

- [ ] Button "Mitarbeiter hinzufügen" öffnet ein Inline-Formular oder ein kleines Dialog/Dropdown darunter.
- [ ] Das Formular enthält: searchable Dropdown aller Nutzer der Organisation (gefiltert nach Name/E-Mail-Input) + Rollen-Select (Küche | Standort-Admin).
- [ ] Nutzer die bereits diesem Standort zugewiesen sind werden im Dropdown deaktiviert/ausgeblendet.
- [ ] Speichern: `POST /api/admin/locations/[id]/users` mit `{ userId, role }`.
- [ ] Nach Speichern: Formular schließt, Liste wird aktualisiert.

### Standort-Rolle ändern

- [ ] In der Nutzer-Zeile kann die Rolle direkt per Dropdown-Select geändert werden.
- [ ] Änderung wird sofort (on-change) oder per kleinem "Speichern"-Icon gespeichert via `PUT /api/admin/locations/[id]/users/[userId]`.
- [ ] Erfolg/Fehler wird inline angezeigt.

### Mitarbeiter entfernen

- [ ] "Entfernen"-Button in jeder Nutzer-Zeile mit Bestätigungs-Dialog ("Möchtest du [Name] vom Standort [Name] entfernen?").
- [ ] Löscht den `UserLocation`-Eintrag via `DELETE /api/admin/locations/[id]/users/[userId]`.
- [ ] Nach Löschen: Liste wird sofort aktualisiert (optimistic update oder Re-fetch).

### Searchable Dropdown (Nutzer-Suche)

- [ ] Das Dropdown lädt alle Nutzer der Organisation (GET /api/admin/users).
- [ ] Tippen filtert die Liste nach Name **und** E-Mail (case-insensitive, partial match).
- [ ] Zeigt: Initialen-Avatar + Name + E-Mail + globale Rolle-Badge (KITCHEN_STAFF, ADMIN etc.) in jeder Option.
- [ ] Bereits zugewiesene Nutzer sind sichtbar aber nicht auswählbar (disabled + "Bereits zugewiesen"-Label).
- [ ] Maximal 50 Einträge ohne Paginierung für MVP (Hinweis wenn mehr vorhanden).

### Datenbankänderung: UserLocation + role

- [ ] Das `UserLocation`-Modell erhält ein neues Feld `role` vom Typ `LocationRole` (KITCHEN_STAFF | LOCATION_ADMIN).
- [ ] Default: `KITCHEN_STAFF` (sicherste Standardzuweisung).
- [ ] Prisma-Migration: `prisma migrate dev` – bestehende UserLocation-Einträge bekommen den Default-Wert.
- [ ] Das neue Enum `LocationRole` wird in `schema.prisma` definiert.

---

## Edge Cases

- **Letzter Admin entfernt sich selbst**: Erlaubt – kein Schutz im MVP (Admin kann sich selbst entfernen).
- **Nutzer nicht in der Organisation**: Nur Nutzer mit gleichem `organizationId` werden im Dropdown angezeigt.
- **Nutzer bereits zugewiesen**: Dropdown-Option disabled + "Bereits zugewiesen" – kein doppelter INSERT.
- **Nutzer wird gelöscht während er zugewiesen ist**: `ON DELETE CASCADE` am UserLocation-Modell sorgt für automatische Bereinigung.
- **Standort hat keine Nutzer**: Empty State mit CTA anzeigen.
- **Sehr viele Nutzer (>50)**: Hinweis "Mehr als 50 Nutzer gefunden – verfeinere die Suche" wird angezeigt; keine vollständige Paginierung für MVP.
- **Netzwerkfehler beim Entfernen**: Fehlertoast; UserLocation bleibt bestehen; Button wird re-enabled.
- **Gleichzeitiger Rollenänderungs-Konflikt**: Last-write-wins (kein Optimistic Locking für MVP).

---

## Technische Anforderungen

### Schema-Änderungen (Prisma)

```prisma
enum LocationRole {
  KITCHEN_STAFF
  LOCATION_ADMIN
}

model UserLocation {
  id         String       @id @default(cuid())
  userId     String
  locationId String
  role       LocationRole @default(KITCHEN_STAFF)  // NEU
  createdAt  DateTime     @default(now())

  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  location   Location     @relation(fields: [locationId], references: [id], onDelete: Cascade)

  @@unique([userId, locationId])
  @@map("user_locations")
}
```

### Neue API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/admin/locations/[id]/users` | Liste aller zugewiesenen User mit Rolle |
| `POST` | `/api/admin/locations/[id]/users` | User hinzufügen `{ userId, role }` |
| `PUT` | `/api/admin/locations/[id]/users/[userId]` | Rolle ändern `{ role }` |
| `DELETE` | `/api/admin/locations/[id]/users/[userId]` | User entfernen |

### Bestehende API erweitern

- `GET /api/admin/users` – muss `organizationId`-gefilterte Nutzer zurückgeben (prüfen ob vorhanden oder anlegen).

---

## Betroffene Dateien (voraussichtlich)

| Datei | Änderung |
|---|---|
| `prisma/schema.prisma` | Neues Enum `LocationRole`, Feld `role` an `UserLocation` |
| `app/admin/locations/[id]/page.tsx` | Mitarbeiter-Sektion ergänzen (PROJ-26-Seite erweitern) |
| `app/api/admin/locations/[id]/users/route.ts` | NEU – GET + POST |
| `app/api/admin/locations/[id]/users/[userId]/route.ts` | NEU – PUT + DELETE |
| `app/api/admin/users/route.ts` | Prüfen / Org-Filter ergänzen |

---

## Out of Scope

- Granularere Permissions (z. B. "darf nur Bestellungen sehen, nicht bearbeiten")
- Einladungs-E-Mail beim Hinzufügen
- Selbst-Registrierung eines Mitarbeiters an einem Standort
- Zeitlich begrenzte Zuweisungen (Vertretungsregelungen)

---

## Git Commit Convention

```bash
git commit -m "feat(PROJ-27): Location staff assignment with location-level roles"
```
