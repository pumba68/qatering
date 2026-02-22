# PROJ-21: CDP – Abgeleitete Merkmale & Aktivitätsstatus

## Status: 🔵 Planned

## Kontext & Ziel
Das System berechnet für jeden Kunden automatisch abgeleitete Merkmale: **Aktivitätsstatus** (Aktiv / Inaktiv / Neu / Schlafend / Abgewandert) und **Kundenwert** (Lifetime Value, Durchschnittlicher Warenkorbwert, Bestellfrequenz). Diese Merkmale sind **ausschließlich systemseitig berechnet** — kein Admin kann sie manuell überschreiben (FR-17). Sie sind die Grundlage für automatische Kundensegmentierung (PROJ-4) und strategische Entscheidungen.

## Abhängigkeiten
- Benötigt: PROJ-18 (Golden Record & Admin UI) – Merkmale erscheinen als Tab im Profil-Drawer
- Benötigt: PROJ-19 (Bestellhistorie) – alle Berechnungen basieren auf Bestelldaten
- Erweitert: PROJ-4 (Kundensegmente) – Segmentregeln können abgeleitete Merkmale als Filterkriterien referenzieren

---

## User Stories

- Als **Kantinen-/Standortleitung** möchte ich auf einen Blick sehen, ob ein Kunde aktiv, inaktiv oder abgewandert ist, um gezielte Rückgewinnungsmaßnahmen einleiten zu können.
- Als **Business / Analytics** möchte ich den Lifetime Value eines Kunden (Gesamtumsatz seit Registrierung) sehen, um den wirtschaftlichen Wert einzelner Gäste zu bewerten.
- Als **Business / Analytics** möchte ich die Bestellfrequenz (z. B. 3,2 Bestellungen/Woche) sehen, um Poweruser von Gelegenheitsnutzern zu unterscheiden.
- Als **Kantinen-/Standortleitung** möchte ich in der Kundenliste nach Aktivitätsstatus filtern (z. B. „Zeige alle Inaktiven seit 30 Tagen"), um Rückgewinnungskampagnen zu planen.
- Als **Systemadministration** möchte ich, dass alle abgeleiteten Merkmale automatisch täglich neu berechnet werden, ohne dass ein manueller Auslöser nötig ist.

---

## Acceptance Criteria

### Tab „Merkmale" im Kundenprofil-Drawer (PROJ-18)

#### Aktivitätsstatus
- [ ] Jeder Kunde hat genau einen der folgenden Status (systemseitig, nicht editierbar):
  - `Neu` — registriert, aber noch keine Bestellung (grau)
  - `Aktiv` — mindestens 1 Bestellung in den letzten 30 Tagen (grün)
  - `Gelegentlich` — letzte Bestellung vor 31–90 Tagen (gelb)
  - `Schlafend` — letzte Bestellung vor 91–180 Tagen (orange)
  - `Abgewandert` — letzte Bestellung vor mehr als 180 Tagen oder nie (rot)
- [ ] Status-Pill wird in der Kundenliste (PROJ-18) und im Drawer-Header angezeigt
- [ ] Hover-Tooltip auf dem Pill erklärt die Status-Definition (z. B. „Letzte Bestellung vor 45 Tagen")

#### Kundenwert-Kennzahlen (Read-only)
- [ ] **Lifetime Value (LTV):** Gesamtsumme aller bezahlten Bestellungen seit Registrierung
- [ ] **Durchschnittlicher Warenkorbwert:** LTV ÷ Gesamtanzahl Bestellungen
- [ ] **Bestellfrequenz:** Ø Bestellungen pro Woche (berechnet über aktive Wochen seit erster Bestellung)
- [ ] **Erster Kauf:** Datum der allerersten Bestellung
- [ ] **Letzter Kauf:** Datum der jüngsten Bestellung
- [ ] **Bestellanzahl gesamt:** absolut, alle Zeit
- [ ] Alle Kennzahlen sind klar als „Automatisch berechnet" gekennzeichnet; kein Edit-Icon, kein Edit-State

#### Zeitstempel & Transparenz
- [ ] Für jede abgeleitete Kenngröße wird angezeigt, wann sie zuletzt berechnet wurde (z. B. „Stand: heute 03:00 Uhr")
- [ ] Wenn die letzte Berechnung älter als 48h ist: gelbes Warning-Banner „Daten werden aktualisiert"

### Automatische Neuberechnung (Background-Job)
- [ ] Alle abgeleiteten Merkmale werden täglich (Cron, z. B. 03:00 Uhr) für alle Kunden der Organisation neu berechnet
- [ ] Berechnung läuft inkrementell (nur Kunden mit Bestellungen seit letztem Run werden neu berechnet)
- [ ] Ergebnis wird in dedizierter `CustomerMetrics`-Tabelle persistiert (kein Live-Compute bei Profilaufruf)
- [ ] Manueller Neuberechnungs-Trigger per Admin-Button möglich (nur für einzelnen Kunden, max. 1x/Stunde)

### Segmentierungs-Integration (PROJ-4)
- [ ] Segment-Regeln in PROJ-4 können folgende Merkmale referenzieren:
  - `aktivitaetsstatus = "ABGEWANDERT"`
  - `ltv > 500`
  - `bestellfrequenz < 1` (weniger als 1x/Woche)
  - `letzterKauf < 30 days ago`
- [ ] Segmentzugehörigkeit wird nach jeder Neubrechnung automatisch aktualisiert (FR-20)

---

## Edge Cases

- **Kein Kauf seit Registrierung:** Status = `Neu`; LTV = 0,00 €; alle anderen Kennzahlen = „–" (kein Null-Divisor-Fehler)
- **Stornierte Bestellungen:** Vollständig stornierte und erstattete Bestellungen werden im LTV nicht gezählt; Teilerstattungen reduzieren den LTV um den Erstattungsbetrag
- **Sehr kurze Mitgliedschaft:** Kunden, die erst heute registriert wurden → Bestellfrequenz nicht berechnet, Anzeige: „Zu wenig Daten (< 7 Tage)"
- **Manueller Neuberechnungs-Trigger:** Wenn der Admin den Button mehrfach klickt → Rate-Limit: max. 1 Neuberechnung pro Kunde pro Stunde; danach Button deaktiviert mit Countdown
- **Status-Transition:** Wenn ein `Abgewandert`-Kunde erneut bestellt → Status springt sofort auf `Aktiv` bei nächster Berechnung; keine manuelle Freigabe nötig
- **Berechnungsfehler:** Wenn der Background-Job fehlschlägt → bestehende Werte bleiben sichtbar (Stale-Data), kein Löschen alter Werte; Admin-Benachrichtigung via System-Log
- **Negatives LTV:** Theoretisch möglich bei Übererstattung → wird als 0,00 € gedeckelt und mit Hinweis-Icon versehen

---

## Technische Anforderungen

- Neue Tabelle `CustomerMetrics` mit Feldern: `userId`, `organizationId`, `activityStatus`, `ltv`, `avgOrderValue`, `orderFrequencyPerWeek`, `totalOrders`, `firstOrderAt`, `lastOrderAt`, `calculatedAt`
- Background-Job: Cron-Funktion (z. B. Vercel Cron oder DB-basierter Scheduler), täglich 03:00 Uhr
- Status-Berechnung basiert ausschließlich auf `lastOrderAt` (kein ML, kein komplexes Scoring)
- API-Endpunkte:
  - `GET /api/admin/kunden/[id]/merkmale` — liest aus `CustomerMetrics`
  - `POST /api/admin/kunden/[id]/merkmale/recalculate` — manueller Trigger (Rate-Limited)
- Index auf `CustomerMetrics.organizationId`, `CustomerMetrics.activityStatus` für Listenfilterung
- Performance: Kennzahlen-Abfrage < 100 ms (da pre-computed, kein Live-Aggregat)

---

## Out of Scope
- ML-basiertes Churn-Scoring (→ Later)
- Automatische Trigger / Notifications bei Status-Wechsel (→ Marketing Automation, späteres Feature)
- Vergleich gegen Org-Durchschnitt / Benchmarking (→ Analytics-Feature)
- Manuelle Überschreibung von Status oder Kennzahlen (explizit ausgeschlossen, FR-17)
