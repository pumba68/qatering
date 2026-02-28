# PROJ-28: Point-of-Sale Kassenansicht

## Status: Planned
**Created:** 2026-02-27
**Last Updated:** 2026-02-27

## Zusammenfassung
Eine tablet- und desktop-optimierte POS-Ansicht für den Vor-Ort-Verkauf in der Kantine. Kassierer sehen den Tagesplan in einer großflächigen Kachel-Ansicht, bauen einen Warenkorb auf, ordnen optional einem Kundenkonto zu, schließen per Bar, SumUp oder Wallet ab und generieren eine Quittung (Bildschirm + optionaler Druck).

## Dependencies
- Erfordert: Wochenplan/Menüplan (bestehend) – Tagesgerichte inkl. Preise
- Erfordert: PROJ-13 (SumUp Terminal Integration) – für Kartenzahlung
- Erfordert: PROJ-6 (Wallet) – für Wallet-Abbuchung bei registrierten Kunden
- Berührt: `UserRole` Enum in Prisma (neuer Wert `CASHIER`)
- Berührt: `Order`-Modell (neues Feld `source = POS`, Status direkt `PICKED_UP`)

## User Stories

- Als **CASHIER** möchte ich direkt nach dem Login auf der POS-Ansicht landen, damit ich keine unnötigen Klicks brauche.
- Als **CASHIER** möchte ich beim Start meinen Standort auswählen (und bei Bedarf wechseln), damit der richtige Tagesplan angezeigt wird.
- Als **CASHIER** möchte ich die heutigen Gerichte als großflächige Kacheln sehen, damit ich schnell und sicher tippen kann.
- Als **CASHIER** möchte ich Artikel per Tap in den Warenkorb legen und Mengen anpassen, damit ich eine Bestellung zusammenstellen kann.
- Als **CASHIER** möchte ich optional nach einem registrierten Kunden suchen und die Bestellung seinem Account zuordnen, damit der Kauf in seiner Historie erscheint.
- Als **CASHIER** möchte ich zwischen Barzahlung (mit Wechselgeld-Anzeige), SumUp-Terminal und Wallet-Abbuchung wählen, damit ich flexibel auf den Kundenwunsch reagieren kann.
- Als **CASHIER** möchte ich nach dem Bezahlen eine Quittung auf dem Bildschirm sehen und optional drucken können, damit der Kunde einen Beleg erhält.
- Als **CASHIER** möchte ich mit einem Klick einen neuen Verkauf starten (Warenkorb leeren), damit die Kasse sofort für den nächsten Kunden bereit ist.
- Als **ADMIN** möchte ich CASHIER-Nutzer anlegen und ihnen Standorte zuweisen können.

## Acceptance Criteria

### Rolle & Routing
- [ ] `CASHIER` als neuer Wert im `UserRole` Enum in Prisma vorhanden
- [ ] Login leitet `CASHIER`-Nutzer direkt auf `/pos` weiter
- [ ] `/pos` und alle Sub-Routen durch Middleware geschützt (erfordert Auth)
- [ ] ADMIN kann `/pos` ebenfalls aufrufen (zum Testen / Übernahme)

### Standort-Auswahl
- [ ] Beim Start (oder nach Logout) erscheint ein Standort-Auswahl-Screen
- [ ] Standort bleibt für die Session gespeichert (localStorage oder sessionStorage)
- [ ] Header zeigt den gewählten Standort + Button „Standort wechseln"

### Menü-Anzeige
- [ ] Nur Gerichte des heutigen Tagesplans am gewählten Standort werden angezeigt
- [ ] Jede Kachel zeigt: Gerichtname, Preis, Bild (falls vorhanden), Quantitäts-Stepper (+/−)
- [ ] Kacheln sind mindestens 48×48 px Tappable, für Tablet-Betrieb optimiert
- [ ] Leere-Zustand-Ansicht wenn kein Menüplan für heute existiert

### Warenkorb
- [ ] Warenkorb-Panel zeigt: alle Positionen, Menge, Einzelpreis, Gesamtsumme
- [ ] Menge kann direkt im Warenkorb erhöht/verringert/gelöscht werden
- [ ] Checkout-Button deaktiviert wenn Warenkorb leer

### Kundenzuordnung
- [ ] Suchfeld „Kunde suchen" (Name oder E-Mail) mit Echtzeit-Dropdown
- [ ] Ausgewählter Kunde wird als Badge im Warenkorb-Panel angezeigt
- [ ] „Als Gast fortfahren"-Button überspringt die Kundenzuordnung

### Bezahlung
- [ ] Auswahl: Bar / SumUp / Wallet (Wallet nur wenn Kunde zugeordnet)
- [ ] **Bar:** Eingabe „Gegeben" → Anzeige „Rückgeld: X €"
- [ ] **SumUp:** Auslösen der Terminal-Anfrage (via PROJ-13), Warten auf Bestätigung
- [ ] **Wallet:** Anzeige aktuelles Guthaben, Abbuchung nur wenn ≥ Gesamtbetrag, sonst Fehlermeldung
- [ ] Keine Bestellung wird erstellt bevor Zahlung bestätigt

### Bestellung & Quittung
- [ ] Bestellung wird mit `status: PICKED_UP` und `source: POS` angelegt
- [ ] Falls Kunde zugeordnet: Bestellung unter dessen Account gespeichert; sonst anonymer Gast-Datensatz
- [ ] Quittung-Screen zeigt: Gerichte, Mengen, Einzelpreise, Gesamtbetrag, Zahlungsart, Timestamp, Pickup-Code
- [ ] „Drucken"-Button öffnet Browser-Druckdialog mit kassenbon-optimiertem Layout (80 mm-Breite, schwarz/weiß)
- [ ] „Neuer Verkauf"-Button setzt Warenkorb + Kundenzuordnung zurück (Standort bleibt)

## Edge Cases

- **Kein Tagesplan heute:** Leere-Zustand mit Hinweis „Heute kein Menü geplant – bitte Menüplan prüfen."
- **Wallet-Guthaben nicht ausreichend:** Fehlermeldung mit aktuellem Guthaben, alternative Zahlungsart anbieten.
- **SumUp nicht erreichbar / Timeout:** Fehlermeldung, Fallback auf Bar oder Wallet anbieten. Keine Bestellung anlegen.
- **Warenkorb leer bei Checkout-Versuch:** Button deaktiviert, Hinweis einblenden.
- **Gleiches Gericht mehrfach getappt:** Menge in bestehender Warenkorb-Position erhöhen (nicht doppelter Eintrag).
- **Druckdialog abgebrochen:** Quittung bleibt auf Bildschirm, kein Fehler.
- **Netzwerkfehler beim Order-Erstellen:** Fehlermeldung + Retry-Button; kein doppeltes Anlegen der Bestellung.
- **CASHIER ohne Standort-Zuweisung:** Manuelle Standortauswahl (aus allen aktiven Standorten der Org).

## UI / UX Anforderungen

- **Layout:** Zwei-Panel-Ansicht (links: Menü-Grid, rechts: Warenkorb + Checkout) auf Desktop/Tablet
- **Mobil (< 768 px):** Warenkorb als Slide-up-Drawer, Menü fullscreen
- **Keine Sidebar-Navigation** – POS ist eine fokussierte Vollbild-App-Ansicht
- **Tap-freundlich:** Alle interaktiven Elemente ≥ 48×48 px
- **Performance:** Menü lädt in < 500 ms, Checkout-Flow < 1 s Antwortzeit
- **Standort-Indikator** immer sichtbar im Header

## Neue Routen

| Route | Zweck |
|---|---|
| `/pos` | Haupt-POS-Ansicht |
| `/pos/receipt/[orderId]` | Quittungs-Ansicht nach Abschluss |
| `GET /api/pos/menu?locationId=X&date=YYYY-MM-DD` | Holt Tagesgerichte für POS |
| `POST /api/pos/orders` | Legt POS-Bestellung an (inkl. Zahlungslogik) |

---
<!-- Sections below are added by subsequent skills -->

## Tech Design (Solution Architect)
_To be added by /architecture_

## QA Test Results
_To be added by /qa_

## Deployment
_To be added by /deploy_
