# 🍽️ Kantine Platform

Eine moderne Webplattform zur Verwaltung von mittelständischen Kantinen und Catering-Dienstleistern.

## 🚀 Features (Phase 1 - MVP)

- ✅ Multi-Location & White-Label Support
- ✅ Wöchentliche Essensplan-Erstellung und -Veröffentlichung
- ✅ Online-Bestellungen mit Zahlungsintegration
- ✅ QR-Code-Generierung zur Abholung
- ✅ Live-Dashboard für Küche (Bestellungen, Status, Abholzeiten)
- ✅ Benutzerverwaltung & Profile

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Datenbank**: PostgreSQL mit Prisma ORM
- **Authentication**: NextAuth.js (geplant)

## 📦 Installation

### Voraussetzungen

- Node.js 18+ und npm
- PostgreSQL Datenbank

### Setup

1. **Dependencies installieren:**
```bash
npm install
```

2. **Umgebungsvariablen konfigurieren:**
```bash
cp .env.example .env
```

Bearbeite `.env` und füge deine `DATABASE_URL` ein:
```
DATABASE_URL="postgresql://user:password@localhost:5432/kantine_platform?schema=public"
```

3. **Datenbank migrieren:**
```bash
npx prisma migrate dev
```

4. **Datenbank seeden (Beispieldaten):**
```bash
npm run db:seed
```

5. **Development Server starten:**
```bash
npm run dev
```

Die App läuft dann auf [http://localhost:3000](http://localhost:3000)

## 📁 Projektstruktur

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── menu/              # Essensplan-Seiten
│   └── kitchen/           # Küchen-Dashboard
├── components/            # React Components
├── lib/                   # Utilities & Prisma Client
├── prisma/               # Prisma Schema & Migrations
│   ├── schema.prisma     # Datenbank-Schema
│   └── seed.ts           # Seed-Daten
└── public/               # Statische Dateien
```

## 🗄️ Datenbank-Schema

Das Schema unterstützt:
- **Multi-Tenant**: Organisationen mit White-Label Support
- **Multi-Location**: Mehrere Standorte pro Organisation
- **Users**: Kunden, Küchenpersonal, Admins
- **Menus**: Wöchentliche Essenspläne
- **Dishes**: Gerichte mit Nährwerten (für Phase 2 vorbereitet)
- **Orders**: Bestellungen mit QR-Codes zur Abholung

## 🔮 Roadmap

### Phase 2 - Engagement
- Allergie-/Diätfilter
- Nährwertanzeige
- Bewertungen & Fotos
- Punkte-/Treueprogramm
- Push-Benachrichtigungen

### Phase 3 - Intelligence
- ML-basierte Nachfrageprognose
- Personalisierte Empfehlungen
- Analytics-Dashboard

### Phase 4 - Social & Advanced
- "Was essen Kollegen?" Feature
- Team-Bestellungen
- Challenges & Badges

## 📝 License

MIT
