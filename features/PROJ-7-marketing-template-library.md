# PROJ-7: Marketing Template Library

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-1 (Admin Dashboard) – für Admin-only Zugriff
- Erweitert: PROJ-4 (Marketing Automation) – Templates sind in Workflows wählbar
- Erweitert: PROJ-2 (Promotion-Banner) – Promotion-Banner-Typ nutzt diese Bibliothek

## Übersicht
Zentrale Verwaltung aller Marketing-Templates und -Assets. Betreiber (ADMIN) sieht eine visuelle Bibliothek mit Vorschau-Karten, kann neue Templates anlegen, bestehende bearbeiten, duplizieren oder löschen.

---

## User Stories

- Als Admin möchte ich eine visuelle Bibliothek aller meiner Marketing-Templates sehen, damit ich schnell das richtige Template finde und verwalten kann.
- Als Admin möchte ich Templates nach Typ filtern (E-Mail, In-App Banner, Promotion-Banner, Push-Nachricht), damit ich den Überblick behalte.
- Als Admin möchte ich ein neues Template anlegen und dabei den Typ wählen, damit ich sofort in den passenden Editor geleitet werde.
- Als Admin möchte ich ein bestehendes Template duplizieren, damit ich Varianten schnell erstellen kann ohne von vorne anzufangen.
- Als Admin möchte ich ein Template archivieren (Soft-Delete), damit ich es nicht versehentlich lösche, aber trotzdem aus der aktiven Liste entferne.
- Als Admin möchte ich vorinstallierte Starter-Templates nutzen, damit ich nicht bei Null anfangen muss.
- Als Admin möchte ich ein Template als „Favorit" markieren, damit ich es in der Bibliothek schnell wiederfindet.

---

## Acceptance Criteria

- [ ] Bibliothek-Seite unter `/admin/marketing/templates` erreichbar (nur für ADMIN + SUPER_ADMIN)
- [ ] Darstellung als Karten-Grid mit Template-Thumbnail (visuelle Vorschau), Name, Typ-Badge, Status (Aktiv/Archiviert), letztes Änderungsdatum
- [ ] Filter-Leiste: nach Typ (E-Mail | In-App Banner | Promotion-Banner | Push), nach Status (Aktiv | Archiviert), Freitextsuche nach Name
- [ ] Sortierung: nach zuletzt geändert (Standard), nach Name A-Z, nach Erstellungsdatum
- [ ] „Neu erstellen"-Button öffnet Typ-Auswahl-Dialog (E-Mail / In-App Banner / Promotion-Banner / Push)
- [ ] Nach Typ-Auswahl → Weiterleitung in den Block-Editor (PROJ-8) mit leerem Template
- [ ] „Aus Starter-Template" Option beim Erstellen: zeigt vorinstallierte Templates zur Auswahl
- [ ] Duplizieren-Aktion pro Karte (Kontextmenü / ⋮-Button): erstellt Kopie mit Suffix „(Kopie)"
- [ ] Archivieren-Aktion mit Bestätigungsdialog: „Template wirklich archivieren?"
- [ ] Endgültiges Löschen nur wenn Template in keinem aktiven Workflow (PROJ-4) verwendet wird – sonst Warnung
- [ ] Vorinstallierte Starter-Templates sind beim First-Setup automatisch vorhanden (5–8 Stück, nicht löschbar, aber duplizierbar)
- [ ] Thumbnail wird automatisch aus dem Editor-Content generiert (vereinfachtes Preview-Rendering)

---

## Starter-Templates (vorinstalliert)

| Name | Typ | Beschreibung |
|------|-----|--------------|
| Willkommen an Bord | E-Mail | Begrüßungs-Mail für neue Kunden |
| Wochen-Menü ist online | E-Mail | Ankündigung neuer Wochenplan |
| Aktions-Woche | Promotion-Banner | Visueller Motto-Wochen-Banner |
| Neues Angebot entdecken | In-App Banner | Banner auf der Menü-Seite |
| Exklusiver Rabatt für dich | Push-Nachricht | Push-Benachrichtigung mit Coupon-Hinweis |
| Feedback gewünscht | E-Mail | Feedback-Anfrage nach Bestellung |

---

## Edge Cases

- **Template in aktivem Workflow:** Löschen/Archivieren zeigt Warnung mit Liste der betroffenen Workflows. Löschen erst nach Entfernen aus allen Workflows möglich.
- **Starter-Template bearbeiten:** Starter-Templates sind read-only; Bearbeiten erstellt automatisch eine Kopie.
- **Keine Templates vorhanden:** Leerer State mit Illustration + „Erstes Template erstellen"-CTA.
- **Template-Name bereits vorhanden:** Warnung bei Speichern, Duplikat-Name ist erlaubt (kein Unique-Constraint auf Name).
- **Thumbnail-Generierung schlägt fehl:** Fallback auf generisches Platzhalter-Bild mit Typ-Icon.
- **KITCHEN_STAFF ruft Seite auf:** 403-Redirect zurück zum Dashboard mit Fehlermeldung.

---

## Technische Anforderungen

- Neue DB-Tabelle `marketing_templates` (id, organizationId, name, type, content JSON, status, isStarter, thumbnailUrl, createdAt, updatedAt)
- `type` Enum: `EMAIL | IN_APP_BANNER | PROMOTION_BANNER | PUSH`
- `status` Enum: `ACTIVE | ARCHIVED`
- API-Routes: `GET/POST /api/admin/marketing/templates`, `GET/PUT/DELETE /api/admin/marketing/templates/[id]`, `POST /api/admin/marketing/templates/[id]/duplicate`
- Seeding der Starter-Templates in `prisma/seed.ts`
- Zugriff nur mit Session-Check `role === 'ADMIN' || role === 'SUPER_ADMIN'`

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (wird wiederverwendet)

| Was | Wo im Projekt | Nutzung für PROJ-7 |
|-----|--------------|---------------------|
| Admin-Layout & Sidebar | `components/admin/AdminShell.tsx`, `AdminSidebar.tsx` | Neue Seite hängt sich ein – kein neues Layout nötig |
| Marketing-Bereich | `app/admin/marketing/` (campaigns, segments, automation) | Neue Unterseite `templates` fügt sich hier ein |
| UI-Karten | `components/ui/card.tsx` | Template-Karten in der Bibliothek |
| Dialoge / Modals | Radix UI Dialog (bereits installiert) | Typ-Auswahl-Dialog, Bestätigungs-Dialoge |
| Dropdown-Menü | `components/ui/dropdown-menu.tsx` | ⋮-Aktionsmenü auf jeder Template-Karte |
| Badge | `components/ui/badge.tsx` | Typ-Badge (E-Mail, Banner, etc.) + Status-Badge |
| Tabs | `components/ui/tabs.tsx` | Filter nach Typ (optional als Tab-Bar) |

---

### Component-Struktur

```
/admin/marketing/templates  (neue Seite)
│
├── TemplateLibraryPage
│   ├── LibraryHeader
│   │   ├── Seitentitel „Marketing Templates"
│   │   └── Button „+ Neu erstellen" → öffnet NewTemplateDialog
│   │
│   ├── FilterBar
│   │   ├── Suchfeld (nach Name)
│   │   ├── Typ-Filter (Alle | E-Mail | In-App Banner | Promotion-Banner | Push)
│   │   ├── Status-Filter (Aktiv | Archiviert)
│   │   └── Sortierung (Zuletzt geändert | Name A-Z | Erstellt am)
│   │
│   ├── TemplateGrid  (Karten-Raster, 3–4 Spalten)
│   │   └── TemplateCard  (×N, eine pro Template)
│   │       ├── ThumbnailPreview  (visuelles Miniaturbild)
│   │       ├── Typ-Badge  (farbig: blau=E-Mail, grün=Banner, etc.)
│   │       ├── Template-Name
│   │       ├── Status-Badge (Aktiv / Archiviert)
│   │       ├── „Zuletzt geändert"-Datum
│   │       └── AktionsMenuButton (⋮)
│   │           ├── Bearbeiten → /admin/marketing/templates/[id]/editor
│   │           ├── Duplizieren
│   │           ├── Archivieren (mit Bestätigung)
│   │           └── Löschen (nur wenn nicht in Workflow)
│   │
│   └── EmptyState  (wenn keine Templates vorhanden)
│       ├── Illustration
│       └── „Erstes Template erstellen"-Button
│
└── NewTemplateDialog  (Modal, wird von Header-Button geöffnet)
    ├── Schritt 1: Typ wählen
    │   └── 4 große Kacheln: E-Mail | In-App Banner | Promotion-Banner | Push
    ├── Schritt 2: Startpunkt wählen
    │   ├── Option A: „Leeres Template"
    │   └── Option B: „Aus Starter-Template" → StarterTemplateGalerie
    │       └── StarterTemplateCard (×6, read-only Vorschau)
    └── Weiter-Button → Weiterleitung zum Block-Editor (PROJ-8)
```

---

### Daten-Modell

**Neue Datenbank-Tabelle: Marketing Templates**

Jedes Marketing-Template speichert:
- Eindeutige ID
- Organisation (Mandant – welche Kantine besitzt dieses Template)
- Name (frei wählbar, z.B. „Bayerische Woche Mai")
- Typ (E-Mail | In-App Banner | Promotion-Banner | Push-Nachricht)
- Inhalt (komplette Block-Liste als JSON – wird vom Editor geschrieben, von PROJ-8 definiert)
- Status (Aktiv | Archiviert)
- Ist-Starter-Flag (ja/nein – Starter-Templates sind schreibgeschützt)
- Vorschaubild-URL (automatisch generiert)
- Erstellt am / Zuletzt geändert

**Beziehungen zu bestehenden Tabellen:**
- `organizations` → 1 Organisation hat viele Templates
- `marketing_workflows` (PROJ-4) → Workflows referenzieren Templates (lose Kopplung via templateId)
- `promotion_banners` (PROJ-2) → Promotion-Banner können zukünftig auf Templates zeigen

**Starter-Templates:** Werden einmalig beim Datenbank-Setup (Seeding) angelegt. Sie gehören keiner spezifischen Organisation, sondern sind plattformweit – beim Duplizieren entsteht eine organisations-spezifische Kopie.

---

### Neue Seiten & API-Routen

**Neue Admin-Seite:**
```
app/admin/marketing/templates/page.tsx      ← Bibliothek-Übersicht
```

**Neue API-Routen:**
```
GET  /api/admin/marketing/templates          ← Liste (mit Filter-Params)
POST /api/admin/marketing/templates          ← Neues Template anlegen

GET    /api/admin/marketing/templates/[id]   ← Einzelnes Template
PUT    /api/admin/marketing/templates/[id]   ← Bearbeiten (Name, Status)
DELETE /api/admin/marketing/templates/[id]   ← Löschen (mit Workflow-Check)

POST /api/admin/marketing/templates/[id]/duplicate  ← Duplizieren
```

**Erweiterung Prisma Schema:**
- Neue Tabelle `marketing_templates` wird in `prisma/schema.prisma` ergänzt
- Migration + Seeding der 6 Starter-Templates

---

### Tech-Entscheidungen

**Warum keine neue State-Management-Library?**
→ React `useState` reicht für Filter, Suche, Sortierung auf einer Liste. Kein globaler State nötig.

**Warum CSS-basierte Thumbnail-Vorschau statt echtem Screenshot?**
→ Echter Browser-Screenshot (z.B. Puppeteer) wäre Server-aufwändig und langsam. Stattdessen: vereinfachtes Mini-Rendering des Block-JSONs als kleine HTML-Vorschau im Browser. Schnell, kein extra Server-Prozess.

**Warum Soft-Delete (Archivieren) statt echtem Löschen?**
→ Templates können in aktiven Workflows referenziert sein. Archivieren verhindert Datenverlust; Löschen nur wenn keine Abhängigkeiten.

**Sidebar-Eintrag:**
→ „Templates" wird als neuer Punkt unter dem bestehenden Marketing-Bereich in `AdminSidebar.tsx` ergänzt – keine neue Navigation nötig.

---

### Benötigte Packages

Keine neuen Packages – alles bereits im Projekt:
- `@radix-ui/react-dialog` – Typ-Auswahl-Dialog ✅
- `@radix-ui/react-dropdown-menu` – ⋮-Aktionsmenü ✅
- `lucide-react` – Icons (Plus, MoreVertical, Archive, Copy, Trash) ✅
- `date-fns` – Datumsformatierung ✅
