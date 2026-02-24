# PROJ-8: Drag & Drop Block-Editor — Multi-Channel Content Studio

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-7 (Marketing Template Library) – Editor wird von dort geöffnet
- Benötigt: PROJ-1 (Admin Dashboard) – Admin-only
- Benötigt: PROJ-9 (E-Mail-Versand) – E-Mail-Kanal-Integration
- Benötigt: PROJ-10 (Push/In-App Integration) – Push & In-App-Kanal-Integration
- Optional: PROJ-4e (Coupons & Incentives) – Coupon-Block bezieht Daten von dort

## Übersicht

Professioneller Multi-Channel Block-Editor zum Erstellen von E-Mail-Newslettern, personalisierten Transaktionsmails, In-App-Nachrichten und Push-Notifications. Der Admin arbeitet in einer 3-Spalten-Oberfläche (Block-Palette | Canvas | Eigenschaften-Panel) mit vollständiger Live-Preview für Desktop, Mobile und je nach Kanal. Alle Inhalte werden als strukturiertes JSON gespeichert und kanalspezifisch gerendert — ein Template kann für verschiedene Kanäle optimiert werden ohne HTML-Kenntnisse.

Inspiriert von Industriestandards (Braze, Iterable, Klaviyo): vollständiges Zeilen-/Spalten-System, gespeicherte Zeilen, dynamische Bildpersonalisierung, Handlebars-Merge-Tags, interaktive Form-Blöcke für In-App, mobile Sichtbarkeitskontrolle, Bild-Asset-Bibliothek und Zugänglichkeitsprüfung.

---

## User Stories

### Kanal & Template-Einstieg

- Als Admin möchte ich beim Erstellen eines Templates den Ziel-**Kanal** wählen (E-Mail / In-App / Push), damit kanalspezifische Blöcke, Einstellungen und Preview-Modi automatisch aktiviert werden.
- Als Admin möchte ich aus einer **Galerie vorgefertigter Starter-Templates** (z. B. „One Column Newsletter", „Produktankündigung", „Willkommensmail", „In-App Angebot") wählen oder mit einem leeren Canvas starten, damit ich nicht bei Null anfangen muss.
- Als Admin möchte ich das Template mit einem **inline editierbaren Namen** versehen, damit ich es in der Bibliothek schnell wiederfinde.

### Canvas & Drag & Drop

- Als Admin möchte ich **Zeilen (Rows)** per Drag & Drop aus der Palette in den Canvas ziehen und darin **1 bis 6 Spalten** frei konfigurieren (inkl. asymmetrischer Aufteilung wie 33/67 oder 25/75), damit ich flexible, professionelle Layouts erstellen kann.
- Als Admin möchte ich **Content-Blöcke** in Spalten einer Zeile ziehen und innerhalb des Canvas per Drag Handle (⠿) beliebig neu anordnen, damit ich jederzeit die Reihenfolge anpassen kann.
- Als Admin möchte ich jeden Block per Klick auswählen und ihn über ein **kontextuelles Eigenschaften-Panel** (rechts) präzise konfigurieren (Farbe, Text, Abstände, Links etc.).
- Als Admin möchte ich Blöcke und Zeilen **duplizieren** (⧉) oder **löschen** (🗑), damit ich schnell Variationen erstellen kann.
- Als Admin möchte ich **Undo (Strg+Z) und Redo (Strg+Y)** mit mindestens 30 Schritten History nutzen, damit ich Fehler sofort korrigieren kann.

### Block-Typen — Inhalt

- Als Admin möchte ich einen **Titel-Block** (H1–H4) mit Schriftgröße, Farbe, Ausrichtung und Zeilenabstand einfügen.
- Als Admin möchte ich einen **Absatz/Text-Block** mit vollständigem Rich-Text-Editor (fett, kursiv, unterstrichen, Links, Aufzählungen, Einzug) und Merge-Tag-Unterstützung nutzen.
- Als Admin möchte ich einen **Listen-Block** (Aufzählung oder nummeriert) mit konfigurierbaren Schrift- und Abstandsoptionen einfügen.
- Als Admin möchte ich einen **Bild-Block** mit Upload, URL-Eingabe, Alt-Text, Ausrichtung, Breite, Rahmen und Rundecken nutzen; das Bild soll auch klickbar verlinkt werden können.
- Als Admin möchte ich einen **Video-Block** (YouTube/Vimeo-URL), der in der E-Mail als anklickbares Vorschaubild mit Play-Button dargestellt wird (da Videos in E-Mails nicht direkt abspielen).
- Als Admin möchte ich einen **Button/CTA-Block** mit Beschriftung, URL/Aktion, Hintergrundfarbe, Textfarbe, Rahmen, Rundung, Größe und Ausrichtung einfügen; Buttons unterstützen kanalspezifische On-Click-Aktionen (URL öffnen, In-App schließen, Deeplink, Push-Permission anfordern).
- Als Admin möchte ich einen **Social-Media-Block** mit vordefinierten Icons (Instagram, Facebook, LinkedIn, X/Twitter, YouTube, TikTok) einfügen und die Links pro Icon konfigurieren.
- Als Admin möchte ich einen **Menü/Navigations-Block** (horizontal oder vertikal) mit konfigurierbaren Links einfügen, der in E-Mail-Headern typisch ist.
- Als Admin möchte ich einen **Icon-Block** mit wählbarem Symbol, Farbe und optionalem Label einfügen.
- Als Admin möchte ich **animierte GIFs** via GIPHY-Suche direkt im Editor einbetten, damit Kampagnen visuell lebendiger werden.
- Als Admin möchte ich einen **HTML-Block** für benutzerdefiniertes HTML/CSS einbauen, wenn Standardblöcke nicht ausreichen.

### Block-Typen — Layout & Struktur

- Als Admin möchte ich einen **Spacer-Block** mit konfigurierbarer Höhe einfügen.
- Als Admin möchte ich einen **Trennlinie-Block** mit Farbe, Stärke (px) und Stil (solid/dashed/dotted) einfügen.
- Als Admin möchte ich **Zeilen-Hintergrundbilder** setzen können, damit vollflächige visuelle Bereiche (Hero-Sections) entstehen.
- Als Admin möchte ich pro Zeile **Hintergrundfarbe, Rahmen, Innenabstand und Rundung (Border Radius)** konfigurieren.

### Block-Typen — Interaktiv (In-App)

- Als Admin möchte ich (für In-App-Templates) **Formular-Blöcke** einbauen: E-Mail-Capture, Telefon-Capture, Dropdown, Radio-Button-Gruppe und Checkbox-Gruppe, um Nutzerfeedback und Abonnements direkt in der App einzusammeln.
- Als Admin möchte ich pro interaktivem Element konfigurieren, welches **Custom Attribute** bei Absenden gesetzt wird und welche **Aktion** danach ausgelöst wird (Schließen, URL öffnen, Nächste Seite im Template).
- Als Admin möchte ich einen **Countdown-Timer-Block** einbauen, der die verbleibende Zeit bis zu einem konfigurierten Zeitstempel dynamisch anzeigt (z. B. „Angebot endet in 02:14:33").

### Block-Typen — Kantine-spezifisch

- Als Admin möchte ich einen **„Tagesmenü"-Block** einbauen, der automatisch das heutige Tagesmenü des gewählten Standorts aus der Datenbank lädt und in der E-Mail anzeigt — ohne manuelles Befüllen.
- Als Admin möchte ich einen **Coupon-Block** mit Coupon aus PROJ-4e-Dropdown, Code-Darstellung und eigenem CTA-Text einbauen.

### Personalisierung & Dynamic Content

- Als Admin möchte ich **Merge-Tags / Handlebars-Variablen** (`{{firstName}}`, `{{email}}`, `{{standort}}`, `{{gericht_des_tages}}`, `{{coupon_code}}`, `{{datum}}`, `{{wallet_balance}}`) per Klick-Dropdown in Text- und Titelblöcke einfügen, damit ich keine Platzhalter manuell tippen muss.
- Als Admin möchte ich **Fallback-Werte** für Merge-Tags definieren (z. B. `{{firstName | default: "Gast"}}`), damit E-Mails sauber aussehen wenn Daten fehlen.
- Als Admin möchte ich **dynamische Bild-URLs** mit Merge-Tags verwenden (z. B. `https://cdn.example.com/banner/{{standort}}.jpg`), damit ortsspezifische Bilder ohne separate Templates möglich sind.
- Als Admin möchte ich in der Preview-Ansicht **Beispiel-Daten** eingeben (Vorname, Standort etc.), damit ich sehe wie das Template für reale Nutzer aussieht.
- Als Admin möchte ich unbekannte oder falsch geschriebene Merge-Tags in der Preview **farblich markiert** (orange) sehen.

### Sichtbarkeit & Mobile-Kontrolle

- Als Admin möchte ich jeden Block oder jede Zeile einzeln auf **„Nur Desktop"**, **„Nur Mobile"** oder **„Beide"** stellen, damit ich gezielt mobile- oder desktop-optimierte Layouts bauen kann.
- Als Admin möchte ich für mehrspaltige Zeilen konfigurieren, ob Spalten auf Mobile **gestapelt** werden, **nicht gestapelt** bleiben oder in **umgekehrter Reihenfolge** gestapelt werden.
- Als Admin möchte ich im Editor einen **Eye-Icon-Toggle** nutzen, der ausgeblendete Blöcke abgedunkelt anzeigt, damit ich den Überblick behalte ohne ständig in den Preview-Modus zu wechseln.

### Preview & Test

- Als Admin möchte ich zwischen **Desktop-Preview** (600px), **Mobile-Preview** (375px) und — bei In-App — einer **Geräte-Simulation** (iPhone-Frame) wechseln.
- Als Admin möchte ich über einen **„Test senden"-Button** das Template direkt an eine oder mehrere E-Mail-Adressen versenden, um es in echten E-Mail-Clients zu prüfen.
- Als Admin möchte ich für E-Mail-Templates einen **Spam-Score-Indikator** sehen (grün/gelb/rot), damit ich offensichtliche Spam-Trigger vermeiden kann.
- Als Admin möchte ich eine **Zugänglichkeitsprüfung** die mir warnt wenn Bilder ohne Alt-Text sind oder Schriftfarbe/Hintergrundfarbe-Kontrast zu gering ist.

### Kanalspezifische Einstellungen

- Als Admin möchte ich für E-Mail-Templates **Betreffzeile**, **Vorschautext** (Preheader), **Absendername** und **Absende-E-Mail** direkt im Editor konfigurieren.
- Als Admin möchte ich für Push-Templates **Titel** (max. 65 Zeichen), **Nachrichtentext** (max. 240 Zeichen), **Icon**, **Bild** (Rich Push) und **Action-URL** konfigurieren — mit Live-Zeichenzähler.
- Als Admin möchte ich für In-App-Templates **Größe** (Klein-Banner / Mittel-Modal / Vollbild), **Position** (Oben / Unten / Mitte), **Trigger-Bedingung** und **Schließen-Button** konfigurieren.
- Als Admin möchte ich für In-App-Templates auf **multi-page** Templates umschalten, bei denen Buttons zur nächsten Seite navigieren (z. B. Onboarding-Flow mit 3 Screens).

### Asset-Verwaltung

- Als Admin möchte ich eine **integrierte Bild-Bibliothek** (File Manager) nutzen mit Upload (max. 20 MB), Ordner-Organisation, Suche, Sortierung (Name/Datum/Größe/Typ) und Grid/Listen-Ansicht.
- Als Admin möchte ich Bilder direkt im Editor mit einem einfachen **Bild-Editor** nachbearbeiten (zuschneiden, drehen, Filter, Helligkeit), ohne externe Tools.

### Gespeicherte Blöcke & Zeilen

- Als Admin möchte ich eine vollständig konfigurierte **Zeile als „Gespeicherte Zeile"** in einer persönlichen Bibliothek speichern und in anderen Templates per Drag & Drop wiederverwenden.
- Als Admin möchte ich oft genutzte Block-Kombinationen (z. B. „Hero-Banner mit CTA") als **gespeicherten Block** sichern.

### Globale Einstellungen & Brand

- Als Admin möchte ich **globale Template-Einstellungen** festlegen: Content-Breite (px), Ausrichtung (links/zentriert), Hintergrundfarbe, Content-Hintergrundfarbe, Standard-Schriftart, Standard-Link-Farbe, globales Innenabstand.
- Als Admin möchte ich **benutzerdefinierte Schriftarten** (mit Google Fonts-URL oder eigenem CDN-Host) hinzufügen und Fallback-Schriftfamilien definieren.
- Als Admin möchte ich die **Primärfarbe meiner Organisation** (aus PROJ-1) als Default-Primärfarbe im Editor vorbelegt sehen.

### Speichern & Versionierung

- Als Admin möchte ich das Template jederzeit **manuell speichern** und es wird automatisch alle **60 Sekunden** (Autosave mit Statusanzeige) gespeichert.
- Als Admin möchte ich eine **Versionshistorie** (letzte 10 gespeicherte Zustände) einsehen und zu einer früheren Version zurückrollen.
- Als Admin möchte ich bei **ungespeicherten Änderungen** beim Verlassen eine Warnung erhalten.

---

## Acceptance Criteria

### Editor-Layout & Navigation

- [ ] 3-Spalten-Layout: Links Block-/Zeilen-Palette (~250px, scrollbar) | Mitte Canvas (fixiert ~600px) | Rechts Eigenschaften-Panel (~280px)
- [ ] Topbar (fixiert): Zurück-Button, Template-Name (inline editierbar), Kanal-Badge, Autosave-Status, Preview-Toggle, Test-senden-Button, Speichern-Button
- [ ] Kanal-Auswahl (E-Mail / In-App / Push) beim ersten Öffnen oder in Template-Settings änderbar; Kanalwechsel zeigt Warnung bei inkompatiblen Blöcken
- [ ] Starter-Template-Galerie: mind. 6 vorgefertigte Templates pro Kanal auswählbar beim Erstellen
- [ ] Undo (Strg+Z) / Redo (Strg+Y) mit ≥ 30 Schritten
- [ ] Bei ungespeicherten Änderungen + Verlassen: Bestätigungs-Modal mit „Verwerfen" / „Speichern & Verlassen"

### Palette — Tabs & Inhalt

- [ ] **Tab: Blöcke** — Blöcke gruppiert in Abschnitte: Inhalt, Layout, Interaktiv (nur In-App), Kantine
- [ ] **Tab: Zeilen** — Zeilen-Vorlagen (1–6 Spalten) + gespeicherte Zeilen + Zeilen-Verwaltung
- [ ] **Tab: Einstellungen** — globale Template-Einstellungen (Breite, Farben, Schriften, Link-Farbe)
- [ ] **Tab: Kanal** — kanalspezifische Einstellungen (Betreff/Preheader für E-Mail; Titel/Body/Action für Push; Größe/Trigger für In-App)
- [ ] Suchfeld in Blöcke-Tab zum Filtern nach Block-Namen

### Block-Bibliothek — vollständig

| Block | Kanal | Konfigurierbare Eigenschaften |
|-------|-------|-------------------------------|
| **Titel** (H1–H4) | Alle | Text, Ebene, Schriftart, Größe, Gewicht, Farbe, Ausrichtung, Zeilenabstand, Buchstabenabstand, Padding, Merge-Tags |
| **Absatz** | Alle | Rich-Text, Schriftart, Größe, Gewicht, Farbe, Zeilenabstand, Absatzabstand, Padding, Merge-Tags |
| **Liste** | Alle | Aufzählung oder nummeriert, Schriftart, Farbe, Einrückung, Padding |
| **Bild** | Alle | Upload / URL / Bibliothek, Alt-Text, Ausrichtung, Breite, Rahmen-Stil/Farbe/Breite, Rundung, Link, Padding, Dynamische URL, Mobile-Sichtbarkeit |
| **Video** | E-Mail, In-App | YouTube/Vimeo-URL, Vorschaubild (auto oder custom), Play-Icon-Stil, Link-URL |
| **Button/CTA** | Alle | Beschriftung, Breite (auto/manuell), Schriftart, Farbe, Hintergrundfarbe, Rahmen, Rundung, Ausrichtung, On-Click-Aktion kanalspezifisch, Padding, Merge-Tags in URL |
| **Social** | E-Mail, In-App | Icon-Set (Instagram/Facebook/LinkedIn/X/YouTube/TikTok), Stil (Farbe/Schwarz-Weiß), Ausrichtung, Abstände, je Link konfigurierbar |
| **Menü** | E-Mail | Links (Label + URL), Orientierung (horizontal/vertikal), Schriftart, Farbe, Trennzeichen |
| **Icon** | Alle | Icon-Wahl (Lucide Library), Farbe, Größe, Label, Ausrichtung |
| **GIF / Sticker** | Alle | GIPHY-Suche, Auswahl aus Suchergebnissen, Alt-Text, Breite, Ausrichtung |
| **HTML** | E-Mail, In-App | Freier HTML/CSS-Code-Editor mit Syntax-Highlighting, Merge-Tags und Snippets |
| **Spacer** | Alle | Höhe (px), Hintergrundfarbe |
| **Trennlinie** | Alle | Farbe, Stärke (px), Stil (solid/dashed/dotted), Breite (%), Ausrichtung |
| **Countdown-Timer** | E-Mail, In-App | Ziel-Zeitstempel, Format (Tage/Stunden/Minuten/Sekunden toggle), Schriftart, Farbe, Hintergrund |
| **Coupon** | E-Mail, In-App | Coupon aus PROJ-4e Dropdown, Code-Darstellung (Inline oder Copy-Button), CTA-Text und Button |
| **Tagesmenü** | E-Mail, In-App | Standort-Auswahl, Anzahl Gerichte (1–5), Layout (Liste oder Karten), Felder (Name, Beschreibung, Preis, Bild) |
| **E-Mail-Capture** | In-App | Placeholder-Text, Subscription-Gruppe, Custom Attribute, Schriftart, On-Submit-Aktion |
| **Telefon-Capture** | In-App | Placeholder-Text, SMS/WhatsApp Subscription-Gruppe, Länderauswahl, On-Submit-Aktion |
| **Dropdown** | In-App | Optionen-Liste, Custom Attribute, Placeholder |
| **Radio-Button-Gruppe** | In-App | Optionen-Liste, Single-Select, Custom Attribute |
| **Checkbox** | In-App | Label, Custom Attribute (boolean), Standardzustand |
| **Checkbox-Gruppe** | In-App | Optionen-Liste, Multi-Select, Array Custom Attribute |

- [ ] Alle Blöcke: per-Block **Padding** (oben/unten/links/rechts separat oder verknüpft)
- [ ] Alle Blöcke: **Mobile-Sichtbarkeit** (beide / nur Desktop / nur Mobile)
- [ ] Alle Blöcke: **Duplizieren** (⧉) und **Löschen** (🗑) via Hover-Toolbar
- [ ] Blöcke per **Tastatur** bewegbar (Tab zum Auswählen, Pfeiltasten zum Verschieben)

### Zeilen-System

- [ ] Zeilen-Vorlagen 1–6 Spalten wählbar; jede Spalte hat konfigurierbaren Anteil am 12-Spalten-Grid (z. B. 4+8, 6+6, 3+6+3)
- [ ] Zeilen-Eigenschaften: Hintergrundfarbe, Hintergrundbild (URL oder Bibliothek), Border-Stil/Farbe/Breite, Rundung, Innenabstand
- [ ] **Spalten-Stacking-Kontrolle** pro Zeile: Stapeln (Standard) / Nicht stapeln / Umgekehrt stapeln auf Mobile
- [ ] Zeile **als Gespeicherte Zeile sichern** per Rechtsklick oder Icon; Name vergeben; in Palette unter „Gespeicherte Zeilen" verfügbar
- [ ] Gespeicherte Zeilen löschen oder umbenennen
- [ ] **Zeilen-Reihenfolge auf Mobile** unabhängig von Desktop konfigurierbar (z. B. Bild-Zeile auf Mobile zuerst anzeigen)

### Personalisierung & Merge-Tags

- [ ] In Titel- und Absatz-Blöcken: **Merge-Tag-Dropdown** mit Variablen: `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{standort}}`, `{{gericht_des_tages}}`, `{{coupon_code}}`, `{{datum}}`, `{{wallet_balance}}`
- [ ] Merge-Tags unterstützen **Fallback-Syntax**: `{{firstName | default: "Gast"}}`
- [ ] In Bild-Blöcken: Toggle **„Dynamisches Bild"** → URL-Feld akzeptiert Merge-Tags
- [ ] Preview-Modus: Schaltfläche **„Beispieldaten bearbeiten"** öffnet Formular zum Befüllen aller Merge-Tags mit Testwerten
- [ ] Unbekannte Merge-Tags in der Preview: **orangefarbene Markierung** + Tooltip „Unbekannte Variable"
- [ ] Merge-Tags in Button-URLs werden in der Preview mit Testwerten aufgelöst

### Sichtbarkeit & Mobile-Optimierung

- [ ] Eye-Icon in der Topbar: blendet alle Blöcke mit `hide = true` in der Canvas **abgedunkelt** ein (nicht unsichtbar)
- [ ] Pro Block im Eigenschaften-Panel: Dropdown **Sichtbarkeit** (Desktop & Mobile / Nur Desktop / Nur Mobile)
- [ ] In Mobile-Preview: ausgeblendete Blöcke erscheinen nicht
- [ ] Jeder Block hat im Eigenschaften-Panel eine **Mobile-Untersektion** für separate mobile Schriftgröße, Padding und Ausrichtung

### Preview

- [ ] **Desktop-Preview**: Canvas bei ~600px
- [ ] **Mobile-Preview**: Canvas bei 375px, simulierter iPhone-Frame optional einblendbar
- [ ] **In-App-Gerätesimulation**: Overlay mit Geräte-Frame (iPhone/Android)
- [ ] Preview-Toggle als Tab-Bar: [Desktop] [Mobile] — aktiver Tab farblich hervorgehoben
- [ ] Push-Kanal: Preview zeigt Notification-Preview mit Titel, Body, Icon und Bild wie auf iOS/Android

### Kanalspezifische Einstellungen

**E-Mail:**
- [ ] Betreffzeile: Text-Input mit Merge-Tag-Support, Emoji-Picker, Live-Zeichenzähler (Warnung > 60 Zeichen)
- [ ] Vorschautext (Preheader): max. 140 Zeichen, Merge-Tag-Support
- [ ] Absendername und Absende-E-Mail konfigurierbar
- [ ] **Spam-Score-Indikator** (grün ≤ 3 / gelb 3–5 / rot > 5) mit Liste der Score-Treiber
- [ ] HTML-Export-Button: vollständiges E-Mail-HTML herunterladbar

**Push:**
- [ ] Titel: max. 65 Zeichen (Live-Zähler, Warnung bei Überschreitung)
- [ ] Nachrichtentext: max. 240 Zeichen (Live-Zähler)
- [ ] Icon-URL (optional, Fallback: App-Icon)
- [ ] Rich-Push-Bild-URL (optional)
- [ ] Action-URL / Deeplink (Merge-Tag-Support)
- [ ] Preview zeigt iOS- und Android-Notification nebeneinander

**In-App:**
- [ ] Größe: Klein-Banner (Bottom Sheet) / Mittel-Modal / Vollbild
- [ ] Position: Oben / Unten / Mitte (abhängig von Größe)
- [ ] Hintergrundfarbe des Overlays (Transparency konfigurierbar)
- [ ] Schließen-Button: An/Aus, Position (oben links / oben rechts), Farbe
- [ ] Multi-Page: Toggle zum Aktivieren; jede Seite hat eigenen Block-Canvas; Navigation via Button-Aktionen
- [ ] Trigger-Bedingung dokumentiert (tatsächliche Trigger-Logik via PROJ-10)
- [ ] Maximale Content-Breite: 768px (Hinweis bei Überschreitung)

### Test & Qualität

- [ ] **Test senden**: E-Mail-Adressen eingeben (kommasepariert, max. 5), Merge-Tag-Testwerte aus Preview-Daten werden verwendet
- [ ] **Zugänglichkeitsprüfung** (Accessibility Checker): warnt bei fehlenden Alt-Texten, niedrigem Farb-Kontrast (< 4.5:1 WCAG AA), leeren Links
- [ ] Checker-Ergebnisse als nummerierte Liste mit direktem „Zum Block springen"-Link

### Asset-Bibliothek (Bild-Manager)

- [ ] Bild-Upload per Drag & Drop oder Datei-Dialog (max. 20 MB pro Datei; Formate: JPG, PNG, GIF, SVG, WebP)
- [ ] Ordner-Verwaltung: Erstellen, Umbenennen, Löschen
- [ ] Ansicht: Grid oder Liste; Sortierung nach Name / Datum / Größe / Typ
- [ ] Suche nach Dateinamen
- [ ] Leichter **Bild-Editor**: Zuschneiden, Drehen, Filter, Text-Overlay
- [ ] Bild ersetzen (URL bleibt gleich für alle Templates die es verwenden)
- [ ] GIPHY-Suche: Suchfeld → Suchergebnisse als Thumbnails → Auswahl fügt animiertes GIF in Block ein

### Gespeicherte Zeilen & Blöcke

- [ ] Zeile per Hover-Toolbar → „Als Zeile speichern" → Namens-Eingabe → erscheint in Palette unter „Gespeicherte Zeilen"
- [ ] Gespeicherte Zeilen zeigen Vorschau-Thumbnail in der Palette
- [ ] Gespeicherte Zeile einfügen → wird als eigenständige Kopie eingefügt (keine Live-Synchronisation mit Original)
- [ ] Gespeicherte Zeilen org-weit geteilt (alle Admins der Organisation sehen sie)

### Globale Stil-Einstellungen

- [ ] Über „Einstellungen"-Tab: Content-Breite (Slider 400–700px), Ausrichtung (Links/Zentriert), Hintergrundfarbe, Content-Bereich-Hintergrundfarbe, Standard-Schriftart, Link-Farbe, Global-Padding
- [ ] Standard-Schriftarten: Inter, Georgia, Lato, Roboto + benutzerdefinierte Schriftart (Name + CSS-URL + Fallback-Familie)
- [ ] Primärfarbe der Organisation automatisch vorbelegt (aus PROJ-1 Org-Einstellungen)

### Versionshistorie

- [ ] Jedes manuelle Speichern + jeder Autosave erzeugt einen Versions-Snapshot
- [ ] Versionshistorie-Panel (über Topbar erreichbar): Liste der letzten 10 Versionen (Zeitstempel + auslösender Speichertyp)
- [ ] Klick auf Version: Read-only-Preview öffnet sich
- [ ] „Diese Version wiederherstellen"-Button: ersetzt aktuellen Editor-Zustand (mit Bestätigungs-Dialog)

### Speichern & Exportieren

- [ ] Autosave alle 60 Sekunden (debounced), Status im Header: „Gespeichert vor X Sek." / „Speichern…" / „Autosave fehlgeschlagen"
- [ ] Manueller Speichern-Button immer sichtbar
- [ ] „Speichern & Schließen" → zurück zur Template-Bibliothek (PROJ-7)
- [ ] „Als Entwurf für Versand speichern" → öffnet PROJ-9 E-Mail-Versand-Flow (nur E-Mail-Kanal)
- [ ] HTML-Export (E-Mail-Kanal): vollständiges, inbox-kompatibles HTML
- [ ] Bei ungespeicherten Änderungen + Browser-Schließen: `beforeunload`-Event warnt

---

## Edge Cases

- **Block inkompatibel mit gewähltem Kanal:** Admin zieht E-Mail-Capture-Block in ein E-Mail-Template → Warnung: „Dieser Block ist nur für In-App-Nachrichten verfügbar." Block wird nicht eingefügt.
- **Kanalwechsel mit inkompatiblen Blöcken:** Admin wechselt von In-App auf E-Mail und Canvas enthält Formular-Blöcke → Modal: „X Blöcke sind mit E-Mail nicht kompatibel und werden entfernt. Fortfahren?"
- **Tagesmenü-Block ohne verfügbares Menü:** Wenn für den gewählten Standort heute kein Menü gepflegt ist → Block zeigt Fallback-Text: „Kein Menü für heute geplant." (konfigurierbar).
- **Coupon-Block ohne aktive Coupons:** Hinweis im Properties-Panel: „Keine aktiven Coupons vorhanden – bitte in PROJ-4e anlegen." mit Link.
- **Dynamisches Bild mit ungültiger URL:** URL enthält Merge-Tag der zu 404 führt → Preview zeigt Alt-Text; kein Absturz.
- **Bild-Upload > 20 MB:** Fehlermeldung: „Die Datei überschreitet die maximale Größe von 20 MB." Upload wird abgebrochen.
- **GIF aus GIPHY nicht verfügbar:** GIPHY-API antwortet nicht → Suchergebnisse zeigen „Suche nicht verfügbar. Bitte direkt eine GIF-URL einfügen." als Fallback.
- **Merge-Tag ohne Fallback, Daten fehlen:** In der Test-Preview wird Variable nicht aufgelöst und orange markiert; beim echten Versand greift Fallback oder leerer String (abhängig von Versandlogik PROJ-9).
- **Multi-Page In-App mit 10+ Seiten:** Editor begrenzt auf 10 Seiten max.; Hinweis: „Maximale Seitenanzahl erreicht."
- **Countdown-Timer abgelaufen (Zeitstempel in Vergangenheit):** Block zeigt „00:00:00" in Preview + gelbes Warn-Badge: „Timer bereits abgelaufen."
- **Sehr langer Coupon-Code bricht Layout:** Coupon-Block hat `word-break: break-all` als Fallback im Rendering.
- **Spalten-Block auf Mobile ohne Stack-Konfiguration:** Standard-Verhalten: Spalten stapeln sich von oben nach unten; erster Spalten-Inhalt zuerst.
- **Autosave schlägt fehl (kein Netz):** Gelbes Warning-Banner im Header: „Autosave fehlgeschlagen — Bitte manuell speichern." Manuelles Speichern bleibt möglich.
- **Template ohne Blöcke speichern:** Warnung: „Das Template ist leer — wirklich speichern?" mit „Trotzdem speichern"-Option.
- **Undo über gespeicherten Zustand hinaus:** Undo-History wird beim Verlassen der Seite geleert (kein persistentes Undo über Sessions hinweg).
- **Custom Font-URL nicht erreichbar (CORS):** Fehlermeldung in Custom-Font-Dialog: „Schriftart konnte nicht geladen werden. Prüfe CORS-Einstellungen und SSL-Zertifikat."
- **Versionshistorie-Restore schlägt fehl:** Fehlermeldung + aktuelle Version bleibt erhalten (kein Datenverlust).
- **Spam-Score > 5:** Roter Indikator mit aufklappbarer Erklärung der Top-3-Score-Treiber; Admin kann Template trotzdem speichern.
- **Alt-Text fehlt bei mehr als 3 Bildern:** Accessibility-Checker zeigt gebündelte Warnung statt Einzel-Warnungen pro Bild.

---

## Technische Anforderungen

- Block-Editor: `@dnd-kit` (bereits im Projekt) für Palette→Canvas + Canvas-interne Sortierung
- Rich-Text: **TipTap** mit `starter-kit`, `link`-Extension, `mention`-Extension (für Merge-Tag-Chips)
- Template-Content gespeichert als strukturiertes JSON in `marketing_templates.content`:

```json
{
  "channel": "email",
  "channelSettings": {
    "email": { "subject": "Hallo {{firstName}}!", "preheader": "Dein Tagesmenü…", "fromName": "Kantine", "fromEmail": "no-reply@kantine.de" },
    "push": { "title": "", "body": "", "iconUrl": "", "imageUrl": "", "actionUrl": "" },
    "inapp": { "size": "modal", "position": "center", "showCloseButton": true, "overlayOpacity": 0.4, "multiPage": false }
  },
  "globalStyle": {
    "contentWidth": 600,
    "contentAlign": "center",
    "bgColor": "#f5f5f5",
    "contentBgColor": "#ffffff",
    "fontFamily": "Inter, sans-serif",
    "linkColor": "#3b82f6",
    "padding": 20
  },
  "rows": [
    {
      "id": "row-1",
      "columns": [{ "span": 12, "blocks": [ ] }],
      "style": { "bgColor": null, "bgImage": null, "borderRadius": 0, "padding": [16, 16, 16, 16] },
      "mobile": { "stackOrder": "default", "hideOnMobile": false, "hideOnDesktop": false }
    }
  ]
}
```

- Blocks innerhalb Columns: `{ id, type, props, mobile: { hidden, fontSize, padding, align } }`
- Autosave: `debounce(1000ms)` → `PUT /api/admin/marketing/templates/[id]`
- Versionshistorie: separate Tabelle `marketing_template_versions` (templateId, content JSON, createdAt) — max. 10 Zeilen pro Template (FIFO)
- Bild-Upload: `POST /api/admin/marketing/uploads` → speichert in `/public/uploads/marketing/[orgId]/`
- GIPHY: öffentliche GIPHY-API (kostenloser API-Key), Rate-Limit beachten
- Countdown-Timer: Client-seitig per `setInterval` in der Preview; in exportiertem E-Mail-HTML als statisches Bild via dynamischem Image-Service (da JavaScript in E-Mails nicht unterstützt)
- Spam-Score: serverseitige Prüfung via `POST /api/admin/marketing/spam-check` (nutzt einfache Heuristiken: Schlüsselwörter, Image-zu-Text-Verhältnis, fehlende Plaintext-Alternative)
- Test-E-Mail senden: `POST /api/admin/marketing/test-send` nutzt bestehenden `sendEmail()`-Service (PROJ-9)
- Performance: Editor-Init < 1s, Block-Hinzufügen < 100ms, Autosave nicht blockierend

### Neue API-Routen

```
POST   /api/admin/marketing/uploads              ← Bild-Upload
GET    /api/admin/marketing/uploads              ← Bild-Bibliothek (mit Ordner-Filter)
DELETE /api/admin/marketing/uploads/[id]         ← Bild löschen
GET    /api/admin/marketing/templates/[id]       ← Template laden
PUT    /api/admin/marketing/templates/[id]       ← Autosave + manuelles Speichern
GET    /api/admin/marketing/templates/[id]/versions  ← Versionshistorie
POST   /api/admin/marketing/templates/[id]/versions/restore  ← Version wiederherstellen
POST   /api/admin/marketing/spam-check           ← Spam-Score berechnen
POST   /api/admin/marketing/test-send            ← Test-E-Mail senden
POST   /api/admin/marketing/saved-rows           ← Zeile speichern
GET    /api/admin/marketing/saved-rows           ← Gespeicherte Zeilen laden
DELETE /api/admin/marketing/saved-rows/[id]      ← Gespeicherte Zeile löschen
```

### Editor-Seite

```
app/admin/marketing/templates/[id]/editor/page.tsx
```

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (wird wiederverwendet)

| Was | Wo im Projekt | Nutzung für PROJ-8 |
|-----|--------------|---------------------|
| Drag & Drop Engine | `@dnd-kit/core`, `@dnd-kit/sortable` | Blöcke + Zeilen ziehen, sortieren |
| D&D Blaupause | `components/menu/DraggableDish.tsx` | Basis für DraggableBlock |
| Admin-Layout | `components/admin/AdminShell.tsx` | Editor-Seite im Admin-Bereich |
| E-Mail-Service | `lib/email-service.ts` → Resend | Test-E-Mail senden |
| Dropdown | `components/ui/dropdown-menu.tsx` | Merge-Tag-Auswahl, Kanalauswahl |
| Tooltip | `components/ui/tooltip.tsx` | Hover-Erklärungen |
| Input / Label | `components/ui/input.tsx` | Properties-Panel-Felder |
| Tabs | `components/ui/tabs.tsx` | Preview-Toggle, Palette-Tabs |
| Org-Primärfarbe | Session/Org-Daten | Default-Primärfarbe im Editor |
| Separator | `components/ui/separator.tsx` | Trennlinien im Properties-Panel |

### Neue Packages

| Package | Zweck |
|---------|-------|
| `@tiptap/react` | Rich-Text-Editor-Core |
| `@tiptap/starter-kit` | Fett, kursiv, Listen, Links |
| `@tiptap/extension-link` | Link-Support |
| `@tiptap/extension-placeholder` | Placeholder-Text |
| `@tiptap/extension-mention` | Merge-Tag-Chips ({{firstName}} als visuelles Chip) |
| `react-colorful` | Color-Picker-Komponente (leichtgewichtig) |

### Component-Baum (vereinfacht)

```
EditorPage  (hält gesamten Editor-State)
│
├── EditorTopbar
│   ├── BackButton (mit Ungespeichert-Warnung)
│   ├── TemplateNameInput (inline editierbar)
│   ├── ChannelBadge
│   ├── AutosaveStatus
│   ├── EyeToggle (Sichtbarkeit hidden-Blöcke)
│   ├── PreviewToggle [Desktop | Mobile]
│   ├── TestSendButton
│   ├── SpamScoreIndicator (nur E-Mail)
│   ├── AccessibilityChecker
│   ├── VersionHistoryButton
│   └── SaveButton + SaveAndCloseButton
│
├── EditorSidebar (links, ~250px)
│   └── Tabs: [Blöcke] [Zeilen] [Einstellungen] [Kanal]
│       ├── BlocksTab
│       │   ├── SearchInput
│       │   ├── Gruppe: Inhalt (Titel, Absatz, Liste, Bild, Video, Button, Social, Menü, Icon, GIF, HTML)
│       │   ├── Gruppe: Layout (Spacer, Trennlinie, Countdown)
│       │   ├── Gruppe: Interaktiv (E-Mail-Capture, Telefon, Dropdown, Radio, Checkbox) — nur In-App
│       │   └── Gruppe: Kantine (Tagesmenü, Coupon)
│       ├── RowsTab
│       │   ├── RowTemplates (1–6 Spalten Vorlagen)
│       │   └── SavedRows (org-weit gespeicherte Zeilen)
│       ├── SettingsTab
│       │   └── GlobalStylePanel (Breite, Farben, Schriften)
│       └── ChannelTab
│           ├── EmailSettings (Betreff, Preheader, From)
│           ├── PushSettings (Titel, Body, Icon, Image, ActionURL)
│           └── InAppSettings (Größe, Position, Close-Button, MultiPage)
│
├── EditorCanvas (Mitte, ~600px fixiert, scrollbar)
│   ├── CanvasBackground (globale Hintergrundfarbe)
│   ├── SortableRowList (@dnd-kit/sortable)
│   │   └── EditorRow (×N)
│   │       ├── RowDragHandle (⠿)
│   │       ├── RowToolbar (hover: Einstellungen, Duplizieren, Als Zeile speichern, Löschen)
│   │       └── ColumnGrid (1–6 Spalten)
│   │           └── EditorColumn (×M)
│   │               ├── SortableBlockList
│   │               │   └── EditorBlock (×K)
│   │               │       ├── BlockDragHandle
│   │               │       ├── BlockRenderer (je nach type)
│   │               │       └── BlockToolbar (hover: Duplizieren, Löschen)
│   │               └── ColumnDropZone (wenn leer)
│   └── CanvasDropZone (wenn komplett leer)
│
└── PropertiesPanel (rechts, ~280px)
    ├── EmptyState: „Element auswählen zum Bearbeiten"
    ├── BlockProperties (wechselt je nach ausgewähltem Block-Typ)
    │   ├── ContentTab (block-spezifische Felder)
    │   ├── StyleTab (Farben, Rahmen, Padding)
    │   └── MobileTab (mobile-spezifische Overrides)
    └── RowProperties (wenn Zeile ausgewählt)
        ├── LayoutTab (Spalten-Konfiguration)
        ├── StyleTab (BG, Rahmen, Padding)
        └── MobileTab (Stack-Order, Visibility)
```

### Undo/Redo (History-Stack)

```
History: [State₀, State₁, …, State_n ← aktuell]  max. 30 Einträge
Strg+Z → currentIndex--
Strg+Y → currentIndex++
Jede Block-Aktion pusht neuen State (Blöcke hinzufügen/löschen/verschieben/Property-Änderung)
Text-Eingaben: debounced (500ms) um History nicht zu überfluten
Autosave greift immer auf aktuellen State zu
History geleert beim Verlassen der Seite
```

### Mobile-Preview-Umsetzung

- Canvas-Wrapper bekommt `max-width: 375px` in Mobile-Modus
- Alle Spalten: `flex-direction: column` in Mobile-Modus (außer `doNotStack: true`)
- `hideOnMobile: true` Blöcke: `display: none` in Mobile-Modus via CSS-Klasse
- Tatsächliches Export-HTML nutzt Media Queries für echte Client-Kompatibilität

---

## Checklist (Requirements Engineer)

- [x] User Stories pro Kanal und Feature-Bereich definiert
- [x] Acceptance Criteria mit vollständiger Block-Tabelle
- [x] Edge Cases dokumentiert (18 Cases)
- [x] Feature-ID beibehalten (PROJ-8)
- [x] Abhängigkeiten beschrieben (PROJ-7, PROJ-9, PROJ-10, PROJ-4e)
- [x] Scope und Out-of-Scope: AMP nicht unterstützt; SMS-Kanal Out-of-Scope (eigenes Feature)
- [ ] User Review: Spec lesen und freigeben
