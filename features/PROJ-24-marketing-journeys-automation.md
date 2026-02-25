# PROJ-24: Marketing Journeys & Automation

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-4 (Kundensegmente) — für Segment-basierte Trigger & Bedingungen
- Benötigt: PROJ-7 (Template Library) — für Kanal-Aktionen (E-Mail, In-App, Push)
- Benötigt: PROJ-8 (Block-Editor) — Templates die in Journey-Steps verwendet werden
- Benötigt: PROJ-9 (E-Mail Versand) — für E-Mail-Steps
- Benötigt: PROJ-10 (In-App / Push) — für In-App / Push-Steps
- Benötigt: PROJ-4e (Coupons & Incentives) — für Incentive-Steps
- Benötigt: PROJ-6 (Wallet) — für Wallet-Guthaben-Trigger

---

## Kontext & Abgrenzung

Das bestehende `MarketingWorkflow`-Modell unterstützt nur **einen einzelnen Schritt** (1 Trigger → 1 Aktion). PROJ-24 ersetzt bzw. erweitert dieses Konzept um echte **Multi-Step Journeys** mit:
- visuellem Flow-Diagramm-Canvas
- mehreren Schritten pro Journey (Delays, Aktionen, Branches)
- konfigurierbaren Entry- und Exit-Regeln
- Conversion-Tracking

Das bestehende `MarketingWorkflow`-Feature bleibt für einfache Einzel-Automationen erhalten (z.B. Cron-basierte Segment-Aktionen). Journeys sind das neue, komplexere Konzept.

---

## Glossar

| Begriff | Bedeutung |
|---------|-----------|
| **Journey** | Ein vollständiger Automatisierungs-Ablauf mit mehreren Schritten |
| **Node / Tile** | Ein einzelner Schritt/Block innerhalb einer Journey |
| **Edge** | Die Verbindungslinie zwischen zwei Nodes |
| **Trigger** | Der Auslöser, durch den ein Nutzer eine Journey betritt |
| **Step** | Ausführbarer Schritt: Warten, Senden, Prüfen, Incentive |
| **Branch** | Ja/Nein-Aufspaltung basierend auf einer Bedingung |
| **Participant** | Nutzer, der sich aktuell in einer Journey befindet |
| **Conversion** | Erreichung des definierten Journey-Ziels |
| **Exit Rule** | Bedingung, die einen vorzeitigen Austritt aus der Journey auslöst |
| **Re-Entry** | Ob ein Nutzer dieselbe Journey erneut betreten darf |

---

## User Stories

### Admin — Journey erstellen & konfigurieren

- Als **Marketing-Admin** möchte ich eine neue Journey über einen **visuellen Canvas** aufbauen, damit ich den Ablauf intuitiv visualisieren und konfigurieren kann.

- Als **Marketing-Admin** möchte ich einer Journey einen **Trigger** (Event, Segment-Eintritt, Datum) zuweisen, damit klar definiert ist, wann ein Nutzer die Journey betritt.

- Als **Marketing-Admin** möchte ich **verschiedene Node-Typen** (Warten, Nachricht, Bedingung, Incentive) per Drag & Drop auf den Canvas ziehen und verbinden, damit ich flexible Abläufe erstellen kann.

- Als **Marketing-Admin** möchte ich für einen **Warten-Node** eine Wartezeit in Stunden oder Tagen konfigurieren, damit zwischen Steps eine Pause eingebaut werden kann.

- Als **Marketing-Admin** möchte ich für einen **Kanal-Node** (E-Mail, In-App, Push) ein bestehendes Template aus der Template-Bibliothek auswählen, damit ich keine neuen Inhalte erstellen muss.

- Als **Marketing-Admin** möchte ich einen **Bedingungsknoten** mit einer Ja/Nein-Bedingung konfigurieren (z.B. "Hat in den letzten 7 Tagen bestellt"), damit der Ablauf je nach Nutzerprofil unterschiedliche Wege nimmt.

- Als **Marketing-Admin** möchte ich einen **Incentive-Node** konfigurieren, der einem Nutzer automatisch einen Coupon oder Wallet-Guthaben gutschreibt.

- Als **Marketing-Admin** möchte ich **Exit-Regeln** definieren (z.B. "Exit wenn Nutzer bestellt hat" oder "Exit wenn Segment verlassen"), damit relevante Nutzer nicht mit überholten Nachrichten bespielt werden.

- Als **Marketing-Admin** möchte ich ein **Conversion Goal** (Ziel-Event) für die Journey setzen (z.B. "Erste Bestellung"), damit ich den Erfolg der Journey messen kann.

- Als **Marketing-Admin** möchte ich wählen, ob die Journey **ongoing** oder **zeitlich begrenzt** läuft (mit Start- und Enddatum).

- Als **Marketing-Admin** möchte ich das **Re-Entry-Verhalten** konfigurieren (nie, nach X Tagen, immer), damit ein Nutzer die Journey nicht mehrfach unnötig durchläuft.

- Als **Marketing-Admin** möchte ich eine Journey als **Entwurf** speichern und zu einem späteren Zeitpunkt aktivieren.

- Als **Marketing-Admin** möchte ich eine **bestehende Journey duplizieren** und als Basis für eine neue verwenden.

### Admin — Journey überwachen & auswerten

- Als **Marketing-Admin** möchte ich eine **Übersichtsliste** aller Journeys mit Status (Entwurf, Aktiv, Pausiert, Beendet) sowie KPIs (Teilnehmer, Conversion-Rate) sehen.

- Als **Marketing-Admin** möchte ich pro Journey eine **Teilnehmer-Übersicht** sehen: wie viele Nutzer sich in welchem Schritt befinden.

- Als **Marketing-Admin** möchte ich pro Journey sehen, wie viele Nutzer das **Conversion Goal** erreicht haben (absolut und prozentual).

- Als **Marketing-Admin** möchte ich eine Journey **pausieren** oder **stoppen**, ohne laufende Teilnehmer sofort zu entfernen.

- Als **Marketing-Admin** möchte ich einen **Ausführungslog** pro Journey einsehen (wann welcher Nutzer welchen Step ausgeführt hat, inkl. Fehler).

---

## Acceptance Criteria

### Journey-Verwaltung (CRUD)

- [ ] Admin kann unter `/admin/marketing/journeys` alle Journeys der Organisation sehen
- [ ] Journey-Liste zeigt: Name, Status-Badge, Trigger-Typ, Teilnehmeranzahl (aktiv), Conversion-Rate, Erstelldatum
- [ ] Admin kann neue Journey erstellen (Name, Beschreibung, Trigger, Ziel)
- [ ] Admin kann Journey als Entwurf speichern (Status: DRAFT)
- [ ] Admin kann Entwurf aktivieren → Status: ACTIVE (Validierung läuft)
- [ ] Admin kann aktive Journey pausieren → Status: PAUSED (keine neuen Eintritte, laufende Participants bleiben)
- [ ] Admin kann Journey archivieren → Status: ARCHIVED (kein Re-Aktivieren)
- [ ] Admin kann Journey duplizieren (neuer Entwurf mit gleichem Canvas-Inhalt)

### Canvas-Editor

- [ ] Canvas öffnet sich bei Klick auf "Journey bearbeiten"
- [ ] Node-Palette links zeigt alle verfügbaren Node-Typen (Trigger, Warten, E-Mail, In-App, Push, Bedingung, Incentive, Ende)
- [ ] Nodes können per Drag & Drop auf den Canvas gezogen werden
- [ ] Nodes können durch Ziehen von Port zu Port verbunden werden (gerichtete Kanten/Edges)
- [ ] Nodes können auf dem Canvas verschoben werden
- [ ] Nodes können gelöscht werden (mit Bestätigungsdialog wenn Teilnehmer im Node)
- [ ] Klick auf einen Node öffnet rechts ein Konfigurations-Panel
- [ ] Canvas unterstützt Pan (verschieben) und Zoom (scrollen)
- [ ] Canvas zeigt Live-Anzahl der Participants pro Node (wenn Journey aktiv)
- [ ] Canvas-Zustand wird als JSON im `content`-Feld der Journey gespeichert

### Node-Typen & Konfiguration

#### Start / Entry Node
- [ ] Jede Journey hat genau einen Start-Node
- [ ] Konfigurierbar: Trigger-Typ (Event | Segment-Eintritt | Datum-basiert)
- [ ] **Event-Trigger**: Auswahl aus: `user.registered`, `order.first`, `user.inactive`, `wallet.below_threshold`
- [ ] **Segment-Eintritt**: Dropdown auf vorhandene Kundensegmente
- [ ] **Datum-basiert**: `user.birthday` (Jahrestag), `days_since_registration` (X Tage nach Registrierung)
- [ ] Für `user.inactive`: Inaktivitätszeitraum konfigurierbar (7, 14, 30, 60 Tage ohne Bestellung)
- [ ] Für `wallet.below_threshold`: Schwellenwert in € konfigurierbar
- [ ] Für `days_since_registration`: Anzahl Tage konfigurierbar

#### Warten-Node (Delay)
- [ ] Wartezeit konfigurierbar: X Minuten / Stunden / Tage
- [ ] Optional: "Bis zu bestimmter Uhrzeit warten" (z.B. nächsten Montag 09:00 Uhr)

#### Kanal-Node (E-Mail / In-App / Push)
- [ ] Kanalauswahl: E-Mail, In-App Banner, Push Notification
- [ ] Template-Auswahl aus Template-Bibliothek (gefiltert nach Kanaltyp)
- [ ] Preview des gewählten Templates
- [ ] Für E-Mail: Absender-Name + Betreff überschreibbar (falls Template keinen hat)

#### Bedingungsknoten (Branch)
- [ ] Node hat zwei ausgehende Kanten: "Ja" (grün) und "Nein" (rot)
- [ ] Bedingungstypen:
  - Nutzer-Attribut: Feld-Vergleich (z.B. `loyaltyTier == 'GOLD'`)
  - Event-Check: "Hat Event X in den letzten Y Tagen ausgeführt" (z.B. `order` in 30 Tagen)
  - Segment-Zugehörigkeit: "Ist in Segment X"
  - Öffnungsrate: "Hat letzte E-Mail geöffnet" (wenn vorheriger Schritt E-Mail war)
- [ ] Bedingung wird zum Ausführungszeitpunkt des Nodes geprüft (dynamisch)

#### Incentive-Node
- [ ] Auswahl: Coupon (aus Incentive-Bibliothek) oder Wallet-Guthaben
- [ ] Für Wallet-Guthaben: Betrag in € konfigurierbar
- [ ] Für Coupon: Dropdown auf vorhandene Coupon-Definitionen
- [ ] Node schreibt Incentive automatisch gut (kein manueller Schritt)

#### Ende-Node
- [ ] Optionaler expliziter End-Node (Journey endet auch automatisch wenn kein weiterer Node folgt)
- [ ] Kann mehrfach auf Canvas existieren (für verschiedene Branch-Enden)

### Globale Journey-Einstellungen

- [ ] **Laufzeit**: Radio: "Ohne Ende" | "Mit Enddatum" (Datumsfeld erscheint)
- [ ] **Re-Entry**: Radio: "Nie" | "Nach X Tagen" (Zahlfeld) | "Immer"
- [ ] **Conversion Goal**: Optional — Event auswählen (`order.placed`, `wallet.topped_up`, etc.), Zeitfenster in Tagen
- [ ] **Exit-Regeln**: Mindestens eine Exit-Bedingung konfigurierbar:
  - Conversion Goal erreicht → automatisch Exit
  - Nutzer verlässt Segment → Exit
  - Custom Event tritt auf → Exit

### Ausführungs-Engine

- [ ] Hintergrund-Job prüft regelmäßig (min. alle 5 Minuten) neue Trigger-Ereignisse
- [ ] Nutzer der Trigger-Bedingung erfüllen, werden als `JourneyParticipant` angelegt
- [ ] Participants durchlaufen Steps sequentiell gemäß Canvas-Logik
- [ ] Delay-Nodes: Participant wird bis zum definierten Zeitpunkt "pausiert" und dann reaktiviert
- [ ] Branch-Nodes: Bedingung wird ausgewertet, Participant geht auf Ja- oder Nein-Pfad
- [ ] Bei Exit-Regel-Erfüllung: Participant erhält Status `EXITED`, keine weiteren Steps
- [ ] Bei Conversion: Participant erhält Status `CONVERTED`, Journey für diesen Nutzer beendet
- [ ] Fehler in einem Step: Participant erhält Status `FAILED`, Fehler wird geloggt
- [ ] Re-Entry-Prüfung: Vor jedem Neueintritt wird geprüft ob Re-Entry erlaubt ist

### Participant-Verwaltung & Analytics

- [ ] Journey-Detail-Seite zeigt Metrics: Eingetreten, Aktiv, Konvertiert, Beendet, Fehlgeschlagen
- [ ] Conversion-Rate = `CONVERTED / (CONVERTED + EXITED + FAILED)` (exkl. aktive Participants)
- [ ] Pro Node: Live-Counter der aktuell wartenden Participants
- [ ] Ausführungslog: Tabelle mit `Participant`, `Node`, `Zeitpunkt`, `Status`, `Details`
- [ ] Participant-Suche nach Nutzer-Name oder E-Mail
- [ ] Journey pausieren: Alle aktiven Participants bleiben im aktuellen Step "eingefroren"

---

## Edge Cases

1. **Nutzer löscht seinen Account** während er in einer aktiven Journey ist → Participant wird auf `EXITED` gesetzt, keine weiteren Steps
2. **Template wird gelöscht**, das in einem Journey-Step verwendet wird → Step schlägt fehl mit Fehler `TEMPLATE_NOT_FOUND`, Participant auf `FAILED`, Admin-Benachrichtigung
3. **Segment-Eintritt-Trigger** mit Batch-Eintritt (viele Nutzer gleichzeitig) → Batch-Insert der Participants, keine Duplikate (Unique Constraint auf `journeyId + userId` je nach Re-Entry-Einstellung)
4. **Zirkuläre Verbindungen** im Canvas → Validierung verhindert Aktivierung: "Zirkuläre Verweise sind nicht erlaubt"
5. **Journey ohne End-Node und End-Pfad** → Participant bleibt am letzten Node stehen und erhält nach 30 Tagen automatisch Status `EXITED`
6. **E-Mail-Versand schlägt fehl** (kein Consent, Bounce) → Step wird als `FAILED` geloggt, Participant läuft NICHT weiter (konfigurierbar: "Bei Fehler abbrechen" vs. "Weiterführen")
7. **Inaktivitäts-Trigger** für Nutzer die nie aktiv waren → Trigger feuert erst ab dem Datum der Registrierung + X Tage
8. **Wallet-Threshold-Trigger** feuert mehrfach für denselben Nutzer → Re-Entry-Einstellung entscheidet; ohne Re-Entry: zweiter Trigger wird ignoriert
9. **Journey wird deaktiviert** während Participants aktive Steps haben → Participants werden eingefroren (Status `PAUSED`), können bei Re-Aktivierung weiterlaufen
10. **Datum-basierter Trigger** (Geburtstag) ohne bekanntes Geburtsdatum → Nutzer wird übersprungen, kein Fehler
11. **Branch-Bedingung** referenziert gelöschtes Segment → Bedingung wird als `false` gewertet, Nutzer geht auf "Nein"-Pfad
12. **Zu viele Participants** (> 10.000 gleichzeitig aktiv) → Job verarbeitet in Batches von 500 Participants pro Lauf

---

## Technische Anforderungen

### Datenmodell (Prisma)

```prisma
enum JourneyStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

enum JourneyTriggerType {
  EVENT           // user.registered, order.first, user.inactive, wallet.below_threshold
  SEGMENT_ENTRY   // Nutzer tritt in Segment ein
  DATE_BASED      // user.birthday, days_since_registration
}

enum JourneyParticipantStatus {
  ACTIVE      // Aktuell in Journey
  CONVERTED   // Conversion Goal erreicht
  EXITED      // Vorzeitig ausgetreten
  COMPLETED   // Journey vollständig durchlaufen
  FAILED      // Fehler aufgetreten
  PAUSED      // Journey pausiert
}

model Journey {
  id              String            @id @default(cuid())
  organizationId  String
  name            String            @db.VarChar(200)
  description     String?           @db.Text
  status          JourneyStatus     @default(DRAFT)

  // Entry
  triggerType     JourneyTriggerType
  triggerConfig   Json              // { eventType, segmentId, days, threshold, ... }

  // Canvas (DAG)
  content         Json              // { nodes: Node[], edges: Edge[] }

  // Global Settings
  startDate       DateTime?         // null = ab sofort bei Aktivierung
  endDate         DateTime?         // null = kein Ende
  reEntryPolicy   String            @default("NEVER") @db.VarChar(20) // NEVER | AFTER_DAYS:X | ALWAYS
  conversionGoal  Json?             // { eventType, windowDays }
  exitRules       Json?             // [{ type: 'CONVERSION'|'SEGMENT_EXIT'|'EVENT', config }]

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  organization    Organization      @relation(...)
  participants    JourneyParticipant[]
  logs            JourneyLog[]

  @@index([organizationId, status])
  @@map("journeys")
}

model JourneyParticipant {
  id              String                    @id @default(cuid())
  journeyId       String
  userId          String
  status          JourneyParticipantStatus  @default(ACTIVE)
  currentNodeId   String?
  enteredAt       DateTime                  @default(now())
  convertedAt     DateTime?
  exitedAt        DateTime?
  nextStepAt      DateTime?                 // Für Delay-Nodes: wann weitermachen
  metadata        Json?                     // Tracking-Daten

  journey         Journey  @relation(...)
  user            User     @relation(...)
  logs            JourneyLog[]

  @@unique([journeyId, userId])  // Basis-Constraint, Re-Entry-Logik schlägt neue Participants an
  @@index([journeyId, status])
  @@index([nextStepAt])          // Für Delay-Job: welche Participants sind fällig?
  @@map("journey_participants")
}

model JourneyLog {
  id             String   @id @default(cuid())
  journeyId      String
  participantId  String?
  nodeId         String?
  eventType      String   @db.VarChar(50) // ENTERED | STEP_EXECUTED | CONVERTED | EXITED | FAILED
  status         String   @db.VarChar(20) // SUCCESS | FAILED | SKIPPED
  details        Json?
  createdAt      DateTime @default(now())

  journey     Journey             @relation(...)
  participant JourneyParticipant? @relation(...)

  @@index([journeyId, createdAt])
  @@index([participantId])
  @@map("journey_logs")
}
```

### Canvas-Node-Schema (JSON)

```typescript
interface CanvasNode {
  id: string          // Eindeutige Node-ID im Canvas
  type: NodeType      // 'start' | 'delay' | 'email' | 'inapp' | 'push' | 'branch' | 'incentive' | 'end'
  position: { x: number; y: number }
  config: NodeConfig  // Typ-spezifische Konfiguration (s.u.)
}

interface CanvasEdge {
  id: string
  source: string      // Node-ID
  sourceHandle: string // 'output' | 'yes' | 'no'
  target: string      // Node-ID
}

// Node-spezifische Config-Typen:
type NodeConfig =
  | StartNodeConfig
  | DelayNodeConfig
  | EmailNodeConfig
  | InAppNodeConfig
  | PushNodeConfig
  | BranchNodeConfig
  | IncentiveNodeConfig
  | EndNodeConfig

interface DelayNodeConfig {
  amount: number
  unit: 'minutes' | 'hours' | 'days'
  waitUntil?: { weekday: 0|1|2|3|4|5|6; hour: number } // Optional: Wartezeit bis Wochentag+Uhrzeit
}

interface EmailNodeConfig {
  templateId: string
  subjectOverride?: string
  senderNameOverride?: string
  onFailure: 'stop' | 'continue'
}

interface BranchNodeConfig {
  conditionType: 'attribute' | 'event' | 'segment' | 'email_opened'
  field?: string
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in'
  value?: string | number | string[]
  eventType?: string
  windowDays?: number
  segmentId?: string
}
```

### API-Routen

```
GET  /api/admin/marketing/journeys              — Liste aller Journeys
POST /api/admin/marketing/journeys              — Neue Journey erstellen

GET    /api/admin/marketing/journeys/[id]       — Journey-Detail
PUT    /api/admin/marketing/journeys/[id]       — Journey aktualisieren
DELETE /api/admin/marketing/journeys/[id]       — Journey löschen (nur DRAFT)
POST   /api/admin/marketing/journeys/[id]/activate  — Aktivieren (DRAFT → ACTIVE)
POST   /api/admin/marketing/journeys/[id]/pause     — Pausieren
POST   /api/admin/marketing/journeys/[id]/resume    — Fortsetzen
POST   /api/admin/marketing/journeys/[id]/duplicate — Duplizieren

GET  /api/admin/marketing/journeys/[id]/participants    — Participant-Liste
GET  /api/admin/marketing/journeys/[id]/logs            — Ausführungslog
GET  /api/admin/marketing/journeys/[id]/analytics       — Metrics & Conversion
```

### Performance
- Journey-Execution-Job: läuft alle 5 Minuten als Cron
- Batch-Größe: max. 500 Participants pro Job-Lauf
- Delay-Node: Index auf `nextStepAt` für effizientes Polling
- Canvas-JSON: max. 100 Nodes pro Journey (Soft-Limit mit Admin-Warnung)

### Canvas-Technologie
- Empfohlen: **React Flow** (`reactflow` npm package) — Open-Source, mit DnD, Zoom, Pan, Custom Nodes
- Nodes und Edges gespeichert als JSON im `content`-Feld der Journey
- Canvas rendert im Admin unter `/admin/marketing/journeys/[id]/canvas`

### Validierung bei Aktivierung
- [ ] Mindestens ein Start-Node vorhanden
- [ ] Start-Node hat mindestens eine ausgehende Kante
- [ ] Kein End-Node ohne eingehende Kante
- [ ] Alle Kanal-Nodes haben ein gültiges Template zugewiesen
- [ ] Alle Branch-Nodes haben Ja- und Nein-Pfad verbunden
- [ ] Keine Zyklen im Canvas (DAG-Validierung)
- [ ] Trigger-Konfiguration vollständig

---

## UI-Screens

| Screen | Route | Beschreibung |
|--------|-------|--------------|
| Journey-Liste | `/admin/marketing/journeys` | Alle Journeys der Organisation |
| Journey erstellen | Modal auf Liste | Name, Trigger-Typ, Grundkonfiguration |
| Canvas-Editor | `/admin/marketing/journeys/[id]/canvas` | Visueller Flow-Builder |
| Journey-Einstellungen | Tab im Canvas | Laufzeit, Re-Entry, Conversion Goal, Exit-Regeln |
| Journey-Analytics | `/admin/marketing/journeys/[id]/analytics` | Metrics, Participant-Status, Conversion |
| Ausführungslog | Tab in Analytics | Log-Tabelle mit Filter nach Zeitraum / Status |

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur — Was wiederverwendet wird

| Was | Wo vorhanden | Wiederverwendung in PROJ-24 |
|-----|-------------|----------------------------|
| Template-API | `/api/admin/marketing/templates` | Node-Config: Template-Auswahl für E-Mail / In-App / Push |
| Segment-API | `/api/admin/segments` | Trigger-Konfiguration & Branch-Bedingungen |
| Incentive-API | `/api/admin/marketing/incentives` | Incentive-Node: Coupon- und Wallet-Auswahl |
| E-Mail-Versand | `lib/email-service.ts` | E-Mail-Node-Ausführung |
| Push-Versand | `app/api/admin/marketing/push/send` | Push-Node-Ausführung |
| In-App-Nachrichten | `app/api/admin/marketing/in-app-messages` | In-App-Node-Ausführung |
| Workflow-Execution-Pattern | `app/api/admin/marketing/workflows/execute` | Vorlage für Journey-Execution-Job |
| UI-Muster (Tabs, Sheet, Dialog) | Alle bestehenden Marketing-Seiten | Journey-Liste und Analytics-Seite |
| recharts | Bereits installiert | KPI-Karten und Analytics |
| @dnd-kit | Bereits installiert | Wird NICHT für Journey-Canvas verwendet (React Flow übernimmt das) |

---

### Component-Struktur

```
/admin/marketing/journeys  (Journey-Übersicht)
├── JourneyListHeader
│   ├── "+ Neue Journey" Button → öffnet NeuJourneyModal
│   ├── Status-Filter (Alle / Aktiv / Entwurf / Pausiert)
│   └── Suchfeld
├── JourneyStatsBar
│   ├── Karte: Journeys gesamt
│   ├── Karte: Aktive Journeys
│   └── Karte: Participants aktiv (plattformweit)
├── JourneyGrid
│   └── JourneyCard  (eine pro Journey)
│       ├── Name + Status-Badge (farbcodiert)
│       ├── Trigger-Icon + Trigger-Beschreibung
│       ├── KPI-Zeile: Teilnehmer aktiv · Konversionsrate
│       ├── "Bearbeiten" → öffnet Canvas-Editor
│       └── Aktions-Menü (Pausieren / Duplizieren / Archivieren / Löschen)
└── NeuJourneyModal
    ├── Schritt 1: Name & Beschreibung
    ├── Schritt 2: Trigger-Typ wählen (Event / Segment-Eintritt / Datum)
    └── → Weiterleitung zum Canvas-Editor

/admin/marketing/journeys/[id]/canvas  (Canvas-Editor)
├── CanvasTopbar
│   ├── Zurück-Link zur Journey-Liste
│   ├── Journey-Name (klickbar → inline bearbeiten)
│   ├── Status-Badge
│   ├── "Einstellungen"-Button → öffnet SettingsPanel
│   ├── Validierungs-Anzeige (Fehler-Count beim Aktivieren)
│   ├── "Speichern"-Button
│   └── "Aktivieren"-Button (nur sichtbar wenn DRAFT, triggert Validierung)
├── NodePalette  (linke Sidebar, ~220px breit)
│   ├── Suchfeld
│   └── Gruppen:
│       ├── "Einstieg": Start-Node
│       ├── "Aktionen": E-Mail · In-App · Push · Incentive
│       ├── "Logik": Warten (Delay) · Bedingung (Branch)
│       └── "Ende": End-Node
│   (Nodes per Drag & Drop auf Canvas ziehen)
├── FlowCanvas  (Mittelteil, scrollbar/zoombar)  ← React Flow
│   ├── StartNode  (lila, oben, ein mal pro Journey)
│   ├── DelayNode  (grau, Uhr-Icon, "Warte 3 Tage")
│   ├── EmailNode  (blau, Brief-Icon, Template-Name)
│   ├── InAppNode  (violett, Glocke-Icon, Template-Name)
│   ├── PushNode   (grün, Smartphone-Icon, Template-Name)
│   ├── BranchNode (gelb, Gabel-Icon, zwei Ausgänge: JA / NEIN)
│   ├── IncentiveNode  (orange, Geschenk-Icon, "5€ Guthaben")
│   └── EndNode    (rot/dunkel, Ziel-Icon)
│   (Nodes verbinden durch Ziehen zwischen Ports)
│   (Live-Counter pro Node wenn Journey ACTIVE)
├── NodeConfigPanel  (rechte Sidebar, erscheint bei Node-Klick)
│   ├── StartNodeConfig
│   │   ├── Trigger-Typ (Dropdown)
│   │   └── Trigger-Parameter (je nach Typ: Event/Segment/Datum)
│   ├── DelayNodeConfig
│   │   ├── Anzahl + Einheit (Minuten / Stunden / Tage)
│   │   └── Optional: "Warten bis Wochentag + Uhrzeit"
│   ├── ChannelNodeConfig  (E-Mail / In-App / Push)
│   │   ├── Template-Picker (Dropdown mit Vorschau)
│   │   ├── (E-Mail) Betreff & Absender überschreiben
│   │   └── "Bei Fehler: Abbrechen / Weiterführen"
│   ├── BranchNodeConfig
│   │   ├── Bedingungstyp (Attribut / Event / Segment / E-Mail geöffnet)
│   │   └── Bedingungs-Builder (Feld · Operator · Wert)
│   └── IncentiveNodeConfig
│       ├── Typ: Coupon oder Wallet-Guthaben
│       └── Coupon-Dropdown / Betrag-Eingabe
└── SettingsPanel  (Slide-out rechts, über NodeConfigPanel gelegt)
    ├── Laufzeit: "Ohne Ende" / "Mit Enddatum"
    ├── Re-Entry: "Nie" / "Nach X Tagen" / "Immer"
    ├── Conversion Goal (optionales Ziel-Event + Zeitfenster)
    └── Exit-Regeln (Liste, "+Regel hinzufügen")

/admin/marketing/journeys/[id]/analytics  (Analyse & Überwachung)
├── AnalyticsHeader
│   ├── Journey-Name + Status-Badge
│   ├── Zeitraum-Filter (letzte 7 / 30 / 90 Tage)
│   └── "Journey bearbeiten" → Link zum Canvas
├── MetricsRow
│   ├── KPI: Eingetreten gesamt
│   ├── KPI: Aktive Participants
│   ├── KPI: Konvertiert
│   ├── KPI: Conversion-Rate (%)
│   └── KPI: Fehlgeschlagen
├── Tabs
│   ├── Tab "Participants"
│   │   └── ParticipantsTable (Nutzer · Status · Step · Eintrittsdatum · Konvertiert am)
│   └── Tab "Ausführungslog"
│       └── LogTable (Node · Zeitpunkt · Status · Details)
│           └── Filter: Zeitraum / Status / Nutzersuche
└── (Read-only Canvas mit Live-Countern, optional)
```

---

### Daten-Model (PM-freundlich)

**Neue Datenbank-Tabellen:**

```
Journey (Tabelle: journeys)
  Speichert die komplette Journey-Definition:
  → Name, Status (Entwurf / Aktiv / Pausiert / Archiviert)
  → Trigger-Typ und Trigger-Einstellungen (JSON)
  → Canvas-Inhalt: alle Nodes und Verbindungen als JSON-Objekt
  → Laufzeit: optionales Start- und Enddatum
  → Re-Entry-Regel: Nie / Nach X Tagen / Immer
  → Conversion-Ziel: optionales Ziel-Event mit Zeitfenster
  → Exit-Regeln: Liste von Austritts-Bedingungen

Journey Participant (Tabelle: journey_participants)
  Speichert jeden Nutzer der eine Journey durchläuft:
  → Welche Journey (Verknüpfung)
  → Welcher Nutzer (Verknüpfung)
  → Status: Aktiv / Konvertiert / Ausgetreten / Abgeschlossen / Fehler
  → Aktueller Node (wo steht der Nutzer gerade?)
  → Nächste-Aktion-um: Zeitstempel für Delay-Nodes
    (Der Execution-Job prüft: "Welche Participants sind jetzt fällig?")
  → Eintritts-, Austritts- und Konvertierungszeitpunkt

Journey Log (Tabelle: journey_logs)
  Vollständiges Protokoll aller Ausführungen:
  → Journey + Participant-Verknüpfung
  → Node-ID: Welcher Schritt wurde ausgeführt
  → Event-Typ: Eingetreten / Schritt ausgeführt / Konvertiert / Fehler
  → Status: Erfolg / Fehler / Übersprungen
  → Details: Fehlerdetails oder Ergebnis als JSON
```

**Kein Datenbank-Schema für den Canvas nötig:**
Der Canvas (Nodes + Verbindungen) wird als JSON-Objekt direkt im `content`-Feld der Journey gespeichert — genau wie bereits der Block-Editor (PROJ-8) Template-Inhalte speichert. React Flow kann sein Daten-Format direkt als JSON speichern und laden.

---

### Tech-Entscheidungen

**Warum React Flow für den Canvas?**
→ Spezialbibliothek für interaktive Flussdiagramme mit Nodes und Kanten. Liefert kostenlos: Drag & Drop von Nodes, Verbindungen ziehen, Zoom/Pan, Custom Node-Designs, Read-only-Modus für Analytics. Alternative (D3.js) wäre 5× mehr Eigenentwicklung.

**Warum @dnd-kit NICHT für den Journey-Canvas?**
→ @dnd-kit ist für Listen-DnD optimiert (wie im Block-Editor). Für einen 2D-Canvas mit Verbindungspfeilen ist React Flow die richtige Wahl. @dnd-kit bleibt für den Block-Editor (PROJ-8) erhalten.

**Warum Hintergrund-Job (Cron) statt Echtzeit?**
→ Echtzeit-Processing (< 1 Min) erfordert eine Message-Queue (Redis/Bull). Ein Cron-Job alle 5 Minuten reicht für Marketing-Automationen aus, ist deutlich einfacher und nutzt die bestehende Workflow-Execute-Route als Vorlage.

**Warum Canvas-Inhalt als JSON im Datenbankfeld?**
→ Gleiche Strategie wie im Block-Editor (PROJ-8): flexible Struktur ohne Migrations-Aufwand für jeden neuen Node-Typ. Der gesamte DAG (Nodes + Kanten) wird als ein JSON-Objekt gespeichert und von React Flow direkt konsumiert.

**Warum kein eigener Zustandsspeicher (Redux/Zustand)?**
→ React Flow bringt eigenen internen State-Manager mit (`useReactFlow`-Hook). Außerhalb des Canvas reicht React-useState, da die Journey-Daten per API geladen werden.

---

### Neue API-Routen (Übersicht)

```
/api/admin/marketing/journeys
  GET  — Alle Journeys der Organisation
  POST — Neue Journey erstellen

/api/admin/marketing/journeys/[id]
  GET    — Journey-Detail (inkl. Canvas-JSON + Einstellungen)
  PUT    — Canvas & Einstellungen speichern
  DELETE — Journey löschen (nur DRAFT)

/api/admin/marketing/journeys/[id]/activate   POST — DRAFT → ACTIVE (mit Validierung)
/api/admin/marketing/journeys/[id]/pause       POST — ACTIVE → PAUSED
/api/admin/marketing/journeys/[id]/resume      POST — PAUSED → ACTIVE
/api/admin/marketing/journeys/[id]/duplicate   POST — Klon als neuer DRAFT

/api/admin/marketing/journeys/[id]/participants  GET — Participant-Liste (mit Filter)
/api/admin/marketing/journeys/[id]/logs          GET — Ausführungsprotokoll
/api/admin/marketing/journeys/[id]/analytics     GET — KPI-Metriken

/api/admin/marketing/journeys/execute            POST — Cron-Job-Endpunkt (intern)
```

*Alle neuen Routen folgen dem bestehenden Muster mit `requireAdminRole()` und `getAdminContext()`.*

---

### Neue Dateien & Ordnerstruktur

```
app/
└── admin/marketing/journeys/
    ├── page.tsx                     ← Journey-Liste
    └── [id]/
        ├── canvas/page.tsx          ← Canvas-Editor
        └── analytics/page.tsx       ← Analyse & Log

app/api/admin/marketing/journeys/
    ├── route.ts                     ← GET Liste + POST Erstellen
    ├── execute/route.ts             ← Cron-Job-Endpunkt
    └── [id]/
        ├── route.ts                 ← GET / PUT / DELETE
        ├── activate/route.ts
        ├── pause/route.ts
        ├── resume/route.ts
        ├── duplicate/route.ts
        ├── participants/route.ts
        ├── logs/route.ts
        └── analytics/route.ts

components/marketing/journey/
    ├── JourneyCard.tsx              ← Karte in der Journey-Liste
    ├── canvas/
    │   ├── JourneyCanvas.tsx        ← React Flow Hauptkomponente
    │   ├── NodePalette.tsx          ← Linke Node-Auswahl-Sidebar
    │   ├── NodeConfigPanel.tsx      ← Rechte Konfigurations-Sidebar
    │   ├── SettingsPanel.tsx        ← Journey-Einstellungen (Slide-out)
    │   └── nodes/
    │       ├── StartNode.tsx
    │       ├── DelayNode.tsx
    │       ├── EmailNode.tsx
    │       ├── InAppNode.tsx
    │       ├── PushNode.tsx
    │       ├── BranchNode.tsx
    │       ├── IncentiveNode.tsx
    │       └── EndNode.tsx
    └── analytics/
        ├── JourneyMetricsRow.tsx
        ├── ParticipantsTable.tsx
        └── JourneyLogTable.tsx
```

---

### Dependencies

**Neu zu installieren:**
```
reactflow       — Journey Canvas (Nodes, Kanten, Zoom, Pan, Custom Nodes)
```

**Bereits vorhanden (keine Installation nötig):**
```
recharts        — KPI-Karten und Analytics-Charts
react-hook-form — Formulare in Node-Config-Panels
zod             — Validierung der Journey-Konfiguration beim Aktivieren
date-fns        — Datumsformatierung in Logs und Analytics
framer-motion   — Slide-in-Animationen für Config-Panels
sonner          — Toast-Benachrichtigungen (Speichern, Aktivieren, Fehler)
```

---

### Implementierungs-Reihenfolge (für Developer)

```
Phase 1 — Datenbasis
  1. Prisma-Schema: Journey, JourneyParticipant, JourneyLog hinzufügen
  2. Migration ausführen
  3. Basis-API-Routen: GET/POST Journeys, GET/PUT/DELETE [id]

Phase 2 — Canvas-Editor
  4. reactflow installieren
  5. JourneyCanvas.tsx mit Standard-React-Flow-Setup
  6. Alle 8 Custom Node-Komponenten
  7. NodePalette mit Drag-onto-Canvas
  8. NodeConfigPanel für jeden Node-Typ
  9. SettingsPanel (Laufzeit, Re-Entry, Exit-Regeln)
  10. Canvas-Speichern (PUT API)
  11. Aktivierungs-Validierung + activate/route.ts

Phase 3 — Execution-Engine
  12. execute/route.ts (Cron-Job-Logik)
  13. Trigger-Erkennung (Event / Segment / Datum)
  14. Step-Ausführung pro Node-Typ
  15. Delay-Node: nextStepAt setzen + reaktivieren
  16. Branch-Node: Bedingungsauswertung
  17. Exit-Regel-Prüfung

Phase 4 — UI & Analytics
  18. Journey-Listen-Seite
  19. Analytics-Seite mit Metrics und Participant-Tabelle
  20. Log-Tabelle mit Filter
```

---

## Nicht im Scope (Future Iterations)

- A/B-Split-Nodes (zwei ausgehende Pfade mit Prozent-Aufteilung)
- SMS-Kanal
- Tileset / wiederverwendbare Node-Gruppen
- Multi-Variate Testing
- Externes Webhook-Step (Call external API)
- Echtzeit-Streaming-Trigger (< 1 Minute Latenz)
- Visueller Funnel-Drop-Off-Chart pro Node
- Nutzer-seitige Journey-Verwaltung (Opt-out)
