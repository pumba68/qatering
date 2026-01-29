# Menu-Planner – UI-Spec (Swimlanes + Quick-Access)

## Referenzen

- **Implementierung:** `app/admin/menu-planner/page.tsx`
- **Design-Basis:** [DESIGN_GUIDELINES.md](../DESIGN_GUIDELINES.md)
- **Komponenten:** `components/menu/DraggableDish.tsx`, `DroppableDayCard.tsx`, `DraggableMenuItem.tsx`

---

## 1. Ziele

- **Swimlane-Charakter:** Tage horizontal als Spalten (Lanes), klare Zuordnung „Tag = Spalte“.
- **Schnellzugriff:** Top 5 = die **5 beliebtesten Gerichte (nach Bestellanzahl)**; jederzeit per Drag in beliebige Tage ziehbar.
- **Weitere Gerichte:** Ein intuitiver Zugang zu allen Gerichten (Sheet „Alle Gerichte“), ohne die Board-Ansicht zu blockieren.

---

## 2. Seitenaufbau (von oben nach unten)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  HEADER (Titel, KW/Jahr, Woche vor/zurück, Veröffentlichen, Gerichte verwalten)│
├─────────────────────────────────────────────────────────────────────────────┤
│  SCHNELLZUGRIFF                                                              │
│  [ Top-5-Gericht 1 ] … [ Top-5-Gericht 5 ]   [ + Alle Gerichte ]             │
├─────────────────────────────────────────────────────────────────────────────┤
│  SPEISEPLAN (Swimlanes – Tage horizontal, ggf. horizontal scrollbar)         │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐                   │
│  │ Mo 27.01 │ Di 28.01 │ Mi 29.01 │ Do 30.01 │ Fr 31.01 │  ← Spalten-Header │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤                   │
│  │ Gericht  │ Gericht  │ Gericht  │ Gericht  │ Gericht  │                    │
│  │ Gericht  │          │ Gericht  │          │ Gericht  │  ← Drop-Zonen      │
│  │  +       │  +       │  +       │  +       │  +       │  ← „Gericht hinzuf.“│
│  └──────────┴──────────┴──────────┴──────────┴──────────┘                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Top 5 Gerichte (Schnellzugriff)

- **Inhalt:** Die **5 beliebtesten Gerichte nach Bestellanzahl** (Aggregation über alle vergangenen Bestellungen/Menu-Items).
- **Darstellung:** Horizontale Reihe kompakter Karten (z. B. kleines Bild/Placeholder, Name, optional Diet-Badge). Einheitliche Höhe, gleicher Abstand.
- **Interaktion:** Alle 5 sind **drag-fähig** und können in **beliebige** Tages-Swimlane gezogen werden.
- **Datenquelle:** API oder bestehende Logik muss „Beliebteste Gerichte“ nach Bestellungen liefern (z. B. Top 5 nach `COUNT(orders)` bzw. nach Menü-Bestellungen). Falls noch nicht vorhanden: neuer Endpoint oder Erweiterung z. B. `GET /api/admin/dishes?sort=popular&limit=5`.
- **Fallback:** Wenn weniger als 5 Gerichte existieren oder keine Bestelldaten: restliche Slots mit anderen Gerichten auffüllen (z. B. nach Name oder Erstellungsdatum), damit immer bis zu 5 Karten angezeigt werden.

---

## 4. „Alle Gerichte“ (weitere Gerichte)

- **Auslöser:** Button **„+ Alle Gerichte“** (oder „Aus Katalog wählen“) rechts neben den Top-5-Karten.
- **UI:** **Sheet (Drawer) von rechts** – öffnet sich ohne die Swimlane-Ansicht zu verdecken.
- **Inhalt des Sheets:**
  - Suchfeld oben.
  - Scrollbare Liste/Grid aller (aktiven) Gerichte mit Suche.
- **Hinzufügen:**
  - **Drag:** Gericht aus dem Sheet auf einen Tag im Hintergrund ziehen (Sheet kann nach Drop schließen oder offen bleiben).
  - **Klick:** Gericht wählen → Hinweis „Tag wählen“ / Tages-Spalten kurz hervorheben → Klick auf Spalte fügt Gericht an diesem Tag ein (Sheet optional schließen).
- **Pro-Tag „+ Gericht hinzufügen“:** In jeder Swimlane ein kleiner Link/Button „+ Gericht hinzufügen“; öffnet dasselbe Sheet mit **vorausgewähltem Ziel-Tag**, sodass ein Klick auf ein Gericht es direkt diesem Tag zuweist.

---

## 5. Swimlanes (Tage horizontal)

- **Layout:** Ein **horizontal scrollbarer** Container; pro Arbeitstag eine **feste Spaltenbreite** (z. B. min-width 200–240 px).
- **Pro Spalte (ein Tag):**
  - **Header:** Kurzer Wochentag + Datum (z. B. „Mo 27.01“), optional „Heute“-Badge.
  - **Body:** Drop-Zone mit bestehenden Gerichten als kleine Cards; darunter **„+ Gericht hinzufügen“** (öffnet Sheet, Ziel-Tag = diese Spalte).
- **Optik:** Leichte Hintergrundfarbe pro Spalte (`bg-muted/30` o. ä.), klare Trennung zwischen Spalten. Beim **Drag-Over** Highlight (Ring oder Hintergrund).

---

## 6. Technik & Konsistenz

- **Drag & Drop:** Unverändert mit dnd-kit; Drop-Zonen pro Tag; Drag-Overlay bei Bedarf anpassen, wenn aus Sheet gezogen wird.
- **Design:** Farben, Typo, Abstände und Radii wie in DESIGN_GUIDELINES (z. B. 24 px Gap, gleiche Card-Sprache).
- **Responsive:** Auf kleinen Screens horizontaler Scroll der Swimlanes; Top-5-Zeile ggf. ebenfalls scrollbar oder auf 5 kompakte Chips reduziert.
