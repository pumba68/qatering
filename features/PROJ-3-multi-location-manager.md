# PROJ-3: Multi-Location Manager

## Status: 🔵 Planned

## Übersicht

Als Kantinenmanager mit mehreren Locations möchte ich in der Lage sein, unterschiedliche Locations anzulegen, meine Adminsicht zwischen Locations zu wechseln, User auf Locations zu verteilen/zuweisen (mit Berechtigungen) und über mein Dashboard übergreifend oder isoliert pro Location zu reporten.

**Aufteilung in Sub-Features (Single Responsibility):**
- PROJ-3a: Location CRUD
- PROJ-3b: Location-Switcher in Admin-UI
- PROJ-3c: User-Location-Zuordnung mit Berechtigungen
- PROJ-3d: Übergreifendes Manager-Reporting

---

# PROJ-3a: Location CRUD

## User Stories

- Als Kantinenmanager möchte ich **neue Locations anlegen** können (Name, Adresse, Kontaktdaten, Öffnungszeiten) um meine Standorte zu verwalten.
- Als Kantinenmanager möchte ich **bestehende Locations bearbeiten** können um Änderungen (z.B. neue Adresse, Öffnungszeiten) zu pflegen.
- Als Kantinenmanager möchte ich **Locations deaktivieren** können (soft delete) um geschlossene Standorte aus dem aktiven Betrieb zu nehmen ohne Daten zu verlieren.
- Als Kantinenmanager möchte ich **alle Locations meiner Organisation** in einer Übersicht sehen um den Überblick zu behalten.

## Acceptance Criteria

- [ ] Admin kann unter `/admin/locations` eine Liste aller Locations seiner Organisation sehen.
- [ ] Admin kann über einen Button „Neue Location“ ein Formular öffnen und Location anlegen (Pflichtfelder: Name; optional: Adresse, Telefon, E-Mail, Öffnungszeiten).
- [ ] Admin kann eine Location bearbeiten (alle Felder änderbar außer ID).
- [ ] Admin kann eine Location deaktivieren/aktivieren (Toggle „Aktiv“).
- [ ] Deaktivierte Locations werden in Dropdowns (z.B. Schaltzentrale, Bestellungen) ausgeblendet oder separat markiert.
- [ ] Validierung: Name darf nicht leer sein; E-Mail-Format falls angegeben.
- [ ] Erfolgs-/Fehlermeldungen bei Speichern/Löschen.

## Edge Cases

- Was passiert, wenn die letzte Location deaktiviert wird? → Hinweis anzeigen; ggf. Warnung vor Deaktivierung.
- Was passiert mit offenen Bestellungen/Menüs bei deaktivierter Location? → Bestehende Daten bleiben; neue Bestellungen/Menüpflege für diese Location blockieren.
- Duplikat-Namen: Erlauben oder verbieten? → Empfehlung: Erlauben (verschiedene Orte können gleichen Namen haben), ggf. mit Adresse unterscheiden.

## Abhängigkeiten

- Benötigt: Auth (ADMIN/KITCHEN_STAFF/SUPER_ADMIN)
- Vorhanden: `Location`-Modell, `Organization`-Relation, `/api/admin/locations` (GET)

---

# PROJ-3b: Location-Switcher in Admin-UI

## User Stories

- Als Admin möchte ich **zwischen den Locations meiner Organisation wechseln** können um den Kontext meiner Arbeit zu ändern.
- Als Admin möchte ich **klar erkennen, für welche Location ich aktuell arbeite** um Fehlbedienungen zu vermeiden.
- Als Admin möchte ich **schnell die Location wechseln** (z.B. Dropdown/Switcher in Header/Sidebar) ohne die Seite zu verlassen.

## Acceptance Criteria

- [ ] Location-Switcher (Dropdown oder vergleichbar) sichtbar im Admin-Layout (z.B. Header oder Sidebar).
- [ ] Aktive Location wird persistent gespeichert (Session, Cookie oder localStorage) und bleibt nach Reload erhalten.
- [ ] Beim Wechsel der Location: Alle location-sensitiven Bereiche (Bestellungen, Gerichte, Menü, Coupons, etc.) zeigen Daten der gewählten Location.
- [ ] Option „Alle Standorte“ für Bereiche, in denen übergreifende Ansicht sinnvoll ist (z.B. Reporting).
- [ ] Nutzer mit Zugriff auf nur eine Location sehen keinen Switcher oder nur diese eine Option.

## Edge Cases

- Was passiert, wenn die gespeicherte Location deaktiviert wurde? → Fallback auf erste verfügbare Location; Hinweis anzeigen.
- Was passiert, wenn User von einer Location entfernt wird, während er sie ausgewählt hat? → Beim nächsten Request/Reload auf erlaubte Location wechseln.
- Session-Timeout: Gespeicherte Location bleibt erhalten oder wird auf Default zurückgesetzt? → Empfehlung: Beibehalten.

## Abhängigkeiten

- Benötigt: PROJ-3a (oder bestehende Location-Liste), PROJ-3c (User-Location-Zuordnung für „welche Locations darf User sehen?“)
- Vorhanden: `UserLocation`-Relation, Admin-Layout

---

# PROJ-3c: User-Location-Zuordnung

## Entscheidung: Rollenmodell

- **Rollen gelten global** (wie bisher: `User.role` = ADMIN, KITCHEN_STAFF, CUSTOMER, SUPER_ADMIN).
- **User können mehreren Locations zugeordnet sein** über `UserLocation` (ohne eigene Rolle pro Location).
- **CUSTOMER** brauchen **keine** explizite Location-Zuordnung; sie können an allen Locations der Organisation bestellen.
- **SUPER_ADMIN** sieht **alle Organisationen und alle Locations** (plattformweit).

## User Stories

- Als Kantinenmanager möchte ich **Admin-/Küchen-User bestimmten Locations zuweisen** können um den Zugriff zu begrenzen.
- Als Kantinenmanager möchte ich **User von Locations entfernen** können um Zugriff zu entziehen.
- Als Manager möchte ich **mehrere Locations verwalten** können; als Admin nur meine zugewiesenen Locations sehen.
- Als SUPER_ADMIN möchte ich **alle Organisationen und Locations** einsehen und verwalten können.

## Acceptance Criteria

- [ ] Unter `/admin/users` (oder eigener Bereich) kann Manager/Admin **ADMIN/KITCHEN_STAFF-User** Locations zuweisen (UserLocation-Einträge).
- [ ] **CUSTOMER** erhalten keine UserLocation-Zuordnung; sie haben Zugriff auf alle Locations ihrer Organisation (über organizationId).
- [ ] User kann **mehreren Locations** zugewiesen sein; Rolle bleibt global (ein User = eine Rolle).
- [ ] **SUPER_ADMIN** sieht alle Organisationen und alle Locations; Location-Filter/Switcher zeigt organisationsübergreifend (oder pro Organisation konfigurierbar).
- [ ] ADMIN/KITCHEN_STAFF ohne UserLocation-Einträge: Zugriff nur auf Locations ihrer Organisation? → **Definition:** Entweder „keine Location = alle Locations der Org“ oder „mind. eine UserLocation nötig“. (Empfehlung: mind. eine UserLocation für Admin/Küche, sonst kein Admin-Zugriff.)
- [ ] Entfernen einer User-Location-Zuordnung entzieht Zugriff auf diese Location.
- [ ] Validierung: Admin/KITCHEN_STAFF mit 0 Locations → Hinweis oder Zugriff verweigern bis Zuweisung erfolgt.

## Edge Cases

- User wird von letzter Location entfernt → Hinweis vor Entfernung; danach kein Zugriff auf Admin-Bereich (oder Fallback auf „alle Locations der Org“ je nach Definition).
- SUPER_ADMIN wechselt Organisation → Switcher/Context für „aktuelle Organisation“ ggf. nötig.

## Abhängigkeiten

- Benötigt: PROJ-3a, PROJ-3b (Switcher nutzt diese Zuordnung)
- Schema: `UserLocation` bleibt ohne `role`; `User.role` global.

---

# PROJ-3d: Übergreifendes Manager-Reporting

## User Stories

- Als Kantinenmanager möchte ich **alle Locations zusammen** im Dashboard reporten können um die Gesamtperformance zu sehen.
- Als Kantinenmanager möchte ich **eine Location** auswählen können um einen Standort isoliert zu betrachten.
- Als Kantinenmanager möchte ich **mehrere Locations gleichzeitig auswählen** können (z.B. A + B) um Standort-Vergleiche zu machen.
- Als Kantinenmanager möchte ich **KPIs und Charts** (Umsatz, Bestellungen, Top-Gerichte, etc.) nach Location-Filter nutzen können.

## Acceptance Criteria

- [ ] Im Schaltzentrale-Dashboard: Location-Filter mit **„Alle Standorte“**, **Einzelauswahl** (Standort X, Y, …) und **Mehrfachauswahl** (z.B. Standort A + B für Vergleich).
- [ ] Mehrfachauswahl: UI (z.B. Multi-Select, Checkbox-Liste) und API-Parameter `locationIds=id1,id2` (oder wiederholter `locationId`) für Aggregation über gewählte Locations.
- [ ] KPIs (Umsatz, Bestellanzahl, AOV, Stornoquote, aktive Kunden) werden nach gewähltem Filter aggregiert (bei Mehrfachauswahl: Summen/aggregierte Werte der gewählten Locations).
- [ ] Charts (Bestelltrend, Top-Gerichte, Status-Verteilung, Wochentag) zeigen Daten des/der gewählten Location(s).
- [ ] Filter-Einstellung wird während der Session beibehalten (optional: URL-Parameter oder Session).
- [ ] Nutzer mit Zugriff nur auf eine Location sehen automatisch diese; „Alle“ zeigt dann nur diese eine (kein leeres Ergebnis).

## Edge Cases

- „Alle Standorte“ bei 0 Locations → Leere KPIs/Charts mit sinnvoller Meldung („Keine Daten“).
- Sehr viele Locations (z.B. 50+): Mehrfachauswahl als Checkbox-Liste mit Suche oder Multi-Select mit Suche.
- Zeitraum + Location(s): Kombination muss korrekt gefiltert werden.

## Abhängigkeiten

- Benötigt: PROJ-3b (Location-Switcher/Kontext)
- Vorhanden: `/api/admin/analytics` mit `locationId`-Parameter; Schaltzentrale mit Location-Dropdown
- **Erweiterung nötig:** Analytics-API um **Mehrfachauswahl** (`locationIds=id1,id2`) für Standort-Vergleich.

---

## Priorisierung (Vorschlag)

1. **PROJ-3a** – Location CRUD (Basis)
2. **PROJ-3b** – Location-Switcher (UX)
3. **PROJ-3d** – Reporting (teils vorhanden, erweitern)
4. **PROJ-3c** – User-Location mit Berechtigungen (komplexeste Änderung)

---

## Tech-Design (Solution Architect)

### Bestehende Architektur (geprüft)

- **Admin:** Layout mit Sidebar (AppSidebar), Header mit SidebarTrigger; keine eigene Locations-Seite, keine Location-Auswahl im Layout.
- **APIs:** `/api/admin/locations` liefert nur aktive Locations (GET), ohne Filter nach Organisation. Analytics unterstützt `locationId` (einzelne ID oder „all“). Users-API und Organizations-API vorhanden.
- **Daten:** Location, UserLocation, Organization und User mit Rolle sind im Schema vorhanden. Location hat Name, Adresse, Öffnungszeiten, isActive; UserLocation verknüpft User mit Location ohne eigene Rolle.

---

### A) Component-Struktur (UI-Baum)

**PROJ-3a – Location CRUD**

```
Neue Seite: /admin/locations
├── Seitenkopf (Titel „Standorte“, Button „Neue Location“)
├── Standort-Liste (Tabelle oder Karten)
│   ├── Pro Zeile: Name, Adresse, Aktiv-Status, Aktionen (Bearbeiten, Aktiv/Inaktiv)
│   └── Leerer Zustand: „Noch keine Standorte. Erstellen Sie den ersten.“
└── Modal/Dialog „Location anlegen / bearbeiten“
    ├── Felder: Name (Pflicht), Adresse, Telefon, E-Mail, Öffnungszeiten (optional)
    ├── Toggle „Aktiv“
    └── Buttons: Abbrechen, Speichern
```

**PROJ-3b – Location-Switcher**

```
Admin-Layout (bestehend)
├── Header (bestehend: SidebarTrigger, Separator)
│   └── NEU: Location-Switcher (rechts oder neben Separator)
│       ├── Dropdown/Select: „Standort: [Aktueller Name]“ oder „Alle Standorte“
│       └── Liste der für den User sichtbaren Locations (+ Option „Alle“ wo sinnvoll)
├── AppSidebar (unverändert)
└── Content-Bereich (children) – nutzt gewählte Location aus Kontext
```

**PROJ-3c – User-Location-Zuordnung**

```
Bestehende Seite: /admin/users
├── … bestehende Nutzer-Liste, Suche, Rollenfilter …
└── NEU: Bei Bearbeiten eines Users (Modal oder Detail)
    └── Bereich „Standort-Zuordnung“ (nur für ADMIN/KITCHEN_STAFF sichtbar)
        ├── Liste der dem User zugewiesenen Locations (mit Entfernen-Button)
        └── „Standort hinzufügen“: Auswahl aus verfügbaren Locations, bestätigen
```

**PROJ-3d – Reporting Mehrfachauswahl**

```
Bestehende Schaltzentrale: /admin
├── Filter-Zeile (Standort, Zeitraum) – bestehend
│   └── NEU: Standort-Filter von Einzel-Dropdown zu Mehrfachauswahl
│       ├── Option „Alle Standorte“
│       ├── Option „Einzelne auswählen“ → Multi-Select / Checkbox-Liste mit Locations
│       └── Anzeige der gewählten Locations (Chips oder kompakte Liste)
├── KPI-Karten (unverändert, Daten aus erweiterter API)
└── Chart-Bereich (unverändert, Daten aus erweiterter API)
```

---

### B) Daten-Model (konzeptionell)

**Bereits vorhanden (nur Nutzung/Regeln anpassen):**

- **Location:** Eindeutige ID, Name, Adresse, Telefon, E-Mail, Öffnungszeiten (flexibles Format), Arbeitstage, Aktiv-Status, Zuordnung zur Organisation. Keine Schema-Änderung nötig.
- **UserLocation:** Verknüpft User mit Location (User X darf an Location Y arbeiten). Keine Rolle pro Zuordnung; User-Rolle bleibt global.
- **User:** Rolle global (CUSTOMER, KITCHEN_STAFF, ADMIN, SUPER_ADMIN). CUSTOMER brauchen keine UserLocation-Einträge.

**Neue bzw. erweiterte Speicherung:**

- **Aktive Location (Switcher):** Eine ausgewählte Location-ID (oder „alle“) pro Admin-Session. Wird im Frontend gehalten (z. B. Kontext/Provider) und persistent gemacht (localStorage oder Cookie), damit nach Reload die gleiche Auswahl gilt. Keine neue Tabelle.
- **Reporting-Filter:** Die gewählten Location-IDs fürs Dashboard (Einzel oder Mehrfach) können ebenfalls im Frontend/Session gehalten werden; optional URL-Parameter für Teilen oder Bookmark.

**Regeln für Backend:**

- Locations-Liste und -Mutationen immer auf die Organisation des eingeloggten Users beschränken (aus Session/Token). SUPER_ADMIN: optional Organisation aus Kontext oder „alle“.
- UserLocation: nur für ADMIN/KITCHEN_STAFF pflegen; CUSTOMER keine Zuweisung nötig. Zugriff auf Admin-Bereich: User sieht nur Locations, für die er mindestens einen UserLocation-Eintrag hat (oder SUPER_ADMIN sieht alle).

---

### C) Backend / APIs (Überblick)

| Bereich | Bestehend | Erweiterung / Neu |
|--------|-----------|-------------------|
| **Locations** | GET `/api/admin/locations` (alle aktiven) | Filter nach Organisation des Users. Neue Endpunkte: Anlegen (POST), Bearbeiten (PUT/PATCH pro ID), ggf. GET pro ID. Liste optional inkl. inaktive für Admin-Übersicht. |
| **Location-Switcher** | – | Kein eigener Endpunkt. Switcher liest dieselbe Locations-Liste (bereits gefiltert nach Berechtigung). |
| **User-Locations** | User-API, UserLocation in DB | User-API erweitern: Beim User Objekt die zugewiesenen Locations mitliefern. Neuer Endpunkt oder Erweiterung: „Locations für User setzen“ (z. B. PUT User X, Body: Liste Location-IDs). |
| **Analytics** | GET mit `locationId` (eine ID oder „all“) | Parameter für Mehrfachauswahl: z. B. `locationIds=id1,id2`. Aggregation (KPIs, Charts) über alle angegebenen Locations. Zugriff: nur Locations, die der User sehen darf. |

Keine neuen Datenbank-Tabellen; nur Nutzung und API-Logik anpassen.

---

### D) Tech-Entscheidungen (Begründung)

| Entscheidung | Begründung |
|--------------|------------|
| **Location-Kontext im Frontend (Provider/Context)** | Die gewählte Location muss in vielen Admin-Seiten (Bestellungen, Menü, Coupons, …) genutzt werden. Ein zentraler Kontext vermeidet wiederholtes Durchreichen und bleibt für PM/UX nachvollziehbar. |
| **Persistenz der Switcher-Auswahl (localStorage/Cookie)** | User erwarten, dass „mein letzter Standort“ nach Reload erhalten bleibt. Kein Server-Session-Zwang nötig; Client-Speicher reicht. |
| **Locations-API nach Organisation filtern** | Multi-Tenant: Jede Organisation sieht nur eigene Locations. Session liefert Organisation (oder SUPER_ADMIN-Sonderfall). |
| **Analytics Mehrfachauswahl über einen Parameter** | Ein Parameter `locationIds` (mehrere IDs) ist einfach zu dokumentieren und von bestehenden Clients erweiterbar. Keine zweite „Reporting-Session“ nötig. |
| **UserLocation ohne Rolle** | Rollen bleiben global; UserLocation nur „darf an diesen Standorten arbeiten“. Einfacheres Modell, weniger Abweichungen vom bestehenden Schema. |
| **SUPER_ADMIN: alle Organisationen** | Klar definierter Sonderfall: eigene UI/Logik (z. B. Organisations-Switcher vor Location-Switcher) oder ein „Alle“-Modus in bestehenden Listen. Kein separates Datenmodell. |

---

### E) Abhängigkeiten (Packages)

- **Keine neuen Frontend-Packages zwingend nötig.** Multi-Select für Locations kann mit bestehenden UI-Bausteinen (Select, Checkbox-Liste, Combobox) umgesetzt werden.
- Falls gewünscht: eine kleine Library für Multi-Select/Dropdown mit Suche bei sehr vielen Locations (z. B. 50+). Kann in einer späteren Iteration ergänzt werden.

---

### F) Implementierungs-Reihenfolge (für Entwickler)

1. **PROJ-3a:** Locations-API erweitern (Filter Organisation, POST/PUT, inaktive optional). Neue Seite `/admin/locations` mit Liste und Modal Anlegen/Bearbeiten.
2. **PROJ-3b:** Location-Context/Provider anlegen; Switcher-Komponente im Admin-Header; alle location-abhängigen Seiten auf Kontext umstellen; Persistenz der Auswahl.
3. **PROJ-3d:** Analytics-API um `locationIds` (Mehrfach) erweitern; Schaltzentrale-Filter auf Mehrfachauswahl umbauen; KPIs/Charts mit neuer API.
4. **PROJ-3c:** User-API um UserLocation-Lesen/Schreiben erweitern; Nutzer-Seite um Bereich „Standort-Zuordnung“ ergänzen; Zugriffslogik (welche Locations darf User sehen) in Locations-API und Switcher einbauen; SUPER_ADMIN-Sonderfall.

---

## Entscheidungen (geklärt)

| Punkt | Entscheidung |
|-------|---------------|
| **Rollenmodell** | Rollen gelten überall gleich (`User.role` global). User können mehreren Locations zugehören (UserLocation ohne eigene Rolle). |
| **Kunden (CUSTOMER)** | Kunden müssen **keine** Location explizit zugewiesen bekommen; sie können an allen Locations der Organisation bestellen. |
| **SUPER_ADMIN** | SUPER_ADMIN sieht **alle Organisationen und alle Locations** (plattformweit). |
| **Reporting Mehrfachauswahl** | **Ja:** Mehrfachauswahl (z.B. Location A + B) für Standort-Vergleich im Reporting gewünscht; API und UI entsprechend erweitern. |
