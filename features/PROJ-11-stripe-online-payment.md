# PROJ-11: Online Wallet-Aufladung via Stripe (Kreditkarte, Apple Pay, Google Pay, SEPA)

## Status: 🔵 Planned

## Abhängigkeiten
- Benötigt: PROJ-6 (Wallet & Guthaben-System) – Wallet-Balance-Aktualisierung
- Benötigt: PROJ-14 (Admin Payment-Settings) – für Stripe API-Key Konfiguration
- Benötigt: PROJ-9 (E-Mail Template Versand) – für Auflade-Bestätigungs-E-Mail

---

## Überblick

Kunden können ihr Wallet-Guthaben vollständig **selbstständig** über die Plattform aufladen, indem sie mit **Kreditkarte (Visa/Mastercard), Apple Pay, Google Pay oder SEPA-Lastschrift** bezahlen. Stripe als Payment-Processor übernimmt die sichere Zahlungsabwicklung. Das Guthaben wird nach erfolgreichem Zahlungseingang **sofort** im Wallet gutgeschrieben.

---

## User Stories

### Kunde (Self-Service)
- Als Kunde möchte ich auf der Wallet-Seite einen "Guthaben aufladen"-Button sehen, damit ich jederzeit selbstständig mein Guthaben erhöhen kann.
- Als Kunde möchte ich aus vordefinierten Fixbeträgen (10€, 20€, 25€, 50€) wählen können, damit ich schnell ohne Tippfehler aufladen kann.
- Als Kunde möchte ich mit meiner Kreditkarte (Visa/Mastercard) bezahlen, damit ich keine zusätzlichen Apps oder Konten benötige.
- Als Kunde möchte ich mit Apple Pay (Safari/iOS) in einem Schritt bezahlen, ohne Kartendaten einzugeben.
- Als Kunde möchte ich mit Google Pay (Chrome/Android) in einem Schritt bezahlen, ohne Kartendaten einzugeben.
- Als Kunde möchte ich per SEPA-Lastschrift (IBAN-Eingabe) bezahlen, damit auch Banküberweisungs-Nutzer eine günstige Alternative haben.
- Als Kunde möchte ich nach erfolgreicher Zahlung sofort eine In-App-Bestätigung sehen, damit ich weiß, dass das Guthaben verfügbar ist.
- Als Kunde möchte ich eine E-Mail-Bestätigung mit dem aufgeladenen Betrag und dem neuen Kontostand erhalten.
- Als Kunde möchte ich bei fehlgeschlagener Zahlung eine verständliche Fehlermeldung sehen und dieselbe Aufladeseite erneut nutzen können (Retry).

### System
- Als System möchte ich Stripe Webhooks verarbeiten, damit das Wallet auch dann korrekt aufgeladen wird, wenn der Kunde den Browser nach der Zahlung schließt.
- Als System möchte ich jede Aufladung als `WalletTransaction` (Typ: `TOP_UP`) in der Datenbank protokollieren.
- Als System möchte ich idempotente Webhook-Verarbeitung sicherstellen, damit dasselbe Payment-Event nicht doppelt gutgeschrieben wird.

---

## Acceptance Criteria

### Wallet-Aufladeseite (Kunde)
- [ ] Auf der Wallet-Seite (`/wallet`) gibt es einen Button „Guthaben aufladen" oder einen Abschnitt mit Betragsauswahl
- [ ] Der Kunde sieht 4 Schnellauswahl-Buttons: **10€ / 20€ / 25€ / 50€**
- [ ] Die Auswahl öffnet einen Stripe Payment Sheet / ein Modal (kein Seiten-Reload)
- [ ] Stripe Elements zeigt automatisch Apple Pay / Google Pay an, wenn das Gerät/Browser es unterstützt
- [ ] Kreditkarteneingabe ist PCI-DSS-konform (Stripe-hosted Fields)
- [ ] SEPA-Lastschrift ist als weitere Option wählbar
- [ ] Nach erfolgreicher Zahlung: Wallet-Guthaben wird sofort aktualisiert (< 3 Sekunden)
- [ ] In-App Toast: „+20€ erfolgreich aufgeladen. Neues Guthaben: 38,50€"
- [ ] Seite zeigt aktualisiertes Guthaben ohne manuelles Reload

### Fehlerbehandlung
- [ ] Bei abgelehnter Karte: Fehlermeldung auf derselben Seite (z.B. „Ihre Karte wurde abgelehnt. Bitte verwenden Sie eine andere Zahlungsmethode.")
- [ ] Bei Netzwerkfehler: „Verbindungsfehler – bitte prüfen Sie Ihre Internetverbindung"
- [ ] Retry ohne erneutes Laden der Seite möglich
- [ ] Kein doppeltes Abbuchen bei mehrfachem Klick (idempotenter Payment Intent)

### Webhook & Backend
- [ ] Stripe Webhook Endpoint: `POST /api/payments/stripe/webhook`
- [ ] Verarbeitet Event: `payment_intent.succeeded`
- [ ] Verarbeitet Event: `payment_intent.payment_failed`
- [ ] Webhook-Signatur-Validierung mit `STRIPE_WEBHOOK_SECRET`
- [ ] Idempotenz: Bereits verarbeitete Stripe Event IDs werden ignoriert (kein Doppelt-Buchen)
- [ ] Wallet-Balance wird via Prisma-Transaktion atomar aktualisiert

### E-Mail-Bestätigung
- [ ] Auflade-Bestätigungs-E-Mail wird nach `payment_intent.succeeded` versendet
- [ ] E-Mail enthält: Betrag, Zahlungsmethode, Datum/Uhrzeit, neues Guthaben, Transaktions-ID
- [ ] E-Mail-Absender/Template folgt PROJ-9 Standards

### Push-Benachrichtigung
- [ ] Falls der Kunde Push-Benachrichtigungen aktiviert hat: Browser-Push „Guthaben aufgeladen: +20€"

---

## Edge Cases

- **Zahlung erfolgreich, aber Browser geschlossen:** Webhook verarbeitet Zahlung server-seitig, Guthaben wird korrekt gutgeschrieben.
- **SEPA-Lastschrift: Rückbuchung (Chargeback):** Wallet-Guthaben muss bei Rückbuchung reduziert werden (Webhook: `payment_intent.payment_failed` nach initialer Bestätigung). Negative Balance verhindern.
- **Apple Pay nur auf kompatiblen Geräten:** Stripe zeigt Apple Pay nur bei HTTPS + Safari + Touch/Face ID. Fallback auf Kreditkarte muss immer verfügbar sein.
- **Google Pay nur mit gespeicherter Karte in Google-Account:** Falls kein Google Pay verfügbar → Button nicht anzeigen.
- **User lädt exakt den Betrag auf, der zum Maximum führen würde:** Kein Maximum definiert (nur Minimum 5€ Mindestaufladung).
- **Gleichzeitige Aufladeversuche derselben Session:** Payment Intent Lock verhindert Race Conditions.
- **Stripe API temporär nicht erreichbar:** Fehlermeldung mit Retry-Option; kein Guthaben wird gebucht.
- **Ungültige Webhook-Signatur:** Request wird mit 400 abgelehnt und geloggt.
- **Benutzer ist nicht eingeloggt:** Aufladeseite erfordert Authentifizierung → Redirect zum Login.

---

## Technische Anforderungen

- **Payment Provider:** Stripe (Payment Intents API + Stripe Elements / Payment Element)
- **Unterstützte Zahlungsmethoden via Stripe:** `card`, `apple_pay`, `google_pay`, `sepa_debit`
- **Mindestaufladebetrag:** 5€ (serverseitig validiert)
- **Fixbeträge:** 10€, 20€, 25€, 50€ (konfigurierbar)
- **Währung:** EUR
- **Webhook Secret:** Env-Variable `STRIPE_WEBHOOK_SECRET`
- **API-Keys:** Env-Variablen `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY` (konfigurierbar im Admin-Panel via PROJ-14)
- **Security:** Stripe-hosted Payment Element (PCI-SAQ-A konform; keine Kartendaten berühren unsere Server)
- **Performance:** Payment Intent Creation < 500ms; Wallet-Aktualisierung nach Webhook < 1s
- **Neue API-Routes:**
  - `POST /api/payments/stripe/create-intent` – erstellt Stripe Payment Intent
  - `POST /api/payments/stripe/webhook` – Stripe Webhook Handler
- **Neue Datenbank-Felder (WalletTransaction):**
  - `paymentProvider: String?` – z.B. „stripe"
  - `externalPaymentId: String?` – Stripe Payment Intent ID (für Idempotenz)

---

## UI-Mockup (grob)

```
┌─────────────────────────────────────────┐
│  Mein Guthaben: 18,50 €                 │
│                                         │
│  Guthaben aufladen                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 10 € │ │ 20 € │ │ 25 € │ │ 50 € │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│                                         │
│  [Ausgewählt: 20 €]                     │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │  🍎 Apple Pay                      ││
│  │  G  Google Pay                     ││
│  │  ── oder mit Karte ──              ││
│  │  [4242 4242 4242 4242] [12/27] [123]││
│  │  [SEPA: DE89 3704 0044 0532...]    ││
│  │  [Jetzt 20€ aufladen]              ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

| Was existiert bereits | Wie wird es wiederverwendet |
|---|---|
| `/app/wallet/page.tsx` | Auflade-Bereich wird direkt in diese bestehende Seite eingebaut |
| `lib/wallet.ts` → `topUp()` | Der Stripe-Webhook ruft nach erfolgreicher Zahlung genau diese Funktion auf — keine neue Buchungslogik nötig |
| `WalletTransaction`-Tabelle | TOP_UP-Buchung läuft über bestehende Struktur; zwei neue Felder ergänzen |
| Sonner (bereits installiert) | Toast-Meldung nach erfolgreicher Aufladung |
| Prisma + Neon | Kein Wechsel nötig; alle DB-Operationen laufen wie bisher |
| `lib/payment-config.ts` (aus PROJ-14) | Stripe-API-Key wird von dort geladen — kein hartcodierter Key |
| `/api/payments/providers/active` (aus PROJ-14) | Wallet-Seite prüft, ob Stripe aktiv ist, bevor sie den Auflade-Bereich zeigt |
| `components/ui/` (Button, Card, Dialog, Badge) | Alle UI-Bausteine für den Auflade-Bereich |

---

### Component-Struktur

```
/wallet  (bestehende Seite, erweitert)
│
├── [BESTEHEND] GuthabenAnzeige
│   ├── Betrag (farbcodiert: grün / gelb / rot)
│   └── Status-Badge + Niedrig-Balance-Warnung
│
├── [NEU] WalletTopUpSection
│   ├── Abschnittsüberschrift „Guthaben aufladen"
│   │
│   ├── AmountSelector (4 Buttons)
│   │   ├── [10 €]  [20 €]  [25 €]  [50 €]
│   │   └── (ausgewählter Betrag ist hervorgehoben)
│   │
│   └── StripePaymentSheet (erscheint nach Betrag-Auswahl)
│       ├── ApplePayButton     (nur sichtbar bei Safari/iOS mit Touch ID)
│       ├── GooglePayButton    (nur sichtbar bei Chrome/Android)
│       ├── Trennlinie „oder mit Karte zahlen"
│       ├── StripeCardElement  (PCI-konform, von Stripe gehosted)
│       ├── SepaTabs (SEPA-Lastschrift als Tab-Option)
│       └── ConfirmButton „Jetzt {Betrag}€ aufladen"
│           └── LoadingState während Zahlungsabwicklung
│
└── [BESTEHEND] Link zur Transaktionshistorie

Hintergrund (kein sichtbares UI):
├── StripeWebhookHandler  (/api/payments/stripe/webhook)
│   ├── Empfängt: payment_intent.succeeded → ruft topUp() auf
│   └── Empfängt: payment_intent.payment_failed → loggt Fehler
└── IdempotenzPrüfung (externalPaymentId bereits in DB?)
```

---

### Daten-Modell

**Erweiterung der bestehenden `WalletTransaction`**

Kein neues Modell nötig. Die bestehende Tabelle erhält zwei optionale Felder (bereits in PROJ-14 beschrieben):

```
Jede Wallet-Transaktion kann jetzt optional enthalten:
- paymentProvider  → "stripe" (oder leer bei Admin-Buchungen)
- externalPaymentId → die Stripe Payment-Intent-ID (z.B. "pi_3NxQ...")
  → Wird für Idempotenz genutzt: wenn diese ID schon in der DB liegt,
    wird der Webhook-Aufruf ignoriert (kein Doppelt-Buchen)
```

**Kein neues Modell für Payment-Intents nötig**

Stripe hält den Status selbst vor. Wir speichern nur das Ergebnis (erfolgreich/fehlgeschlagen) in `WalletTransaction`.

---

### Zahlungs-Ablauf (vereinfacht)

```
Kunde                    Browser                  Unser Server            Stripe
  │                         │                          │                     │
  │  Klick: „20 € laden"    │                          │                     │
  │ ─────────────────────►  │                          │                     │
  │                         │  POST create-intent      │                     │
  │                         │ ────────────────────────►│                     │
  │                         │                          │  Create PaymentIntent
  │                         │                          │ ───────────────────►│
  │                         │  clientSecret            │                     │
  │                         │ ◄────────────────────────│                     │
  │                         │                          │                     │
  │  Kartendaten eingeben   │                          │                     │
  │ ─────────────────────►  │                          │                     │
  │                         │  Direkt an Stripe        │                     │
  │                         │ ────────────────────────────────────────────►  │
  │                         │                          │       Webhook        │
  │                         │                          │ ◄───────────────────│
  │                         │                          │  topUp() + DB        │
  │  Toast: +20€ aufgeladen │                          │                     │
  │ ◄─────────────────────  │   (polling / event)      │                     │
```

**Wichtig:** Kartendaten verlassen nie unseren Server. Stripe hostet das Eingabefeld direkt.

---

### Tech-Entscheidungen

**Warum Stripe Payment Element (statt individuelle Card-Elemente)?**
→ Ein einziges UI-Widget zeigt automatisch alle verfügbaren Methoden (Apple Pay, Google Pay, Kreditkarte, SEPA). Keine manuelle Geräteerkennung nötig — Stripe macht das.

**Warum Payment Intents API (statt Stripe Checkout Redirect)?**
→ Kein Seiten-Reload. Der Nutzer bleibt auf `/wallet`. Bessere UX, modernerer Ansatz.

**Warum Webhook für die Wallet-Buchung (statt direkt im Browser)?**
→ Sicherheit + Zuverlässigkeit: Selbst wenn der Nutzer den Browser schließt, läuft die Buchung server-seitig durch. Kein Buchungsverlust möglich.

**Warum `topUp()` aus `lib/wallet.ts` wiederverwenden?**
→ Die Funktion existiert bereits, ist atomar (Prisma-Transaktion), und pflegt automatisch `balanceBefore/After`. Kein doppelter Code.

**Warum Idempotenz via `externalPaymentId`?**
→ Stripe kann denselben Webhook mehrfach senden (bei Netzwerkfehlern). Ohne Idempotenz-Check würde das Guthaben mehrfach gutgeschrieben. Mit dem Check: „Habe ich diese Stripe-ID schon verarbeitet?" ist das ausgeschlossen.

---

### Neue Dateien & Routen

**Neue API-Routen:**
- `POST /api/payments/stripe/create-intent` — erstellt Payment Intent bei Stripe, gibt `clientSecret` zurück
- `POST /api/payments/stripe/webhook` — empfängt Stripe-Events, bucht Wallet (roher Request-Body erforderlich für Signaturprüfung)

**Neue Komponente:**
- `components/wallet/WalletTopUpSection.tsx` — Betrag-Auswahl + Stripe Payment Element

**Neue Bibliotheks-Datei:**
- `lib/stripe.ts` — Stripe-Client-Initialisierung (server-seitig)

**Datenbank-Migration:**
- Neue Felder in `WalletTransaction`: `paymentProvider`, `externalPaymentId`
  (Bereits in PROJ-14 beschrieben — wird einmalig für beide Features migriert)

---

### Neue Packages

```
Benötigte neue Packages:
- stripe                    → Stripe Server SDK (API-Calls, Webhook-Signatur-Validierung)
- @stripe/stripe-js         → Stripe Browser SDK (Payment Element laden)
- @stripe/react-stripe-js   → React-Wrapper für Stripe Elements
```

---

### Implementierungsreihenfolge

> ⚠️ PROJ-14 muss zuerst implementiert werden, da PROJ-11 die dort gespeicherten API-Keys benötigt.

1. Packages installieren (`stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`)
2. Prisma-Migration: `paymentProvider` + `externalPaymentId` zu `WalletTransaction` (sofern nicht schon via PROJ-14 geschehen)
3. `lib/stripe.ts` — Stripe-Client-Initialisierung
4. `POST /api/payments/stripe/create-intent` — Payment Intent erstellen
5. `POST /api/payments/stripe/webhook` — Webhook-Handler + `topUp()`-Aufruf
6. `WalletTopUpSection` — Frontend-Komponente mit Stripe Payment Element
7. Integration in `/wallet/page.tsx`
8. Tests: Erfolgreiche Zahlung, abgelehnte Karte, Browser-Abbruch nach Zahlung
