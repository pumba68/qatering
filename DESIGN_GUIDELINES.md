# Design Guidelines - Kantine Platform

## Übersicht

Dieses Dokument beschreibt die Design-Prinzipien, Patterns und Best Practices für die Kantine Platform. Es dient als Referenz für Entwickler und AI-Agents, um konsistente UI/UX-Implementierungen zu gewährleisten.

**Version:** 1.0  
**Letzte Aktualisierung:** 2026-01-27

---

## 1. Design-Philosophie

### Kernprinzipien

1. **Modern & Clean**: Minimalistisches, aufgeräumtes Design mit Fokus auf Klarheit
2. **Konsistenz**: Einheitliche Patterns und Komponenten über die gesamte Plattform
3. **Accessibility**: Barrierefreie Implementierung mit semantischem HTML
4. **Responsive**: Mobile-first Ansatz mit adaptivem Layout
5. **Performance**: Optimierte Animationen und Lazy-Loading

### Design-Inspiration

- **HelloFresh**: Speiseplan-Layout und Card-Design
- **Modern Dashboard**: Admin-Bereich mit klaren KPIs und Visualisierungen
- **Glassmorphism**: Subtile Glaseffekte für Overlays und Navigation

---

## 2. Farb-System

### Primärfarben

```css
/* Primary (Blau) */
--primary: 221.2 83.2% 53.3%
--primary-foreground: 210 40% 98%

/* Secondary (Grau) */
--secondary: 210 40% 96.1%
--secondary-foreground: 222.2 47.4% 11.2%
```

### Semantische Farben

#### Status & Badges

- **Kategorie (Grün)**: `bg-green-600 text-white`
  - Verwendung: Kategorie-Badges auf Dish-Cards
  - Beispiel: "HAUPTGERICHT", "VORSPEISE"

- **FIT & VITAL (Blau)**: `bg-blue-500 text-white`
  - Verwendung: Spezielle Diet-Tags
  - Beispiel: "FIT & VITAL" Badge

- **Vegan/Vegetarisch (Grün)**: `bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400`
  - Verwendung: Diet-Tag Badges
  - Rounded-full Stil

- **Allergene (Amber)**: `bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400`
  - Verwendung: Allergen-Badges
  - Rounded-full Stil

- **Inaktiv/Destructive (Rot)**: `bg-destructive/90 text-white`
  - Verwendung: Status-Badges, Fehlerzustände

- **Muted Tags**: `bg-muted text-muted-foreground`
  - Verwendung: Allgemeine Diet-Tags (nicht Vegan/Vegetarisch)

### Gradient-Hintergründe

#### Header-Bereiche (MenuWeek, Menu Planner)

```css
/* Light Mode */
bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50

/* Dark Mode */
dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20
```

#### Wellenförmige SVG-Unterstützung

```jsx
<svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
  <path d="M0,60 Q300,30 600,60 T1200,60 L1200,120 L0,120 Z" 
        fill="currentColor" 
        className="text-green-50 dark:text-green-950/20" />
</svg>
```

---

## 3. Typografie

### Überschriften

```css
/* H1 - Hauptüberschriften (Seiten) */
text-4xl md:text-5xl font-bold text-foreground

/* H2 - Sektionen */
text-3xl font-bold text-foreground

/* H3 - Card-Titel */
text-lg font-bold text-foreground

/* H4 - Untertitel */
text-base font-semibold text-foreground
```

### Text-Styles

```css
/* Body Text */
text-sm text-foreground

/* Muted Text (Beschreibungen, Meta-Info) */
text-sm text-muted-foreground

/* Small Text (Badges, Labels) */
text-xs font-medium
```

### Line Clamping

- **Titel**: `line-clamp-2` (max. 2 Zeilen)
- **Beschreibungen**: `line-clamp-2` (max. 2 Zeilen)

---

## 4. Card-Design

### Standard Card-Struktur

#### Container

```jsx
<div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
```

**Wichtige Eigenschaften:**
- `rounded-2xl`: Große abgerundete Ecken (16px)
- `border-border/50`: Subtile Border mit 50% Opacity
- `hover:shadow-2xl`: Großer Schatten beim Hover
- `hover:scale-[1.02]`: Leichte Vergrößerung (2%)

#### Bild-Bereich

```jsx
<div className="relative aspect-[4/3] overflow-hidden bg-muted">
  {/* Bild oder Placeholder */}
</div>
```

**Aspekt-Verhältnis:**
- **Dish Cards**: `aspect-[4/3]` (4:3 Verhältnis)
- **Thumbnails in Table**: Volle Zeilenhöhe (`min-h-[120px]`)

**Placeholder bei fehlendem Bild:**

```jsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
  <Utensils className="w-16 h-16 text-primary/30" />
</div>
```

**Hover-Effekt auf Bildern:**

```jsx
className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
```

#### Overlay Badges

**Position:** `absolute top-3 left-3`

```jsx
<div className="absolute top-3 left-3 flex flex-col gap-2">
  {/* Kategorie Badge */}
  <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg">
    {category.toUpperCase()}
  </span>
  
  {/* FIT & VITAL Badge */}
  <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-md shadow-lg">
    FIT & VITAL
  </span>
</div>
```

**Status-Badge (rechts oben):**

```jsx
<div className="absolute top-3 right-3">
  <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-md shadow-sm">
    Anpassbar
  </span>
</div>
```

#### Content-Bereich

```jsx
<div className="p-4 space-y-3">
  {/* Titel & Beschreibung */}
  {/* Tags & Badges */}
  {/* Aktionen */}
</div>
```

**Padding:** `p-4` (16px)  
**Spacing:** `space-y-3` (12px vertikal)

---

## 5. Badge-System

### Badge-Typen

#### 1. Kategorie-Badge (Overlay)

```jsx
<span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg">
  {category.toUpperCase()}
</span>
```

- **Position**: Overlay auf Bild (top-left)
- **Farbe**: Grün (`bg-green-600`)
- **Text**: Uppercase
- **Shadow**: `shadow-lg`

#### 2. Diet-Tag Badges (Inline)

**Vegan/Vegetarisch:**

```jsx
<span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full font-medium">
  Vegan
</span>
```

**Allgemeine Diet-Tags:**

```jsx
<span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">
  {tag}
</span>
```

**Allergene:**

```jsx
<span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">
  {allergen}
</span>
```

### Badge-Layout

**Inline-Badges in einer Zeile:**

```jsx
<div className="flex items-center gap-2 flex-wrap text-xs">
  {/* Kalorien mit Icon */}
  {calories && (
    <div className="flex items-center gap-1">
      <Flame className="w-3.5 h-3.5 text-orange-500" />
      <span className="font-medium text-foreground">{calories} kcal</span>
    </div>
  )}
  
  {/* Separator */}
  {calories && <span className="text-muted-foreground">•</span>}
  
  {/* Diet-Tags */}
  <div className="flex items-center gap-1.5 flex-wrap">
    {/* Badges */}
  </div>
  
  {/* Separator */}
  <span className="text-muted-foreground">•</span>
  
  {/* Allergene */}
  <div className="flex items-center gap-1 flex-wrap">
    {/* Allergen-Badges */}
  </div>
</div>
```

**Limitierung:**
- Diet-Tags: Max. 2 zusätzliche (nach Vegan/Vegetarisch)
- Allergene: Max. 3 angezeigt, Rest als "+X"

---

## 6. Icon-Verwendung

### Standard-Icons (lucide-react)

#### Häufig verwendete Icons

- **Utensils**: Placeholder für fehlende Bilder, Menü-Icons
- **Flame**: Kalorien-Anzeige (`text-orange-500`)
- **Edit**: Bearbeiten-Aktionen
- **Trash2**: Löschen-Aktionen
- **Plus/Minus**: Mengenauswahl
- **ChevronLeft/ChevronRight**: Navigation
- **Calendar**: Datum/Zeit-Bezug
- **Grid3x3/Table**: View-Mode Toggle

### Icon-Größen

```css
/* Small Icons (Inline) */
w-3.5 h-3.5  /* 14px - Kalorien, Tags */

/* Standard Icons */
w-4 h-4      /* 16px - Buttons, Actions */

/* Medium Icons */
w-5 h-5      /* 20px - Navigation */

/* Large Icons */
w-16 h-16    /* 64px - Placeholder */
```

### Icon-Farben

- **Primary**: `text-primary`
- **Muted**: `text-muted-foreground`
- **Orange (Kalorien)**: `text-orange-500`
- **Destructive**: `text-destructive`

---

## 7. Button-Styles

### Button-Varianten

#### Primary Button

```jsx
<Button className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
  Hinzufügen
</Button>
```

**Eigenschaften:**
- Gradient-Hintergrund (grün zu emerald)
- `rounded-xl` (12px)
- Hover: Dunklerer Gradient + größerer Schatten
- Scale-Effekt: `hover:scale-105`, `active:scale-95`

#### Outline Button

```jsx
<Button variant="outline" size="sm">
  <Icon className="w-4 h-4 mr-2" />
  Text
</Button>
```

#### Destructive Button

```jsx
<Button variant="destructive" size="sm">
  <Trash2 className="w-4 h-4 mr-2" />
  Löschen
</Button>
```

### Button-Gruppen

**View-Mode Toggle:**

```jsx
<div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
  <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm">
    <Grid3x3 className="w-4 h-4" />
  </Button>
  <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm">
    <Table className="w-4 h-4" />
  </Button>
</div>
```

---

## 8. Layout-Patterns

### Header-Bereiche

#### Mit Gradient-Hintergrund

```jsx
<div className="relative">
  {/* Gradient-Hintergrund */}
  <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 rounded-3xl -z-10">
    {/* SVG-Welle */}
    <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M0,60 Q300,30 600,60 T1200,60 L1200,120 L0,120 Z" fill="currentColor" className="text-green-50 dark:text-green-950/20" />
    </svg>
  </div>
  
  {/* Content */}
  <div className="relative px-6 py-8 md:py-12">
    {/* Header-Content */}
  </div>
</div>
```

**Padding:**
- Mobile: `px-6 py-8`
- Desktop: `md:py-12`

### Grid-Layouts

#### Card-Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

**Breakpoints:**
- Mobile: 1 Spalte
- Tablet (`md`): 2 Spalten
- Desktop (`lg`): 3 Spalten
- Gap: `gap-6` (24px)

#### Table-Layout

```jsx
<div className="bg-card rounded-lg border border-border/50 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-muted/50 border-b border-border">
        {/* Header */}
      </thead>
      <tbody>
        {/* Rows */}
      </tbody>
    </table>
  </div>
</div>
```

**Table-Styling:**
- Header: `bg-muted/50` mit Border-Bottom
- Rows: `hover:bg-muted/30` für Hover-Effekt
- Responsive: `overflow-x-auto` für horizontales Scrollen

---

## 9. Animationen & Transitions

### Standard-Transitions

```css
/* Card Hover */
transition-all duration-300

/* Bild Zoom */
transition-transform duration-500

/* Button Hover */
transition-all
```

### Hover-Effekte

#### Card Hover

```jsx
className="hover:shadow-2xl hover:scale-[1.02]"
```

#### Bild Zoom

```jsx
className="group-hover:scale-110 transition-transform duration-500"
```

#### Button Hover

```jsx
className="hover:scale-105 active:scale-95"
```

### Fade-In Animationen

```jsx
style={{
  animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`
}}
```

**Staggered Animation:**
- Delay: `index * 0.05s` (50ms pro Item)
- Duration: `0.3s`
- Easing: `ease-out`

---

## 10. Spacing-System

### Padding

- **Card Content**: `p-4` (16px)
- **Card Header**: `px-6 py-8 md:py-12`
- **Button Padding**: `px-6 py-2.5` (Primary), `px-3 py-2` (Small)

### Margins & Gaps

- **Card Grid Gap**: `gap-6` (24px)
- **Content Spacing**: `space-y-3` (12px vertikal)
- **Badge Gap**: `gap-2` (8px horizontal), `gap-1.5` (6px für Tags)

### Border-Radius

- **Cards**: `rounded-2xl` (16px)
- **Badges (Overlay)**: `rounded-md` (6px)
- **Badges (Inline)**: `rounded-full` (vollständig abgerundet)
- **Buttons**: `rounded-xl` (12px) oder `rounded-lg` (8px)

---

## 11. Dark Mode Support

### Konsistente Dark Mode Klassen

Alle Komponenten müssen Dark Mode unterstützen:

```jsx
// Badges
className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"

// Hintergründe
className="bg-muted dark:bg-muted"

// Borders
className="border-border dark:border-border"
```

### Dark Mode Patterns

- **Badges**: Immer Light/Dark Varianten definieren
- **Gradients**: Reduzierte Opacity im Dark Mode (`/20` statt volle Opacity)
- **Shadows**: Angepasste Shadow-Intensität

---

## 12. Responsive Design

### Breakpoints (Tailwind)

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First Ansatz

```jsx
// Beispiel: Responsive Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Beispiel: Responsive Padding
<div className="px-4 md:px-6 py-6 md:py-8">

// Beispiel: Responsive Text
<h1 className="text-3xl md:text-4xl lg:text-5xl">
```

### Touch-Targets

- **Buttons**: Mindestens `44x44px` für Touch-Geräte
- **Icons in Buttons**: `w-4 h-4` mit ausreichendem Padding

---

## 13. Accessibility

### Semantisches HTML

- Verwende `<button>` für interaktive Elemente
- Verwende `<nav>` für Navigation
- Verwende `<main>`, `<section>`, `<article>` für Struktur

### ARIA-Labels

```jsx
<Button aria-label="Gericht bearbeiten">
  <Edit className="w-4 h-4" />
</Button>
```

### Keyboard Navigation

- Alle interaktiven Elemente müssen per Tastatur erreichbar sein
- Focus-States sichtbar machen: `focus-visible:ring-2`

---

## 14. Komponenten-Spezifikationen

### MenuItemCard (Kunde)

**Verwendung:** Speiseplan für Kunden

**Struktur:**
1. Bild-Bereich (aspect-[4/3])
   - Overlay Badges (Kategorie, FIT & VITAL)
   - "Anpassbar" Badge (rechts oben)
   - "Ausverkauft" Overlay (wenn ausverkauft)
2. Content-Bereich
   - Titel & Beschreibung
   - Kalorien, Diet-Tags, Allergene (inline)
   - Preis & Mengenauswahl

**Besonderheiten:**
- "Hinzufügen" Button mit Gradient
- Mengenauswahl mit Plus/Minus Buttons
- Verfügbarkeits-Anzeige

### DishCard (Admin - Grid)

**Verwendung:** Gerichte-Verwaltung (Grid-View)

**Struktur:**
1. Bild-Bereich (aspect-[4/3])
   - Overlay Badges (Kategorie, FIT & VITAL)
   - "Inaktiv" Badge (rechts oben, wenn inaktiv)
2. Content-Bereich
   - Titel & Beschreibung
   - Kalorien, Diet-Tags, Allergene (inline)
   - Bearbeiten/Löschen Buttons

**Unterschiede zu MenuItemCard:**
- Keine Preis-Anzeige
- Keine Mengenauswahl
- Admin-Aktionen statt Kunden-Aktionen

### DishRow (Admin - Table)

**Verwendung:** Gerichte-Verwaltung (Table-View)

**Spalten:**
1. Thumbnail (volle Zeilenhöhe, min-h-[120px])
2. Name (mit Beschreibung)
3. Kategorie
4. Tags (Diet-Tags & Allergene)
5. Kalorien (mit Flame-Icon)
6. Status (Aktiv/Inaktiv)
7. Aktionen (Bearbeiten/Löschen)

**Styling:**
- Hover-Effekt auf Zeilen: `hover:bg-muted/30`
- Thumbnail mit Overlay-Badges
- Kompakte Badge-Darstellung

### MenuWeek Header

**Verwendung:** Speiseplan-Header

**Elemente:**
- Gradient-Hintergrund mit SVG-Welle
- Titel & Untertitel (KW, Datum)
- Navigation (Vorherige/Nächste Woche, Aktuelle Woche)
- Icon rechts oben (optional)

**Styling:**
- `rounded-3xl` für Container
- Responsive Padding
- Wellenförmiger SVG-Untergrund

---

## 15. Best Practices

### DO's ✅

1. **Konsistente Badge-Farben verwenden**
   - Grün für Kategorien
   - Blau für FIT & VITAL
   - Amber für Allergene

2. **Hover-Effekte konsistent implementieren**
   - Cards: `hover:shadow-2xl hover:scale-[1.02]`
   - Bilder: `group-hover:scale-110`
   - Buttons: `hover:scale-105 active:scale-95`

3. **Dark Mode immer berücksichtigen**
   - Alle Farben mit Dark-Varianten definieren
   - Gradients mit reduzierter Opacity im Dark Mode

4. **Responsive Design**
   - Mobile-first Ansatz
   - Breakpoints konsistent verwenden

5. **Semantisches HTML**
   - Korrekte HTML-Tags verwenden
   - ARIA-Labels für Icons

### DON'Ts ❌

1. **Nicht verschiedene Border-Radius verwenden**
   - Cards: Immer `rounded-2xl`
   - Badges: `rounded-md` (Overlay) oder `rounded-full` (Inline)

2. **Nicht inkonsistente Spacing verwenden**
   - Card Padding: Immer `p-4`
   - Grid Gap: Immer `gap-6`

3. **Nicht ohne Dark Mode Support entwickeln**
   - Alle Komponenten müssen Dark Mode unterstützen

4. **Nicht ohne Hover-States**
   - Interaktive Elemente brauchen Hover-Feedback

5. **Nicht zu viele Badges anzeigen**
   - Max. 2 zusätzliche Diet-Tags
   - Max. 3 Allergene (Rest als "+X")

---

## 16. Code-Beispiele

### Vollständige Card-Komponente

```jsx
export function DishCard({ dish }: { dish: Dish }) {
  const dietTags = dish.dietTags || []
  const hasVegan = dietTags.some(t => t?.toLowerCase().includes('vegan'))
  const hasVegetarian = dietTags.some(t => t?.toLowerCase().includes('vegetarisch'))
  
  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
      {/* Bild-Bereich */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {dish.imageUrl ? (
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
            <Utensils className="w-16 h-16 text-primary/30" />
          </div>
        )}
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {dish.category && (
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg">
              {dish.category.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Content-Bereich */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2 leading-tight">
            {dish.name}
          </h3>
          {dish.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {dish.description}
            </p>
          )}
        </div>

        {/* Tags & Badges */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {dish.calories && (
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-medium text-foreground">{dish.calories} kcal</span>
            </div>
          )}
          
          {dietTags.length > 0 && (
            <>
              {dish.calories && <span className="text-muted-foreground">•</span>}
              <div className="flex items-center gap-1.5 flex-wrap">
                {hasVegan && (
                  <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                    Vegan
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 17. Checkliste für neue Komponenten

Beim Erstellen neuer Komponenten:

- [ ] Dark Mode Support implementiert
- [ ] Responsive Design (Mobile-first)
- [ ] Hover-Effekte definiert
- [ ] Konsistente Spacing (p-4, gap-6, etc.)
- [ ] Korrekte Border-Radius (rounded-2xl für Cards)
- [ ] Semantisches HTML
- [ ] ARIA-Labels für Icons
- [ ] Transition-Animationen
- [ ] Konsistente Badge-Farben
- [ ] Line-Clamping für lange Texte

---

## 18. Referenzen

### Verwandte Dateien

- `components/menu/MenuItemCard.tsx` - Kunden Card-Implementierung
- `app/admin/dishes/page.tsx` - Admin Dish Cards & Table
- `components/menu/MenuWeek.tsx` - Header-Pattern
- `app/globals.css` - Globale Styles & Utilities

### Externe Ressourcen

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [lucide-react Icons](https://lucide.dev/)

---

**Erstellt von:** AI Assistant  
**Zuletzt aktualisiert:** 2026-01-27  
**Nächste Review:** Bei größeren Design-Änderungen
