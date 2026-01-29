# Speiseplan-Ansicht (Kunde) – Optimierungen

## Ziel
Weniger weiße Flächen, interaktiver und ansprechender wirken, nicht wie ein leeres weißes Blatt – unter Einhaltung der DESIGN_GUIDELINES.md.

---

## Umgesetzt (Status Quo)

### 1. Weniger weiße Flächen
- **Hintergrund-Pattern** (`menu-page-pattern` in globals.css): Dezentes Punkt-Raster (24×24px) in Border-Farbe, reduziert leere weiße Flächen.
- **Menu Page**: Leichter Gradient-Overlay (`from-background/95 via-background/90 to-green-50/40`) über dem Pattern, kompakteres Padding (`py-6 md:py-10`), `max-w-7xl` für bessere Proportionen.

### 2. Interaktivität & Animationen
- **Staggered Card-Animation** (MenuWeek): Gerichte erscheinen mit gestaffeltem Fade-In (framer-motion, ~50ms pro Karte, ease-out), wie in DESIGN_GUIDELINES.
- **Tab-Wechsel**: AnimatePresence + kurzer Fade beim Wechsel des Wochentags.
- **MenuItemCard**: `motion.div` mit `layout`, **Hinzufügen-Button** mit `whileTap={{ scale: 0.96 }}` für klares Klick-Feedback.

### 3. Loading-State
- **Skeleton-Grid** statt „Menü wird geladen…“: 6 Platzhalter-Cards mit Bild-, Text- und Button-Skeletons, Tabs-Skeleton – wirkt voller und moderner.

### 4. Tag-Zusammenfassung
- **Chips unter dem Datum**: „X vegan“, „X vegetarisch“, „X Aktion“ (Leaf/Sparkles-Icons), nur wenn vorhanden – gibt schnelle Orientierung ohne weiße Leere.

### 5. Empty-States
- **Kein Menü / Keine Gerichte**: Card mit Icon (Utensils), Überschrift und kurzem Erklärungstext, Fade-In (motion).
- **Kein Gericht für diesen Tag**: Kompakte Card mit Icon und zwei Zeilen Text, statt nur einer Zeile in muted Box.

---

## Optional (weitere Ideen)

- **Schnellfilter-Chips** oberhalb der Gerichte: „Vegan“, „Vegetarisch“, „FIT & VITAL“, „Aktion“ – filtern die Gerichte des Tages (State + Filterlogik).
- **Promotion-Banner**: Leichte Auto-Play-Animation oder dezenter Shimmer (shadcn/Design-Guidelines-konform).
- **Warenkorb-Floating-Button**: Beim ersten Hinzufügen kurze Bounce-Animation (framer-motion), um Aufmerksamkeit zu lenken.
- **Card-Hover**: Zusätzlich leichter „Lift“ (translateY -2px) neben dem bestehenden Scale/Shadow (bereits in Guidelines).
- **Reduced Motion**: `prefers-reduced-motion` prüfen und Animationen deaktivieren/reduzieren (Accessibility).

---

## Referenzen
- DESIGN_GUIDELINES.md (Farben, Cards, Animationen, Badges)
- components/menu/MenuWeek.tsx, MenuItemCard.tsx
- app/menu/page.tsx, app/globals.css (menu-page-pattern)
