# PROJ-16: Manuelle SEPA Direct Debit Datei-Generierung (pain.008.003.03 CORE)

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-15 (SEPA Stammdaten) – IBAN/BIC/Mandat + Gläubiger-ID müssen hinterlegt sein
- Benötigt: PROJ-5 (Vertragspartner-Monatsrechnung) – CompanyInvoice als Datenquelle

## Kontext & Motivation

Der Betreiber möchte aus offenen Vertragspartner-Forderungen eine standardkonforme
**SEPA Direct Debit XML-Datei (pain.008.003.03 CORE)** generieren, die er bei seiner
Bank einreichen kann. Die Lastschrift zieht die geschuldeten Beträge vom Konto der
Vertragspartner ein.

**Format**: ISO 20022 pain.008.003.03 (SEPA Core Direct Debit)
- Frist: Mindestens 5 Werktage vor Fälligkeitsdatum muss die Datei bei der Bank eingehen
- Pro Vertragspartner wird eine **separate XML-Datei** generiert (nicht Sammeldatei)

**Quellauswahl durch Admin**:
- Option A: Aus **INVOICED-Rechnungen** (bereits fakturiert, noch nicht bezahlt) – präzise Kontrolle
- Option B: Aus **offenem Saldo (openBalance)** – nicht fakturierte Beträge; System erstellt intern eine Rechnung

---

## User Stories

- Als Admin möchte ich auf der Billing-Seite einen „SEPA-Datei generieren"-Button pro
  Vertragspartner sehen, damit ich mit einem Klick die XML-Datei erstellen und herunterladen kann.
- Als Admin möchte ich wählen können, ob SEPA aus INVOICED-Rechnungen oder aus dem offenen
  Saldo generiert wird, damit ich flexibel auf die aktuelle Abrechnungssituation reagieren kann.
- Als Admin möchte ich vor der Generierung eine Vorschau des Betrags und der enthaltenen Rechnungen/Positionen
  sehen, damit ich Fehler vor dem Einreichen bei der Bank erkennen kann.
- Als Admin möchte ich nach erfolgreicher SEPA-Generierung eine valide XML-Datei herunterladen
  können, die ohne Anpassung bei meiner Bank eingereicht werden kann.
- Als Admin möchte ich dass die betroffenen Rechnungen nach Generierung automatisch den
  Status „SEPA_SUBMITTED" erhalten, damit ich den Überblick behalte.
- Als Admin möchte ich eine Warnung erhalten wenn ein Vertragspartner keine vollständigen
  SEPA-Bankdaten hinterlegt hat, bevor ich versuche eine Datei zu generieren.

---

## Acceptance Criteria

### UI – Billing-Seite (/admin/billing)
- [ ] Neue Aktion „SEPA-Lastschrift" je Vertragspartner (Button/Dropdown neben vorhandenen Aktionen)
- [ ] Klick öffnet ein Modal/Drawer mit:
  - Auswahl: Quelle „INVOICED-Rechnungen" oder „Offener Saldo"
  - Liste der einzuschließenden Positionen/Rechnungen mit Beträgen
  - Gesamtbetrag
  - Fälligkeitsdatum (Eingabefeld, Datum muss ≥ 5 Werktage in der Zukunft sein)
  - Warnung wenn Vertragspartner keine SEPA-Daten hinterlegt hat → Button deaktiviert
- [ ] „Generieren & Herunterladen"-Button löst API-Aufruf aus
- [ ] Nach Erfolg: automatischer Download der XML-Datei + Erfolgsmeldung (Toast)
- [ ] Verarbeitete Rechnungen erhalten Status `SEPA_SUBMITTED` in der Datenbank
- [ ] Vertragspartner ohne SEPA-Stammdaten zeigen einen visuellen Hinweis (Info-Icon / Warnung)

### XML-Datei (pain.008.003.03 CORE)
- [ ] Dateiname: `sepa-lastschrift-{CompanyName}-{YYYY-MM-DD}.xml`
- [ ] XML enthält korrekten GroupHeader:
  - `MsgId`: Eindeutige Message-ID (Timestamp + CompanyId)
  - `CreDtTm`: Generierungszeitpunkt (ISO 8601)
  - `NbOfTxs`: Anzahl Transaktionen
  - `CtrlSum`: Summe aller Beträge (2 Dezimalstellen)
  - `InitgPty/Nm`: Name des Betreibers (Organisationsname)
- [ ] XML enthält korrekten PaymentInformation-Block:
  - `PmtMtd`: DD (Direct Debit)
  - `LclInstrm/Cd`: CORE
  - `SeqTp`: FRST (Erstlastschrift) oder RCUR (Folgelastschrift) — Admin wählt im Modal
  - `ReqdColltnDt`: Fälligkeitsdatum (eingegeben durch Admin)
  - `Cdtr/Nm`: Betreibername
  - `CdtrAcct/IBAN`: Betreiber-IBAN (aus Einstellungen)
  - `CdtrAgt/BIC`: Betreiber-BIC
  - `CdtrSchmeId`: Gläubiger-ID (aus PROJ-15)
- [ ] XML enthält je Rechnung einen DirectDebitTransactionInformation-Block:
  - `PmtId/EndToEndId`: Rechnungs-ID oder Kombination Monat/Jahr/Vertragsnummer
  - `InstdAmt Ccy="EUR"`: Betrag
  - `MndtRltdInf/MndtId`: Mandatsreferenz (aus PROJ-15)
  - `MndtRltdInf/DtOfSgntr`: Mandatsdatum (aus PROJ-15)
  - `DbtrAgt/BIC`: BIC des Vertragspartners (aus PROJ-15)
  - `Dbtr/Nm`: Name des Vertragspartners
  - `DbtrAcct/IBAN`: IBAN des Vertragspartners (aus PROJ-15)
- [ ] Generierte XML wird gegen pain.008.003.03 XSD-Schema validiert, bevor Download ausgeliefert wird

### Datenbank
- [ ] `CompanyInvoice.status` erhält neuen Wert `SEPA_SUBMITTED`
- [ ] Neues Modell `SepaSubmission`: speichert Metadaten jeder Generierung:
  - `id`, `companyId`, `generatedAt`, `totalAmount`, `dueDate`, `seqType`, `invoiceIds[]`, `createdBy` (AdminUserId)
- [ ] Status-Übergänge: `INVOICED → SEPA_SUBMITTED` (bei Option A) oder `openBalance → Invoice(SEPA_SUBMITTED)` (bei Option B)

### API
- [ ] POST /api/admin/billing/sepa/generate
  - Body: `{ companyId, source: 'INVOICED' | 'OPEN_BALANCE', dueDate, seqType: 'FRST' | 'RCUR' }`
  - Response: XML-Datei (Content-Type: application/xml) oder JSON-Fehler
  - Validierungen: Gläubiger-ID vorhanden, SEPA-Stammdaten vollständig, Betrag > 0, dueDate ≥ 5 Werktage
- [ ] GET /api/admin/billing/sepa → Liste vergangener SEPA-Submissions pro Org

---

## Edge Cases

- **Betrag = 0**: Generierung wird abgelehnt mit Fehler „Kein offener Betrag für diesen Vertragspartner".
- **Fehlende Gläubiger-ID des Betreibers**: Fehlermeldung „Bitte zuerst Gläubiger-ID in den Zahleinstellungen (PROJ-15) hinterlegen."
- **Fehlende IBAN/BIC/Mandat des Vertragspartners**: Fehlermeldung mit Link zur Company-Bearbeitungsseite.
- **Fälligkeitsdatum zu nahe**: Warnung „SEPA CORE erfordert mindestens 5 Werktage Vorlaufzeit. Gewähltes Datum: X. Frühestes zulässiges Datum: Y."
- **Doppelte Generierung für gleiche Rechnung**: Rechnungen mit Status `SEPA_SUBMITTED` oder `PAID` werden nicht erneut in SEPA-Datei aufgenommen.
- **XSD-Validierungsfehler**: Interner Fehler wird geloggt, Admin erhält Fehlermeldung „XML-Generierung fehlgeschlagen – bitte Support kontaktieren." (kein kaputtes XML ausliefern).
- **Rücklastschrift**: Out of Scope (PROJ-15-Entscheidung). Admin kann Rechnung manuell zurück auf INVOICED setzen.
- **Währung**: Ausschließlich EUR. Andere Währungen werden nicht unterstützt (nicht relevant für deutsches Marktumfeld).

---

## Technische Anforderungen

- XML-Generierung serverseitig (Node.js), kein clientseitiges XML
- Bibliothek für XML: `xmlbuilder2` oder handgefertigtes Template-Literal mit korrektem Namespace
  `xmlns="urn:iso:std:iso:20022:tech:xsd:pain.008.003.03"`
- XSD-Validierung: Optional für MVP; wenn zu aufwändig → strukturelle Checks statt vollständiger XSD-Validierung
- SEPA-Sequenztyp FRST vs. RCUR: Für MVP kann FRST als Default gesetzt werden (sichere Wahl bei Erstkontakt)
- Werktage-Berechnung: Feiertage DE ignorieren für MVP (nur Wochenenden ausschließen), exakte Feiertagslogik in späterem Release
- Performance: XML für bis zu 1.000 Rechnungspositionen muss in < 5 Sekunden generiert werden

---

## UI-Mockup (Beschreibung)

```
┌─ Billing-Übersicht ────────────────────────────────────────────────┐
│ Muster GmbH      Vertrag: VN-001      Offen: 2.340,00 €            │
│ [PDF exportieren]  [Als bezahlt markieren]  [SEPA-Lastschrift ▼]   │
└────────────────────────────────────────────────────────────────────┘

── SEPA-Modal ──────────────────────────────────────────────────────
  Vertragspartner: Muster GmbH
  Quelle:  ○ INVOICED-Rechnungen (3 Rechnungen, 1.800,00 €)
           ● Offener Saldo (2.340,00 €)

  Sequenztyp: [FRST – Erstlastschrift ▼]
  Fälligkeitsdatum: [2026-03-03] (frühestens: 28.02.2026)

  ⚠ IBAN des Vertragspartners: DE89 •••• •••• •••• 3700 ✓
  ⚠ Mandat: VP-2024-001 (unterzeichnet: 15.01.2024) ✓

  [Abbrechen]  [Generieren & Herunterladen →]
────────────────────────────────────────────────────────────────────
```

---

## Tech-Design (Solution Architect)

### ⚠ Architektonische Lücke aus PROJ-15

PROJ-15 hat die Gläubiger-ID (`sepaCreditorId`) der Organisation gespeichert,
aber das SEPA pain.008-Format braucht auch die **eigene IBAN und BIC des Betreibers**
als Empfängerkonto (Kreditorkonto, auf das die Lastschriften eingehen).

**Zusätzliche Felder nötig in den SEPA-Einstellungen:**
- Betreiber-IBAN (`sepaIban` auf der Organisation)
- Betreiber-BIC (`sepaBic` auf der Organisation)

Diese werden mit PROJ-16 als Teil der SEPA-Einstellungen unter
`/admin/settings/payments` nachgezogen (gleiche Seite wie die Gläubiger-ID).

---

### Komponenten-Struktur

```
/admin/billing (bestehende Seite – wird erweitert)
│
├── Offene Salden – Tabelle (bestehend)
│   └── [pro Vertragspartner-Zeile]
│       ├── Name, Vertragsnummer, offener Betrag (bestehend)
│       ├── SEPA-Status-Icon  ← NEU (✅ vollständig / ⚠ Daten fehlen)
│       └── Button "SEPA-Lastschrift"  ← NEU
│
└── SEPA-Generierungs-Modal  ← NEU (öffnet bei Klick auf Button)
    ├── Vertragspartnername + SEPA-Vollständigkeits-Status
    ├── Quelle wählen (Radio-Buttons)
    │   ├── ○ INVOICED-Rechnungen  → zeigt Liste der betroffenen Rechnungen
    │   └── ○ Offener Saldo        → zeigt unbezahlte Bestellpositionen
    ├── Positions-Vorschau (aufklappbare Liste)
    ├── Gesamtbetrag fett angezeigt
    ├── Sequenztyp (Dropdown: FRST Erstlastschrift / RCUR Folgelastschrift)
    ├── Fälligkeitsdatum (Datumspicker, Mindestdatum = heute + 5 Werktage)
    ├── Fehler-Banner (wenn SEPA-Daten unvollständig oder Betreiber-IBAN fehlt)
    └── [Abbrechen]  [Generieren & Herunterladen]

/admin/settings/payments (bestehende Seite – wird erweitert)
└── SEPA-Karte (PROJ-15, bereits vorhanden)
    ├── Gläubiger-ID (bereits vorhanden)
    ├── Betreiber-IBAN  ← NEU (Empfängerkonto der Lastschriften)
    └── Betreiber-BIC   ← NEU
```

---

### Daten-Modell

**Bestehend (wird genutzt):**
- `Company` → hat jetzt IBAN, BIC, Mandatsreferenz, Mandatsdatum (aus PROJ-15)
- `Organization` → hat `sepaCreditorId` (aus PROJ-15)
- `CompanyInvoice` → Status bisher: DRAFT / INVOICED / PAID

**Neu:**

Organisation bekommt zwei zusätzliche Felder:
- Eigene IBAN (Betreiber-Empfängerkonto)
- Eigene BIC (Betreiber-Empfängerbank)

Neues Status-Feld auf Rechnung:
- `SEPA_SUBMITTED` — Rechnung ist in einer SEPA-Datei enthalten, Einzug läuft

Neue Tabelle `SepaSubmission` (Verlaufsprotokoll):
- Eindeutige ID
- Welcher Vertragspartner
- Wann generiert (Datum/Uhrzeit)
- Gesamtbetrag
- Fälligkeitsdatum
- Sequenztyp (FRST oder RCUR)
- Welche Rechnungen waren enthalten (Liste)
- Wer hat ausgelöst (Admin-User)

---

### Ablauf-Diagramm

```
Admin klickt "SEPA-Lastschrift"
        ↓
Modal öffnet sich – Quelle wählen
        ↓
[INVOICED]                    [OPEN BALANCE]
Vorhandene Rechnungen          Offene Bestellungen
mit Status INVOICED            (noch keine Rechnung)
        ↓                             ↓
        └──────────────┬──────────────┘
                       ↓
         Admin wählt Datum + Sequenztyp
                       ↓
         "Generieren & Herunterladen"
                       ↓
         API erstellt pain.008.003.03 XML
                       ↓
         [Bei OPEN BALANCE: erstellt intern
          eine CompanyInvoice automatisch]
                       ↓
         Rechnungen → Status: SEPA_SUBMITTED
         SepaSubmission-Eintrag wird gespeichert
                       ↓
         XML-Download startet im Browser
```

---

### Tech-Entscheidungen

**Warum `xmlbuilder2` für die XML-Generierung?**
→ Leichtgewichtige Node.js-Bibliothek speziell für DOM-konformes XML.
→ Kein Overhead wie bei vollständigen XML-Parsern.
→ Unterstützt Namespaces (required für ISO 20022).
→ Alternative wäre Template-Literals – aber fehleranfälliger bei komplexen Strukturen.

**Warum server-seitig generieren (nicht im Browser)?**
→ Sicherheit: Bank-kritische Daten (IBAN, BIC, Mandatsreferenz) verlassen nie den Server.
→ Konsistenz: Datenbankoperationen (Status-Updates, SepaSubmission) laufen atomar.
→ Validierung: Strukturprüfung der XML vor Auslieferung möglich.

**Warum separate Dateien pro Vertragspartner (nicht eine Sammeldatei)?**
→ Entscheidung aus PROJ-16 RE-Phase.
→ Einfacheres Tracking: Jede Datei = ein Vertragspartner = klare Zuordnung.
→ Fehler bei einem Vertragspartner blockt nicht die anderen.

**Warum Min. 5 Werktage Vorlaufzeit?**
→ SEPA CORE Pflicht-Frist (D-5 Regel). Kürzere Fristen nur bei B2B-Mandat.
→ Für MVP: Nur Wochenenden ausschließen, keine Feiertagskalender.

**Warum `SEPA_SUBMITTED` als neuer Status (statt direktes `PAID`)?**
→ Klare Trennung: Einzug beauftragt ≠ Geld eingegangen.
→ Rücklastschriften möglich (Bank bucht zurück) → Status bleibt änderbar.
→ Konsistenz im bestehenden Status-Workflow: DRAFT → INVOICED → SEPA_SUBMITTED → PAID.

---

### Neue API-Endpunkte

```
POST /api/admin/billing/sepa/generate
  → Empfängt: Vertragspartner-ID, Quelle, Fälligkeitsdatum, Sequenztyp
  → Gibt zurück: XML-Datei als Download
  → Schreibt: SepaSubmission, aktualisiert Rechnungsstatus

GET /api/admin/billing/sepa
  → Gibt zurück: Liste vergangener SEPA-Generierungen der Organisation

PATCH /api/admin/billing/invoices/[id] (Erweiterung bestehend)
  → Neuer erlaubter Status: SEPA_SUBMITTED → PAID (wenn Geld eingegangen)
```

---

### Neue Library (Installation nötig)

```
xmlbuilder2   →  ISO 20022 XML-Generierung (pain.008.003.03)
```

---

### Abgrenzung: Was bleibt unverändert

- `/admin/billing` Seiten-Layout bleibt gleich (nur Erweiterung)
- PDF-Export-Logik bleibt unangetastet
- Bestehende CompanyInvoice-Erstellung (Monat auswählen, PDF) bleibt wie bisher
- "Als bezahlt markieren" bleibt als separater Schritt (manuell, nach Zahlungseingang)
