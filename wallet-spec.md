Guthaben-System

## Status: 📝 SPEZIFIKATION

## Übersicht
Internes Guthaben-basiertes Zahlungssystem, bei dem Mitarbeiter Guthaben auf ihr Konto laden und damit bargeldlos für Mahlzeiten bezahlen können.


## User Stories

### Als Mitarbeiter
- möchte ich mein aktuelles Guthaben einsehen können, damit ich weiß wieviel ich noch zur Verfügung habe
- möchte ich alle meine Transaktionen (Aufladungen, Käufe, Erstattungen) einsehen können, damit ich meine Ausgaben nachvollziehen kann
- möchte ich bei niedrigem Guthaben benachrichtigt werden, damit ich rechtzeitig aufladen kann
- möchte ich automatisch für Bestellungen bezahlen können, ohne jedes Mal Bargeld mitzubringen (PROJ-4)

### Als Kantinen-Manager
- möchte ich Guthaben manuell zu Benutzerkonten hinzufügen können, damit Mitarbeiter per Barzahlung oder Überweisung aufladen können
- möchte ich alle Benutzerguthaben verwalten können, damit ich Unstimmigkeiten korrigieren kann
- möchte ich Finanzberichte erstellen können, damit ich Einnahmen und Guthaben-Statistiken sehe

### Als System
- möchte ich alle Transaktionen protokollieren, um vollständige Nachvollziehbarkeit zu gewährleisten
- möchte ich Race Conditions bei Guthabenänderungen verhindern, um Dateninkonsistenzen zu vermeiden

## Acceptance Criteria

### AC-1: Guthaben anzeigen
- [ ] Guthaben im Header anzeigen (alle Seiten wenn eingeloggt)
- [ ] Guthaben auf Dashboard anzeigen
- [ ] Guthaben auf `/wallet` Seite anzeigen
- [ ] Format: "Guthaben: 25,50 €"
- [ ] Echtzeit-Aktualisierung nach Bestellung
- [ ] Niedrig-Guthaben-Warnung (< 5 EUR): "Guthaben niedrig - bitte aufladen"
- [ ] Null-Guthaben-Warnung: "Kein Guthaben - Bitte Guthaben aufladen"

### AC-2: Manuelle Aufladung durch Admin
- [ ] Admin-Seite: `/admin/wallet/top-up`
- [ ] Benutzer nach Email suchen/auswählen
- [ ] Auflade-Betrag eingeben (min: 5 EUR, max: 200 EUR)
- [ ] Optionale Notiz hinzufügen (z.B. "Barzahlung 2026-01-24")
- [ ] Absenden → Guthaben sofort hinzugefügt
- [ ] Transaktion in Benutzer-Historie aufgezeichnet
- [ ] Email-Bestätigung an Benutzer
- [ ] Admin kann alle letzten Aufladungen einsehen
- [ ] Audit-Log: Wer hat wann wieviel aufgeladen

**Auflade-Prozess:**
1. Mitarbeiter zahlt bar oder überweist an Kantinen-Bankkonto
2. Manager loggt sich in Admin-Panel ein
3. Manager fügt Guthaben zu Mitarbeiter-Konto hinzu
4. Mitarbeiter erhält Email-Bestätigung
5. Guthaben sofort verfügbar

### AC-3: Automatischer Abzug bei Bestellung
- [ ] Bestellung prüft zuerst Guthaben
- [ ] Unzureichendes Guthaben → Bestellung abgelehnt mit Fehler
- [ ] Ausreichendes Guthaben → Guthaben atomar abgebucht
- [ ] Transaktion aufgezeichnet als "Bestellung #ORD-001"
- [ ] Guthaben in Echtzeit aktualisiert
- [ ] Neues Guthaben in Bestellbestätigung anzeigen
- [ ] Transaktion enthält Bestellreferenz


### AC-4: Transaktionshistorie
- [ ] `/wallet/history` Seite zeigt alle Transaktionen
- [ ] Anzeige: Datum, Typ, Betrag, Guthaben danach, Beschreibung
- [ ] Farbcodierung: Grün für Gutschriften, Rot für Abbuchungen
- [ ] Filter nach Typ (Alle, Aufladungen, Bestellungen, Erstattungen)
- [ ] Filter nach Datumsbereich
- [ ] Sortierung nach Datum (neueste zuerst)
- [ ] Paginierung (50 Transaktionen pro Seite)
- [ ] Laufendes Guthaben anzeigen

**Transaktionstypen:**
- Gutschrift (Aufladung)
- Abbuchung (Bestellzahlung)
- Admin-Anpassung (manuelle Korrektur)

### AC-5: Admin Guthabenverwaltung
- [ ] Admin-Seite: `/admin/wallet/balances`
- [ ] Liste aller Benutzer mit aktuellem Guthaben
- [ ] Nach Guthaben sortieren (höchstes/niedrigstes)
- [ ] Nach Benutzer-Email suchen
- [ ] Filter: Niedriges Guthaben (< 5 EUR), Null-Guthaben, Negativ-Guthaben
- [ ] Klick auf Benutzer → Vollständige Transaktionshistorie anzeigen
- [ ] Manuelle Anpassung: Guthaben hinzufügen oder abziehen
- [ ] Grund für manuelle Anpassung erforderlich
- [ ] Alle Anpassungen im Audit-Trail protokolliert
- [ ] Gesamtguthaben aller Benutzer anzeigen

### AC-6: Niedrig-Guthaben-Benachrichtigungen
- [ ] Email wenn Guthaben < 5 EUR
- [ ] Email wenn Guthaben = 0 EUR
- [ ] Banner-Benachrichtigung auf Dashboard
- [ ] "Jetzt aufladen" Button in Benachrichtigung
- [ ] Benutzer kann Email-Benachrichtigungen in Einstellungen deaktivieren

**Auslöser:**
- Guthaben fällt unter 5 EUR
- Guthaben erreicht 0 EUR
- Tägliche Erinnerung wenn Guthaben < 5 EUR (optional)

### AC-8: Finanzberichte
- [ ] Admin-Seite: `/admin/reports/financial`
- [ ] Gesamtguthaben im Umlauf (Summe aller Guthaben)
- [ ] Gesamteinnahmen (Summe aller Bestellungen) - pro Tag/Woche/Monat
- [ ] Gesamtaufladungen (Summe aller Gutschriften)
- [ ] Gesamterstattungen (Summe aller Stornierungen)
- [ ] Durchschnittliches Guthaben pro Benutzer
- [ ] Anzahl Benutzer mit Null-Guthaben
- [ ] Bericht als PDF/CSV exportieren
- [ ] Datumsbereichs-Filter

## Edge Cases

### Guthaben
- **Was passiert wenn Guthaben während Bestellvorgang aufgebraucht wird?**
  → Bestellung fehlgeschlagen: "Guthaben nicht ausreichend. Verfügbar: 3,50 €, Benötigt: 5,00 €"

- **Kann Guthaben negativ werden?**
  → Nein, CHECK Constraint in Datenbank verhindert negative Guthaben. Bestellung wird abgelehnt.

- **Was passiert bei gleichzeitigen Transaktionen (Race Condition)?**
  → Row-Level Locks in Datenbank-Funktionen verhindern Race Conditions. Last-Transaction-Wins mit atomaren Updates.

### Transaktionen
- **Was passiert wenn Transaktion während Verarbeitung fehlschlägt?**
  → Rollback der gesamten Transaktion. Entweder: Guthaben abgebucht UND Bestellung erstellt, ODER beides rückgängig.

- **Können Transaktionen gelöscht werden?**
  → Nein, Transaktions-Tabelle ist immutable (nur INSERT, kein DELETE/UPDATE). Korrekturen über neue Anpassungs-Transaktionen.

### Aufladung
- **Gibt es eine maximale Aufladung?**
  → Ja, 200 EUR pro Aufladung. Für höhere Beträge mehrfache Aufladungen.

- **Kann ein Benutzer selbst aufladen?**
  → Nein im MVP. Nur Admin/Manager kann aufladen. Zukünftig: Integration mit Stripe/PayPal.

## Technische Anforderungen

### Performance
- Guthaben abrufen: < 100ms
- Guthaben abbuchen: < 200ms
- Guthaben erstatten: < 200ms
- Transaktionshistorie laden: < 500ms (100 Transaktionen)
- Admin-Guthaben-Liste: < 800ms (500 Benutzer)


### API Endpunkte

**Benutzer-Wallet-Endpunkte:**
- `GET /api/wallet` - Aktuelles Wallet und Guthaben
- `GET /api/wallet/transactions` - Transaktionshistorie (mit Filtern)
- `POST /api/wallet/transactions/export` - Transaktionen als CSV exportieren

**Admin-Wallet-Endpunkte:**
- `GET /api/admin/wallet/balances` - Alle Benutzerguthaben
- `POST /api/admin/wallet/top-up` - Guthaben zu Konto hinzufügen
- `POST /api/admin/wallet/adjust` - Manuelle Guthabenanpassung
- `GET /api/admin/wallet/audit-log` - Audit-Log abrufen
- `GET /api/admin/wallet/reports/financial` - Finanzbericht

**Interne Endpunkte (PROJ-4 Integration):**
- `POST /api/wallet/charge` - Benutzer für Bestellung belasten (intern only)
- `POST /api/wallet/refund` - Benutzer für stornierte Bestellung erstatten (intern only)

### Benutzerzugriff

| Rolle | Eigenes Guthaben | Aufladen | Alle Guthaben | Admin-Aufladung | Anpassung |
|-------|------------------|----------|---------------|-----------------|-----------|
| **Gast** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Mitarbeiter** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Küchenpersonal** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Kantinen-Manager** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |


## Zukünftige Features (Post-MVP)
- Externe Zahlungs-Integration (Stripe, PayPal)
- Automatische Banküberweisung
- Gehaltsabzug für Aufladung
- Kreditlinie (negatives Guthaben bis Limit)
- Geschenkkarten/Gutscheine
- Treuepunkte-System

---

---

## Tech-Design (Solution Architect)

### Component-Struktur (MVP Phase 1)

#### **Benutzer-Features:**

```
Dashboard & Überall
├── Header-Widget: "💰 Guthaben: 25,50 €"
│   └── Clickable → Navigate zu /wallet
└── Niedrig-Guthaben-Banner (wenn < 5 EUR)
    └── "⚠️ Guthaben niedrig - Bitte aufladen"

/wallet Seite
├── Guthaben-Karte (große, prominente Anzeige)
│   ├── Aktuelles Guthaben in großer Schrift
│   ├── Status-Badge (Normal/Niedrig/Kritisch)
│   └── "Aufladen anfordern" Button (öffnet Support-Mail)
├── Schnell-Übersicht (Stats)
│   ├── "Letzte Transaktion: -5,50 € vor 2 Std"
│   ├── "Gesamtausgegeben diesen Monat: 125,00 €"
│   └── "Durchschnittliche Ausgabe pro Tag: 6,25 €"
└── Link zu /wallet/history

/wallet/history Seite
├── Filter-Bar (oben)
│   ├── Datumsbereich-Picker
│   └── Typ-Filter (Alle, Aufladungen, Bestellungen, Erstattungen)
├── Transaktions-Tabelle
│   ├── Spalten: Datum | Typ | Betrag | Guthaben danach | Beschreibung
│   ├── Farbcodierung: Grün (Gutschrift) | Rot (Abbuchung)
│   └── Jede Zeile zeigt: "25. Jan · Bestellung #ORD-123 · -5,50 € · [Neues Guthaben]"
├── Paginierung (50 pro Seite)
└── "Als CSV exportieren" Button
```

#### **Admin-Features:**

```
/admin/wallet/top-up (Guthaben aufladen)
├── Heading: "Guthaben für Mitarbeiter aufladen"
├── Schritt 1: Mitarbeiter auswählen
│   ├── Email-Suchfeld (Autocomplete aus Datenbank)
│   └── Zeigt: Name, aktuelle Rolle, aktuelles Guthaben
├── Schritt 2: Auflade-Formular
│   ├── Betrag-Input (min: 5 EUR, max: 200 EUR)
│   ├── Optionale Notiz (z.B. "Barzahlung 2026-01-24")
│   └── "Guthaben hinzufügen" Button
└── Success-Message: "✅ 50,00 € zu test@test.com hinzugefügt"

/admin/wallet/balances (Alle Guthaben verwalten)
├── Filter-Bar (oben)
│   ├── Email-Suchfeld
│   ├── Filter: Alle | Niedriges (<5€) | Null (=0€) | Kritisch (<0€)
│   └── Sortierung: Guthaben ↑↓ | Name ↑↓
├── Benutzer-Tabelle
│   ├── Spalten: Benutzer-Email | Aktuelle Rolle | Guthaben | Letzte Transaktion | Aktionen
│   ├── Zeilen mit Status-Badge:
│   │   ├── 🟢 Normal (> 5 EUR)
│   │   ├── 🟡 Niedrig (< 5 EUR)
│   │   ├── 🔴 Kritisch (= 0 EUR)
│   │   └── 🔴 Negativ (< 0 EUR)
│   └── Quick-Actions: "Aufladen" | "Bearbeiten" | "Verlauf anzeigen"
├── Quick-Stats (oben rechts)
│   ├── "Gesamtguthaben im Umlauf: 5.234,50 €"
│   ├── "Benutzer mit Null-Guthaben: 12"
│   └── "Durchschnitt pro Benutzer: 156,20 €"
└── Detail-Modal (klick auf Benutzer)
    ├── Benutzer-Info
    ├── Aktuelle Guthaben-Anzeige
    ├── Letzte 10 Transaktionen
    └── Admin-Aktionen: "Aufladen" | "Guthaben anpassen"
```

### Daten-Modell (Vereinfacht für PM)

**Jeder Benutzer hat ein "Wallet" (digitales Portemonnaie) mit:**
- Eindeutige Wallet-ID
- Aktuelles Guthaben (€)
- Letztes Update-Datum

**Jede Transaktion speichert:**
- Eindeutige Transaktions-ID
- Benutzer-ID
- Transaktionstyp: "Aufladung" | "Bestellzahlung" | "Rückerstattung" | "Admin-Anpassung"
- Betrag (wie viel Euro)
- Guthaben davor (für Audit-Trail)
- Guthaben danach (für Audit-Trail)
- Beschreibung (z.B. "Bestellung #ORD-001", "Admin: Korrekt

ur")
- Erstellt am (Datum & Zeit)

**Audit-Log speichert (für Admin-Transparenz):**
- Wer hat welche Aktion durchgeführt
- Wann wurde sie durchgeführt
- Was genau wurde geändert
- Von welcher IP-Adresse (optional)

### Tech-Entscheidungen

**Warum Diese Features in Dieser Reihenfolge?**

**MVP Phase 1 (Jetzt implementieren):**
1. Header-Widget (Guthaben anzeigen überall)
2. /wallet Seite (Guthaben-Übersicht)
3. /wallet/history (Transaktionshistorie)
4. /admin/wallet/top-up (Admin-Aufladung)

→ **Begründung:** Diese Features ermöglichen den grundlegenden Geschäftsprozess:
- Mitarbeiter sieht sein Guthaben
- Manager lädt Guthaben auf
- Mitarbeiter sieht alle Transaktionen

**MVP Phase 2 (Nach PROJ-4 Bestellsystem):**
- Automatischer Abzug bei Bestellungen
- Rückerstattung bei Stornierung
- /admin/wallet/balances (Alle Guthaben verwalten)

**Post-MVP (Zukünftig):**
- Finanzberichte
- Email-Benachrichtigungen bei niedrigem Guthaben
- CSV-Export

---

**Warum PostgreSQL Funktionen + Row-Level Locks?**

Das Guthaben-System muss **atomar** (ununterbrechbar) arbeiten, damit:
- Wenn 2 Bestellungen gleichzeitig erfolgen → Beide sehen den korrekten Guthaben-Stand
- Wenn 1 Aufladung + 1 Bestellung gleichzeitig → Keine Race Conditions
- Alle Transaktionen sind protokolliert (keine verlorenen Daten)

**Warum Immutable Transaktionen?**

Transaktionen können NICHT gelöscht oder geändert werden. Wenn etwas korrigiert werden muss:
- Alte Transaktion bleibt sichtbar (Audit-Trail)
- Neue "Korrektur"-Transaktion wird erstellt

→ **Begründung:** Rechtskonformität + Transparenz für Admin

---

## Implementation Status

### Status: 🎨 TECH-DESIGN COMPLETE
Design ist fertig und ready für Frontend Implementation.

**MVP Phase 1 Umfang:**
- ✅ Header-Widget (Guthaben überall sichtbar)
- ✅ /wallet Seite (Guthaben + Quick-Stats)
- ✅ /wallet/history (Transaktionshistorie mit Filtern)
- ✅ /admin/wallet/top-up (Admin-Aufladung)


