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
