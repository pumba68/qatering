# PROJ-10: In-App Banner, Popup & Push-Nachrichten Integration

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-7 (Marketing Template Library) – Template muss angelegt sein
- Benötigt: PROJ-8 (Block-Editor) – Template-Inhalt wird dort erstellt
- Benötigt: PROJ-4 (Kundensegmente & In-App Messages) – Segmentzuordnung
- Erweitert: PROJ-2 (Promotion-Banner) – Promotion-Banner-Typ nutzt den Block-Editor
- Integriert: Kunden-App (Menü-Seite, Dashboard, Wallet-Seite)

## Übersicht
Dieses Feature verbindet im Block-Editor erstellte Templates mit den Ausgabekanälen In-App Banner, In-App Popup und Push-Benachrichtigung. Admin kann ein Template einem Segment zuweisen, Anzeigeort und Zeitraum festlegen. Für Promotion-Banner ersetzt der Block-Editor die manuelle Dateneingabe aus PROJ-2.

---

## User Stories

- Als Admin möchte ich ein im Block-Editor gestaltetes Banner einem Kundensegment und einer App-Seite zuweisen, damit das Banner automatisch beim richtigen Nutzer erscheint.
- Als Admin möchte ich wählen ob ein Template als Banner (eingebettet in die Seite) oder als Popup (Modal) angezeigt wird, damit ich passende Formate für unterschiedliche Inhalte nutzen kann.
- Als Admin möchte ich Anzeigedatum und Enddatum festlegen, damit Banner nur im richtigen Zeitraum sichtbar sind.
- Als Admin möchte ich eine Push-Benachrichtigung aus einem Template heraus erstellen und an ein Segment senden, damit Kunden auch außerhalb der App erreicht werden.
- Als Admin möchte ich einen Promotion-Banner (Motto-Woche) im Block-Editor gestalten statt manuell Felder auszufüllen, damit das Ergebnis visuell ansprechender ist.
- Als Kunde möchte ich einen Banner/Popup maximal einmal pro Zeitraum sehen, damit ich nicht durch wiederholte Nachrichten gestört werde.

---

## Acceptance Criteria

### In-App Banner Zuweisung
- [ ] Nach Erstellen eines In-App-Banner-Templates in PROJ-7/8: „Veröffentlichen"-Flow verfügbar
- [ ] Konfiguration: Ziel-Segment, Anzeigeort (`menu_top | dashboard_hero | wallet_top | menu_sidebar`), Anzeigetyp (`BANNER | POPUP`), Startdatum, Enddatum (optional)
- [ ] Ein aktiver Banner pro Anzeigeort gleichzeitig pro Segment (bei Konflikt: Warnung + Priorität wählbar)
- [ ] Banner werden in der bestehenden `InAppMessage`-Tabelle (PROJ-4) gespeichert, mit Referenz auf `marketingTemplateId`
- [ ] In der Kunden-App: Template-JSON wird server-seitig zu HTML gerendert und im zugewiesenen Slot angezeigt
- [ ] Kunden können Banner/Popup mit ✕ schließen → wird in `InAppMessageRead` gespeichert → nicht wieder angezeigt

### Popup-spezifisch
- [ ] Popup wird einmalig pro Session gezeigt (nicht bei jedem Seitenaufruf)
- [ ] Popup hat Overlay-Background + Schließen-Button
- [ ] Optionaler „Nicht mehr anzeigen"-Checkbox im Popup

### Push-Benachrichtigungen
- [ ] Push-Template hat eingeschränkte Block-Auswahl: nur Text (max. 2 Zeilen Titel + max. 3 Zeilen Body) + optionaler Deep-Link (in-App-Seite)
- [ ] „Push senden"-Flow: Segment wählen → Versandzeitpunkt → Bestätigung
- [ ] Push wird in Tabelle `push_notifications` protokolliert (Empfänger, Status, Zeitstempel)
- [ ] Hinweis im UI: „Push-Versand erfordert Browser-Benachrichtigungserlaubnis der Nutzer"
- [ ] Nutzer ohne Push-Erlaubnis werden aus Versandliste ausgeschlossen (kein Fehler, nur Info)

### Promotion-Banner (Erweiterung PROJ-2)
- [ ] Beim Anlegen eines Promotion-Banners (PROJ-2): neue Option „Mit Block-Editor gestalten"
- [ ] Block-Editor öffnet sich mit auf Banner-Format optimierter Canvas (fixe Breite, eingeschränkte Block-Auswahl: Headline, Bild, Text, Button)
- [ ] Bestehende PROJ-2 Promotion-Banner bleiben unverändert (keine Breaking Change)
- [ ] Neuer Promotion-Banner-Typ wird in `PromotionBanner.templateId` referenziert (nullable Migration)

### Übersicht & Monitoring
- [ ] Seite `/admin/marketing/inapp` listet alle aktiven + geplanten In-App Nachrichten
- [ ] Spalten: Name, Typ (Banner/Popup), Segment, Anzeigeort, Zeitraum, Gesehen-von (Anzahl unique User)
- [ ] Aktive Banner können sofort deaktiviert werden

---

## Edge Cases

- **Zwei aktive Banner für denselben Slot + Segment:** Warnung beim Aktivieren. Älterer Banner wird deaktiviert oder Priorität manuell wählbar.
- **Segment hat keine Mitglieder:** Banner wird angelegt, aber nie angezeigt – Hinweis in UI.
- **Template-Inhalt zu groß für Slot:** Slot-spezifische Max-Höhe; Overflow wird gescrollt (Banner) oder abgeschnitten (Popup warnt Admin in Preview).
- **Nutzer lehnt Push-Benachrichtigungen ab:** Nutzer erscheint nicht in Versandliste; kein Fehler.
- **Template wird nach Veröffentlichung eines Banners bearbeitet:** Änderungen am Template erzeugen einen neuen Content-Snapshot; bestehende aktive Zuweisungen nutzen den alten Snapshot bis manuell neu aktiviert.
- **Enddatum liegt in der Vergangenheit beim Anlegen:** Validierungsfehler „Enddatum muss in der Zukunft liegen".
- **Block-Editor für Push mit zu viel Text:** Zeichenlimit-Validierung direkt im Editor-Block (Titel: max 65 Zeichen, Body: max 200 Zeichen).

---

---

## Tech-Design (Solution Architect)

### Was bereits existiert (wird wiederverwendet)

| Baustein | Wo | Was es tut |
|---|---|---|
| `InAppMessage`-Tabelle | Datenbank | Speichert Banner & Popups mit Segment, Zeitraum, Anzeigeort – bereits vollständig |
| `InAppMessageRead`-Tabelle | Datenbank | Merkt sich, welcher Nutzer welche Nachricht gesehen hat |
| `PromotionBanner`-Tabelle | Datenbank | Motto-Wochen-Banner, Karussell, Coupon-Verknüpfung |
| `/api/admin/marketing/in-app-messages` | Backend | Admin-API: In-App Nachrichten anlegen, bearbeiten, löschen |
| `/api/in-app-messages` | Backend | Kunden-API: aktive Nachrichten für den eingeloggten Nutzer abrufen |
| `useInAppMessages` Hook | Frontend | Holt aktive Nachrichten je nach Typ/Slot |
| `MarketingBannerArea` | Frontend | Zeigt Banner-Nachrichten auf einer Seite an |
| `MarketingSlotArea` | Frontend | Zeigt Nachrichten für einen dynamischen Slot an |
| `MarketingPopupContainer` | Frontend | Zeigt Popup-Nachrichten als Modal |
| `marketing_templates`-Tabelle | Datenbank | Speichert Block-Editor-Templates (PROJ-7/8) |

---

### Was neu gebaut wird

#### A) Komponenten-Struktur

```
Template Editor (PROJ-8) — neuer "Veröffentlichen"-Button
└── Veröffentlichen-Dialog (Sheet/Modal)
    ├── Schritt 1: Kanal wählen
    │   ├── In-App Banner / Popup
    │   ├── Push-Benachrichtigung
    │   └── Promotion-Banner (nur bei Typ PROMOTION_BANNER)
    ├── Schritt 2: Kanal-Konfiguration
    │   ├── [In-App] Segment wählen, Anzeigeort, Typ (Banner/Popup), Zeitraum
    │   ├── [Push] Segment wählen, Titel, Body (max. 200 Zeichen), Versandzeitpunkt
    │   └── [Promo] Motto-Woche wählen, Karussell-Position
    └── Schritt 3: Bestätigung + Vorschau

Neue Seite: /admin/marketing/inapp (Monitoring)
├── Filter-Leiste: Typ, Segment, Status
├── Tabelle: aktive + geplante In-App Nachrichten
│   ├── Spalten: Name, Typ, Segment, Anzeigeort, Zeitraum, Gesehen-von
│   └── Aktionen: Deaktivieren, Bearbeiten, Löschen
└── Leerzustand

Neue Seite: /admin/marketing/push (Push-Nachrichten)
├── Tabelle: gesendete + geplante Push-Nachrichten
│   └── Spalten: Titel, Segment, Status, Empfänger, Gesendet-am
└── "Push senden"-Button → öffnet Veröffentlichen-Dialog

Kunden-App (bestehende Seiten, minimale Änderung)
├── MarketingBannerArea — rendert jetzt Template-JSON statt reinen Text
├── MarketingSlotArea — rendert jetzt Template-JSON statt reinen Text
└── MarketingPopupContainer — rendert jetzt Template-JSON statt reinen Text
```

---

#### B) Datenmodell

**Erweiterung bestehender Tabellen (rückwärtskompatibel, alle neuen Spalten nullable):**

```
InAppMessage — 2 neue Felder:
├── marketingTemplateId  → Verweis auf das Template (optional)
└── templateSnapshot     → Einmaliger Inhaltssnapshot beim Aktivieren
    (schützt vor nachträglichen Template-Änderungen)

PromotionBanner — 2 neue Felder:
├── marketingTemplateId  → Verweis auf Block-Editor-Template (optional)
└── templateSnapshot     → Inhaltssnapshot bei Zuweisung zur Motto-Woche
```

**2 neue Tabellen:**

```
push_notifications — eine Push-Kampagne
├── ID, Organisation, Template-Verweis, Snapshot
├── Segment, Status (DRAFT / SCHEDULED / SENT / FAILED)
├── Geplanter Versandzeitpunkt, tatsächlicher Versandzeitpunkt
└── Anzahl Empfänger gesamt

push_notification_logs — Versandprotokoll pro Nutzer
├── Verweis auf push_notification
├── Nutzer-ID
├── Status (SENT / DELIVERED / FAILED)
└── Zeitstempel
```

**Warum Snapshot?**
Wenn ein Admin das Template nach der Veröffentlichung im Editor ändert, soll die bereits laufende Kampagne unverändert bleiben. Der Snapshot friert den Inhalt zum Aktivierungszeitpunkt ein.

---

#### C) Backend-Änderungen

```
Bestehende API erweitern:
└── POST /api/admin/marketing/in-app-messages
    → Nimmt jetzt wahlweise templateId (neu) ODER body/title (bisherig) entgegen
    → Beim Speichern: Snapshot des Template-Inhalts wird automatisch erzeugt

Neue APIs:
├── POST /api/admin/marketing/push/send
│   → Push-Kampagne anlegen + sofort oder geplant versenden
│   → Nutzt Web Push API (VAPID) für Browser-Benachrichtigungen
├── GET  /api/admin/marketing/push
│   → Liste aller Push-Kampagnen der Organisation
└── GET  /api/admin/marketing/push/[id]/logs
    → Detaillierte Versandprotokolle einer Kampagne

Neue Server-Hilfsfunktion (geteilt mit PROJ-9):
└── renderTemplateToHtml(templateContent, personalisierungsDaten)
    → Wandelt Block-Editor-JSON in HTML um
    → Ersetzt Platzhalter wie {{Vorname}}, {{Standort}}
    → Wird von Kunden-API aufgerufen bevor Nachricht ausgeliefert wird
```

---

#### D) Frontend-Änderungen in der Kunden-App

Die bestehenden Komponenten (`MarketingBannerArea`, `MarketingSlotArea`, `MarketingPopupContainer`) werden minimal angepasst:
- Bisher: `body`-Feld wird als einfacher Text angezeigt
- Neu: wenn `templateSnapshot` vorhanden → HTML wird serverseitig gerendert und sicher als HTML angezeigt
- Bestehende Banner ohne Template funktionieren weiterhin unverändert

---

#### E) Tech-Entscheidungen

| Entscheidung | Warum |
|---|---|
| **Snapshot-Prinzip** statt Live-Template-Referenz | Template-Änderungen brechen keine laufenden Kampagnen. Bewährtes Muster bei E-Mail-Systemen. |
| **Bestehende `InAppMessage`-Tabelle erweitern** statt neue Tabelle | Tabelle ist bereits vollständig (Segment, Zeitraum, Anzeigeort, Read-Tracking). Neue Spalten sind nullable → kein Breaking Change. |
| **Web Push API (VAPID)** für Push-Benachrichtigungen | Standard-Browser-API, keine externe Drittanbieter-Abhängigkeit (kein Firebase/OneSignal). Nutzt bestehende Browser-Subscription. |
| **Serverseitiges HTML-Rendering** des Templates | Verhindert XSS in der Kunden-App. Template-JSON wird nie direkt im Browser ausgeführt. |
| **Neue Seiten** `/admin/marketing/inapp` und `/admin/marketing/push` | Übersichtlicher als alles in bestehende Kampagnen-Seite zu quetschen. Klare Trennung der Kanäle. |

---

#### F) Neue Pakete

```
web-push   → Server-seitiger VAPID Push-Versand (Node.js)
```

Alle anderen benötigten Bausteine (Block-Editor, DnD, Shadcn UI, Prisma) sind bereits installiert.

---

#### G) Neue Umgebungsvariablen

```
VAPID_PUBLIC_KEY    → Öffentlicher Schlüssel für Browser-Push
VAPID_PRIVATE_KEY   → Privater Schlüssel (nur serverseitig)
VAPID_SUBJECT       → E-Mail-Adresse oder URL des Betreibers
```

---

## Technische Anforderungen

- Erweiterung `InAppMessage`: neue Spalte `marketingTemplateId` (nullable FK auf `marketing_templates`), `templateSnapshot JSON` (Snapshot bei Aktivierung)
- Neue Tabelle `push_notifications` (id, organizationId, templateId, templateSnapshot, segmentId, status, scheduledAt, sentAt, totalRecipients, createdAt)
- Neue Tabelle `push_notification_logs` (id, pushNotificationId, userId, status [SENT|DELIVERED|FAILED], sentAt)
- Template-JSON zu HTML Rendering: gemeinsame Server-Util-Funktion `renderTemplateToHtml(content: JSON, variables: Record)` – geteilt mit PROJ-9
- Push-Versand: Web Push API (VAPID) – ENV-Variablen `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `PromotionBanner`: neue nullable Spalte `marketingTemplateId` + `templateSnapshot JSON` (Migration mit Default NULL)
- API-Routes:
  - `POST /api/admin/marketing/inapp` – Banner/Popup aktivieren
  - `POST /api/admin/marketing/push/send` – Push senden
  - `GET /api/marketing/inapp/[slot]` – Client-seitig: aktive Nachricht für Slot abrufen
