# <} Kantine Platform

Eine moderne, vollst�ndig funktionsf�hige Webplattform zur Verwaltung von mittelst�ndischen Kantinen und Catering-Dienstleistern. Die Plattform bietet eine intuitive Benutzeroberfl�che f�r Kunden, ein leistungsstarkes Admin-Panel und ein Live-Dashboard f�r K�chenpersonal.

---

## =� Inhaltsverzeichnis

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Projektstruktur](#-projektstruktur)
- [Datenbank-Schema](#-datenbank-schema)
- [API Dokumentation](#-api-dokumentation)
- [Authentifizierung](#-authentifizierung)
- [Roadmap](#-roadmap)
- [Lizenz](#-lizenz)

---

## ( Features

### <� Kernfunktionalit�ten

-  **Multi-Location & White-Label Support**  
  Unterst�tzung mehrerer Standorte pro Organisation mit individueller Branding-M�glichkeit

-  **W�chentliche Essensplan-Erstellung**  
  Intuitiver Drag & Drop Editor f�r die Erstellung von Wochenpl�nen mit visueller Duplikatserkennung

-  **Online-Bestellungen**  
  Vollst�ndiger Bestellprozess mit Warenkorb, Coupon-Einl�sung und Bestellbest�tigung

-  **QR-Code-System**  
  Automatische Generierung eindeutiger QR-Codes zur Abholung von Bestellungen

-  **Live-K�chen-Dashboard**  
  Echtzeit-�bersicht �ber Bestellungen mit Status-Management und Auto-Refresh

-  **Benutzerverwaltung & Profile**  
  Rollenbasierte Zugriffskontrolle (Kunde, K�chenpersonal, Admin, Super Admin)

-  **Coupon-Engine**  
  Flexible Gutschein-Verwaltung mit zeitlichen Einschr�nkungen und Nutzungslimits

-  **Metadata-Management**  
  Dynamische Verwaltung von Di�tkategorien, Allergenen und Gerichtkategorien

-  **Analytics-Dashboard**  
  �bersicht �ber Ums�tze, beliebte Gerichte und Bestellstatistiken

---

## =� Tech Stack

### Frontend
- **Next.js 14** - React Framework mit App Router
- **TypeScript** - Typsichere Entwicklung
- **Tailwind CSS** - Utility-first CSS Framework
- **Chakra UI** - Komponenten-Bibliothek f�r moderne UIs
- **@dnd-kit** - Drag & Drop Funktionalit�t
- **Radix UI** - Unstyled, zug�ngliche UI-Komponenten
- **Framer Motion** - Animationen
- **Lucide React** - Icon-Bibliothek

### Backend
- **Next.js API Routes** - Serverless API-Endpunkte
- **Prisma ORM** - Type-safe Datenbankzugriff
- **PostgreSQL** - Relationale Datenbank
- **NextAuth.js** - Authentifizierung & Session-Management
- **Zod** - Schema-Validierung
- **bcryptjs** - Passwort-Hashing

### Tools & Utilities
- **date-fns** - Datums-Manipulation
- **qrcode** - QR-Code-Generierung
- **recharts** - Datenvisualisierung
- **react-hook-form** - Formular-Management

---

## =� Installation

### Voraussetzungen

- **Node.js** 18+ und npm
- **PostgreSQL** Datenbank (lokal oder remote)
- **Git** (optional, f�r Versionskontrolle)

### Schritt-f�r-Schritt Setup

#### 1. Repository klonen oder herunterladen

```bash
git clone <repository-url>
cd cursor_test
```

#### 2. Dependencies installieren

```bash
npm install
```

#### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Projektroot:

```bash
cp .env.example .env
```

Bearbeite `.env` und f�ge folgende Variablen ein:

```env
# Datenbank
DATABASE_URL="postgresql://user:password@localhost:5432/kantine_platform?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ein-sicherer-random-string-hier"
```

**NEXTAUTH_SECRET generieren:**

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### 4. Datenbank migrieren

```bash
npm run db:migrate
```

#### 5. Datenbank seeden (Beispieldaten)

```bash
npm run db:seed
```

Dies erstellt:
- Demo-Organisationen und Standorte
- Test-Benutzer (Kunde, K�chenpersonal, Admin)
- Beispiel-Gerichte und Men�s
- Initiale Metadata-Eintr�ge

#### 6. Development Server starten

```bash
npm run dev
```

Die Anwendung l�uft dann auf [http://localhost:3000](http://localhost:3000)

---

## =� Projektstruktur

```
kantine-platform/
