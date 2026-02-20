# PROJ-14: Admin Payment-Provider Settings Panel

## Status: 🔵 Planned

## Abhängigkeiten
- Voraussetzung für: PROJ-11 (Stripe), PROJ-12 (PayPal), PROJ-13 (SumUp) – alle Payment-Features nutzen die hier konfigurierten Keys
- Benötigt: PROJ-1 (Admin Dashboard) – Integration in Admin-Navigation

---

## Überblick

Das Admin Payment-Settings Panel ermöglicht es dem Betreiber, alle Payment-Provider **zentral im Admin-Bereich zu konfigurieren**, ohne Zugriff auf Serverumgebungsvariablen zu benötigen. API-Keys, Secrets und Terminal-IDs werden sicher gespeichert und können einzelne Zahlungsmethoden **aktiviert oder deaktiviert** werden.

Ziel: Der Betreiber kann neue Zahlungsmethoden selbstständig anbinden oder deaktivieren – ohne Entwickler-Eingriff.

---

## User Stories

- Als Admin möchte ich eine übersichtliche Settings-Seite für Zahlungen unter `/admin/settings/payments` aufrufen, damit ich alle Payment-Provider im Überblick habe.
- Als Admin möchte ich meinen **Stripe API-Key** (Public + Secret + Webhook Secret) im Interface eingeben können, damit Stripe-Zahlungen funktionieren.
- Als Admin möchte ich **PayPal** (Client ID + Client Secret + Webhook ID) konfigurieren können, damit PayPal-Zahlungen verfügbar sind.
- Als Admin möchte ich meinen **SumUp API-Key und die Terminal-ID** hinterlegen können, damit das Terminal angesprochen werden kann.
- Als Admin möchte ich jede Zahlungsmethode einzeln **aktivieren/deaktivieren** (Toggle), damit ich z.B. PayPal temporär ausblenden kann, ohne den Key zu löschen.
- Als Admin möchte ich für jeden konfigurierten Provider einen **Verbindungstest** ausführen können, damit ich sehe, ob der API-Key korrekt ist.
- Als Admin möchte ich die konfigurierten Keys **niemals im Klartext** sehen (maskiert: `sk_live_****...****`), damit Keys nicht versehentlich geleakt werden.
- Als Admin möchte ich eine **Transaktionsübersicht** sehen (Datum, Betrag, Methode, Nutzer, Status), damit ich Zahlungen nachvollziehen und Fehler identifizieren kann.

---

## Acceptance Criteria

### Payment-Settings Seite (`/admin/settings/payments`)
- [ ] Neuer Menüpunkt im Admin-Bereich unter „Einstellungen → Zahlungen"
- [ ] Nur für Rolle `ADMIN` / `SUPER_ADMIN` sichtbar
- [ ] Seite gliedert sich in Karten pro Provider: Stripe, PayPal, SumUp

### Stripe-Konfiguration
- [ ] Felder: Publishable Key, Secret Key, Webhook Secret
- [ ] Toggle: „Stripe-Zahlungen aktivieren" (Karte, Apple Pay, Google Pay, SEPA)
- [ ] Sub-Toggles: Kreditkarte ✓, Apple Pay ✓, Google Pay ✓, SEPA-Lastschrift ✓ (einzeln de/aktivierbar)
- [ ] „Verbindung testen"-Button → macht einen Test-API-Call an Stripe; zeigt „Verbunden ✓" oder Fehlermeldung
- [ ] Keys werden maskiert angezeigt: `sk_live_••••••••••••••••abcd`
- [ ] „Bearbeiten"-Button öffnet Eingabefeld mit leerem Wert; erst nach Speichern überschrieben

### PayPal-Konfiguration
- [ ] Felder: Client ID, Client Secret, Webhook ID, Umgebung (Sandbox / Live – Toggle)
- [ ] Toggle: „PayPal-Zahlungen aktivieren"
- [ ] „Verbindung testen"-Button → Test-Token-Request an PayPal OAuth
- [ ] Keys werden maskiert angezeigt

### SumUp-Konfiguration
- [ ] Felder: API-Key (Access Token), Merchant Code, Terminal-ID
- [ ] Toggle: „SumUp Terminal aktivieren"
- [ ] „Terminal-Status prüfen"-Button → zeigt ob Terminal online/offline ist
- [ ] Terminal-ID kann für mehrere Standorte separat konfiguriert werden (pro Location)

### Sicherheit der Keys
- [ ] API-Keys werden verschlüsselt in der Datenbank gespeichert (AES-256 oder via externem Secret Manager)
- [ ] Keys sind nicht über API abrufbar (nur serverseitig nutzbar)
- [ ] Audit-Log: Wann hat welcher Admin einen Key geändert?
- [ ] Alle Änderungen erfordern Admin-Passwort-Bestätigung

### Transaktionsübersicht
- [ ] Tabelle mit allen Payment-Transaktionen (WalletTransaction + Order Payments via Terminal)
- [ ] Spalten: Datum, Nutzer, Betrag, Methode (Stripe/PayPal/SumUp), Typ (Wallet/Bestellung), Status
- [ ] Filter nach: Zeitraum, Payment-Provider, Status (Erfolg/Fehlgeschlagen)
- [ ] Export als CSV-Download
- [ ] Pagination (50 Einträge pro Seite)

### Aktivierungslogik (Frontend)
- [ ] Ist ein Provider deaktiviert, erscheint der zugehörige Button/Option auf der Kunden-Aufladeseite nicht
- [ ] Aktivierungsstatus wird gecacht (max. 60 Sekunden) um API-Calls zu reduzieren
- [ ] Fehlt ein API-Key (nicht konfiguriert), kann der Provider nicht aktiviert werden (mit Hinweistext)

---

## Edge Cases

- **Admin gibt ungültigen Stripe-Key ein:** „Verbindung testen" schlägt fehl → Key wird nicht gespeichert, Fehlermeldung: „Ungültiger API-Key. Bitte prüfen Sie Ihren Stripe-Account."
- **Admin deaktiviert Stripe während laufende Zahlungen in Bearbeitung sind:** Bereits gestartete Payment Intents werden noch abgeschlossen; neue Zahlungen werden blockiert.
- **Key-Wechsel (z.B. von Stripe Test zu Live):** Alte laufende Payment Intents mit dem alten Key müssen noch abgeschlossen werden können. Klartext-Warnung: „Beim Wechsel des Keys laufen bestehende Transaktionen möglicherweise ins Leere."
- **Mehrere Admins bearbeiten Settings gleichzeitig:** Last-Write-Wins mit Timestamp-Warnung: „Diese Einstellungen wurden in der Zwischenzeit von Thomas Hofer geändert."
- **SumUp Terminal-ID für mehrere Standorte:** Jede Location kann eine eigene Terminal-ID haben; bei nur einem Terminal → global gültig.
- **SUPER_ADMIN löscht alle Keys:** System fällt auf „keine Zahlungsmethode verfügbar" zurück; Kunden sehen entsprechenden Hinweis auf Aufladeseite.
- **Datenbankausfall beim Key-Speichern:** Transaktion wird nicht committet; bestehende Keys bleiben gültig.

---

## Technische Anforderungen

- **Key-Storage:** Verschlüsselt in Datenbank (neues Prisma-Modell `PaymentProviderConfig`)
- **Verschlüsselung:** AES-256-GCM mit Server-seitigem Encryption Key (`PAYMENT_CONFIG_SECRET` Env-Variable)
- **Neues Prisma-Modell:**
```prisma
model PaymentProviderConfig {
  id             String   @id @default(cuid())
  organizationId String
  provider       String   @db.VarChar(20) // stripe | paypal | sumup
  isEnabled      Boolean  @default(false)
  configJson     String   @db.Text        // AES-verschlüsseltes JSON mit Keys
  updatedAt      DateTime @updatedAt
  updatedById    String?

  organization   Organization @relation(...)
  updatedBy      User?        @relation(...)

  @@unique([organizationId, provider])
}
```
- **Neue API-Routes:**
  - `GET /api/admin/settings/payments` – alle Provider-Configs (maskiert)
  - `PUT /api/admin/settings/payments/:provider` – Config speichern
  - `POST /api/admin/settings/payments/:provider/test` – Verbindungstest
  - `GET /api/admin/settings/payments/transactions` – Transaktionsübersicht
- **Neue Seite:** `/admin/settings/payments`
- **Aktivierungsstatus-API:** `GET /api/payments/providers/active` – gibt aktive Provider zurück (gecacht, für Frontend)
- **Performance:** Settings-Seite lädt < 1s; Verbindungstest < 3s
- **Audit-Log:** Alle Key-Änderungen mit userId, timestamp, provider in separater Log-Tabelle

---

## UI-Mockup

```
┌──────────────────────────────────────────────────────────┐
│  ⚙️  Zahlungseinstellungen                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─ Stripe ──────────────────────────────────────────┐  │
│  │  ● Aktiviert                          [Toggle ON]  │  │
│  │  Publishable Key:  pk_live_••••••••••abcd  [✏️]   │  │
│  │  Secret Key:       sk_live_••••••••••wxyz  [✏️]   │  │
│  │  Webhook Secret:   whsec_••••••••••mnop    [✏️]   │  │
│  │  Methoden: [✓ Kreditkarte] [✓ Apple Pay]           │  │
│  │            [✓ Google Pay]  [✓ SEPA]                │  │
│  │  [🔗 Verbindung testen]  ✅ Verbunden               │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ PayPal ───────────────────────────────────────────┐  │
│  │  ○ Deaktiviert                        [Toggle OFF]  │  │
│  │  Client ID:     AZxxxx••••••••1234     [✏️]        │  │
│  │  Client Secret: ••••••••••••••••       [✏️]        │  │
│  │  Umgebung:  ○ Sandbox  ● Live                      │  │
│  │  [🔗 Verbindung testen]                             │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ SumUp Terminal ───────────────────────────────────┐  │
│  │  ● Aktiviert                          [Toggle ON]  │  │
│  │  API-Key:       ••••••••••••••••       [✏️]        │  │
│  │  Terminal-ID:   T-BERLIN-01            [✏️]        │  │
│  │  [📡 Terminal-Status prüfen]  🟢 Online            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Letzte Transaktionen                                    │
│  [Datum] [Nutzer] [Betrag] [Methode] [Status] [...]      │
│  [CSV Export]                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Tech-Design (Solution Architect)

### Bestehende Infrastruktur (Wiederverwendung)

| Was existiert bereits | Wie wird es wiederverwendet |
|---|---|
| `/admin/settings/page.tsx` | Neue Unterseite `/admin/settings/payments` wird als Tab/Link ergänzt |
| `AppSidebar.tsx` | Neuer Menüpunkt „Zahlungen" unter Einstellungen |
| `components/ui/` (Card, Button, Input, Badge, Toggle, Dialog) | Alle bestehenden UI-Bausteine werden für die Provider-Karten verwendet |
| `lib/admin-helpers.ts` → `getAdminContext()` | Auth-Check für alle neuen Admin-Routen |
| `WalletTransaction`-Tabelle (Prisma) | Transaktionsübersicht liest aus bestehender Tabelle |
| Sonner (Toast-Bibliothek, bereits installiert) | Erfolgsmeldungen & Fehlerhinweise |

---

### Component-Struktur

```
/admin/settings/payments  (neue Seite)
├── Seitenheader (Titel + Beschreibung)
│
├── ProviderCard: Stripe
│   ├── Aktivierungs-Toggle (ein/aus)
│   ├── MaskedKeyField: Publishable Key       [✏️ Bearbeiten]
│   ├── MaskedKeyField: Secret Key            [✏️ Bearbeiten]
│   ├── MaskedKeyField: Webhook Secret        [✏️ Bearbeiten]
│   ├── Methoden-Checkboxen (Kreditkarte / Apple Pay / Google Pay / SEPA)
│   └── [Verbindung testen] → StatusBadge (✅ Verbunden / ❌ Fehler)
│
├── ProviderCard: PayPal
│   ├── Aktivierungs-Toggle
│   ├── MaskedKeyField: Client ID             [✏️ Bearbeiten]
│   ├── MaskedKeyField: Client Secret         [✏️ Bearbeiten]
│   ├── MaskedKeyField: Webhook ID            [✏️ Bearbeiten]
│   ├── Umgebungs-Toggle: Sandbox ↔ Live
│   └── [Verbindung testen] → StatusBadge
│
├── ProviderCard: SumUp
│   ├── Aktivierungs-Toggle
│   ├── MaskedKeyField: API-Key               [✏️ Bearbeiten]
│   ├── MaskedKeyField: Merchant Code         [✏️ Bearbeiten]
│   ├── TerminalIdList (pro Standort: Location-Name + Terminal-ID-Feld)
│   └── [Terminal-Status prüfen] → StatusBadge (🟢 Online / 🔴 Offline)
│
└── Transaktionsübersicht
    ├── FilterBar (Zeitraum, Provider, Status: Erfolg/Fehler)
    ├── TransactionTable
    │   └── Zeilen: Datum | Nutzer | Betrag | Methode | Typ | Status
    ├── Pagination (50 pro Seite)
    └── [CSV exportieren] → Download
```

---

### Daten-Modell

**Neues Objekt: Payment-Provider-Konfiguration**

Jede Organisation speichert ihre API-Keys pro Provider. Die Keys werden niemals im Klartext gespeichert.

```
Payment-Provider-Konfiguration hat:
- Zu welcher Organisation gehört sie
- Welcher Provider (stripe / paypal / sumup)
- Ist der Provider gerade aktiviert? (ja/nein)
- Die verschlüsselten Zugangsdaten (als verschlüsselter Text)
- Wann zuletzt geändert
- Welcher Admin hat die letzte Änderung gemacht (Audit-Trail)

Besonderheit: Pro Organisation kann jeder Provider nur einmal konfiguriert sein.
```

**Erweiterung bestehende Zahlungs-Transaktion**

Die bestehende `WalletTransaction`-Tabelle erhält zwei neue optionale Felder:
- `paymentProvider` – welcher Anbieter wurde genutzt? (stripe / paypal / sumup)
- `externalPaymentId` – die externe Transaktions-ID des Anbieters (verhindert Doppelbuchungen)

---

### Tech-Entscheidungen

**Warum Keys verschlüsselt in der Datenbank statt als Umgebungsvariablen?**
→ Betreiber können Provider selbstständig anbinden ohne Zugriff auf den Server. Der Verschlüsselungs-Schlüssel selbst (`PAYMENT_CONFIG_SECRET`) bleibt als einzige Env-Variable bestehen.

**Warum Keys beim Anzeigen immer maskieren?**
→ `sk_live_••••••••••••abcd` — nur die letzten 4 Zeichen sichtbar. Verhindert versehentliches Screenshot-Leaken.

**Warum Node.js `crypto` (eingebaut) statt externer Bibliothek?**
→ Node.js bringt AES-256-GCM-Verschlüsselung nativ mit — keine zusätzliche Abhängigkeit nötig.

**Warum Transaktionsübersicht direkt aus `WalletTransaction`?**
→ Die Tabelle existiert bereits mit allen nötigen Daten. Es werden nur die zwei neuen Felder `paymentProvider` + `externalPaymentId` ergänzt — kein neues Datenmodell für Transaktionen nötig.

**Warum Provider-Status gecacht (60 Sek.)?**
→ Die Wallet-Aufladeseite fragt ab, welche Provider aktiv sind (um Buttons anzuzeigen/zu verstecken). Ohne Cache würde das bei jedem Seitenaufruf eine DB-Abfrage auslösen.

---

### Neue Dateien & Routen

**Neue Seite:**
- `/admin/settings/payments/page.tsx` — Settings-Hauptseite

**Neue API-Routen:**
- `GET  /api/admin/settings/payments` — alle Provider-Configs laden (Keys maskiert)
- `PUT  /api/admin/settings/payments/[provider]` — Config für einen Provider speichern
- `POST /api/admin/settings/payments/[provider]/test` — Verbindungstest
- `GET  /api/admin/settings/payments/transactions` — Transaktionsübersicht
- `GET  /api/payments/providers/active` — welche Provider sind aktiv? (für Frontend-Cache)

**Neue Bibliotheks-Datei:**
- `lib/payment-config.ts` — Hilfsfunktionen: Keys verschlüsseln/entschlüsseln, aktive Provider laden

**Datenbank-Migration:**
- Neues Modell `PaymentProviderConfig` (s. oben)
- Neue Felder in `WalletTransaction`: `paymentProvider`, `externalPaymentId`

---

### Neue Packages

```
Keine neuen Packages für PROJ-14 nötig!
Node.js crypto (eingebaut) für AES-Verschlüsselung.
```

---

### Implementierungsreihenfolge

1. Prisma-Schema erweitern (PaymentProviderConfig + WalletTransaction Felder) + `prisma db push`
2. `lib/payment-config.ts` — Verschlüsselung & Provider-Laden
3. API-Routen: GET + PUT + Test + Transactions
4. `/api/payments/providers/active` — gecachte Status-API
5. Admin-UI: ProviderCards + MaskedKeyFields + TransactionTable
6. Sidebar-Eintrag ergänzen
