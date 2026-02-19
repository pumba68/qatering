# PROJ-1: Admin-Dashboard Schaltzentrale (KPIs & Charts)

## Status: 🔵 Planned

## Kurzbeschreibung

Das Admin-Dashboard wird zu einer **Schaltzentrale** umgebaut: ausschließlich KPIs und Auswertungen (Bar-, Pie-, Line-Charts). Die Bestellübersicht (Tabelle) wird von dieser Seite entfernt und ist nur noch über einen Link zur separaten Seite „Bestellungen“ erreichbar.

## User Stories

- Als **Admin** möchte ich auf einen Blick die wichtigsten Kennzahlen (Umsatz, Bestellanzahl, Stornoquote, AOV) sehen, um die Performance der Kantine einzuschätzen.
- Als **Admin** möchte ich Umsatz- und Bestellverläufe über die Zeit (Line/Area-Charts) sehen, um Trends zu erkennen.
- Als **Admin** möchte ich die beliebtesten Gerichte (Bar-Chart) und die Verteilung der Bestellstatus (Pie/Donut) sehen, um Planung und Kapazität zu steuern.
- Als **Admin** möchte ich optional nach Standort (Location) und Zeitraum filtern, um einzelne Kantinen oder Perioden zu vergleichen.
- Als **Admin** möchte ich von der Schaltzentrale aus gezielt zur Bestellverwaltung wechseln (Link/Button), ohne dass die Bestellliste das Dashboard überlagert.

## Acceptance Criteria

- [ ] **KPI-Zeile:** Mindestens 4 KPI-Karten werden angezeigt: Umsatz (aktueller Monat), Bestellanzahl (Woche/Monat), Durchschnittlicher Bestellwert (AOV), Stornoquote. Optional: Aktive Besteller, Umsatz-Vergleich zum Vormonat.
- [ ] **Line/Area-Chart:** Ein Chart zeigt den Umsatz- oder Bestellverlauf über die Zeit (z. B. täglich für den aktuellen Monat oder wöchentlich für die letzten Wochen). Datenbasis: Order (status ≠ CANCELLED), aggregiert nach Datum.
- [ ] **Bar-Chart:** Ein Chart zeigt die Top-Gerichte (z. B. Top 5–10) nach bestellter Menge oder Umsatz. Datenbasis: OrderItem → MenuItem → Dish.
- [ ] **Pie/Donut-Chart:** Ein Chart zeigt die Verteilung der Bestellstatus (PENDING, CONFIRMED, PREPARING, READY, PICKED_UP, CANCELLED) für den gewählten Zeitraum. Datenbasis: Order.status.
- [ ] **Weitere Charts (optional):** Bar-Chart „Umsatz/Bestellungen pro Wochentag“, Pie „Coupon vs. Vollpreis“ oder „Gerichte nach Kategorie“, sofern in der API angeboten.
- [ ] **Keine Bestellübersicht:** Auf der Schaltzentralen-Seite wird keine Bestelltabelle angezeigt. Stattdessen gibt es einen deutlich sichtbaren Link/Button (z. B. „Bestellungen verwalten“), der zur bestehenden Bestellübersicht (/admin/orders) führt.
- [ ] **Filter (optional):** Standort (locationId) und Zeitraum (z. B. Heute / Diese Woche / Dieser Monat / Letzte 7 Tage) können ausgewählt werden; alle KPIs und Charts reagieren auf diese Filter.
- [ ] **API:** Die Analytics-Daten werden von einer erweiterten oder neuen Admin-API bereitgestellt (z. B. GET /api/admin/analytics mit Parametern locationId, dateFrom, dateTo). Die API liefert alle für KPIs und Charts benötigten Aggregationen (Umsatz, Bestellanzahl, AOV, Stornoquote, aktive Besteller, Order-Trend, Top-Gerichte, Statusverteilung, ggf. Wochentag/Kategorie/Coupon).
- [ ] **Darstellung:** Das Layout entspricht der vorgeschlagenen Struktur: Header → KPI-Karten → erste Chart-Zeile (z. B. Line + Bar) → zweite Chart-Zeile (z. B. Pie + Bar) → CTA zur Bestellverwaltung. Design orientiert sich an den DESIGN_GUIDELINES.md (Karten, Farben, Responsive).

## Edge Cases

- **Keine Bestellungen im Zeitraum:** KPIs zeigen 0 bzw. „–“; Charts zeigen leere bzw. mit Null-Werten gefüllte Reihen ohne Absturz.
- **Nur stornierte Bestellungen:** Stornoquote 100 %; Umsatz/Bestellanzahl 0; Charts leer oder nur CANCELLED im Pie-Chart.
- **Multi-Location:** Wenn locationId nicht gesetzt oder „alle“, können KPIs/Charts entweder aggregiert über alle Standorte oder pro Location aufgeschlüsselt werden (Implementierungsentscheidung; Filter „Alle Standorte“ vs. einzelne Location sollte dokumentiert sein).
- **Sehr großer Zeitraum:** API oder Frontend begrenzen den abfragbaren Zeitraum (z. B. max. 1 Jahr), um Performance-Probleme zu vermeiden.
- **Fehlende oder inaktive Location:** Bei ungültiger locationId liefert die API einen klaren Fehler (4xx); das Frontend zeigt eine verständliche Meldung statt leerer Charts.
- **Berechnung AOV:** AOV = Summe Umsatz / Anzahl Bestellungen; Bestellungen mit status CANCELLED werden für Umsatz und Anzahl ausgeschlossen (konsistent mit bestehender Analytics-Logik).

## Abhängigkeiten

- Bestehende API: `GET /api/admin/analytics` (wird erweitert oder durch spezifische Endpoints ergänzt).
- Bestehende Seite: `/admin/orders` für die Bestellverwaltung (wird nur verlinkt, nicht dupliziert).
- Datenmodell: Order, OrderItem, MenuItem, Dish, Location, CouponRedemption, WalletTransaction (nur lesend).

## Technische Anforderungen (optional)

- Performance: Analytics-API-Antwortzeit < 3 s auch bei mehreren Monaten Daten (ggf. Indizes auf Order.createdAt, Order.locationId, Order.status).
- Sicherheit: Nur Nutzer mit Admin-Rolle (requireAdminRole) haben Zugriff auf die Analytics-API und die Schaltzentralen-Seite.
- Responsive: KPI-Karten und Charts sind auf Desktop und Tablet sinnvoll nutzbar; auf kleinen Screens können Charts untereinander gestapelt werden.

## Offene Punkte / Entscheidungen

- Welcher Zeitraum ist Standard beim ersten Laden? (z. B. „Dieser Monat“ oder „Letzte 30 Tage“)
- Soll die Stornoquote als KPI-Karte immer angezeigt werden oder nur optional?
- Soll „Aktive Besteller“ als Anzahl distinct User im Zeitraum definiert werden?

---

## QA Test Results

**Tested:** 2026-02-19
**App URL:** http://localhost:3002

### Acceptance Criteria Status

- [x] **KPI-Zeile:** OK – SchaltzentraleKPIs zeigt Umsatz, Bestellanzahl, AOV, Stornoquote, Aktive Besteller (5 Karten)
- [x] **Line/Area-Chart:** OK – OrdersAreaChart (Order Trend) implementiert
- [x] **Bar-Chart:** OK – TopDishesBarChart (Top Gerichte) implementiert
- [x] **Pie/Donut-Chart:** OK – StatusPieChart (Statusverteilung) implementiert
- [x] **Wochentag-Chart:** OK – WeekdayBarChart implementiert
- [x] **Keine Bestellübersicht:** OK – Keine Tabelle auf /admin; Link „Bestellungen verwalten“ führt zu /admin/orders
- [x] **Filter:** OK – Standort (Dropdown Mehrfachauswahl), Zeitraum (Heute / 7 Tage / Woche / Monat / 30 Tage)
- [x] **API:** OK – GET /api/admin/analytics mit period, locationId, locationIds; liefert alle Aggregationen
- [x] **Darstellung:** OK – Responsive Grid, Drag & Drop Layout, CTA-Bereich

### Summary
- ✅ Alle geprüften ACs bestanden (Code-Review + HTTP-Tests)
