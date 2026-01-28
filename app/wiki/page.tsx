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
                <button
                  onClick={() => toggleSection('design')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'design'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🎨 Design Guidelines
                </button>
                <button
                  onClick={() => toggleSection('wallet')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeSection === 'wallet'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  💰 Guthaben &amp; Wallet
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

            {/* Design Guidelines */}
            {activeSection === 'design' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  🎨 Design Guidelines
                </h2>
                <div className="prose max-w-none space-y-6">
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <p className="text-blue-800 font-medium">
                      📄 Vollständige Design-Guideline verfügbar in: <code className="bg-blue-100 px-2 py-1 rounded">DESIGN_GUIDELINES.md</code>
                    </p>
                  </div>
                  
                  <div>
                    <h3>Übersicht</h3>
                    <p className="text-gray-700">
                      Die Design Guidelines definieren konsistente Patterns, Farben, Typografie und Komponenten-Stile für die gesamte Kantine Platform.
                    </p>

                    <h3>Kernprinzipien</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Modern & Clean:</strong> Minimalistisches, aufgeräumtes Design</li>
                      <li><strong>Konsistenz:</strong> Einheitliche Patterns über die gesamte Plattform</li>
                      <li><strong>Accessibility:</strong> Barrierefreie Implementierung</li>
                      <li><strong>Responsive:</strong> Mobile-first Ansatz</li>
                      <li><strong>Performance:</strong> Optimierte Animationen</li>
                    </ul>

                    <h3>Farb-System</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
                      <div className="p-4 bg-green-600 text-white rounded-lg text-center">
                        <div className="font-bold">Kategorie</div>
                        <div className="text-sm">bg-green-600</div>
                      </div>
                      <div className="p-4 bg-blue-500 text-white rounded-lg text-center">
                        <div className="font-bold">FIT & VITAL</div>
                        <div className="text-sm">bg-blue-500</div>
                      </div>
                      <div className="p-4 bg-amber-100 text-amber-800 rounded-lg text-center border border-amber-300">
                        <div className="font-bold">Allergene</div>
                        <div className="text-sm">bg-amber-50</div>
                      </div>
                      <div className="p-4 bg-red-600 text-white rounded-lg text-center">
                        <div className="font-bold">Inaktiv</div>
                        <div className="text-sm">bg-destructive</div>
                      </div>
                    </div>

                    <h3>Card-Design</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Border-Radius:</strong> <code>rounded-2xl</code> (16px)</li>
                      <li><strong>Bild-Verhältnis:</strong> <code>aspect-[4/3]</code></li>
                      <li><strong>Hover-Effekt:</strong> <code>hover:shadow-2xl hover:scale-[1.02]</code></li>
                      <li><strong>Bild-Zoom:</strong> <code>group-hover:scale-110</code></li>
                      <li><strong>Padding:</strong> <code>p-4</code> (16px)</li>
                    </ul>

                    <h3>Badge-System</h3>
                    <div className="bg-gray-50 p-4 rounded-lg my-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md">KATEGORIE</span>
                          <span className="text-sm text-gray-600">Overlay-Badge (top-left)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">Vegan</span>
                          <span className="text-sm text-gray-600">Inline Diet-Tag</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">Allergen</span>
                          <span className="text-sm text-gray-600">Inline Allergen</span>
                        </div>
                      </div>
                    </div>

                    <h3>Typografie</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>H1:</strong> <code>text-4xl md:text-5xl font-bold</code></li>
                      <li><strong>H2:</strong> <code>text-3xl font-bold</code></li>
                      <li><strong>H3 (Card-Titel):</strong> <code>text-lg font-bold</code></li>
                      <li><strong>Body:</strong> <code>text-sm</code></li>
                      <li><strong>Muted:</strong> <code>text-sm text-muted-foreground</code></li>
                    </ul>

                    <h3>Layout-Patterns</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Grid:</strong> <code>grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6</code></li>
                      <li><strong>Header-Gradient:</strong> <code>bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50</code></li>
                      <li><strong>SVG-Welle:</strong> Wellenförmiger Untergrund für Header</li>
                    </ul>

                    <h3>Animationen</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Card Transition:</strong> <code>transition-all duration-300</code></li>
                      <li><strong>Bild Zoom:</strong> <code>transition-transform duration-500</code></li>
                      <li><strong>Fade-In:</strong> Staggered Animation mit <code>index * 0.05s</code> Delay</li>
                    </ul>

                    <h3>Best Practices</h3>
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
                      <h4 className="font-bold text-green-800 mb-2">✅ DO&apos;s</h4>
                      <ul className="list-disc list-inside space-y-1 text-green-700">
                        <li>Konsistente Badge-Farben verwenden</li>
                        <li>Hover-Effekte konsistent implementieren</li>
                        <li>Dark Mode immer berücksichtigen</li>
                        <li>Mobile-first Responsive Design</li>
                        <li>Semantisches HTML verwenden</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                      <h4 className="font-bold text-red-800 mb-2">❌ DON&apos;Ts</h4>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        <li>Inkonsistente Border-Radius verwenden</li>
                        <li>Ohne Dark Mode Support entwickeln</li>
                        <li>Zu viele Badges anzeigen (max. 2 Diet-Tags, 3 Allergene)</li>
                        <li>Ohne Hover-States implementieren</li>
                        <li>Inkonsistente Spacing verwenden</li>
                      </ul>
                    </div>

                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                      <h4 className="font-bold mb-2">📚 Weitere Informationen</h4>
                      <p className="text-sm text-gray-700">
                        Für detaillierte Spezifikationen, Code-Beispiele und vollständige Komponenten-Referenzen siehe die vollständige <code>DESIGN_GUIDELINES.md</code> Datei im Projekt-Root.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Guthaben & Wallet – Fachliche Dokumentation */}
            {activeSection === 'wallet' && (
              <section className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  💰 Guthaben &amp; Wallet
                </h2>
                <p className="text-gray-600 mb-6">
                  Fachliche Dokumentation des internen Guthaben-Systems: Geschäftslogik, Prozesse und Regeln aus Business-Sicht.
                </p>

                <div className="prose max-w-none space-y-6">
                  <div>
                    <h3>Übersicht und Zweck</h3>
                    <p className="text-gray-700">
                      Das <strong>Guthaben-System (Wallet)</strong> ist ein internes, bargeldloses Zahlungsmodell für die Kantine. Jeder registrierte Nutzer besitzt ein <em>Wallet</em> – ein Guthabenkonto in Euro. Bezahlung von Bestellungen erfolgt ausschließlich über dieses Guthaben; Bargeld oder externe Zahlungsmittel kommen dabei nicht zum Einsatz.
                    </p>
                    <p className="text-gray-700">
                      Ziel ist eine schlanke Abwicklung: Mitarbeiter laden ihr Konto auf (z. B. per Barzahlung oder Überweisung an die Kantine), und beim Bestellen wird der Betrag direkt vom Guthaben abgebucht. So entfallen Kassenvorgänge und Kleingeld an der Essensausgabe.
                    </p>
                  </div>

                  <div>
                    <h3>Rollen und Rechte</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Mitarbeiter / Kunde:</strong> Sieht nur das eigene Guthaben und die eigene Transaktionshistorie. Kann nicht selbst aufladen.</li>
                      <li><strong>Küchenpersonal:</strong> Wie Mitarbeiter – eigenes Guthaben einsehbar, keine Verwaltungsrechte.</li>
                      <li><strong>Kantinen-Manager / Admin:</strong> Darf Guthaben aufladen, alle Guthaben einsehen, Nutzer suchen/filtern sowie manuelle Korrekturen vornehmen (mit Pflichtangabe eines Grundes).</li>
                    </ul>
                    <p className="text-gray-700 mt-2">
                      Gäste (nicht eingeloggt) haben keinen Zugriff auf Guthaben oder Wallet-Funktionen.
                    </p>
                  </div>

                  <div>
                    <h3>Auflade-Prozess</h3>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li>Mitarbeiter zahlt <strong>bar</strong> an der Kasse oder <strong>überweist</strong> auf das Konto der Kantine.</li>
                      <li>Ein Manager oder Admin loggt sich ins Admin-Panel ein und öffnet <strong>Guthaben aufladen</strong>.</li>
                      <li>Er wählt den Nutzer (z. B. per E-Mail), gibt den <strong>Aufladebetrag</strong> ein (min. 5 €, max. 200 € pro Vorgang) und optional eine <strong>Notiz</strong> (z. B. „Barzahlung 24.01.2026“).</li>
                      <li>Nach Bestätigung wird das Guthaben <strong>sofort</strong> dem Konto gutgeschrieben. Der Mitarbeiter kann damit direkt bestellen.</li>
                    </ol>
                    <p className="text-gray-700 mt-2">
                      Für höhere Beträge als 200 € sind mehrere Aufladungen nötig. Eine Aufladung durch den Nutzer selbst (z. B. per Karte) ist im aktuellen Modell nicht vorgesehen; das bleibt ggf. späteren Erweiterungen vorbehalten.
                    </p>
                  </div>

                  <div>
                    <h3>Bezahlung bei der Bestellung</h3>
                    <p className="text-gray-700">
                      Beim Absenden einer Bestellung wird zuerst geprüft, ob das Guthaben für den zu zahlenden Betrag (nach Coupons und ggf. Arbeitgeber-Zuschuss) ausreicht.
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
                      <li><strong>Guthaben reicht nicht:</strong> Die Bestellung wird abgelehnt. Der Nutzer erhält eine klare Meldung, wie viel verfügbar ist und wie viel benötigt wird (z. B. „Verfügbar: 3,50 €, Benötigt: 5,00 €“).</li>
                      <li><strong>Guthaben reicht:</strong> Der Betrag wird vom Wallet <strong>atomar</strong> abgebucht: Guthabenänderung und Anlegen der Bestellung laufen in einem gemeinsamen Schritt. Gelingt einer der Teilschritte nicht, wird beides zurückgerollt – es gibt keine Bestellung ohne Abbuchung und keine Abbuchung ohne Bestellung.</li>
                    </ul>
                    <p className="text-gray-700 mt-2">
                      <strong>Negatives Guthaben</strong> ist nicht erlaubt. Die Bestellung kann nur durchgehen, wenn das Konto nach der Abbuchung immer noch &ge; 0 € ist. Das neue Guthaben wird auf der Bestellbestätigung angezeigt und im Header-Widget aktualisiert.
                    </p>
                  </div>

                  <div>
                    <h3>Transaktionstypen und Historie</h3>
                    <p className="text-gray-700">
                      Jede Änderung am Guthaben wird als <strong>Transaktion</strong> festgehalten. Es gibt vier Typen:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 mt-2">
                      <li><strong>Aufladung (Gutschrift):</strong> Admin hat Guthaben hinzugefügt. Optional mit Notiz.</li>
                      <li><strong>Bestellzahlung (Abbuchung):</strong> Bezahlung einer Bestellung. Verknüpft mit der Bestellreferenz.</li>
                      <li><strong>Erstattung (Gutschrift):</strong> Rückbuchung z. B. bei Stornierung einer Bestellung.</li>
                      <li><strong>Admin-Anpassung:</strong> Manuelle Korrektur (Plus oder Minus). Ein <strong>Grund</strong> ist Pflicht und wird mitgespeichert.</li>
                    </ul>
                    <p className="text-gray-700 mt-2">
                      Transaktionen sind <strong>unveränderbar</strong>. Falsche Buchungen werden nicht gelöscht oder überschrieben, sondern durch eine neue <em>Anpassungs-Transaktion</em> korrigiert. So bleibt die Historie für Prüfungen und Audit nachvollziehbar.
                    </p>
                    <p className="text-gray-700 mt-2">
                      Nutzer sehen ihre Historie auf der <strong>Wallet-Historie</strong>-Seite (Filter nach Typ, Datumsbereich; Paginierung). Darstellung: Gutschriften grün, Abbuchungen rot; jeweils mit Betrag, Guthaben danach und Beschreibung.
                    </p>
                  </div>

                  <div>
                    <h3>Anzeigen für den Nutzer</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Header:</strong> Aktuelles Guthaben (z. B. „Guthaben: 25,50 €“), klickbar zur Wallet-Übersicht.</li>
                      <li><strong>Hinweise:</strong> Bei Guthaben unter 5 € bzw. bei 0 € erscheinen Warnhinweise („Guthaben niedrig“ / „Kein Guthaben – bitte aufladen“).</li>
                      <li><strong>Wallet-Seite:</strong> Guthaben prominent, Status (Normal / Niedrig / Kein Guthaben), Link zur Transaktionshistorie.</li>
                      <li><strong>Checkout:</strong> Hinweis, dass die Zahlung per Guthaben erfolgt; bei unzureichendem Guthaben wird die Bestellung abgelehnt.</li>
                      <li><strong>Bestellbestätigung:</strong> Zeigt das neue Guthaben nach erfolgreicher Zahlung.</li>
                    </ul>
                  </div>

                  <div>
                    <h3>Admin: Guthaben verwalten</h3>
                    <p className="text-gray-700">
                      Unter <strong>Guthaben aufladen</strong> wählt der Admin den Nutzer, gibt Betrag und ggf. Notiz ein und bucht gut. Unter <strong>Guthaben verwalten</strong> sieht er alle Nutzer mit aktuellem Guthaben, kann suchen, nach Guthaben sortieren und Filter nutzen (z. B. „niedrig“, „null“). Pro Nutzer sind Schnellaktionen wie „Aufladen“ und Zugriff auf die Transaktionshistorie möglich. Manuelle Anpassungen sind nur mit Begründung erlaubt und werden protokolliert.
                    </p>
                  </div>

                  <div>
                    <h3>Wichtige Regeln und Grenzfälle</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      <li><strong>Kein negatives Guthaben:</strong> Weder durch Bestellung noch durch Anpassung. Bei Anpassung wird geprüft, dass das Guthaben danach nicht negativ wird.</li>
                      <li><strong>Gleichzeitige Aktionen:</strong> Mehrere Bestellungen oder Aufladungen gleichzeitig werden technisch so verarbeitet, dass keine „Race Conditions“ entstehen – jeder Vorgang sieht einen konsistenten Guthabenstand.</li>
                      <li><strong>Fehler bei Abbuchung:</strong> Schlägt die Abbuchung oder die Bestell-Anlage fehl, wird die komplette Aktion rückgängig gemacht. Es entsteht weder eine Bestellung ohne Bezahlung noch eine Abbuchung ohne Bestellung.</li>
                      <li><strong>Betrag 0 €:</strong> Ist der Endbetrag einer Bestellung 0 € (z. B. durch Coupon oder Arbeitgeber-Zuschuss), wird kein Guthaben abgebucht; die Bestellung wird trotzdem erfasst und per Wallet abgerechnet.</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
                    <h4 className="font-bold text-blue-800 mb-2">Technischer Kurzüberblick</h4>
                    <p className="text-blue-800 text-sm">
                      Jeder Nutzer hat genau ein Wallet (Guthabenkonto). Änderungen laufen über Transaktionen; jede Transaktion speichert Typ, Betrag, Guthaben vorher/nachher, Beschreibung und ggf. Bestell- oder Admin-Referenz. Abbuchungen bei Bestellungen sind in dieselbe Datenbank-Transaktion wie die Bestell-Anlage eingebettet (atomar). Transaktionen sind append-only (kein Update/Delete); Korrekturen nur über neue Anpassungs-Transaktionen.
                    </p>
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
