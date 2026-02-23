# PROJ-20: CDP – Präferenzen & Allergien

## Status: 🟢 Done

## Kontext & Ziel
Das Kundenprofil soll Präferenzen in zwei klar getrennten Kategorien verwalten:
1. **Explizite Präferenzen** – vom Kunden oder Admin aktiv eingetragen (Allergien, Diätformen, Unverträglichkeiten)
2. **Implizite Präferenzen** – automatisch aus der Bestellhistorie abgeleitet (Top-Kategorien, Lieblingsprodukte, Bestellrhythmus)

Diese Trennung ist sowohl für die DSGVO-Konformität (aktive Einwilligung vs. Verhaltensanalyse) als auch für die operative Nutzung (Küche muss Allergien zuverlässig sehen) entscheidend.

## Abhängigkeiten
- Benötigt: PROJ-18 (Golden Record & Admin UI) – Präferenzen erscheinen als Tab im Kundenprofil-Drawer
- Benötigt: PROJ-19 (Bestellhistorie) – implizite Präferenzen werden aus Bestelldaten berechnet
- Auf PROJ-4 aufgebaut (Kundensegmente) – Segmentregeln können explizite Präferenzen referenzieren

---

## User Stories

- Als **Küche / Produktionsplanung** möchte ich im Kundenprofil alle hinterlegten Allergien und Unverträglichkeiten auf einen Blick sehen, damit ich bei persönlichen Anfragen oder Anpassungen schnell reagieren kann.
- Als **Service & Support** möchte ich explizite Präferenzen eines Kunden bearbeiten können (z. B. Allergie nachtragen), wenn der Kunde am Schalter darum bittet.
- Als **Kantinen-/Standortleitung** möchte ich auf einen Blick sehen, welche Produkte und Kategorien ein Kunde am häufigsten bestellt (implizite Präferenzen), um personalisierte Angebote oder Menüanpassungen zu planen.
- Als **Kunden (App-User)** möchte ich meine eigenen Allergien und Diätpräferenzen in meinem App-Profil selbst pflegen können, damit meine Unverträglichkeiten im System hinterlegt sind.
- Als **Business / Analytics** möchte ich implizite Präferenzen für die Segmentierung nutzen können (z. B. Segment „Vegetarier"), ohne dass ich jeden Kunden manuell kategorisieren muss.

---

## Acceptance Criteria

### Tab „Präferenzen" im Kundenprofil-Drawer (PROJ-18)

#### Explizite Präferenzen (Admin-seitig bearbeitbar)
- [ ] Anzeige aller hinterlegten Allergene als farbige Chips (z. B. rot für bekannte Allergene: Gluten, Laktose, Nüsse, Ei, Soja, Fisch, Schalentiere, Senf, Sellerie, Sesam, Lupine, Weichtiere, Schwefeldioxid/Sulfite)
- [ ] Anzeige weiterer expliziter Präferenzen: Diätformen (`Vegetarisch`, `Vegan`, `Halal`, `Kosher`, `Glutenfrei`, `Laktosefrei`) als Badges
- [ ] Admin kann explizite Präferenzen hinzufügen und entfernen (Edit-Mode im Drawer)
- [ ] Jede Änderung durch Admin wird mit Timestamp und Admin-Name protokolliert (Audit-Trail, Read-only)
- [ ] Deutliche visuelle Trennung von impliziten Präferenzen (eigener Abschnitt + Label „Manuell hinterlegt")

#### Implizite Präferenzen (Read-only, aus Bestellhistorie berechnet)
- [ ] „Top 5 Kategorien" des Kunden basierend auf Bestellhäufigkeit (letzte 90 Tage), mit Balkendiagramm oder %-Anteil
- [ ] „Top 5 Produkte" basierend auf Bestellhäufigkeit (letzte 90 Tage)
- [ ] „Bevorzugte Bestellzeit" (Frühstück / Mittagessen / Abend — aus Uhrzeit der Bestellungen abgeleitet)
- [ ] „Bevorzugter Kanal" (App / Terminal / Kasse — häufigster genutzter Kanal)
- [ ] Zeitstempel der letzten Neuberechnung sichtbar (z. B. „Aktualisiert vor 2 Stunden")
- [ ] Deutliche visuelle Trennung von expliziten Präferenzen (Label „Automatisch ermittelt – nicht editierbar")
- [ ] Admin kann implizite Präferenzen NICHT manuell bearbeiten (FR-17: nur lesend)

### Kunden-App (Self-Service)
- [ ] Kunde kann in der App unter „Profil → Meine Präferenzen" seine eigenen Allergene und Diätformen setzen
- [ ] Multiselect-Auswahl aus Standard-Allergen-Liste (14 EU-Allergene) + Freitexteingabe für sonstige
- [ ] Änderungen des Kunden werden sofort im Admin-Profil sichtbar (mit Quelle „Selbst angegeben")
- [ ] Kunde kann seine expliziten Präferenzen jederzeit anpassen oder löschen

### Datenmodell
- [ ] `CustomerPreference`-Tabelle: `userId`, `type` (`EXPLICIT`|`IMPLICIT`), `key` (z. B. `ALLERGEN_GLUTEN`), `value`, `source` (`USER`|`ADMIN`|`SYSTEM`), `updatedAt`, `updatedById`
- [ ] Implizite Präferenzen werden durch einen Background-Job (re-)berechnet, nicht live bei jedem Aufruf
- [ ] Explizite und implizite Präferenzen sind über `type`-Feld klar getrennt

---

## Edge Cases

- **Kein explizite Präferenzen hinterlegt:** Abschnitt zeigt „Keine Allergien oder Diätpräferenzen hinterlegt" mit CTA „Hinzufügen"
- **Keine Bestellhistorie (neue Kunden):** Implizite Präferenzen zeigen „Noch nicht genug Daten für automatische Auswertung (min. 3 Bestellungen)"
- **Widersprüchliche Präferenzen:** Kunde hat explizit „Vegan" gesetzt, bestellt aber implizit oft Fleischgerichte → beide Daten werden ohne Warnung nebeneinander angezeigt (kein System-Override)
- **Allergen-Freitext:** Sonstige Allergieeingaben werden als Text-Chip dargestellt, nicht in Standard-Kategorien eingeordnet
- **Veraltete implizite Daten:** Wenn der Rechenstand älter als 24h ist, erscheint ein Hinweis „Daten werden aktualisiert"
- **Datenschutz:** Implizite Präferenzen dürfen nicht an Dritte weitergegeben werden; sie sind nur für interne Admin-Ansicht bestimmt
- **Admin editiert fremde Org:** Explizite Präferenzen sind nur innerhalb der eigenen Organisation editierbar; Cross-Org-Zugriff ist blockiert

---

## Technische Anforderungen

- Standard-Allergenliste: 14 EU-Pflichtallergene gemäß EU-Lebensmittelinformationsverordnung (LMIV)
- Implizite Präferenz-Berechnung: Background-Job (Cron, täglich) — kein synchroner API-Call
- API-Endpunkte:
  - `GET /api/admin/kunden/[id]/praeferenzen`
  - `PATCH /api/admin/kunden/[id]/praeferenzen` (nur explizite)
  - `GET /api/user/praeferenzen` (Kunden-App Self-Service)
  - `PATCH /api/user/praeferenzen` (Kunden-App Self-Service)
- Mandate: Nur Admins der eigenen Org dürfen PATCH ausführen
- Audit-Log: Alle Admin-Änderungen an expliziten Präferenzen werden in `PreferenceAuditLog` persistiert

---

## Out of Scope
- Automatische Menüfilterung basierend auf Präferenzen im Kunden-Frontend (→ späteres UX-Feature)
- Allergen-Kennzeichnung auf Produkten (→ existiert bereits im Produktkatalog)
- ML-basierte Empfehlungsengine (→ Later)

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

| Was existiert bereits | Wo | Relevanz für PROJ-20 |
|---|---|---|
| `Metadata`-Tabelle mit `ALLERGEN`-Einträgen | `prisma/schema.prisma` | Master-Liste der Allergene (bereits 12 Einträge geseeded) — wird als Quelle für die Standard-Auswahl genutzt |
| `Metadata`-Tabelle mit `DIET_CATEGORY`-Einträgen | `prisma/schema.prisma` | Master-Liste der Diätformen (8 Einträge) — wird als Quelle für Diätkategorien genutzt |
| `OrderItem.productCategorySnapshot` | PROJ-19 | Basis für implizite Kategorie-Auswertung — kein separater Bestelldaten-Join nötig |
| `Order.channel` | PROJ-19 | Basis für „Bevorzugter Kanal"-Auswertung |
| Drawer-Tab „Präferenzen" | `app/admin/kunden/page.tsx` | Platzhalter wartet auf PROJ-20-Implementierung |
| `getAdminContext()` | `lib/admin-helpers.ts` | Auth-Muster für alle neuen Admin-Endpunkte |
| `requireAdminRole()` | `lib/admin-helpers.ts` | Auth-Muster für Kunden-App-Endpunkte |

---

### Warum die Metadata-Tabelle nutzen statt hartkodierte Listen?

Die Metadata-Tabelle hat **bereits alle Allergene und Diätkategorien** geseeded — das ist unsere Single Source of Truth. Wenn die Kantine künftig weitere Allergene oder Diätkategorien hinzufügen will, reicht eine Änderung in der Metadata-Tabelle. Keine Code-Änderung nötig.

**MVP-Ausnahme:** Die 14 EU-Pflichtallergene werden zusätzlich als fest definierte Konstante im Backend hinterlegt, damit bei fehlenden Seed-Daten immer eine korrekte Liste existiert.

---

### Component-Struktur

```
Drawer-Tab „Präferenzen" (aus PROJ-18)
│
├── Abschnitt: Explizite Präferenzen
│   ├── Label „Manuell hinterlegt" + Edit-Button (Admin)
│   │
│   ├── Unterabschnitt: Allergene
│   │   ├── Rote Chips für aktive Allergene (z.B. „Gluten", „Nüsse")
│   │   └── Edit-Mode: Multiselect aus Standard-Liste + Freitext-Chip
│   │
│   ├── Unterabschnitt: Diätformen
│   │   ├── Grüne Badges (z.B. „Vegetarisch", „Vegan")
│   │   │   → Wenn source=ADMIN: Badge hat kein Icon
│   │   │   → Wenn source=DERIVED (bestätigt): Badge zeigt kleines „🤖"-Icon als Herkunftshinweis
│   │   └── Edit-Mode: Multiselect aus Diät-Liste
│   │
│   └── Audit-Trail (Read-only, kollabiert)
│       └── Letzte 3 Änderungen mit Zeitstempel + Admin-Name + Aktion
│           (z.B. „Vorschlag ‚Vegetarisch' bestätigt" / „Allergen Gluten hinzugefügt")
│
├── Abschnitt: Vorgeschlagene Präferenzen (Konfidenzbasiert)
│   ├── Label „Basierend auf Bestellverhalten – zur Bestätigung vorgeschlagen"
│   ├── Nur sichtbar wenn ≥ 1 Vorschlag vorhanden UND nicht bereits explizit hinterlegt
│   │
│   └── Pro Vorschlag: gelbe/amber Badge-Karte
│       ├── Name der Präferenz (z.B. „Vegetarisch")
│       ├── Konfidenz-Indikator: „87 % der letzten 45 Bestellungen"
│       ├── [Bestätigen]-Button → POST praeferenzen, source=DERIVED, wird zu source=ADMIN
│       └── [Ignorieren]-Button → POST praeferenzen/ignorieren, verhindert erneutes Vorschlagen
│
└── Abschnitt: Implizite Präferenzen (Verhaltensstatistiken)
    ├── Label „Automatisch ermittelt – nicht editierbar"
    ├── Hinweis bei < 5 Bestellungen: „Noch nicht genug Daten (mind. 5 Bestellungen)"
    │
    ├── Top 5 Kategorien (letzte 90 Tage)
    │   └── Horizontale Balken mit %-Anteil (aus productCategorySnapshot)
    │
    ├── Top 5 Produkte (letzte 90 Tage)
    │   └── Rangliste mit Bestellanzahl (aus productNameSnapshot)
    │
    ├── Bevorzugte Bestellzeit
    │   └── Frühstück (vor 10h) / Mittag (10–14h) / Nachmittag (14–17h) / Abend (nach 17h)
    │
    └── Bevorzugter Kanal
        └── App / Terminal / Web / Kasse (Icon + Anzahl)
```

---

### Daten-Model

**Neue Tabelle `CustomerPreference`:**

Jede Zeile speichert genau eine Präferenz eines Kunden — das erlaubt einfaches Hinzufügen, Entfernen und Historisieren einzelner Einträge.

| Feld | Was es speichert |
|---|---|
| `id` | Eindeutige ID |
| `userId` | Welcher Kunde |
| `type` | `EXPLICIT` (aktiv eingegeben oder bestätigter Vorschlag) oder `IMPLICIT` (Statistik) |
| `key` | Identifiziert die Präferenz: z.B. `ALLERGEN_GLUTEN`, `DIET_VEGAN`, `ALLERGEN_CUSTOM` |
| `value` | Wert der Präferenz (z.B. der Freitext-Allergenname bei ALLERGEN_CUSTOM) |
| `source` | Woher: `USER`, `ADMIN`, `SYSTEM`, **`DERIVED`** (auto-abgeleitet, noch unbestätigt) |
| `confidence` | Konfidenzwert 0.0–1.0 (nur für `source=DERIVED`); z.B. `0.87` = 87 % der Bestellungen |
| `ignored` | `Boolean` — ob der Admin diesen Vorschlag bewusst ignoriert hat (kein erneutes Vorschlagen) |
| `updatedAt` | Wann zuletzt geändert |
| `updatedById` | Welcher Admin/User hat zuletzt geändert |

**Neue Tabelle `PreferenceAuditLog`:**

Unveränderliches Protokoll aller Admin-Änderungen an expliziten Präferenzen.

| Feld | Was es speichert |
|---|---|
| `id` | Eindeutige ID |
| `userId` | Betroffener Kunde |
| `action` | `ADDED`, `REMOVED` oder **`CONFIRMED`** (Vorschlag bestätigt) |
| `key` | Welche Präferenz (z.B. `ALLERGEN_GLUTEN`) |
| `value` | Freitextwert (falls vorhanden) |
| `confidence` | Snapshot des Konfidenzwerts zum Zeitpunkt der Bestätigung (bei CONFIRMED) |
| `changedById` | Admin-User-ID |
| `changedByName` | Admin-Name als Snapshot (für spätere Anzeige auch wenn User gelöscht) |
| `changedAt` | Zeitstempel |

**Wichtig: Keine separate Tabelle für implizite Präferenzen im MVP**

Implizite Präferenzen (Top-Kategorien, Lieblingsprodukte, Kanal, Bestellzeit) werden **live aus den Bestelldaten aggregiert** (DB-Aggregation über `OrderItem.productCategorySnapshot` und `Order.channel`). Das ist möglich, weil PROJ-19 bereits die Snapshot-Felder implementiert hat. Ein separater Background-Job wäre Overengineering für MVP — die Aggregation ist schnell genug bei typischen Bestellzahlen (< 2.000 Bestellungen pro Kunde).

---

### API-Endpunkte

| Methode | Pfad | Was er tut |
|---|---|---|
| `GET` | `/api/admin/kunden/[id]/praeferenzen` | Alle expliziten Präferenzen + live-berechnete Vorschläge (DERIVED) + Statistiken + Audit-Log (letzte 10) |
| `POST` | `/api/admin/kunden/[id]/praeferenzen` | Eine explizite Präferenz hinzufügen (Admin, mit Audit-Eintrag `ADDED`) |
| `DELETE` | `/api/admin/kunden/[id]/praeferenzen/[pid]` | Eine explizite Präferenz entfernen (Admin, mit Audit-Eintrag `REMOVED`) |
| `POST` | `/api/admin/kunden/[id]/praeferenzen/[pid]/bestaetigen` | Einen DERIVED-Vorschlag bestätigen → source wechselt zu `ADMIN`, Audit-Eintrag `CONFIRMED` |
| `POST` | `/api/admin/kunden/[id]/praeferenzen/[pid]/ignorieren` | Einen DERIVED-Vorschlag dauerhaft ignorieren → `ignored=true`, erscheint nicht mehr |
| `GET` | `/api/user/praeferenzen` | Kunden-App: Eigene explizite Präferenzen lesen |
| `PATCH` | `/api/user/praeferenzen` | Kunden-App: Eigene explizite Präferenzen setzen (Bulk-Replace) |
| `GET` | `/api/admin/metadata?type=ALLERGEN` | Standard-Allergenliste aus Metadata-Tabelle (für Multiselect-Dropdown) |

**Warum POST + DELETE statt PATCH für Admin?**
→ Einzelne Präferenzen müssen granular auditiert werden. Jeder `ADDED`- und `REMOVED`-Event braucht einen eigenen Audit-Log-Eintrag. Ein PATCH über die gesamte Liste würde verschleiern, was sich genau geändert hat.

**Warum PATCH (Bulk-Replace) für Kunden-App?**
→ Der Kunde sieht seine Präferenzen als Gesamt-Liste und speichert einmalig den neuen Zustand. Für Self-Service ist das einfacher als einzelne POST/DELETE-Calls. Kein Audit-Log für User-Änderungen (nur `updatedAt` + `source: USER`).

---

### Konfidenzbasierte Ableitung (Kernmechanismus)

**Idee:** Das System wertet die Bestellhistorie aus und erkennt automatisch wahrscheinliche Diätpräferenzen — noch ohne manuellen Aufwand. Admins sehen diese Vorschläge und können sie mit einem Klick bestätigen oder verwerfen.

**Datenbasis:** `Dish.dietTags` (Array von Strings, z.B. `["vegetarisch", "vegan"]`) — nicht snapshotted, JOIN über `orderItem.menuItem.dish.dietTags`. Da Diätkategorien sich selten ändern, ist ein Live-JOIN akzeptabel.

**Ableitungslogik (live, on GET):**
```
Für jeden der letzten 90 Tage-Bestellungen des Kunden:
  1. Aggregiere alle einzigartigen dietTags über alle OrderItems
  2. Berechne pro dietTag: ratio = Anzahl Bestellungen mit diesem Tag / Gesamtbestellungen
  3. Wenn ratio >= 0.70 UND Gesamtbestellungen >= 5:
     → Generiere Vorschlag mit confidence = ratio
     → Überspringe, falls Präferenz bereits explizit hinterlegt oder als ignored markiert
```

**Schwellenwerte (konfigurierbar, zunächst hardkodiert):**

| Parameter | Wert | Begründung |
|---|---|---|
| Mindestbestellungen | 5 | Verhindert Vorschläge bei neuen Kunden mit zu wenig Daten |
| Konfidenz-Schwelle | 70 % | Konservativ genug, um Fehlvorschläge zu minimieren |
| Zeitfenster | 90 Tage | Aktuelle Gewohnheiten; älteres Verhalten weniger relevant |
| Nur Diätformen | ja | Allergene werden **nicht** automatisch abgeleitet (Sicherheit/Haftung) |

**Antwortstruktur des GET-Endpunkts:**
```json
{
  "explicit": [
    { "id": "...", "key": "DIET_VEGAN", "source": "ADMIN", "updatedAt": "..." }
  ],
  "suggestions": [
    {
      "id": "...",
      "key": "DIET_VEGETARIAN",
      "confidence": 0.87,
      "orderCount": 45,
      "matchingOrderCount": 39,
      "source": "DERIVED"
    }
  ],
  "implicit": {
    "topCategories": [...],
    "topProducts": [...],
    "preferredChannel": "APP",
    "preferredTimeSlot": "LUNCH"
  },
  "auditLog": [...]
}
```

**Bestätigungs-Flow:**
1. Admin klickt „Bestätigen" auf Vorschlag „Vegetarisch (87 %)"
2. `POST /api/admin/kunden/[id]/praeferenzen/[pid]/bestaetigen`
3. Backend: `source` wechselt von `DERIVED` zu `ADMIN`, `confidence` bleibt gespeichert als Herkunftsnachweis
4. `PreferenceAuditLog` erhält Eintrag mit `action: CONFIRMED`, `confidence: 0.87`
5. Vorschlag verschwindet aus dem „Vorgeschlagen"-Abschnitt, erscheint nun unter „Explizite Präferenzen" mit kleinem Robot-Icon als Herkunftshinweis

**Ignorieren-Flow:**
1. Admin klickt „Ignorieren"
2. `POST /api/admin/kunden/[id]/praeferenzen/[pid]/ignorieren`
3. Backend: `ignored=true` — Vorschlag wird bei nächsten GET-Aufrufen gefiltert (solange Präferenz nicht explizit)
4. Kein Audit-Log-Eintrag (keine sensible Aktion)

---

### Tech-Entscheidungen

**Warum implizite Präferenzen live berechnen statt Background-Job?**
→ PROJ-19 hat `productCategorySnapshot` bereits auf `OrderItem` — die DB-Aggregation (GROUP BY + COUNT über 90 Tage) dauert < 100ms bei typischen Kundenzahlen. Ein täglicher Cron würde komplexere Infrastruktur (Scheduler, Job-State, Error-Handling) erfordern, die für MVP nicht gerechtfertigt ist. PROJ-21 bringt ohnehin einen täglichen Cron für `CustomerMetrics` — wenn nötig, können implizite Präferenzen dort mit berechnet und gecacht werden.

**Warum dietTags per JOIN statt Snapshot?**
→ `Dish.dietTags` wird selten geändert (kein "Pizza wird plötzlich vegan"). Ein JOIN beim GET-Aufruf ist vertretbar. Snapshot würde bedeuten, jedes OrderItem um ein `dietTagsSnapshot`-Feld erweitern — Overengineering für MVP.

**Warum keine automatische Allergen-Ableitung?**
→ Allergien sind sicherheitsrelevant. Ein falscher Auto-Vorschlag (z.B. „kein Gluten" obwohl Kunde Zöliakie hat) könnte gesundheitliche Schäden verursachen. Allergene werden **ausschließlich** explizit eingetragen — niemals automatisch vorgeschlagen.

**Warum `DERIVED` als eigener PreferenceSource-Wert statt Boolean?**
→ `source` ist bereits der semantische Träger der Herkunftsinformation. Ein zusätzliches Boolean `isDerived` würde Redundanz erzeugen. `DERIVED` ist eine eigenständige Quelle — nach Bestätigung wechselt die Zeile zu `source: ADMIN`, der Ursprung bleibt im AuditLog erhalten.

**Warum `Metadata`-Tabelle als Allergen-Master-Liste?**
→ Die Tabelle ist bereits befüllt (12 Allergene, 8 Diätkategorien aus dem Seed). Single Source of Truth: Wenn die Kantine neue Allergene hinzufügen will, reicht ein DB-Eintrag ohne Code-Deployment.

**Warum `PreferenceAuditLog` als separate Tabelle?**
→ DSGVO-Anforderung: Admin-Änderungen an Gesundheitsdaten (Allergien) müssen unveränderlich protokolliert sein. Ein Soft-Delete auf `CustomerPreference` würde den Audittrail verzerren.

---

### Datenbank-Migrationen

1. Neue Tabelle `CustomerPreference` mit Index auf `(userId, type)` und `(userId, key)`
   - Neue Felder gegenüber ursprünglichem Design: `confidence Decimal? @db.Decimal(4,3)`, `ignored Boolean @default(false)`
2. Neue Tabelle `PreferenceAuditLog` mit Index auf `(userId, changedAt)`
   - Neues Feld: `confidence Decimal? @db.Decimal(4,3)` (Snapshot bei CONFIRMED)
3. Neues Enum `PreferenceType` (`EXPLICIT` | `IMPLICIT`)
4. Neues Enum `PreferenceSource` (`USER` | `ADMIN` | `SYSTEM` | **`DERIVED`**)
5. Neues Enum `PreferenceAction` (`ADDED` | `REMOVED` | **`CONFIRMED`**) — nur für AuditLog

### Dependencies

Keine neuen Packages nötig — alle UI-Komponenten (Badge, Button, Input) existieren bereits.
