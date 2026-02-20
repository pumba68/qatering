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
  { id: 'status', label: 'Platform-Status', icon: '📊' },
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
  { id: 'payments', label: 'Stripe & Zahlungen', icon: '💳' },
  { id: 'billing', label: 'Vertragspartner-Abrechnung', icon: '🧾' },
  { id: 'promotions', label: 'Promotions', icon: '🏷️' },
  { id: 'marketing-editor', label: 'Marketing-Editor & Push', icon: '✉️' },
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

            {/* Platform-Status */}
            {show('status') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">📊 Platform-Status</h2>
                <p className="text-muted-foreground mb-6">
                  Übersicht über Feature-Umsetzung, fehlende Teile, Testresultate und Codequalität. Stand: Januar 2026.
                </p>

                <h3 className="text-lg font-semibold text-foreground mb-3">Feature-Matrix</h3>
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium text-foreground">Feature</th>
                        <th className="text-left py-3 px-2 font-medium text-foreground">Umsetzung</th>
                        <th className="text-left py-3 px-2 font-medium text-foreground">Fehlende Teile</th>
                        <th className="text-left py-3 px-2 font-medium text-foreground">QA-Ergebnis</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-1 Schaltzentrale</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">—</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Bestanden</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-2 Motto-Banner</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">—</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Bestanden</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-3 Multi-Location</td>
                        <td className="py-3 px-2">🟡 Teilweise</td>
                        <td className="py-3 px-2">PROJ-3c User-Location-Zuordnung (User ↔ Location)</td>
                        <td className="py-3 px-2"><span className="text-amber-600 dark:text-amber-400">🟡 3a/3b/3d OK</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-4 Kundensegmente & Marketing</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">E-Mail-Versand, Workflow-Scheduler (E2E-Test offen)</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Implementiert</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-4e Incentives</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">—</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Bestanden</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-5 Vertragspartner-Abrechnung</td>
                        <td className="py-3 px-2">🟡 Teilweise</td>
                        <td className="py-3 px-2">Vollständige QA gegen alle ACs offen</td>
                        <td className="py-3 px-2"><span className="text-amber-600 dark:text-amber-400">🟡 Basis vorhanden</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-6 Guthaben & Wallet</td>
                        <td className="py-3 px-2">✅ Vollständig (MVP Phase 1)</td>
                        <td className="py-3 px-2">Niedrig-Guthaben-Benachrichtigungen, Finanzberichte (Post-MVP)</td>
                        <td className="py-3 px-2">—</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">Menu-Planner UI</td>
                        <td className="py-3 px-2">✅ Vorhanden</td>
                        <td className="py-3 px-2">Top-5-Schnellzugriff, Sheet „Alle Gerichte“ (optional)</td>
                        <td className="py-3 px-2">—</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">Menu-View Optimization</td>
                        <td className="py-3 px-2">✅ Umgesetzt</td>
                        <td className="py-3 px-2">—</td>
                        <td className="py-3 px-2">—</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-7 Template-Bibliothek</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">—</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Implementiert</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-8 Block-Editor</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">—</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Implementiert</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-10 In-App / Push-Integration</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">VAPID-Keys in .env konfigurieren für Push-Versand</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Implementiert</span></td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-11 Stripe Online-Zahlung</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">Stripe-Keys + PAYMENT_CONFIG_SECRET in .env / Admin-Panel konfigurieren</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Implementiert</span></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-2 font-medium text-foreground">PROJ-14 Admin Payment-Settings</td>
                        <td className="py-3 px-2">✅ Vollständig</td>
                        <td className="py-3 px-2">PAYMENT_CONFIG_SECRET Env-Variable setzen</td>
                        <td className="py-3 px-2"><span className="text-green-600 dark:text-green-400">✅ Implementiert</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-3">Testresultate (Detail)</h3>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <p><strong className="text-foreground">PROJ-1, PROJ-2, PROJ-4e:</strong> Alle geprüften Acceptance Criteria bestanden (Code-Review + HTTP-Tests).</p>
                  <p><strong className="text-foreground">PROJ-3:</strong> Location CRUD, Location-Switcher und Mehrfachauswahl in Schaltzentrale OK. User-Location-Zuordnung nicht geprüft.</p>
                  <p><strong className="text-foreground">PROJ-4:</strong> Segmente, Kampagnen, Automation implementiert. Regressionstest für E-Mail/Workflow empfohlen.</p>
                  <p><strong className="text-foreground">PROJ-5:</strong> /admin/billing mit API vorhanden. Vollständige QA empfohlen.</p>
                  <p><strong className="text-foreground">PROJ-6:</strong> Wallet (Guthaben, Aufladung, Historie) implementiert. Feature-Spec in features/PROJ-6-wallet-guthaben.md.</p>
                  <p className="text-xs mt-2">Details in <code className="bg-muted px-1 rounded">features/PROJ-*.md</code> (Abschnitt „QA Test Results“).</p>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-3">Codequalität</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">ESLint: 23 Warnings</span>
                  </div>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><strong className="text-foreground">react-hooks/exhaustive-deps:</strong> 18× – fehlende useEffect-Dependencies (funktional meist unkritisch, aber Aufräumen empfohlen)</li>
                    <li><strong className="text-foreground">@next/next/no-img-element:</strong> 5× – <code className="bg-muted px-1 rounded">img</code> statt <code className="bg-muted px-1 rounded">next/image</code> (Performance-Optimierung bei Bildern)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    Keine ESLint-Errors. Build läuft durch. Typsicherheit durch TypeScript. Bewertung: <strong className="text-foreground">gut</strong> – produktionsreif mit Verbesserungspotenzial bei Hooks und Bildoptimierung.
                  </p>
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
                  <p className="text-muted-foreground mb-3">
                    Internes Guthaben pro Nutzer. Bezahlung nur per Wallet; keine negativen Salden. Min. 5 €, Max. 200 € pro Aufladung. Transaktionstypen: TOP_UP, ORDER_PAYMENT, REFUND, ADJUSTMENT (mit Pflicht-Grund). Abbuchung bei Bestellung atomar mit Order-Anlage. Nutzer: Wallet-Anzeige im Header, <code className="bg-muted px-1 rounded">/wallet</code>, <code className="bg-muted px-1 rounded">/wallet/history</code>. Admin: Guthaben aufladen, Guthaben verwalten (Balances, Anpassungen).
                  </p>
                  <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-200">
                    <strong>Neu (PROJ-11):</strong> Kunden k&ouml;nnen ihr Guthaben <strong>selbstst&auml;ndig per Stripe aufladen</strong> &ndash; direkt auf <code className="bg-green-100 dark:bg-green-900/40 px-1 rounded">/wallet</code>. Unterst&uuml;tzte Methoden: Kreditkarte, Apple Pay, Google Pay, SEPA-Lastschrift. Voraussetzung: Stripe in Admin &rarr; Zahlungen konfiguriert. Einrichtungsanleitung im Abschnitt &ldquo;Stripe &amp; Zahlungen&rdquo;.
                  </div>
                </div>
              </section>
            )}

            {/* Stripe & Zahlungen (PROJ-11 / PROJ-14) */}
            {show('payments') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">💳 Stripe &amp; Zahlungen einrichten</h2>
                  <p className="text-muted-foreground text-sm">
                    Anleitung f&uuml;r Betreiber &ndash; Stripe API-Keys konfigurieren, Webhook einrichten und Selfservice-Aufladung f&uuml;r Kunden aktivieren (PROJ-11 / PROJ-14).
                  </p>
                </div>

                {/* Voraussetzungen */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Voraussetzungen</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1.5 text-sm">
                    <li>Ein <strong className="text-foreground">Stripe-Account</strong> &ndash; kostenlos erstellen unter stripe.com</li>
                    <li>Die Plattform l&auml;uft unter <strong className="text-foreground">HTTPS</strong> (Stripe verweigert Payments auf HTTP in Produktion; f&uuml;r lokale Tests ist HTTP erlaubt)</li>
                    <li>Env-Variable <code className="bg-muted px-1 rounded">PAYMENT_CONFIG_SECRET</code> muss gesetzt sein (verschl&uuml;sselt API-Keys in der DB)</li>
                  </ul>
                </div>

                {/* Schritt 1: API-Keys */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Schritt 1 &ndash; Stripe API-Keys holen</h3>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2 text-sm mb-4">
                    <li>Im <strong className="text-foreground">Stripe Dashboard</strong> anmelden (&rsaquo; Developers &rsaquo; API keys)</li>
                    <li><strong className="text-foreground">Publishable Key</strong> kopieren &ndash; beginnt mit <code className="bg-muted px-1 rounded">pk_test_</code> (Test) oder <code className="bg-muted px-1 rounded">pk_live_</code> (Produktion)</li>
                    <li><strong className="text-foreground">Secret Key</strong> kopieren &ndash; beginnt mit <code className="bg-muted px-1 rounded">sk_test_</code> oder <code className="bg-muted px-1 rounded">sk_live_</code>. Nie &ouml;ffentlich teilen!</li>
                  </ol>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
                    <strong>Test vs. Live:</strong> F&uuml;r die Entwicklung und Demo immer Test-Keys verwenden. Die Testumgebung verbucht kein echtes Geld. F&uuml;r den Produktivbetrieb Live-Keys einsetzen.
                  </div>
                </div>

                {/* Schritt 2: Webhook */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Schritt 2 &ndash; Webhook einrichten</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    Der Webhook stellt sicher, dass das Guthaben <strong className="text-foreground">auch dann gutgeschrieben wird</strong>, wenn der Nutzer den Browser nach der Zahlung schlie&szlig;t.
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2 text-sm mb-4">
                    <li>Im Stripe Dashboard: <strong className="text-foreground">Developers &rsaquo; Webhooks &rsaquo; Add endpoint</strong></li>
                    <li>Endpoint-URL eintragen: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">https://ihre-domain.de/api/payments/stripe/webhook</code></li>
                    <li>Events ausw&auml;hlen: <code className="bg-muted px-1 rounded">payment_intent.succeeded</code> und <code className="bg-muted px-1 rounded">payment_intent.payment_failed</code></li>
                    <li><strong className="text-foreground">Webhook Secret</strong> kopieren &ndash; beginnt mit <code className="bg-muted px-1 rounded">whsec_</code></li>
                  </ol>
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-200 mb-3">
                    <strong>Lokale Entwicklung mit Stripe CLI:</strong>
                    <pre className="mt-2 bg-blue-100 dark:bg-blue-900/40 rounded p-2 font-mono text-xs overflow-x-auto">stripe listen --forward-to localhost:3000/api/payments/stripe/webhook</pre>
                    Die CLI gibt einen tempor&auml;ren Webhook-Secret aus &ndash; diesen als <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">STRIPE_WEBHOOK_SECRET</code> in <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">.env</code> eintragen.
                  </div>
                </div>

                {/* Schritt 3: Env-Variable */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Schritt 3 &ndash; Env-Variable setzen</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    In der <code className="bg-muted px-1 rounded">.env</code>-Datei (lokal) bzw. in den Deployment-Umgebungsvariablen (Vercel/Server):
                  </p>
                  <pre className="bg-muted rounded-xl p-4 text-sm text-foreground overflow-x-auto border border-border/50 mb-3">
{`# Verschlüsselungsschlüssel für alle Payment-Provider-Keys in der DB\nPAYMENT_CONFIG_SECRET=<min. 32 zufällige Zeichen>\n\n# Stripe Webhook Secret (aus Stripe-Dashboard oder stripe listen CLI)\nSTRIPE_WEBHOOK_SECRET=whsec_...`}
                  </pre>
                  <p className="text-muted-foreground text-sm mb-2">
                    <code className="bg-muted px-1 rounded">PAYMENT_CONFIG_SECRET</code> generieren:
                  </p>
                  <pre className="bg-muted rounded-xl p-3 text-sm text-foreground border border-border/50 mb-3">openssl rand -base64 32</pre>
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-800 dark:text-red-200">
                    <strong>Achtung:</strong> <code className="bg-red-100 dark:bg-red-900/40 px-1 rounded">PAYMENT_CONFIG_SECRET</code> niemals &auml;ndern, nachdem Keys in der DB gespeichert wurden &ndash; sonst k&ouml;nnen sie nicht mehr entschl&uuml;sselt werden. Bei einer &Auml;nderung m&uuml;ssen alle Keys im Admin-Panel neu eingetragen werden.
                  </div>
                </div>

                {/* Schritt 4: Admin-Panel */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Schritt 4 &ndash; Stripe im Admin-Panel konfigurieren</h3>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2 text-sm mb-4">
                    <li>Admin-Bereich &ouml;ffnen: <strong className="text-foreground">System &rsaquo; Zahlungen</strong> (<code className="bg-muted px-1 rounded">/admin/settings/payments</code>)</li>
                    <li>In der <strong className="text-foreground">Stripe-Karte</strong> auf das Stift-Symbol (&#x270F;) neben &ldquo;Publishable Key&rdquo; klicken und den kopierten Key eingeben</li>
                    <li>Dasselbe f&uuml;r <strong>Secret Key</strong> und <strong>Webhook Secret</strong> wiederholen</li>
                    <li>Auf <strong className="text-foreground">&ldquo;Speichern&rdquo;</strong> klicken</li>
                    <li>Den Toggle <strong className="text-foreground">&ldquo;Stripe aktivieren&rdquo;</strong> einschalten</li>
                    <li>Auf <strong className="text-foreground">&ldquo;Verbindung testen&rdquo;</strong> klicken &ndash; es sollte <span className="text-green-600 dark:text-green-400">&ldquo;Verbunden mit Stripe.&rdquo;</span> erscheinen</li>
                  </ol>
                  <div className="rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 text-sm text-green-800 dark:text-green-200">
                    Nach dem Aktivieren erscheint auf <code className="bg-green-100 dark:bg-green-900/40 px-1 rounded">/wallet</code> automatisch der Auflade-Bereich mit Kreditkarte, Apple Pay, Google Pay und SEPA.
                  </div>
                </div>

                {/* Testkarten */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Stripe Testkarten</h3>
                  <p className="text-muted-foreground text-sm mb-3">Im Test-Modus k&ouml;nnen folgende Karten-Nummern verwendet werden (Ablaufdatum und CVC beliebig):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-foreground">Kartennummer</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">Ergebnis</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-mono text-foreground">4242 4242 4242 4242</td><td className="py-2 px-2 text-green-600 dark:text-green-400">✅ Zahlung erfolgreich</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-mono text-foreground">4000 0000 0000 9995</td><td className="py-2 px-2 text-red-600 dark:text-red-400">❌ Karte abgelehnt</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-mono text-foreground">4000 0025 0000 3155</td><td className="py-2 px-2 text-amber-600 dark:text-amber-400">🔁 3D Secure Authentifizierung</td></tr>
                        <tr><td className="py-2 px-2 font-mono text-foreground">4000 0000 0000 0077</td><td className="py-2 px-2 text-red-600 dark:text-red-400">❌ Karte gesperrt</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Zahlungsablauf */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Wie der Zahlungsablauf funktioniert</h3>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-2 text-sm">
                    <li>Kunde w&auml;hlt Betrag (10 / 20 / 25 / 50 &euro;) auf <code className="bg-muted px-1 rounded">/wallet</code></li>
                    <li>Browser ruft <code className="bg-muted px-1 rounded">POST /api/payments/stripe/create-intent</code> auf &ndash; Server erstellt Payment Intent bei Stripe</li>
                    <li>Stripe Payment Element l&auml;dt im Browser &ndash; Kartendaten gehen direkt an Stripe (kein Zugriff unserer Server)</li>
                    <li>Nach Zahlung sendet Stripe einen <strong className="text-foreground">Webhook</strong> an <code className="bg-muted px-1 rounded">/api/payments/stripe/webhook</code></li>
                    <li>Webhook-Handler pr&uuml;ft Signatur und Idempotenz, ruft <code className="bg-muted px-1 rounded">topUp()</code> auf</li>
                    <li>Wallet-Guthaben wird atomar in der Datenbank erh&ouml;ht; Kunde sieht Toast-Meldung</li>
                  </ol>
                </div>

                {/* Fehlerbehebung */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">H&auml;ufige Fehler &amp; L&ouml;sungen</h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground">&ldquo;Stripe ist nicht konfiguriert.&rdquo;</p>
                      <p>Kein Stripe Secret Key gefunden. Bitte in Admin &rsaquo; Zahlungen einrichten oder <code className="bg-muted px-1 rounded">STRIPE_SECRET_KEY</code> als Fallback in <code className="bg-muted px-1 rounded">.env</code> setzen.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Webhook-Signatur ung&uuml;ltig (400-Fehler)</p>
                      <p>Das Webhook Secret im Admin-Panel stimmt nicht mit dem im Stripe-Dashboard &uuml;berein. Bitte beide pr&uuml;fen und neu eintragen.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Guthaben wird nach Zahlung nicht gutgeschrieben</p>
                      <p>Der Webhook erreicht den Server nicht. Pr&uuml;fen: 1. Ist der Webhook im Stripe-Dashboard aktiv? 2. Ist die Webhook-URL korrekt (HTTPS)? 3. F&uuml;r lokale Tests: l&auml;uft <code className="bg-muted px-1 rounded">stripe listen --forward-to ...</code>?</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Stripe-Auflade-Bereich erscheint nicht auf /wallet</p>
                      <p>Stripe muss im Admin-Panel aktiviert sein (Toggle &ldquo;Aktiviert&rdquo;). Der Bereich wird nur angezeigt, wenn <code className="bg-muted px-1 rounded">/api/payments/providers/active</code> den Eintrag <code className="bg-muted px-1 rounded">stripe</code> zur&uuml;ckgibt.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Apple Pay erscheint nicht</p>
                      <p>Apple Pay ist nur in Safari auf iOS/macOS verf&uuml;gbar. Domain muss bei Stripe unter Business settings &rsaquo; Apple Pay registriert sein. F&uuml;r Google Pay ist keine separate Registrierung n&ouml;tig.</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Vertragspartner-Abrechnung (PROJ-5) */}
            {show('billing') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-4">🧾 Vertragspartner-Abrechnung</h2>
                <p className="text-muted-foreground mb-6">
                  Diese Anleitung richtet sich an <strong className="text-foreground">Betreiber der Kantine</strong>. Sie erfahren, wie Sie Zuschusskosten pro Vertragspartner erfassen, Monatsrechnungen erstellen und den Zahlungseingang dokumentieren.
                </p>

                <h3 className="text-lg font-semibold text-foreground mb-3">Was ist die Vertragspartner-Abrechnung?</h3>
                <p className="text-muted-foreground mb-4">
                  Wenn Mitarbeiter eines Vertragspartners (z. B. Firma XY) in Ihrer Kantine bestellen, übernimmt der Arbeitgeber oft einen Teil des Preises (Arbeitgeber-Zuschuss). Die Plattform bucht diese Differenz (Realpreis minus vom Kunden gezahlter Betrag) automatisch dem Vertragspartner zu. Am Monatsende erstellen Sie eine Rechnung über alle angefallenen Zuschusskosten und stellen sie dem Vertragspartner in Rechnung.
                </p>

                <h3 className="text-lg font-semibold text-foreground mb-3">Wichtige Begriffe</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-6">
                  <li><strong className="text-foreground">Vertragspartner (Company):</strong> Ein Unternehmen, das mit Ihnen einen Vertrag hat und seinen Mitarbeitern einen Zuschuss zur Kantinennutzung gewährt.</li>
                  <li><strong className="text-foreground">Zuschuss:</strong> Der Anteil, den der Arbeitgeber übernimmt – egal ob als fester Betrag, fester Rabatt oder prozentual. Es zählt immer die tatsächliche Differenz pro Bestellung.</li>
                  <li><strong className="text-foreground">Offener Saldo:</strong> Summe der Zuschussbeträge aus Bestellungen, die noch keiner Rechnung zugeordnet wurden.</li>
                  <li><strong className="text-foreground">Einzelposten:</strong> Jede Zeile auf der Rechnung = eine Bestellung mit Bestellnummer, Datum, Mitarbeiter und Zuschussbetrag.</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mb-3">Wo finde ich die Vertragspartner-Abrechnung?</h3>
                <p className="text-muted-foreground mb-4">
                  Im Admin-Bereich unter <strong className="text-foreground">Verwaltung → Vertragspartner-Abrechnung</strong> (<code className="bg-muted px-1.5 py-0.5 rounded">/admin/billing</code>). Sie benötigen die Rolle ADMIN oder SUPER_ADMIN.
                </p>

                <h3 className="text-lg font-semibold text-foreground mb-3">Anleitung: Monatsrechnung erstellen und versenden</h3>
                <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
                  <li>
                    <strong className="text-foreground">Offene Salden prüfen:</strong> In der Tabelle „Offene Salden“ sehen Sie alle Vertragspartner mit einem noch nicht abgerechneten Betrag. Prüfen Sie, für welchen Monat Sie abrechnen möchten.
                  </li>
                  <li>
                    <strong className="text-foreground">Rechnung anlegen:</strong> Wählen Sie unter „Rechnung erstellen“ das Unternehmen, den Monat und das Jahr. Klicken Sie auf „Rechnung erstellen“. Die Rechnung wird als Entwurf angelegt.
                  </li>
                  <li>
                    <strong className="text-foreground">Details prüfen:</strong> Klicken Sie bei der erstellten Rechnung auf „Details“. Dort sehen Sie alle Einzelposten (Bestellnummer, Datum, Mitarbeiter, Summe). Prüfen Sie die Richtigkeit.
                  </li>
                  <li>
                    <strong className="text-foreground">PDF exportieren:</strong> Klicken Sie auf „PDF exportieren“. Die Datei wird heruntergeladen. Der Status der Rechnung wechselt automatisch auf „Rechnung gestellt“. Versenden Sie das PDF an den Vertragspartner.
                  </li>
                  <li>
                    <strong className="text-foreground">Zahlung dokumentieren:</strong> Nach Zahlungseingang klicken Sie auf „Als bezahlt markieren“. Der Status wechselt auf „Bezahlt“.
                  </li>
                </ol>

                <h3 className="text-lg font-semibold text-foreground mb-3">Rechnungsstatus im Überblick</h3>
                <table className="w-full text-sm border-collapse mb-6">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-medium text-foreground">Status</th>
                      <th className="text-left py-2 font-medium text-foreground">Bedeutung</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">Entwurf</td>
                      <td className="py-2">Rechnung erstellt, PDF noch nicht exportiert</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 font-medium text-foreground">Rechnung gestellt</td>
                      <td className="py-2">PDF exportiert und an Vertragspartner gesendet</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium text-foreground">Bezahlt</td>
                      <td className="py-2">Zahlung eingegangen, manuell als bezahlt markiert</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="text-lg font-semibold text-foreground mb-3">Häufige Fragen</h3>
                <div className="space-y-4 text-muted-foreground mb-4">
                  <p>
                    <strong className="text-foreground">Werden Coupons oder Aktionen ohne Firmenbezug abgerechnet?</strong><br />
                    Nein. Nur der Anteil, der dem Arbeitgeber-Zuschuss zuzurechnen ist, wird dem Vertragspartner in Rechnung gestellt. Allgemeine Rabatte (z. B. Motto-Woche-Coupon) erscheinen nicht auf der Vertragspartner-Rechnung.
                  </p>
                  <p>
                    <strong className="text-foreground">Was passiert bei stornierten Bestellungen?</strong><br />
                    Stornierte Bestellungen werden bei der Abrechnung berücksichtigt (Rückbuchung oder Korrektur). Die Einzelposten auf der Rechnung spiegeln den korrekten Stand wider.
                  </p>
                  <p>
                    <strong className="text-foreground">Kann ich mehrere Rechnungen für denselben Monat und Vertragspartner erstellen?</strong><br />
                    Nein. Pro Vertragspartner und Monat wird nur eine Rechnung erstellt. Bestellungen, die bereits in einer Rechnung enthalten sind, erscheinen nicht erneut.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Voraussetzung: Vertragspartner und Zuschuss-Konfiguration müssen unter <strong className="text-foreground">Unternehmen</strong> angelegt sein. Mitarbeiter müssen dem Unternehmen zugeordnet sein, damit ihre Bestellungen dem Zuschuss zugeordnet werden.
                </p>
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

            {/* Marketing-Editor & Push (PROJ-7 / PROJ-8 / PROJ-10) */}
            {show('marketing-editor') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-10">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">✉️ Marketing-Editor &amp; Kanalausspieltung</h2>
                  <p className="text-muted-foreground text-sm">
                    Anleitung für Admins – Template-Bibliothek (PROJ-7), Block-Editor (PROJ-8) und In-App / Push-Versand (PROJ-10).
                  </p>
                </div>

                {/* ── ABSCHNITT 1: Überblick ── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Überblick: Wie alles zusammenhängt</h3>
                  <p className="text-muted-foreground mb-4">
                    Das Marketing-System der Plattform besteht aus drei aufeinander aufbauenden Schichten:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li><strong className="text-foreground">Template-Bibliothek</strong> – zentrale Verwaltung aller Marketing-Vorlagen unter <code className="bg-muted px-1 rounded">/admin/marketing/templates</code></li>
                    <li><strong className="text-foreground">Block-Editor</strong> – visueller Drag-&-Drop-Editor zum Gestalten der Vorlagen</li>
                    <li><strong className="text-foreground">Kanalausspieltung</strong> – Veröffentlichen als In-App Banner/Popup oder als Push-Benachrichtigung</li>
                  </ol>
                  <div className="mt-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 p-4 text-sm text-violet-800 dark:text-violet-200">
                    <strong>Tipp:</strong> Der typische Arbeitsablauf ist: Vorlage erstellen → im Block-Editor gestalten → speichern → „Veröffentlichen&ldquo; klicken → Kanal und Segment auswählen → bestätigen.
                  </div>
                </div>

                {/* ── ABSCHNITT 2: Template-Bibliothek ── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">1. Template-Bibliothek</h3>
                  <p className="text-muted-foreground mb-4">
                    Erreichbar unter <strong className="text-foreground">Marketing → Vorlagen</strong> im Admin-Bereich. Nur für ADMIN und SUPER_ADMIN sichtbar.
                  </p>

                  <h4 className="font-semibold text-foreground mb-2">Was Sie hier sehen</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                    <li>Alle Ihre eigenen Vorlagen als Karten mit Vorschau, Name, Typ-Badge und letztem Änderungsdatum</li>
                    <li>Vorinstallierte <strong className="text-foreground">Starter-Vorlagen</strong> (schreibgeschützt, können aber dupliziert werden)</li>
                    <li>Filter nach Typ (E-Mail, In-App Banner, Promotion-Banner, Push) und Status (Aktiv / Archiviert)</li>
                    <li>Suche nach Name und Sortierung (zuletzt geändert, Name A–Z, Erstellungsdatum)</li>
                  </ul>

                  <h4 className="font-semibold text-foreground mb-2">Neue Vorlage erstellen</h4>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
                    <li>Klicken Sie auf <strong className="text-foreground">„+ Neu erstellen&ldquo;</strong> (oben rechts)</li>
                    <li>Wählen Sie den Typ: <strong>E-Mail</strong>, <strong>In-App Banner</strong>, <strong>Promotion-Banner</strong> oder <strong>Push-Nachricht</strong></li>
                    <li>Wählen Sie den Startpunkt: leeres Template oder eine Starter-Vorlage als Basis</li>
                    <li>Sie werden automatisch in den Block-Editor weitergeleitet</li>
                  </ol>

                  <h4 className="font-semibold text-foreground mb-2">Aktionen pro Vorlage (⋮-Menü)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-foreground">Aktion</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">Beschreibung</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-2 font-medium text-foreground">Bearbeiten</td>
                          <td className="py-2 px-2">Öffnet die Vorlage im Block-Editor</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-2 font-medium text-foreground">Duplizieren</td>
                          <td className="py-2 px-2">Erstellt eine Kopie mit dem Suffix „(Kopie)&ldquo; – ideal für Varianten</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2 px-2 font-medium text-foreground">Archivieren</td>
                          <td className="py-2 px-2">Entfernt die Vorlage aus der aktiven Ansicht (kein Datenverlust)</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-2 font-medium text-foreground">Löschen</td>
                          <td className="py-2 px-2">Endgültig löschen – nur möglich wenn die Vorlage nicht in einem aktiven Workflow verwendet wird</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
                    <strong>Hinweis zu Starter-Vorlagen:</strong> Diese sind schreibgeschützt. Wenn Sie eine Starter-Vorlage öffnen, erscheint oben ein gelber Hinweis. Klicken Sie auf „Duplizieren &amp; bearbeiten&ldquo;, um eine eigene bearbeitbare Kopie zu erstellen.
                  </div>
                </div>

                {/* ── ABSCHNITT 3: Block-Editor ── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">2. Block-Editor</h3>
                  <p className="text-muted-foreground mb-4">
                    Der visuelle Editor öffnet sich automatisch nach dem Erstellen oder Bearbeiten einer Vorlage. Er ist in drei Bereiche unterteilt:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="font-semibold text-foreground mb-1">← Linke Spalte</p>
                      <p className="text-sm text-muted-foreground">Block-Palette mit allen verfügbaren Elementen. Blöcke per Drag &amp; Drop in die Canvas ziehen.</p>
                    </div>
                    <div className="rounded-xl border border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 p-4">
                      <p className="font-semibold text-foreground mb-1">↕ Mitte: Canvas</p>
                      <p className="text-sm text-muted-foreground">Live-Vorschau Ihrer Vorlage. Blöcke per Drag Handle (⠿) umsortieren, per Klick auswählen.</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4">
                      <p className="font-semibold text-foreground mb-1">Rechte Spalte →</p>
                      <p className="text-sm text-muted-foreground">Eigenschaften-Panel. Zeigt Einstellungen des ausgewählten Blocks – oder globale Stil-Einstellungen.</p>
                    </div>
                  </div>

                  <h4 className="font-semibold text-foreground mb-2">Verfügbare Block-Typen</h4>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-foreground">Block</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">Einstellbar</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Headline</td><td className="py-2 px-2">Text, Ebene (H1/H2/H3), Farbe, Ausrichtung</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Text</td><td className="py-2 px-2">Rich-Text (fett, kursiv, unterstrichen, Links), Schriftgröße, Farbe</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Bild</td><td className="py-2 px-2">URL oder Upload, Alt-Text, Ausrichtung, Breite, Link bei Klick</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Button / CTA</td><td className="py-2 px-2">Beschriftung, URL, Hintergrundfarbe, Textfarbe, Ausrichtung</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Spacer</td><td className="py-2 px-2">Höhe in Pixeln</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Trennlinie</td><td className="py-2 px-2">Farbe, Stärke, Stil (durchgezogen, gestrichelt, gepunktet)</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">2-Spalten-Layout</td><td className="py-2 px-2">Spaltenverteilung (50/50, 33/67, 67/33), eigene Blöcke pro Spalte</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">3-Spalten-Layout</td><td className="py-2 px-2">Drei gleichbreite Spalten mit je eigenen Blöcken</td></tr>
                        <tr><td className="py-2 px-2 font-medium text-foreground">Coupon-Block</td><td className="py-2 px-2">Coupon aus der Datenbank wählen, Code-Darstellung, CTA-Text</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold text-foreground mb-2">Personalisierungs-Platzhalter</h4>
                  <p className="text-muted-foreground mb-2">
                    In Text- und Headline-Blöcken können Sie Variablen einsetzen, die beim Ausspielen individuell befüllt werden:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['{{Vorname}}', '{{Nachname}}', '{{E-Mail}}', '{{Standort}}', '{{Gericht_des_Tages}}', '{{Coupon_Code}}', '{{Datum}}'].map((v) => (
                      <code key={v} className="bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 px-2 py-0.5 rounded text-xs font-mono">{v}</code>
                    ))}
                  </div>
                  <p className="text-muted-foreground text-sm mb-4">
                    In der Editor-Vorschau werden Platzhalter mit Beispieldaten gefüllt (z. B. <code className="bg-muted px-1 rounded">{'{{Vorname}}'}</code> → „Max&ldquo;). Beim tatsächlichen Versand werden die echten Nutzerdaten eingesetzt.
                  </p>

                  <h4 className="font-semibold text-foreground mb-2">Globale Stile</h4>
                  <p className="text-muted-foreground mb-4">
                    Klicken Sie in der Topbar auf das <strong>Pinsel-Icon (🎨)</strong>, um globale Einstellungen zu öffnen: Hintergrundfarbe, Primärfarbe, Schriftart und Innenabstand der Canvas.
                  </p>

                  <h4 className="font-semibold text-foreground mb-2">Tastenkürzel &amp; Toolbar</h4>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border-collapse">
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-mono text-foreground">Strg + S</td><td className="py-2 px-2">Manuell speichern</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-mono text-foreground">Strg + Z</td><td className="py-2 px-2">Rückgängig (bis zu 20 Schritte)</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-mono text-foreground">Strg + Y</td><td className="py-2 px-2">Wiederholen</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-mono text-foreground">Monitor-Icon</td><td className="py-2 px-2">Desktop-Vorschau (600 px)</td></tr>
                        <tr><td className="py-2 px-2 font-mono text-foreground">Smartphone-Icon</td><td className="py-2 px-2">Mobile-Vorschau (375 px)</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-muted-foreground text-sm">
                    Der Editor speichert automatisch alle 60 Sekunden (Autosave), wenn die Vorlage geändert wurde. Den Speicher-Status sehen Sie im Topbar-Button (✓ Gespeichert / ⏳ Speichern…).
                  </p>
                </div>

                {/* ── ABSCHNITT 4: Veröffentlichen ── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">3. Vorlage veröffentlichen</h3>
                  <p className="text-muted-foreground mb-4">
                    Klicken Sie im Block-Editor auf <strong className="text-foreground">„Veröffentlichen&ldquo;</strong> (lila Button oben rechts). Ein 3-Schritt-Dialog öffnet sich:
                  </p>

                  <div className="space-y-4 mb-6">
                    <div className="flex gap-4 items-start">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 flex items-center justify-center font-bold text-sm">1</div>
                      <div>
                        <p className="font-semibold text-foreground">Kanal wählen</p>
                        <p className="text-sm text-muted-foreground">Wählen Sie zwischen <strong>In-App Banner / Popup</strong> (Anzeige innerhalb der App) und <strong>Push-Benachrichtigung</strong> (Geräte-Benachrichtigung außerhalb der App).</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 flex items-center justify-center font-bold text-sm">2</div>
                      <div>
                        <p className="font-semibold text-foreground">Konfiguration</p>
                        <p className="text-sm text-muted-foreground">Je nach Kanal unterschiedliche Einstellungen (siehe Tabellen unten).</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200 flex items-center justify-center font-bold text-sm">3</div>
                      <div>
                        <p className="font-semibold text-foreground">Bestätigung</p>
                        <p className="text-sm text-muted-foreground">Zusammenfassung aller Einstellungen. Klicken Sie auf „Veröffentlichen&ldquo; (In-App) oder „Jetzt senden&ldquo; (Push), um die Aktion abzuschließen.</p>
                      </div>
                    </div>
                  </div>

                  <h4 className="font-semibold text-foreground mb-2">Konfiguration: In-App Banner / Popup</h4>
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-foreground">Einstellung</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">Beschreibung</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Segment *</td><td className="py-2 px-2">Welche Kundengruppe soll die Nachricht sehen?</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Anzeigeort</td><td className="py-2 px-2">Menü, Dashboard oder Wallet – auf welcher App-Seite erscheint der Banner?</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Anzeigetyp</td><td className="py-2 px-2"><strong>Banner</strong> = eingebettet in die Seite; <strong>Popup</strong> = modales Overlay mit Schließen-Button</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Startdatum</td><td className="py-2 px-2">Ab wann soll der Banner erscheinen? (leer = sofort)</td></tr>
                        <tr><td className="py-2 px-2 font-medium text-foreground">Enddatum</td><td className="py-2 px-2">Bis wann soll der Banner erscheinen? (leer = unbegrenzt)</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <h4 className="font-semibold text-foreground mb-2">Konfiguration: Push-Benachrichtigung</h4>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-foreground">Einstellung</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">Beschreibung</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Segment *</td><td className="py-2 px-2">Zielgruppe der Push-Nachricht</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Titel *</td><td className="py-2 px-2">Überschrift der Push-Nachricht – max. 65 Zeichen</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Nachricht *</td><td className="py-2 px-2">Inhalt der Benachrichtigung – max. 200 Zeichen</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 font-medium text-foreground">Deep-Link</td><td className="py-2 px-2">Optional: App-Seite, die beim Tippen der Benachrichtigung geöffnet wird (z. B. <code className="bg-muted px-1 rounded">/menu</code>)</td></tr>
                        <tr><td className="py-2 px-2 font-medium text-foreground">Versandzeitpunkt</td><td className="py-2 px-2">Leer lassen = sofort versenden; Datum/Uhrzeit eingeben = geplanter Versand</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-800 dark:text-blue-200">
                    <strong>Wichtig bei Push:</strong> Push-Benachrichtigungen erreichen nur Nutzer, die in ihrem Browser Benachrichtigungen erlaubt haben. Nutzer ohne Erlaubnis werden automatisch ausgeschlossen – kein Fehler, nur eine Information im Ergebnis.
                  </div>
                </div>

                {/* ── ABSCHNITT 5: Snapshot-Prinzip ── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">4. Snapshot-Prinzip: Änderungen am Template nach Veröffentlichung</h3>
                  <p className="text-muted-foreground mb-3">
                    Beim Veröffentlichen wird der aktuelle Inhalt der Vorlage als <strong className="text-foreground">Snapshot</strong> (Momentaufnahme) gespeichert. Das bedeutet:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Nachträgliche Änderungen an der Vorlage im Block-Editor <strong className="text-foreground">beeinflussen laufende Kampagnen nicht</strong></li>
                    <li>Der bereits ausgespielte Banner oder die gesendete Push-Nachricht zeigt weiterhin den Inhalt zum Zeitpunkt der Veröffentlichung</li>
                    <li>Wenn Sie den aktualisierten Inhalt ausspielen möchten, veröffentlichen Sie die Vorlage einfach erneut</li>
                  </ul>
                </div>

                {/* ── ABSCHNITT 6: Monitoring ── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">5. Monitoring &amp; Verwaltung</h3>

                  <h4 className="font-semibold text-foreground mb-2">In-App Nachrichten verwalten</h4>
                  <p className="text-muted-foreground mb-3">
                    Unter <strong className="text-foreground">Marketing → In-App Nachrichten</strong> (<code className="bg-muted px-1 rounded">/admin/marketing/inapp</code>) sehen Sie alle aktiven und geplanten Banner und Popups.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                    <li><strong className="text-foreground">Filtern</strong> nach Typ (Banner/Popup/Slot) und Status (Aktiv/Inaktiv)</li>
                    <li><strong className="text-foreground">Deaktivieren</strong> eines aktiven Banners sofort per Klick (Strom-Icon)</li>
                    <li><strong className="text-foreground">Löschen</strong> einer Nachricht (Mülleimer-Icon)</li>
                    <li>Status-Badge: <span className="text-green-600 dark:text-green-400">Aktiv</span>, <span className="text-amber-600 dark:text-amber-400">Abgelaufen</span> oder <span className="text-muted-foreground">Inaktiv</span></li>
                  </ul>

                  <h4 className="font-semibold text-foreground mb-2">Push-Kampagnen verwalten</h4>
                  <p className="text-muted-foreground mb-3">
                    Unter <strong className="text-foreground">Marketing → Push-Benachrichtigungen</strong> (<code className="bg-muted px-1 rounded">/admin/marketing/push</code>) sehen Sie alle Push-Kampagnen.
                  </p>
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-foreground">Status</th>
                          <th className="text-left py-2 px-2 font-medium text-foreground">Bedeutung</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border/50"><td className="py-2 px-2 text-foreground font-medium">Entwurf</td><td className="py-2 px-2">Kampagne erstellt, noch nicht versendet</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 text-blue-600 dark:text-blue-400 font-medium">Geplant</td><td className="py-2 px-2">Versand zu einem bestimmten Zeitpunkt vorgesehen</td></tr>
                        <tr className="border-b border-border/50"><td className="py-2 px-2 text-green-600 dark:text-green-400 font-medium">Gesendet</td><td className="py-2 px-2">Erfolgreich an alle Empfänger mit Push-Erlaubnis versendet</td></tr>
                        <tr><td className="py-2 px-2 text-red-600 dark:text-red-400 font-medium">Fehler</td><td className="py-2 px-2">Versand fehlgeschlagen – bitte Support kontaktieren</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Kampagnen mit Status „Entwurf&ldquo; oder „Geplant&ldquo; können über den <strong>„Jetzt senden&ldquo;</strong>-Button sofort versendet werden.
                  </p>
                </div>

                {/* ── ABSCHNITT 7: Häufige Fragen ── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">6. Häufige Fragen</h3>
                  <div className="space-y-4 text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground">Kann ich dasselbe Template für mehrere Kanäle verwenden?</p>
                      <p>Ja. Sie können eine Vorlage als In-App Banner und zusätzlich als Push-Nachricht veröffentlichen. Jede Veröffentlichung erzeugt einen eigenen Snapshot.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Was passiert, wenn zwei Banner für denselben Anzeigeort und dasselbe Segment aktiv sind?</p>
                      <p>Die Plattform zeigt beim Aktivieren eine Warnung. Der ältere Banner wird automatisch deaktiviert, oder Sie können die Priorität manuell festlegen.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Können Kunden Banner dauerhaft ausblenden?</p>
                      <p>Kunden können Banner und Popups mit dem ✕-Button schließen. Die Nachricht wird dann nicht erneut angezeigt. Bei Popups gibt es optional eine „Nicht mehr anzeigen&ldquo;-Checkbox.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Das Segment für meine Kampagne hat keine Mitglieder – was passiert?</p>
                      <p>Der Banner wird angelegt, aber nie angezeigt. Die Plattform weist in der Monitoring-Ansicht darauf hin. Prüfen Sie die Segmentregeln unter <code className="bg-muted px-1 rounded">Marketing → Kundensegmente</code>.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Push-Versand schlägt fehl mit „VAPID nicht konfiguriert&ldquo;?</p>
                      <p>Für Push-Benachrichtigungen müssen die Umgebungsvariablen <code className="bg-muted px-1 rounded">VAPID_PUBLIC_KEY</code>, <code className="bg-muted px-1 rounded">VAPID_PRIVATE_KEY</code> und <code className="bg-muted px-1 rounded">VAPID_SUBJECT</code> gesetzt sein. VAPID-Keys können mit <code className="bg-muted px-1 rounded">npx web-push generate-vapid-keys</code> generiert werden.</p>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Ich habe die Vorlage nach der Veröffentlichung verändert – wie aktualisiere ich den aktiven Banner?</p>
                      <p>Öffnen Sie den Editor, gestalten Sie die Vorlage nach Wunsch, speichern Sie und klicken Sie erneut auf „Veröffentlichen&ldquo;. Der neue Snapshot wird dann als neue Nachricht angelegt (der alte Banner bleibt aktiv bis Sie ihn manuell deaktivieren).</p>
                    </div>
                  </div>
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
