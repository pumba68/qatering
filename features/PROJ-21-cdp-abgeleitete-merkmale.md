# PROJ-21: CDP – Abgeleitete Merkmale & Aktivitätsstatus

## Status: 🟢 Done

## Kontext & Ziel
Das System berechnet für jeden Kunden automatisch abgeleitete Merkmale: **Aktivitätsstatus** (Aktiv / Inaktiv / Neu / Schlafend / Abgewandert) und **Kundenwert** (Lifetime Value, Durchschnittlicher Warenkorbwert, Bestellfrequenz). Diese Merkmale sind **ausschließlich systemseitig berechnet** — kein Admin kann sie manuell überschreiben (FR-17). Sie sind die Grundlage für automatische Kundensegmentierung (PROJ-4) und strategische Entscheidungen.

## Abhängigkeiten
- Benötigt: PROJ-18 (Golden Record & Admin UI) – Merkmale erscheinen als Tab im Profil-Drawer
- Benötigt: PROJ-19 (Bestellhistorie) – alle Berechnungen basieren auf Bestelldaten
- Erweitert: PROJ-4 (Kundensegmente) – Segmentregeln können abgeleitete Merkmale als Filterkriterien referenzieren

---

## User Stories

- Als **Kantinen-/Standortleitung** möchte ich auf einen Blick sehen, ob ein Kunde aktiv, inaktiv oder abgewandert ist, um gezielte Rückgewinnungsmaßnahmen einleiten zu können.
- Als **Business / Analytics** möchte ich den Lifetime Value eines Kunden (Gesamtumsatz seit Registrierung) sehen, um den wirtschaftlichen Wert einzelner Gäste zu bewerten.
- Als **Business / Analytics** möchte ich die Bestellfrequenz (z. B. 3,2 Bestellungen/Woche) sehen, um Poweruser von Gelegenheitsnutzern zu unterscheiden.
- Als **Kantinen-/Standortleitung** möchte ich in der Kundenliste nach Aktivitätsstatus filtern (z. B. „Zeige alle Inaktiven seit 30 Tagen"), um Rückgewinnungskampagnen zu planen.
- Als **Systemadministration** möchte ich, dass alle abgeleiteten Merkmale automatisch täglich neu berechnet werden, ohne dass ein manueller Auslöser nötig ist.

---

## Acceptance Criteria

### Tab „Merkmale" im Kundenprofil-Drawer (PROJ-18)

#### Aktivitätsstatus
- [ ] Jeder Kunde hat genau einen der folgenden Status (systemseitig, nicht editierbar):
  - `Neu` — registriert, aber noch keine Bestellung (grau)
  - `Aktiv` — mindestens 1 Bestellung in den letzten 30 Tagen (grün)
  - `Gelegentlich` — letzte Bestellung vor 31–90 Tagen (gelb)
  - `Schlafend` — letzte Bestellung vor 91–180 Tagen (orange)
  - `Abgewandert` — letzte Bestellung vor mehr als 180 Tagen oder nie (rot)
- [ ] Status-Pill wird in der Kundenliste (PROJ-18) und im Drawer-Header angezeigt
- [ ] Hover-Tooltip auf dem Pill erklärt die Status-Definition (z. B. „Letzte Bestellung vor 45 Tagen")

#### Kundenwert-Kennzahlen (Read-only)
- [ ] **Lifetime Value (LTV):** Gesamtsumme aller bezahlten Bestellungen seit Registrierung
- [ ] **Durchschnittlicher Warenkorbwert:** LTV ÷ Gesamtanzahl Bestellungen
- [ ] **Bestellfrequenz:** Ø Bestellungen pro Woche (berechnet über aktive Wochen seit erster Bestellung)
- [ ] **Erster Kauf:** Datum der allerersten Bestellung
- [ ] **Letzter Kauf:** Datum der jüngsten Bestellung
- [ ] **Bestellanzahl gesamt:** absolut, alle Zeit
- [ ] Alle Kennzahlen sind klar als „Automatisch berechnet" gekennzeichnet; kein Edit-Icon, kein Edit-State

#### Zeitstempel & Transparenz
- [ ] Für jede abgeleitete Kenngröße wird angezeigt, wann sie zuletzt berechnet wurde (z. B. „Stand: heute 03:00 Uhr")
- [ ] Wenn die letzte Berechnung älter als 48h ist: gelbes Warning-Banner „Daten werden aktualisiert"

### Automatische Neuberechnung (Background-Job)
- [ ] Alle abgeleiteten Merkmale werden täglich (Cron, z. B. 03:00 Uhr) für alle Kunden der Organisation neu berechnet
- [ ] Berechnung läuft inkrementell (nur Kunden mit Bestellungen seit letztem Run werden neu berechnet)
- [ ] Ergebnis wird in dedizierter `CustomerMetrics`-Tabelle persistiert (kein Live-Compute bei Profilaufruf)
- [ ] Manueller Neuberechnungs-Trigger per Admin-Button möglich (nur für einzelnen Kunden, max. 1x/Stunde)

### Segmentierungs-Integration (PROJ-4)
- [ ] Segment-Regeln in PROJ-4 können folgende Merkmale referenzieren:
  - `aktivitaetsstatus = "ABGEWANDERT"`
  - `ltv > 500`
  - `bestellfrequenz < 1` (weniger als 1x/Woche)
  - `letzterKauf < 30 days ago`
- [ ] Segmentzugehörigkeit wird nach jeder Neubrechnung automatisch aktualisiert (FR-20)

---

## Edge Cases

- **Kein Kauf seit Registrierung:** Status = `Neu`; LTV = 0,00 €; alle anderen Kennzahlen = „–" (kein Null-Divisor-Fehler)
- **Stornierte Bestellungen:** Vollständig stornierte und erstattete Bestellungen werden im LTV nicht gezählt; Teilerstattungen reduzieren den LTV um den Erstattungsbetrag
- **Sehr kurze Mitgliedschaft:** Kunden, die erst heute registriert wurden → Bestellfrequenz nicht berechnet, Anzeige: „Zu wenig Daten (< 7 Tage)"
- **Manueller Neuberechnungs-Trigger:** Wenn der Admin den Button mehrfach klickt → Rate-Limit: max. 1 Neuberechnung pro Kunde pro Stunde; danach Button deaktiviert mit Countdown
- **Status-Transition:** Wenn ein `Abgewandert`-Kunde erneut bestellt → Status springt sofort auf `Aktiv` bei nächster Berechnung; keine manuelle Freigabe nötig
- **Berechnungsfehler:** Wenn der Background-Job fehlschlägt → bestehende Werte bleiben sichtbar (Stale-Data), kein Löschen alter Werte; Admin-Benachrichtigung via System-Log
- **Negatives LTV:** Theoretisch möglich bei Übererstattung → wird als 0,00 € gedeckelt und mit Hinweis-Icon versehen

---

## Technische Anforderungen

- Neue Tabelle `CustomerMetrics` mit Feldern: `userId`, `organizationId`, `activityStatus`, `ltv`, `avgOrderValue`, `orderFrequencyPerWeek`, `totalOrders`, `firstOrderAt`, `lastOrderAt`, `calculatedAt`
- Background-Job: Cron-Funktion (z. B. Vercel Cron oder DB-basierter Scheduler), täglich 03:00 Uhr
- Status-Berechnung basiert ausschließlich auf `lastOrderAt` (kein ML, kein komplexes Scoring)
- API-Endpunkte:
  - `GET /api/admin/kunden/[id]/merkmale` — liest aus `CustomerMetrics`
  - `POST /api/admin/kunden/[id]/merkmale/recalculate` — manueller Trigger (Rate-Limited)
- Index auf `CustomerMetrics.organizationId`, `CustomerMetrics.activityStatus` für Listenfilterung
- Performance: Kennzahlen-Abfrage < 100 ms (da pre-computed, kein Live-Aggregat)

---

## Out of Scope
- ML-basiertes Churn-Scoring (→ Later)
- Automatische Trigger / Notifications bei Status-Wechsel (→ Marketing Automation, späteres Feature)
- Vergleich gegen Org-Durchschnitt / Benchmarking (→ Analytics-Feature)
- Manuelle Überschreibung von Status oder Kennzahlen (explizit ausgeschlossen, FR-17)

---

## Tech-Design (Solution Architect)

### Leitfrage: Welche Fragen müssen die Merkmale beantworten?

Jedes Merkmal muss mindestens eine konkrete Geschäftsfrage beantworten und zu einer Handlung führen:

| Geschäftsfrage | Merkmal | Mögliche Maßnahme |
|---|---|---|
| Wer sind meine wertvollsten Kunden? | Customer Tier + LTV | VIP-Kommunikation, Treueprogramm |
| Wer ist kurz davor abzuwandern? | Churn-Risk-Score | Rückgewinnungs-Coupon automatisch auslösen |
| Welchen abgewanderten Kunden lohnt es sich am meisten zurückzugewinnen? | Win-Back-Score | Priorisierte Re-Engagement-Kampagne |
| Wer bestellt zuverlässig, könnte aber mehr ausgeben? | Upsell-Score | Personalisierter Upgrade-Vorschlag |
| Ist ein Kunde gerade aktiver oder inaktiver als üblich? | Trend (WACHSEND / RÜCKLÄUFIG) | Belohnung für Wachstum, Reaktivierungsmail bei Rückgang |
| Wie treu ist ein Kunde (Loyalität vs. Abwechslungssuche)? | Diversitäts-Score | Treue-Reward vs. Entdeckungs-Push |
| Bestellt der Kunde regelmäßig oder sporadisch? | Konsistenz-Score | Abo-Angebot vs. Impulskampagne |
| Wie intensiv nutzt der Kunde Kantinen-Features? | Engagement-Score | Feature-Onboarding, Wallet-Auffüllung |

---

### Merkmal-Taxonomie

Die Merkmale sind in **6 Kategorien** eingeteilt:

```
CustomerMetrics
│
├── 1. Aktivitäts-Merkmale      (wann war der Kunde zuletzt da?)
├── 2. Wert-Merkmale            (was ist er wirtschaftlich wert?)
├── 3. RFM-Profil               (Recency · Frequency · Monetary — Marketing-Standard)
├── 4. Trend-Merkmale           (entwickelt er sich positiv oder negativ?)
├── 5. Verhaltens-Merkmale      (wie und was bestellt er?)
└── 6. Engagement-Merkmale      (nutzt er das gesamte Angebot?)
```

---

### Kategorie 1: Aktivitäts-Merkmale

| Merkmal | Feld | Formel / Regel | Verwendung |
|---|---|---|---|
| **Aktivitätsstatus** | `activityStatus` | Tage seit letzter Bestellung: NEU=0 Bestellungen, AKTIV≤30, GELEGENTLICH 31–90, SCHLAFEND 91–180, ABGEWANDERT >180 | Statusanzeige, Segmentfilter |
| **Tage seit letzter Bestellung** | `daysSinceLastOrder` | `today - lastOrderAt` | Grundlage für alle Recency-Berechnungen |
| **Tage seit Registrierung** | `daysSinceRegistration` | `today - user.createdAt` | Kundenlaufzeit, Kohorten-Analyse |
| **Bevorzugter Wochentag** | `preferredDayOfWeek` | Wochentag mit den meisten Bestellungen (0=So – 6=Sa) | "Bestell-Reminder" am Lieblingstag senden |
| **Bevorzugter Zeitslot** | `preferredTimeSlot` | BREAKFAST / LUNCH / AFTERNOON / EVENING | Zeitgesteuertes Marketing |

**Aktivitätsstatus-Definitionen (detailliert):**
```
NEU         — Registriert, 0 Bestellungen
AKTIV       — ≥1 Bestellung in den letzten 30 Tagen
GELEGENTLICH— Letzte Bestellung vor 31–90 Tagen
SCHLAFEND   — Letzte Bestellung vor 91–180 Tagen
ABGEWANDERT — Letzte Bestellung vor >180 Tagen ODER keine Bestellung seit >90 Tagen seit Registrierung
```

---

### Kategorie 2: Wert-Merkmale

| Merkmal | Feld | Formel | Verwendung |
|---|---|---|---|
| **Lifetime Value (LTV)** | `ltv` | Σ `finalAmount` aller PICKED_UP-Bestellungen (non-refunded) | Kundenwert-Ranking |
| **Ø Warenkorbwert (AOV)** | `avgOrderValue` | `ltv / totalOrders` | Upsell-Indikator |
| **Bestellfrequenz** | `orderFrequencyPerWeek` | `totalOrders / max(1, weeksSinceFirstOrder)` | Loyalitätsindikator |
| **Ausgaben letzte 30 Tage** | `spend30d` | Σ `finalAmount` der letzten 30 Tage | Aktiver Umsatzbeitrag |
| **Gesamtbestellungen** | `totalOrders` | COUNT non-cancelled orders | Basismetrik |
| **Customer Tier** | `customerTier` | LTV-basiertes Tier (s. Tabelle unten) | Kommunikationsstufe, Priorisierung |

**Customer Tier Schwellenwerte (konfigurierbar, initiale Werte):**

| Tier | Feld-Wert | LTV-Schwelle | Bedeutung |
|---|---|---|---|
| Standard | `STANDARD` | < 100 € | Neukunde oder Gelegenheitsgast |
| Bronze | `BRONZE` | 100–499 € | Regelmäßiger Gast |
| Silber | `SILBER` | 500–1.499 € | Treuer Stammkunde |
| Gold | `GOLD` | 1.500–4.999 € | Hochwertkunde |
| Platin | `PLATIN` | ≥ 5.000 € | VIP / Poweruser |

---

### Kategorie 3: RFM-Profil (Marketing-Standard)

**RFM** ist das Standard-Framework für Kundensegmentierung im CRM. Es kombiniert drei Dimensionen zu einem Gesamtprofil.

| Dimension | Was es misst | Score 1–5 |
|---|---|---|
| **R** ecency | Wie lange her ist die letzte Bestellung? | 5 = ≤7 Tage, 4 = ≤30, 3 = ≤60, 2 = ≤120, 1 = >120 Tage |
| **F** requency | Wie oft bestellt der Kunde pro Woche? | 5 = ≥3/Woche, 4 = ≥1.5, 3 = ≥0.75, 2 = ≥0.25, 1 = <0.25 |
| **M** onetary | Wie hoch ist der Kundenwert (LTV)? | Org-relative Quintile (Top 20% = 5, etc.) |

**RFM-Segments (aus Kombination abgeleitet):**

| Segment | Feld-Wert | RFM-Profil | Marketing-Maßnahme |
|---|---|---|---|
| Stammkunde / Champion | `CHAMPION` | R≥4, F≥4, M≥4 | VIP-Kommunikation, Early Access zu neuen Gerichten |
| Treuer Kunde | `LOYAL` | R≥3, F≥3, M≥3 | Treue-Reward, Meilensteinkommunikation |
| Aufstrebender | `POTENTIAL` | R≥4, F≤2, M≤2 | Frequenzsteigerung durch Abo-Angebot, Entdecker-Push |
| Schläft ein | `NEEDS_ATTENTION` | R=3, F≥3, M≥3 | Erinnerungs-Push: „Lange nicht gesehen – was Neues für dich" |
| Risiko-Kunde | `AT_RISK` | R=2–3, F≥3, M≥3 | Win-Back-Coupon, persönliche Ansprache |
| Verlorener Champion | `CANT_LOSE` | R≤2, F≥4, M≥4 | Höchste Priorität für Win-Back, Direktkontakt |
| Hibernator | `HIBERNATING` | R≤2, F≤2, M≤2 | Günstige Re-Engagement-Kampagne |
| Neukunde | `NEW_CUSTOMER` | Erste Bestellung ≤ 30 Tage | Onboarding-Kampagne, Einführungsangebot |

**Felder:** `rfmR`, `rfmF`, `rfmM` (je Int 1–5), `rfmSegment` (Enum)

---

### Kategorie 4: Trend-Merkmale

Trends zeigen, ob sich ein Kunde **aktuell positiv oder negativ entwickelt** — unabhängig vom absoluten Wert.

| Merkmal | Feld | Formel | Verwendung |
|---|---|---|---|
| **Bestellfrequenz-Trend** | `frequencyTrend` | Bestellungen letzte 30d vs. vorherige 30d: WACHSEND (+≥25%), STABIL, RÜCKLÄUFIG (-≥25%) | Früh-Warnsystem für Abwanderung |
| **Ausgaben-Trend** | `spendTrend` | `spend30d` vs. `spend30dPrev`: gleiche Schwellen | Umsatz-Früh-Warnung |
| **Bestellungen letzte 30d** | `orders30d` | COUNT Bestellungen letzte 30 Tage | Trendberechnung |
| **Bestellungen vorherige 30d** | `orders30dPrev` | COUNT Bestellungen Tage 31–60 | Trendberechnung |
| **Ausgaben vorherige 30d** | `spend30dPrev` | Σ `finalAmount` Tage 31–60 | Trendberechnung |

**Trendberechnung:**
```
pctChange = (aktuell - vorherige) / max(1, vorherige)
WACHSEND   wenn pctChange > +0.25
STABIL     wenn -0.25 ≤ pctChange ≤ +0.25
RÜCKLÄUFIG wenn pctChange < -0.25
```

---

### Kategorie 5: Verhaltens-Merkmale

Diese Merkmale beschreiben **wie** und **was** der Kunde bestellt — jenseits von Umsatzzahlen.

| Merkmal | Feld | Formel | Verwendung |
|---|---|---|---|
| **Churn-Risk-Score** | `churnRiskScore` | 0–100, formelbasiert (s. unten) | Automatische Segmentierung, Trigger für Retention-Kampagne |
| **Win-Back-Score** | `winBackScore` | 0–100 (nur für ABGEWANDERT), höher = höhere Rückgewinnungspriorität | Priorisierte Re-Engagement-Liste |
| **Upsell-Score** | `upsellScore` | 0–100, höher = größeres Potenzial für höheren Warenkorb | Personalisierter Upgrade-Vorschlag |
| **Konsistenz-Score** | `orderConsistencyScore` | 0–100: 100 = extrem regelmäßig (tägl. Besteller), 0 = völlig zufällig | Abo-Angebot (hoher Score), Impulskampagne (niedriger Score) |
| **Diversitäts-Score** | `orderDiversityScore` | 0–100: 100 = probiert immer Neues, 0 = bestellt immer das Gleiche | Entdeckungs-Push vs. Lieblingsgerichte-Highlights |
| **Mittagsfrequenz** | `lunchRegularityPct` | Werktage mit Bestellung / alle Werktage seit erster Bestellung (0.0–1.0) | „Beinahe täglich hier" Loyalty-Kommunikation |
| **Ø Vorlaufzeit** | `avgLeadTimeHours` | Ø Stunden zwischen `order.createdAt` und `order.pickupDate` | Last-Minute-Besteller vs. Vorausplaner → Push-Timing optimieren |

**Formeln im Detail:**

**Churn-Risk-Score (0–100):**
```
score = 0

// Recency-Komponente (max. 40 Punkte)
if daysSinceLastOrder > 90:  score += 40
elif daysSinceLastOrder > 60: score += 30
elif daysSinceLastOrder > 30: score += 15
elif daysSinceLastOrder > 14: score += 5

// Frequenz-Rückgang (max. 35 Punkte)
if frequencyTrend == RÜCKLÄUFIG:
  drop = (orders30dPrev - orders30d) / max(1, orders30dPrev)
  score += min(35, round(drop * 50))

// Ausgaben-Rückgang (max. 25 Punkte)
if spendTrend == RÜCKLÄUFIG:
  drop = (spend30dPrev - spend30d) / max(1, spend30dPrev)
  score += min(25, round(drop * 35))

// Deckel
churnRiskScore = min(100, score)
```

**Win-Back-Score (0–100, nur für ABGEWANDERT):**
```
// Kombiniert historischen Wert + Urgency (wie lange schon weg?)
ltv_score    = min(50, ltv / 200 * 50)          // max. 50 Punkte bei LTV ≥ 200 €
urgency_score = daysSinceLastOrder < 365 ? 30 : 15  // Frischere Abwanderung = höhere Priorität
tier_bonus    = { PLATIN: 20, GOLD: 15, SILBER: 10, BRONZE: 5, STANDARD: 0 }[customerTier]

winBackScore = min(100, ltv_score + urgency_score + tier_bonus)
```

**Upsell-Score (0–100):**
```
// Ziel: Kunden die oft bestellen, aber unter Durchschnitt ausgeben → höchstes Potenzial
// org_avg_aov = Ø AOV aller Kunden der Organisation (gecacht)
aov_gap    = max(0, 1 - (avgOrderValue / org_avg_aov))  // 0 = schon über Durchschnitt
freq_score = min(1, orderFrequencyPerWeek / 3.0)         // normiert auf 0–1 bei max. 3/Woche

upsellScore = round((aov_gap * 0.6 + freq_score * 0.4) * 100)
```

**Konsistenz-Score (0–100):**
```
// Standardabweichung der Tage zwischen aufeinanderfolgenden Bestellungen
// Niedrige StdDev = konsistent = hoher Score
if totalOrders < 3: consistencyScore = null  // zu wenig Daten
else:
  intervals = [daysBetween(order[i], order[i-1]) for i in range(1, n)]
  stdDev = standardDeviation(intervals)
  avgInterval = mean(intervals)
  // Normierung: 0 StdDev = 100, StdDev ≥ 2 * avgInterval = 0
  consistencyScore = max(0, min(100, round(100 - (stdDev / max(1, avgInterval * 2)) * 100)))
```

**Diversitäts-Score (0–100):**
```
// Misst Vielfalt der Produktauswahl relativ zu den Bestellungen
uniqueProducts = COUNT DISTINCT productNameSnapshot
totalOrderedItems = COUNT OrderItems
// Verhältnis: 1.0 = immer verschiedenes, 0 = immer dasselbe
diversityRatio = min(1, uniqueProducts / max(1, totalOrderedItems))
diversityScore = round(diversityRatio * 100)
```

---

### Kategorie 6: Engagement-Merkmale

| Merkmal | Feld | Formel | Verwendung |
|---|---|---|---|
| **Coupon-Nutzungsrate** | `couponUsageRate` | Bestellungen mit Coupon / Gesamtbestellungen (0.0–1.0) | Coupon-Sensitivity: Preiselastizität des Kunden |
| **Wallet-Nutzung** | `walletUsageRate` | Bestellungen mit Wallet-Zahlung / Gesamtbestellungen (0.0–1.0) | Feature-Adoption; Wallet-Ladeaktionen für hohe Nutzer |
| **Primärer Kanal** | `primaryChannel` | Häufigster Kanal (APP / WEB / TERMINAL / KASSE / ADMIN) | Kanal-spezifisches Marketing |
| **Kanal-Loyalität** | `channelLoyaltyPct` | Bestellungen über Primary Channel / Gesamtbestellungen (0.0–1.0) | Single-Channel = gut für Push-Kampagnen |

---

### Prisma Schema — `CustomerMetrics` Tabelle (vollständig)

```prisma
enum ActivityStatus {
  NEU
  AKTIV
  GELEGENTLICH
  SCHLAFEND
  ABGEWANDERT
}

enum CustomerTier {
  STANDARD
  BRONZE
  SILBER
  GOLD
  PLATIN
}

enum RfmSegment {
  NEW_CUSTOMER
  CHAMPION
  LOYAL
  POTENTIAL
  NEEDS_ATTENTION
  AT_RISK
  CANT_LOSE
  HIBERNATING
}

enum TrendDirection {
  WACHSEND
  STABIL
  RUECKLAEUFIG
}

model CustomerMetrics {
  id              String   @id @default(cuid())
  userId          String   @unique
  organizationId  String

  // ─── Aktivität ─────────────────────────────────────────────────────────────
  activityStatus        ActivityStatus
  daysSinceLastOrder    Int?
  daysSinceRegistration Int
  preferredDayOfWeek    Int?         // 0=So, 1=Mo, ..., 6=Sa
  preferredTimeSlot     String?      // BREAKFAST | LUNCH | AFTERNOON | EVENING

  // ─── Wert ──────────────────────────────────────────────────────────────────
  ltv                   Decimal       @db.Decimal(10, 2)
  avgOrderValue         Decimal       @db.Decimal(10, 2)
  orderFrequencyPerWeek Decimal       @db.Decimal(6, 3)
  spend30d              Decimal       @db.Decimal(10, 2)
  totalOrders           Int
  firstOrderAt          DateTime?
  lastOrderAt           DateTime?
  customerTier          CustomerTier

  // ─── RFM ───────────────────────────────────────────────────────────────────
  rfmR                  Int          // 1–5
  rfmF                  Int          // 1–5
  rfmM                  Int          // 1–5
  rfmSegment            RfmSegment

  // ─── Trend ─────────────────────────────────────────────────────────────────
  frequencyTrend        TrendDirection
  spendTrend            TrendDirection
  orders30d             Int
  orders30dPrev         Int
  spend30dPrev          Decimal       @db.Decimal(10, 2)

  // ─── Scores ────────────────────────────────────────────────────────────────
  churnRiskScore        Int          // 0–100 (100 = höchstes Abwanderungsrisiko)
  winBackScore          Int?         // 0–100, nur für ABGEWANDERT
  upsellScore           Int          // 0–100

  // ─── Verhalten ─────────────────────────────────────────────────────────────
  orderConsistencyScore Int?         // 0–100, null wenn < 3 Bestellungen
  orderDiversityScore   Int          // 0–100
  lunchRegularityPct    Decimal?     @db.Decimal(4, 3)  // 0.000–1.000
  avgLeadTimeHours      Decimal?     @db.Decimal(6, 1)

  // ─── Engagement ────────────────────────────────────────────────────────────
  couponUsageRate       Decimal       @db.Decimal(4, 3)  // 0.000–1.000
  walletUsageRate       Decimal       @db.Decimal(4, 3)  // 0.000–1.000
  primaryChannel        String?
  channelLoyaltyPct     Decimal       @db.Decimal(4, 3)  // 0.000–1.000

  // ─── Meta ──────────────────────────────────────────────────────────────────
  calculatedAt          DateTime
  updatedAt             DateTime      @updatedAt

  user                  User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([organizationId, activityStatus])
  @@index([organizationId, customerTier])
  @@index([organizationId, rfmSegment])
  @@index([organizationId, churnRiskScore])
  @@index([organizationId, calculatedAt])
  @@map("customer_metrics")
}
```

---

### Segmentierungs-Attribute (PROJ-4 Integration)

Die folgenden Felder aus `CustomerMetrics` werden als filterbare Attribute in den Segment-Regeln (PROJ-4) verfügbar:

| Attribut-Schlüssel | Typ | Beispielregel |
|---|---|---|
| `activityStatus` | Enum | `activityStatus = "ABGEWANDERT"` |
| `customerTier` | Enum | `customerTier IN ["GOLD", "PLATIN"]` |
| `rfmSegment` | Enum | `rfmSegment = "AT_RISK"` |
| `ltv` | Decimal | `ltv > 500` |
| `avgOrderValue` | Decimal | `avgOrderValue < 8.50` |
| `orderFrequencyPerWeek` | Decimal | `orderFrequencyPerWeek >= 3` |
| `churnRiskScore` | Int | `churnRiskScore >= 70` |
| `frequencyTrend` | Enum | `frequencyTrend = "RUECKLAEUFIG"` |
| `lunchRegularityPct` | Decimal | `lunchRegularityPct >= 0.8` |
| `couponUsageRate` | Decimal | `couponUsageRate >= 0.3` |
| `orders30d` | Int | `orders30d = 0` |

**Beispiel-Segmente die damit möglich werden:**
- `„Schlafende Champions"` — `rfmSegment = "CANT_LOSE"` + `churnRiskScore >= 60`
- `„Wachsende Potenziale"` — `rfmSegment = "POTENTIAL"` + `frequencyTrend = "WACHSEND"`
- `„Abo-Kandidaten"` — `orderConsistencyScore >= 75` + `orderFrequencyPerWeek >= 2`
- `„Preis-sensitive Treue"` — `couponUsageRate >= 0.4` + `activityStatus = "AKTIV"`
- `„Fast-täglich-Gäste"` — `lunchRegularityPct >= 0.7`

---

### UI-Design: Tab „Merkmale" im Kundenprofil-Drawer

```
Tab „Merkmale"
│
├── Header-Karte: Aktivitätsstatus + Tier + RFM-Segment
│   ├── Aktivitätsstatus-Pill (AKTIV/SCHLAFEND/etc.) mit Tooltip
│   ├── Tier-Badge (Standard / Bronze / Silber / Gold / Platin)
│   └── RFM-Segment-Label (z.B. „Treuer Kunde") + kurze Erklärung
│
├── Sektion: Wert & Frequenz (4 KPI-Tiles, 2×2)
│   ├── Lifetime Value      ├── Ø Warenkorb
│   └── Bestellfrequenz/Wo  └── Gesamtbestellungen
│
├── Sektion: Trend (letzte 30 Tage vs. vorherige 30 Tage)
│   ├── Frequenz-Trend:  [↑ +42 %] / [→ Stabil] / [↓ -31 %]
│   └── Ausgaben-Trend:  [↑ +18 %] / [→ Stabil] / [↓ -55 %]
│
├── Sektion: Risiko & Potenzial (Scores)
│   ├── Churn-Risk-Score:    [●●●●○] 73/100 — „Hohes Risiko"
│   │   (nur sichtbar wenn Score > 20)
│   ├── Win-Back-Score:      [●●●●●] 88/100
│   │   (nur sichtbar wenn activityStatus = ABGEWANDERT)
│   └── Upsell-Score:        [●●●○○] 55/100 — „Mittleres Potenzial"
│
├── Sektion: Verhaltensprofil (Radar / Balken)
│   ├── Konsistenz:      [████████░░] 82/100 — „Regelmäßig"
│   ├── Diversität:      [████░░░░░░] 38/100 — „Treu zu Favoriten"
│   ├── Mittagsfrequenz: „Bestellt an 76 % der Werktage"
│   └── Ø Vorlaufzeit:   „Bestellt Ø 14,5 Stunden im Voraus"
│
├── Sektion: Engagement
│   ├── Coupon-Nutzung: „In 34 % der Bestellungen eingesetzt"
│   ├── Wallet-Nutzung: „In 89 % der Bestellungen genutzt"
│   └── Primärer Kanal: App-Icon + „App (92 % aller Bestellungen)"
│
└── Footer: „Stand: 23.02.2026 03:00 Uhr · Täglich aktualisiert" + [Neu berechnen]-Button
```

---

### Background-Job: Berechnungsreihenfolge

Der tägliche Cron (03:00 Uhr) berechnet in folgender Reihenfolge, um Abhängigkeiten zu respektieren:

```
1. Basis-Daten laden  → Orders, Wallet-Transaktionen, Coupons aus DB
2. Aktivitäts-Merkmale  → activityStatus, daysSince*, preferredDay/Time
3. Wert-Merkmale       → ltv, avgOrderValue, frequency, spend30d, tier
4. Trend-Merkmale      → orders30d, orders30dPrev, spend*, trends
5. RFM-Scores          → rfmR, rfmF, rfmM (org-relative Quintile)
6. RFM-Segment         → Mapping aus R/F/M Kombination
7. Verhaltens-Scores   → consistency, diversity, lunchRegularity, leadTime
8. Churn/Win-Back/Upsell → basierend auf allen vorigen Werten
9. Engagement-Metriken → coupon, wallet, channel rates
10. Upsert CustomerMetrics → atomisch, calculatedAt = now()
```

**Org-relative RFM-Quintile** (einmal pro Org-Lauf berechnet, bevor einzelne Kunden bewertet werden):
- Berechne p20/p40/p60/p80 von `ltv` über alle Kunden der Org → 5 Buckets für M-Score
- Recency und Frequency-Schwellen sind absolut definiert (unabhängig von Org-Größe)

---

### API-Design

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/api/admin/kunden/[id]/merkmale` | Liest `CustomerMetrics` aus DB (pre-computed) |
| `POST` | `/api/admin/kunden/[id]/merkmale/recalculate` | Manueller Trigger (Rate-Limit: 1x/Stunde pro Kunde) |
| `GET` | `/api/admin/kunden?churnRisk=high` | Kunden-Liste mit Merkmal-Filtern (Segmentierungs-Integration) |

### Datenbank-Migrationen

1. Neue Tabelle `CustomerMetrics` (s. Prisma Schema oben)
2. Neue Enums: `ActivityStatus`, `CustomerTier`, `RfmSegment`, `TrendDirection`
3. Index auf `(organizationId, activityStatus)`, `(organizationId, customerTier)`, `(organizationId, rfmSegment)`, `(organizationId, churnRiskScore)`
4. `User` bekommt Relation `metrics CustomerMetrics?`

### Dependencies

Keine neuen Packages nötig. Die Background-Job-Infrastruktur kann Vercel Cron (bestehend) nutzen.
