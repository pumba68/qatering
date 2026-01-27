# Design Guidelines - Kantine Platform

> **Für AI Agents:** Diese Datei enthält die Design-Prinzipien und Patterns für die Kantine Platform. Verwende diese Guidelines bei der Implementierung neuer UI-Komponenten.

## Quick Reference

### Card-Design
- Container: `rounded-2xl border border-border/50 hover:shadow-2xl hover:scale-[1.02]`
- Bild: `aspect-[4/3]` mit `group-hover:scale-110`
- Padding: `p-4`
- Spacing: `space-y-3`

### Badge-Farben
- **Kategorie**: `bg-green-600 text-white` (Overlay, top-left)
- **FIT & VITAL**: `bg-blue-500 text-white` (Overlay, top-left)
- **Vegan/Vegetarisch**: `bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400` (Inline, rounded-full)
- **Allergene**: `bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400` (Inline, rounded-full)
- **Inaktiv**: `bg-destructive/90 text-white` (Overlay, top-right)

### Typografie
- H1: `text-4xl md:text-5xl font-bold`
- H3 (Card): `text-lg font-bold`
- Body: `text-sm`
- Muted: `text-sm text-muted-foreground`

### Layout
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Header Gradient: `bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50`

Siehe `DESIGN_GUIDELINES.md` für vollständige Dokumentation.
