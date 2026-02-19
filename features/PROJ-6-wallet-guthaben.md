# PROJ-6: Guthaben & Wallet

## Status: ✅ Implementiert (MVP Phase 1)

## Kurzbeschreibung

Internes Guthaben-basiertes Zahlungssystem. Mitarbeiter haben ein Guthaben-Konto und bezahlen damit bargeldlos für Mahlzeiten. Nur Admin/Manager können Guthaben aufladen (z. B. nach Barzahlung oder Überweisung). Transaktionen werden protokolliert; bei Bestellungen wird das Guthaben automatisch abgebucht.

---

## User Stories

### Als Mitarbeiter / Kunde

- möchte ich mein aktuelles Guthaben einsehen können, damit ich weiß, wie viel ich noch zur Verfügung habe.
- möchte ich alle meine Transaktionen (Aufladungen, Käufe, Erstattungen) einsehen können, damit ich meine Ausgaben nachvollziehen kann.
- möchte ich bei niedrigem Guthaben benachrichtigt werden, damit ich rechtzeitig aufladen kann.
- möchte ich automatisch für Bestellungen bezahlen können, ohne jedes Mal Bargeld mitzubringen.

### Als Kantinen-Manager / Admin

- möchte ich Guthaben manuell zu Benutzerkonten hinzufügen können, damit Mitarbeiter per Barzahlung oder Überweisung aufladen können.
- möchte ich alle Benutzerguthaben verwalten und ggf. anpassen können, damit ich Unstimmigkeiten korrigieren kann.
- möchte ich Finanzberichte erstellen können, damit ich Einnahmen und Guthaben-Statistiken sehe (Post-MVP).

### Als System

- sollen alle Transaktionen protokolliert werden, um vollständige Nachvollziehbarkeit zu gewährleisten.
- sollen Race Conditions bei Guthabenänderungen verhindert werden, um Dateninkonsistenzen zu vermeiden.

---

## Acceptance Criteria

### AC-1: Guthaben anzeigen (Kunde)

- [x] Guthaben im Header anzeigen (alle Seiten, wenn eingeloggt)
- [x] Guthaben auf Dashboard anzeigen
- [x] Guthaben auf `/wallet`-Seite anzeigen
- [x] Format: z. B. „Guthaben: 25,50 €“
- [x] Echtzeit-Aktualisierung nach Bestellung
- [ ] Niedrig-Guthaben-Warnung (&lt; 5 €): „Guthaben niedrig – bitte aufladen“ (optional)
- [ ] Null-Guthaben-Warnung: „Kein Guthaben – Bitte aufladen“ (optional)

### AC-2: Manuelle Aufladung durch Admin

- [x] Admin-Seite: `/admin/wallet/top-up`
- [x] Benutzer nach E-Mail suchen/auswählen
- [x] Auflade-Betrag eingeben (min: 5 €, max: 200 €)
- [x] Optionale Notiz hinzufügen (z. B. „Barzahlung 2026-01-24“)
- [x] Absenden → Guthaben sofort hinzugefügt
- [x] Transaktion in Benutzer-Historie aufgezeichnet
- [ ] E-Mail-Bestätigung an Benutzer (optional)

### AC-3: Automatischer Abzug bei Bestellung

- [x] Bestellung prüft zuerst Guthaben
- [x] Unzureichendes Guthaben → Bestellung abgelehnt mit Fehlermeldung
- [x] Ausreichendes Guthaben → Guthaben atomar abgebucht
- [x] Transaktion aufgezeichnet mit Bestellreferenz
- [x] Guthaben in Echtzeit aktualisiert
- [x] Neues Guthaben in Bestellbestätigung angezeigt

### AC-4: Transaktionshistorie

- [x] Seite `/wallet/history` zeigt alle Transaktionen
- [x] Anzeige: Datum, Typ, Betrag, Guthaben danach, Beschreibung
- [x] Farbcodierung: Gutschriften vs. Abbuchungen
- [x] Sortierung nach Datum (neueste zuerst)
- [ ] Filter nach Typ (Alle, Aufladungen, Bestellungen, Erstattungen) (optional)
- [ ] Filter nach Datumsbereich (optional)
- [ ] Paginierung (optional)

### AC-5: Admin Guthabenverwaltung

- [x] Admin-Seite: `/admin/wallet/balances`
- [x] Liste aller Benutzer mit aktuellem Guthaben
- [x] Nach Benutzer suchen
- [x] Manuelle Anpassung: Guthaben hinzufügen oder abziehen
- [x] Grund für manuelle Anpassung erforderlich
- [ ] Filter: Niedriges Guthaben (&lt; 5 €), Null-Guthaben (optional)
- [ ] Gesamtguthaben aller Benutzer anzeigen (optional)

### AC-6: Niedrig-Guthaben-Benachrichtigungen (Post-MVP)

- [ ] E-Mail, wenn Guthaben &lt; 5 €
- [ ] Banner-Benachrichtigung auf Dashboard
- [ ] Benutzer kann Benachrichtigungen in Einstellungen deaktivieren

### AC-7: Finanzberichte (Post-MVP)

- [ ] Admin-Seite: z. B. `/admin/reports/financial`
- [ ] Gesamtguthaben im Umlauf, Einnahmen, Aufladungen, Erstattungen
- [ ] Bericht als PDF/CSV exportierbar

---

## Edge Cases

- **Guthaben während Bestellvorgang aufgebraucht:** Bestellung wird abgelehnt mit Meldung „Guthaben nicht ausreichend. Verfügbar: X €, Benötigt: Y €“.
- **Kann Guthaben negativ werden?** Nein. Bestellung wird abgelehnt, wenn Guthaben nicht ausreicht.
- **Gleichzeitige Transaktionen (Race Condition):** Atomare Buchung in der Datenbank verhindert Inkonsistenzen.
- **Transaktion schlägt fehl:** Rollback – entweder Guthaben abgebucht UND Bestellung erstellt, oder beides rückgängig.
- **Transaktionen löschen:** Nicht möglich. Transaktionen sind immutable. Korrekturen nur über neue Anpassungs-Transaktionen.
- **Maximale Aufladung:** 200 € pro Aufladung; für höhere Beträge mehrere Aufladungen.
- **Kann der Benutzer selbst aufladen?** Nein (MVP). Nur Admin/Manager kann aufladen.

---

## Abhängigkeiten

- **Auth:** Nutzer muss eingeloggt sein (NextAuth, Session).
- **Bestellsystem:** Abbuchung erfolgt bei Order-Erstellung; Rückerstattung bei Storno.
- **Datenmodell:** Wallet, WalletTransaction (Typen: TOP_UP, ORDER_PAYMENT, REFUND, ADJUSTMENT, BONUS).

---

## Berechtigungen

| Rolle        | Eigenes Guthaben | Transaktionshistorie | Admin-Aufladung | Admin-Anpassung |
|-------------|------------------|----------------------|-----------------|-----------------|
| Gast        | ❌               | ❌                   | ❌              | ❌              |
| CUSTOMER    | ✅               | ✅                   | ❌              | ❌              |
| KITCHEN_STAFF | ✅             | ✅                   | ❌              | ❌              |
| ADMIN       | ✅               | ✅                   | ✅              | ✅              |
| SUPER_ADMIN | ✅               | ✅                   | ✅              | ✅              |

---

## Technische Anforderungen (optional)

- Performance: Guthaben abrufen &lt; 100 ms; Abbuchung &lt; 200 ms.
- API: `GET /api/wallet`, `GET /api/wallet/transactions`; Admin: `/api/admin/wallet/balances`, `/api/admin/wallet/top-up`, `/api/admin/wallet/adjust`.

---

## Referenzen

- **Detail-Spezifikation & Tech-Design:** `wallet-spec.md`
- **Wiki-Dokumentation:** Abschnitt „Guthaben & Wallet“ auf `/wiki`
