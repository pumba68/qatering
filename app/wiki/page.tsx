'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function WikiPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 Dokumentation & Wiki
          </h1>
          <p className="text-gray-600">
            Vollständige Dokumentation aller Implementierungen und Features
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Inhaltsverzeichnis
              </h2>
              <nav className="space-y-2">
                <button
                  onClick={() => toggleSection('overview')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  📋 Projekt-Übersicht
                </button>
                <button
                  onClick={() => toggleSection('phase1')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'phase1'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ✅ Phase 1 - MVP
                </button>
                <button
                  onClick={() => toggleSection('auth')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'auth'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🔐 Authentifizierung
                </button>
                <button
                  onClick={() => toggleSection('architecture')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'architecture'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🏗️ Architektur
                </button>
                <button
                  onClick={() => toggleSection('api')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'api'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🔌 API Dokumentation
                </button>
                <button
                  onClick={() => toggleSection('database')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'database'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🗄️ Datenbank-Schema
                </button>
                <button
                  onClick={() => toggleSection('setup')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'setup'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🚀 Setup & Installation
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Projekt-Übersicht */}
            {(activeSection === 'overview' || activeSection === null) && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  📋 Projekt-Übersicht
                </h2>
                <div className="prose max-w-none">
                  <h3>🍽️ Kantine Platform</h3>
                  <p className="text-lg text-gray-700 mb-4">
                    Eine moderne Webplattform zur Verwaltung von mittelständischen Kantinen und Catering-Dienstleistern.
                  </p>

                  <h4>🚀 Features (Phase 1 - MVP)</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>✅ Multi-Location & White-Label Support</li>
                    <li>✅ Wöchentliche Essensplan-Erstellung und -Veröffentlichung</li>
                    <li>✅ Online-Bestellungen mit Zahlungsintegration</li>
                    <li>✅ QR-Code-Generierung zur Abholung</li>
                    <li>✅ Live-Dashboard für Küche (Bestellungen, Status, Abholzeiten)</li>
                    <li>✅ Benutzerverwaltung & Profile</li>
                    <li>✅ Vollständige Authentifizierung mit NextAuth.js</li>
                  </ul>

                  <h4>🛠️ Tech Stack</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li><strong>Frontend:</strong> Next.js 14, TypeScript, Tailwind CSS</li>
                    <li><strong>Backend:</strong> Next.js API Routes</li>
                    <li><strong>Datenbank:</strong> PostgreSQL mit Prisma ORM</li>
                    <li><strong>Authentication:</strong> NextAuth.js</li>
                    <li><strong>Styling:</strong> Tailwind CSS</li>
                  </ul>

                  <h4>📁 Projektstruktur</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
{`kantine-platform/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── menu/              # Essensplan-Seiten
│   ├── kitchen/           # Küchen-Dashboard
│   ├── login/             # Login-Seite
│   ├── register/          # Registrierung
│   └── wiki/              # Dokumentation
├── components/            # React Components
├── lib/                   # Utilities & Prisma Client
├── prisma/               # Prisma Schema & Migrations
└── public/               # Statische Dateien`}
                  </pre>
                </div>
              </section>
            )}

            {/* Phase 1 Dokumentation */}
            {activeSection === 'phase1' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  ✅ Phase 1 - MVP Zusammenfassung
                </h2>
                <div className="prose max-w-none space-y-6">
                  <div>
                    <h3>Abgeschlossene Features</h3>
                    <h4>1. Projekt-Setup ✅</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Next.js 14 mit TypeScript und App Router</li>
                      <li>Tailwind CSS für modernes UI</li>
                      <li>Prisma ORM für Datenbankzugriff</li>
                      <li>PostgreSQL als Datenbank</li>
                    </ul>

                    <h4>2. Datenbank-Schema ✅</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Multi-Tenant Support:</strong> Organisationen mit White-Label-Slug</li>
                      <li><strong>Multi-Location:</strong> Mehrere Standorte pro Organisation</li>
                      <li><strong>Users:</strong> Rollen (CUSTOMER, KITCHEN_STAFF, ADMIN, SUPER_ADMIN)</li>
                      <li><strong>Menus:</strong> Wöchentliche Essenspläne (KW-basiert)</li>
                      <li><strong>Dishes:</strong> Gerichte mit Nährwerten (für Phase 2 vorbereitet)</li>
                      <li><strong>Orders:</strong> Bestellungen mit QR-Codes</li>
                      <li><strong>NextAuth.js Models:</strong> Für Authentifizierung</li>
                    </ul>

                    <h4>3. API Routes ✅</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><code>GET /api/menus</code> - Aktuellen Essensplan abrufen</li>
                      <li><code>POST /api/orders</code> - Neue Bestellung erstellen</li>
                      <li><code>GET /api/orders</code> - Bestellungen mit Filtern abrufen</li>
                      <li><code>GET /api/orders/[orderId]</code> - Einzelne Bestellung abrufen</li>
                      <li><code>PATCH /api/orders/[orderId]</code> - Bestellstatus aktualisieren</li>
                      <li><code>GET /api/orders/qr/[code]</code> - Bestellung per QR-Code abrufen</li>
                    </ul>

                    <h4>4. Kunden-Frontend ✅</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><code>/menu</code> - Essensplan-Ansicht mit wöchentlicher Übersicht</li>
                      <li><strong>Warenkorb-Funktionalität</strong> - Items hinzufügen/entfernen</li>
                      <li><strong>Bestellformular</strong> - Abholdatum auswählen, Notizen hinzufügen</li>
                      <li><code>/order/confirmation/[orderId]</code> - Bestellbestätigung mit QR-Code</li>
                    </ul>

                    <h4>5. QR-Code-System ✅</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Automatische Generierung eindeutiger 8-stelliger Codes</li>
                      <li>QR-Code-Anzeige in Bestellbestätigung</li>
                      <li>QR-Code-Lookup per API</li>
                    </ul>

                    <h4>6. Küchen-Dashboard ✅</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><code>/kitchen/dashboard</code> - Live-Bestellungsübersicht</li>
                      <li><strong>Status-Management:</strong> PENDING → CONFIRMED → PREPARING → READY → PICKED_UP</li>
                      <li><strong>Filter & Sortierung:</strong> Nach Datum, Status</li>
                      <li><strong>Live-Updates:</strong> Auto-Refresh alle 30 Sekunden</li>
                      <li><strong>Statistiken:</strong> Übersicht über Bestellungsstatus</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Auth Dokumentation */}
            {activeSection === 'auth' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🔐 Authentifizierung - Setup und Verwendung
                </h2>
                <div className="prose max-w-none space-y-6">
                  <div>
                    <h3>Implementierte Features</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>✅ NextAuth.js Integration mit Credentials Provider</li>
                      <li>✅ JWT-basierte Sessions</li>
                      <li>✅ Ansprechende Login- und Registrierungsseiten</li>
                      <li>✅ Password-Hashing mit bcryptjs</li>
                      <li>✅ Role-basierte Zugriffskontrolle</li>
                      <li>✅ Protected Routes mit Middleware</li>
                    </ul>

                    <h3>Test-Accounts (nach Seeding)</h3>
                    <div className="bg-gray-100 p-4 rounded-lg my-4">
                      <p><strong>Kunde:</strong></p>
                      <ul className="list-none space-y-1">
                        <li>Email: <code>kunde@demo.de</code></li>
                        <li>Passwort: <code>demo123</code></li>
                        <li>Rolle: CUSTOMER</li>
                      </ul>
                      <p className="mt-3"><strong>Küchenpersonal:</strong></p>
                      <ul className="list-none space-y-1">
                        <li>Email: <code>kueche@demo.de</code></li>
                        <li>Passwort: <code>kueche123</code></li>
                        <li>Rolle: KITCHEN_STAFF</li>
                      </ul>
                    </div>

                    <h3>Geschützte Routen</h3>
                    <p>Folgende Routen sind geschützt (erfordern Login):</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><code>/menu</code> - Essensplan & Bestellungen</li>
                      <li><code>/kitchen/*</code> - Küchen-Dashboard (zusätzlich KITCHEN_STAFF/ADMIN-Rolle erforderlich)</li>
                    </ul>

                    <h3>Verwendung im Code</h3>
                    <h4>Client-Side (React Components)</h4>
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Lädt...</div>
  if (!session) return <div>Nicht angemeldet</div>
  
  const userId = (session.user as any).id
  const userRole = (session.user as any).role
  
  return <div>Hallo {session.user?.name}!</div>
}`}
                    </pre>

                    <h4>Server-Side (API Routes)</h4>
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const userId = (session.user as any).id
}`}
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {/* Architektur */}
            {activeSection === 'architecture' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🏗️ System-Architektur
                </h2>
                <div className="prose max-w-none space-y-6">
                  <div>
                    <h3>Technologie-Stack</h3>
                    <h4>Frontend</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Next.js 14+</strong> - React Framework mit App Router</li>
                      <li><strong>TypeScript</strong> - Type-Safety</li>
                      <li><strong>Tailwind CSS</strong> - Utility-First CSS Framework</li>
                      <li><strong>React Hooks</strong> - State Management</li>
                    </ul>

                    <h4>Backend</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Next.js API Routes</strong> - Serverless API-Endpunkte</li>
                      <li><strong>Prisma ORM</strong> - Type-safe Datenbankzugriff</li>
                      <li><strong>PostgreSQL</strong> - Relationale Datenbank</li>
                      <li><strong>NextAuth.js</strong> - Authentifizierung</li>
                    </ul>

                    <h3>Datenfluss</h3>
                    <div className="bg-gray-100 p-4 rounded-lg my-4">
                      <p className="mb-2"><strong>Bestellprozess:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Benutzer meldet sich an (NextAuth)</li>
                        <li>Menüplan wird geladen (GET /api/menus)</li>
                        <li>Gerichte werden zum Warenkorb hinzugefügt (Client-State)</li>
                        <li>Bestellung wird aufgegeben (POST /api/orders)</li>
                        <li>QR-Code wird generiert und gespeichert</li>
                        <li>Bestätigungsseite mit QR-Code wird angezeigt</li>
                        <li>Küche aktualisiert Status im Dashboard</li>
                      </ol>
                    </div>

                    <h3>Multi-Tenant Architektur</h3>
                    <p className="text-gray-700">
                      Die Plattform unterstützt mehrere Organisationen mit eigenen Standorten:
                    </p>
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`Organization (White-Label)
  └── Location 1
      ├── Menus
      ├── Orders
      └── Users
  └── Location 2
      ├── Menus
      ├── Orders
      └── Users`}
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {/* API Dokumentation */}
            {activeSection === 'api' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🔌 API Dokumentation
                </h2>
                <div className="prose max-w-none space-y-6">
                  <div>
                    <h3>Authentication Endpoints</h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4><code>POST /api/auth/register</code></h4>
                        <p className="text-sm text-gray-600">Neuen Benutzer registrieren</p>
                        <p className="text-sm"><strong>Body:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs">{`{ email, password, name }`}</pre>
                      </div>
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4><code>POST /api/auth/[...nextauth]</code></h4>
                        <p className="text-sm text-gray-600">NextAuth.js Authentication Handler</p>
                      </div>
                    </div>

                    <h3>Menu Endpoints</h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4><code>GET /api/menus?locationId=xxx</code></h4>
                        <p className="text-sm text-gray-600">Aktuellen Essensplan für eine Location abrufen</p>
                        <p className="text-sm"><strong>Query:</strong> <code>locationId</code></p>
                      </div>
                    </div>

                    <h3>Order Endpoints</h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4><code>POST /api/orders</code></h4>
                        <p className="text-sm text-gray-600">Neue Bestellung erstellen (Auth erforderlich)</p>
                        <p className="text-sm"><strong>Body:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs">{`{
  locationId: string,
  items: [{ menuItemId, quantity }],
  pickupDate: string (ISO),
  notes?: string
}`}</pre>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4><code>GET /api/orders</code></h4>
                        <p className="text-sm text-gray-600">Bestellungen abrufen</p>
                        <p className="text-sm"><strong>Query:</strong> <code>userId</code>, <code>locationId</code>, <code>status</code>, <code>pickupDate</code></p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4><code>GET /api/orders/[orderId]</code></h4>
                        <p className="text-sm text-gray-600">Einzelne Bestellung abrufen</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4><code>PATCH /api/orders/[orderId]</code></h4>
                        <p className="text-sm text-gray-600">Bestellstatus aktualisieren</p>
                        <p className="text-sm"><strong>Body:</strong></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs">{`{ status?: string, paymentStatus?: string }`}</pre>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4><code>GET /api/orders/qr/[code]</code></h4>
                        <p className="text-sm text-gray-600">Bestellung per QR-Code abrufen</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Datenbank-Schema */}
            {activeSection === 'database' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🗄️ Datenbank-Schema
                </h2>
                <div className="prose max-w-none space-y-6">
                  <div>
                    <h3>Haupt-Entitäten</h3>
                    <div className="space-y-4">
                      <div>
                        <h4>Organization</h4>
                        <p className="text-sm text-gray-600">Multi-Tenant: Organisationen mit White-Label Support</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          <li><code>id</code>, <code>name</code>, <code>slug</code>, <code>logoUrl</code></li>
                          <li><code>primaryColor</code>, <code>secondaryColor</code></li>
                        </ul>
                      </div>
                      <div>
                        <h4>Location</h4>
                        <p className="text-sm text-gray-600">Standorte (Multi-Location Support)</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          <li><code>id</code>, <code>organizationId</code>, <code>name</code>, <code>address</code></li>
                          <li><code>openingHours</code> (JSON), <code>isActive</code></li>
                        </ul>
                      </div>
                      <div>
                        <h4>User</h4>
                        <p className="text-sm text-gray-600">Benutzer mit Rollen</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          <li><code>id</code>, <code>email</code>, <code>name</code>, <code>passwordHash</code></li>
                          <li><code>role</code> (CUSTOMER, KITCHEN_STAFF, ADMIN, SUPER_ADMIN)</li>
                          <li><code>organizationId</code></li>
                        </ul>
                      </div>
                      <div>
                        <h4>Menu</h4>
                        <p className="text-sm text-gray-600">Wöchentliche Essenspläne</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          <li><code>id</code>, <code>locationId</code>, <code>weekNumber</code>, <code>year</code></li>
                          <li><code>startDate</code>, <code>endDate</code>, <code>isPublished</code></li>
                        </ul>
                      </div>
                      <div>
                        <h4>Dish</h4>
                        <p className="text-sm text-gray-600">Gerichte (Master-Daten)</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          <li><code>id</code>, <code>name</code>, <code>description</code>, <code>imageUrl</code></li>
                          <li><code>calories</code>, <code>protein</code>, <code>carbs</code>, <code>fat</code></li>
                          <li><code>allergens[]</code>, <code>dietTags[]</code> (für Phase 2)</li>
                        </ul>
                      </div>
                      <div>
                        <h4>Order</h4>
                        <p className="text-sm text-gray-600">Bestellungen</p>
                        <ul className="list-disc list-inside text-sm text-gray-700">
                          <li><code>id</code>, <code>userId</code>, <code>locationId</code></li>
                          <li><code>status</code> (PENDING, CONFIRMED, PREPARING, READY, PICKED_UP)</li>
                          <li><code>totalAmount</code>, <code>paymentStatus</code></li>
                          <li><code>pickupCode</code> (QR-Code), <code>pickupDate</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Setup & Installation */}
            {activeSection === 'setup' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🚀 Setup & Installation
                </h2>
                <div className="prose max-w-none space-y-6">
                  <div>
                    <h3>Voraussetzungen</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li>Node.js 18+ und npm</li>
                      <li>PostgreSQL Datenbank</li>
                      <li>Git (optional)</li>
                    </ul>

                    <h3>Installation</h3>
                    <div className="bg-gray-100 p-4 rounded-lg my-4">
                      <h4>1. Dependencies installieren</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2">npm install</pre>

                      <h4 className="mt-4">2. Umgebungsvariablen konfigurieren</h4>
                      <p className="text-sm">Erstelle eine <code>.env</code> Datei im Root-Verzeichnis:</p>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 text-sm">{`DATABASE_URL="postgresql://user:password@localhost:5432/kantine_platform?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generiere-einen-sicheren-random-string"
NODE_ENV="development"`}</pre>

                      <h4 className="mt-4">3. Datenbank migrieren</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2">npm run db:migrate</pre>

                      <h4 className="mt-4">4. Seed-Daten laden (optional)</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2">npm run db:seed</pre>

                      <h4 className="mt-4">5. Development Server starten</h4>
                      <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2">npm run dev</pre>
                    </div>

                    <h3>NEXTAUTH_SECRET generieren</h3>
                    <p className="text-gray-700">
                      Für die Produktion sollte ein sicherer Secret generiert werden:
                    </p>
                    <pre className="bg-gray-100 p-3 rounded text-sm">openssl rand -base64 32</pre>

                    <h3>Nützliche Befehle</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><code>npm run dev</code> - Development Server starten</li>
                      <li><code>npm run build</code> - Produktions-Build erstellen</li>
                      <li><code>npm run start</code> - Produktions-Server starten</li>
                      <li><code>npm run db:studio</code> - Prisma Studio öffnen (Datenbank-Editor)</li>
                      <li><code>npm run db:generate</code> - Prisma Client generieren</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
