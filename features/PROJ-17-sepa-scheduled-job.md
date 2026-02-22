# PROJ-17: Automatisierter SEPA-Job mit manueller Bestätigung

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-15 (SEPA Stammdaten) – IBAN/BIC/Mandat + Gläubiger-ID müssen hinterlegt sein
- Benötigt: PROJ-16 (Manuelle SEPA-Generierung) – Shared SEPA-Generierungslogik (Service-Layer)
- Benötigt: PROJ-5 (Vertragspartner-Monatsrechnung) – CompanyInvoice als Datenquelle

## Kontext & Motivation

Der Betreiber möchte optional einen **automatisierten Scheduled-Job** aktivieren, der
regelmäßig (z.B. monatlich) SEPA Direct Debit Dateien aus offenen Vertragspartner-Forderungen
vorbereitet. Der Job läuft automatisch, der Admin muss aber **manuell bestätigen** bevor
die Datei als „eingereicht" gilt – also vor dem tatsächlichen Einreichen bei der Bank.

**Ablauf**:
1. Cron-Job läuft (z.B. jeden 1. des Monats)
2. Job generiert SEPA-XML pro Vertragspartner (mit offenen INVOICED-Rechnungen oder openBalance)
3. Admin erhält Benachrichtigung im Admin-Panel: „X neue SEPA-Dateien zur Bestätigung bereit"
4. Admin prüft und lädt die Dateien herunter → erst dann gilt Status als SEPA_SUBMITTED

---

## User Stories

- Als Admin möchte ich einen automatischen SEPA-Job konfigurieren können (aktivieren/deaktivieren,
  Ausführungszeitpunkt wählen), damit ich nicht jeden Monat manuell daran denken muss.
- Als Admin möchte ich im Admin-Panel eine Benachrichtigung erhalten wenn der Job neue
  SEPA-Dateien vorbereitet hat, damit ich diese zeitnah prüfen und einreichen kann.
- Als Admin möchte ich die vom Job generierten SEPA-Dateien vor dem Bestätigen überprüfen
  (Betrag, Vertragspartner, enthaltene Rechnungen), bevor ich sie herunterladen und einreiche.
- Als Admin möchte ich einzelne vom Job vorbereitete SEPA-Dateien ablehnen können,
  damit ein Vertragspartner mit Datenproblemen nicht den Gesamtbatch blockiert.
- Als Admin möchte ich eine Übersicht aller vergangenen SEPA-Job-Ausführungen sehen
  (wann, wie viele Dateien, Status), damit ich die Abrechnung lückenlos nachvollziehen kann.
- Als Admin möchte ich einstellen können, welche Datenquelle der Job nutzt
  (INVOICED-Rechnungen oder openBalance), damit der Job zu meinem Abrechnungsprozess passt.

---

## Acceptance Criteria

### Job-Konfiguration (/admin/settings/payments oder /admin/billing)
- [ ] Toggle: „Automatischen SEPA-Job aktivieren" (Standard: deaktiviert)
- [ ] Konfigurierbar: Ausführungstag im Monat (1–28, Standard: 1)
- [ ] Konfigurierbar: Datenquelle (`INVOICED_INVOICES` | `OPEN_BALANCE`)
- [ ] Konfigurierbar: Standard-Vorlaufzeit in Werktagen für Fälligkeitsdatum (Standard: 5)
- [ ] Konfigurierbar: Sequenztyp (`FRST` | `RCUR`, Standard: `FRST`)
- [ ] Einstellungen werden pro Organisation in der Datenbank gespeichert
- [ ] Bei deaktiviertem Job: kein automatischer Lauf, kein Einfluss auf manuelle Generierung (PROJ-16)

### Job-Ausführung (Serverseite / Cron)
- [ ] Job läuft einmal pro Monat zum konfigurierten Tag (z.B. via Vercel Cron, cron-job.org, oder Node.js Scheduler)
- [ ] Job iteriert alle aktiven Vertragspartner der Organisation mit vollständigen SEPA-Stammdaten
- [ ] Pro Vertragspartner: generiert SEPA-XML (Shared-Logik aus PROJ-16)
- [ ] XML-Dateien werden temporär im System gespeichert (Datenbankfeld als Base64 oder Pfad zu Storage) – NICHT sofort als submitted markiert
- [ ] Neues DB-Modell `SepaJobRun`:
  - `id`, `organizationId`, `scheduledAt`, `executedAt`, `status` (PENDING_REVIEW | PARTIALLY_CONFIRMED | COMPLETED | FAILED)
  - Relation zu `SepaJobItem` (eine Datei pro Vertragspartner): `id`, `jobRunId`, `companyId`, `xmlContent`, `totalAmount`, `status` (PENDING | CONFIRMED | REJECTED)
- [ ] Fehler bei einem Vertragspartner (z.B. fehlende Daten) blockieren nicht den Rest: Item bekommt Status FAILED mit Fehlermeldung
- [ ] Nach Abschluss: Admin-Notification (In-App Badge/Banner auf der Billing-Seite)

### Bestätigungs-UI (/admin/billing → Tab „Ausstehende SEPA-Jobs")
- [ ] Neue Tab-Ansicht oder Sektion: „SEPA-Job Ausstehend" – sichtbar wenn Jobs mit Status PENDING_REVIEW vorhanden
- [ ] Listet alle ausstehenden Job-Runs mit Datum und Gesamtbetrag
- [ ] Pro Job-Run: expandierbare Liste der enthaltenen Vertragspartner-Items
  - Vertragspartnername, Betrag, Anzahl Rechnungen, IBAN (maskiert)
  - Aktionen: „Herunterladen & Bestätigen" | „Ablehnen"
- [ ] „Herunterladen & Bestätigen": lädt XML herunter UND setzt Item-Status auf CONFIRMED, verknüpfte Rechnungen auf SEPA_SUBMITTED
- [ ] „Ablehnen": setzt Item-Status auf REJECTED, Rechnungen bleiben unverändert (kein Download)
- [ ] Sobald alle Items eines Job-Runs CONFIRMED oder REJECTED: Job-Run-Status → COMPLETED
- [ ] Job-History-Tab: alle vergangenen Job-Runs mit Status, Datum, Anzahl Items, Gesamtbetrag

### API-Endpunkte
- [ ] GET /api/admin/billing/sepa/jobs → Liste Job-Runs (mit Items)
- [ ] POST /api/admin/billing/sepa/jobs/[jobRunId]/items/[itemId]/confirm → Download + Status-Update
- [ ] POST /api/admin/billing/sepa/jobs/[jobRunId]/items/[itemId]/reject → Status-Update
- [ ] POST /api/admin/billing/sepa/jobs/trigger → Manueller Job-Trigger (zum Testen, nur SUPER_ADMIN)
- [ ] PUT /api/admin/settings/billing/sepa-job → Job-Konfiguration speichern

---

## Edge Cases

- **Kein Vertragspartner mit SEPA-Daten**: Job läuft, erstellt Job-Run mit 0 Items und Status COMPLETED (kein Fehler, kein Alarm).
- **Job-Lauf schlägt komplett fehl**: Status `FAILED`, Admin-Notification mit Fehlermeldung. Keine Items werden erstellt.
- **Admin bestätigt nie** (Items bleiben PENDING): Items verfallen nach 60 Tagen automatisch (Status → EXPIRED), Rechnungen bleiben unverändert.
- **Doppelter Job-Lauf**: Wenn bereits ein Job-Run mit Status PENDING_REVIEW existiert, startet kein neuer Job → Logging + Skip.
- **Vertragspartner wird zwischen Job-Lauf und Bestätigung deaktiviert**: Item kann trotzdem bestätigt werden (historische Daten bleiben valide).
- **Konfigurationsänderung während laufendem Job**: Neue Konfiguration gilt erst beim nächsten Job-Lauf.
- **Fehlender Betreiber-IBAN in Einstellungen**: Job schlägt für alle Items fehl → Status FAILED mit Hinweis „Betreiber-IBAN nicht hinterlegt".
- **Sehr viele Vertragspartner**: Job verarbeitet sequenziell (kein paralleler XML-Burst), Timeout-Schutz per Item (max. 10s pro Vertragspartner).

---

## Technische Anforderungen

- **Cron-Mechanismus**: Vercel Cron (vercel.json) oder externer Service (z.B. cron-job.org via GET-Webhook)
  - Vercel Cron: `"crons": [{ "path": "/api/admin/billing/sepa/jobs/run", "schedule": "0 6 1 * *" }]`
  - Endpoint muss per Secret-Token gesichert sein (Bearer-Token in Cron-Config)
- **XML-Speicherung**: Job-Item-XMLs temporär in Datenbank als Text (bis zu ~50KB pro Datei, max. ~100 Vertragspartner pro Org = vertretbar). Alternativ: Object Storage (S3/Vercel Blob) für große Deployments.
- **Shared Service-Layer**: SEPA-XML-Generierungslogik aus PROJ-16 als wiederverwendbarer Service (`lib/sepa/generateDirectDebit.ts`)
- **Idempotenz**: Job-Trigger-Endpoint ist idempotent (doppelter Aufruf erzeugt keinen zweiten Job-Run)
- **Monitoring**: Failed Job-Runs werden in Sentry/Logging gemeldet (falls konfiguriert)

---

## Abgrenzung zu PROJ-16 (Manuelle Generierung)

| | PROJ-16 (Manuell) | PROJ-17 (Scheduled) |
|---|---|---|
| Auslöser | Admin klickt Button | Automatischer Cron-Job |
| Vertragspartner | Einzeln (1 per Aktion) | Alle auf einmal (Batch) |
| Download | Sofort nach Generierung | Nach expliziter Bestätigung |
| Status-Update | Sofort bei Download | Erst bei Bestätigung |
| XML gespeichert | Nein (Stream) | Ja (temporär in DB) |
| Konfiguration | Im Modal per Aufruf | In Einstellungen gespeichert |

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

Folgendes existiert bereits und wird direkt genutzt:

- **SEPA-XML-Generierung** → `lib/sepa/generatePain008.ts` (aus PROJ-16) – unverändert wiederverwendet
- **SEPA-Validierung** → `lib/sepa/validation.ts` – prüft IBAN/BIC/Mandat-Vollständigkeit
- **SepaSubmission + SepaSubmissionInvoice** → bereits in der Datenbank (Verlaufsdaten aus PROJ-16)
- **Bestehende SEPA-API** → `GET /api/admin/billing/sepa` (History) bleibt unverändert
- **Billing-Seite** → `/admin/billing/page.tsx` erhält neue Tab-Sektion (kein neues Route nötig)
- **Organisation-Stammdaten** → `sepaCreditorId`, `sepaIban`, `sepaBic` bereits vorhanden

---

### Component-Struktur

```
/admin/settings/payments  (Einstellungs-Seite – erweitert)
└── SEPA-Job Konfigurationskarte (NEU)
    ├── Toggle: „Automatischen SEPA-Job aktivieren"
    ├── Ausführungstag im Monat (Zahleneingabe 1–28)
    ├── Datenquelle (Dropdown: INVOICED_INVOICES | OPEN_BALANCE)
    ├── Standard-Sequenztyp (Radio: FRST | RCUR)
    ├── Vorlaufzeit in Werktagen (Zahleneingabe, Standard: 5)
    └── Speichern-Button

/admin/billing  (Billing-Seite – erweitert)
├── Alert-Banner: „X SEPA-Jobs warten auf Bestätigung" (nur wenn ausstehend)
├── Tab „Ausstehende Jobs" (NEU – nur sichtbar wenn Jobs vorhanden)
│   └── Job-Run-Karte (pro Cron-Lauf)
│       ├── Kopfzeile: Datum, Gesamt-Betrag, Status
│       └── Expandierbare Item-Liste (pro Vertragspartner)
│           ├── Firmenname, Betrag, Rechnungsanzahl, IBAN (maskiert)
│           ├── Button: „Herunterladen & Bestätigen" → XML-Download + Status CONFIRMED
│           └── Button: „Ablehnen" → Status REJECTED (kein Download)
└── Tab „Job-Verlauf" (NEU)
    └── Tabelle: Datum | Status | Items gesamt | Bestätigt | Abgelehnt | Betrag
```

---

### Daten-Model

**Neue Datenbank-Tabelle: `SepaJobRun`**
Repräsentiert einen einzelnen automatischen Cron-Lauf.

```
Jeder Job-Run speichert:
- Eindeutige ID
- Organisation (Verknüpfung)
- Geplantes Datum (wann der Cron laufen sollte)
- Tatsächliches Ausführungsdatum
- Status: PENDING_REVIEW | PARTIALLY_CONFIRMED | COMPLETED | FAILED
- Fehlermeldung (optional, bei FAILED)
- Erstellt am
```

**Neue Datenbank-Tabelle: `SepaJobItem`**
Eine Datei pro Vertragspartner innerhalb eines Job-Runs.

```
Jedes Job-Item speichert:
- Eindeutige ID
- Verknüpfung zu SepaJobRun
- Verknüpfung zu Vertragspartner (Company)
- SEPA-XML-Inhalt (temporär, bis bestätigt oder abgelaufen)
- Gesamt-Betrag (Summe der enthaltenen Rechnungen)
- Anzahl enthaltener Rechnungen
- Status: PENDING | CONFIRMED | REJECTED | FAILED | EXPIRED
- Fehlermeldung (optional, bei FAILED)
- Bestätigt/Abgelehnt von (Admin-User, optional)
- Bestätigt/Abgelehnt am (optional)
```

**Neue Felder auf `Organization`**
(Werden in `/admin/settings/payments` gespeichert)

```
Organisation erhält zusätzlich:
- sepaJobEnabled        → Ja/Nein (Standard: Nein)
- sepaJobDay            → Tag im Monat 1–28 (Standard: 1)
- sepaJobSource         → INVOICED_INVOICES oder OPEN_BALANCE
- sepaJobSeqType        → FRST oder RCUR
- sepaJobLeadDays       → Vorlaufzeit in Werktagen (Standard: 5)
```

**Bestehende Verknüpfung (unverändert)**
Wenn ein Job-Item bestätigt wird → verknüpfte `CompanyInvoice`-Einträge wechseln Status zu `SEPA_SUBMITTED` (identisches Verhalten wie bei manuellem Download in PROJ-16).

---

### API-Endpunkte (Übersicht)

| Endpoint | Methode | Zweck | Zugriff |
|---|---|---|---|
| `/api/admin/settings/billing/sepa-job` | PUT | Job-Konfiguration speichern | ADMIN |
| `/api/admin/billing/sepa/jobs` | GET | Alle Job-Runs (mit Items) laden | ADMIN |
| `/api/admin/billing/sepa/jobs/[jobRunId]/items/[itemId]/confirm` | POST | Item herunterladen + bestätigen | ADMIN |
| `/api/admin/billing/sepa/jobs/[jobRunId]/items/[itemId]/reject` | POST | Item ablehnen | ADMIN |
| `/api/admin/billing/sepa/jobs/run` | POST | Cron-Trigger (gesichert per Secret) | CRON / SUPER_ADMIN |
| `/api/admin/billing/sepa/jobs/trigger` | POST | Manueller Test-Trigger | SUPER_ADMIN |

---

### Cron-Job Mechanismus

**Vercel Cron** (neue Datei `vercel.json` im Projekt-Root):

```
Cron-Zeitplan: „0 6 1 * *"
→ Jeden 1. des Monats um 06:00 UTC

Cron ruft auf: /api/admin/billing/sepa/jobs/run
Gesichert durch: CRON_SECRET (Bearer-Token im Authorization-Header)
```

**Job-Ablauf (sequenziell, Schritt für Schritt):**

```
1. Prüfen: Gibt es bereits einen offenen Job-Run (PENDING_REVIEW)?
   → Ja: Abbrechen und loggen (Idempotenz-Schutz)
   → Nein: Weiter

2. Alle Organisationen mit sepaJobEnabled=true laden

3. Pro Organisation:
   a. Alle Vertragspartner mit vollständigen SEPA-Stammdaten laden
   b. Pro Vertragspartner: SEPA-XML generieren (aus PROJ-16 Shared Service)
   c. Bei Fehler beim Vertragspartner: Item als FAILED markieren, weiter mit nächstem
   d. Alle Items in SepaJobItem speichern

4. SepaJobRun abschließen:
   → Mindestens 1 Item vorhanden: Status = PENDING_REVIEW
   → 0 Items: Status = COMPLETED (nichts zu tun)
   → Kompletter Fehler: Status = FAILED
```

---

### Tech-Entscheidungen

**Vercel Cron statt externem Scheduler**
→ Bereits Teil der Vercel-Infrastruktur, keine zusätzlichen Kosten oder externe Abhängigkeiten.
→ Einfache Konfiguration per `vercel.json`, kein separates Service-Setup nötig.

**XML temporär in Datenbank speichern (nicht Object Storage)**
→ Bei max. ~100 Vertragspartnern mit je ~30–50 KB XML = max. 5 MB temporäre Daten in Postgres.
→ Kein S3/Vercel-Blob benötigt → weniger Infrastruktur-Komplexität für das MVP.
→ Nach Bestätigung/Ablehnung wird der XML-Inhalt nicht mehr aktiv gebraucht (bleibt als Archiv).

**Wiederverwendung `generatePain008()` aus PROJ-16**
→ Identische SEPA-XML-Logik für manuell und automatisch → kein Code-Duplikat, kein Fehler-Risiko.

**„Herunterladen & Bestätigen" als ein Schritt**
→ Erzwingt, dass der Admin die Datei tatsächlich bekommt bevor der Status gesetzt wird.
→ Verhindert versehentliches Bestätigen ohne Prüfung.

**CRON_SECRET für Endpoint-Sicherung**
→ Standard-Vercel-Pattern für Cron-geschützte Routen.
→ Token wird als `CRON_SECRET` Environment Variable hinterlegt.

**Items verfallen nach 60 Tagen automatisch (EXPIRED)**
→ Verhindert, dass unbearbeitete Jobs dauerhaft in PENDING_REVIEW bleiben.
→ Rechnungen bleiben unverändert (kein unbeabsichtigter Status-Wechsel).

---

### Dependencies (neue Pakete)

Keine neuen Pakete nötig. Alles basiert auf bestehender Infrastruktur:

- **Vercel Cron** → Konfiguration per `vercel.json` (kein npm-Paket)
- **SEPA XML** → `lib/sepa/generatePain008.ts` (bereits vorhanden)
- **Datenbank** → Prisma (bereits installiert)
- **UI-Komponenten** → shadcn/ui, Tailwind CSS (bereits vorhanden)

---

### Migrations-Checkliste (für Entwickler)

```
□ Prisma Schema: SepaJobRun Tabelle anlegen
□ Prisma Schema: SepaJobItem Tabelle anlegen
□ Prisma Schema: Organization um sepaJob* Felder erweitern
□ Prisma Migration ausführen (prisma migrate dev)
□ vercel.json mit Cron-Config anlegen
□ CRON_SECRET in Vercel Environment Variables hinterlegen
□ API: /api/admin/billing/sepa/jobs/run (Cron-Handler)
□ API: /api/admin/billing/sepa/jobs (GET Job-Liste)
□ API: /api/admin/billing/sepa/jobs/[id]/items/[itemId]/confirm
□ API: /api/admin/billing/sepa/jobs/[id]/items/[itemId]/reject
□ API: /api/admin/billing/sepa/jobs/trigger (SUPER_ADMIN)
□ API: /api/admin/settings/billing/sepa-job (PUT Konfiguration)
□ UI: SEPA-Job Konfigurationskarte in /admin/settings/payments
□ UI: Alert-Banner in /admin/billing
□ UI: Tab „Ausstehende Jobs" in /admin/billing
□ UI: Tab „Job-Verlauf" in /admin/billing
□ EXPIRED-Job-Cleanup: Cron oder manuelle Bereinigung nach 60 Tagen
```
