# PROJ-22: CDP – Konsistente Kundensegmentierung

## Status: 🔵 Planned

## Kontext & Ziel

Kundensegmente (PROJ-4) und Kundenprofil (PROJ-18, PROJ-20, PROJ-21) entstanden in separaten Iterationen. Das führt zu **Inkonsistenz**: Im Profil werden Felder mit bestimmten Labels angezeigt (z. B. „Aktivitätsstatus: Schlafend"), die im Segment-Builder aber entweder unter anderem Namen oder gar nicht als Filterkriterium verfügbar sind. Admins können keine Segmente aus Daten bauen, die sie im Profil sehen — und umgekehrt sehen sie im Profil nicht, in welchen Segmenten ein Kunde ist.

**Ziel:** 100 % Konsistenz zwischen Kundenprofil und Segment-Builder. Jedes Feld, das im Profil angezeigt wird, muss als Segmentierungskriterium nutzbar sein — mit identischen Labels, Werten und Gruppenstrukturen. Zusätzlich ist die Verknüpfung bidirektional: Das Profil zeigt Segmentzugehörigkeit, der Segment-Builder zeigt Profil-konsistente Kundenvorschauen.

### Aufteilung

| ID | Name | Kurzbeschreibung |
|---|---|---|
| PROJ-22a | Attribut-Registry & Erweiterter Regel-Builder | Zentrales TypeScript-Konstanten-Objekt mit allen segmentierbaren Attributen; erweiterter Rule Builder in PROJ-4b mit Attribut-Gruppen, Labels und Operatoren die 1:1 dem Profil entsprechen |
| PROJ-22b | Bidirektionale Profil↔Segment-Verknüpfung | Kundenprofil zeigt Segmentzugehörigkeit; Segment-Builder zeigt Profil-konsistente Kundenvorschau |

## Abhängigkeiten

- Benötigt: PROJ-4b (Segment-Regeln & Zielgruppen) — PROJ-22a erweitert den dort definierten Regel-Builder
- Benötigt: PROJ-20 (Präferenzen & Allergien) — `CustomerPreference`-Tabelle als Live-Datenquelle
- Benötigt: PROJ-21 (Abgeleitete Merkmale) — `CustomerMetrics`-Tabelle als Pre-Computed-Datenquelle
- Benötigt: PROJ-18 (Golden Record & Admin UI) — Profil-Drawer als Container für Segmentzugehörigkeit

---

## User Stories

### PROJ-22a – Attribut-Registry & Erweiterter Regel-Builder

- Als **Kantinenmanager** möchte ich beim Erstellen eines Segments alle Felder, die ich auch im Kundenprofil sehe (Aktivitätsstatus, Tier, RFM-Segment, Churn-Risk, Präferenzen etc.) als Filterkriterium nutzen können, damit meine Segmentlogik exakt zu dem passt, was ich im Profil ablese.
- Als **Kantinenmanager** möchte ich Attribute in denselben Gruppen sehen wie im Profil (z. B. „Aktivität & Status", „Kundenwert", „RFM-Profil", „Trends", „Präferenzen"), damit ich schnell das richtige Kriterium finde.
- Als **Kantinenmanager** möchte ich bei Feldern mit bekannten Wertemengen (Enums wie Aktivitätsstatus, Tier; aber auch Referenzfelder wie Unternehmen oder Standort) immer einen **Dropdown** mit den tatsächlich verfügbaren Optionen sehen — niemals ein Freitext-Feld — damit ich keine ungültigen Werte eingeben kann und Tippfehler ausgeschlossen sind.
- Als **Kantinenmanager** möchte ich bei numerischen Feldern (z. B. LTV, Churn-Risk-Score) einen passenden Vergleichsoperator (≥, ≤, >, <, =) wählen und bei Präferenz-Feldern „ist gesetzt" / „ist nicht gesetzt" als Option haben.
- Als **Kantinenmanager** möchte ich bei der Segment-Vorschau sehen, wie viele Kunden die Regeln erfüllen, und das auch dann korrekt angezeigt bekommen, wenn eine Regel auf ein berechnetes Merkmal (CustomerMetrics) verweist — ohne Kunden ohne Merkmale fälschlicherweise einzuschließen.

### PROJ-22b – Bidirektionale Profil↔Segment-Verknüpfung

- Als **Kantinen-/Standortleitung** möchte ich im Kundenprofil sofort sehen, in welchen Segmenten der Kunde aktuell Mitglied ist, damit ich den Kontext von Kampagnen und Automation verstehe, ohne zwischen Profil und Segment-Übersicht wechseln zu müssen.
- Als **Kantinenmanager** möchte ich bei der Segment-Vorschau nicht nur eine Zahl sehen, sondern die ersten Kundenkarten mit denselben Labels wie im Profil (Aktivitätsstatus-Pill, Tier-Badge, LTV), damit ich prüfen kann, ob die Segmentlogik die richtigen Kunden trifft.
- Als **Kantinen-/Standortleitung** möchte ich im Kundenprofil per Klick auf ein Segment direkt zum Segment-Builder springen, damit ich die Kriterien nachvollziehen kann, warum dieser Kunde im Segment ist.

---

## Acceptance Criteria

### PROJ-22a – Attribut-Registry & Erweiterter Regel-Builder

#### Attribut-Registry (zentrales TypeScript-Objekt)

- [ ] Es existiert eine zentrale TypeScript-Konstante `SEGMENT_ATTRIBUTE_REGISTRY` (oder äquivalenter Mechanismus), die **alle segmentierbaren Attribute** definiert — mit folgenden Metadaten pro Attribut:
  - `key`: eindeutiger Attribut-Schlüssel (z. B. `activityStatus`, `ltv`, `diet_vegan`)
  - `label`: identisch mit dem Label im Profil-Drawer (z. B. „Aktivitätsstatus", „Lifetime Value", „Ernährungsweise: Vegan")
  - `group`: Attribut-Gruppe (identisch mit Profil-Tab-Sektionen, s. unten)
  - `type`: `ENUM` | `NUMERIC` | `PREFERENCE` | `REFERENCE`
  - `operators`: erlaubte Operatoren für diesen Typ (s. Operator-Definition)
  - `source`: `CUSTOMER_METRICS` (pre-computed) | `CUSTOMER_PREFERENCE` (live) | `USER` (live)
  - `enumValues` (nur bei `type: ENUM`): Array der möglichen Werte mit Label (z. B. `{ value: 'NEU', label: 'Neu' }`) — fest definiert, keine Freitext-Eingabe möglich
  - `loadOptionsFrom` (nur bei `type: REFERENCE`): API-Pfad, der die verfügbaren Optionen **zur Laufzeit** aus der DB lädt (z. B. `GET /api/admin/companies` → `[{ value: id, label: name }]`) — ebenfalls kein Freitext
  - `discreteRange` (optional bei `type: NUMERIC`): Wenn der Wertebereich klein und diskret ist (z. B. RFM-Score 1–5, Wochentag 0–6), wird im UI statt eines Freitext-Feldes ein **Stepper oder Dropdown** mit den möglichen Einzelwerten angeboten

- [ ] Die Attribut-Gruppen im Segment-Builder sind identisch mit den Profil-Tab-Sektionen:
  1. **Aktivität & Status** — aus CustomerMetrics: `activityStatus`, `daysSinceLastOrder`, `daysSinceRegistration`, `preferredDayOfWeek`, `preferredTimeSlot`
  2. **Kundenwert & Metriken** — aus CustomerMetrics: `ltv`, `avgOrderValue`, `orderFrequencyPerWeek`, `spend30d`, `totalOrders`, `customerTier`
  3. **RFM-Profil** — aus CustomerMetrics: `rfmSegment`, `rfmR`, `rfmF`, `rfmM`
  4. **Trends** — aus CustomerMetrics: `frequencyTrend`, `spendTrend`, `orders30d`
  5. **Risiko & Potenzial** — aus CustomerMetrics: `churnRiskScore`, `winBackScore`, `upsellScore`
  6. **Verhalten** — aus CustomerMetrics: `orderConsistencyScore`, `orderDiversityScore`, `lunchRegularityPct`, `avgLeadTimeHours`
  7. **Engagement & Kanal** — aus CustomerMetrics: `couponUsageRate`, `walletUsageRate`, `primaryChannel`, `channelLoyaltyPct`
  8. **Präferenzen & Allergene** — aus CustomerPreference: alle `ALLERGEN_*`-Keys und alle `DIET_*`-Keys
  9. **Stammdaten** — aus User: Registrierungsdatum, Rolle; **Unternehmen** (`REFERENCE`-Typ, Dropdown mit allen Unternehmen der Org), **Standort** (`REFERENCE`-Typ, Dropdown mit allen Standorten der Org) — bestehende PROJ-4b-Attribute, nun mit erzwungener Dropdown-Auswahl statt Freitext

#### Kein-Freitext-Prinzip

- [ ] **Kein Freitext-Eingabefeld für Felder mit bekannter Wertemenge** — dies gilt ausnahmslos für:
  - `ENUM`-Attribute: immer Dropdown/Multiselect mit den Werten aus `enumValues` der Registry
  - `REFERENCE`-Attribute: immer Dropdown mit Optionen aus dem jeweiligen API-Endpunkt (`loadOptionsFrom`); Optionen werden beim Öffnen der Regel-Zeile geladen
  - `NUMERIC`-Attribute mit `discreteRange`: Stepper oder Dropdown statt freiem Zahlenfeld (z. B. RFM-Scores 1–5, Wochentag Mo–So)
- [ ] Frei eingetippte Werte sind systemseitig **nicht** möglich — der Wert einer Regel kann ausschließlich über die vorgegebenen UI-Elemente gesetzt werden

#### Operator-Typen

- [ ] **ENUM-Attribute** unterstützen folgende Operatoren:
  - `=` (Wert ist gleich)
  - `IN` (Wert ist einer aus Liste)
  - `NOT_IN` (Wert ist keiner aus Liste)
  - Auswahl der Werte als Multiselect-Dropdown mit den Label-Texten aus der Registry (keine rohen Enum-Werte wie `RUECKLAEUFIG`)

- [ ] **NUMERIC-Attribute** unterstützen folgende Operatoren:
  - `=`, `>`, `>=`, `<`, `<=` (einfacher Vergleich mit einem Wert)
  - Eingabe-Feld zeigt die Einheit aus der Registry (z. B. „€" für LTV, „Tage" für daysSinceLastOrder, „%" für lunchRegularityPct × 100)

- [ ] **PREFERENCE-Attribute** unterstützen folgende Operatoren:
  - `HAS_SET` (Präferenz ist explizit oder bestätigt gesetzt)
  - `HAS_NOT_SET` (Präferenz ist nicht gesetzt oder ignoriert)
  - Kein Wert-Eingabefeld nötig (Operator allein reicht)

- [ ] **REFERENCE-Attribute** unterstützen folgende Operatoren:
  - `=` (Wert entspricht exakt einem Eintrag)
  - `IN` (Wert ist einer aus Liste)
  - `NOT_IN` (Wert ist keiner aus Liste)
  - Die Wertauswahl ist ausschließlich per Dropdown möglich; die Optionen werden beim Öffnen live vom `loadOptionsFrom`-Endpunkt geladen (z. B. alle Unternehmen der Organisation)

#### Evaluierungslogik

- [ ] Regeln auf `CUSTOMER_METRICS`-Attribute werden **pre-computed** ausgewertet: Die Segment-Berechnung filtert direkt auf der `CustomerMetrics`-Tabelle (kein Live-Compute)
- [ ] Regeln auf `CUSTOMER_PREFERENCE`-Attribute werden **live** ausgewertet: Die Segment-Berechnung JOINt die `CustomerPreference`-Tabelle
- [ ] **Kunden ohne `CustomerMetrics`-Eintrag werden bei Regeln auf Metrics-Attribute explizit ausgeschlossen** (sie erfüllen die Regel NICHT, auch wenn der Wert theoretisch unbekannt ist) — keine „null-satisfies"-Logik
- [ ] Kunden ohne passende `CustomerPreference`-Zeile erfüllen `HAS_NOT_SET`-Regeln (`HAS_SET` schlägt fehl)
- [ ] Mehrere Regeln werden standardmäßig mit **UND** verknüpft (bestehende PROJ-4b-Logik); ODER bleibt optional für MVP

#### Rule Builder UI

- [ ] Der Regel-Builder in PROJ-4b (Segment bearbeiten/erstellen) zeigt ein **Attribut-Dropdown** mit gruppierten Optionen (Gruppen-Header = Profil-Sektionsname, nicht auswählbar)
- [ ] Nach Auswahl eines Attributs erscheint ein **Operator-Dropdown** mit den erlaubten Operatoren für diesen Typ
- [ ] Nach Auswahl des Operators erscheint das passende Wert-Eingabe-Element — abhängig vom Attribut-Typ:
  - **ENUM**: Dropdown / Multiselect mit den Werten aus `enumValues` (Labels aus Registry, keine Rohwerte)
  - **REFERENCE**: Dropdown mit dynamisch geladenen Optionen von `loadOptionsFrom` (z. B. „Musterfirma GmbH", „TechCorp AG")
  - **NUMERIC (normal)**: Zahlenfeld mit Einheit aus Registry (z. B. „€", „Tage", „%")
  - **NUMERIC (discreteRange)**: Stepper oder Dropdown mit den diskreten Einzelwerten (z. B. Wochentag: Dropdown Mo–So; RFM-Score: Dropdown 1–5)
  - **PREFERENCE**: kein Wert-Element (Operator allein reicht)
- [ ] Es gibt **kein** Freitext-Eingabefeld für Felder, deren Wertemenge systemseitig bekannt ist — weder für Enums noch für Referenzdaten wie Unternehmen
- [ ] Bei Metrics-Attributen erscheint ein kleines Info-Icon mit Tooltip: „Basiert auf täglich berechneten Merkmalen. Kunden ohne berechnete Merkmale werden ausgeschlossen."
- [ ] Bei Preference-Attributen erscheint ein kleines Info-Icon mit Tooltip: „Wird live geprüft. Gilt nur für explizit hinterlegte oder bestätigte Präferenzen."
- [ ] Bei Reference-Attributen: Wenn der `loadOptionsFrom`-Endpunkt keine Optionen zurückgibt (z. B. noch keine Unternehmen angelegt), erscheint ein Hinweis „Keine Auswahl verfügbar" statt eines leeren Dropdowns

---

### PROJ-22b – Bidirektionale Profil↔Segment-Verknüpfung

#### Kundenprofil: Segmentzugehörigkeit

- [ ] Im Kundenprofil-Drawer (PROJ-18) gibt es in der Merkmale-Tab-Ansicht (oder als eigenständige Sektion) einen Bereich **„Mitglied in Segmenten"**
- [ ] Der Bereich listet alle Segmente, deren berechnete Zielgruppe den Kunden aktuell enthält
- [ ] Pro Segment wird angezeigt: Segment-Name, kurze Beschreibung (falls vorhanden), und ein „Zum Segment →"-Link der direkt zum Segment-Builder führt (`/admin/marketing/segments/[segmentId]`)
- [ ] Falls der Kunde in keinem Segment ist: „Dieser Kunde ist aktuell in keinem Segment." (kein leerer Bereich)
- [ ] Die Segmentzugehörigkeit wird **on-demand beim Profilaufruf** ausgewertet (kein Cache, um Aktualität zu gewährleisten); bei mehr als 20 Segmenten einer Org reichen die ersten 20 nach Segment-Name sortiert + Hinweis „und X weitere"
- [ ] Ladezeit für Segmentzugehörigkeit: maximal 500 ms (separater API-Call, nicht blockierend für Rest des Profils)

#### Segment-Builder: Profil-konsistente Kundenvorschau

- [ ] Die Segment-Vorschau im Regel-Builder zeigt neben der Gesamtanzahl eine Liste der **ersten 5 Kunden** im Segment
- [ ] Jede Kundenkarte in der Vorschau zeigt dieselben Felder und Labels wie im Profil:
  - Name + E-Mail
  - `activityStatus`-Pill (gleiche Farbe und Bezeichnung wie im Profil-Drawer)
  - `customerTier`-Badge (gleiche Bezeichnung)
  - `ltv` als „LTV: X,XX €"
  - Falls keine CustomerMetrics: „Keine Merkmale berechnet" (kein Absturz)
- [ ] Die Vorschau wird erst nach explizitem Klick auf „Vorschau berechnen" geladen (kein automatisches Live-Laden bei jeder Regel-Änderung)
- [ ] Ein „Alle X Kunden anzeigen" Link öffnet die gefilterte Kundenliste (`/admin/kunden?segmentId=...`)

---

## Edge Cases

- **Kein CustomerMetrics-Eintrag:** Wenn ein Admin eine Regel auf `activityStatus = "AKTIV"` definiert und ein Kunde noch nie Merkmale berechnet hatte → Kunde wird **nicht** ins Segment aufgenommen. Tooltip und Info-Icon in der Regel-Zeile weisen darauf hin.
- **Veraltete Merkmale:** `CustomerMetrics.calculatedAt` ist > 48h alt → Kunde kann im Profil mit Stale-Banner angezeigt werden, aber die Segment-Berechnung nutzt trotzdem den letzten gespeicherten Wert (kein automatischer Ausschluss allein wegen Alter)
- **Präferenz `HAS_NOT_SET` bei Neukunden:** Kunden ohne jede CustomerPreference-Zeile erfüllen alle `HAS_NOT_SET`-Regeln — das ist korrekt (sie haben nichts gesetzt), muss aber bei der Regeldefinition für Admins transparent sein
- **Enum-Label-Änderung:** Wenn in der Registry ein Label geändert wird (z.B. `RUECKLAEUFIG` → „Rückläufig"), muss das Label in gespeicherten Regeln nicht migriert werden — gespeichert wird immer der `value`, die Registry übersetzt bei der Anzeige
- **Großes Segment mit >1.000 Kunden:** Vorschau zeigt immer nur 5; Gesamtzahl wird separat berechnet (COUNT-Query, kein LIMIT-Problem)
- **Segment mit gemischten Datenquellen (Metrics UND Preferences):** Beide werden per JOIN kombiniert; Kunden ohne Metrics-Eintrag, die aber eine passende Preference haben, werden trotzdem ausgeschlossen sobald auch eine Metrics-Regel vorhanden ist
- **Löschung eines Segmentattributs:** Wenn `CustomerMetrics` in einer künftigen Migration ein Feld entfernt, muss die Registry das Attribut als `deprecated: true` markieren; bestehende Regeln mit dem Attribut zeigen eine Warnung „Dieses Attribut ist nicht mehr verfügbar — Regel bitte anpassen"
- **Admin öffnet Profil eines Kunden ohne Segmente:** „Mitglied in Segmenten"-Abschnitt zeigt den Leerstate — kein Spinner der ewig lädt
- **Mehrere ODER-Gruppen mit gemischten Quellen:** Für MVP ODER-Verknüpfung nicht unterstützt; falls ein Admin versucht ODER bei gemischten Quellen zu konfigurieren, erscheint ein Hinweis „ODER-Verknüpfung ist im MVP auf Regeln gleicher Datenquelle beschränkt"
- **Gelöschtes Unternehmen / Standort in bestehender Regel (REFERENCE-Typ):** Wenn ein Unternehmen gelöscht wird, das in einer Segment-Regel referenziert ist, zeigt der Regel-Builder eine Warnung: „Ausgewähltes Unternehmen existiert nicht mehr — Regel bitte aktualisieren". Die Regel bleibt technisch erhalten, die Segment-Berechnung schließt alle Kunden dieses Unternehmens aus (0 Treffer für dieses Kriterium), bis die Regel korrigiert wird.
- **Keine Unternehmen / Standorte in der Org vorhanden:** `loadOptionsFrom`-Endpunkt gibt leere Liste zurück → Dropdown zeigt „Keine Einträge verfügbar"; Hinweis: „Legen Sie zuerst ein Unternehmen an, um dieses Kriterium nutzen zu können"
- **Freitext-Versuch über API:** Falls ein API-Call versucht, einen nicht in der Registry definierten Wert in einer Regel zu speichern, gibt der Server 400 Bad Request zurück — keine Umgehung des Kein-Freitext-Prinzips über direkte API-Aufrufe

---

## Technische Anforderungen

### Attribut-Registry

- Zentrale TypeScript-Datei `lib/segment-attribute-registry.ts` (oder äquivalent) enthält `SEGMENT_ATTRIBUTE_REGISTRY` als unveränderliche Konstante
- Registry ist **Single Source of Truth** für Labels, Gruppen und Operatoren — sowohl der Segment-Builder als auch die Profil-Komponenten importieren Labels aus der Registry (kein Hardcoding in UI-Komponenten)
- Typen müssen mit Prisma-Typen kompatibel sein (z. B. `ActivityStatus`-Enum aus `@prisma/client`)

### API-Endpunkte (neu oder erweitert)

| Methode | Pfad | Beschreibung |
|---|---|---|
| `POST` | `/api/admin/segmente/preview` | Berechnet Vorschau: `{ count: number, customers: CustomerPreviewItem[] }` für eine Regel-Menge |
| `GET` | `/api/admin/kunden/[id]/segmente` | Gibt alle Segmente zurück, in denen der Kunde aktuell Mitglied ist |
| `GET` | `/api/admin/segmente/attribute` | Liefert die Registry als JSON (für potenzielle zukünftige dynamische Erweiterung) |
| `GET` | `/api/admin/companies` | Liefert alle Unternehmen der Org als `[{ value, label }]` für REFERENCE-Dropdown |
| `GET` | `/api/admin/locations` | Liefert alle Standorte der Org als `[{ value, label }]` für REFERENCE-Dropdown |

### Datenbank-Indizes (zusätzlich zu PROJ-21)

- Bestehende Indizes auf `CustomerMetrics (organizationId, *)` aus PROJ-21 sind ausreichend für Metrics-Attribute
- Zusätzlicher Index auf `CustomerPreference (userId, key, type)` für schnelle Preference-Auswertung (falls nicht bereits aus PROJ-20)

### Performance

- Segment-Vorschau-Query (COUNT + 5 Rows): < 300 ms für Organisationen mit bis zu 10.000 Kunden
- Segmentzugehörigkeit im Profil (`/api/admin/kunden/[id]/segmente`): < 500 ms (iteriert über alle Segmente der Org und prüft Zugehörigkeit)

---

## Out of Scope

- Echtzeit-Benachrichtigung wenn Kunde ein Segment betritt oder verlässt (→ PROJ-4d Workflows)
- Automatische Label-Synchronisation bei Datenbankmigrationen (→ manuelle Registry-Pflege)
- Kundenseitige Sicht auf Segmentzugehörigkeit (→ DSGVO-Prüfung erforderlich, späteres Feature)
- Numerische BETWEEN-Operatoren für MVP (→ Backlog)
- ODER-Verknüpfung über Datenquellen hinweg für MVP (→ Backlog)
- A/B-Test auf Segment-Ebene (→ PROJ-4 Backlog)

---

## Tech-Design (Solution Architect)

### Leitprinzip: Registry als Single Source of Truth

Die Inkonsistenz zwischen Profil und Segment-Builder entsteht dadurch, dass Labels an zwei verschiedenen Stellen gepflegt werden. Die Lösung ist einfach: **eine einzige Registry**, die von beiden Seiten importiert wird.

```
lib/segment-attribute-registry.ts
│
├── SEGMENT_ATTRIBUTE_REGISTRY  (TypeScript-Konstante)
│   ├── Gruppe: "Aktivität & Status"
│   │   ├── { key: "activityStatus", label: "Aktivitätsstatus", type: "ENUM",
│   │   │     source: "CUSTOMER_METRICS",
│   │   │     operators: ["=", "IN", "NOT_IN"],
│   │   │     enumValues: [
│   │   │       { value: "NEU", label: "Neu" },
│   │   │       { value: "AKTIV", label: "Aktiv" },
│   │   │       { value: "GELEGENTLICH", label: "Gelegentlich" },
│   │   │       { value: "SCHLAFEND", label: "Schlafend" },
│   │   │       { value: "ABGEWANDERT", label: "Abgewandert" }
│   │   │     ] }
│   │   ├── { key: "daysSinceLastOrder", label: "Tage seit letzter Bestellung",
│   │   │     type: "NUMERIC", unit: "Tage", source: "CUSTOMER_METRICS",
│   │   │     operators: ["=", ">", ">=", "<", "<="] }
│   │   └── ...
│   │
│   ├── Gruppe: "Kundenwert & Metriken"
│   │   ├── { key: "ltv", label: "Lifetime Value (LTV)", type: "NUMERIC",
│   │   │     unit: "€", source: "CUSTOMER_METRICS", operators: [">", ">=", "<", "<=", "="] }
│   │   ├── { key: "customerTier", label: "Kundenstufe", type: "ENUM",
│   │   │     source: "CUSTOMER_METRICS",
│   │   │     enumValues: [
│   │   │       { value: "STANDARD", label: "Standard" },
│   │   │       { value: "BRONZE",   label: "Bronze" },
│   │   │       { value: "SILBER",   label: "Silber" },
│   │   │       { value: "GOLD",     label: "Gold" },
│   │   │       { value: "PLATIN",   label: "Platin" }
│   │   │     ] }
│   │   └── ...
│   │
│   ├── Gruppe: "Präferenzen & Allergene"
│   │   ├── { key: "pref_diet_vegan", label: "Ernährungsweise: Vegan",
│   │   │     type: "PREFERENCE", source: "CUSTOMER_PREFERENCE",
│   │   │     preferenceKey: "DIET_VEGAN",
│   │   │     operators: ["HAS_SET", "HAS_NOT_SET"] }
│   │   ├── { key: "pref_allergen_gluten", label: "Allergen: Gluten",
│   │   │     type: "PREFERENCE", source: "CUSTOMER_PREFERENCE",
│   │   │     preferenceKey: "ALLERGEN_GLUTEN",
│   │   │     operators: ["HAS_SET", "HAS_NOT_SET"] }
│   │   └── ... (alle 14 EU-Allergene + Diätkategorien aus PROJ-20)
│   │
│   ├── Gruppe: "Stammdaten"  (bestehende PROJ-4b-Attribute, erweitert)
│   │   ├── { key: "companyId", label: "Unternehmen", type: "REFERENCE",
│   │   │     source: "USER",
│   │   │     operators: ["=", "IN", "NOT_IN"],
│   │   │     loadOptionsFrom: "/api/admin/companies"  }
│   │   │   // liefert: [{ value: "clxyz...", label: "Musterfirma GmbH" }, ...]
│   │   ├── { key: "locationId", label: "Standort", type: "REFERENCE",
│   │   │     source: "USER",
│   │   │     operators: ["=", "IN"],
│   │   │     loadOptionsFrom: "/api/admin/locations"  }
│   │   └── ... (weitere bestehende PROJ-4b-Attribute)
│   │
│   └── Beispiel discreteRange für RFM-Score:
│       { key: "rfmF", label: "RFM Frequency-Score", type: "NUMERIC",
│         source: "CUSTOMER_METRICS",
│         operators: ["=", ">", ">=", "<", "<="],
│         discreteRange: { min: 1, max: 5, step: 1 } }
│         // UI: Stepper 1–5 statt Freitext-Zahlenfeld
│
└── Helper-Funktionen:
    ├── getAttributeByKey(key): Attribut aus Registry
    ├── getGroupedAttributes(): Gruppierte Attribut-Liste für Dropdown
    ├── getLabelForEnumValue(key, value): Label für Enum-Wert
    └── getValueInputType(attribute): 'enum-select' | 'reference-select' | 'number' | 'stepper' | 'none'
```

### Evaluierungslogik für Segment-Regeln

Der bestehende Segment-Auswertungs-Service in PROJ-4b wird um zwei neue Evaluierungsstrategien erweitert:

```
SegmentEvaluator.evaluate(segment: Segment, organizationId: string):
│
├── Strategie A: CUSTOMER_METRICS-Regeln
│   → SQL-WHERE auf CustomerMetrics-Tabelle
│   → JOIN mit User (organizationId-Filter)
│   → Kunden OHNE CustomerMetrics-Eintrag werden gefiltert (INNER JOIN, nicht LEFT JOIN)
│   → Ergebnis: Set<userId>
│
├── Strategie B: CUSTOMER_PREFERENCE-Regeln
│   → HAS_SET: EXISTS-Subquery auf CustomerPreference
│   │          (type = 'EXPLICIT', key = preferenceKey, NOT ignored)
│   → HAS_NOT_SET: NOT EXISTS-Subquery
│   → Ergebnis: Set<userId>
│
├── Strategie C: USER-Regeln (bestehend aus PROJ-4b)
│   → Wie bisher, unverändert
│
└── Kombination:
    → Alle Strategien parallel ausführen
    → INTERSECT der resultierenden Sets (UND-Logik)
    → COUNT für Vorschau; zusätzlich TOP-5 mit CustomerMetrics-JOIN für Kundenvorschau
```

### Bidirektionale Verknüpfung: Implementierungsansatz

**Profil → Segmente (`GET /api/admin/kunden/[id]/segmente`):**
```
1. Lade alle Segmente der Org (nur ID + Name + Regeln)
2. Für jedes Segment: SegmentEvaluator.evaluate mit userId-Filter
   → Optimierung: Single-Query mit userId als zusätzlichen Filter
3. Rückgabe: Array<{ id, name, description }> der passenden Segmente
```

**Segmente → Profil (Kundenvorschau im Segment-Builder):**
```
1. SegmentEvaluator.evaluate(segment) → userIds (LIMIT 5 für Vorschau)
2. Für diese userIds: CustomerMetrics + User.name + User.email laden
3. Rückgabe: Array<CustomerPreviewItem> mit:
   { userId, name, email, activityStatus, customerTier, ltv }
4. Labels aus Registry für Anzeige (activityStatusConfig, tierConfig aus PROJ-21)
```

### Attribut-vollständigkeitstabelle (alle segmentierbaren Felder)

#### Aus CustomerMetrics (PROJ-21) — pre-computed, Quelle: `CUSTOMER_METRICS`

| Attribut-Key | Label | Typ | Operatoren |
|---|---|---|---|
| `activityStatus` | Aktivitätsstatus | ENUM | `=`, `IN`, `NOT_IN` |
| `daysSinceLastOrder` | Tage seit letzter Bestellung | NUMERIC | `>`, `>=`, `<`, `<=` |
| `daysSinceRegistration` | Tage seit Registrierung | NUMERIC | `>`, `>=`, `<`, `<=` |
| `preferredDayOfWeek` | Bevorzugter Bestelltag | ENUM | `=`, `IN` |
| `preferredTimeSlot` | Bevorzugter Zeitslot | ENUM | `=`, `IN` |
| `ltv` | Lifetime Value (LTV) | NUMERIC (€) | `>`, `>=`, `<`, `<=`, `=` |
| `avgOrderValue` | Ø Warenkorbwert | NUMERIC (€) | `>`, `>=`, `<`, `<=`, `=` |
| `orderFrequencyPerWeek` | Bestellfrequenz / Woche | NUMERIC | `>`, `>=`, `<`, `<=` |
| `spend30d` | Ausgaben letzte 30 Tage | NUMERIC (€) | `>`, `>=`, `<`, `<=` |
| `totalOrders` | Gesamtbestellungen | NUMERIC | `>`, `>=`, `<`, `<=`, `=` |
| `customerTier` | Kundenstufe | ENUM | `=`, `IN`, `NOT_IN` |
| `rfmSegment` | RFM-Segment | ENUM | `=`, `IN`, `NOT_IN` |
| `rfmR` | RFM Recency-Score | NUMERIC, discreteRange 1–5 | `>`, `>=`, `<`, `<=`, `=` |
| `rfmF` | RFM Frequency-Score | NUMERIC, discreteRange 1–5 | `>`, `>=`, `<`, `<=`, `=` |
| `rfmM` | RFM Monetary-Score | NUMERIC, discreteRange 1–5 | `>`, `>=`, `<`, `<=`, `=` |
| `frequencyTrend` | Bestellfrequenz-Trend | ENUM | `=`, `IN` |
| `spendTrend` | Ausgaben-Trend | ENUM | `=`, `IN` |
| `orders30d` | Bestellungen letzte 30d | NUMERIC | `>`, `>=`, `<`, `<=`, `=` |
| `churnRiskScore` | Churn-Risk-Score | NUMERIC (0–100) | `>`, `>=`, `<`, `<=` |
| `winBackScore` | Win-Back-Score | NUMERIC (0–100) | `>`, `>=`, `<`, `<=` |
| `upsellScore` | Upsell-Score | NUMERIC (0–100) | `>`, `>=`, `<`, `<=` |
| `orderConsistencyScore` | Konsistenz-Score | NUMERIC (0–100) | `>`, `>=`, `<`, `<=` |
| `orderDiversityScore` | Diversitäts-Score | NUMERIC (0–100) | `>`, `>=`, `<`, `<=` |
| `lunchRegularityPct` | Mittagsfrequenz | NUMERIC (0–100 %) | `>`, `>=`, `<`, `<=` |
| `avgLeadTimeHours` | Ø Vorlaufzeit | NUMERIC (Std.) | `>`, `>=`, `<`, `<=` |
| `couponUsageRate` | Coupon-Nutzungsrate | NUMERIC (0–100 %) | `>`, `>=`, `<`, `<=` |
| `walletUsageRate` | Wallet-Nutzungsrate | NUMERIC (0–100 %) | `>`, `>=`, `<`, `<=` |
| `primaryChannel` | Primärer Kanal | ENUM | `=`, `IN` |
| `channelLoyaltyPct` | Kanal-Loyalität | NUMERIC (0–100 %) | `>`, `>=`, `<`, `<=` |

> **Hinweis zu %-Feldern:** `lunchRegularityPct`, `couponUsageRate`, `walletUsageRate`, `channelLoyaltyPct` sind in der DB als Decimal 0.0–1.0 gespeichert. Die Registry definiert die Umrechnung für die UI (× 100 für Anzeige und Eingabe).

> **Hinweis zu ENUM-Werten der Aktivitätsgruppe:**
> - `preferredDayOfWeek` hat enumValues: `[{ value: 0, label: "Sonntag" }, { value: 1, label: "Montag" }, ..., { value: 6, label: "Samstag" }]` — kein Zahlen-Input
> - `preferredTimeSlot` hat enumValues: `[{ value: "BREAKFAST", label: "Frühstück" }, { value: "LUNCH", label: "Mittag" }, { value: "AFTERNOON", label: "Nachmittag" }, { value: "EVENING", label: "Abend" }]`
> - `primaryChannel` hat enumValues: `[{ value: "APP", label: "App" }, { value: "WEB", label: "Web" }, { value: "TERMINAL", label: "Terminal" }, { value: "KASSE", label: "Kasse" }, { value: "ADMIN", label: "Admin" }]`
> - `rfmR`, `rfmF`, `rfmM` sind NUMERIC mit `discreteRange { min: 1, max: 5, step: 1 }` — UI zeigt Stepper/Dropdown 1–5, kein Freitext

#### Aus Stammdaten (User/CompanyEmployee) — live, Quelle: `USER` — REFERENCE-Typ

| Attribut-Key | Label | Typ | Operatoren | loadOptionsFrom |
|---|---|---|---|---|
| `companyId` | Unternehmen | REFERENCE | `=`, `IN`, `NOT_IN` | `GET /api/admin/companies` |
| `locationId` | Standort (je Bestellung) | REFERENCE | `=`, `IN` | `GET /api/admin/locations` |

> REFERENCE-Attribute liefern Dropdown-Optionen dynamisch aus der Datenbank. Es sind ausschließlich die tatsächlich in der Organisation vorhandenen Unternehmen / Standorte wählbar — kein Freitext.

#### Aus CustomerPreference (PROJ-20) — live, Quelle: `CUSTOMER_PREFERENCE`

Alle 14 EU-Pflichtallergene + alle Diätkategorien aus der `Metadata`-Tabelle.

**Beispiele (vollständige Liste aus Metadata-Seed):**

| Attribut-Key | Label | Typ | Operatoren |
|---|---|---|---|
| `pref_allergen_gluten` | Allergen: Gluten | PREFERENCE | `HAS_SET`, `HAS_NOT_SET` |
| `pref_allergen_laktose` | Allergen: Laktose | PREFERENCE | `HAS_SET`, `HAS_NOT_SET` |
| `pref_allergen_nuesse` | Allergen: Nüsse | PREFERENCE | `HAS_SET`, `HAS_NOT_SET` |
| `pref_diet_vegan` | Ernährungsweise: Vegan | PREFERENCE | `HAS_SET`, `HAS_NOT_SET` |
| `pref_diet_vegetarisch` | Ernährungsweise: Vegetarisch | PREFERENCE | `HAS_SET`, `HAS_NOT_SET` |
| `pref_diet_halal` | Ernährungsweise: Halal | PREFERENCE | `HAS_SET`, `HAS_NOT_SET` |
| ... | ... | ... | ... |

> Die vollständige Liste wird zur Laufzeit aus der `Metadata`-Tabelle generiert (wie in PROJ-20 beschrieben) und dynamisch in die Registry gemergt — kein Hardcoding aller Allergene nötig.

### UI-Komponenten (grobe Struktur)

```
Segment-Builder (PROJ-4b erweitert):
│
├── Regel-Zeile (bestehend, erweitert):
│   ├── Attribut-Dropdown (NEU: gruppiert, Labels aus Registry)
│   ├── Operator-Dropdown (NEU: dynamisch nach Attribut-Typ)
│   ├── Wert-Eingabe (NEU: dynamisch je Typ — Enum-Dropdown / Reference-Dropdown / Zahlenfeld / Stepper 1–N / kein Feld bei PREFERENCE; niemals Freitext für bekannte Wertemengen)
│   └── Info-Icon mit Tooltip (Quelle + Ausschluss-Hinweis)
│
└── Vorschau-Bereich (PROJ-4b erweitert):
    ├── "Vorschau berechnen"-Button
    ├── Zahl: "X Kunden im Segment"
    ├── Kundenkarten-Liste (5 Stück, NEU: Profil-konsistente Labels)
    │   ├── Name + E-Mail
    │   ├── ActivityStatus-Pill (aus activityStatusConfig — PROJ-21)
    │   ├── CustomerTier-Badge (aus tierConfig — PROJ-21)
    │   └── LTV: "X,XX €"
    └── "Alle X Kunden anzeigen →"-Link

Kundenprofil-Drawer (PROJ-18/21 erweitert):
│
└── Merkmale-Tab oder separater Bereich:
    └── Sektion "Mitglied in Segmenten" (NEU)
        ├── Pro Segment: Name + Beschreibung + "Zum Segment →"-Link
        └── Leerstate: "Aktuell in keinem Segment"
```

### Reihenfolge der Umsetzung

1. **`lib/segment-attribute-registry.ts`** anlegen — pure TypeScript, keine DB-Calls, testbar
2. **REFERENCE-Endpunkte** (`GET /api/admin/companies`, `GET /api/admin/locations`) implementieren oder prüfen, ob bereits vorhanden
3. **Evaluierungslogik** in PROJ-4b-Segment-Service um Metrics-, Preference- und Reference-Strategien erweitern; serverseitige Wert-Validierung gegen Registry (kein Freitext)
4. **Rule Builder UI** in Segment-Formular erweitern (gruppiertes Dropdown, dynamische Operatoren, typ-spezifische Wert-Eingabe-Elemente — kein Freitext für bekannte Wertemengen)
5. **`GET /api/admin/kunden/[id]/segmente`** implementieren
6. **Vorschau-Erweiterung** im Segment-Builder (Kundenkarten mit Profil-Labels)
7. **Segmentzugehörigkeits-Sektion** im Kundenprofil-Drawer

### Abhängigkeiten (keine neuen Packages)

- Alle benötigten UI-Komponenten existieren (Badge, Pill, Card aus PROJ-21)
- Prisma-Typen für CustomerMetrics, CustomerPreference bereits vorhanden
- Kein neues Datenbank-Schema nötig (nur neue Query-Logik auf bestehenden Tabellen)

---

## Checklist (Requirements Engineer)

- [x] User Stories pro Sub-Feature definiert
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases dokumentiert
- [x] Feature-ID vergeben (PROJ-22, PROJ-22a, PROJ-22b)
- [x] Abhängigkeiten beschrieben (PROJ-4b, PROJ-20, PROJ-21, PROJ-18)
- [x] Scope und Out-of-Scope klar abgegrenzt
- [ ] User Review: Spec lesen und freigeben
