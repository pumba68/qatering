# PROJ-19: CDP – Bestellhistorie im Kundenprofil

## Status: 🔵 Planned

## Kontext & Ziel
Jeder Kunde soll im Admin-Kundenprofil eine vollständige, durchsuchbare Übersicht seiner Bestellhistorie erhalten. Jede Bestellung wird mit Kanal, Zeitpunkt, Standort, Status und Warenkorbwert angezeigt. Produkt- und Kategoriedaten werden als unveränderlicher Snapshot gespeichert, damit historische Bestellungen korrekt dargestellt werden, auch wenn sich Preise oder Produktnamen später ändern.

## Abhängigkeiten
- Benötigt: PROJ-18 (Golden Record & Admin UI) – Bestellhistorie erscheint als Tab im Kundenprofil-Drawer
- Benötigt: Bestehendes Order/Bestell-System (bestehende `Order`-Tabelle und -Daten)

---

## User Stories

- Als **Kantinen-/Standortleitung** möchte ich im Kundenprofil alle vergangenen Bestellungen chronologisch sehen, um die Bestellgewohnheiten eines Gastes zu verstehen.
- Als **Service & Support** möchte ich eine bestimmte Bestellung eines Kunden per Datum oder Bestellnummer schnell finden, um bei Rückfragen oder Reklamationen den korrekten Kontext zu haben.
- Als **Service & Support** möchte ich bei jeder Bestellung sehen, über welchen Kanal (App, Terminal, Web, Vor-Ort-Kasse) sie aufgegeben wurde, um den Ursprung der Bestellung nachvollziehen zu können.
- Als **Küche / Produktionsplanung** möchte ich sehen, welche Produkte ein Kunde wie häufig bestellt hat, um bei Beschwerden oder Anfragen konkrete Produktinformationen parat zu haben.
- Als **Business / Analytics** möchte ich den Warenkorbwert und die Zahlungsart je Bestellung sehen, um den Kundenwert korrekt einschätzen zu können.

---

## Acceptance Criteria

### Tab „Bestellhistorie" im Kundenprofil-Drawer (PROJ-18)
- [ ] Tab zeigt alle Bestellungen des Kunden, sortiert nach Datum (neueste zuerst)
- [ ] Spalten/Karten pro Bestellung: Datum & Uhrzeit, Bestellnummer, Standort, Kanal, Status (Pill), Gesamtbetrag
- [ ] Kanal-Typen: `App`, `Web`, `Terminal`, `Kasse`, `Admin` — jeweils mit passendem Icon
- [ ] Status-Typen: `Offen`, `Bestätigt`, `In Zubereitung`, `Bereit`, `Abgeholt`, `Storniert`, `Erstattet`
- [ ] Klick auf eine Bestellung expandiert eine Detailansicht (inline, kein separater Screen)
- [ ] Detailansicht zeigt: Produktliste (Name, Menge, Einzelpreis, Kategorie) aus Snapshot, Zahlungsart, Gesamtbetrag, Anmerkungen
- [ ] Pagination innerhalb des Tabs: 10 Bestellungen pro Seite
- [ ] Filter: nach Zeitraum (Von/Bis), nach Status, nach Standort
- [ ] Suche: nach Bestellnummer
- [ ] Wenn keine Bestellungen vorhanden: „Noch keine Bestellungen"

### Produkt-Snapshot
- [ ] Bei jeder Bestellung werden Produktname, Produktkategorie, Einzelpreis, Menge und etwaige Optionen/Zusätze zum Zeitpunkt der Bestellung unveränderlich gespeichert
- [ ] Änderungen am Produkt (Preiserhöhung, Umbenennung, Löschung) beeinflussen historische Snapshot-Daten nicht
- [ ] Snapshot wird separat vom aktuellen Produktkatalog gespeichert (eigenes JSON-Feld oder separate Tabelle)

### Zusammenfassung-Kennzahlen (oben im Tab)
- [ ] Gesamtanzahl Bestellungen (alle Zeit)
- [ ] Gesamtumsatz des Kunden (Summe aller Bestellwerte, alle Zeit)
- [ ] Durchschnittlicher Warenkorbwert
- [ ] Letzte Bestellung: Datum

---

## Edge Cases

- **Keine Bestellungen:** Neuer Kunde ohne Bestellhistorie → Tab zeigt Leer-State mit Hinweis „Noch keine Bestellungen"
- **Sehr lange Bestellhistorie:** Kunden mit > 1.000 Bestellungen → Pagination verhindert Performance-Probleme; Kennzahlen werden aggregiert (nicht real-time summiert bei jedem Load)
- **Stornierte Bestellung mit Erstattung:** Wird als eigene Status-Kette angezeigt (Storniert + Erstattungshinweis); Erstattungsbetrag reduziert den Gesamtumsatz nicht direkt — wird separat ausgewiesen
- **Bestellung von gelöschtem Standort:** Historische Bestellungen behalten den Standortnamen aus dem Snapshot; gelöschter Standort wird als „[Standort gelöscht]" markiert
- **Kanal unbekannt:** Ältere Bestellungen ohne Kanal-Information → Anzeige als „Unbekannt" mit Hinweis-Icon
- **Produkt nachträglich gelöscht:** Snapshot zeigt Produktdaten weiterhin korrekt an; kein Broken-Reference-Problem
- **Mehrere Währungen / Storno-Gutschrift:** Negative Beträge (Erstattungen) werden rot hervorgehoben

---

## Technische Anforderungen

- Snapshot-Strategie: `orderItems`-Tabelle speichert `productNameSnapshot`, `productCategorySnapshot`, `unitPriceSnapshot` beim Erstellen der Bestellung
- API-Endpunkt: `GET /api/admin/kunden/[id]/bestellungen?page=&dateFrom=&dateTo=&status=&search=`
- Aggregat-Kennzahlen werden per DB-Aggregation (`SUM`, `COUNT`, `AVG`) berechnet, nicht im Frontend
- Performance: Listenabfrage < 500 ms (mit Index auf `userId`, `createdAt`)
- Mandantenfähigkeit: Nur Bestellungen der eigenen Organisation sichtbar (NFR-03)

---

## Out of Scope
- Bestellungen manuell stornieren/erstatten (eigener Admin-Workflow)
- Bestellstatistiken auf Org-/Standortebene (→ Analytics-Feature)
- Export der Bestellhistorie als CSV (→ Later)

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

| Was existiert bereits | Wo | Relevanz für PROJ-19 |
|---|---|---|
| `Order`-Tabelle | `prisma/schema.prisma` | Basis-Daten der Bestellungen; wird um `channel`-Feld erweitert |
| `OrderItem`-Tabelle | `prisma/schema.prisma` | Enthält aktuell NUR `menuItemId` + `price` — **kein Snapshot** → wird erweitert |
| `MenuItem`-Tabelle | `prisma/schema.prisma` | Quelle der Snapshot-Daten beim Erstellen einer Bestellung |
| Profil-Drawer (PROJ-18) | `app/admin/kunden/page.tsx` | Bestellhistorie erscheint als Tab im bestehenden Drawer |
| `formatCurrency`-Hilfsfunktion | `lib/utils.ts` | Wird für Betragsdarstellung wiederverwendet |

---

### Component-Struktur

```
Kundenprofil-Drawer (aus PROJ-18)
└── Tab „Bestellhistorie"
    ├── Kennzahlen-Leiste (oben, 4 Kacheln)
    │   ├── Gesamtanzahl Bestellungen
    │   ├── Gesamtumsatz (€)
    │   ├── Ø Warenkorbwert (€)
    │   └── Letzte Bestellung (Datum)
    ├── Filter-Leiste
    │   ├── Suche nach Bestellnummer
    │   ├── Zeitraum Von/Bis (Datepicker)
    │   ├── Status-Filter (Alle / Offen / Bestätigt / Abgeholt / Storniert / Erstattet)
    │   └── Standort-Filter
    ├── Bestellliste (paginiert, 10/Seite)
    │   └── Bestellkarte (pro Bestellung, kollabiert)
    │       ├── Linke Spalte: Datum+Uhrzeit, Bestellnummer
    │       ├── Mitte: Standortname, Kanal-Icon + Label, Anzahl Artikel
    │       ├── Rechte Spalte: Gesamtbetrag (grün/rot), Status-Pill
    │       └── Klick → Inline-Detailansicht aufklappen
    │           ├── Produktliste (aus Snapshot)
    │           │   └── Pro Artikel: Name, Kategorie, Menge × Einzelpreis
    │           ├── Zahlungsart
    │           ├── Gesamtbetrag (inkl. Rabatt / Zuschuss)
    │           └── Anmerkungen (falls vorhanden)
    └── Pagination (Zurück / Seite X von Y / Weiter)
```

---

### Daten-Model

**Erweiterung der `Order`-Tabelle:**

Die `Order`-Tabelle erhält 1 neues Feld:

| Feld | Was es speichert |
|---|---|
| `channel` | Bestellkanal: `APP`, `WEB`, `TERMINAL`, `KASSE`, `ADMIN` (Standard: `APP`) |

**Erweiterung der `OrderItem`-Tabelle:**

Die `OrderItem`-Tabelle erhält 3 neue Snapshot-Felder, die beim Erstellen der Bestellung einmalig befüllt und danach nie geändert werden:

| Feld | Was es speichert |
|---|---|
| `productNameSnapshot` | Name des Produkts zum Bestellzeitpunkt (z. B. „Spaghetti Bolognese") |
| `productCategorySnapshot` | Kategorie-Name zum Bestellzeitpunkt (z. B. „Pasta") |
| `unitPriceSnapshot` | Einzelpreis zum Bestellzeitpunkt (identisch mit bestehendem `price`-Feld, aber explizit als Snapshot markiert) |

**Bestehende `OrderItem`-Felder bleiben unverändert** — `menuItemId` bleibt als Referenz erhalten, wird aber nur noch für Live-Lookups genutzt, nicht mehr für die Anzeige historischer Daten.

**Neues Enum `OrderChannel`:**

```
APP       → Bestellung über Kunden-App
WEB       → Bestellung über Web-Browser
TERMINAL  → Self-Service-Terminal vor Ort
KASSE     → Manuelle Eingabe an der Kasse
ADMIN     → Angelegt durch Admin-Nutzer
```

---

### API-Endpunkte

| Methode | Pfad | Was er tut |
|---|---|---|
| `GET` | `/api/admin/kunden/[id]/bestellungen` | Paginierte Bestellliste eines Kunden mit Filter + Aggregat-Kennzahlen |

**Query-Parameter:** `page`, `pageSize`, `dateFrom`, `dateTo`, `status`, `locationId`, `search` (Bestellnummer)

**Response enthält:**
- Liste der Bestellungen (mit Snapshot-Daten aus `OrderItem`)
- Aggregierte Kennzahlen: `totalOrders`, `totalRevenue`, `avgOrderValue`, `lastOrderAt`
- Pagination-Metadaten: `total`, `page`, `totalPages`

---

### Tech-Entscheidungen

**Warum Snapshot-Felder auf `OrderItem` statt separater Snapshot-Tabelle?**
→ Die einfachste Lösung: 3 neue Nullable-Felder auf der bestehenden `OrderItem`-Tabelle. Eine extra Snapshot-Tabelle würde einen unnötigen JOIN bedeuten. Bestehende `OrderItem`-Einträge (ohne Snapshot) zeigen weiterhin den `menuItemId`-Lookup als Fallback.

**Warum `channel` auf `Order` und nicht auf `OrderItem`?**
→ Der Kanal beschreibt, wie die gesamte Bestellung aufgegeben wurde — nicht einzelne Artikel. Ein Enum auf `Order`-Ebene ist semantisch korrekt und einfacher abzufragen.

**Warum Aggregat-Kennzahlen im Backend berechnet (nicht Frontend)?**
→ Kunden mit 1.000+ Bestellungen: Frontend-Summierung wäre zu langsam und erfordert alle Seiten. Backend-seitige `SUM`/`AVG`/`COUNT` auf der DB sind performant und unabhängig von der Pagination.

**Warum Inline-Expand statt eigenem Modal/Screen für Bestelldetail?**
→ Der Drawer hat bereits wenig Breite. Ein zweites Modal würde UX-Probleme schaffen (Modal-in-Modal). Inline-Expand innerhalb der Bestellkarte ist das saubere Pattern für Drawer-Contexts.

---

### Datenbank-Migrationen

1. `Order`-Tabelle: Neues Feld `channel` (Enum `OrderChannel`, Nullable für Rückwärtskompatibilität, Standard `APP` für neue Bestellungen)
2. `OrderItem`-Tabelle: 3 neue Snapshot-Felder (`productNameSnapshot`, `productCategorySnapshot`, `unitPriceSnapshot`) — alle Nullable für bestehende Datensätze
3. Neues Enum `OrderChannel` in der DB
4. Index auf `Order(userId, createdAt DESC)` für performante Bestellhistorie-Abfragen
5. **Migrations-Hinweis:** Bestehende `OrderItem`-Einträge ohne Snapshot werden beim Lesen mit Fallback auf `MenuItem`-Live-Daten dargestellt (kein Rückfüll-Script nötig)

### Dependencies

Keine neuen Packages nötig.

---

## UI-Konzept (UI Designer)

### Design-Prinzipien für PROJ-19

Orientiert an `DESIGN_GUIDELINES.md`:
- **Kompakte Karten** statt Tabelle — Bestellungen im Drawer brauchen platzsparende Kartenstruktur
- **Inline-Expand** per Klick — kein Modal-in-Modal, kein Seitennavigation
- **Farbige Status-Pills** — 7 semantische Farben konsistent mit bestehenden Badges
- **4 KPI-Kacheln** oben — kompakte `bg-muted/50 rounded-xl` Kacheln
- Dark-Mode-Support bei allen Farben

---

### Bestellstatus — Farbsystem

| Status | Light Mode | Dark Mode |
|---|---|---|
| `Offen` | `bg-gray-100 text-gray-600` | `dark:bg-gray-800 dark:text-gray-400` |
| `Bestätigt` | `bg-blue-100 text-blue-700` | `dark:bg-blue-900/30 dark:text-blue-400` |
| `In Zubereitung` | `bg-amber-100 text-amber-700` | `dark:bg-amber-900/30 dark:text-amber-400` |
| `Bereit` | `bg-emerald-100 text-emerald-700` | `dark:bg-emerald-900/30 dark:text-emerald-400` |
| `Abgeholt` | `bg-green-100 text-green-700` | `dark:bg-green-900/30 dark:text-green-400` |
| `Storniert` | `bg-red-100 text-red-700` | `dark:bg-red-900/30 dark:text-red-400` |
| `Erstattet` | `bg-purple-100 text-purple-700` | `dark:bg-purple-900/30 dark:text-purple-400` |

### Bestellkanal — Icons

| Kanal | Icon (lucide-react) | Label |
|---|---|---|
| `APP` | `Smartphone` | App |
| `WEB` | `Globe` | Web |
| `TERMINAL` | `Monitor` | Terminal |
| `KASSE` | `CreditCard` | Kasse |
| `ADMIN` | `ShieldCheck` | Admin |
| unbekannt | `HelpCircle` | Unbekannt |

---

### Wireframe: Tab „Bestellhistorie" im Drawer

```
┌──── Kundenprofil-Drawer ────────────────────────────────────────────────┐
│  [Header: Max Mustermann]                                               │
│  [Übersicht] [Bestellhistorie▸] [Präferenzen] [Merkmale]               │
│  ─────────────────────────────────────────────────────────              │
│                                                                         │
│  ┌── KPI-Kacheln (4 × grid-cols-2 gap-2) ───────────────────────────┐  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                │  │
│  │  │ 📦 Bestellungen     │  │ 💰 Gesamtumsatz      │                │  │
│  │  │ text-2xl bold       │  │ text-2xl bold green  │                │  │
│  │  │ 127                 │  │ 1.842,50 €           │                │  │
│  │  │ text-xs muted       │  │ text-xs muted        │                │  │
│  │  └─────────────────────┘  └─────────────────────┘                │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                │  │
│  │  │ 🛒 Ø Warenkorb      │  │ 📅 Letzte Bestellung │                │  │
│  │  │ 14,51 €             │  │ 18. Feb 2026         │                │  │
│  │  │ text-xs muted       │  │ text-xs muted        │                │  │
│  │  └─────────────────────┘  └─────────────────────┘                │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌── Filter-Leiste ──────────────────────────────────────────────────┐  │
│  │  [🔍 Bestellnr...]  [Status ▾]  [Von]  [Bis]  [Zurücksetzen]     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌── Bestellliste ───────────────────────────────────────────────────┐  │
│  │                                                                   │  │
│  │  ┌─ Bestellkarte (kollabiert) ─────────────────────────────────┐ │  │
│  │  │  18. Feb 2026  ·  14:32    #BE-2026-00127        [●Abgeholt]│ │  │
│  │  │  📍 Berlin Mitte  🖥️ Terminal  · 3 Artikel      14,50 €   ▾ │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  ┌─ Bestellkarte (expandiert) ─────────────────────────────────┐ │  │
│  │  │  15. Feb 2026  ·  11:45    #BE-2026-00119        [●Bestätigt│ │  │
│  │  │  📍 Hamburg HQ  📱 App  · 2 Artikel              8,20 €   ▴ │ │  │
│  │  │  ─────────────────────────────────────────────────────────  │ │  │
│  │  │  Spaghetti Bolognese       Pasta        1 × 7,20 €          │ │  │
│  │  │  Wasser Still 0,5L         Getränke     1 × 1,00 €          │ │  │
│  │  │  ─────────────────────────────────────────────────────────  │ │  │
│  │  │  Gesamt: 8,20 €  ·  Zahlung: Guthaben  ·  📝 Anmerkung: —  │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  ┌─ Bestellkarte ──────────────────────────────────────────────┐ │  │
│  │  │  10. Feb 2026  ·  13:01    #BE-2026-00088        [●Storniert│ │  │
│  │  │  📍 Berlin Mitte  💻 Web  · 1 Artikel          -12,00 €   ▾ │ │  │
│  │  └─────────────────────────────────────────────────────────────┘ │  │
│  │                                                                   │  │
│  │  127 Bestellungen · Seite 1 von 13   [← Zurück]  [Weiter →]     │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Komponenten-Spezifikation

#### KPI-Kacheln (4 Stück, 2×2 Grid)

```jsx
// Grid-Container
<div className="grid grid-cols-2 gap-2 p-4">

// Einzelne Kachel
<div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 border border-border/50">
  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
    <Package className="w-3.5 h-3.5" />
    Bestellungen
  </div>
  <p className="text-2xl font-bold text-foreground tabular-nums">127</p>
  <p className="text-xs text-muted-foreground mt-0.5">gesamt</p>
</div>

// Umsatz-Kachel (grüner Wert)
<div className="bg-muted/50 dark:bg-muted/30 rounded-xl p-3 border border-border/50">
  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1.5">
    <Euro className="w-3.5 h-3.5" />
    Gesamtumsatz
  </div>
  <p className="text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
    1.842,50 €
  </p>
  <p className="text-xs text-muted-foreground mt-0.5">inkl. aller Bestellungen</p>
</div>
```

#### Filter-Leiste

```jsx
<div className="px-4 pb-3 flex flex-wrap gap-2">
  // Suche
  <div className="relative flex-1 min-w-[140px]">
    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
    <input
      className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm"
      placeholder="Bestellnr. suchen…"
    />
  </div>
  // Status-Select
  <select className="h-8 rounded-md border border-input bg-background px-2 text-sm">
    <option value="">Alle Status</option>
    ...
  </select>
  // Datum Von/Bis
  <input type="date" className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
  <input type="date" className="h-8 rounded-md border border-input bg-background px-2 text-sm" />
</div>
```

#### Bestellkarte (kollabiert)

```jsx
<div
  className="border border-border rounded-xl overflow-hidden cursor-pointer
             hover:bg-muted/20 transition-colors"
  onClick={() => toggleExpand(order.id)}
>
  // Obere Zeile: Datum + Bestellnummer + Status
  <div className="flex items-center justify-between px-4 pt-3 pb-1">
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground tabular-nums">
        18. Feb 2026 · 14:32
      </span>
      <span className="text-xs font-mono text-foreground">#BE-2026-00127</span>
    </div>
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                       bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        Abgeholt
      </span>
      <ChevronDown className="w-4 h-4 text-muted-foreground" />
    </div>
  </div>

  // Untere Zeile: Standort + Kanal + Artikel + Betrag
  <div className="flex items-center justify-between px-4 pb-3">
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <MapPin className="w-3 h-3" />Berlin Mitte
      </span>
      <span className="flex items-center gap-1">
        <Monitor className="w-3 h-3" />Terminal
      </span>
      <span>3 Artikel</span>
    </div>
    <span className="text-sm font-semibold text-foreground tabular-nums">14,50 €</span>
  </div>
</div>
```

#### Bestellkarte (expandiert — Detail-Bereich)

```jsx
// Detail-Bereich (animation: max-h expand)
<div className="border-t border-border bg-muted/20 px-4 py-3">
  // Produktliste
  <div className="space-y-2 mb-3">
    {items.map(item => (
      <div className="flex items-start justify-between text-sm" key={item.id}>
        <div>
          <span className="font-medium text-foreground">
            {item.productNameSnapshot ?? item.menuItem?.name}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {item.productCategorySnapshot ?? ''}
          </span>
        </div>
        <span className="text-muted-foreground tabular-nums flex-shrink-0 ml-4">
          {item.quantity} × {formatCurrency(item.unitPriceSnapshot ?? item.price)}
        </span>
      </div>
    ))}
  </div>

  // Trennlinie + Metadaten
  <div className="border-t border-border/50 pt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
    <span>Gesamt: <strong className="text-foreground">{formatCurrency(order.totalAmount)}</strong></span>
    <span>Zahlung: {order.paymentMethod ?? 'Guthaben'}</span>
    {order.notes && <span>📝 {order.notes}</span>}
    {order.discountAmount && (
      <span className="text-green-600">Rabatt: -{formatCurrency(order.discountAmount)}</span>
    )}
    {order.employerSubsidyAmount && (
      <span className="text-blue-600">Zuschuss: -{formatCurrency(order.employerSubsidyAmount)}</span>
    )}
  </div>
</div>
```

#### Stornierte Bestellung — Sonderbehandlung

```jsx
// Betrag bei Stornierung rot + Durchstreich
<span className="text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums line-through">
  12,00 €
</span>
// Badge
<span className="... bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
  Storniert
</span>
```

---

### Leer-State & Loading

```jsx
// Keine Bestellungen
<div className="py-12 text-center px-4">
  <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
  <p className="text-sm font-medium text-foreground">Noch keine Bestellungen</p>
  <p className="text-xs text-muted-foreground mt-1">
    Dieser Kunde hat noch keine Bestellung aufgegeben.
  </p>
</div>

// Loading
<div className="flex items-center justify-center py-12">
  <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
</div>
```

---

### Pagination im Drawer

```jsx
// Kompakte Pagination (platzsparend für Drawer)
<div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs">
  <span className="text-muted-foreground">
    127 Bestellungen · Seite {page} von {totalPages}
  </span>
  <div className="flex gap-1">
    <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}>
      <ChevronLeft className="w-3.5 h-3.5" />
    </Button>
    <Button variant="ghost" size="sm" className="h-7 px-2" disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}>
      <ChevronRight className="w-3.5 h-3.5" />
    </Button>
  </div>
</div>
```

---

### Fallback für fehlende Snapshot-Daten (ältere Bestellungen)

```jsx
// Produkt ohne Snapshot → Fallback-Anzeige
<span className="font-medium text-foreground">
  {item.productNameSnapshot ?? item.menuItem?.name ?? '[Produkt gelöscht]'}
</span>

// Gelöschtes Produkt
<span className="font-medium text-muted-foreground italic">
  [Produkt gelöscht]
</span>

// Unbekannter Kanal (ältere Bestellungen ohne channel-Feld)
<span className="flex items-center gap-1 text-muted-foreground">
  <HelpCircle className="w-3 h-3" />
  Unbekannt
</span>
```
