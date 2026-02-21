# PROJ-15: SEPA Stammdaten – Bankverbindung & Lastschriftmandat pro Vertragspartner

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-5 (Vertragspartner-Monatsrechnung) – bestehende Company-Entität wird erweitert
- Wird benötigt von: PROJ-16 (Manuelle SEPA-Generierung), PROJ-17 (Scheduled SEPA-Job)

## Kontext & Motivation

Für die Generierung von SEPA Direct Debit XML-Dateien (pain.008.003.03 CORE) benötigt der Betreiber
pro Vertragspartner folgende Bankdaten, die aktuell **nicht** im System gespeichert werden:

- IBAN des Vertragspartners (Schuldner / Debtor)
- BIC/SWIFT des Vertragspartners
- Mandatsreferenz (eindeutige ID des unterzeichneten Lastschriftmandats)
- Mandatsdatum (Datum der Unterzeichnung des Mandats)

Zusätzlich benötigt der Betreiber **seine eigene Gläubiger-ID** (Creditor Identifier),
die einmalig in den Organisationseinstellungen hinterlegt wird.

---

## User Stories

- Als Admin möchte ich für jeden Vertragspartner IBAN, BIC, Mandatsreferenz und Mandatsdatum
  hinterlegen können, damit die SEPA-Lastschrift korrekt generiert werden kann.
- Als Admin möchte ich die Gläubiger-ID (Creditor Identifier) meiner Organisation in den
  Zahleinstellungen eintragen können, damit sie in alle SEPA-Dateien übernommen wird.
- Als Admin möchte ich sehen, welche Vertragspartner noch keine vollständigen SEPA-Bankdaten
  haben, damit ich fehlende Daten nachpflegen kann.
- Als Admin möchte ich bestehende SEPA-Bankdaten eines Vertragspartners jederzeit bearbeiten
  können (z.B. bei Kontoänderung des Vertragspartners).
- Als Admin möchte ich dass IBAN-Eingaben automatisch validiert werden (Format-Check),
  damit fehlerhafte Bankverbindungen sofort gemeldet werden.

---

## Acceptance Criteria

### Vertragspartner-Stammdaten (Admin-UI unter /admin/companies)
- [ ] Beim Bearbeiten eines Vertragspartners gibt es einen neuen Abschnitt „SEPA / Bankverbindung"
- [ ] Pflichtfelder für SEPA: IBAN, BIC, Mandatsreferenz, Mandatsdatum
- [ ] IBAN wird client- und serverseitig auf korrektes Format validiert (ISO 13616, min. Prüfziffer-Check)
- [ ] BIC wird auf grundlegendes Format validiert (8 oder 11 Zeichen, Buchstaben+Zahlen)
- [ ] Mandatsreferenz: Freitext, max. 35 Zeichen (SEPA-Limit)
- [ ] Mandatsdatum: Datumspicker, darf nicht in der Zukunft liegen
- [ ] Felder sind optional speicherbar – Vertragspartner ohne SEPA-Daten bleiben weiterhin nutzbar
- [ ] Übersichtstabelle der Vertragspartner zeigt visuellen Indikator (z.B. Icon), ob SEPA-Daten vollständig sind
- [ ] Gespeicherte IBAN wird in der UI maskiert angezeigt (z.B. DE89 •••• •••• •••• 3700)

### Gläubiger-ID in Organisationseinstellungen
- [ ] Unter /admin/settings/payments gibt es ein neues Feld „SEPA Gläubiger-ID (Creditor Identifier)"
- [ ] Format-Validierung der Gläubiger-ID (ISO 25577: z.B. DE98ZZZ09999999999)
- [ ] Feld ist ein Pflichtfeld für SEPA-Generierung (PROJ-16 gibt Fehlermeldung wenn nicht hinterlegt)
- [ ] Gläubiger-ID wird verschlüsselt in der Datenbank gespeichert (analog zu Zahlungsanbieter-Keys)

### Datenbank
- [ ] Company-Modell erhält neue Felder: `sepaIban`, `sepaBic`, `sepaMandateReference`, `sepaMandateDate`
- [ ] Migration wird erstellt und kann ohne Datenverlust ausgeführt werden
- [ ] Alle neuen Felder sind nullable (bestehende Vertragspartner-Datensätze bleiben unverändert)

---

## Edge Cases

- **Ungültige IBAN**: Fehlermeldung mit konkretem Hinweis (z.B. „Ungültige IBAN – Prüfziffer stimmt nicht"). Speichern wird blockiert.
- **Mandat-Datum in der Zukunft**: Validation-Error „Mandatsdatum darf nicht in der Zukunft liegen".
- **Vertragspartner ohne Mandat bei SEPA-Generierung**: PROJ-16 prüft Vollständigkeit und schließt Vertragspartner ohne SEPA-Daten aus (mit Warnung).
- **IBAN-Änderung nach erfolgter Lastschrift**: Keine technische Sperre – Admin trägt neue IBAN ein. Bestehende SEPA-Submissions werden nicht rückwirkend geändert.
- **Doppelte Mandatsreferenz**: Mandatsreferenz muss pro Organisation eindeutig sein → Validation-Error bei Duplikat.
- **Leere Gläubiger-ID bei Generierungsversuch**: PROJ-16 zeigt Fehlermeldung „Bitte zuerst Gläubiger-ID in den Zahleinstellungen hinterlegen".

---

## Technische Anforderungen

- IBAN-Validierung: clientseitig per Regex + Prüfziffer-Bibliothek (z.B. `ibantools`), serverseitig gleiche Logik
- Keine Verschlüsselung der IBAN nötig (nicht als hochsensibler Wert eingestuft, aber Maskierung in UI)
- Gläubiger-ID: in `OrganizationPaymentConfig` oder separatem Feld in `Organization`-Settings speichern
- API: PATCH /api/admin/companies/[id] erweitern um SEPA-Felder
- API: PUT /api/admin/settings/payments erweitern um creditorIdentifier-Feld
