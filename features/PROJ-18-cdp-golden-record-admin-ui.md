# PROJ-18: CDP – Golden Record & Admin-Kundenprofil

## Status: 🟡 In Progress

## Kontext & Ziel
Einführung eines zentralen Kundenprofils (Golden Record) als Single Source of Truth für jeden Gast/Mitarbeiter. Ein neuer Admin-Bereich `/admin/kunden` bietet Standort- und Kantinenleitungen eine vollständige interne Sicht auf jeden Kunden: Stammdaten, Org-Zuordnung, Identifikatoren, Wallet-Balance und direkte Verlinkung zur Bestellhistorie.

Dieses Feature bildet die **Datenmodell-Grundlage** für alle weiteren CDP-Features (PROJ-19, PROJ-20, PROJ-21).

## Abhängigkeiten
- Benötigt: PROJ-6 (Wallet/Guthaben) – bestehende `walletBalance`-Daten werden eingebunden
- Benötigt: PROJ-3 (Multi-Location) – Org/Standort-Zuordnung wird genutzt
- Erweitert durch: PROJ-19 (Bestellhistorie), PROJ-20 (Präferenzen), PROJ-21 (Abgeleitete Merkmale)

---

## User Stories

- Als **Kantinen-/Standortleitung** möchte ich eine Liste aller Kunden meines Standorts sehen, um einen schnellen Überblick über die Nutzerbasis zu haben.
- Als **Service & Support** möchte ich einen Kunden per Name, E-Mail oder Mitarbeiter-ID suchen, um sein Profil sofort aufzurufen und Fragen zu beantworten.
- Als **Kantinen-/Standortleitung** möchte ich im Kundenprofil alle hinterlegten Identifikatoren (App-ID, Badge, Mitarbeiter-ID) sehen, um mehrfach registrierte Nutzer zu erkennen und zu verknüpfen.
- Als **Systemadministration** möchte ich Kundenprofile verschiedenen Organisationen und Standorten zuordnen können, um Mandantentrennung sicherzustellen.
- Als **Service & Support** möchte ich im Profil sehen, welche Zuschüsse und Berechtigungen ein Kunde von seiner Organisation erhält, um korrekte Informationen geben zu können.
- Als **Datenschutz / Compliance** möchte ich anonyme Profile kennzeichnen und später mit realen Profilen verknüpfen können, um datenschutzkonforme Workflows zu unterstützen.

---

## Acceptance Criteria

### Kundenliste `/admin/kunden`
- [ ] Die Seite zeigt eine paginierte Tabelle aller Kunden der Admin-Organisation/des gewählten Standorts
- [ ] Spalten: Name, E-Mail, Org/Standort, Wallet-Balance, Aktivitätsstatus (Pill: Aktiv/Inaktiv/Anonym), Registrierungsdatum
- [ ] Echtzeit-Suche (Debounce 300ms) nach Name, E-Mail und Mitarbeiter-ID
- [ ] Filter nach: Standort, Aktivitätsstatus, Org-Zugehörigkeit
- [ ] Sortierung nach: Name (A–Z), Wallet-Balance (↑↓), Registrierungsdatum (↑↓)
- [ ] Klick auf eine Zeile öffnet den Profil-Drawer (kein Seitennavigation)
- [ ] Pagination: 25 Einträge pro Seite, Gesamtzahl sichtbar

### Kundenprofil-Drawer
- [ ] Drawer öffnet sich rechts, Hintergrund bleibt navigierbar
- [ ] **Header-Bereich:** Avatar-Initials, Name, E-Mail, Registrierungsdatum, Kunde-seit-Dauer
- [ ] **Identifikatoren-Sektion:** Interne Customer-ID (stabil, nie änderbar), App-ID(s), Badge-ID(s), Mitarbeiter-ID(s) — alle als Read-only Chips
- [ ] **Org & Standort:** Anzeige der zugeordneten Organisation(en) und Standorte, ggf. Hauptstandort hervorgehoben
- [ ] **Zuschüsse & Berechtigungen:** Anzeige aktiver Org-Zuschüsse des Kunden (z. B. „Essenszuschuss: 3,50 €/Tag")
- [ ] **Wallet:** Aktuelles Guthaben, direkte Verlinkung zu „Aufladen" (öffnet `/admin/wallet?userId=...`)
- [ ] **Tabs im Drawer:** Übersicht | Bestellhistorie (→ PROJ-19) | Präferenzen (→ PROJ-20) | Merkmale (→ PROJ-21)
- [ ] Anonyme Profile zeigen ein deutliches „Anonym"-Badge; PII-Felder werden als `[anonymisiert]` dargestellt

### Golden Record (Datenmodell)
- [ ] Jeder Kunde hat genau eine stabile `customerId` (intern, unveränderlich, CUID)
- [ ] Pro Kunde können mehrere Identifikatoren gespeichert werden (Typ + Wert + Quelle)
- [ ] Identifikator-Typen: `APP_ID`, `EMPLOYEE_ID`, `BADGE_ID`, `DEVICE_ID`, `EXTERNAL_ID`
- [ ] Jede Identifikator-Änderung wird historisiert (Timestamp + Aktion: added/removed)
- [ ] Anonyme Profile sind als `isAnonymous: true` markiert und können mit realen Profilen gemergt werden
- [ ] Kunden sind einer oder mehreren Organisationen zugeordnet (über bestehendes `organizationId`)
- [ ] Innerhalb einer Org kann ein Kunde einem oder mehreren Standorten zugeordnet sein

---

## Edge Cases

- **Mehrfach-Registrierung:** Gleiche E-Mail existiert bereits → System verhindert Duplikat bei Neuanlage; bestehende doppelte Einträge werden über Identifikator-Merge zusammengeführt
- **Anonymes Profil → Merge:** Wenn ein anonymes Profil nachträglich mit einer echten User-ID verknüpft wird, werden alle historischen Transaktionen und Identifikatoren übertragen; Original-Anonym-Eintrag wird als `merged_into` markiert und ist nicht mehr aktiv sichtbar
- **Kein Standort zugeordnet:** Kunde ist in der Org registriert, aber keinem Standort zugewiesen → erscheint in Standort-Filter unter „Kein Standort", ist aber in der Gesamt-Org-Ansicht sichtbar
- **Fehlende Identifikatoren:** Kunden ohne Badge/Mitarbeiter-ID → Identifikator-Sektion zeigt „Keine weiteren Identifikatoren hinterlegt"
- **Org-Zuschuss abgelaufen:** Abgelaufene Zuschüsse erscheinen als inaktiv (graue Pill), aber bleiben historisch sichtbar
- **Sehr viele Identifikatoren:** Liste wird nach max. 5 Einträgen kollabiert mit „+ N weitere anzeigen"

---

## Technische Anforderungen

- Performance: Kundenliste muss in < 500 ms laden (NFR-04)
- Mandantenfähigkeit: Admins sehen ausschließlich Kunden ihrer Organisation (NFR-03)
- Neue DB-Tabelle `CustomerIdentifier` für Mehrfach-Identifikatoren
- Bestehende `User`-Tabelle wird um `customerId`, `isAnonymous`, `mergedIntoId` erweitert
- API-Endpunkte: `GET /api/admin/kunden`, `GET /api/admin/kunden/[id]`
- Suchindex auf: `email`, `name`, `customerId`, `CustomerIdentifier.value`

---

## Out of Scope (→ spätere PROJ)
- Feedback & Servicefälle (Reklamationen, No-Shows) → Later
- DSGVO Lösch-/Anonymisierungs-Workflow (eigenes Feature)
- Audit-Log für Profilzugriffe → Later

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

| Was existiert bereits | Wo | Relevanz für PROJ-18 |
|---|---|---|
| `Sheet`-Komponente (shadcn/ui) | `components/ui/sheet.tsx` | Wird als Profil-Drawer wiederverwendet |
| `/admin/users` Seite (Nutzer-Verwaltung) | `app/admin/users/page.tsx` | Existiert als separate Admin-Seite (Chakra UI); `/admin/kunden` wird neu und modern (shadcn/ui) |
| `User`-Tabelle in DB | `prisma/schema.prisma` | Wird um 3 Felder erweitert (`customerId`, `isAnonymous`, `mergedIntoId`) |
| `Location`-Tabelle | `prisma/schema.prisma` | Wird für Standort-Zuordnung und Filterung referenziert |
| `Organization`-Tabelle | `prisma/schema.prisma` | Mandantentrennung basiert auf bestehender `organizationId` |
| Wallet-Balance auf `User` | `walletBalance`-Feld | Wird im Drawer direkt angezeigt |
| Admin-Navigation (AppSidebar) | `components/admin/AppSidebar.tsx` | Neuer Menü-Eintrag „Kunden" wird unter Verwaltung eingefügt |
| Standort-Kontext (LocationContext) | `components/admin/LocationContext.tsx` | Wird für Standort-Filter der Kundenliste genutzt |

---

### Component-Struktur

```
/admin/kunden (Neue Seite)
├── Seiten-Header (Titel, Anzahl Kunden, Refresh-Button)
├── Filter-Leiste
│   ├── Suchfeld (Name / E-Mail / Mitarbeiter-ID, Debounce 300ms)
│   ├── Standort-Dropdown (aus bestehendem LocationContext)
│   ├── Aktivitätsstatus-Filter (Alle / Neu / Aktiv / Gelegentlich / Schlafend / Abgewandert)
│   └── Sortierung-Dropdown (Name A–Z / Wallet ↑↓ / Registriert ↑↓)
├── Kundentabelle
│   ├── Spalten: Avatar-Initials | Name + E-Mail | Standort | Wallet | Aktivitätsstatus-Pill | Seit
│   ├── Zeile klickbar → öffnet Profil-Drawer
│   └── Pagination (25/Seite, Gesamtzahl)
└── Kundenprofil-Drawer (Sheet, rechts, 600px breit)
    ├── Drawer-Header
    │   ├── Avatar-Initials (groß)
    │   ├── Name + E-Mail
    │   ├── „Anonym"-Badge (falls isAnonymous)
    │   └── Kunde-seit (Registrierungsdatum)
    ├── Tab-Navigation
    │   ├── Tab „Übersicht" (dieses Feature)
    │   ├── Tab „Bestellhistorie" (→ PROJ-19, zunächst Platzhalter)
    │   ├── Tab „Präferenzen" (→ PROJ-20, zunächst Platzhalter)
    │   └── Tab „Merkmale" (→ PROJ-21, zunächst Platzhalter)
    └── Tab-Inhalt „Übersicht"
        ├── Identifikatoren-Sektion
        │   ├── Customer-ID (Read-only Chip, immer sichtbar)
        │   ├── Mitarbeiter-ID(s), Badge-ID(s), App-ID(s) als Chips
        │   └── „+ N weitere" Kollaps-Button (ab 6 Einträgen)
        ├── Org & Standort-Sektion
        │   ├── Organisation (Name)
        │   └── Zugeordnete Standorte (als Chips)
        ├── Zuschüsse & Berechtigungen-Sektion
        │   └── Aktive Org-Zuschüsse (grüne Pill), inaktive (graue Pill)
        └── Wallet-Sektion
            ├── Aktuelles Guthaben (groß)
            └── Button „Aufladen" → Link zu /admin/wallet?userId=...
```

---

### Daten-Model

**Erweiterung der bestehenden `User`-Tabelle:**

Die `User`-Tabelle erhält 3 neue Felder:
- `customerId` — stabile interne Kunden-ID (CUID, einmalig vergeben, nie änderbar)
- `isAnonymous` — Kennzeichnung anonymer Profile (Standard: false)
- `mergedIntoId` — Verweis auf das Zielprofil bei einem Merge (null = aktives Profil)

**Neue Tabelle `CustomerIdentifier`:**

Speichert alle zusätzlichen Identifikatoren eines Kunden (mehrere pro Kunde möglich):

| Feld | Was es speichert |
|---|---|
| `id` | Eindeutige ID dieses Identifikators |
| `userId` | Verweis auf den Kunden (User-Tabelle) |
| `type` | Art des Identifikators: `APP_ID`, `EMPLOYEE_ID`, `BADGE_ID`, `DEVICE_ID`, `EXTERNAL_ID` |
| `value` | Der eigentliche Wert (z. B. „EMP-12345") |
| `source` | Woher der Identifier kommt (z. B. „HR-System", „Badge-Scanner") |
| `isActive` | Ob dieser Identifier aktuell gültig ist |
| `addedAt` | Wann er hinzugefügt wurde |
| `removedAt` | Wann er entfernt wurde (null = noch aktiv) |

**Keine neue Tabelle für Zuschüsse nötig** — diese werden aus dem bestehenden `EmployerCompany`-System gelesen.

---

### API-Endpunkte

| Methode | Pfad | Was er tut |
|---|---|---|
| `GET` | `/api/admin/kunden` | Paginierte Kundenliste mit Suche, Filter, Sortierung |
| `GET` | `/api/admin/kunden/[id]` | Vollständiges Profil eines Kunden (Identifikatoren, Org, Wallet, Zuschüsse) |
| `POST` | `/api/admin/kunden/[id]/identifiers` | Neuen Identifikator hinzufügen |
| `DELETE` | `/api/admin/kunden/[id]/identifiers/[iid]` | Identifikator deaktivieren (soft delete) |

---

### Tech-Entscheidungen

**Warum neues `/admin/kunden` statt Erweiterung von `/admin/users`?**
→ `/admin/users` ist für technische Nutzer-Verwaltung (Rollen, Passwörter). `/admin/kunden` ist eine operative Sicht für Kantinenleitungen. Andere Zielgruppe, anderer Scope. Beide Seiten koexistieren.

**Warum `Sheet` (shadcn/ui) statt Modal für den Drawer?**
→ `Sheet`-Komponente existiert bereits im Codebase. Rechts-Drawer ist das richtige UX-Pattern für Detail-Ansichten in Listen — der Admin kann gleichzeitig die Liste im Hintergrund sehen. Kein zusätzliches Package nötig.

**Warum separate `CustomerIdentifier`-Tabelle statt JSON auf `User`?**
→ Einzelne Identifikatoren müssen durchsucht, historisiert und deaktiviert werden. JSON-Felder erlauben keine DB-Indizes für schnelle Suche nach Badge-ID oder Mitarbeiter-ID. Separate Tabelle mit Index auf `value` ist die korrekte Lösung.

**Warum `customerId` zusätzlich zur bestehenden `id` auf `User`?**
→ `User.id` ist die technische Auth-ID (Next-Auth nutzt sie). `customerId` ist die stabile, fachliche Kunden-ID, die auch bei Account-Merge oder technischer Migration unverändert bleibt. Trennung verhindert, dass Auth-Änderungen die Kundenhistorie kaputtmachen.

---

### Datenbank-Migrationen

1. `User`-Tabelle: 3 neue Felder (`customerId`, `isAnonymous`, `mergedIntoId`)
2. Neue Tabelle `CustomerIdentifier` mit Index auf (`userId`), (`value`), (`type`, `isActive`)
3. Bestehende User erhalten automatisch eine `customerId` via Migrations-Script (einmalig)
4. Navigation: Neuer Eintrag „Kunden" in `AppSidebar.tsx` unter Verwaltung

### Dependencies

Keine neuen Packages nötig — alle UI-Komponenten (Sheet, Table, Badge, Input, Select) existieren bereits in `components/ui/`.

---

## UI-Konzept (UI Designer)

### Design-Prinzipien für PROJ-18

Orientiert an `DESIGN_GUIDELINES.md`:
- **Tabelle** statt Card-Grid — Admin-Listen-Seiten verwenden `bg-card rounded-xl border border-border overflow-hidden`
- **Sheet-Drawer** (rechts, 600px) mit Tab-Navigation — kein Page-Navigation
- **Aktivitätsstatus** als farbige Pills — 5 semantische Farben (siehe unten)
- **Avatar-Initials** als Fallback — kein Profilbild erforderlich
- Vollständiger Dark-Mode-Support bei allen Farben

---

### Aktivitätsstatus — Farbsystem

| Status | Light Mode | Dark Mode | Bedeutung |
|---|---|---|---|
| `Neu` | `bg-gray-100 text-gray-600` | `dark:bg-gray-800 dark:text-gray-400` | Noch keine Bestellung |
| `Aktiv` | `bg-green-100 text-green-700` | `dark:bg-green-900/30 dark:text-green-400` | Bestellung ≤ 30 Tage |
| `Gelegentlich` | `bg-yellow-100 text-yellow-700` | `dark:bg-yellow-900/30 dark:text-yellow-400` | 31–90 Tage |
| `Schlafend` | `bg-orange-100 text-orange-700` | `dark:bg-orange-900/30 dark:text-orange-400` | 91–180 Tage |
| `Abgewandert` | `bg-red-100 text-red-700` | `dark:bg-red-900/30 dark:text-red-400` | > 180 Tage / nie |

---

### Wireframe: Kundenliste `/admin/kunden`

```
┌─────────────────────────────────────────────────────────────────────────┐
│ min-h-screen bg-background p-6                                          │
│                                                                         │
│  ┌── Header ────────────────────────────────────────────────────────┐   │
│  │  👤 Kunden                          [↻ Aktualisieren]            │   │
│  │  text-2xl font-bold                 Button variant="outline" sm  │   │
│  │  247 Kunden gesamt                                               │   │
│  │  text-sm text-muted-foreground                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌── Filter-Leiste (bg-card rounded-xl border p-4) ─────────────────┐   │
│  │  [🔍 Suche Name, E-Mail, Mitarbeiter-ID...]  [Standort ▾]        │   │
│  │  flex-1 h-9 rounded-md border bg-background  h-9 select          │   │
│  │                                                                   │   │
│  │  [Aktivitätsstatus ▾]  [Sortierung ▾]  [Zurücksetzen ghost]      │   │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌── Kundentabelle (bg-card rounded-xl border overflow-hidden) ──────┐  │
│  │  ┌─────┬──────────────────────┬──────────┬─────────┬────────┬────┤  │
│  │  │     │ Kunde                │ Standort │ Wallet  │ Status │Seit│  │
│  │  │     │ text-muted-fg xs     │ xs       │ right   │        │ xs │  │
│  │  ├─────┼──────────────────────┼──────────┼─────────┼────────┼────┤  │
│  │  │ ●MA │ Max Mustermann       │ Berlin   │ 12,50 € │ ●Aktiv │24d │  │
│  │  │     │ max@example.com xs   │ Mitte    │ green   │ green  │    │  │
│  │  ├─────┼──────────────────────┼──────────┼─────────┼────────┼────┤  │
│  │  │ ●LM │ Lisa Meyer           │ —        │  0,00 € │ ●Neu   │3d  │  │
│  │  │     │ lisa@example.com xs  │          │ orange  │ gray   │    │  │
│  │  ├─────┼──────────────────────┼──────────┼─────────┼────────┼────┤  │
│  │  │ ●?  │ [anonymisiert]       │ Hamburg  │  5,20 € │●Anonym │—   │  │
│  │  │anon │ [anonymisiert] xs    │          │         │ gray   │    │  │
│  │  ├─────┴──────────────────────┴──────────┴─────────┴────────┴────┤  │
│  │  │  247 Einträge · Seite 1 von 10    [← Zurück]  [Weiter →]      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Tabellen-Row — Tailwind-Klassen

```
Zeile (klickbar):
  <tr className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer">

Avatar-Initials-Zelle:
  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-semibold
                  flex items-center justify-center flex-shrink-0">
    MA
  </div>

Anonymes Avatar:
  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
    <UserX className="w-4 h-4 text-muted-foreground" />
  </div>

Wallet-Betrag grün (> 0):   font-semibold text-green-600 dark:text-green-400 tabular-nums
Wallet-Betrag orange (= 0): font-semibold text-orange-500 tabular-nums
Wallet-Betrag rot (< 0):    font-semibold text-red-600 dark:text-red-400 tabular-nums
```

---

### Wireframe: Kundenprofil-Drawer (Sheet)

```
┌─── Seite (verdunkelt) ──────────┬──── Sheet (600px, rechts) ───────────┐
│                                 │                                       │
│  [Kundenliste im Hintergrund]   │  ┌─ Drawer-Header ────────────────┐  │
│                                 │  │                           [✕]   │  │
│                                 │  │  ┌──┐  Max Mustermann           │  │
│                                 │  │  │MA│  max.mustermann@kantine.de│  │
│                                 │  │  │  │  text-sm muted            │  │
│                                 │  │  └──┘  Kunde seit 14. Jan 2025  │  │
│                                 │  │  w-14 h-14 rounded-full         │  │
│                                 │  │  bg-primary/10 text-xl          │  │
│                                 │  └─────────────────────────────────┘  │
│                                 │                                       │
│                                 │  ┌─ Tab-Navigation ────────────────┐  │
│                                 │  │  [Übersicht] Bestellhistorie     │  │
│                                 │  │   Präferenzen   Merkmale         │  │
│                                 │  │  aktiver Tab: border-b-2         │  │
│                                 │  │  border-primary text-primary     │  │
│                                 │  └─────────────────────────────────┘  │
│                                 │                                       │
│                                 │  ┌─ Tab: Übersicht ────────────────┐  │
│                                 │  │                                  │  │
│                                 │  │  Identifikatoren                 │  │
│                                 │  │  ─────────────────────────────   │  │
│                                 │  │  [#] cuid-abc123... (Customer-ID)│  │
│                                 │  │  [👔] EMP-12345 (Mitarbeiter-ID) │  │
│                                 │  │  [🔖] BADGE-789 (Badge-ID)       │  │
│                                 │  │  Chips: bg-muted rounded-md px-2 │  │
│                                 │  │  py-1 text-xs font-mono          │  │
│                                 │  │                                  │  │
│                                 │  │  Organisation & Standort         │  │
│                                 │  │  ─────────────────────────────   │  │
│                                 │  │  🏢 Kantine GmbH                 │  │
│                                 │  │  📍 [Berlin Mitte] [Hamburg HQ]  │  │
│                                 │  │  Chips: border rounded-full px-3 │  │
│                                 │  │                                  │  │
│                                 │  │  Zuschüsse & Berechtigungen      │  │
│                                 │  │  ─────────────────────────────   │  │
│                                 │  │  ✅ Essenszuschuss  3,50 €/Tag   │  │
│                                 │  │  ✅ Frühstück       1,00 €/Tag   │  │
│                                 │  │  ⚪ Snack-Budget    [abgelaufen] │  │
│                                 │  │                                  │  │
│                                 │  │  Wallet                          │  │
│                                 │  │  ─────────────────────────────   │  │
│                                 │  │  ┌────────────────────────────┐  │  │
│                                 │  │  │  💰  12,50 €   [Aufladen →]│  │  │
│                                 │  │  │  text-2xl font-bold green  │  │  │
│                                 │  │  └────────────────────────────┘  │  │
│                                 │  └─────────────────────────────────┘  │
└─────────────────────────────────┴───────────────────────────────────────┘
```

#### Drawer — Tailwind-Klassen

```
Sheet-Inhalt:
  <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto p-0">

Drawer-Header (sticky):
  <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-5">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary text-xl font-bold
                      flex items-center justify-center flex-shrink-0">
        MA
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-foreground truncate">Max Mustermann</h2>
        <p className="text-sm text-muted-foreground">max@kantine.de</p>
        <p className="text-xs text-muted-foreground mt-0.5">Kunde seit 14. Jan 2025 (385 Tage)</p>
      </div>
    </div>

Tab-Navigation:
  <div className="flex border-b border-border px-6">
    <button className="px-4 py-3 text-sm font-medium border-b-2 border-primary text-primary">
      Übersicht
    </button>
    <button className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
      Bestellhistorie
    </button>
  </div>

Sektions-Überschrift:
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
    Identifikatoren
  </p>
  <hr className="border-border mb-4" />

Identifikator-Chip (Read-only):
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-md
                   text-xs font-mono text-foreground border border-border/50">
    <Hash className="w-3 h-3 text-muted-foreground" />
    cuid-abc123...
    <span className="text-muted-foreground ml-1">(Customer-ID)</span>
  </span>

Standort-Chip:
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-border
                   text-xs text-foreground bg-background">
    <MapPin className="w-3 h-3 text-muted-foreground" />
    Berlin Mitte
  </span>

Wallet-Karte:
  <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30
                      flex items-center justify-center">
        <Wallet className="w-5 h-5 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Aktuelles Guthaben</p>
        <p className="text-2xl font-bold text-green-600 dark:text-green-400">12,50 €</p>
      </div>
    </div>
    <Button variant="outline" size="sm" asChild>
      <Link href="/admin/wallet?userId=...">Aufladen</Link>
    </Button>
  </div>

Zuschuss-Zeile (aktiv):
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-green-500" />
      <span className="text-sm text-foreground">Essenszuschuss</span>
    </div>
    <span className="text-sm font-medium text-foreground">3,50 €/Tag</span>
  </div>

Zuschuss-Zeile (inaktiv/abgelaufen):
  <div className="flex items-center justify-between py-2 opacity-50">
    <div className="flex items-center gap-2">
      <MinusCircle className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground line-through">Snack-Budget</span>
    </div>
    <Badge variant="secondary" className="text-xs">Abgelaufen</Badge>
  </div>
```

---

### Anonyme Profile — Sonderbehandlung

```
Anonym-Banner (unter Drawer-Header):
  <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg
                  bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
    <p className="text-xs text-amber-700 dark:text-amber-400">
      Anonymes Profil – personenbezogene Daten werden nicht angezeigt
    </p>
  </div>

PII-Felder (anonymisiert):
  Name:  "[anonymisiert]" in text-muted-foreground italic
  E-Mail: "[anonymisiert]" in text-muted-foreground italic
  Avatar: UserX-Icon statt Initials, bg-muted
```

---

### Leer-States & Loading

```
Loading (Tabelle):
  <div className="flex items-center justify-center py-16">
    <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
  </div>

Keine Ergebnisse:
  <div className="py-16 text-center">
    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
    <p className="text-sm font-medium text-foreground">Keine Kunden gefunden</p>
    <p className="text-xs text-muted-foreground mt-1">Passen Sie die Suchkriterien an</p>
  </div>

Keine Identifikatoren:
  <p className="text-sm text-muted-foreground italic">
    Keine weiteren Identifikatoren hinterlegt
  </p>
```

---

### Icons (lucide-react)

| Element | Icon | Größe |
|---|---|---|
| Seiten-Header | `Users` | `w-6 h-6` |
| Mitarbeiter-ID | `Briefcase` | `w-3 h-3` |
| Badge-ID | `Tag` | `w-3 h-3` |
| App-ID | `Smartphone` | `w-3 h-3` |
| Customer-ID | `Hash` | `w-3 h-3` |
| Standort | `MapPin` | `w-3 h-3` |
| Organisation | `Building2` | `w-4 h-4` |
| Wallet | `Wallet` | `w-5 h-5` |
| Zuschuss aktiv | `CheckCircle2` | `w-4 h-4 text-green-500` |
| Zuschuss inaktiv | `MinusCircle` | `w-4 h-4 text-muted-foreground` |
| Anonym | `UserX` | `w-4 h-4` |
| Anonym-Banner | `ShieldAlert` | `w-4 h-4 text-amber-600` |
