# 🔐 Authentifizierung - Setup und Verwendung

## ✅ Was wurde implementiert

### 1. NextAuth.js Integration ✅
- Credentials Provider für Email/Passwort-Authentifizierung
- JWT-basierte Sessions
- Prisma Adapter für Session-Speicherung

### 2. Login-Seite ✅
- Modernes, ansprechendes UI mit Gradient-Hintergrund
- Form-Validierung
- Fehlerbehandlung
- Redirect nach erfolgreichem Login

### 3. Registrierungsseite ✅
- Vollständiges Registrierungsformular
- Passwort-Validierung (mind. 6 Zeichen)
- Passwort-Bestätigung
- Automatische Weiterleitung zum Login

### 4. Navigation & UI ✅
- Navbar mit Session-Status
- User-Menü mit Name/Email
- Logout-Funktionalität
- Role-basierte Navigation (Küchen-Dashboard nur für KITCHEN_STAFF/ADMIN)

### 5. API-Integration ✅
- Bestell-API verwendet jetzt echte Session-basierte User-IDs
- Auth-Middleware für geschützte Routes
- Session-Helper-Funktionen

## 🔧 Setup-Anleitung

### 1. Dependencies installieren
```bash
npm install
```

### 2. Umgebungsvariablen
Stelle sicher, dass in `.env` folgende Variablen gesetzt sind:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ein-sicherer-random-string-hier"
```

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```

### 3. Datenbank migrieren und seeden
```bash
npm run db:migrate
npm run db:seed
```

## 👤 Test-Accounts

Nach dem Seeding stehen folgende Test-Accounts zur Verfügung:

### Kunde:
- **Email:** `kunde@demo.de`
- **Passwort:** `demo123`
- **Rolle:** CUSTOMER

### Küchenpersonal:
- **Email:** `kueche@demo.de`
- **Passwort:** `kueche123`
- **Rolle:** KITCHEN_STAFF

## 📁 Wichtige Dateien

### Auth-Konfiguration
- `app/api/auth/[...nextauth]/route.ts` - NextAuth Konfiguration
- `lib/auth.ts` - Password-Hashing (bcryptjs)
- `lib/auth-helpers.ts` - Server-Side Auth-Helper

### Frontend-Komponenten
- `app/login/page.tsx` - Login-Seite
- `app/register/page.tsx` - Registrierungsseite
- `components/layout/Navbar.tsx` - Navigation mit Auth-Status
- `components/auth/SessionProvider.tsx` - NextAuth Session Provider

### Protected Routes
- `middleware.ts` - Middleware für geschützte Routes (`/kitchen/*`, `/menu`)

## 🔒 Geschützte Routen

Folgende Routen sind geschützt (erfordern Login):
- `/menu` - Essensplan & Bestellungen
- `/kitchen/*` - Küchen-Dashboard (zusätzlich KITCHEN_STAFF/ADMIN-Rolle erforderlich)

## 🚀 Verwendung im Code

### Client-Side (React Components)
```typescript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Lädt...</div>
  if (!session) return <div>Nicht angemeldet</div>
  
  const userId = (session.user as any).id
  const userRole = (session.user as any).role
  
  return <div>Hallo {session.user?.name}!</div>
}
```

### Server-Side (API Routes)
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const userId = (session.user as any).id
  // ...
}
```

### Server-Side (Server Components)
```typescript
import { requireAuth, requireRole } from '@/lib/auth-helpers'

export default async function ProtectedPage() {
  const user = await requireAuth() // Redirects zu /login wenn nicht angemeldet
  const admin = await requireRole(['ADMIN']) // Zusätzliche Role-Prüfung
  
  return <div>Geschützter Content</div>
}
```

## 🎨 Design-Features

- **Gradient-Hintergründe:** Moderne Farbverläufe auf Login/Register
- **Glassmorphism:** Transparente Elemente mit Schatten
- **Hover-Effekte:** Smooth Transitions
- **Loading-States:** Spinner während API-Calls
- **Responsive:** Mobile-First Design

## 🔐 Sicherheit

- Passwörter werden mit bcryptjs gehasht (12 Rounds)
- JWT-Tokens für Session-Management
- CSRF-Protection durch NextAuth
- Secure HTTP-Only Cookies

## 📝 Nächste Schritte

- [ ] Email-Verifizierung implementieren
- [ ] Passwort-Reset-Funktionalität
- [ ] OAuth-Provider (Google, GitHub) hinzufügen
- [ ] 2FA (Two-Factor Authentication)
- [ ] Session-Management-Dashboard
