# PROJ-1: Admin-Dashboard Schaltzentrale – UI-Konzept

## Referenzen

- **Feature Spec:** [PROJ-1-admin-dashboard-schaltzentrale.md](./PROJ-1-admin-dashboard-schaltzentrale.md)
- **Design-Basis:** [DESIGN_GUIDELINES.md](../DESIGN_GUIDELINES.md)
- **Bestehende Charts:** `components/charts/RevenueKPI.tsx`, `OrdersAreaChart.tsx`, `TopDishesBarChart.tsx`
- **Admin-Sidebar:** `components/admin/AppSidebar.tsx`

---

## Admin-Sidebar (Navigation)

Die Admin-Sidebar ist nach **Option B** in logische Gruppen unterteilt. Gruppen sind **auf- und zuklappbar**; Nutzer können per **Pinnen** festlegen, welche Gruppen dauerhaft aufgeklappt bleiben (**Variante B**: Pin + letzter Open/Closed-State werden persistiert).

### Gruppierung (stabile IDs)

| ID | Gruppe | Einträge |
|----|--------|----------|
| `overview` | **Übersicht** | Dashboard |
| `speise` | **Speise** | Gerichte, Speiseplan |
| `orders` | **Bestellungen & Verkauf** | Bestellungen, Metadaten, Coupons |
| `verwaltung` | **Verwaltung** | Unternehmen, Nutzer, Guthaben aufladen, Guthaben verwalten |
| `system` | **System** | Einstellungen |

### Einklappbare Gruppen

- **Geöffnete Sidebar:** Jede Gruppe hat eine klickbare Kopfzeile (Chevron + Label). Klick togglet Auf-/Zuklappen; die zugehörigen Links werden ein- bzw. ausgeblendet (Radix `Collapsible`).
- **Eingeklappte Sidebar (Icon-Modus):** Gruppen werden nicht angezeigt; nur die einzelnen Links mit Tooltip (wie bisher).
- **Aktiver Pfad:** Liegt die aktuelle Route in einer zugeklappten Gruppe, wird diese beim Wechsel automatisch aufgeklappt, damit der aktive Link sichtbar ist.

### Pinnen (Variante B)

- **Pin-Icon** in der Gruppenkopfzeile: Gepinnte Gruppen gelten als „dauerhaft aufgeklappt“ (Standard beim nächsten Besuch). Klick togglet Pin; beim Anpinnen wird die Gruppe sofort aufgeklappt.
- **Persistenz:** Zwei `localStorage`-Keys:
  - `admin-sidebar-pinned-groups`: Array der gepinnten Gruppen-IDs.
  - `admin-sidebar-expanded`: Objekt `{ [groupId]: boolean }` mit dem letzten Auf-/Zuklapp-Status pro Gruppe.
- **Erstbesuch:** Vor dem ersten Laden aus `localStorage` sind alle Gruppen aufgeklappt; nach Hydration werden gespeicherte Werte angewendet.

### Umsetzung (Code)

- **Struktur:** `menuGroups` in `AppSidebar.tsx` – pro Gruppe `id`, `label`, `items` (title, url, icon). IDs sind stabil für Persistenz.
- **State:** `pinnedGroups` (string[]), `expandedGroups` (Record<string, boolean>), `hydrated` (boolean). Nach Mount werden Werte aus `localStorage` gelesen.
- **Styling:** Gruppenkopfzeile mit Chevron und Pin; gepinnt = Amber-Icon, ungepinnt = Outline.

---

## 1. Design-Ziele

- **Schaltzentrale-Charakter:** Auf einen Blick relevante KPIs und Fakten; keine Bestelltabelle auf dieser Seite.
- **Konsistenz:** Farben, Typografie, Cards und Spacing strikt nach DESIGN_GUIDELINES.
- **Klarheit:** Starke visuelle Hierarchie (Header → Filter → KPIs → Charts → CTA).
- **Responsive:** Mobile-first; KPI-Karten und Charts stapeln sich auf kleinen Screens sinnvoll.

---

## 2. Seitenstruktur (Layout)

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (Titel „Schaltzentrale“, optional Untertitel)            │
│  + Filter-Bar (Standort, Zeitraum) + CTA „Bestellungen verwalten“│
├─────────────────────────────────────────────────────────────────┤
│  KPI-ZEILE (4–6 Karten in Grid)                                 │
│  [Umsatz] [Bestellanzahl] [AOV] [Stornoquote] [optional: …]       │
├─────────────────────────────────────────────────────────────────┤
│  CHART-ZEILE 1                                                    │
│  [ Line/Area: Umsatz- oder Bestellverlauf ] [ Bar: Top-Gerichte ]  │
├─────────────────────────────────────────────────────────────────┤
│  CHART-ZEILE 2                                                    │
│  [ Pie/Donut: Bestellstatus ] [ Bar: Umsatz/Bestellungen Wochentag]│
├─────────────────────────────────────────────────────────────────┤
│  CTA-BEREICH                                                      │
│  [ Button/Link: Bestellungen verwalten → /admin/orders ]         │
└─────────────────────────────────────────────────────────────────┘
```

- **Keine** Bestellübersicht (Tabelle) auf dieser Seite.
- Bestellverwaltung nur über den CTA „Bestellungen verwalten“ erreichbar.

---

## 3. Header

- **Hintergrund:** `bg-white dark:bg-gray-900 border-b border-border/50 shadow-sm` (wie aktuelles Admin-Dashboard).
- **Inhalt:**
  - Links: Icon (z. B. `rounded-xl bg-gradient-to-br from-purple-600 to-purple-700`, Emoji oder Lucide-Icon wie `LayoutDashboard`), daneben:
    - **Titel:** `text-2xl font-bold text-foreground` → „Schaltzentrale“
    - **Untertitel:** `text-sm text-muted-foreground` → z. B. „KPIs & Auswertungen“
  - Rechts: **Filter** (Standort-Dropdown, Zeitraum-Toggle/Select) und **primärer CTA** „Bestellungen verwalten“ (Link zu `/admin/orders`).
- **Responsive:** Auf kleinen Screens Filter und CTA unter dem Titel stapeln oder in ein kompaktes Menü/Dropdown legen.

---

## 4. Filter-Bar

- **Position:** Direkt unter dem Header oder integriert in die rechte Header-Zeile.
- **Elemente:**
  - **Standort:** Select/Dropdown („Alle Standorte“ + konkrete Locations). Wert = `locationId` für API.
  - **Zeitraum:** Segmented Control oder Select: z. B. „Heute“ | „Letzte 7 Tage“ | „Diese Woche“ | „Dieser Monat“ | „Letzte 30 Tage“. Standard z. B. „Dieser Monat“.
- **Styling:** Nach DESIGN_GUIDELINES Button-Gruppen: `flex items-center gap-2 bg-muted p-1 rounded-lg`; aktive Option `variant="default"`, inaktive `variant="ghost"`. Oder einheitliches `<Select>` mit `rounded-lg`.
- **Verhalten:** Bei Änderung werden alle KPIs und Charts mit den neuen Parametern neu geladen (kein Full-Page-Reload nötig).

---

## 5. KPI-Karten

- **Layout:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6` (24px Abstand nach DESIGN_GUIDELINES).
- **Card-Basis:** Wie DESIGN_GUIDELINES und bestehende RevenueKPI:
  - `rounded-2xl`, `border border-border/50` oder borderlos mit Schatten.
  - Optional leichte Gradient-Hintergründe (z. B. Orange/Pink für Umsatz, Blau für Bestellungen, Grün für AOV, Rot/Amber für Stornoquote) mit `bg-gradient-to-br from-… to-…` und weiße/helle Schrift; Dark Mode mit reduzierter Opacity (`/20`-Flächen).
- **Inhalt pro Karte:**
  - **Label:** `text-sm font-medium` (z. B. „Umsatz (Monat)“, „Bestellanzahl“, „Ø Bestellwert“, „Stornoquote“).
  - **Wert:** `text-2xl md:text-3xl font-bold`.
  - **Optional:** Kleiner Vergleichstext (z. B. „+12 % zum Vormonat“) mit Icon `TrendingUp`/`TrendingDown`, `text-xs`.
- **Leere/Null-Werte:** „0“ oder „–“ anzeigen; keine leeren Karten (Edge Case: keine Bestellungen).
- **Animation:** Staggered Fade-In wie im aktuellen Dashboard: `animate-in fade-in slide-in-from-bottom` mit `animationDelay` (z. B. 100ms, 150ms, …).

**Empfohlene Karten (mind. 4):**

| Karte        | Label (Beispiel)   | Einheit / Format   |
|-------------|--------------------|--------------------|
| Umsatz      | Umsatz (Monat)     | formatCurrency     |
| Bestellanzahl | Bestellungen     | Zahl               |
| AOV         | Ø Bestellwert      | formatCurrency     |
| Stornoquote | Stornoquote        | X %                |
| Optional    | Aktive Besteller   | Zahl               |
| Optional    | Vs. Vormonat       | +X % / -X %        |

---

## 6. Charts

Alle Charts in **Cards** mit einheitlichem Stil:

- Container: `bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm` (DESIGN_GUIDELINES Card).
- Header: `CardHeader` mit `CardTitle` (`text-lg font-bold text-foreground`) und `CardDescription` (`text-sm text-muted-foreground`).
- Content: Ausreichend Mindesthöhe für Lesbarkeit (z. B. `h-[280px]` bis `h-[320px]`).

### 6.1 Line/Area-Chart (Umsatz- oder Bestellverlauf)

- **Position:** Erste Zeile, links (oder volle Breite auf Mobile).
- **Inhalt:** Zeitreihe (täglich oder wöchentlich); eine oder zwei Linien (z. B. aktueller Monat vs. Vormonat).
- **Styling:** Anlehnung an bestehenden `OrdersAreaChart`: Recharts Area/Line, `ChartContainer` + `ChartTooltip`; Farben aus Theme (z. B. `hsl(var(--chart-1))`, `hsl(var(--chart-2))` oder Purple/Pink wie in bestehendem Config).
- **Leerzustand:** Keine Daten → Grafik mit Nullen oder dezente Meldung „Keine Daten für diesen Zeitraum“.

### 6.2 Bar-Chart „Top-Gerichte“

- **Position:** Erste Zeile, rechts.
- **Inhalt:** Top 5–10 Gerichte (Portionen oder Umsatz); horizontale oder vertikale Bars.
- **Styling:** Wie `TopDishesBarChart`: Bar-Chart mit `ChartContainer`, einheitliche Bar-Farbe (z. B. `--chart-1`), Labels lesbar.
- **Leerzustand:** „Keine Bestellungen im Zeitraum“ oder leeres Diagramm mit Hinweistext.

### 6.3 Pie/Donut-Chart „Bestellstatus“

- **Position:** Zweite Zeile, links.
- **Inhalt:** Verteilung PENDING, CONFIRMED, PREPARING, READY, PICKED_UP, CANCELLED.
- **Farben (semantisch, DESIGN_GUIDELINES):**
  - PENDING: Gelb/Amber (z. B. `bg-yellow-500`)
  - CONFIRMED: Blau (`bg-blue-500`)
  - PREPARING: Lila (`bg-purple-500`)
  - READY: Grün (`bg-green-500`)
  - PICKED_UP: Grau (`bg-gray-500`)
  - CANCELLED: Rot (`bg-destructive` oder `bg-red-500`)
- **Legende:** Neben oder unter dem Chart; lesbare Labels.
- **Leerzustand:** „Keine Bestellungen“ oder ein Segment „Keine Daten“.

### 6.4 Bar-Chart „Wochentag“ (optional)

- **Position:** Zweite Zeile, rechts.
- **Inhalt:** Umsatz oder Bestellanzahl pro Wochentag (Mo–So).
- **Styling:** Wie andere Bar-Charts; einheitliche Bar-Farbe, X-Achse mit Mo, Di, …, So.

### 6.5 Chart-Grid

- **Desktop:** `grid grid-cols-1 lg:grid-cols-2 gap-6`.
- **Mobile/Tablet:** Eine Spalte; Reihenfolge: Line/Area → Top-Gerichte → Status-Pie → Wochentag (falls vorhanden).
- **Animation:** Wie KPIs: `animate-in fade-in slide-in-from-bottom` mit gestaffeltem Delay.

---

## 7. CTA „Bestellungen verwalten“

- **Position:** Unter den Charts; klar sichtbar, keine Konkurrenz durch die Tabelle (diese ist entfernt).
- **Darstellung:** Primär-Button oder hervorgehobener Link:
  - Nach DESIGN_GUIDELINES: z. B. `Button` mit `bg-gradient-to-r from-green-600 to-emerald-600 … rounded-xl` oder `variant="default"` mit Icon (z. B. `ShoppingBag` oder `ListOrdered`).
  - Text: „Bestellungen verwalten“.
  - Link: `href="/admin/orders"` (NextLink).
- **Optional:** Kurzer Hinweistext `text-sm text-muted-foreground`: „Alle Bestellungen einsehen und bearbeiten.“

---

## 8. Farben & Typografie (DESIGN_GUIDELINES)

- **Hintergrund Seite:** `min-h-screen bg-gradient-to-br from-background via-background to-muted/10`.
- **Cards:** `bg-card`, `border-border/50`, `rounded-2xl`.
- **Überschriften:** H1 `text-2xl font-bold text-foreground`, H2/Section `text-xl font-bold`, Card-Titel `text-lg font-bold`.
- **Body/Muted:** `text-sm text-foreground`, `text-sm text-muted-foreground`.
- **Primary:** `--primary` für Buttons und Akzente; Chart-Farben aus Theme (`--chart-1` …) oder semantisch (siehe Status-Pie).
- **KPI-Gradienten:** Wie bestehende RevenueKPI (Orange/Pink, Blau, ggf. Grün); Dark Mode mit `/20`-Varianten für Hintergründe.

---

## 9. Responsive

- **Breakpoints:** Tailwind `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- **KPI-Zeile:** 1 Spalte (Mobile) → 2 (sm) → 4 (lg) → 6 (xl).
- **Charts:** 1 Spalte bis `lg`, danach 2 Spalten.
- **Header/Filter:** Titel und Filter/CTA bei Bedarf untereinander; Touch-Targets mind. 44px.

---

## 10. Dark Mode

- Alle Flächen und Texte mit Dark-Varianten: `dark:bg-gray-900`, `dark:text-foreground`, `text-muted-foreground`.
- KPI-Gradient-Karten: Hintergründe im Dark Mode mit reduzierter Opacity (z. B. `dark:from-orange-500/20`) oder flache `bg-card` + farbige Akzente nur für Icon/Label.
- Charts: Farben so wählen, dass sie auf dunklem Hintergrund gut lesbar sind (Theme-Variablen nutzen).

---

## 11. Loading- & Leerzustände

- **Loading:** Pro KPI-Block und pro Chart eine Card mit zentriertem Spinner (`border-2 border-primary border-t-transparent rounded-full animate-spin`) und „Lade …“-Text; Layout bleibt erhalten (kein Layout-Shift).
- **Keine Daten:** KPIs zeigen „0“ oder „–“; Charts zeigen leere Serie oder kurzen Hinweis „Keine Daten für diesen Zeitraum“ in der Card.
- **Fehler:** Einheitliche Fehlermeldung (z. B. Toast oder Inline-Banner) mit Option „Erneut laden“.

---

## 12. Accessibility

- Semantik: `<main>`, `<section>`, Überschriften-Hierarchie (ein H1 pro Seite).
- Filter: `<label>` mit den Selects verbinden; Buttons mit `aria-label` wenn nur Icon.
- Charts: `ChartContainer` mit `accessibilityLayer` (wie in bestehenden Charts); Tooltips und Legenden für Screenreader sinnvoll beschriften.
- Fokus: `focus-visible:ring-2` für Tastatur-Navigation.

---

## 13. Zusammenfassung Komponenten

| Bereich      | Komponente / Element                    | DESIGN_GUIDELINES-Referenz     |
|-------------|------------------------------------------|---------------------------------|
| Seite       | Container, Gradient-Hintergrund          | §1, §8 Layout                   |
| Header      | Titel, Untertitel, Filter, CTA           | §3 Typografie, §7 Buttons       |
| Filter      | Select / Segmented Control               | §7 Button-Gruppen, §10 Spacing  |
| KPI-Karten  | Card mit Label, Wert, optional Trend     | §4 Card, §10 Spacing, §12 Responsive |
| Line/Area   | Card + Recharts AreaChart                | §4 Card, bestehender OrdersAreaChart |
| Bar Top     | Card + Recharts BarChart                 | §4 Card, bestehender TopDishesBarChart |
| Pie Status  | Card + Recharts PieChart/Donut          | §2 Semantische Farben (Status)  |
| Bar Wochentag | Card + Recharts BarChart               | wie Bar Top                     |
| CTA         | Button/Link „Bestellungen verwalten“     | §7 Primary Button, §8 Layout    |

---

**Status:** Konzept für Implementierung  
**Abnahme:** Mit PROJ-1 Acceptance Criteria und DESIGN_GUIDELINES abgleichen.
