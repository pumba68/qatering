# PROJ-4: Kundensegmente & Marketing-Automation

## Status: 🔵 Planned

## Konzept

### Vision
Als **Kantinenmanager und Betreiber** soll die Plattform ermöglichen, **Kundensegmente** anhand von Kundendaten zu definieren und für diese Segmente **gezielt zu kommunizieren** (E-Mail, In-App) sowie **Incentives** (Rabatte, Aktionen) auszuspielen. Über **Marketing-Automation** (Workflows, Trigger, Abläufe) sollen wiederkehrende oder ereignisgesteuerte Aktionen ohne manuellen Eingriff laufen.

### Ziele
- **Segmentierung**: Kunden nach definierbaren Attributen gruppieren (z. B. Neukunden, Stammkunden, inaktive Kunden, Mitarbeiter eines bestimmten Unternehmens).
- **Ausspielung**: Pro Segment E-Mails versenden und/oder In-App-Nachrichten bzw. Incentives anzeigen (wenn Kunde eingeloggt ist).
- **Automation**: Workflows definieren (z. B. „Wenn Kunde zu Segment X gehört → Aktion Y auslösen“), die zeit- oder ereignisgesteuert laufen.

### Scope-Abgrenzung
- **In Scope**: Segment-Definition durch Manager, Ausspielkanäle E-Mail + In-App/Incentives, einfache bis mittelkomplexe Workflows (Trigger → Aktion).
- **Out of Scope** (kann später kommen): A/B-Tests, detaillierte Kampagnen-Analytics (Öffnungsraten, Klicks), externe Marketing-Tools-Anbindung (z. B. Mailchimp), DSGVO-Feintuning (Einwilligungsverwaltung pro Kanal).

### Aufteilung in Sub-Features (Single Responsibility)

| ID       | Name                         | Kurzbeschreibung |
|----------|------------------------------|-------------------|
| PROJ-4a  | Kundensegmente (CRUD)        | Segmente anlegen, bearbeiten, löschen; Namen, Beschreibung, optional Zielgruppen-Regeln. |
| PROJ-4b  | Segment-Zielgruppen          | Regeln/Attribute definieren, die bestimmen, welche User zu einem Segment gehören; Berechnung/Preview. |
| PROJ-4c  | Ausspielkanäle (E-Mail, In-App) | E-Mails an Segment versenden; In-App-Nachrichten und Incentives für eingeloggte Kunden eines Segments. |
| PROJ-4d  | Marketing-Automation (Workflows) | Workflows definieren: Trigger (zeit-/ereignisbasiert) + Aktion (E-Mail, In-App, Incentive). |

---

# PROJ-4a: Kundensegmente (CRUD)

## User Stories

- Als Kantinenmanager möchte ich **Kundensegmente anlegen** können (Name, optionale Beschreibung) um Zielgruppen für Kampagnen zu definieren.
- Als Kantinenmanager möchte ich **bestehende Segmente bearbeiten** können (Name, Beschreibung, Regeln) um sie anzupassen.
- Als Kantinenmanager möchte ich **Segmente löschen** können um veraltete Zielgruppen zu entfernen.
- Als Kantinenmanager möchte ich **alle Segmente meiner Organisation** in einer Übersicht sehen um den Überblick zu behalten.
- Als Kantinenmanager möchte ich **eine Vorschau sehen, wie viele Kunden** ein Segment aktuell umfasst (ohne personenbezogene Details optional einblendbar).

## Acceptance Criteria

- [ ] Admin/Manager kann unter einer Admin-Route (z. B. `/admin/segments`) eine Liste aller Segmente seiner Organisation sehen.
- [ ] Admin kann ein neues Segment anlegen: Pflichtfeld Name; optional Beschreibung.
- [ ] Admin kann ein Segment bearbeiten (Name, Beschreibung); Regeln/Zielgruppen-Definition siehe PROJ-4b.
- [ ] Admin kann ein Segment löschen (mit Bestätigung); bestehende Workflows, die dieses Segment nutzen, müssen darauf hingewiesen oder deaktiviert werden.
- [ ] Pro Segment wird angezeigt, wie viele Nutzer aktuell zur Zielgruppe gehören („X Kunden“, Berechnung siehe PROJ-4b).
- [ ] Segmente sind organisationsbezogen (nur eigene Organisation; SUPER_ADMIN optional alle).
- [ ] Erfolgs-/Fehlermeldungen bei Speichern und Löschen.

## Edge Cases

- Was passiert beim Löschen eines Segments, das in aktiven Workflows verwendet wird? → Warnung anzeigen; Workflows auflisten; Löschen nur nach Bestätigung oder zuerst Workflows anpassen.
- Duplikat-Namen: Erlauben oder eindeutig pro Organisation? → Empfehlung: Eindeutiger Name pro Organisation, um Verwechslungen zu vermeiden.
- Segment ohne Regeln: 0 Kunden oder „alle Kunden der Organisation“? → Definition: Ohne Regeln = 0 Kunden (Segment ist leer bis Regeln definiert sind).

## Abhängigkeiten

- Benötigt: Auth (ADMIN, SUPER_ADMIN), Organisation/Kontext (organizationId).
- Vorhanden: `User` mit `organizationId`, `Order`, `CompanyEmployee`, etc. für spätere Regeln (PROJ-4b).

---

# PROJ-4b: Segment-Zielgruppen (Regeln & Attribute)

## Konzept

Ein Segment wird durch **Regeln** definiert. Eine Regel bezieht sich auf **Attribute** des Kunden bzw. seines Verhaltens. Beispiele:
- **Attribut**: Registrierungsdatum → Regel: „Registriert in den letzten 30 Tagen“ (Neukunden).
- **Attribut**: Anzahl Bestellungen → Regel: „Mindestens 5 Bestellungen“ (Stammkunden).
- **Attribut**: Letzte Bestellung → Regel: „Keine Bestellung seit mehr als 28 Tagen“ (Inaktive).
- **Attribut**: Zugehörigkeit Unternehmen → Regel: „Mitarbeiter von Firma X“ (über CompanyEmployee).
- **Attribut**: Standort-Nutzung → Regel: „Hat mindestens einmal an Standort Y bestellt“.
- **Attribut**: Rolle → Regel: „Rolle = CUSTOMER“ (für reine Kunden-Segmente).

Die konkrete Auswahl der **implementierten Attribute** und **Operatoren** (gleich, in den letzten X Tagen, größer/kleiner als, in Liste, etc.) wird technisch in PROJ-4b umgesetzt; hier werden die fachlichen Anforderungen beschrieben.

## User Stories

- Als Kantinenmanager möchte ich **für ein Segment Regeln definieren** können (z. B. „Kunde hat in den letzten 30 Tagen bestellt“) um die Zielgruppe präzise einzugrenzen.
- Als Kantinenmanager möchte ich **mehrere Regeln kombinieren** können (UND/ODER) um z. B. „Stammkunden UND Standort Berlin“ abzubilden.
- Als Kantinenmanager möchte ich **eine Vorschau der Zielgruppengröße** sehen (Anzahl Kunden), die das Segment aktuell erfüllen.
- Als Kantinenmanager möchte ich **optional eine Liste der zugehörigen Kunden** einsehen können (z. B. E-Mail, Name, ohne sensible Details) um die Segmentierung zu prüfen.

## Acceptance Criteria

- [ ] Pro Segment können eine oder mehrere **Regeln** definiert werden; jede Regel bezieht sich auf ein **Attribut** (z. B. Registrierungsdatum, Anzahl Bestellungen, letzte Bestellung, Unternehmen, Standort, Rolle).
- [ ] Pro Regel sind **Operatoren** wählbar (z. B. „in den letzten X Tagen“, „mindestens X“, „gleich“, „in Liste“) und **Werte** konfigurierbar.
- [ ] Regeln können mit **UND** bzw. **ODER** verknüpft werden (mindestens UND; ODER optional für MVP).
- [ ] Beim Speichern des Segments wird die **Zielgruppengröße** (Anzahl User) berechnet und angezeigt.
- [ ] Optional: Admin kann eine **Liste der zum Segment gehörenden User** einsehen (z. B. E-Mail, Name; DSGVO-konform, nur wenn berechtigt).
- [ ] Änderungen an Kundendaten (neue Bestellung, neuer User) führen dazu, dass die Segment-Zugehörigkeit bei nächster Abfrage/Berechnung aktualisiert wird (keine Echtzeit-Pflicht; Berechnung on-demand oder per geplantem Job ausreichend).

## Edge Cases

- Keine Regeln definiert → Segment umfasst 0 Kunden (siehe PROJ-4a).
- Regel mit „in den letzten X Tagen“: Zeitzone? → Einheitlich UTC oder Server-Zeitzone; in Spec dokumentieren.
- Sehr große Organisation: Berechnung der Zielgruppengröße kann langsam sein → Timeout/Limit; Hinweis „Berechnung kann einige Sekunden dauern“ oder asynchrone Berechnung.
- User gehört zu mehreren Segmenten → erlaubt; ein User kann in beliebig vielen Segmenten sein.

## Abhängigkeiten

- Benötigt: PROJ-4a (Segmente CRUD).
- Vorhanden: `User`, `Order`, `CompanyEmployee`, `Location` etc. für Attribut-Quellen.

---

# PROJ-4c: Ausspielkanäle (E-Mail, In-App, Incentives)

## Konzept

- **E-Mail**: Versand von E-Mails an alle (oder eine Teilmenge) der Nutzer eines Segments. Inhalt: Freitext/Betreff oder vordefinierte Vorlagen (z. B. Willkommens-Mail, Aktion der Woche).
- **In-App**: Nachricht oder Hinweis, die der Kunde sieht, **wenn er eingeloggt ist** (z. B. Banner auf der Menü-Seite, Hinweis im Dashboard, „Nachricht der Woche“).
- **Incentives**: Besondere Anreize pro Segment, z. B. persönlicher Gutschein-Code, Bonus-Guthaben, oder ein „nur für Sie“-Rabatt im Speiseplan. Diese können per E-Mail angekündigt und in der App eingelöst werden.

## User Stories

- Als Kantinenmanager möchte ich **eine E-Mail an ein Segment senden** können (Betreff, Inhalt oder Vorlage) um z. B. Aktionen oder Informationen zu kommunizieren.
- Als Kantinenmanager möchte ich **eine In-App-Nachricht für ein Segment** definieren können (Text, optional Link), die eingeloggte Kunden dieses Segments beim nächsten Besuch sehen (z. B. Banner oder Hinweis auf der Menü-Seite).
- Als Kantinenmanager möchte ich **Incentives für ein Segment** ausspielen können (z. B. persönlicher Coupon, Bonus-Guthaben), die der Kunde per E-Mail erhält und/oder in der App sieht und einlöst.
- Als Kunde möchte ich **relevante Nachrichten und Angebote** sehen (wenn ich eingeloggt bin), die für meine Zielgruppe gedacht sind, ohne von irrelevanten Massen-Mails überflutet zu werden.

## Acceptance Criteria

- [ ] Admin kann unter einer Admin-Route (z. B. `/admin/campaigns` oder integriert in Segmente) **„E-Mail an Segment senden“** auswählen: Segment wählen, Betreff und Inhalt (oder Vorlage) eingeben, Versand bestätigen.
- [ ] E-Mail-Versand erfolgt an alle im Segment (mit gültiger E-Mail); Fehler (z. B. Bounce) werden geloggt, ggf. Retry oder manueller Hinweis.
- [ ] Admin kann **In-App-Nachrichten** pro Segment anlegen: Text, optional Link, Anzeigeort (z. B. Menü-Seite). Nur Nutzer, die dem Segment angehören und eingeloggt sind, sehen die Nachricht.
- [ ] In-App-Nachricht kann zeitlich begrenzt werden (Start-/Enddatum) und einmal „gelesen“ als gelesen markiert werden (optional), sodass sie nicht dauerhaft angezeigt wird.
- [ ] Admin kann **Incentives** zuweisen: z. B. Coupon-Code oder Guthaben-Aktion, die nur für ein bestimmtes Segment sichtbar/einlösbar ist; Ausspielung per E-Mail und/oder In-App.
- [ ] DSGVO: Opt-in für Marketing-E-Mails wird berücksichtigt (Attribut am User, z. B. `marketingEmailConsent`); nur Nutzer mit Einwilligung erhalten Marketing-Mails. Transaktionale Mails (Bestellbestätigung etc.) bleiben unberührt.

## Edge Cases

- Segment mit 0 Kunden: E-Mail-Versand deaktivieren oder Warnung „Keine Empfänger“.
- E-Mail-Dienst (z. B. SMTP, SendGrid) nicht erreichbar: Fehlermeldung, keine stillen Fehler; ggf. Queue für erneuten Versuch.
- In-App-Nachricht: Was wenn User zu mehreren Segmenten mit Nachrichten gehört? → Priorität/Reihenfolge definieren (z. B. neueste zuerst) oder alle anzeigen (kurz nacheinander).
- Incentive nur einmal pro User einlösbar: technisch über bestehendes Coupon-System (maxUsesPerUser) oder neues Feld „einmalig pro User/Segment“.

## Abhängigkeiten

- Benötigt: PROJ-4a, PROJ-4b (Segmente und Zielgruppen).
- Vorhanden: E-Mail-Versand (falls vorhanden), Coupon-System, Auth/Session für In-App-Erkennung.

---

# PROJ-4c-Erweiterung: Aktive Kundenausspielung (Popup, In-App, dynamische Slots)

## Konzept

Kampagnen und Marketing-Aktionen sollen **aktiv vor dem Kunden ausgeliefert** werden – nicht nur konfiguriert, sondern sichtbar und steuerbar. Drei Darstellungsformen:

- **Popup/Modal:** Nachricht erscheint als Overlay (z. B. nach Login oder beim ersten Besuch einer Seite), schließbar; optional „nicht wieder anzeigen“.
- **In-App-Nachricht (Banner/Card):** Klassische Einblendung als Banner oder Karte an fester Stelle auf der Seite (z. B. oberhalb des Speiseplans).
- **Banner an dynamischen Plätzen (Slots):** Der Admin wählt einen **Platz** (Slot) aus einer definierbaren Liste – z. B. „Menü oben“, „Menü Sidebar“, „Dashboard Hero“, „Wallet oben“, „Popup nach Login“. Neue Slots können ergänzt werden, sodass die Platzierung flexibel bleibt.

## User Stories

- Als Kantinenmanager möchte ich **festlegen, ob eine Nachricht als Popup, als Banner oder in einem bestimmten Slot** erscheint, um die Sichtbarkeit zu steuern.
- Als Kantinenmanager möchte ich **Platzierungen (Slots) dynamisch definieren** können (z. B. neue Slots anlegen oder vordefinierte nutzen), um Kampagnen an passenden Stellen zu platzieren.
- Als Kunde möchte ich **relevante Kampagnen** als Popup, Banner oder an der konfigurierten Stelle sehen (nur wenn ich zum Segment gehöre und eingeloggt bin).
- Als Kunde möchte ich Popups **schließen** können und optional **nicht erneut anzeigen** lassen.

## Acceptance Criteria

- [ ] Pro In-App-Nachricht/Kampagne ist ein **Darstellungstyp** wählbar: **Popup**, **Banner/Card**, oder **Slot** (Platzierung).
- [ ] Bei **Slot**: Admin wählt einen **Platz** aus einer Liste (vordefinierte Slots wie „Menü oben“, „Menü Sidebar“, „Dashboard Hero“, „Wallet oben“, „Popup nach Login“; optional erweiterbar durch Konfiguration oder Admin-Pflege).
- [ ] **Popup:** Wird zentral (z. B. nach Login oder beim ersten Aufruf einer relevanten Seite) als Modal/Overlay angezeigt; schließbar; optional „als gelesen“ speichern, damit es nicht erneut erscheint.
- [ ] **Banner/Card:** Wie bisher als Einblendung oberhalb/neben dem Hauptinhalt der gewählten Seite (Menü, Wallet, Dashboard).
- [ ] **Kunden-Frontend:** Auf den relevanten Seiten (Menü, Wallet, Dashboard) sowie global für Popups wird eine **Komponente** eingebunden, die die API für „Nachrichten für mich“ aufruft und die Nachrichten je nach Typ (Popup / Banner / Slot) an der richtigen Stelle rendert.
- [ ] Mehrere Nachrichten pro Slot/Seite: Reihenfolge (z. B. Priorität oder Startdatum); bei Popup ggf. nacheinander oder nur eine pro Besuch.

## Edge Cases

- Popup und Slot „Popup nach Login“: Klarheit, ob dasselbe Konzept oder zwei getrennte Slots.
- Keine Nachrichten für den User: Keine leeren Platzhalter anzeigen.
- Slot existiert im Frontend nicht (z. B. alter Slot gelöscht): Nachricht wird nicht angezeigt oder auf Fallback-Slot mappen.

## Abhängigkeiten

- Baut auf PROJ-4c (In-App-Nachrichten, Segment-Zuordnung) und bestehender Kunden-API für „Nachrichten für aktuellen User“ auf.
- Frontend: Einbindung der Ausspiel-Komponenten in Menü-, Wallet- und Dashboard-Seiten sowie ein globaler Provider/Container für Popups.

---

# PROJ-4d: Marketing-Automation (Workflows)

## Konzept

Ein **Workflow** besteht aus:
- **Trigger** (Wann): zeitbasiert (z. B. „täglich um 8:00“, „jeden Montag“) oder ereignisbasiert (z. B. „User wurde Segment X zugeordnet“, „User hat seit 14 Tagen nicht bestellt“).
- **Bedingung** (optional): z. B. nur wenn Segment „Inaktive“ mindestens 50 Nutzer hat.
- **Aktion** (Was): z. B. „E-Mail an Segment X senden“, „In-App-Nachricht für Segment X anzeigen“, „Incentive Y an Segment X vergeben“.

Damit können z. B. folgende Abläufe abgebildet werden:
- **Willkommens-Workflow**: Wenn User sich registriert → nach 1 Tag E-Mail „Tipps zur Plattform“ (Segment: Neukunden, Registrierung < 24 h).
- **Reaktivierung**: Jeden Montag prüfen → Segment „Keine Bestellung seit 28 Tagen“ → E-Mail mit Incentive senden.
- **Stammkunden-Belohnung**: Monatlich Segment „Mind. 10 Bestellungen im letzten Monat“ → In-App-Guthaben oder Coupon anzeigen.

## User Stories

- Als Kantinenmanager möchte ich **Workflows anlegen** können (Name, Trigger, Aktion) um wiederkehrende oder ereignisgesteuerte Aktionen zu automatisieren.
- Als Kantinenmanager möchte ich **zeitgesteuerte Trigger** definieren können (z. B. täglich, wöchentlich, monatlich zu einem Zeitpunkt) um z. B. wöchentliche Reaktivierungs-Mails zu versenden.
- Als Kantinenmanager möchte ich **ereignisgesteuerte Trigger** definieren können (z. B. „User tritt Segment bei“, „Bestellung aufgegeben“) um z. B. Willkommens-Mails oder Follow-up-Aktionen auszulösen.
- Als Kantinenmanager möchte ich **Workflows aktivieren und deaktivieren** können um sie zeitweise auszusetzen.
- Als Kantinenmanager möchte ich **einen Überblick über laufende und letzte Ausführungen** sehen (z. B. „Letzte Ausführung: heute 8:00, 120 E-Mails versendet“) um die Automation zu überwachen.

## Acceptance Criteria

- [ ] Admin kann unter einer Admin-Route (z. B. `/admin/automation` oder `/admin/workflows`) Workflows anlegen: Name, Trigger-Typ (zeitbasiert / ereignisbasiert), Konfiguration (Zeitplan oder Ereignis), Aktion (E-Mail, In-App, Incentive), zugehöriges Segment.
- [ ] **Zeitgesteuerte Trigger**: Mindestens „täglich“, „wöchentlich (Wochentag wählbar)“, „monatlich (Tag wählbar)“ mit konfigurierbarer Uhrzeit (z. B. 8:00).
- [ ] **Ereignisgesteuerte Trigger** (MVP mindestens eine Variante): z. B. „Wenn User zum ersten Mal Segment X zugeordnet wird“ → Aktion ausführen; oder „Wenn User seit X Tagen inaktiv“ (periodische Prüfung).
- [ ] Workflow kann **aktiviert/deaktiviert** werden; deaktivierte Workflows laufen nicht.
- [ ] Pro Workflow wird **Protokoll/Log** der letzten Ausführungen angezeigt: Zeitpunkt, Ergebnis (z. B. „E-Mail an 45 Empfänger versendet“, „Fehler: …“).
- [ ] Keine doppelte Ausführung: Bei zeitbasierten Workflows pro Zeitfenster nur einmal ausführen (Idempotenz pro Tag/Woche/Monat).

## Edge Cases

- Workflow referenziert gelöschtes Segment → Workflow deaktivieren und Hinweis anzeigen.
- Aktion „E-Mail senden“ schlägt für einen Teil der Empfänger fehl → Teilweise erfolgreich; Fehler im Log; ggf. Retry für fehlgeschlagene Adressen.
- Sehr viele Workflows: Ausführung nacheinander oder mit Limit, um Server nicht zu überlasten (Backend-Design; hier nur: „System bleibt stabil bei vielen Workflows“).
- Zeitzone für zeitgesteuerte Ausführung: Einheitlich (z. B. Europe/Berlin) oder pro Organisation konfigurierbar → Empfehlung: pro Organisation oder System-Zeitzone dokumentieren.

## Abhängigkeiten

- Benötigt: PROJ-4a, PROJ-4b, PROJ-4c (Segmente, Zielgruppen, Ausspielkanäle).
- Technisch: Scheduler/Cron oder Queue für zeitgesteuerte Ausführung; Event-Hooks für ereignisgesteuerte Trigger (Solution Architect).

---

# Übersicht Abhängigkeiten

```
PROJ-4a (Segmente CRUD)
    ↓
PROJ-4b (Segment-Regeln / Zielgruppen)
    ↓
PROJ-4c (Ausspielkanäle: E-Mail, In-App, Incentives)
    ↓
PROJ-4d (Workflows: Trigger + Aktionen)
```

- **PROJ-4a** kann zuerst umgesetzt werden (reine Segment-Verwaltung ohne Regeln oder mit festen Platzhalter-Regeln).
- **PROJ-4b** baut darauf auf und ermöglicht die dynamische Zielgruppen-Berechnung.
- **PROJ-4c** nutzt Segmente und Zielgruppen für Versand und Anzeige.
- **PROJ-4d** orchestriert Trigger und Aktionen und nutzt PROJ-4a–c.

---

# Optionale Erweiterungen (Backlog)

- A/B-Tests für E-Mails oder In-App-Nachrichten.
- Detaillierte Kampagnen-Analytics (Öffnungsrate, Klicks, Einlösungen).
- DSGVO: Feingranulare Einwilligungen pro Kanal (E-Mail Marketing, In-App Marketing).
- Anbindung externer E-Mail-Dienste (SendGrid, Mailchimp) mit Sync von Segmenten.
- Vorlagen-Editor für E-Mails (Rich-Text/HTML) und In-App (Bilder, CTA-Buttons).

---

# Solution Design (Solution Architect)

Dieser Abschnitt beschreibt die **High-Level-Architektur** für PROJ-4 (Kundensegmente & Marketing-Automation). Es geht um **was** gebaut wird, nicht um Code-Details. Die technische Umsetzung liegt bei Frontend- und Backend-Entwicklung.

---

## A) Architektur-Überblick

Die Anforderungen gliedern sich in vier Bereiche, die nacheinander aufgebaut werden:

| Schicht | Inhalt | Bestehende Anknüpfung |
|--------|--------|------------------------|
| **PROJ-4a** | Segmente verwalten (Liste, Anlegen, Bearbeiten, Löschen) | Admin-Routen wie `/admin/coupons`, `/admin/locations`; Organisation/Kontext wie bei Locations. |
| **PROJ-4b** | Regeln pro Segment (Attribute, Operatoren, UND/ODER); Berechnung „Wer gehört dazu?“ | User, Order, CompanyEmployee, Location bereits im System. |
| **PROJ-4c** | E-Mail-Versand, In-App-Nachrichten, Incentives (Coupon/Guthaben) pro Segment | Coupon-System, Wallet; Auth/Session für „eingeloggt“. |
| **PROJ-4d** | Workflows (Trigger + Aktion), Scheduler, Logs | Neue Backend-Komponente für zeit-/ereignisgesteuerte Ausführung. |

**Wiederverwendung:**  
- Admin-Layout, Sidebar, Berechtigungen (ADMIN/SUPER_ADMIN) wie bei bestehenden Admin-Seiten.  
- Organisation/Kontext: Segmente, Kampagnen und Workflows sind pro Organisation (organizationId).  
- Coupon- und Wallet-Logik für Incentives anbinden statt neu erfinden.

---

## B) Component-Struktur (UI-Baum)

Welche **Seiten und groben UI-Bereiche** gebraucht werden (ohne Implementierungsdetails):

### Admin: Segmente (PROJ-4a, 4b)

```
Admin-Bereich (Sidebar-Eintrag z. B. "Kundensegmente")
├── Segmente-Übersicht (/admin/segments)
│   ├── Liste aller Segmente (Karten oder Tabelle)
│   │   └── Pro Zeile: Name, Beschreibung, Anzahl Kunden, Aktionen (Bearbeiten, Löschen)
│   ├── Button "Neues Segment"
│   └── Hinweis bei Löschen: "In X Workflows verwendet"
│
└── Segment bearbeiten/erstellen (Sheet oder eigene Seite)
    ├── Felder: Name (Pflicht), Beschreibung (optional)
    ├── Bereich "Zielgruppen-Regeln" (PROJ-4b)
    │   ├── Liste der Regeln (Attribut, Operator, Wert)
    │   ├── Kombination: UND / ODER (z. B. Dropdown oder Tabs)
    │   ├── Button "Regel hinzufügen"
    │   └── Vorschau: "Aktuell X Kunden im Segment" (+ optional "Liste anzeigen")
    └── Speichern / Abbrechen
```

### Admin: Kampagnen / Ausspielung (PROJ-4c)

```
Admin: Kampagnen oder integriert in Segmente
├── "E-Mail an Segment senden"
│   ├── Segment auswählen (Dropdown)
│   ├── Betreff, Inhalt (Textfeld oder Vorlage)
│   ├── Hinweis: "X Empfänger (mit Marketing-Einwilligung)"
│   └── Button "Senden" (mit Bestätigung)
│
├── In-App-Nachrichten verwalten
│   ├── Liste: Nachricht, Segment, Darstellungstyp (Popup/Banner/Slot), Platzierung/Slot, Zeitraum (von–bis)
│   ├── "Neue In-App-Nachricht": Segment, Text, Link, **Darstellungstyp** (Popup | Banner/Card | Slot), **Platzierung/Slot** (bei Slot: Auswahl aus definierbaren Slots, z. B. menu_top, dashboard_hero, popup_after_login), Start/Ende
│   └── Optional: "Als gelesen markieren" pro User (später)
│
└── Incentives zuweisen
    ├── Segment wählen, Incentive-Typ (z. B. Coupon, Guthaben)
    ├── Verknüpfung zu bestehendem Coupon oder neuer Aktion
    └── Ausspielung: nur In-App, nur E-Mail, oder beides
```

### Admin: Workflows / Automation (PROJ-4d)

```
Admin: Automation (/admin/automation oder /admin/workflows)
├── Liste der Workflows
│   └── Pro Zeile: Name, Trigger (z. B. "Jeden Montag 8:00"), Aktion, Segment, Aktiv (An/Aus), Letzte Ausführung
├── Button "Neuer Workflow"
└── Workflow bearbeiten/erstellen
    ├── Name
    ├── Trigger: Zeitbasiert (täglich/wöchentlich/monatlich + Uhrzeit) ODER Ereignis (z. B. "User in Segment")
    ├── Aktion: E-Mail senden / In-App anzeigen / Incentive vergeben (+ Konfiguration)
    ├── Segment auswählen
    ├── Aktivieren/Deaktivieren (Toggle)
    └── Bereich "Protokoll": letzte Ausführungen (Datum, Ergebnis, ggf. Fehler)
```

### Kunden-Seite: Aktive Ausspielung (Popup, In-App, Slots)

```
App-Layout (global, nur wenn eingeloggt)
└── Marketing-Popup-Container (global)
    └── Popup/Modal für Nachrichten mit Darstellungstyp "Popup" (z. B. nach Login oder erstem Seitenbesuch)
        └── Schließen-Button, optional "Nicht wieder anzeigen"

Menü-Seite (/menu)
├── Slot-Bereiche (dynamisch nach konfigurierten Slots, z. B. "menu_top", "menu_sidebar")
│   └── Pro Slot: Liste der Nachrichten für diesen Slot (Banner/Card oder Slot-Inhalt)
└── Bestehender Inhalt (Speiseplan, Warenkorb)

Wallet-Seite (/wallet)
├── Slot-Bereiche (z. B. "wallet_top")
│   └── Pro Slot: Nachrichten für diesen Slot
└── Bestehender Inhalt

Dashboard-Seite (/dashboard)
├── Slot-Bereiche (z. B. "dashboard_hero", "dashboard_sidebar")
│   └── Pro Slot: Nachrichten für diesen Slot
└── Bestehender Inhalt

Gemeinsam für alle Seiten
├── Eine Kunden-API-Abfrage: "Nachrichten für mich" (nach displayPlace/Slot + Segment + Zeitraum)
├── Darstellung je nach Typ: Popup → Modal; Banner/Card → Karte oberhalb/neben Inhalt; Slot → Inhalt im jeweiligen Slot-Bereich
└── Optional: "Als gelesen" markieren (Backend + Frontend)
```

**Slot-Konzept:** Slots sind **Platzierungs-IDs** (z. B. `menu_top`, `menu_sidebar`, `dashboard_hero`, `wallet_top`, `popup_after_login`). Das Frontend reserviert pro Seite feste Bereiche für diese Slot-IDs; der Admin wählt beim Anlegen einer Nachricht einen Slot. Vordefinierte Slots können in Konfiguration oder Admin-UI gepflegt und erweiterbar gehalten werden.

---

## C) Daten-Model (was wird gespeichert?)

Beschreibung in **Fachsprache**, ohne Datenbank-Syntax.

### Segmente (PROJ-4a)

- **Segment:** Eindeutige ID, Name (eindeutig pro Organisation), optionale Beschreibung, Organisation (Zuordnung), Erstellungs-/Änderungsdatum.
- Gespeichert in der **Datenbank** (persistent, pro Organisation).

### Segment-Regeln (PROJ-4b)

- **Regel:** Gehört zu einem Segment; bezieht sich auf ein **Attribut** (z. B. Registrierungsdatum, Anzahl Bestellungen, letzte Bestellung, Unternehmen, Standort, Rolle).
- **Operator:** z. B. „in den letzten X Tagen“, „mindestens X“, „gleich“, „in Liste“.
- **Wert:** Konfigurierbar (Zahl, Datum, ausgewählte Firma/Standort, etc.).
- **Verknüpfung:** Mehrere Regeln pro Segment, Kombination UND oder ODER.
- Die **Zielgruppen-Berechnung** („welche User erfüllen die Regeln?“) wird bei Bedarf ausgeführt (beim Speichern, bei Kampagne, bei Workflow); Ergebnis kann zwischengespeichert werden (z. B. Anzahl, optional Liste der User-IDs für Ausspielung).

### Ausspielung (PROJ-4c) inkl. Aktive Kundenausspielung

- **E-Mail-Versand:** Pro Versand: welches Segment, Betreff, Inhalt (oder Vorlagen-ID), Zeitpunkt, Status (z. B. geplant/versendet/teilweise fehlgeschlagen), optional Kurz-Log (Anzahl versendet, Fehler).
- **In-App-Nachricht:** ID, Segment, Text, optional Link, Start- und Enddatum, aktiv ja/nein. **Erweiterung für aktive Ausspielung:**
  - **Darstellungstyp (displayType):** „Popup“, „Banner/Card“ oder „Slot“ – steuert, ob als Modal, als klassischer Banner oder in einem dynamischen Platz (Slot) gerendert wird.
  - **Platzierung (placement/slotId):** Bei Typ „Banner/Card“: Anzeigeort wie bisher (z. B. Menü, Wallet, Dashboard). Bei Typ „Slot“: **Slot-ID** (z. B. `menu_top`, `menu_sidebar`, `dashboard_hero`, `wallet_top`, `popup_after_login`). Slot-Liste kann vordefiniert und erweiterbar sein (Konfiguration oder Admin-Pflege).
- **Gelesen-Status:** Welcher User welche Nachricht wann gesehen hat, optional speicherbar („gelesen“), damit Popup/Banner nicht erneut angezeigt wird.
- **Incentive-Zuweisung:** Verknüpfung Segment ↔ Incentive (z. B. Coupon, Guthaben-Aktion); Ausspielung „nur E-Mail“, „nur In-App“ oder beides. Einlösung über bestehendes Coupon-/Wallet-System.
- **Marketing-Einwilligung:** Pro User ein Merkmal (z. B. „Marketing-E-Mails erlaubt“); nur bei Ja werden Marketing-Mails an diesen User gesendet.

### Workflows (PROJ-4d)

- **Workflow:** Name, Trigger-Typ (zeitbasiert / ereignisbasiert), Trigger-Konfiguration (Zeitplan oder Ereignis), Aktion (Typ + Konfiguration, z. B. „E-Mail an Segment X“), zugehöriges Segment, aktiv ja/nein, Organisation.
- **Protokoll pro Workflow:** Einträge pro Ausführung: Zeitpunkt, Ergebnis (z. B. „E-Mail an 45 Empfänger versendet“), Fehler falls vorhanden. Begrenzung auf die letzten N Einträge (z. B. 50).

### Keine neuen „Tabellen“ für Kunden

Kunden bekommen **keine** neuen eigenen Entitäten; sie werden über bestehende User-/Order-/Company-Daten den Segmenten zugeordnet. In-App-Anzeige nutzt Session (eingeloggt) + berechnete Segment-Zugehörigkeit.

---

## D) Backend-Funktionen (was der Server können muss)

- **Segmente:** Anlegen, Lesen, Aktualisieren, Löschen (nur eigene Organisation); vor Löschen prüfen, ob Workflows das Segment nutzen.
- **Regeln & Zielgruppe:** Regeln speichern; Service/Funktion „Zielgruppe berechnen“ (Eingabe: Segment-ID → Ausgabe: Liste User-IDs oder nur Anzahl); optional mit Timeout/Limit bei sehr großen Organisationen.
- **E-Mail:** Versand an eine Liste von E-Mail-Adressen (aus Segment + Marketing-Einwilligung); Nutzung eines E-Mail-Dienstes (SMTP oder Provider); Fehler protokollieren, ggf. Queue für Retry.
- **In-App-Nachrichten:** CRUD für Nachrichten (Segment, Text, Zeitraum, **Darstellungstyp**, **Platzierung/Slot**); API für Kunden-App: „Nachrichten für aktuellen User abrufen“ (nur eingeloggt, nur aktive Nachrichten für Segmente, in denen der User ist), Filter nach displayPlace/Slot und ggf. displayType, damit das Frontend Popup-, Banner- und Slot-Nachrichten getrennt rendern kann.
- **Incentives:** Zuweisung Segment ↔ Coupon/Guthaben-Aktion; Kunden-API prüft bei Anzeige/Einlösung, ob User im Segment ist (über bestehende Coupon-/Wallet-Logik erweitern).
- **Workflows:** CRUD für Workflows; **Scheduler:** zeitgesteuerte Workflows in definierten Intervallen ausführen (z. B. Cron-Job oder geplanter Task); **Ereignis-Hooks:** bei definierten Ereignissen (z. B. „User registriert“, „User erstmals in Segment“) Aktion auslösen; Idempotenz bei Zeit-Trigger (pro Tag/Woche/Monat nur einmal).
- **Logging:** Workflow-Ausführungen und E-Mail-Fehler protokollieren, für Admin-Protokoll abrufbar.

---

## E) Tech-Entscheidungen (Begründung für Produktmanagement)

| Entscheidung | Begründung |
|--------------|------------|
| **Segmente und Regeln in der Datenbank** | Persistenz, Mehrbenutzer, klare Zuordnung zur Organisation; Abfragen für Zielgruppen und Workflows brauchen Stabilität und Wiederholbarkeit. |
| **Zielgruppen on-demand oder per Job berechnen** | Echtzeit bei jeder Seitenaufruf wäre bei vielen Usern teuer; Berechnung beim Speichern/Kampagne/Workflow oder per geplantem Job reicht fachlich und skaliert besser. |
| **E-Mail über externen Dienst (SMTP/Provider)** | Zuverlässiger Versand, Bounce-Handling und Reputation; keine eigene Mail-Infrastruktur nötig. |
| **In-App-Nachrichten über bestehende Seiten** | Kein neues „Nachrichten-Center“ nötig; Nutzer sehen Hinweise dort, wo sie ohnehin sind (Menü, Wallet), geringerer Aufwand, höhere Sichtbarkeit. |
| **Popup, Banner und Slots als Darstellungstypen** | Popup für hohe Aufmerksamkeit (z. B. nach Login); Banner für klassische Einblendung; Slots ermöglichen dynamisch definierbare Platzierungen, die der Admin wählt, ohne Code-Änderung. |
| **Slot-IDs als Platzierungsliste** | Vordefinierte und erweiterbare Slot-IDs (z. B. menu_top, popup_after_login) geben dem Admin Kontrolle über „wo“ die Nachricht erscheint; Frontend rendert pro Slot einen Bereich und füllt ihn mit den passenden Nachrichten. |
| **Incentives über bestehendes Coupon-/Wallet-System** | Weniger Duplikate, einheitliche Einlösung und Buchhaltung; Segment nur als zusätzliche „Zielgruppen-Filter“-Logik. |
| **Workflow-Ausführung über Scheduler/Cron** | Einfach zu betreiben, gut vorhersehbar; zeitgesteuerte Trigger sind Standard. Ereignisgesteuerte Trigger über Aufrufe aus der App (z. B. nach Registrierung, nach Segment-Berechnung). |
| **Zeitzone für Zeit-Trigger** | Eine Zeitzone pro Organisation oder System-weit (z. B. Europe/Berlin) dokumentieren und konfigurierbar machen, damit „täglich 8:00“ eindeutig ist. |

---

## F) Abhängigkeiten (Packages / Dienste)

- **E-Mail-Versand:** Ein E-Mail-Paket oder -Dienst (z. B. Nodemailer für SMTP, oder SDK eines Providers wie SendGrid/Resend), bereits vorhanden oder neu eingebunden.
- **Scheduler/Zeitsteuerung:** Entweder System-Cron, der einen Endpunkt aufruft, oder ein Job-Queue-Paket (z. B. für Node/Next: ein Background-Job-Modul oder externe Lösung), um zeitgesteuerte Workflows auszuführen.
- **Keine neuen UI-Frameworks:** Bestehende Admin-UI (z. B. React, bestehende Component-Bibliothek) um neue Seiten und Formulare erweitern; für In-App-Nachrichten reichen bestehende UI-Bausteine (Banner, Karten).

Keine detaillierte Package-Liste mit Versionen hier – die konkrete Auswahl obliegt der Entwicklung.

---

## G) Reihenfolge der Umsetzung (Empfehlung)

1. **PROJ-4a:** Segmente CRUD + Admin-Übersicht; Segment ohne Regeln = 0 Kunden.
2. **PROJ-4b:** Regeln und Attribute pro Segment; Zielgruppen-Berechnung und Vorschau (Anzahl, optional Liste).
3. **PROJ-4c:** E-Mail (inkl. Marketing-Einwilligung), In-App-Nachrichten, Incentive-Verknüpfung; Kunden-API für „Nachrichten/Incentives für mich“.
4. **PROJ-4d:** Workflows (Trigger + Aktion), Scheduler, Protokoll; zuletzt ereignisgesteuerte Trigger, wenn gewünscht.

---

## H) Offene Punkte für die Implementierung

- **Konkrete Attribute und Operatoren** für PROJ-4b in einer kleinen Spezifikation oder Tabelle festlegen (welche Attribute in MVP, welche Operatoren pro Attribut).
- **E-Mail-Vorlagen:** Ob nur Freitext oder erste Vorlagen (z. B. „Willkommen“, „Reaktivierung“) im MVP.
- **Zeitzone:** Pro Organisation in den Einstellungen speicherbar oder global (z. B. in Konfiguration).

---

# UI-Konzept (UI Designer)

Dieses Konzept beschreibt ein **modernes, intuitives und dynamisches UI** für PROJ-4 (Kundensegmente & Marketing-Automation) unter Einhaltung der **DESIGN_GUIDELINES.md** und der Prinzipien Klarheit, Konsistenz und visuelle Hierarchie.

---

## 1. Zentrale Navigation: „Marketing“ im Admin-Panel

**Alle** Navigationspfade für Segmente, Kampagnen und Automation werden **unter einem zentralen Menüpunkt „Marketing“** gebündelt. Keine verstreuten Einträge; ein Ort für alle Marketing-Funktionen.

### Sidebar-Struktur (AppSidebar)

Neue **Menügruppe** mit stabiler ID (z. B. `marketing`), auf-/zuklappbar wie bestehende Gruppen:

```
Marketing
├── Kundensegmente     → /admin/marketing/segments
├── Kampagnen          → /admin/marketing/campaigns
└── Automation         → /admin/marketing/automation
```

- **Kundensegmente:** Segmente anlegen, bearbeiten, Regeln definieren, Zielgruppen-Vorschau.
- **Kampagnen:** E-Mail an Segment senden, In-App-Nachrichten verwalten, Incentives zuweisen (oder als Unter-Tabs/Sub-Navigation auf einer Seite).
- **Automation:** Workflows anlegen, Trigger und Aktionen konfigurieren, Protokoll einsehen.

**Icon-Vorschlag:** Ein einheitliches Icon für die Gruppe „Marketing“ (z. B. Megaphone, Target oder Sparkles); pro Unterpunkt können eigene Icons verwendet werden (Users2, Mail, Zap).  
**Position:** Logisch zwischen „Promotions“ und „Verwaltung“ oder direkt nach „Bestellungen & Verkauf“, damit der Ablauf „Verkauf → Marketing → Verwaltung“ erkennbar ist.

---

## 2. Design-Prinzipien (Anbindung DESIGN_GUIDELINES)

- **Cards:** Alle übersichtsartigen Blöcke (Segment-Karte, Workflow-Karte, Kampagnen-Karte) als **Card** mit `rounded-2xl`, `border border-border/50`, Hover: `hover:shadow-2xl hover:scale-[1.02]` und `transition-all duration-300`.
- **Header-Bereiche:** Seiten mit zentralem Thema (z. B. „Kundensegmente“, „Automation“) erhalten einen **Gradient-Header** wie in DESIGN_GUIDELINES: `bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50` (Light), Dark: `dark:from-green-950/20 …`, optional mit **SVG-Welle** am unteren Rand für Konsistenz mit Speiseplan/MenuWeek.
- **Badges:** Status und Kennzahlen als Badges – z. B. Segment „X Kunden“ in `bg-muted text-muted-foreground` oder grün für „Aktiv“, amber für „Berechnung läuft“, destructive für „Fehler/Deaktiviert“.
- **Buttons:** Primary Actions („Neues Segment“, „E-Mail senden“, „Workflow starten“) mit **Gradient-Button** (from-green-600 to-emerald-600), `rounded-xl`, Hover-Scale; sekundäre Aktionen als Outline.
- **Typografie:** H1 für Seitentitel (`text-3xl md:text-4xl font-bold text-foreground`), H2 für Sektionen, Body `text-sm text-foreground`, Zusatzinfos `text-muted-foreground`.
- **Spacing:** Konsistent `p-4` in Cards, `gap-6` in Grids, `space-y-3` vertikal in Formularen.
- **Dark Mode:** Alle Flächen, Badges und Texte mit passenden Dark-Varianten (z. B. `dark:bg-green-950/20`, `dark:text-green-400`).
- **Accessibility:** Semantisches HTML, ARIA-Labels für Icon-Buttons, fokussierbare Elemente mit sichtbarem Focus-Ring (`focus-visible:ring-2`).

---

## 3. Seiten-Konzept: Kundensegmente (/admin/marketing/segments)

### Ziel
Schnell erfassen, welche Segmente es gibt; mit einem Klick anlegen oder bearbeiten; Zielgruppengröße und Regeln auf einen Blick.

### Layout

- **Oben:** Gradient-Header mit Titel „Kundensegmente“, Kurzbeschreibung (z. B. „Zielgruppen für Kampagnen und Automation“), rechts **„Neues Segment“-Button** (Primary, mit Plus-Icon).
- **Inhalt:** **Grid von Segment-Cards** (1 Spalte mobil, 2–3 Spalten ab Tablet), jeweils:
  - **Titel** (Segment-Name), **Beschreibung** (eine Zeile, `line-clamp-2`).
  - **Badge:** „X Kunden“ (Zahl dynamisch; bei Berechnung „…“ oder Spinner).
  - **Aktionen:** Bearbeiten (Outline), optional „Kunden anzeigen“, Löschen (Destructive, mit Bestätigungs-Dialog).
- **Leerzustand:** Keine Segmente → zentrierte Karte mit Icon (z. B. Users2), Text „Noch keine Segmente. Erstellen Sie Ihre erste Zielgruppe.“ und Button „Neues Segment“.

### Segment bearbeiten/erstellen (Sheet oder Vollseite)

- **Formular:** Name (Pflicht), Beschreibung (optional), wie in DESIGN_GUIDELINES: Labels, Inputs mit `border-input`, `rounded-xl` wo passend.
- **Bereich „Zielgruppen-Regeln“:**
  - Liste der Regeln als **kompakte Chips/Karten** (Attribut, Operator, Wert); pro Regel Bearbeiten/Entfernen.
  - **„Regel hinzufügen“:** Dropdown Attribut, dann Operator und Wert (je nach Attribut); Kombination UND/ODER als Toggle oder Dropdown.
  - **Live-Vorschau:** „Aktuell **X** Kunden im Segment“ mit optionalem Button „Berechnung starten“; bei Laufzeit kurzer Hinweis „Berechnung kann einige Sekunden dauern“ und deaktivierter Button/Spinner.
- **Speichern / Abbrechen** im Footer; bei Löschen Hinweis, wenn Workflows das Segment nutzen (Warnung + Liste der Workflows).

### Dynamik & Feedback

- Nach Speichern: Toast „Segment gespeichert“; Liste/Grid aktualisieren.
- Zielgruppenzahl bei Änderung der Regeln erst nach „Speichern“ oder explizitem „Berechnen“ aktualisieren (klar kommunizieren).
- Loading-States für Berechnung und Speichern (Spinner, disabled Buttons).

---

## 4. Seiten-Konzept: Kampagnen (/admin/marketing/campaigns)

### Ziel
An einem Ort E-Mails versenden, In-App-Nachrichten verwalten und Incentives zuweisen – alles segmentbasiert.

### Layout-Option A: Tabs auf einer Seite

- **Tabs:** „E-Mail“, „In-App-Nachrichten“, „Incentives“ (wie DESIGN_GUIDELINES Button-Gruppen: `bg-muted p-1 rounded-lg`, aktiver Tab hervorgehoben).
- **E-Mail-Tab:**
  - Bereich „E-Mail an Segment senden“: Segment-Dropdown, Betreff, Inhalt (Textarea oder Vorlagen-Dropdown), Hinweis „X Empfänger (mit Marketing-Einwilligung)“.
  - Button „Senden“ mit Bestätigung (Modal: „An X Empfänger senden?“).
- **In-App-Tab:**
  - Liste der In-App-Nachrichten (Card oder Tabelle): Segment, Text (gekürzt), **Darstellungstyp** (Popup/Banner/Slot), **Platzierung/Slot**, Zeitraum (von–bis), Aktiv; Aktionen Bearbeiten, Deaktivieren.
  - Button „Neue In-App-Nachricht“; Formular: Segment, Text, optional Link, **Darstellungstyp** (Popup | Banner/Card | Slot), **Platzierung/Slot** (Dropdown mit definierbaren Slots, z. B. Menü oben, Sidebar, Dashboard Hero, Popup nach Login), Start-/Enddatum.
- **Incentives-Tab:**
  - Übersicht: Segment ↔ Incentive (Coupon/Guthaben); „Incentive zuweisen“: Segment wählen, Typ (Coupon/Guthaben), Verknüpfung zu bestehendem Coupon oder Aktion.

### Layout-Option B: Sub-Navigation unter /admin/marketing/campaigns

- Links oder Tabs: „E-Mail“ → `/admin/marketing/campaigns/email`, „In-App“ → `…/in-app`, „Incentives“ → `…/incentives`; jede Sub-Route mit eigenem Header und Inhalt wie oben.

**Empfehlung:** Tabs auf einer Seite für geringere Klick-Tiefe und direkten Wechsel zwischen Kanälen.

### Design

- Header der Seite: gleicher Gradient-Stil wie Segmente; Buttons und Cards wie in DESIGN_GUIDELINES.
- Nach Versand: Toast „E-Mail wird versendet“ bzw. „E-Mail an X Empfänger gesendet“; Fehler toast mit kurzer Meldung.

---

## 5. Seiten-Konzept: Automation (/admin/marketing/automation)

### Ziel
Workflows auf einen Blick; schnell aktivieren/deaktivieren; letzte Ausführungen und Fehler sofort sichtbar.

### Layout

- **Oben:** Gradient-Header, Titel „Automation“, Beschreibung (z. B. „Zeit- und ereignisgesteuerte Aktionen für Ihre Segmente“), Button **„Neuer Workflow“**.
- **Inhalt:** **Liste/Grid von Workflow-Cards**, pro Workflow:
  - **Name**, **Segment** (Name oder Badge).
  - **Trigger:** Kurztext (z. B. „Jeden Montag, 8:00“ oder „Bei Eintritt in Segment“).
  - **Aktion:** z. B. „E-Mail an Segment“, „In-App anzeigen“.
  - **Status:** Badge „Aktiv“ (grün) / „Pausiert“ (muted); Toggle zum An/Aus.
  - **Letzte Ausführung:** Datum + Kurzergebnis (z. B. „Heute 8:00 · 45 E-Mails versendet“ oder „Fehler: …“).
  - **Aktionen:** Bearbeiten, Protokoll anzeigen.

### Workflow bearbeiten/erstellen (Sheet oder Seite)

- **Name**, **Segment** (Dropdown).
- **Trigger:** Auswahl Zeitbasiert / Ereignisbasiert; dann Konfiguration (Tage/Uhrzeit, Wochentag, oder Ereignis-Typ).
- **Aktion:** Typ (E-Mail, In-App, Incentive) + zugehörige Konfiguration (wie in Kampagnen).
- **Aktiv** (Toggle).
- **Protokoll:** Bereich „Letzte Ausführungen“ mit Einträgen (Datum, Ergebnis, ggf. Fehlertext); begrenzt auf z. B. 20 Einträge.

### Dynamik & Feedback

- Toggle Aktiv/Pausiert mit sofortigem visuellen Feedback (Badge- und Zustandsänderung).
- Nach Ausführung (oder manueller Aktualisierung): Protokoll aktualisieren; bei Fehlern auffälliger Hinweis (z. B. destructive Badge oder Alert-Bereich).

---

## 6. Kunden-Seite: In-App-Nachrichten und Incentives

- **Ort:** Bestehende Seiten (Menü, Wallet, ggf. Dashboard); **kein** eigenes „Marketing“-Menü für Kunden.
- **In-App-Nachricht:** Als **Banner oder Karte** oberhalb des Hauptinhalts (z. B. auf der Menü-Seite): `rounded-2xl`, dezenter Hintergrund (z. B. `bg-primary/10` oder `bg-muted`), Text + optional Link; Close-Button; optional „Als gelesen“ speichern, sodass die Nachricht nicht erneut erscheint.
- **Incentive:** Integration in bestehende Coupon-/Wallet-UI (z. B. „Ihr persönliches Angebot“-Banner oder Hinweis im Warenkorb); gleiche Card-/Badge-Sprache wie in den Guidelines.

---

## 7. Zusammenfassung: Intuitiv, modern, dynamisch

| Aspekt | Umsetzung |
|--------|------------|
| **Intuitiv** | Eine zentrale Navigation „Marketing“; klare Begriffe (Segmente, Kampagnen, Automation); einheitliche Aktionen (Bearbeiten, Löschen, Aktivieren) und sofortiges Feedback (Toasts, Badges). |
| **Modern** | Gradient-Header, Card-basierte Übersichten, weiche Hover- und Transition-Effekte, konsistente Badges und Buttons gemäß DESIGN_GUIDELINES; Dark Mode durchgängig. |
| **Dynamisch** | Live-Vorschau der Zielgruppengröße, Toggle für Workflow-Aktivierung, Protokoll der letzten Ausführungen, Lade- und Fehlerzustände; leere Zustände mit klarem Call-to-Action. |

---

## 8. Navigations-Routen-Referenz (Implementierung)

Für die Implementierung der Sidebar und der Routen:

| Anzeige in Sidebar | Route | Kurzbeschreibung |
|--------------------|--------|-------------------|
| **Marketing** (Gruppe) | — | Aufklappbare Gruppe |
| Kundensegmente | `/admin/marketing/segments` | CRUD Segmente, Regeln, Zielgruppen-Vorschau |
| Kampagnen | `/admin/marketing/campaigns` | E-Mail, In-App-Nachrichten, Incentives (Tabs oder Sub-Routen) |
| Automation | `/admin/marketing/automation` | Workflows, Trigger, Aktionen, Protokoll |

Keine weiteren Admin-Links für PROJ-4 außerhalb dieser Gruppe; Coupons bleiben unter „Promotions“, da sie die konkreten Gutscheine sind – die **segmentbasierte Ausspielung** wird unter Marketing → Kampagnen/Incentives abgebildet.

---

## Checklist (Solution Architect)

- [x] Bestehende Architektur berücksichtigt (Admin-Routen, Organisation, Coupons, Wallet).
- [x] Feature Spec PROJ-4 vollständig einbezogen.
- [x] Component-Struktur (UI-Baum) für Admin und Kunden-Seiten beschrieben.
- [x] Daten-Model in Fachsprache beschrieben (ohne Code).
- [x] Backend-Bedarf und -Funktionen skizziert.
- [x] Tech-Entscheidungen begründet.
- [x] Abhängigkeiten (E-Mail, Scheduler) genannt.
- [x] Reihenfolge der Umsetzung (4a → 4b → 4c → 4d) festgehalten.
- [ ] User Review: Design prüfen und freigeben.

---

## Checklist (Requirements Engineer)

- [x] User Stories pro Sub-Feature definiert
- [x] Acceptance Criteria testbar formuliert
- [x] Edge Cases dokumentiert
- [x] Feature-ID vergeben (PROJ-4, PROJ-4a–d)
- [x] Abhängigkeiten und Reihenfolge beschrieben
- [x] Scope und optionale Erweiterungen abgegrenzt
- [ ] User Review: Spec lesen und freigeben (oder Feedback geben)
