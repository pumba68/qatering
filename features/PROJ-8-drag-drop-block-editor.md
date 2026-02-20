# PROJ-8: Drag & Drop Block-Editor

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-7 (Marketing Template Library) – Editor wird von dort geöffnet
- Benötigt: PROJ-1 (Admin Dashboard) – Admin-only
- Optional: PROJ-4e (Coupons & Incentives) – Coupon-Block bezieht Daten von dort

## Übersicht
Visueller Block-Editor zum Erstellen und Bearbeiten von Marketing-Templates. Admin zieht Blöcke per Drag & Drop in eine Canvas, konfiguriert sie über ein Seitenpanel und sieht jederzeit eine Live-Preview. Unterstützt Personalisierungs-Platzhalter (z.B. `{{Vorname}}`).

---

## User Stories

- Als Admin möchte ich Blöcke aus einer Seitenleiste per Drag & Drop in mein Template ziehen, damit ich intuitiv Layouts bauen kann ohne Code zu schreiben.
- Als Admin möchte ich Blöcke per Klick auswählen und über ein Eigenschaften-Panel rechts konfigurieren (Farbe, Text, Link etc.), damit ich präzise Kontrolle über jeden Block habe.
- Als Admin möchte ich Blöcke per Drag Handle neu anordnen, damit ich die Reihenfolge jederzeit ändern kann.
- Als Admin möchte ich Personalisierungs-Variablen (`{{Vorname}}`, `{{Standort}}`, `{{Gericht_des_Tages}}`) per Klick einfügen, damit ich keine Platzhalter manuell tippen muss.
- Als Admin möchte ich jederzeit eine Live-Preview des Templates sehen (Desktop + Mobile), damit ich weiß wie es beim Empfänger aussieht.
- Als Admin möchte ich das Template jederzeit als Entwurf speichern und später weiterbearbeiten, damit ich nicht alles auf einmal fertigstellen muss.
- Als Admin möchte ich Undo/Redo nutzen können, damit ich Fehler schnell rückgängig machen kann.
- Als Admin möchte ich globale Template-Einstellungen (Hintergrundfarbe, Schriftart, Primärfarbe) festlegen, damit das gesamte Template konsistent zur Marke aussieht.

---

## Acceptance Criteria

### Editor-Layout
- [ ] 3-Spalten-Layout: Links Blockauswahl-Panel | Mitte Canvas/Preview | Rechts Eigenschaften-Panel
- [ ] Canvas zeigt Desktop- und Mobile-Ansicht (Toggle oben rechts)
- [ ] Speichern-Button (immer sichtbar) + Autosave alle 60 Sekunden mit Statusanzeige
- [ ] Undo (Strg+Z) / Redo (Strg+Y) mit mindestens 20 Schritten History
- [ ] „Zurück zur Bibliothek"-Link ohne Datenverlust (Änderungen-Warnung bei ungespeichertem Zustand)

### Block-Typen (Mindest-Umfang)

| Block | Konfigurierbare Eigenschaften |
|-------|------------------------------|
| **Headline** | Text, Schriftgröße (H1/H2/H3), Farbe, Ausrichtung |
| **Text** | Rich-Text (fett, kursiv, unterstrichen, Links), Schriftgröße, Farbe |
| **Bild** | Upload oder URL, Alt-Text, Ausrichtung, Breite (%, px), Link bei Klick |
| **Button / CTA** | Beschriftung, Link-URL, Hintergrundfarbe, Textfarbe, Ausrichtung |
| **Spacer** | Höhe in px |
| **Trennlinie** | Farbe, Stärke (px), Stil (solid/dashed) |
| **2-Spalten-Layout** | Zwei unabhängige Spalten, jede Spalte nimmt beliebige Blöcke auf |
| **3-Spalten-Layout** | Drei unabhängige Spalten |
| **Coupon-Block** | Coupon aus Dropdown wählen (PROJ-4e), Code-Darstellung, CTA-Text |

- [ ] Blöcke lassen sich per Drag Handle (⠿) innerhalb der Canvas neu anordnen
- [ ] Block auswählen per Klick → Eigenschaften-Panel rechts öffnet sich
- [ ] Block löschen per Entf-Taste oder Lösch-Icon im ausgewählten Block
- [ ] Block duplizieren per Klick (⧉-Icon im Block-Kontext)

### Personalisierungs-Platzhalter
- [ ] Innerhalb von Headline- und Text-Blöcken: `{{Platzhalter}}`-Button in der Toolbar
- [ ] Dropdown mit verfügbaren Variablen: `{{Vorname}}`, `{{Nachname}}`, `{{E-Mail}}`, `{{Standort}}`, `{{Gericht_des_Tages}}`, `{{Coupon_Code}}`, `{{Datum}}`
- [ ] In der Preview werden Platzhalter mit Beispieldaten befüllt angezeigt (z.B. `{{Vorname}}` → „Max")
- [ ] Unbekannte/falsch geschriebene Platzhalter werden in der Preview farblich markiert (orange)

### Template-Einstellungen (globaler Style)
- [ ] Panel über Zahnrad-Icon: Hintergrundfarbe, Schriftart (3–4 Optionen), Primärfarbe, Innenabstand (padding)
- [ ] Primärfarbe übernimmt automatisch die Organisationsfarbe als Standard (aus PROJ-1)

### Speichern & Verlassen
- [ ] „Speichern"-Button speichert Template-Content als JSON in DB (`marketing_templates.content`)
- [ ] „Speichern & Schließen" → zurück zur Bibliothek (PROJ-7)
- [ ] „Als E-Mail-Entwurf speichern" → wechselt zu PROJ-9 E-Mail-Versand-Flow (nur bei E-Mail-Templates)
- [ ] Bei ungespeicherten Änderungen + Verlassen: Browser-Warnung / Modal

---

## Edge Cases

- **Bild-Upload schlägt fehl:** Fehlermeldung „Upload fehlgeschlagen. Bitte erneut versuchen." – Block bleibt leer, kein Absturz.
- **Coupon-Block ohne verfügbare Coupons:** Hinweis „Keine aktiven Coupons vorhanden – erst in PROJ-4e anlegen." mit Link.
- **Sehr langer Text in Block:** Canvas scrollt vertikal, kein Overflow-Abschneiden.
- **Spalten-Block auf Mobile:** Spalten stapeln sich automatisch vertikal in der Mobile-Preview.
- **Autosave schlägt fehl (z.B. kein Netz):** Warnung „Autosave fehlgeschlagen" im Header – manuelles Speichern weiterhin möglich.
- **Template ohne Blöcke speichern:** Warnung „Template ist leer – trotzdem speichern?".
- **Undo über Seitengrenzen:** Undo-History wird beim Verlassen der Seite geleert (kein persistentes Undo).
- **Langer Coupon-Code bricht Layout:** Coupon-Block hat `word-break: break-all` als Fallback.

---

## Technische Anforderungen

- Block-Editor basiert auf `@dnd-kit` (bereits im Projekt vorhanden) für Drag & Drop
- Template-Content wird als strukturiertes JSON gespeichert:
  ```json
  {
    "globalStyle": { "bgColor": "#ffffff", "primaryColor": "#3b82f6", "fontFamily": "Inter" },
    "blocks": [
      { "id": "b1", "type": "headline", "props": { "text": "Hallo {{Vorname}}!", "level": "h1", "color": "#111" } },
      { "id": "b2", "type": "image", "props": { "url": "...", "altText": "...", "width": "100%" } }
    ]
  }
  ```
- Rich-Text in Text-Blöcken: **TipTap** (headless Rich-Text-Editor) für Headline- und Text-Blöcke – liefert fett, kursiv, unterstrichen, Links und Platzhalter-Highlighting out-of-the-box
- Bild-Upload: API-Route `POST /api/admin/marketing/uploads` → speichert in `/public/uploads/marketing/`
- Autosave via `debounce` (1000ms) auf `PUT /api/admin/marketing/templates/[id]`
- Performance: Editor-Initialisierung < 1s, Block-Hinzufügen < 100ms

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (wird wiederverwendet)

| Was | Wo im Projekt | Nutzung für PROJ-8 |
|-----|--------------|---------------------|
| Drag & Drop Engine | `@dnd-kit/core`, `@dnd-kit/sortable` (bereits installiert) | Blöcke ziehen + Reihenfolge ändern – identisch zum Menü-Planner |
| D&D Komponenten | `components/menu/DraggableDish.tsx`, `DroppableDayCard.tsx` | Als Blaupause für DraggableBlock + DropZone |
| Admin-Layout | `components/admin/AdminShell.tsx` | Editor-Seite liegt im Admin-Bereich |
| TipTap | `@tiptap/react` (neu) | Rich-Text-Editor in Headline- und Text-Blöcken |
| Dropdown | `components/ui/dropdown-menu.tsx` | Platzhalter-Auswahl-Dropdown im Text-Block |
| Tooltip | `components/ui/tooltip.tsx` | Hover-Erklärungen auf Block-Icons |
| Input / Label | `components/ui/input.tsx`, `label.tsx` | Eigenschaften-Panel-Felder |
| Tabs | `components/ui/tabs.tsx` | Desktop/Mobile Preview-Toggle |
| Org-Farbe | Existing session/org data | Primärfarbe des Editors vorbelegen |

---

### Component-Struktur

```
/admin/marketing/templates/[id]/editor  (neue Seite)
│
├── EditorPage  (Haupt-Container, hält den gesamten Editor-Zustand)
│   │
│   ├── EditorTopbar  (fixiert oben, immer sichtbar)
│   │   ├── ← Zurück zur Bibliothek (mit Ungespeichert-Warnung)
│   │   ├── Template-Name (inline editierbar)
│   │   ├── AutosaveStatus  (z.B. „Gespeichert vor 30s" / „Speichern...")
│   │   ├── PreviewToggle  [Desktop | Mobile]
│   │   ├── Speichern-Button
│   │   └── Speichern & Schließen-Button
│   │
│   ├── BlockPalette  (linke Sidebar, ~250px, scrollbar)
│   │   ├── Abschnitt „Inhalt"
│   │   │   ├── DraggableBlockItem: Headline
│   │   │   ├── DraggableBlockItem: Text
│   │   │   ├── DraggableBlockItem: Bild
│   │   │   └── DraggableBlockItem: Button / CTA
│   │   ├── Abschnitt „Layout"
│   │   │   ├── DraggableBlockItem: 2-Spalten
│   │   │   ├── DraggableBlockItem: 3-Spalten
│   │   │   ├── DraggableBlockItem: Trennlinie
│   │   │   └── DraggableBlockItem: Spacer
│   │   └── Abschnitt „Aktionen"
│   │       └── DraggableBlockItem: Coupon-Block
│   │
│   ├── EditorCanvas  (Mitte, scrollbar, ~600px breit fixiert)
│   │   ├── CanvasBackground  (Hintergrundfarbe aus globalStyle)
│   │   ├── SortableBlockList  (@dnd-kit/sortable)
│   │   │   └── EditorBlock  (×N, sortierbar)
│   │   │       ├── BlockDragHandle  (⠿, links)
│   │   │       ├── BlockRenderer  (zeigt je nach Typ das richtige UI)
│   │   │       │   ├── HeadlineBlockRenderer
│   │   │       │   ├── TextBlockRenderer  (mit Platzhalter-Hervorhebung)
│   │   │       │   ├── ImageBlockRenderer
│   │   │       │   ├── ButtonBlockRenderer
│   │   │       │   ├── SpacerBlockRenderer
│   │   │       │   ├── DividerBlockRenderer
│   │   │       │   ├── ColumnsBlockRenderer  (enthält rekursiv BlockLists)
│   │   │       │   └── CouponBlockRenderer
│   │   │       └── BlockToolbar  (erscheint on-hover)
│   │   │           ├── Icon: Duplizieren (⧉)
│   │   │           └── Icon: Löschen (🗑)
│   │   └── DropZone  (Einfüge-Bereich wenn keine Blöcke vorhanden)
│   │
│   └── PropertiesPanel  (rechte Sidebar, ~280px)
│       ├── Leerzustand: „Block auswählen zum Bearbeiten"
│       ├── BlockPropertiesForm  (wenn Block aktiv, wechselt je nach Typ)
│       │   ├── HeadlineProperties: Text, Ebene (H1/H2/H3), Farbe, Ausrichtung
│       │   ├── TextProperties: Formatierung, Farbe, Schriftgröße
│       │   │   └── PlaceholderDropdown  ({{Vorname}}, {{Standort}}, ...)
│       │   ├── ImageProperties: URL/Upload, Alt-Text, Breite, Ausrichtung, Link
│       │   ├── ButtonProperties: Beschriftung, URL, Farben, Ausrichtung
│       │   ├── SpacerProperties: Höhe (px-Slider)
│       │   ├── DividerProperties: Farbe, Stärke, Stil
│       │   ├── ColumnsProperties: Spaltenverteilung (50/50, 33/67, etc.)
│       │   └── CouponProperties: Coupon-Auswahl, Darstellungstext
│       └── GlobalStylePanel  (über Zahnrad-Icon in Topbar erreichbar)
│           ├── Hintergrundfarbe (Color Picker)
│           ├── Primärfarbe (Color Picker)
│           ├── Schriftart (Dropdown: Inter, Georgia, Roboto, Lato)
│           └── Innenabstand / Padding (Slider)
```

---

### Daten-Modell & Zustandsverwaltung

**Was der Editor im Browser hält (kein Server):**

Der Editor-Zustand lebt vollständig im Browser-Speicher während der Bearbeitung:
- Liste aller Blöcke (Reihenfolge, Typ, Einstellungen)
- Globale Style-Einstellungen (Hintergrundfarbe, Schriftart, etc.)
- Welcher Block gerade ausgewählt ist
- History-Stack für Undo/Redo (bis zu 20 Schritte rückwärts)
- Autosave-Status (zuletzt gespeichert, ausstehend, Fehler)

**Was auf dem Server gespeichert wird:**

Der gesamte Inhalt wird als ein einziges JSON-Objekt in der `marketing_templates`-Tabelle gespeichert (Spalte `content`). Dieses JSON enthält:
- Globale Einstellungen (Farben, Schriftart)
- Die vollständige Block-Liste mit allen Eigenschaften

→ Kein separates Datenbank-Schema für einzelne Blöcke nötig. Flexibel erweiterbar ohne Migrationen.

**Neue API-Route:**
```
POST /api/admin/marketing/uploads   ← Bild-Upload (speichert Datei, gibt URL zurück)
GET  /api/admin/marketing/templates/[id]   ← Lädt Template beim Editor-Öffnen
PUT  /api/admin/marketing/templates/[id]   ← Autosave + manuelles Speichern
```

**Neue Editor-Seite:**
```
app/admin/marketing/templates/[id]/editor/page.tsx
```

---

### Wie Drag & Drop funktioniert

Das Projekt nutzt bereits `@dnd-kit` im Menü-Planner (`components/menu/`). Für den Block-Editor wird **dasselbe Prinzip** angewendet:

```
Palette (links)          Canvas (mitte)
┌─────────────┐          ┌──────────────────────┐
│ [Headline]  │ ─drag──► │  Block 1: Headline   │ ↕ sortierbar
│ [Text]      │          │  Block 2: Bild        │ ↕ sortierbar
│ [Bild]      │          │  Block 3: Button      │
│ [Button]    │          │  + Ablage-Zone        │
└─────────────┘          └──────────────────────┘
```

- Aus der **Palette** ziehen → neuer Block wird an Ablagepunkt eingefügt
- In der **Canvas** per Drag Handle (⠿) → Reihenfolge ändern
- Zwei separate DnD-Kontexte (Palette→Canvas + Canvas-intern) via `@dnd-kit/core`

---

### Undo/Redo-Mechanismus

Kein externes Package nötig. Funktioniert mit einem einfachen **History-Array im React-State**:

```
History-Stack:
[Zustand 0] → [Zustand 1] → [Zustand 2 ← aktuell]
                                         ↑ Strg+Z → zurück zu Zustand 1
```

- Jede Block-Aktion (hinzufügen, löschen, verschieben, Eigenschaft ändern) schreibt einen neuen Zustand in den Stack
- Maximal 20 Einträge (älteste werden verworfen)
- Autosave greift auf den aktuellen Zustand zu, nicht auf History

---

### Tech-Entscheidungen

**Warum `@dnd-kit` statt einer anderen Drag-&-Drop-Library?**
→ Bereits installiert und im Projekt aktiv genutzt. Kein neues Package, kein Bundle-Size-Overhead. Zugänglich (Keyboard-Support eingebaut).

**Warum JSON-Block-Format statt HTML direkt speichern?**
→ HTML wäre schwer zu editieren und zu rendern. JSON ist flexibel: kann als E-Mail-HTML, als In-App-HTML oder als Push-Text gerendert werden – je nach Kanal (PROJ-9, PROJ-10).

**Warum TipTap für Text- und Headline-Blöcke?**
→ TipTap ist headless (kein eigenes CSS-Styling, fügt sich nahtlos in das bestehende Tailwind-Design ein) und liefert Formatierung (fett, kursiv, Links), Keyboard-Shortcuts und eine erweiterbare Extension-API. Die Platzhalter (`{{Vorname}}`) lassen sich als eigene TipTap-Extension implementieren – damit können sie visuell hervorgehoben und per Klick eingefügt werden, ohne manuelles String-Parsing. Das JSON-Speicherformat des Editors bleibt unverändert (TipTap-Output wird vor dem Speichern in das Block-Props-Format konvertiert).

**Warum Autosave statt nur manuelles Speichern?**
→ Verhindert Datenverlust bei Browser-Absturz oder versehentlichem Tab-Schließen. 60-Sekunden-Intervall ist ein guter Kompromiss (nicht zu häufig = kein Server-Stress, nicht zu selten = kein großer Verlust).

**Wie wird die Mobile-Preview umgesetzt?**
→ Die Canvas-Breite wird per CSS auf 375px (iPhone-Breite) reduziert. Spalten-Blöcke stapeln sich automatisch via CSS `flex-direction: column`. Kein iFrame, kein separates Rendering nötig.

---

### Benötigte Packages

Bereits im Projekt:
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` ✅
- `lucide-react` – Icons (GripVertical, Copy, Trash, Settings, Monitor, Smartphone) ✅
- `@radix-ui/react-dropdown-menu` – Platzhalter-Auswahl-Dropdown ✅
- `@radix-ui/react-tooltip` – Block-Typ-Erklärungen in der Palette ✅
- `@radix-ui/react-tabs` – Desktop/Mobile-Toggle ✅

Neu zu installieren:
- `@tiptap/react` – Haupt-Package (React-Integration)
- `@tiptap/starter-kit` – Basis-Extensions (fett, kursiv, unterstrichen, Listen, etc.)
- `@tiptap/extension-link` – Link-Unterstützung in Text-Blöcken
- `@tiptap/extension-placeholder` – Platzhalter-Text in leeren Blöcken
- `@tiptap/extension-mention` – Basis für die `{{Platzhalter}}`-Extension (Personalisierungsvariablen als inline-Chips)
