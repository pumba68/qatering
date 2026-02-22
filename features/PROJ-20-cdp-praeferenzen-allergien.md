# PROJ-20: CDP – Präferenzen & Allergien

## Status: 🔵 Planned

## Kontext & Ziel
Das Kundenprofil soll Präferenzen in zwei klar getrennten Kategorien verwalten:
1. **Explizite Präferenzen** – vom Kunden oder Admin aktiv eingetragen (Allergien, Diätformen, Unverträglichkeiten)
2. **Implizite Präferenzen** – automatisch aus der Bestellhistorie abgeleitet (Top-Kategorien, Lieblingsprodukte, Bestellrhythmus)

Diese Trennung ist sowohl für die DSGVO-Konformität (aktive Einwilligung vs. Verhaltensanalyse) als auch für die operative Nutzung (Küche muss Allergien zuverlässig sehen) entscheidend.

## Abhängigkeiten
- Benötigt: PROJ-18 (Golden Record & Admin UI) – Präferenzen erscheinen als Tab im Kundenprofil-Drawer
- Benötigt: PROJ-19 (Bestellhistorie) – implizite Präferenzen werden aus Bestelldaten berechnet
- Auf PROJ-4 aufgebaut (Kundensegmente) – Segmentregeln können explizite Präferenzen referenzieren

---

## User Stories

- Als **Küche / Produktionsplanung** möchte ich im Kundenprofil alle hinterlegten Allergien und Unverträglichkeiten auf einen Blick sehen, damit ich bei persönlichen Anfragen oder Anpassungen schnell reagieren kann.
- Als **Service & Support** möchte ich explizite Präferenzen eines Kunden bearbeiten können (z. B. Allergie nachtragen), wenn der Kunde am Schalter darum bittet.
- Als **Kantinen-/Standortleitung** möchte ich auf einen Blick sehen, welche Produkte und Kategorien ein Kunde am häufigsten bestellt (implizite Präferenzen), um personalisierte Angebote oder Menüanpassungen zu planen.
- Als **Kunden (App-User)** möchte ich meine eigenen Allergien und Diätpräferenzen in meinem App-Profil selbst pflegen können, damit meine Unverträglichkeiten im System hinterlegt sind.
- Als **Business / Analytics** möchte ich implizite Präferenzen für die Segmentierung nutzen können (z. B. Segment „Vegetarier"), ohne dass ich jeden Kunden manuell kategorisieren muss.

---

## Acceptance Criteria

### Tab „Präferenzen" im Kundenprofil-Drawer (PROJ-18)

#### Explizite Präferenzen (Admin-seitig bearbeitbar)
- [ ] Anzeige aller hinterlegten Allergene als farbige Chips (z. B. rot für bekannte Allergene: Gluten, Laktose, Nüsse, Ei, Soja, Fisch, Schalentiere, Senf, Sellerie, Sesam, Lupine, Weichtiere, Schwefeldioxid/Sulfite)
- [ ] Anzeige weiterer expliziter Präferenzen: Diätformen (`Vegetarisch`, `Vegan`, `Halal`, `Kosher`, `Glutenfrei`, `Laktosefrei`) als Badges
- [ ] Admin kann explizite Präferenzen hinzufügen und entfernen (Edit-Mode im Drawer)
- [ ] Jede Änderung durch Admin wird mit Timestamp und Admin-Name protokolliert (Audit-Trail, Read-only)
- [ ] Deutliche visuelle Trennung von impliziten Präferenzen (eigener Abschnitt + Label „Manuell hinterlegt")

#### Implizite Präferenzen (Read-only, aus Bestellhistorie berechnet)
- [ ] „Top 5 Kategorien" des Kunden basierend auf Bestellhäufigkeit (letzte 90 Tage), mit Balkendiagramm oder %-Anteil
- [ ] „Top 5 Produkte" basierend auf Bestellhäufigkeit (letzte 90 Tage)
- [ ] „Bevorzugte Bestellzeit" (Frühstück / Mittagessen / Abend — aus Uhrzeit der Bestellungen abgeleitet)
- [ ] „Bevorzugter Kanal" (App / Terminal / Kasse — häufigster genutzter Kanal)
- [ ] Zeitstempel der letzten Neuberechnung sichtbar (z. B. „Aktualisiert vor 2 Stunden")
- [ ] Deutliche visuelle Trennung von expliziten Präferenzen (Label „Automatisch ermittelt – nicht editierbar")
- [ ] Admin kann implizite Präferenzen NICHT manuell bearbeiten (FR-17: nur lesend)

### Kunden-App (Self-Service)
- [ ] Kunde kann in der App unter „Profil → Meine Präferenzen" seine eigenen Allergene und Diätformen setzen
- [ ] Multiselect-Auswahl aus Standard-Allergen-Liste (14 EU-Allergene) + Freitexteingabe für sonstige
- [ ] Änderungen des Kunden werden sofort im Admin-Profil sichtbar (mit Quelle „Selbst angegeben")
- [ ] Kunde kann seine expliziten Präferenzen jederzeit anpassen oder löschen

### Datenmodell
- [ ] `CustomerPreference`-Tabelle: `userId`, `type` (`EXPLICIT`|`IMPLICIT`), `key` (z. B. `ALLERGEN_GLUTEN`), `value`, `source` (`USER`|`ADMIN`|`SYSTEM`), `updatedAt`, `updatedById`
- [ ] Implizite Präferenzen werden durch einen Background-Job (re-)berechnet, nicht live bei jedem Aufruf
- [ ] Explizite und implizite Präferenzen sind über `type`-Feld klar getrennt

---

## Edge Cases

- **Kein explizite Präferenzen hinterlegt:** Abschnitt zeigt „Keine Allergien oder Diätpräferenzen hinterlegt" mit CTA „Hinzufügen"
- **Keine Bestellhistorie (neue Kunden):** Implizite Präferenzen zeigen „Noch nicht genug Daten für automatische Auswertung (min. 3 Bestellungen)"
- **Widersprüchliche Präferenzen:** Kunde hat explizit „Vegan" gesetzt, bestellt aber implizit oft Fleischgerichte → beide Daten werden ohne Warnung nebeneinander angezeigt (kein System-Override)
- **Allergen-Freitext:** Sonstige Allergieeingaben werden als Text-Chip dargestellt, nicht in Standard-Kategorien eingeordnet
- **Veraltete implizite Daten:** Wenn der Rechenstand älter als 24h ist, erscheint ein Hinweis „Daten werden aktualisiert"
- **Datenschutz:** Implizite Präferenzen dürfen nicht an Dritte weitergegeben werden; sie sind nur für interne Admin-Ansicht bestimmt
- **Admin editiert fremde Org:** Explizite Präferenzen sind nur innerhalb der eigenen Organisation editierbar; Cross-Org-Zugriff ist blockiert

---

## Technische Anforderungen

- Standard-Allergenliste: 14 EU-Pflichtallergene gemäß EU-Lebensmittelinformationsverordnung (LMIV)
- Implizite Präferenz-Berechnung: Background-Job (Cron, täglich) — kein synchroner API-Call
- API-Endpunkte:
  - `GET /api/admin/kunden/[id]/praeferenzen`
  - `PATCH /api/admin/kunden/[id]/praeferenzen` (nur explizite)
  - `GET /api/user/praeferenzen` (Kunden-App Self-Service)
  - `PATCH /api/user/praeferenzen` (Kunden-App Self-Service)
- Mandate: Nur Admins der eigenen Org dürfen PATCH ausführen
- Audit-Log: Alle Admin-Änderungen an expliziten Präferenzen werden in `PreferenceAuditLog` persistiert

---

## Out of Scope
- Automatische Menüfilterung basierend auf Präferenzen im Kunden-Frontend (→ späteres UX-Feature)
- Allergen-Kennzeichnung auf Produkten (→ existiert bereits im Produktkatalog)
- ML-basierte Empfehlungsengine (→ Later)
