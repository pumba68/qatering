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
