'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const MermaidDiagram = dynamic(
  () => import('@/components/wiki/MermaidDiagram').then((m) => m.MermaidDiagram),
  { ssr: false, loading: () => <div className="rounded-xl border border-border/50 bg-muted/30 p-8 text-center text-muted-foreground">Diagramm wird geladen…</div> }
)

const SECTIONS = [
  { id: 'purpose', label: 'Zweck der Plattform', icon: '🎯' },
  { id: 'overview', label: 'Projekt-Übersicht', icon: '📋' },
  { id: 'features', label: 'Features (aktueller Stand)', icon: '✨' },
  { id: 'techstack', label: 'Tech Stack', icon: '🛠️' },
  { id: 'architecture', label: 'Architektur', icon: '🏗️' },
  { id: 'userflows', label: 'Nutzer & Abläufe', icon: '👤' },
  { id: 'admin', label: 'Admin-Bereich', icon: '⚙️' },
  { id: 'auth', label: 'Authentifizierung', icon: '🔐' },
  { id: 'api', label: 'API-Übersicht', icon: '🔌' },
  { id: 'database', label: 'Datenbank-Schema', icon: '🗄️' },
  { id: 'wallet', label: 'Guthaben & Wallet', icon: '💰' },
  { id: 'promotions', label: 'Promotions', icon: '🏷️' },
  { id: 'design', label: 'Design Guidelines', icon: '🎨' },
  { id: 'setup', label: 'Setup & Installation', icon: '🚀' },
] as const

export default function WikiPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const defaultSection = 'purpose'
  const show = (id: string) => activeSection === id || (activeSection === null && id === defaultSection)

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-muted/10">
      <header className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
            📚 Dokumentation & Wiki
          </h1>
          <p className="text-muted-foreground text-lg">
            Technischer und fachlicher Überblick über die Kantine Platform – für neue Nutzer und Entwickler.
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <nav className="bg-card rounded-2xl border border-border/50 p-4 sticky top-4 space-y-1">
              <h2 className="text-sm font-semibold text-foreground mb-3 px-2">
                Inhaltsverzeichnis
              </h2>
              {SECTIONS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(activeSection === id ? null : id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeSection === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="lg:col-span-3 space-y-6">
            {/* Zweck der Plattform */}
            {show('purpose') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🎯 Zweck der Plattform</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-foreground leading-relaxed mb-4">
                    Die <strong>Kantine Platform</strong> ist eine webbasierte Lösung für mittelständische Kantinen und Catering-Dienstleister. Sie verbindet Essensplanung, Bestellabwicklung und Küchensteuerung an einem Ort.
                  </p>
                  <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Für wen ist die Plattform?</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li><strong>Mitarbeiter / Gäste:</strong> Speiseplan einsehen, Gerichte in den Warenkorb legen, per Guthaben (Wallet) bezahlen, QR-Code zur Abholung erhalten.</li>
                    <li><strong>Küchenpersonal:</strong> Bestellungen live sehen, Status setzen (z. B. „In Zubereitung“, „Abholbereit“), Abholcodes prüfen.</li>
                    <li><strong>Kantinen-Manager / Admins:</strong> Gerichte und Speisepläne pflegen, Nutzer und Unternehmen verwalten, Guthaben aufladen, Coupons und Motto-Banner verwalten, Auswertungen (Schaltzentrale) nutzen.</li>
                  </ul>
                  <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Kernnutzen</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Wöchentliche Menüpläne pro Standort mit Drag-&-Drop-Editor</li>
                    <li>Bestellungen ausschließlich über internes Guthaben (Wallet) – keine Bargeld-Kasse an der Ausgabe</li>
                    <li>QR-Code pro Bestellung für schnelle Abholung</li>
                    <li>Mehrere Standorte und Organisationen (Multi-Location, White-Label-fähig)</li>
                    <li>Promotions: Gericht-Aktionen (Sonderpreis, Label) und Motto-Wochen-Banner</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Projekt-Übersicht */}
            {show('overview') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">📋 Projekt-Übersicht</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <p className="text-muted-foreground mb-4">
                    <strong className="text-foreground">Kantine Platform</strong> – eine moderne Full-Stack-Webanwendung auf Basis von Next.js, TypeScript, Prisma und PostgreSQL.
                  </p>
                  <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">Projektstruktur (Auszug)</h3>
                  <pre className="bg-muted rounded-xl p-4 text-sm text-foreground overflow-x-auto border border-border/50">
{`app/
├── api/              # API Routes (auth, menus, orders, wallet, admin/*)
├── admin/            # Admin-Panel (Layout + Seiten)
├── menu/             # Kunden-Speiseplan & Bestellung
├── order/            # Bestellbestätigung (QR)
├── kitchen/          # Küchen-Dashboard
├── wallet/           # Guthaben & Historie
├── login, register/
├── unauthorized/     # Kein Zugriff (z. B. Admin ohne Rolle)
└── wiki/             # Diese Dokumentation
components/           # UI-Komponenten (admin, menu, order, charts, ui)
lib/                  # Prisma, Auth, Utils, week-utils, wallet
prisma/               # schema.prisma, seed, migrations
features/             # Feature-Docs (Menu-Planner, Schaltzentrale, Promotions)`}
                  </pre>
                </div>
              </section>
            )}

            {/* Features aktueller Stand */}
            {show('features') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">✨ Features (aktueller Stand)</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Kundenbereich</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Speiseplan pro Woche und Tag (Tabs, Filter nach workingDays)</li>
                      <li>Gerichtskarten mit Bild, Kategorie, Diät-Tags, Allergenen, Kalorien, Preis</li>
                      <li>Gericht-Aktionen (Sonderpreis, Aktionstext, hervorgehobene Karte)</li>
                      <li>Motto-Wochen-Banner (Karussell oberhalb des Speiseplans)</li>
                      <li>Warenkorb, Abholdatum, Notizen; Bezahlung per Guthaben (Wallet)</li>
                      <li>Coupon-Einlösung (Validierung per API)</li>
                      <li>Bestellbestätigung mit QR-Code; Anzeige des neuen Guthabens</li>
                      <li>Wallet-Übersicht und Transaktionshistorie</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Küchen-Dashboard</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Live-Bestellübersicht mit Status (PENDING → CONFIRMED → PREPARING → READY → PICKED_UP)</li>
                      <li>Filter und Sortierung, Auto-Refresh</li>
                      <li>QR-Code-Lookup zur Abholbestätigung</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Admin-Bereich</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li><strong>Schaltzentrale:</strong> KPIs (Umsatz, Bestellungen, AOV, Stornoquote, aktive Kunden), Charts (Trend, Top-Gerichte, Status, Wochentag), Drag-&-Drop-Layout</li>
                      <li><strong>Gerichte:</strong> CRUD, Kategorie, Nährwerte, Diät-Tags, Allergene, Bilder</li>
                      <li><strong>Speiseplan (Menu-Planner):</strong> KW-basiert, Drag-&-Drop Tage/Gerichte, Duplikatserkennung, Gericht-Aktionen (isPromotion, promotionPrice, promotionLabel), Motto-Banner pro Woche</li>
                      <li><strong>Bestellungen, Metadaten</strong> (Kategorien, Allergene, Diät-Tags)</li>
                      <li><strong>Promotions:</strong> Motto-Banner verwalten; Coupons</li>
                      <li><strong>Unternehmen:</strong> Companies, Mitarbeiter (CompanyEmployee), Zuschuss-Konfiguration</li>
                      <li><strong>Nutzer, Guthaben aufladen, Guthaben verwalten</strong> (Balances, Anpassungen mit Grund)</li>
                      <li><strong>Einstellungen</strong></li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Technische Querschnittsthemen</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>NextAuth.js (Credentials), JWT-Sessions, Rollen (CUSTOMER, KITCHEN_STAFF, ADMIN, SUPER_ADMIN)</li>
                      <li>Middleware: geschützte Routen (/menu, /kitchen/*, /admin/*)</li>
                      <li>Wallet: atomare Abbuchung bei Bestellung, Transaktionstypen (TOP_UP, ORDER_PAYMENT, REFUND, ADJUSTMENT)</li>
                      <li>Multi-Tenant: Organisation → Locations → Menus, Orders, Users</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Tech Stack */}
            {show('techstack') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🛠️ Tech Stack</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-foreground">Frontend</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                    <li><strong>Next.js 14</strong> (App Router), <strong>TypeScript</strong>, <strong>React 18</strong></li>
                    <li><strong>Tailwind CSS</strong>, <strong>tailwindcss-animate</strong>, <strong>Radix UI</strong> (shadcn/ui), <strong>Chakra UI</strong></li>
                    <li><strong>Framer Motion</strong> (Animationen), <strong>Lucide React</strong> (Icons)</li>
                    <li><strong>@dnd-kit</strong> (Drag & Drop im Menu-Planner), <strong>react-grid-layout</strong> (Schaltzentrale)</li>
                    <li><strong>Recharts</strong> (Charts), <strong>next-themes</strong> (Dark Mode)</li>
                  </ul>
                  <h3 className="text-lg font-semibold text-foreground">Backend & Daten</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                    <li><strong>Next.js API Routes</strong> (Serverless/Edge-fähig)</li>
                    <li><strong>Prisma ORM</strong> (Prisma 5), <strong>PostgreSQL</strong></li>
                    <li><strong>NextAuth.js 4</strong> (Credentials, JWT), <strong>bcryptjs</strong>, <strong>Zod</strong></li>
                    <li><strong>date-fns</strong>, <strong>qrcode</strong></li>
                  </ul>
                  <h3 className="text-lg font-semibold text-foreground">Tools</h3>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>ESLint, TypeScript 5, tsx (Scripts), Prisma Studio (db:studio)</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Architektur */}
            {show('architecture') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🏗️ Architektur</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <p className="text-muted-foreground">
                    Monolithische Next.js-Anwendung: Frontend (React) und Backend (API Routes) in einem Projekt. Datenpersistenz über PostgreSQL und Prisma.
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">Datenfluss (Bestellung)</h3>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Nutzer anmelden (NextAuth) → Session mit userId und role</li>
                    <li>GET /api/menus (locationId, weekNumber, year) → Menü inkl. MenuItems, PromotionBanners</li>
                    <li>Warenkorb im Client; Checkout: Abholdatum, Notizen, optional Coupon</li>
                    <li>POST /api/orders: Wallet-Prüfung, atomare Abbuchung + Order-Anlage, QR-Code generiert</li>
                    <li>Bestellbestätigung mit QR-Code; Küche nutzt PATCH /api/orders/[orderId] und GET /api/orders/qr/[code]</li>
                  </ol>
                  <h3 className="text-lg font-semibold text-foreground">Multi-Tenant</h3>
                  <pre className="bg-muted rounded-xl p-4 text-sm text-foreground overflow-x-auto border border-border/50">
{`Organization (White-Label)
  └── Location(s)
      ├── Menu (pro KW/Jahr)
      │   ├── MenuItem (Dish + Preis, isPromotion, …)
      │   └── MenuPromotionBanner (Motto-Banner)
      ├── Order (userId, pickupCode, status, …)
      ├── Coupon
      └── UserLocation (Zugriff)
  └── User(s) (role, organizationId, Wallet, …)`}
                  </pre>
                </div>
              </section>
            )}

            {/* Nutzer & Abläufe */}
            {show('userflows') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">👤 Nutzer & Abläufe</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Rollen:</strong> CUSTOMER (Kunde), KITCHEN_STAFF (Küche), ADMIN (Kantinen-Admin), SUPER_ADMIN (Plattform). Geschützte Routen per Middleware; Admin-Layout prüft requireRole([&apos;ADMIN&apos;, &apos;KITCHEN_STAFF&apos;, &apos;SUPER_ADMIN&apos;]) und leitet bei fehlender Berechtigung auf /unauthorized um.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Kunde:</strong> /menu → Gerichte wählen → Warenkorb → Abholdatum, ggf. Coupon → Bezahlung per Guthaben → Bestätigung + QR. Guthaben unter /wallet und /wallet/history.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Küche:</strong> /kitchen/dashboard → Bestellungen nach Status filtern/aktualisieren, Abholcode prüfen.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Admin:</strong> /admin (Schaltzentrale), /admin/dishes, /admin/menu-planner, /admin/orders, /admin/promotions/banners, /admin/companies, /admin/users, /admin/wallet/top-up, /admin/wallet/balances, /admin/settings. Sidebar mit gruppierter Navigation; Layout ohne obere Navbar (eigene Sidebar).
                  </p>
                </div>
              </section>
            )}

            {/* Admin-Bereich */}
            {show('admin') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">⚙️ Admin-Bereich</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <p className="text-muted-foreground">
                    Erreichbar unter <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">/admin</code> für Nutzer mit Rolle ADMIN, KITCHEN_STAFF oder SUPER_ADMIN. Eigenes Layout mit Sidebar (AppSidebar), kein oberes Navbar; Schaltzentrale als Dashboard.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong>Dashboard (Schaltzentrale):</strong> KPIs (Umsatz, Bestellanzahl, AOV, Stornoquote, aktive Kunden), Filter Standort/Zeitraum; Charts (Bestelltrend, Top-Gerichte, Status-Verteilung, Wochentag); Layout per react-grid-layout (Drag/Resize), Persistenz in localStorage.</li>
                    <li><strong>Gerichte:</strong> Grid/Listen-Ansicht, CRUD, Bild, Kategorie, Nährwerte, Diät-Tags, Allergene.</li>
                    <li><strong>Speiseplan (Menu-Planner):</strong> Woche wählen, Tage mit Gerichten belegen (Drag & Drop), Duplikate erkennbar; pro MenuItem: Aktion (isPromotion, promotionPrice, promotionLabel); Motto-Woche: Banner pro KW zuweisen und sortieren.</li>
                    <li><strong>Bestellungen, Metadaten, Motto-Banner, Coupons, Unternehmen, Nutzer, Guthaben aufladen/verwalten, Einstellungen.</strong></li>
                  </ul>
                </div>
              </section>
            )}

            {/* Authentifizierung */}
            {show('auth') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🔐 Authentifizierung</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <p className="text-muted-foreground">
                    NextAuth.js mit <strong>Credentials Provider</strong>; Passwort-Hashing mit bcryptjs. JWT-Sessions; Rolle und User-ID in der Session.
                  </p>
                  <h3 className="text-lg font-semibold text-foreground">Geschützte Routen (Middleware)</h3>
                  <p className="text-muted-foreground">Matcher: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">/menu</code>, <code className="bg-muted px-1.5 py-0.5 rounded">/kitchen/:path*</code>, <code className="bg-muted px-1.5 py-0.5 rounded">/admin/:path*</code>. Ohne Session → Redirect zu /login.</p>
                  <h3 className="text-lg font-semibold text-foreground">Test-Accounts (nach db:seed)</h3>
                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50 text-sm">
                    <p className="text-foreground font-medium">Kunde:</p>
                    <p className="text-muted-foreground">E-Mail: kunde@demo.de, Passwort: demo123, Rolle: CUSTOMER</p>
                    <p className="text-foreground font-medium mt-2">Küche:</p>
                    <p className="text-muted-foreground">E-Mail: kueche@demo.de, Passwort: kueche123, Rolle: KITCHEN_STAFF</p>
                    <p className="text-foreground font-medium mt-2">Admin:</p>
                    <p className="text-muted-foreground">E-Mail: admin@demo.de (falls im Seed), Rolle: ADMIN</p>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Server: <code className="bg-muted px-1 rounded">getServerSession(authOptions)</code>, <code className="bg-muted px-1 rounded">requireRole([...])</code> (lib/auth-helpers). Client: <code className="bg-muted px-1 rounded">useSession()</code>.
                  </p>
                </div>
              </section>
            )}

            {/* API-Übersicht */}
            {show('api') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🔌 API-Übersicht</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-sm">
                  <p className="text-muted-foreground">Relevante Endpunkte (Stand der Plattform).</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><code className="bg-muted px-1 rounded text-foreground">POST /api/auth/register</code> – Registrierung</li>
                    <li><code className="bg-muted px-1 rounded text-foreground">GET /api/menus?locationId=&amp;weekNumber=&amp;year=</code> – Speiseplan (inkl. promotionBanners, menuItems mit dish)</li>
                    <li><code className="bg-muted px-1 rounded text-foreground">POST /api/orders</code> – Bestellung (Auth; Wallet-Abbuchung)</li>
                    <li><code className="bg-muted px-1 rounded text-foreground">GET /api/orders</code>, <code className="bg-muted px-1 rounded">GET/PATCH /api/orders/[orderId]</code>, <code className="bg-muted px-1 rounded">GET /api/orders/qr/[code]</code></li>
                    <li><code className="bg-muted px-1 rounded text-foreground">GET /api/coupons/validate</code> – Coupon validieren</li>
                    <li><code className="bg-muted px-1 rounded text-foreground">GET /api/wallet</code>, <code className="bg-muted px-1 rounded">GET /api/wallet/transactions</code></li>
                    <li><strong className="text-foreground">Admin:</strong> /api/admin/analytics, /admin/companies, /admin/coupons, /admin/dishes, /admin/locations, /admin/menus, /admin/metadata, /admin/orders, /admin/organizations, /admin/promotion-banners, /admin/settings, /admin/users, /admin/wallet/balances, /admin/wallet/top-up, /admin/wallet/adjust, /admin/wallet/transactions</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Datenbank-Schema */}
            {show('database') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🗄️ Datenbank-Schema</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-sm">
                  <p className="text-muted-foreground">Kernmodelle (Prisma): Organization, Location, User (UserRole), Wallet, WalletTransaction; Company, CompanyEmployee; Menu, MenuItem, MenuPromotionBanner, Dish, PromotionBanner; Order, OrderItem; Coupon, CouponRedemption; Metadata. NextAuth: Account, Session, VerificationToken. Quelle: <code className="bg-muted px-1 rounded text-foreground">prisma/schema.prisma</code>.</p>
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">ERM (Entity-Relationship-Modell)</h3>
                    <MermaidDiagram />
                    <p className="text-muted-foreground mt-3 text-xs">
                      PK = Primary Key, FK = Foreign Key, UK = Unique. Vollständige Darstellung in <code className="bg-muted px-1 rounded">docs/database-erm.md</code>.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Wallet */}
            {show('wallet') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">💰 Guthaben &amp; Wallet</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <p className="text-muted-foreground">
                    Internes Guthaben pro Nutzer. Bezahlung nur per Wallet; keine negativen Salden. Aufladung nur durch Admin (z. B. nach Barzahlung/Überweisung); Min/Max pro Vorgang (z. B. 5–200 €). Transaktionstypen: TOP_UP, ORDER_PAYMENT, REFUND, ADJUSTMENT (mit Pflicht-Grund). Abbuchung bei Bestellung atomar mit Order-Anlage. Nutzer: Wallet-Anzeige im Header, /wallet, /wallet/history. Admin: Guthaben aufladen, Guthaben verwalten (Balances, Anpassungen). Siehe auch Abschnitt Wallet in den bisherigen Wiki-Texten (unten) bzw. wallet-spec.md.
                  </p>
                </div>
              </section>
            )}

            {/* Promotions */}
            {show('promotions') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🏷️ Promotions</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">1. Gericht-Aktion:</strong> Im Menu-Planner pro MenuItem „Als Aktion bewerben“ (isPromotion), optional Sonderpreis (promotionPrice) und Aktionstext (promotionLabel). Kunden sehen goldene Karte, „Aktion“-Badge, ggf. durchgestrichener Normalpreis.
                  </p>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">2. Motto-Banner:</strong> Wiederverwendbare PromotionBanner (Titel, Untertitel, Bild); pro Menü (KW/Jahr/Location) zuweisbar und sortierbar. Oberhalb des Speiseplans als Karussell (PromotionBannerCarousel), optional schließbar (Session).
                  </p>
                </div>
              </section>
            )}

            {/* Design Guidelines */}
            {show('design') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🎨 Design Guidelines</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <p className="text-muted-foreground">
                    Vollständige Spezifikation in <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">DESIGN_GUIDELINES.md</code>: Farb-System (Primary, Kategorie Grün, FIT&amp;VITAL Blau, Allergene Amber, Destructive), Typografie, Card-Design (rounded-2xl, aspect-[4/3], Hover), Badge-System, Buttons, Layout-Patterns (Header-Gradient, SVG-Welle), Animationen, Dark Mode, Accessibility, Komponenten (MenuItemCard, DishCard, MenuWeek).
                  </p>
                  <p className="text-muted-foreground text-sm">
                    UI-Bibliothek: shadcn/ui (Radix) + Tailwind; Icons: Lucide React.
                  </p>
                </div>
              </section>
            )}

            {/* Setup */}
            {show('setup') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🚀 Setup &amp; Installation</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Voraussetzungen</h3>
                  <p className="text-muted-foreground">Node.js 18+, PostgreSQL, npm.</p>
                  <h3 className="text-lg font-semibold text-foreground">Schritte</h3>
                  <pre className="bg-muted rounded-xl p-4 text-sm text-foreground overflow-x-auto border border-border/50">
{`npm install
# .env: DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET
npm run db:migrate
npm run db:seed
npm run dev`}
                  </pre>
                  <p className="text-muted-foreground text-sm">
                    NEXTAUTH_SECRET z. B. mit <code className="bg-muted px-1 rounded">openssl rand -base64 32</code> erzeugen. Weitere Befehle: <code className="bg-muted px-1 rounded">npm run build</code>, <code className="bg-muted px-1 rounded">npm run start</code>, <code className="bg-muted px-1 rounded">npm run db:studio</code>, <code className="bg-muted px-1 rounded">npm run db:generate</code>.
                  </p>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
