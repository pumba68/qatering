# PROJ-9: E-Mail Template & Versand

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-7 (Marketing Template Library) – Template muss vom Typ E-Mail sein
- Benötigt: PROJ-8 (Block-Editor) – Template-Inhalt wird dort erstellt
- Benötigt: PROJ-4 (Kundensegmente) – Empfänger werden als Segment gewählt
- Integriert mit: PROJ-4 Marketing-Automation Workflows (automatischer Versand)

## Übersicht
E-Mail-spezifische Einstellungen und Versand-Flow für im Block-Editor erstellte E-Mail-Templates. Admin konfiguriert Betreff, Absender-Alias, wählt Ziel-Segment und versendet manuell oder plant den Versand. Tracking von Öffnungs- und Klickraten.

---

## User Stories

- Als Admin möchte ich für ein E-Mail-Template Betreff und Absender-Anzeigenamen festlegen, damit die Mail professionell beim Empfänger ankommt.
- Als Admin möchte ich eine Test-Mail an meine eigene Adresse senden, bevor ich die Kampagne starte, damit ich das Ergebnis im echten Postfach prüfen kann.
- Als Admin möchte ich das Empfänger-Segment wählen (aus PROJ-4), damit nur die richtige Zielgruppe die Mail erhält.
- Als Admin möchte ich eine Kampagne sofort senden oder zu einem geplanten Zeitpunkt einplanen, damit ich Kampagnen vorbereiten kann.
- Als Admin möchte ich nach dem Versand eine Übersicht sehen (Empfänger-Anzahl, Öffnungsrate, Klickrate), damit ich den Erfolg der Kampagne messen kann.
- Als Admin möchte ich dasselbe E-Mail-Template in einen Automation-Workflow (PROJ-4) einbinden, damit Mails auch automatisch ausgelöst werden.

---

## Acceptance Criteria

### E-Mail-Einstellungen Panel (zusätzlich zum Block-Editor)
- [ ] Tab „E-Mail-Einstellungen" im Editor (PROJ-8) nur sichtbar bei Typ E-Mail
- [ ] Pflichtfelder: Betreff-Zeile (max. 80 Zeichen, Zeichenzähler, Platzhalter unterstützt), Absender-Anzeigename (z.B. „Demo Kantine")
- [ ] Vorschau-Text / Preheader (optional, max. 150 Zeichen) – wird im Posteingang unter dem Betreff angezeigt
- [ ] Abmeldelink automatisch im Footer jeder Mail (gesetzliche Anforderung, nicht deaktivierbar)

### Test-Versand
- [ ] „Test-Mail senden"-Button: Eingabefeld für Empfänger-E-Mail-Adresse → Mail sofort versendet
- [ ] Test-Mail enthält Banner „[TEST] Diese Mail ist ein Testversand" im Header
- [ ] Platzhalter in Test-Mails mit Beispieldaten befüllt

### Kampagnen-Versand
- [ ] Unter Bibliothek oder direkt aus Editor: „Kampagne starten"-Flow (separater Dialog/Seite)
- [ ] Schritt 1: Segment wählen (Dropdown mit allen aktiven Segmenten aus PROJ-4 + Option „Alle Kunden")
- [ ] Schritt 2: Versandzeitpunkt – „Sofort senden" oder „Geplant" (Datum + Uhrzeit Picker)
- [ ] Schritt 3: Zusammenfassung – Empfänger-Anzahl (basierend auf Segment-Größe), Template-Vorschau
- [ ] Bestätigungs-Schritt: „Kampagne jetzt starten" → nicht rückgängig zu machen
- [ ] Nach Bestätigung: Status-Anzeige mit Progress (Mails werden in Queue verarbeitet)

### Kampagnen-Übersicht & Tracking
- [ ] Seite `/admin/marketing/campaigns` listet alle gesendeten + geplanten Kampagnen
- [ ] Spalten: Name, Template, Segment, Versanddatum, Status (Geplant | Versendet | Fehler), Empfänger, Öffnungen (%), Klicks (%)
- [ ] Detailansicht einer Kampagne: Empfänger-Liste mit individuellem Öffnungs-/Klickstatus
- [ ] Geplante Kampagne kann bis 1 Stunde vor Versand storniert werden

### Automation-Integration
- [ ] E-Mail-Template ist in Workflow-Aktionstyp `SEND_EMAIL` (PROJ-4) aus Dropdown wählbar
- [ ] Beim Anlegen eines Workflows mit `SEND_EMAIL`: Template-Auswahl aus Bibliothek (nur aktive E-Mail-Templates)

---

## Edge Cases

- **Segment hat 0 Empfänger:** Warnung „Dieses Segment hat derzeit keine Mitglieder. Kampagne trotzdem speichern?" – kein Versand, aber Planung möglich.
- **Empfänger hat `marketingEmailConsent = false`:** Wird automatisch aus Versandliste ausgeschlossen (kein Opt-in, kein Versand).
- **Mail-Versand schlägt für einzelne Empfänger fehl:** Fehler wird in Kampagnen-Log protokolliert; andere Empfänger erhalten die Mail trotzdem.
- **Geplante Kampagne, Template wird zwischenzeitlich gelöscht/archiviert:** Kampagne bleibt geplant, verwendet den Content-Snapshot zum Planungszeitpunkt (Snapshot bei Bestätigung).
- **Betreff ist leer:** Kampagne kann nicht gestartet werden, Validierungsfehler.
- **Test-Mail-Adresse ungültig:** Inline-Validierung vor dem Senden.
- **Sehr großes Segment (1000+ Empfänger):** Versand über Queue (Batch-Processing), nicht synchron; Fortschrittsanzeige in UI.

---

## Technische Anforderungen

- Neue DB-Tabellen:
  - `email_campaigns` (id, organizationId, templateId, templateSnapshot JSON, subjectLine, preheaderText, senderName, segmentId, scheduledAt, sentAt, status, totalRecipients, createdAt)
  - `email_campaign_logs` (id, campaignId, userId, email, status [SENT|OPENED|CLICKED|BOUNCED|FAILED], openedAt, clickedAt)
- E-Mail-Versand: Via konfiguriertem SMTP oder Resend/SendGrid (Konfiguration über ENV-Variablen: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`)
- HTML-Rendering: Block-Editor JSON → HTML-E-Mail via Server-Side-Renderer (eigene Funktion)
- Tracking: Öffnungsrate via Tracking-Pixel (`/api/email-track/open/[token]`), Klickrate via Redirect-Link (`/api/email-track/click/[token]`)
- Opt-out: Abmelde-Link `/unsubscribe/[token]` setzt `marketingEmailConsent = false` für den User
- Queue: Batch-Verarbeitung via Background-Job (z.B. alle 5s nächste Batch von 50 Mails)

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

Folgendes existiert bereits und wird direkt genutzt – **kein Neubau nötig**:

- **Block-Editor** → `components/marketing/editor/` – vollständig implementiert, unterstützt E-Mail-Templates
- **Template-Renderer** → `lib/template-renderer.ts` – wandelt Block-Editor-JSON in HTML um (inkl. Platzhalter-Ersetzung)
- **Template-Bibliothek** → `/admin/marketing/templates` + API – CRUD komplett implementiert
- **`MarketingTemplate`-Modell** → DB-Tabelle mit `type: EMAIL` bereits vorhanden
- **Segment-Berechnung** → `lib/segment-audience.ts` – berechnet Empfänger-Liste aus Segment-Regeln
- **`User.marketingEmailConsent`** → Opt-in-Flag bereits in der Datenbank gespeichert
- **Kampagnen-Seite** → `/admin/marketing/campaigns` – Tab „E-Mail" existiert bereits (Stub-Zustand)
- **E-Mail-API-Route** → `POST /api/admin/marketing/email` – existiert als Stub, wird zur echten Implementierung
- **Workflow-System** → `MarketingWorkflow` mit `actionType: SEND_EMAIL` bereits modelliert

---

### Component-Struktur

```
/admin/marketing/templates/[id]/editor  (bereits vorhanden – erweitert)
└── Tab „E-Mail-Einstellungen" (NEU – nur sichtbar für Typ EMAIL)
    ├── Betreff-Zeile (Textfeld, max. 80 Zeichen, Zeichenzähler)
    ├── Vorschau-Text / Preheader (optional, max. 150 Zeichen)
    ├── Absender-Anzeigename (z.B. „Demo Kantine")
    └── Button: „Test-Mail senden" → Eingabefeld Empfänger-E-Mail → sofortiger Versand

/admin/marketing/campaigns  (bereits vorhanden – erweitert)
└── Tab „E-Mail-Kampagnen" (Stub → REAL)
    ├── Button: „Kampagne starten" → 3-stufiger Dialog:
    │   ├── Schritt 1: Template wählen (aus Bibliothek, nur aktive E-Mail-Templates)
    │   ├── Schritt 2: Segment wählen + Versandzeitpunkt (Sofort | Geplant)
    │   └── Schritt 3: Zusammenfassung (Empfänger-Anzahl, Betreff, Vorschau) + Bestätigen
    └── Kampagnen-Liste
        ├── Spalten: Name | Segment | Versanddatum | Status | Empfänger | Öffnungen | Klicks
        ├── Status-Badges: Geplant | Wird versendet | Versendet | Fehler
        ├── Aktion: Geplante Kampagne stornieren (bis 1h vor Versand)
        └── Klick auf Kampagne → Detailansicht
            ├── Kennzahlen: Empfänger gesamt, Geöffnet (%), Geklickt (%)
            └── Empfänger-Tabelle: E-Mail | Status | Geöffnet am | Geklickt am

/admin/settings  (bereits vorhanden – erweitert)
└── Karte „E-Mail-Provider" (NEU)
    ├── Resend API-Key (empfohlen) ODER SMTP-Zugangsdaten
    ├── Absender-E-Mail-Adresse
    ├── Absender-Name (Standard)
    └── Button: „Verbindung testen"

/unsubscribe/[token]  (NEUE öffentliche Seite)
└── Bestätigungsseite: „Sie haben sich erfolgreich abgemeldet"
    → setzt marketingEmailConsent = false für den Nutzer
```

---

### Daten-Model

**Neue Felder auf `MarketingTemplate`** (E-Mail-spezifische Einstellungen)

```
E-Mail-Template erhält zusätzlich:
- subjectLine       → Betreff-Zeile (max. 80 Zeichen)
- preheaderText     → Vorschau-Text im Posteingang (optional)
- senderName        → Absender-Anzeigename (z.B. „Demo Kantine")
```

**Neue Datenbank-Tabelle: `EmailCampaign`**
Repräsentiert eine geplante oder gesendete Kampagne.

```
Jede Kampagne speichert:
- Eindeutige ID
- Organisation
- Verknüpfung zu MarketingTemplate
- Template-Snapshot (JSON-Kopie des Templates zum Planungszeitpunkt)
- Betreff-Zeile (aus Template übernommen, aber überschreibbar)
- Absender-Name
- Ziel-Segment (optional – ohne Segment = alle Kunden mit Einwilligung)
- Geplantes Versanddatum (null = sofortiger Versand)
- Tatsächliches Versanddatum
- Status: DRAFT | SCHEDULED | SENDING | SENT | CANCELLED | FAILED
- Empfänger-Anzahl (gesamt)
- Versendet-Anzahl
- Fehlgeschlagen-Anzahl
- Erstellt von (Admin-User)
- Erstellt am
```

**Neue Datenbank-Tabelle: `EmailCampaignLog`**
Ein Eintrag pro Empfänger pro Kampagne – für Tracking.

```
Jeder Log-Eintrag speichert:
- Eindeutige ID
- Verknüpfung zu EmailCampaign
- Verknüpfung zu User
- E-Mail-Adresse (Snapshot, falls sich User-Email ändert)
- Tracking-Token (einzigartiger Token für Öffnungs- und Klick-Tracking)
- Status: PENDING | SENT | OPENED | CLICKED | BOUNCED | FAILED
- Versendet am
- Geöffnet am (optional)
- Geklickt am (optional)
- Fehlermeldung (optional, bei FAILED)
```

---

### API-Endpunkte (Übersicht)

| Endpoint | Methode | Zweck | Zugriff |
|---|---|---|---|
| `/api/admin/marketing/email` | POST | Kampagne erstellen + starten (Stub → REAL) | ADMIN |
| `/api/admin/marketing/email/campaigns` | GET | Alle Kampagnen der Organisation | ADMIN |
| `/api/admin/marketing/email/campaigns/[id]` | GET | Kampagnen-Detail mit Logs | ADMIN |
| `/api/admin/marketing/email/campaigns/[id]` | DELETE | Geplante Kampagne stornieren | ADMIN |
| `/api/admin/marketing/email/test` | POST | Test-Mail senden (sofort, kein Log) | ADMIN |
| `/api/admin/marketing/templates/[id]` | PUT | E-Mail-Einstellungen speichern (subject etc.) | ADMIN |
| `/api/email-track/open/[token]` | GET | Tracking-Pixel (Öffnung erfassen) | Öffentlich |
| `/api/email-track/click/[token]` | GET | Klick-Redirect (Klick erfassen + weiterleiten) | Öffentlich |
| `/unsubscribe/[token]` | GET | Abmelde-Seite anzeigen | Öffentlich |
| `/unsubscribe/[token]` | POST | Abmeldung bestätigen | Öffentlich |

---

### Tech-Entscheidungen

**Resend als E-Mail-Provider (empfohlen)**
→ Modernes API, TypeScript SDK, einfache Einrichtung ohne eigenen Mail-Server.
→ Kostenlose Tier: 3.000 Mails/Monat – ausreichend für den MVP.
→ Alternative: SMTP (Nodemailer) für selbst-gehostete Setups – beide Optionen werden via ENV-Variablen konfiguriert.

**Kein Redis / keine externe Queue**
→ Batch-Versand direkt in der API-Route: je 50 Mails pro Aufruf, Status-Update in DB.
→ Verhindert komplexe Infrastruktur (Bull, BullMQ, Inngest) für den MVP.
→ Skaliert problemlos bis ~5.000 Empfänger; für größere Listen kann später eine Queue ergänzt werden.

**Template-Snapshot bei Kampagnen-Start**
→ Block-Editor-JSON wird zum Zeitpunkt der Kampagnen-Erstellung als Kopie gespeichert.
→ Änderungen am Template nach der Planung beeinflussen die laufende Kampagne nicht.

**Tracking via Pixel + Redirect-Links**
→ Öffnungsrate: 1×1 px transparentes PNG in der Mail, lädt von `/api/email-track/open/[token]`.
→ Klickrate: Alle Links in der Mail werden durch `/api/email-track/click/[token]?url=...` geleitet.
→ Unsubscribe-Link wird automatisch im Mail-Footer injiziert (nicht deaktivierbar).

**`lib/template-renderer.ts` direkt wiederverwendet**
→ Block-JSON → HTML-Konvertierung existiert bereits, keine Eigenentwicklung nötig.
→ Nur kleine Erweiterung: Tracking-Pixel + Unsubscribe-Link im generierten HTML einfügen.

---

### Dependencies (neue Pakete)

```
Benötigt:
- resend          → E-Mail-Versand via Resend API (empfohlen)

Optional (Alternative zu Resend):
- nodemailer      → SMTP-Versand
- @types/nodemailer
```

Alle anderen benötigten Teile (Template-Renderer, Segment-Berechnung, UI-Komponenten, Prisma) sind bereits vorhanden.

---

### Migrations-Checkliste (für Entwickler)

```
□ Prisma Schema: MarketingTemplate um subjectLine/preheaderText/senderName erweitern
□ Prisma Schema: EmailCampaign Tabelle anlegen
□ Prisma Schema: EmailCampaignLog Tabelle anlegen
□ Prisma Migration ausführen (prisma migrate dev)
□ npm install resend (oder nodemailer)
□ ENV-Variablen: RESEND_API_KEY (oder SMTP_HOST/PORT/USER/PASS), EMAIL_FROM
□ lib/email-service.ts anlegen (Wrapper für Resend/SMTP)
□ lib/template-renderer.ts erweitern: Tracking-Pixel + Unsubscribe-Link
□ API: POST /api/admin/marketing/email (Stub → echter Versand)
□ API: GET /api/admin/marketing/email/campaigns
□ API: GET/DELETE /api/admin/marketing/email/campaigns/[id]
□ API: POST /api/admin/marketing/email/test
□ API: PUT /api/admin/marketing/templates/[id] (subjectLine etc.)
□ API: GET /api/email-track/open/[token]
□ API: GET /api/email-track/click/[token]
□ Page: /unsubscribe/[token] (öffentliche Seite)
□ UI: Tab „E-Mail-Einstellungen" im Template-Editor (subject, preheader, senderName, Test-Mail)
□ UI: Kampagnen-Dialog (3-Schritt) in /admin/marketing/campaigns
□ UI: Kampagnen-Liste mit Status + Detailansicht
□ UI: E-Mail-Provider-Karte in /admin/settings
```
