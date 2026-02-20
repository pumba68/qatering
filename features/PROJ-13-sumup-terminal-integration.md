# PROJ-13: SumUp Terminal-Integration (Stationärer Verkauf)

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-6 (Wallet & Guthaben-System) – für Wallet-Aufladung via Terminal
- Benötigt: PROJ-14 (Admin Payment-Settings) – SumUp API-Key + Terminal-ID Konfiguration
- Benötigt: PROJ-1 (Admin Dashboard) – Kassier-Ansicht für Küchenpersonal / Admin

---

## Überblick

Das SumUp-Kartenterminal ermöglicht **stationäre Zahlungen direkt an der Kantine-Theke**. Die Integration unterstützt zwei Modi:

1. **Wallet-Aufladung via Terminal:** Kunde zahlt am Terminal → Betrag landet auf Wallet-Guthaben
2. **Direktzahlung (Bypass Wallet):** Kunde bezahlt eine konkrete Bestellung direkt am Terminal, ohne Wallet

Das Küchenpersonal oder der Admin startet den Zahlungsvorgang am Bildschirm (Kassier-Modus), das Terminal fordert den Kunden zur kontaktlosen Zahlung (NFC/Karte) auf.

---

## User Stories

### Küchenpersonal / Admin (Kassier-Seite)
- Als Kassier möchte ich eine einfache Kassenansicht im Admin-Bereich öffnen können, damit ich schnell Zahlungen initiieren kann.
- Als Kassier möchte ich für die **Wallet-Aufladung** einen Betrag eingeben (oder aus Schnellbeträgen wählen) und dem Kunden zuordnen (per E-Mail-Suche oder Scan des Nutzer-QR-Codes), damit das Guthaben dem richtigen Konto gutgeschrieben wird.
- Als Kassier möchte ich für eine **Direktzahlung** eine Bestellnummer eingeben oder scannen, damit der Betrag der korrekten Bestellung zugeordnet wird.
- Als Kassier möchte ich nach Eingabe der Details auf „Zahlung starten" klicken, woraufhin das SumUp-Terminal aufleuchtet und den Kunden zur Zahlung auffordert.
- Als Kassier möchte ich in Echtzeit sehen, ob die Zahlung erfolgreich war oder fehlgeschlagen ist (Terminal-Status auf dem Bildschirm).
- Als Kassier möchte ich eine Zahlung abbrechen können, falls der Kunde es sich anders überlegt.

### Kunde (Terminalseite)
- Als Kunde möchte ich meine Kreditkarte, Debitkarte oder mein NFC-Gerät (Apple Pay, Google Pay) kontaktlos ans Terminal halten können, damit ich schnell und bequem zahle.
- Als Kunde möchte ich nach erfolgreicher Zahlung sofort eine In-App-Benachrichtigung auf meinem Smartphone sehen (falls Push aktiviert), dass mein Guthaben aufgeladen wurde.

### System
- Als System möchte ich den Zahlungsstatus des SumUp-Terminals in Echtzeit abfragen (Polling oder Webhook), damit die Kassenansicht aktuell bleibt.
- Als System möchte ich jede Terminal-Zahlung als `WalletTransaction` (TOP_UP) oder als Bestellzahlung protokollieren.

---

## Acceptance Criteria

### Admin/Kassier-Panel (Neuer Screen)
- [ ] Neuer Menüpunkt im Admin-Bereich: „Kasse" (`/admin/kasse`)
- [ ] Nur für Rollen `ADMIN` und `KITCHEN_STAFF` sichtbar
- [ ] Kassier-Screen zeigt zwei Modi: **„Wallet aufladen"** und **„Bestellung bezahlen"**

### Modus 1: Wallet-Aufladung via Terminal
- [ ] Kassier sucht Kunde per E-Mail-Eingabe (Autocomplete) oder scannt QR-Code aus Kunden-App
- [ ] Kassier wählt Betrag: Schnellauswahl (10€ / 20€ / 25€ / 50€) oder freie Eingabe (mind. 5€)
- [ ] Kassier klickt „Zahlung starten" → SumUp Terminal wird angesprochen (API-Aufruf)
- [ ] Terminal-Status wird angezeigt: „Warten auf Kundenzahlung…" → „Zahlung erfolgreich" / „Abgebrochen"
- [ ] Bei Erfolg: Wallet-Guthaben des Kunden wird sofort aktualisiert
- [ ] WalletTransaction mit `paymentProvider: 'sumup'`, `performedById: <kassierUserId>` wird erstellt
- [ ] Push-Notification an Kunden-Gerät (falls aktiviert): „+20€ wurden aufgeladen"

### Modus 2: Direktzahlung (Bypass Wallet)
- [ ] Kassier gibt Bestell-ID / Pickup-Code ein (oder scannt QR-Code der Bestellung)
- [ ] System zeigt Bestelldetails + zu zahlenden Betrag
- [ ] Kassier klickt „Zahlung starten" → Terminal wird angesprochen
- [ ] Bei Erfolg: Bestellstatus wird auf `CONFIRMED` + `paymentStatus: COMPLETED` gesetzt
- [ ] Zahlung wird als `paymentMethod: 'sumup_terminal'` an der Bestellung gespeichert

### SumUp API-Integration
- [ ] Admin hinterlegt SumUp API-Key und Terminal-ID in PROJ-14 Settings
- [ ] Terminal-Verbindung wird beim Öffnen der Kassier-Ansicht geprüft (Status: Verbunden / Nicht verbunden)
- [ ] Zahlungsanfragen werden über SumUp Checkout / Terminal API gesendet
- [ ] Status-Polling alle 2 Sekunden (oder Webhook, falls SumUp Webhooks verfügbar)
- [ ] Timeout nach 120 Sekunden ohne Kundenaktion → automatischer Abbruch + Info für Kassier

### Abbruch & Fehler
- [ ] „Zahlung abbrechen"-Button während des Wartens auf Terminal → sendet Cancel-Request an SumUp API
- [ ] Bei Terminal-Fehler (Netzwerk, Karte abgelehnt): klare Fehlermeldung für Kassier
- [ ] Keine Doppelzahlung bei versehentlichem Doppelklick (SumUp Checkout ID als Idempotenz-Key)

---

## Edge Cases

- **Terminal nicht verbunden (Offline):** „Terminal nicht erreichbar. Bitte Verbindung prüfen." Kein Zahlungsversuch wird gestartet.
- **Karte vom Terminal abgelehnt:** SumUp gibt Fehlermeldung zurück → Kassier sieht „Zahlung abgelehnt" und kann neuen Versuch starten.
- **Kunde-QR-Code scan schlägt fehl:** Manuelle E-Mail-Suche als Fallback.
- **Betrag < 5€:** Serverseitige Validierung verhindert den Zahlungsversuch.
- **Terminal-Zeitüberschreitung (120s):** Automatischer Abbruch + Terminal wird für neue Zahlung freigegeben.
- **Kassier schließt Browser während Zahlung:** Terminal bleibt aktiv bis Zeitüberschreitung; Zahlung wird über Webhook/Polling nachgebucht, falls der Kunde noch zahlt.
- **Doppelter Zahlungsversuch für dieselbe Bestellung (Direktzahlung):** System prüft `paymentStatus` der Bestellung und verhindert zweiten Terminal-Aufruf.
- **Wallet-Aufladung: Kunden-Account nicht gefunden:** Fehlermeldung „Kein Account mit dieser E-Mail gefunden". Zahlung wird nicht gestartet.
- **SumUp API Rate Limit:** Retry mit Backoff; Kassier informieren falls mehrfacher Fehler.

---

## Technische Anforderungen

- **SumUp API:** SumUp REST API (Checkout API + Terminal API)
- **Auth:** SumUp OAuth 2.0 (API-Key → Access Token)
- **Terminal-Kommunikation:** SumUp Checkout Endpoint → Terminal empfängt Zahlanfrage via Terminal-ID
- **Status-Updates:** Polling `GET /api/payments/sumup/status/:checkoutId` oder SumUp Webhook
- **Neue API-Routes:**
  - `POST /api/payments/sumup/checkout` – erstellt SumUp Checkout + sendet ans Terminal
  - `GET /api/payments/sumup/status/:checkoutId` – aktueller Zahlungsstatus
  - `POST /api/payments/sumup/cancel/:checkoutId` – bricht Zahlung ab
  - `POST /api/payments/sumup/webhook` – SumUp Webhook Handler (falls verfügbar)
- **Neue Seite:** `/admin/kasse` – Kassier-Interface für KITCHEN_STAFF + ADMIN
- **Env-Variablen:** `SUMUP_API_KEY`, `SUMUP_MERCHANT_CODE`, `SUMUP_TERMINAL_ID` (konfigurierbar via PROJ-14)
- **Protokollierung:** Alle Terminal-Transaktionen in `WalletTransaction` (`paymentProvider: 'sumup'`) oder `Order.paymentMethod: 'sumup_terminal'`

---

## UI-Mockup Kassier-Interface

```
┌─────────────────────────────────────────────────┐
│  🏧 Kasse                    Terminal: 🟢 Aktiv  │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Wallet aufladen]  [Bestellung bezahlen]       │
│                                                 │
│  Kunde:  [max@demo.de ▾]  🔍 oder QR scannen    │
│          → Max Mustermann  |  Guthaben: 18,50€  │
│                                                 │
│  Betrag:                                        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │
│  │ 10 € │ │ 20 € │ │ 25 € │ │ 50 € │           │
│  └──────┘ └──────┘ └──────┘ └──────┘           │
│                                                 │
│           [ Zahlung starten: 20 € ]             │
│                                                 │
│  ──────────────────────────────────────────     │
│  ⏳ Warten auf Terminal...  [ Abbrechen ]        │
│                                                 │
└─────────────────────────────────────────────────┘
```
