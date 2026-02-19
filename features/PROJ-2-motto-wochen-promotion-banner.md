# PROJ-2: Motto-Wochen / Promotion-Banner (Speiseplan)

## Status: 🔵 Planned

## Kurzbeschreibung

Kunden sehen **oberhalb des Speiseplans** ein optionales **Hero-/Promotion-Banner** (oder mehrere als **Karussell**) für Sonderaktionen (z. B. „Bayerische Woche“, „Italian Week“). Das Banner ist **pro Woche** im Menu-Planner zuweisbar, **wiederverwendbar** und **dynamisch** (Titel, optional Untertitel, optional Bild). Es gibt **keinen CTA**. Die Verwaltung liegt unter der Sidebar-Kategorie **„Promotions“**; die Coupon-Seite wird ebenfalls dort eingeordnet.

---

## User Stories

- Als **Admin** möchte ich für eine Kalenderwoche ein oder mehrere Motto-Banner (z. B. „Bayerische Woche“, „Italian Week“) festlegen, damit Kunden diese beim Speiseplan sofort erkennen.
- Als **Admin** möchte ich Banner-Texte (Titel, optional Untertitel) und optional ein Bild anlegen und wiederverwenden, damit Aktionen einheitlich dargestellt werden.
- Als **Admin** möchte ich die Banner-Verwaltung und Coupons unter einer gemeinsamen Kategorie „Promotions“ in der Sidebar finden.
- Als **Kunde** möchte ich beim Öffnen des Speiseplans ein auffälliges, aber nicht aufdringliches Banner (oder Karussell) für die aktuelle Motto-Woche sehen.
- Als **Kunde** möchte ich das Banner optional schließen bzw. ausblenden (z. B. pro Session), damit es mich nicht stört.

---

## Anzeige (Kunden-Speiseplan)

- **Position:** Direkt **oberhalb** der Speiseplan-Ansicht (oberhalb von KW-Navigation und Tages-Tabs), innerhalb des gleichen Containers wie `MenuWeek`.
- **Sichtbarkeit:** Nur anzeigen, wenn für die angefragte **KW + Jahr + Location** mindestens ein Banner zugewiesen ist; sonst kein Platzhalter.
- **Mehrere Banner:** Wenn mehrere Banner zugewiesen sind → **Karussell** (Slider mit Pfeilen und/oder Dots, optional Swipe auf Touch). Reihenfolge = Zuweisungsreihenfolge.
- **Inhalt:** Titel (Pflicht), optional Untertitel, optional Bild/Hintergrund. **Kein CTA** (kein „Mehr erfahren“, kein Link, kein Modal).
- **Responsive:** Auf kleinen Screens kompakt; auf Desktop volle Breite mit Bild/Teaser.

---

## Visuelle Spezifikation (UI Designer)

- **Design-System:** Farben, Typo, Abstände und Radii wie in **DESIGN_GUIDELINES.md** (z. B. `rounded-2xl`, `border-border/50`, Card-Sprache).
- **Hero-Bereich:** Gradient-Hintergründe wie bei Header-Bereichen (z. B. `from-green-50 via-emerald-50 to-teal-50` / Dark-Mode-Äquivalent); optional eigenes Bild als Hintergrund mit Overlay für Lesbarkeit.
- **Hierarchie:** Titel deutlich (z. B. `text-2xl md:text-3xl font-bold`), Untertitel zurückhaltend (`text-muted-foreground`).
- **Konsistenz:** Kein Konflikt mit Aktion-Badges auf Gerichten (Amber); Banner nutzt z. B. Grün/Emerald für „Motto-Woche“.
- **Accessibility:** Ausreichender Kontrast (WCAG), semantisches Markup (z. B. `<section aria-label="Aktuelle Aktion">`), Schließen-Button per Tastatur erreichbar.
- **Karussell:** Pfeile und Dots klar erkennbar; Fokus-Reihenfolge und ARIA-Labels für Slider.

---

## Assets & Daten

- **Banner-Vorlagen (Admin):** Titel (Pflicht), optional Untertitel, optional Bild-URL. Kein CTA.
- **Wiederverwendung:** Motto-Banner sind als wieder verwendbare Entität ablegbar; pro Woche werden eine oder mehrere Vorlagen der KW zugewiesen (Reihenfolge für Karussell).
- **Datenmodell:** Entität **PromotionBanner** (Titel, Untertitel, imageUrl) + Zuordnung **MenuPromotionBanner** (menuId, promotionBannerId, sortOrder). Pro Menu/KW können mehrere Banner zugewiesen werden.

---

## Verwaltung & Navigation

- **Sidebar:** Neue Kategorie **„Promotions“** mit:
  - **Motto-Banner** (oder „Promotion-Banner“) → Verwaltung der wieder verwendbaren Banner und Zuweisung pro KW (ggf. aus Menu-Planner verlinkt).
  - **Coupons** → bestehende Coupon-Seite wird hierher verschoben (nur Navigation, keine fachliche Änderung an Coupons).
- **Banner-Verwaltung:** Eigene Admin-Seite unter „Promotions“ (z. B. `/admin/promotions/banners`) mit CRUD für PromotionBanner.
- **Zuweisung pro Woche:** Im Menu-Planner für die aktuelle Woche (KW + Jahr) wählbar: mehrere Banner auswählbar, Reihenfolge festlegbar (für Karussell).

---

## Planung (Menu-Planner)

- **Zuweisung:** Im Menu-Planner für die **aktuelle Woche** (KW + Jahr): Auswahl mehrerer Banner, Reihenfolge (sortOrder) für Karussell; Speicherung pro Menu.
- **API:** GET `/api/menus` liefert bei vorhandener Zuweisung die zugehörigen Banner (Titel, Untertitel, imageUrl) in Reihenfolge mit.

---

## Kunden-Interaktion

- **Standard:** Banner/Karussell sichtbar, nicht modal; Kunde kann normal scrollen und bestellen.
- **Schließen:** Optional Button „Schließen“ (X); Zustand „Banner ausgeblendet“ für die **aktuelle Session** (z. B. `sessionStorage`), damit es beim erneuten Öffnen derselben Woche in derselben Session nicht wieder erscheint.
- **Kein CTA:** Es gibt keinen Klick zu „Mehr erfahren“ oder externem Link.

---

## Acceptance Criteria

- [ ] **Sidebar:** Kategorie „Promotions“ mit Einträgen „Motto-Banner“ und „Coupons“; Coupon-Seite nur in der Navigation verschoben.
- [ ] **Admin:** Seite zur Verwaltung wieder verwendbarer Motto-Banner (CRUD: Titel, optional Untertitel, optional Bild).
- [ ] **Admin:** Im Menu-Planner können für die angezeigte KW mehrere Banner zugewiesen und in Reihenfolge gebracht werden.
- [ ] **Kunde:** Wenn für die angefragte KW/Jahr/Location mindestens ein Banner zugewiesen ist, wird es oberhalb des Speiseplans angezeigt; bei mehreren als Karussell (Pfeile/Dots, optional Swipe).
- [ ] **Kunde:** Banner zeigt Titel und optional Untertitel/Bild; Darstellung entspricht DESIGN_GUIDELINES.
- [ ] **Kunde:** Optional: Schließen-Button blendet Banner/Karussell für die aktuelle Session aus.
- [ ] **API:** GET `/api/menus` liefert bei vorhandener Zuweisung die Banner-Daten (Titel, Untertitel, imageUrl) in Reihenfolge mit.
- [ ] **Responsive & Accessibility:** Banner/Karussell responsive; Kontrast und Fokus-Reihenfolge barrierefrei.

---

## Edge Cases

- **Kein Banner zugewiesen:** Kein Platzhalter; Speiseplan beginnt wie bisher.
- **Banner ohne Bild:** Nur Text mit Gradient/Flächenfarbe gemäß DESIGN_GUIDELINES.
- **Sehr langer Titel/Untertitel:** `line-clamp-2` bzw. `line-clamp-1`, um Layout-Bruch zu vermeiden.
- **Mehrere Locations:** Banner-Zuweisung pro Menu (pro Location + KW + Jahr).
- **Session-Storage deaktiviert:** Wenn „ausblenden“ nicht gespeichert werden kann, bleibt das Banner sichtbar (graceful degradation).

---

## Abhängigkeiten

- Bestehende Kunden-Seite `/menu` und Komponente `MenuWeek`; Integration des Banners oberhalb des Speiseplan-Inhalts.
- Bestehende API `GET /api/menus` erweitern um optionale Banner-Daten für die angefragte KW/Jahr/Location.
- Menu-Planner: Zuweisung mehrerer Banner pro Woche mit Reihenfolge.
- DESIGN_GUIDELINES.md für visuelle Konsistenz.

---

## Technische Anforderungen (optional)

- **Performance:** Banner-Daten mit Menü in einem Request liefern.
- **Sicherheit:** Banner-Inhalte nur lesend für Kunden; Änderungen nur über Admin-APIs mit Auth.
- **Bilder:** Empfohlenes Seitenverhältnis für Hero (z. B. 4:1 oder 3:1) in Asset-Doku festhalten.

---

## Offene Punkte / Entscheidungen (erledigt)

- **Banner-Verwaltung:** Eigene Admin-Seite unter Sidebar-Kategorie **„Promotions“**; **Coupons** ebenfalls unter „Promotions“ eingeordnet.
- **CTA:** Kein CTA; Banner nur Anzeige (Titel, optional Untertitel, optional Bild) plus optional Schließen-Button.
- **Mehrere Banner pro Woche:** Werden als **Karussell** angezeigt (Slider mit Pfeilen/Dots, optional Swipe). Reihenfolge = Zuweisungsreihenfolge (sortOrder).

---

## QA Test Results

**Tested:** 2026-02-19
**App URL:** http://localhost:3002

### Acceptance Criteria Status

- [x] **Sidebar:** OK – Kategorie „Promotions“ mit Motto-Banner, Coupons
- [x] **Admin CRUD:** OK – /admin/promotions/banners mit Create, Read, Update, Delete; Titel (Pflicht), Untertitel, Bild optional
- [x] **Menu-Planner Zuweisung:** OK – Zuweisung pro KW (MenuPromotionBanner)
- [x] **Kunde /menu:** OK – PromotionBannerCarousel oberhalb des Speiseplans in MenuWeek
- [x] **Karussell:** OK – Pfeile + Dots bei mehreren Bannern; Reihenfolge = sortOrder
- [x] **Schließen-Button:** OK – X-Button, sessionStorage für aktuelle Session
- [x] **API:** OK – GET /api/menus liefert promotionBanners bei Zuweisung

### Summary
- ✅ Alle geprüften ACs bestanden (Code-Review)
