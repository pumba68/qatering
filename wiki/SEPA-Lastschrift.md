# SEPA-Lastschrift – Betreiber-Dokumentation

**Thema:** SEPA Direct Debit – Einziehung von Vertragspartner-Forderungen
**Zielgruppe:** Betreiber (Admin / Super-Admin)
**Voraussetzungen:** Admin-Zugang zum qatering-Backoffice

---

## Inhaltsverzeichnis

1. [Was ist die SEPA-Lastschrift-Funktion?](#1-was-ist-die-sepa-lastschrift-funktion)
2. [Wann und warum verwende ich sie?](#2-wann-und-warum-verwende-ich-sie)
3. [Einmalige Einrichtung (Setup)](#3-einmalige-einrichtung-setup)
   - 3.1 [Betreiber-SEPA-Daten hinterlegen](#31-betreiber-sepa-daten-hinterlegen)
   - 3.2 [SEPA-Bankdaten pro Vertragspartner hinterlegen](#32-sepa-bankdaten-pro-vertragspartner-hinterlegen)
4. [SEPA-Datei manuell generieren (Schritt-für-Schritt)](#4-sepa-datei-manuell-generieren-schritt-für-schritt)
   - 4.1 [Voraussetzungen prüfen](#41-voraussetzungen-prüfen)
   - 4.2 [SEPA-Modal öffnen](#42-sepa-modal-öffnen)
   - 4.3 [Quelle auswählen](#43-quelle-auswählen)
   - 4.4 [Sequenztyp wählen](#44-sequenztyp-wählen)
   - 4.5 [Fälligkeitsdatum festlegen](#45-fälligkeitsdatum-festlegen)
   - 4.6 [Generieren und herunterladen](#46-generieren-und-herunterladen)
   - 4.7 [XML-Datei bei der Bank einreichen](#47-xml-datei-bei-der-bank-einreichen)
5. [Automatisierter SEPA-Job (geplant – PROJ-17)](#5-automatisierter-sepa-job-geplant--proj-17)
6. [Rechnungsstatus-Übersicht](#6-rechnungsstatus-übersicht)
7. [Häufige Fehlermeldungen und Lösungen](#7-häufige-fehlermeldungen-und-lösungen)
8. [Sicherheit und Datenschutz](#8-sicherheit-und-datenschutz)
9. [Glossar](#9-glossar)

---

## 1. Was ist die SEPA-Lastschrift-Funktion?

Die **SEPA-Lastschrift-Funktion** ermöglicht es dem Betreiber, offene Forderungen gegenüber Vertragspartnern (Arbeitgebern) automatisch per Bankeinzug einzuziehen.

Dazu generiert das System eine **standardkonforme XML-Datei** im Format **ISO 20022 pain.008.003.03 CORE** (SEPA Core Direct Debit). Diese Datei wird einmalig bei der eigenen Hausbank hochgeladen, die dann den Betrag direkt vom Konto des Vertragspartners abbucht.

**Kein manueller Überweisungseingang nötig** – der Betreiber zieht den Betrag aktiv ein, anstatt auf die Überweisung des Vertragspartners zu warten.

---

## 2. Wann und warum verwende ich sie?

| Situation | Lösung |
|---|---|
| Vertragspartner hat Rechnungen gestellt bekommen, aber noch nicht überwiesen | SEPA-Lastschrift aus **INVOICED-Rechnungen** generieren |
| Offene Bestellbeträge noch nicht in Rechnung gestellt | SEPA-Lastschrift aus **Offenem Saldo** generieren (das System erstellt dabei automatisch eine Rechnung) |
| Monatliche Abrechnung mit mehreren Vertragspartnern | Pro Vertragspartner eine eigene XML-Datei generieren und bei der Bank einreichen |

> **Wichtig:** Pro Vertragspartner wird **eine separate XML-Datei** erstellt. Mehrere Vertragspartner können nicht in einer Sammeldatei zusammengefasst werden.

---

## 3. Einmalige Einrichtung (Setup)

Bevor die erste SEPA-Lastschrift generiert werden kann, müssen zwei Dinge einmalig eingerichtet werden:

### 3.1 Betreiber-SEPA-Daten hinterlegen

**Wo:** Admin-Bereich → **Einstellungen** → **Zahlungen** → Abschnitt „SEPA-Einstellungen"

| Feld | Beschreibung | Beispiel |
|---|---|---|
| **Gläubiger-ID (Creditor Identifier)** | Eindeutige ID Ihres Unternehmens als SEPA-Lastschrifteinreicher. Beantragen Sie diese einmalig bei Ihrer Hausbank oder der Bundesbank. | `DE98ZZZ09999999999` |
| **Betreiber-IBAN** | Die IBAN des Kontos, **auf das** die Lastschriften eingezogen werden sollen (Ihr Empfängerkonto). | `DE89 3704 0044 0532 0130 00` |
| **Betreiber-BIC** | Der BIC/SWIFT-Code Ihrer Bank. | `COBADEFFXXX` |

**Schritte:**
1. Navigieren Sie zu **Einstellungen → Zahlungen**.
2. Scrollen Sie zum Abschnitt „SEPA-Einstellungen".
3. Klicken Sie auf das Stift-Symbol neben dem jeweiligen Feld.
4. Tragen Sie den Wert ein und bestätigen Sie mit **Speichern**.
5. Wiederholen Sie dies für alle drei Felder (Gläubiger-ID, IBAN, BIC).

Eine **grüne Vollständigkeitsanzeige** (✅ Vollständig) erscheint, sobald alle drei Felder gesetzt sind.

> **Hinweis zur Gläubiger-ID:** Die Gläubiger-ID ist ein 18-stelliger Code im Format `DE98ZZZ09999999999`. Sie wird einmalig von Ihrer Hausbank oder der Deutschen Bundesbank vergeben. Ohne diese ID kann keine SEPA-Lastschrift generiert werden.

---

### 3.2 SEPA-Bankdaten pro Vertragspartner hinterlegen

**Wo:** Admin-Bereich → **Vertragspartner** → Vertragspartner auswählen → Bearbeiten → Abschnitt „SEPA / Bankverbindung"

Für jeden Vertragspartner, der per SEPA-Lastschrift bezahlen soll, müssen folgende Daten hinterlegt sein:

| Feld | Beschreibung | Pflicht |
|---|---|---|
| **IBAN** | IBAN des Vertragspartners (Schuldner-Konto, von dem abgebucht wird) | Ja |
| **BIC** | BIC/SWIFT-Code der Bank des Vertragspartners | Ja |
| **Mandatsreferenz** | Eindeutige Referenz des unterzeichneten SEPA-Lastschriftmandats (max. 35 Zeichen). Sie vergeben diese selbst, z.B. `VP-MUSTERGMBH-001`. | Ja |
| **Mandatsdatum** | Datum, an dem der Vertragspartner das Lastschriftmandat unterzeichnet hat | Ja |

**Schritte:**
1. Navigieren Sie zu **Vertragspartner**.
2. Suchen Sie den gewünschten Vertragspartner und klicken Sie auf **Bearbeiten**.
3. Scrollen Sie zum Abschnitt „SEPA / Bankverbindung".
4. Tragen Sie IBAN, BIC, Mandatsreferenz und Mandatsdatum ein.
5. Speichern Sie die Änderungen.

**Wo erkenne ich den SEPA-Status?**

In der Vertragspartner-Übersicht und in der Abrechnungs-Übersicht zeigt ein Icon den SEPA-Datenstatus:

- ✅ **Vollständig** – Alle SEPA-Felder sind ausgefüllt. Lastschrift kann generiert werden.
- ⚠ **Fehlt** – Mindestens ein Pflichtfeld fehlt. Lastschrift wird blockiert.

> **Was ist ein SEPA-Lastschriftmandat?**
> Ein Lastschriftmandat ist eine schriftliche Genehmigung des Vertragspartners, dass Sie Beträge von seinem Konto einziehen dürfen. Das Mandat muss vom Vertragspartner **vor** der ersten Lastschrift unterzeichnet worden sein. Ohne gültiges Mandat ist die Lastschrift rechtlich nicht zulässig. Bewahren Sie das unterzeichnete Dokument sorgfältig auf.

---

## 4. SEPA-Datei manuell generieren (Schritt-für-Schritt)

### 4.1 Voraussetzungen prüfen

Stellen Sie sicher, dass Folgendes erfüllt ist, bevor Sie fortfahren:

- [ ] Betreiber-SEPA-Daten vollständig (Gläubiger-ID, IBAN, BIC) → **Einstellungen → Zahlungen**
- [ ] SEPA-Bankdaten des Vertragspartners vollständig (IBAN, BIC, Mandatsreferenz, Mandatsdatum) → **Vertragspartner → Bearbeiten**
- [ ] Offene Beträge vorhanden (entweder Rechnungen mit Status „Rechnung gestellt" oder unbezahlte Bestellungen)
- [ ] Das gewünschte Fälligkeitsdatum liegt **mindestens 5 Werktage** in der Zukunft (SEPA-Pflichtfrist)

---

### 4.2 SEPA-Modal öffnen

1. Navigieren Sie zu **Finanzen → Abrechnung**.
2. In der Tabelle „Offene Salden" finden Sie alle aktiven Vertragspartner.
3. Klicken Sie in der Zeile des gewünschten Vertragspartners auf den Button **SEPA-Lastschrift**.
4. Das SEPA-Generierungs-Modal öffnet sich.

> **Grauer/deaktivierter Button?** Das SEPA-Lastschrift-Modal lässt sich immer öffnen. Jedoch ist der „Generieren"-Button deaktiviert, wenn die SEPA-Bankdaten des Vertragspartners unvollständig sind. Eine orangefarbene Warnmeldung im Modal erklärt, welche Daten noch fehlen.

---

### 4.3 Quelle auswählen

Wählen Sie im Modal die **Quelle** der einzuziehenden Beträge:

#### Option A: INVOICED-Rechnungen
Zieht alle Rechnungen ein, die bereits den Status **„Rechnung gestellt"** haben (also bereits per PDF versandt wurden, aber noch nicht bezahlt sind).

**Wann verwenden?**
- Der Vertragspartner hat bereits eine Rechnung erhalten und bezahlt nicht.
- Sie möchten präzise kontrollieren, welche Rechnungsperioden eingezogen werden.

#### Option B: Offener Saldo
Fasst alle **noch nicht abgerechneten Bestellungen** zu einer neuen Rechnung zusammen und zieht diesen Gesamtbetrag per Lastschrift ein.

**Wann verwenden?**
- Sie möchten den laufenden Monat direkt per Lastschrift abrechnen, ohne vorher eine PDF-Rechnung zu erstellen.
- Das System erstellt dabei **automatisch eine interne Rechnung** mit dem Status „SEPA eingereicht".

**Vorschau der Positionen:**
Sobald Sie eine Quelle auswählen, lädt das Modal automatisch eine Vorschau der enthaltenen Positionen und zeigt den **Gesamtbetrag** an.

---

### 4.4 Sequenztyp wählen

| Sequenztyp | Bedeutung | Wann verwenden? |
|---|---|---|
| **RCUR** – Wiederkehrend | Standardtyp für regelmäßige Lastschriften vom gleichen Mandat | Ab der zweiten Lastschrift an denselben Vertragspartner |
| **FRST** – Erstlastschrift | Erste Lastschrift auf Basis eines neuen Mandats | Beim allerersten Einzug eines neuen Mandats |

> **Tipp:** Im Zweifelsfall verwenden Sie **RCUR**. FRST ist nur für den wirklich ersten Einzug auf Basis eines brandneuen Mandats vorgesehen. Eine falsch gewählte Sequenz kann von der Bank zurückgewiesen werden.

---

### 4.5 Fälligkeitsdatum festlegen

Das Fälligkeitsdatum ist der Tag, an dem der Betrag vom Konto des Vertragspartners abgebucht wird.

**Pflicht-Vorlaufzeit:** SEPA CORE erfordert mindestens **5 Werktage** zwischen Einreichung bei der Bank und Fälligkeitsdatum. Das System berechnet automatisch das frühestmögliche Datum und sperrt frühere Eingaben.

**Beispiel:**
Sie generieren die Datei am Montag, 24. Februar 2026.
→ Frühestes zulässiges Fälligkeitsdatum: Montag, **2. März 2026** (5 Werktage später, Wochenenden werden übersprungen).

> **Hinweis:** Das System berücksichtigt für die MVP-Berechnung nur Wochenenden, keine gesetzlichen Feiertage. Wenn Sie auf Nummer sicher gehen wollen, planen Sie 1–2 Tage mehr Puffer ein, besonders um Feiertage herum.

---

### 4.6 Generieren und herunterladen

1. Überprüfen Sie die Vorschau (Positionen, Gesamtbetrag, Datum, Sequenztyp).
2. Klicken Sie auf **„Generieren & Herunterladen"**.
3. Der Browser lädt automatisch eine XML-Datei herunter.

**Dateiname:** `sepa-lastschrift-{Unternehmensname}-{YYYY-MM-DD}.xml`
Beispiel: `sepa-lastschrift-Muster-GmbH-2026-03-02.xml`

**Was passiert im Hintergrund:**
- Die betroffenen Rechnungen erhalten den Status **„SEPA eingereicht"** (SEPA_SUBMITTED).
- Ein **Submission-Eintrag** wird in der Datenbank gespeichert (mit Datum, Betrag, Sequenztyp und enthaltenen Rechnungen).
- Das Modal schließt sich und die Übersicht wird aktualisiert.

---

### 4.7 XML-Datei bei der Bank einreichen

Die heruntergeladene `.xml`-Datei muss **bei Ihrer Hausbank** eingereicht werden. Jede Bank hat einen eigenen Weg:

| Einreichungsweg | Beschreibung |
|---|---|
| **Online-Banking-Portal** | Datei im SEPA-Lastschrift-Bereich hochladen (häufigster Weg) |
| **EBICS** | Elektronischer Bankzugang für Geschäftskunden (automatisierter Upload) |
| **Bankberater** | Persönliche Übergabe der Datei (nicht empfohlen für regulären Betrieb) |

**Nach dem Einreichen:**
- Die Bank verarbeitet die Lastschrift und bucht den Betrag am Fälligkeitsdatum vom Konto des Vertragspartners ab.
- Sobald das Geld auf Ihrem Konto eingegangen ist, markieren Sie die Rechnung manuell als **„Bezahlt"** unter **Finanzen → Abrechnung → Rechnungen → Als bezahlt markieren**.

**Rücklastschrift (Rückbuchung):**
Falls der Vertragspartner die Lastschrift zurückbucht (z.B. wegen fehlender Kontodeckung oder Widerspruch), wird dies direkt von Ihrer Bank gemeldet. In diesem Fall:
1. Die Rechnung verbleibt im Status „SEPA eingereicht" (wird nicht automatisch zurückgesetzt).
2. Klären Sie das Problem mit dem Vertragspartner.
3. Setzen Sie die Rechnung ggf. manuell zurück und stellen Sie eine neue Rechnung aus oder versuchen Sie einen erneuten Einzug.

---

## 5. Automatisierter SEPA-Job (geplant – PROJ-17)

> **Status:** Diese Funktion ist geplant und noch nicht verfügbar.

In einer zukünftigen Version wird es möglich sein, einen **automatisierten SEPA-Job** zu konfigurieren, der monatlich alle offenen Forderungen gegenüber Vertragspartnern vorbereitet.

**Geplanter Ablauf:**

```
1. Cron-Job läuft automatisch (z.B. jeden 1. des Monats)
       ↓
2. System generiert SEPA-XML für alle Vertragspartner
   mit vollständigen SEPA-Daten und offenen Beträgen
       ↓
3. Admin erhält Benachrichtigung im Admin-Panel:
   „X neue SEPA-Dateien zur Bestätigung bereit"
       ↓
4. Admin prüft jede Datei (Betrag, Vertragspartner,
   Rechnungen) und bestätigt oder lehnt ab
       ↓
5. Erst nach Bestätigung: Download + Status SEPA_SUBMITTED
       ↓
6. Admin reicht Dateien bei der Bank ein
```

**Geplante Konfigurationsoptionen:**

| Einstellung | Optionen | Standard |
|---|---|---|
| Job aktiv | Ja / Nein | Nein |
| Ausführungstag | 1–28 | 1. des Monats |
| Datenquelle | INVOICED-Rechnungen / Offener Saldo | INVOICED |
| Vorlaufzeit (Werktage) | Frei konfigurierbar | 5 |
| Sequenztyp | FRST / RCUR | RCUR |

> Der automatisierte Job **setzt keine Rechnungen automatisch auf SEPA_SUBMITTED** – das geschieht erst nach der **manuellen Bestätigung** durch den Admin. So bleibt die Kontrolle immer beim Betreiber.

---

## 6. Rechnungsstatus-Übersicht

Vertragspartner-Rechnungen durchlaufen folgenden Statusfluss:

```
DRAFT
  │  Admin erstellt Rechnung für einen Monat
  ▼
INVOICED  (Rechnung gestellt)
  │  PDF wird exportiert → Status wechselt automatisch
  │  oder: SEPA-Lastschrift aus INVOICED-Rechnungen wird generiert
  ▼
SEPA_SUBMITTED  (SEPA eingereicht)
  │  XML-Datei wurde generiert und bei der Bank eingereicht
  │  Geldeingang ausstehend
  ▼
PAID  (Bezahlt)
     Admin markiert manuell als bezahlt
     nachdem Geldeingang bestätigt wurde
```

| Status | Anzeige im System | Bedeutung |
|---|---|---|
| `DRAFT` | Entwurf | Rechnung angelegt, noch nicht versendet |
| `INVOICED` | Rechnung gestellt | PDF exportiert, Zahlung erwartet |
| `SEPA_SUBMITTED` | SEPA eingereicht | SEPA-XML generiert, Einzug beauftragt |
| `PAID` | Bezahlt | Zahlungseingang manuell bestätigt |

---

## 7. Häufige Fehlermeldungen und Lösungen

### „Betreiber-SEPA-Daten unvollständig"
**Ursache:** Gläubiger-ID, Betreiber-IBAN oder Betreiber-BIC fehlen in den Zahleinstellungen.
**Lösung:** Navigieren Sie zu **Einstellungen → Zahlungen → SEPA-Einstellungen** und ergänzen Sie die fehlenden Felder.

---

### „Vertragspartner hat unvollständige SEPA-Bankdaten"
**Ursache:** IBAN, BIC, Mandatsreferenz oder Mandatsdatum des Vertragspartners fehlen.
**Lösung:** Navigieren Sie zu **Vertragspartner**, öffnen Sie den Vertragspartner und ergänzen Sie unter „SEPA / Bankverbindung" die fehlenden Felder.

---

### „Keine Rechnungen mit Status ‚Rechnung gestellt'"
**Ursache:** Sie haben Quelle „INVOICED-Rechnungen" gewählt, aber alle Rechnungen des Vertragspartners befinden sich noch im Status `DRAFT`, `SEPA_SUBMITTED` oder `PAID`.
**Lösung:** Exportieren Sie zuerst eine Rechnung als PDF (Status wechselt dadurch auf `INVOICED`), oder wählen Sie alternativ die Quelle „Offener Saldo".

---

### „Kein offener Saldo für diesen Vertragspartner"
**Ursache:** Sie haben Quelle „Offener Saldo" gewählt, aber es gibt keine nicht-abgerechneten Bestellungen mit Zuschussbetrag.
**Lösung:** Stellen Sie sicher, dass Bestellungen mit Arbeitgeber-Zuschuss vorliegen, die noch keiner Rechnung zugeordnet sind.

---

### „SEPA CORE erfordert mindestens 5 Werktage Vorlaufzeit"
**Ursache:** Das gewählte Fälligkeitsdatum liegt zu nah am aktuellen Datum.
**Lösung:** Das System zeigt das frühestmögliche Datum an. Wählen Sie dieses Datum oder einen späteren Termin.

---

### „XML-Generierung fehlgeschlagen"
**Ursache:** Interner Fehler bei der XML-Erstellung (z.B. ungültige Sonderzeichen in Namen).
**Lösung:** Prüfen Sie, ob der Name des Vertragspartners oder der Verwendungszweck ungewöhnliche Zeichen enthält. Kontaktieren Sie den Support mit dem genauen Zeitpunkt des Fehlers.

---

### „Ungültige IBAN – Prüfziffer stimmt nicht"
**Ursache:** Die eingegebene IBAN hat eine fehlerhafte Prüfziffer.
**Lösung:** Überprüfen Sie die IBAN des Vertragspartners (am besten direkt aus einem Kontoauszug oder Briefkopf entnehmen) und tragen Sie sie erneut ein.

---

## 8. Sicherheit und Datenschutz

- **IBAN-Maskierung:** In der Benutzeroberfläche wird die IBAN teilweise maskiert angezeigt (z.B. `DE89 •••• •••• •••• 3700`), um versehentliche Weitergabe zu vermeiden.
- **Serverseitige Generierung:** Die XML-Datei wird ausschließlich auf dem Server generiert. Bankdaten (IBAN, BIC, Mandatsreferenz) verlassen den Server nie unverschlüsselt in Richtung Browser – nur die fertige Datei wird übertragen.
- **Zugriffsschutz:** Die SEPA-Funktion ist ausschließlich für Benutzer mit der Rolle **Admin** oder **Super-Admin** zugänglich.
- **Mandatsaufbewahrung:** Das unterzeichnete Lastschriftmandat muss gemäß SEPA-Regelwerk **14 Monate nach dem letzten Einzug** aufbewahrt werden. Dies liegt in der Verantwortung des Betreibers (außerhalb des Systems).

---

## 9. Glossar

| Begriff | Erklärung |
|---|---|
| **SEPA** | Single Euro Payments Area – einheitlicher europäischer Zahlungsverkehrsraum |
| **Direct Debit / Lastschrift** | Zahlungsverfahren, bei dem der Gläubiger den Betrag aktiv vom Schuldner-Konto einzieht |
| **pain.008.003.03** | ISO 20022 XML-Dateiformat für SEPA Core Direct Debit |
| **SEPA CORE** | Standardverfahren für Lastschriften (B2C und B2B), mit 5-Werktage-Vorlaufzeit |
| **Gläubiger-ID (Creditor Identifier)** | Eindeutige 18-stellige ID des Lastschrift-Einreichers; wird einmalig von der Bank vergeben |
| **Mandat** | Unterschriebene Erlaubnis des Kontoinhabers (Vertragspartner), Lastschriften zuzulassen |
| **Mandatsreferenz** | Eindeutige Kennung des Mandats (max. 35 Zeichen), z.B. `VP-MUSTERGMBH-001` |
| **FRST** | Sequenztyp „Erstlastschrift" – erste Lastschrift auf Basis eines neuen Mandats |
| **RCUR** | Sequenztyp „Wiederkehrend" – Folge-Lastschriften auf bestehendem Mandat |
| **EndToEndId** | Eindeutige Transaktionsreferenz innerhalb der XML-Datei (wird von der Bank durchgereicht) |
| **Fälligkeitsdatum (ReqdColltnDt)** | Das Datum, an dem die Bank den Einzug ausführt |
| **SEPA_SUBMITTED** | Interner Rechnungsstatus: SEPA-XML wurde generiert, Einzug ist beauftragt |
| **EBICS** | Elektronischer Bankzugang-Standard für automatisierten Dateitransfer mit der Bank |
| **Rücklastschrift** | Stornierung einer Lastschrift durch die Bank oder den Kontoinhaber |
| **BIC / SWIFT** | Bank Identifier Code – internationaler Bankcode (8 oder 11 Zeichen) |

---

*Letzte Aktualisierung: Februar 2026 | qatering Admin-Dokumentation*
