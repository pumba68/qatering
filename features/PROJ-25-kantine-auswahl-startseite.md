# PROJ-25: Kantine-Auswahl als Startseite (Customer Entry Flow)

## Status: 🔵 Planned

## Übersicht

Kunden landen direkt auf einer öffentlich zugänglichen Kantine-Auswahl (`/`), die die bisherige Marketing-Landingpage ersetzt. Das Menü ist ohne Login lesbar; der Login-Prompt erscheint erst beim Versuch etwas in den Warenkorb zu legen.

---

## Abhängigkeiten

- Benötigt: PROJ-3 (Multi-Location Manager) – Locations-Datenmodell
- Benötigt: PROJ-6 (Wallet/Cart) – Warenkorb-Logik
- Tangiert: PROJ-2, PROJ-10 (Marketing-Komponenten auf Menü-Seite bleiben bestehen)

---

## User Stories

- Als **Besucher (nicht eingeloggt)** möchte ich auf der Startseite sofort alle verfügbaren Kantinen sehen, um die für mich passende Kantine auszuwählen.
- Als **Besucher** möchte ich bei nur einer verfügbaren Kantine automatisch zum Speiseplan weitergeleitet werden, ohne manuell klicken zu müssen.
- Als **Besucher** möchte ich den Speiseplan einer Kantine einsehen können, ohne mich einloggen zu müssen.
- Als **Besucher** möchte ich beim Versuch einen Artikel in den Warenkorb zu legen einen klaren Hinweis erhalten, dass ich mich einloggen oder registrieren muss.
- Als **eingeloggter Kunde** möchte ich beim Öffnen der App direkt zum Speiseplan meiner zuletzt gewählten Kantine weitergeleitet werden.
- Als **eingeloggter Kunde** möchte ich jederzeit die Kantine wechseln können, ohne zur Startseite zurückkehren zu müssen.
- Als **eingeloggter Kunde** möchte ich nach dem Login automatisch zur Kantine/Menü-Ansicht zurückgeleitet werden, die ich vor dem Login aufgerufen hatte.

---

## Acceptance Criteria

### Startseite (`/`)
- [ ] Die bisherige Landingpage (3-Karten-Layout) wird vollständig durch die Kantine-Auswahl ersetzt.
- [ ] Die Seite lädt alle aktiven Locations aus einem **öffentlichen API** (`GET /api/public/locations`) – kein Auth-Token erforderlich.
- [ ] Bei **genau einer** verfügbaren Kantine wird sofort (ohne User-Interaktion) zu `/menu?locationId={id}` weitergeleitet.
- [ ] Bei **mehr als einer** Kantine wird ein **Card Grid** angezeigt (je eine Karte pro Kantine).
- [ ] Jede Karte zeigt: Name der Kantine, (optional) Adresse/Untertitel, CTA-Button „Speiseplan ansehen".
- [ ] Klick auf eine Karten-CTA → Redirect zu `/menu?locationId={id}`, gleichzeitig wird die `locationId` in `localStorage` gespeichert (Key: `menu-selected-location-id`).
- [ ] **Eingeloggte User mit gespeicherter `locationId`** in localStorage → automatischer Redirect zu `/menu?locationId={stored}` (kein Umweg über das Card Grid).
- [ ] Das Card Grid ist responsiv: 1 Spalte auf Mobile, 2 auf Tablet, 3 auf Desktop.
- [ ] Ladestate zeigt Skeleton-Karten, kein leerer Bildschirm.
- [ ] Wenn keine Kantine verfügbar → freundliche Fehlermeldung „Derzeit sind keine Kantinen verfügbar."

### Öffentliche Locations API (`GET /api/public/locations`)
- [ ] Endpunkt ist ohne Session/Auth-Token aufrufbar.
- [ ] Gibt nur Locations zurück, bei denen `isActive = true`.
- [ ] Response enthält mindestens: `id`, `name`, (optional) `address` / `description`.
- [ ] Keine Mandanten-Filterung über Session – alle aktiven Locations werden zurückgegeben.
- [ ] Rate-Limiting oder Caching (mind. 60 s CDN-Cache / `Cache-Control: s-maxage=60`) um DB-Last zu begrenzen.

### Menü-Seite (`/menu`)
- [ ] `/menu` ist **ohne Login** zugänglich (Middleware-Schutz für `/menu` entfernen).
- [ ] `/menu` akzeptiert `?locationId={id}` als Query-Parameter und wählt den Standort damit vor.
- [ ] Falls kein `locationId`-Parameter und kein localStorage-Wert vorhanden → Redirect zu `/` (Kantine-Auswahl).
- [ ] Falls `locationId` ungültig (nicht in der Liste) → Redirect zu `/` (Kantine-Auswahl).
- [ ] Standort-Switcher (DropdownMenu bei mehreren Locations) bleibt erhalten, wird jetzt mit Daten aus `/api/public/locations` befüllt (nicht mehr das auth-gesperrte `/api/locations`).
- [ ] Ein „Kantine wechseln"-Link ist **immer sichtbar** (auch wenn nur eine Kantine) – bringt User zurück zu `/`.
- [ ] Marketing-Komponenten (`MarketingSlotArea`, `MarketingBannerArea`, `IncentiveCodesWidget`) bleiben unverändert, verhalten sich für nicht-eingeloggte User graceful (kein Crash, einfach nichts rendern).

### Auth-Gate (Warenkorb)
- [ ] Der Button „In den Warenkorb" ist für **nicht eingeloggte User** sichtbar aber geschützt.
- [ ] Klick auf „In den Warenkorb" ohne Session → Login-Modal **oder** Redirect zu `/login?callbackUrl=/menu?locationId={id}`.
- [ ] Nach erfolgreichem Login → Rückkehr zur Menü-Seite mit der vorherigen `locationId` (callbackUrl).
- [ ] Eingeloggte User können den Warenkorb wie bisher nutzen.

### Dashboard (`/dashboard`)
- [ ] Die Route `/dashboard/page.tsx` wird entfernt oder auf `/menu` umgeleitet.
- [ ] Interne Links, die auf `/dashboard` zeigen, werden auf `/menu` aktualisiert.
- [ ] Die `AppSidebar`-Komponente (falls noch referenziert) behält ihre Verlinkungen, aber der Dashboard-Einstieg entfällt.

---

## Edge Cases

- **localStorage nicht verfügbar** (z. B. Safari Privacy Mode): Fallback auf Kantine-Auswahl, keine Fehlermeldung.
- **Gespeicherte `locationId` nicht mehr aktiv** (Kantine deaktiviert): Redirect zu `/`, gespeicherter Wert wird aus localStorage gelöscht.
- **User wechselt Kantine** (über Dropdown im Menü): Neuer `locationId` wird in localStorage gespeichert, Warenkorb wird geleert (bestehende Logik bleibt).
- **Direktlink** zu `/menu?locationId=xxx` ohne localStorage-Eintrag: Location wird akzeptiert und gespeichert – kein Redirect zur Auswahl.
- **Nur eine Kantine + eingeloggter User ohne localStorage**: Auto-Redirect zu dieser einen Kantine.
- **0 Kantinen verfügbar**: Startseite zeigt Hinweis, kein Absturz.
- **Viele Kantinen (>12)**: Card Grid muss scrollbar bleiben, kein Pagination-Zwang für MVP (optional: Suchfeld als Follow-up).
- **Marketing-Komponenten ohne Session**: Graceful degradation – keine Fehler, einfach nichts anzeigen.
- **Middleware**: Sicherstellen, dass nach Entfernung des `/menu`-Schutzes alle anderen geschützten Routen (`/kitchen`, `/admin`, `/wallet`, `/order`, `/profil`) weiterhin geschützt bleiben.

---

## Technische Anforderungen

- **Neue API Route**: `app/api/public/locations/route.ts` – öffentlich, kein Auth-Check
- **Middleware anpassen**: `/menu` aus dem `matcher` entfernen
- **`/` page.tsx**: Umbau von Landingpage zur Location-Picker-Seite (Client Component für localStorage + Redirect)
- **`/menu` page.tsx**: Query-Param `locationId` auswerten, Locations von `/api/public/locations` laden
- **`/dashboard` page.tsx**: Entfernen oder `redirect('/menu')` eintragen
- **Performance**: `/api/public/locations` mit `Cache-Control: s-maxage=60, stale-while-revalidate=300`
- **Kein Breaking Change** für Admin- und Kitchen-Routen

---

## Out of Scope (für dieses Feature)

- Suche/Filterung nach Kantinen (Follow-up wenn >12 Kantinen)
- Karten-/Geolocation-Integration
- Persönliche Kantine-Favoriten
- Kantine-Detail-Seite (Öffnungszeiten, Fotos)

---

## UI-Skizze Startseite (Card Grid)

```
┌─────────────────────────────────────────────────────────────┐
│  🍽️  Wähle deine Kantine                                    │
│  Tippe auf eine Kantine um den Speiseplan zu sehen           │
├──────────────────┬──────────────────┬────────────────────────┤
│ 🏢 Kantine Nord  │ 🏢 Kantine Süd   │ 🏢 Kantine Zentral     │
│ Musterstr. 1     │ Bahnhofstr. 5    │ Werkstr. 3             │
│ [Speiseplan →]   │ [Speiseplan →]   │ [Speiseplan →]         │
├──────────────────┴──────────────────┴────────────────────────┤
│ (weitere Karten, responsive 1/2/3 Spalten)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Betroffene Dateien (voraussichtlich)

| Datei | Änderung |
|---|---|
| `app/page.tsx` | Komplett neu: Location-Picker (Client Component) |
| `app/dashboard/page.tsx` | Entfernen oder redirect |
| `app/menu/page.tsx` | `locationId` via Query-Param, Public API, Auth-Gate |
| `app/api/public/locations/route.ts` | Neu erstellen |
| `app/api/locations/route.ts` | Bleibt (für eingeloggte User / internes Switchen) |
| `middleware.ts` | `/menu` aus matcher entfernen |

---

## Git Commit Convention

```bash
git commit -m "feat(PROJ-25): Customer entry flow - public location picker as homepage"
```
