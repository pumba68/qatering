# PROJ-5: Vertragspartner-Monatsrechnung (Zuschusskosten)

## Status: 🔵 Planned

## Kontext

Als **Betreiber der Kantine** sollen die durch **Unternehmenszuschüsse** entstandenen Kosten pro Vertragspartner (Company) erfasst und am Monatsende in Rechnung gestellt werden. Es entsteht pro Vertragspartner ein **Konto**, auf dem die Zuschussbeträge gebucht werden; andere Rabatte (z. B. Coupons, Aktionen) sind davon nicht betroffen.

---

## Kurzbeschreibung

- **Konto pro Vertragspartner:** Pro Company (Vertragspartner) wird ein Abrechnungskonto geführt, auf dem die **Differenz zwischen Realpreis und vom Kunden gezahltem Preis** (d. h. der Arbeitgeber-Zuschuss) eingebucht wird.
- **Geltungsbereich:** Fixe Zuschüsse, prozentuale Zuschüsse und fixe Rabatte des Vertragspartners – immer die **Differenz** (Realpreis − gezahlter Preis) wird dem Vertragspartner zugerechnet.
- **Nicht betroffen:** Rabatte, die **nicht** vertragspartner-spezifisch sind (z. B. allgemeine Coupons, Aktionen), werden **nicht** auf das Vertragspartner-Konto gebucht.
- **Monatsrechnung:** Am Monatsende kann eine **Monatsrechnung** pro Vertragspartner erstellt werden, die alle in der Abrechnungsperiode angefallenen Zuschusskosten auflistet und zur Einforderung dient.

---

## User Stories

- Als **Betreiber der Kantine** möchte ich, dass pro **Vertragspartner (Company)** ein **Abrechnungskonto** existiert, auf dem alle durch Unternehmenszuschuss entstandenen Kosten (Differenz Realpreis − gezahlter Preis) gebucht werden.
- Als **Betreiber der Kantine** möchte ich, dass bei jeder Bestellung eines Mitarbeiters eines Vertragspartners die **Zuschuss-Differenz** (z. B. 6 € Realpreis − 5,50 € gezahlt = 0,50 €) automatisch auf das Konto des Vertragspartners eingebucht wird – unabhängig davon, ob der Zuschuss als fester Betrag, fester Rabatt oder prozentual definiert ist.
- Als **Betreiber der Kantine** möchte ich, dass **nur** die vertragspartner-spezifischen Zuschüsse auf das Konto gebucht werden; **andere Rabatte** (z. B. Coupons, Aktionen ohne Firmenbezug) sollen **nicht** dem Vertragspartner in Rechnung gestellt werden.
- Als **Betreiber der Kantine** möchte ich **am Monatsende eine Monatsrechnung** pro Vertragspartner erstellen können, die alle in der Abrechnungsperiode angefallenen Zuschusskosten auflistet und einen Gesamtbetrag zur Einforderung ausweist.
- Als **Betreiber der Kantine** möchte ich die Monatsrechnung als **PDF exportieren** können; nach dem Export soll die Rechnung den Status **„Rechnung gestellt“** erhalten.
- Als **Betreiber der Kantine** möchte ich den Status einer gestellten Rechnung auf **„Bezahlt“** setzen können, sobald der Vertragspartner gezahlt hat.
- Als **Betreiber der Kantine** möchte ich die **Kontostände** bzw. die **Summe der gebuchten Zuschusskosten** pro Vertragspartner einsehen können (z. B. laufend oder für einen Zeitraum).
- Als **Betreiber der Kantine** möchte ich auf der Rechnung **Einzelposten** je Bestellung sehen: **Bestellnummer, Datum, Mitarbeiter, Summe** (Zuschussbetrag).

---

## Acceptance Criteria

- [ ] Pro **Vertragspartner (Company)** existiert ein Abrechnungskonto (oder eine äquivalente Abrechnungslogik), auf dem **nur** die Beträge gebucht werden, die auf **Arbeitgeber-Zuschuss** (Company-Subvention) entfallen.
- [ ] Bei jeder **Bestellung**, bei der ein **Arbeitgeber-Zuschuss** angewendet wird (Mitarbeiter eines Vertragspartners, Zuschuss konfiguriert), wird die **Differenz** (Realpreis − vom Kunden gezahlter Preis) dem Vertragspartner-Konto **automatisch** zugerechnet (Buchung).
- [ ] Die Buchung gilt für **alle Zuschuss-Arten**: fixer Betrag, prozentualer Zuschuss, fixer Rabatt – es wird immer die tatsächliche **Differenz** zwischen Realpreis und gezahltem Preis erfasst.
- [ ] **Andere Rabatte** (z. B. Coupon-Rabatt, Aktionspreis ohne Firmenbezug) werden **nicht** auf das Vertragspartner-Konto gebucht; nur der Anteil, der explizit dem Vertragspartner-Zuschuss zuzuordnen ist, wird gebucht.
- [ ] Der Betreiber kann **am Monatsende** (oder für einen konfigurierbaren Zeitraum) eine **Monatsrechnung** pro Vertragspartner erstellen: Auflistung der gebuchten Zuschusskosten mit **Einzelposten** (siehe unten) und **Gesamtbetrag** zur Einforderung.
- [ ] Die Rechnung kann als **PDF exportiert** werden. **Nach dem Export** erhält die Rechnung automatisch den Status **„Rechnung gestellt“**.
- [ ] Der Betreiber kann den Status einer Rechnung von **„Rechnung gestellt“** auf **„Bezahlt“** wechseln (z. B. nach Zahlungseingang).
- [ ] **Einzelposten** auf der Rechnung: Pro gebuchter Bestellung mindestens **Bestellnummer, Datum, Mitarbeiter** (Name des bestellenden Mitarbeiters), **Summe** (Zuschussbetrag in €).
- [ ] Der Betreiber kann den **Kontostand** bzw. die **Summe der Zuschusskosten** pro Vertragspartner einsehen (z. B. in einer Admin-Übersicht oder Abrechnungsseite).
- [ ] Stornierte oder rückerstattete Bestellungen: Die zugehörigen Zuschussbeträge werden **nicht** oder **nur korrigierend** auf dem Vertragspartner-Konto berücksichtigt (Regel definieren: z. B. Storno = Rückbuchung).

---

## Edge Cases

- **Bestellung mit sowohl Vertragspartner-Zuschuss als auch Coupon:** Nur der Anteil, der dem Vertragspartner-Zuschuss entspricht (Differenz durch Company-Subvention), wird gebucht; der Coupon-Rabatt geht nicht auf das Vertragspartner-Konto.
- **Vertragspartner wechselt Zuschuss-Konfiguration mitten im Monat:** Buchungen erfolgen mit dem zum Buchungszeitpunkt gültigen Zuschuss; die Monatsrechnung enthält alle Buchungen der Periode unabhängig von späteren Konfigurationsänderungen.
- **Mitarbeiter gehört mehreren Companies / Zuordnung unklar:** Klarstellung, ob pro Bestellung nur ein Vertragspartner (z. B. primäre Company) gilt; Buchung nur einer Company zuordnen.
- **Stornierte Bestellung:** Zuschussbetrag wurde bereits gebucht – Rückbuchung auf dem Vertragspartner-Konto oder Korrektur in der Monatsrechnung (z. B. Storno-Posten mit negativem Betrag).
- **Abrechnungszeitraum:** Monatsende = Kalendermonat oder rollierender Zeitraum? Ggf. konfigurierbar (z. B. 1.–31. des Monats).
- **Rechnungserstellung mehrfach für denselben Zeitraum:** Nach Export/„Rechnung gestellt“ ggf. keine zweite Rechnung für dieselbe Company/Periode ohne Korrektur (Status-Logik berücksichtigen).

---

## Rechnungsstatus & Einzelposten (Entscheidungen)

| Anforderung | Entscheidung |
|-------------|--------------|
| **Export** | Monatsrechnung wird als **PDF** exportiert. |
| **Status nach Export** | Nach PDF-Export wird die Rechnung auf **„Rechnung gestellt“** gesetzt. |
| **Status bei Zahlung** | Betreiber kann den Status manuell auf **„Bezahlt“** wechseln. |
| **Einzelposten** | Jede Zeile der Rechnung: **Bestellnummer**, **Datum**, **Mitarbeiter** (Name), **Summe** (Zuschussbetrag). |

---

## Abhängigkeiten

- **Bestehendes Modell:** `Company` (Vertragspartner) mit Zuschuss-Konfiguration (`subsidyType`, `subsidyValue`, …); `Order` mit `employerSubsidyAmount`, `employerCompanyId` – die **Differenz** (Zuschussbetrag) pro Bestellung ist damit grundsätzlich abbildbar.
- **Benötigt:** Sichere Erfassung von `employerSubsidyAmount` pro Order (falls noch nicht bei jeder Bestellung gesetzt); Abrechnungskonto bzw. Aggregation der Beträge pro Company und Zeitraum; Rechnungsentität mit Status (z. B. offen → Rechnung gestellt → Bezahlt); PDF-Generierung; Einzelposten mit Bestellnummer, Datum, Mitarbeiter, Summe.

---

## Zusammenfassung (Verständnis)

| Aspekt | Erfassung |
|--------|-----------|
| **Wer** | Betreiber der Kantine |
| **Was** | Monatsrechnung an Vertragspartner für entstandene Zuschusskosten |
| **Konto** | Pro Vertragspartner (Company) – Buchung der Differenz Realpreis − gezahlter Preis (nur Vertragspartner-Zuschuss) |
| **Buchungslogik** | Fix, prozentual, fixer Rabatt – immer die **Differenz**; andere Rabatte (nicht vertragspartner-spezifisch) bleiben außen vor |
| **Zeitpunkt** | Am Monatsende Rechnung über alle in der Periode angefallenen Kosten zur Einforderung |
| **PDF** | Rechnung als PDF exportierbar; nach Export Status „Rechnung gestellt“ |
| **Status** | „Rechnung gestellt“ → manuell auf „Bezahlt“ wechselbar |
| **Einzelposten** | Bestellnummer, Datum, Mitarbeiter, Summe (Zuschussbetrag) |

---

## QA Test Results

**Tested:** 2026-02-19  
**App URL:** http://localhost:3002  
**Status:** Implementierung vorhanden (/admin/billing)

### Implementierungsstatus

- [ ] **Abrechnungskonto pro Vertragspartner:** Seite /admin/billing vorhanden; API /api/admin/billing/overview, invoices
- [ ] **Monatsrechnung erstellen:** API-Struktur vorhanden
- [ ] **PDF-Export:** API `/api/admin/billing/invoices/{id}/export-pdf`
- [ ] **Status Rechnung gestellt / Bezahlt:** UI-Elemente in billing/page.tsx

### Summary

- Vertragspartner-Abrechnung ist grundsätzlich implementiert.
- Vollständige QA gegen alle Acceptance Criteria bei nächstem Testlauf empfohlen.
