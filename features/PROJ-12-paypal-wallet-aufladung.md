# PROJ-12: Wallet-Aufladung via PayPal

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-6 (Wallet & Guthaben-System) – Wallet-Balance-Aktualisierung
- Benötigt: PROJ-11 (Stripe Online Payment) – gleiche Aufladeseite, zusätzlicher Payment Button
- Benötigt: PROJ-14 (Admin Payment-Settings) – für PayPal API-Key Konfiguration
- Benötigt: PROJ-9 (E-Mail Template Versand) – für Auflade-Bestätigungs-E-Mail

---

## Überblick

Ergänzend zu Stripe (PROJ-11) können Kunden ihr Wallet-Guthaben auch über **PayPal** aufladen. Der PayPal-Button erscheint auf derselben Aufladeseite als alternative Zahlungsoption. Nach Bestätigung im PayPal-Popup wird das Guthaben sofort gutgeschrieben.

PayPal ist in Deutschland besonders weit verbreitet und bietet für viele Nutzer die bevorzugte Zahlungsmethode ohne Kreditkarte.

---

## User Stories

- Als Kunde möchte ich auf der Wallet-Aufladeseite einen „PayPal"-Button sehen, damit ich ohne Kreditkarte bezahlen kann.
- Als Kunde möchte ich den gewünschten Betrag (10€/20€/25€/50€) zuerst auswählen und dann auf „Zahlen mit PayPal" klicken, damit ich immer weiß, was ich bezahle.
- Als Kunde möchte ich mich im PayPal-Popup mit meinem PayPal-Account einloggen und die Zahlung bestätigen, ohne die Plattform zu verlassen (PayPal-Overlay/Popup).
- Als Kunde möchte ich nach erfolgreicher PayPal-Zahlung automatisch zur Wallet-Seite zurückgeleitet werden mit einer Bestätigung.
- Als Kunde möchte ich bei abgebrochener PayPal-Zahlung (Popup geschlossen) ohne Konsequenzen zur Aufladeseite zurückkehren können.
- Als Kunde möchte ich eine E-Mail-Bestätigung nach erfolgreicher Aufladung via PayPal erhalten.
- Als System möchte ich PayPal-Webhooks (IPN / Instant Payment Notification) verarbeiten, damit Zahlungen auch bei Browser-Abbruch sicher verbucht werden.

---

## Acceptance Criteria

### PayPal-Button auf Aufladeseite
- [ ] PayPal Smart Button wird auf der Wallet-Aufladeseite unter den Stripe-Optionen angezeigt
- [ ] PayPal-Button ist erst klickbar, nachdem ein Betrag (10€/20€/25€/50€) ausgewählt wurde
- [ ] Klick öffnet PayPal-Popup (kein Redirect auf neue Seite)
- [ ] PayPal-Button zeigt das offizielle PayPal-Design (PayPal Smart Buttons SDK)
- [ ] Falls PayPal im Admin-Panel deaktiviert ist (PROJ-14), wird der Button ausgeblendet

### Zahlungsflow
- [ ] Nutzer wählt Betrag → klickt PayPal → PayPal-Popup öffnet
- [ ] Nutzer loggt sich in PayPal ein und bestätigt Zahlung
- [ ] Nach Bestätigung: Popup schließt, Wallet-Guthaben wird sofort aktualisiert
- [ ] In-App Toast: „+20€ erfolgreich via PayPal aufgeladen. Neues Guthaben: 38,50€"
- [ ] PayPal-Zahlung wird als `WalletTransaction` (Typ: `TOP_UP`, Provider: `paypal`) gespeichert

### Abbruch / Fehler
- [ ] Nutzer schließt PayPal-Popup ohne Zahlung → keine Buchung, Seite bleibt geöffnet
- [ ] PayPal-Zahlung fehlgeschlagen → Fehlermeldung auf derselben Seite mit Retry-Option
- [ ] Kein doppeltes Buchen bei mehrfachem Popup-Öffnen (Idempotenz via PayPal Order ID)

### Webhook / Backend
- [ ] PayPal Webhook Endpoint: `POST /api/payments/paypal/webhook`
- [ ] Verarbeitet Event: `PAYMENT.CAPTURE.COMPLETED`
- [ ] Verarbeitet Event: `PAYMENT.CAPTURE.DENIED`
- [ ] Webhook-Signatur-Validierung mit PayPal Webhook ID
- [ ] Idempotenz: Bereits verarbeitete PayPal Order IDs werden nicht doppelt gebucht

### E-Mail & Push
- [ ] E-Mail-Bestätigung nach erfolgreicher PayPal-Zahlung (gleicher Template wie PROJ-11)
- [ ] Push-Notification falls aktiviert: „Guthaben aufgeladen: +20€ via PayPal"

---

## Edge Cases

- **PayPal-Account nicht verifiziert:** PayPal verhindert die Zahlung selbst; Nutzer sieht PayPal-Fehlermeldung im Popup und kann Kreditkarte als Alternative nutzen.
- **PayPal-Popup durch Browser blockiert:** Hinweis für Nutzer: „Bitte erlauben Sie Popups für diese Seite" + direkter Link als Fallback.
- **PayPal temporär nicht erreichbar:** SDK lädt nicht → PayPal-Button nicht angezeigt (graceful degradation); Stripe bleibt verfügbar.
- **Nutzer doppelt auf „Zahlen mit PayPal" geklickt:** Zweiter Klick öffnet kein zweites Popup; Button wird während Popup-Anzeige deaktiviert.
- **Zahlung in PayPal bestätigt, aber Webhook verspätet:** Retry-Mechanismus (PayPal sendet Webhooks mehrfach); Idempotenz verhindert Doppelbuchung.
- **PayPal-Erstattung (Refund) durch Nutzer bei PayPal:** Webhook `PAYMENT.CAPTURE.REFUNDED` → Wallet-Guthaben entsprechend reduzieren (nicht unter 0).
- **Nutzer hat kein PayPal-Konto:** PayPal erlaubt Gastzahlung mit Kreditkarte im PayPal-Popup – kein eigenes PayPal-Konto nötig.

---

## Technische Anforderungen

- **Payment Provider:** PayPal REST API v2 (Orders API)
- **SDK:** `@paypal/react-paypal-js` (offizielles PayPal React SDK)
- **Flow:** PayPal Smart Buttons → `createOrder` → `onApprove` → serverseitige Capture → Webhook
- **API-Keys:** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (konfigurierbar im Admin-Panel via PROJ-14)
- **Webhook Secret:** `PAYPAL_WEBHOOK_ID`
- **Umgebungen:** Sandbox (Entwicklung) + Live (Produktion) – via `PAYPAL_ENV=sandbox|live`
- **Neue API-Routes:**
  - `POST /api/payments/paypal/create-order` – erstellt PayPal Order
  - `POST /api/payments/paypal/capture-order` – bestätigt Zahlung nach Nutzer-Approval
  - `POST /api/payments/paypal/webhook` – PayPal Webhook Handler
- **Neue Datenbank-Felder (WalletTransaction):**
  - `paymentProvider: String?` – „paypal"
  - `externalPaymentId: String?` – PayPal Order/Capture ID (Idempotenz)
