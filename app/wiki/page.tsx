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
  { id: 'sepa', label: 'SEPA-Lastschrift', icon: '🏦' },
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

            {/* SEPA-Lastschrift */}
            {show('sepa') && (
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">🏦 SEPA-Lastschrift</h2>
                  <p className="text-muted-foreground">
                    Als Betreiber können Sie offene Vertragspartner-Forderungen per SEPA-Bankeinzug einziehen, anstatt auf manuelle Überweisungen zu warten. Das System generiert eine standardkonforme <strong className="text-foreground">ISO 20022 pain.008.003.03 CORE</strong> XML-Datei, die Sie bei Ihrer Hausbank einreichen.
                  </p>
                </div>

                {/* Einmalige Einrichtung */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">1. Einmalige Einrichtung</h3>

                  <h4 className="text-base font-semibold text-foreground mb-2">Betreiber-SEPA-Daten</h4>
                  <p className="text-muted-foreground mb-3">
                    Unter <strong className="text-foreground">Einstellungen → Zahlungen → SEPA-Einstellungen</strong> müssen drei Felder einmalig gepflegt werden:
                  </p>
                  <table className="w-full text-sm border-collapse mb-4">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-foreground">Feld</th>
                        <th className="text-left py-2 font-medium text-foreground">Beschreibung</th>
                        <th className="text-left py-2 font-medium text-foreground">Beispiel</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">Gläubiger-ID</td>
                        <td className="py-2">Eindeutige ID Ihres Unternehmens als SEPA-Einreicher – einmalig von der Hausbank vergeben</td>
                        <td className="py-2 font-mono text-xs">DE98ZZZ09999999999</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">Betreiber-IBAN</td>
                        <td className="py-2">Ihr Empfängerkonto – hierauf werden die Lastschriften eingezogen</td>
                        <td className="py-2 font-mono text-xs">DE89 3704 0044 …</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium text-foreground">Betreiber-BIC</td>
                        <td className="py-2">BIC/SWIFT-Code Ihrer Bank</td>
                        <td className="py-2 font-mono text-xs">COBADEFFXXX</td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 className="text-base font-semibold text-foreground mb-2">SEPA-Bankdaten pro Vertragspartner</h4>
                  <p className="text-muted-foreground mb-3">
                    Unter <strong className="text-foreground">Verwaltung → Unternehmen → Bearbeiten → SEPA / Bankverbindung</strong> müssen für jeden Vertragspartner folgende Felder gepflegt sein:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1.5 mb-3">
                    <li><strong className="text-foreground">IBAN</strong> – Schuldner-Konto des Vertragspartners (wird per Lastschrift belastet)</li>
                    <li><strong className="text-foreground">BIC</strong> – Bank des Vertragspartners</li>
                    <li><strong className="text-foreground">Mandatsreferenz</strong> – Eindeutige Kennung des unterzeichneten Lastschriftmandats, max. 35 Zeichen (z. B. <code className="bg-muted px-1 rounded text-xs">VP-MUSTERGMBH-001</code>)</li>
                    <li><strong className="text-foreground">Mandatsdatum</strong> – Datum der Mandatsunterzeichnung durch den Vertragspartner</li>
                  </ul>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
                    <strong>Wichtig:</strong> Das SEPA-Lastschriftmandat muss vor der ersten Lastschrift vom Vertragspartner <strong>schriftlich unterzeichnet</strong> worden sein. Bewahren Sie das Original mindestens 14 Monate nach dem letzten Einzug auf.
                  </div>
                </div>

                {/* SEPA-Status prüfen */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">2. SEPA-Status in der Übersicht</h3>
                  <p className="text-muted-foreground mb-3">
                    In der Tabelle unter <strong className="text-foreground">Finanzen → Abrechnung</strong> zeigt jede Zeile einen SEPA-Status:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1.5">
                    <li><strong className="text-foreground">✅ Vollständig</strong> – Alle vier SEPA-Felder sind gepflegt. Lastschrift kann generiert werden.</li>
                    <li><strong className="text-foreground">⚠ Fehlt</strong> – Mindestens ein Pflichtfeld fehlt. Der „Generieren"-Button im Modal ist deaktiviert.</li>
                  </ul>
                </div>

                {/* SEPA manuell generieren */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">3. SEPA-Datei manuell generieren</h3>
                  <ol className="list-decimal list-inside space-y-4 text-muted-foreground">
                    <li>
                      <strong className="text-foreground">SEPA-Lastschrift-Button klicken</strong><br />
                      <span className="ml-5 block mt-1">In der Tabelle „Offene Salden" (Finanzen → Abrechnung) klicken Sie in der gewünschten Zeile auf <strong className="text-foreground">„SEPA-Lastschrift"</strong>. Das Modal öffnet sich.</span>
                    </li>
                    <li>
                      <strong className="text-foreground">Quelle wählen</strong><br />
                      <span className="ml-5 block mt-1">
                        <span className="inline-block bg-muted rounded px-2 py-0.5 text-xs font-medium text-foreground mr-2">INVOICED-Rechnungen</span>
                        Zieht alle Rechnungen mit Status „Rechnung gestellt" ein – präzise Kontrolle, welche Perioden abgebucht werden.<br />
                        <span className="inline-block bg-muted rounded px-2 py-0.5 text-xs font-medium text-foreground mr-2 mt-1">Offener Saldo</span>
                        Fasst alle noch nicht abgerechneten Bestellungen zusammen – das System erstellt automatisch eine interne Rechnung.
                      </span>
                    </li>
                    <li>
                      <strong className="text-foreground">Sequenztyp wählen</strong><br />
                      <span className="ml-5 block mt-1">
                        <strong className="text-foreground">RCUR</strong> (Wiederkehrend) – Standard ab der zweiten Lastschrift auf dem gleichen Mandat.<br />
                        <strong className="text-foreground">FRST</strong> (Erstlastschrift) – Nur beim allerersten Einzug auf Basis eines brandneuen Mandats.
                      </span>
                    </li>
                    <li>
                      <strong className="text-foreground">Fälligkeitsdatum festlegen</strong><br />
                      <span className="ml-5 block mt-1">SEPA CORE erfordert mindestens <strong className="text-foreground">5 Werktage Vorlaufzeit</strong>. Das System berechnet automatisch das frühestmögliche Datum und sperrt frühere Eingaben.</span>
                    </li>
                    <li>
                      <strong className="text-foreground">„Generieren &amp; Herunterladen" klicken</strong><br />
                      <span className="ml-5 block mt-1">Der Browser lädt automatisch eine <code className="bg-muted px-1 rounded text-xs">sepa-lastschrift-{'{UnternehmenName}'}-{'{YYYY-MM-DD}'}.xml</code> herunter. Die enthaltenen Rechnungen erhalten den Status <strong className="text-foreground">„SEPA eingereicht"</strong>.</span>
                    </li>
                    <li>
                      <strong className="text-foreground">XML bei der Bank einreichen</strong><br />
                      <span className="ml-5 block mt-1">Laden Sie die XML-Datei im Online-Banking-Portal Ihrer Hausbank hoch (Bereich SEPA-Lastschrift / Datei-Upload) oder übertragen Sie sie per EBICS.</span>
                    </li>
                    <li>
                      <strong className="text-foreground">Zahlungseingang als bezahlt markieren</strong><br />
                      <span className="ml-5 block mt-1">Sobald das Geld auf Ihrem Konto eingegangen ist, markieren Sie die Rechnung unter <strong className="text-foreground">Finanzen → Abrechnung → Rechnungen</strong> manuell als <strong className="text-foreground">„Bezahlt"</strong>.</span>
                    </li>
                  </ol>
                </div>

                {/* Status-Workflow */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">4. Rechnungsstatus-Übersicht</h3>
                  <table className="w-full text-sm border-collapse mb-2">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-foreground">Status</th>
                        <th className="text-left py-2 font-medium text-foreground">Bedeutung</th>
                        <th className="text-left py-2 font-medium text-foreground">Nächster Schritt</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">Entwurf</td>
                        <td className="py-2">Rechnung angelegt, noch nicht versendet</td>
                        <td className="py-2">PDF exportieren</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">Rechnung gestellt</td>
                        <td className="py-2">PDF exportiert, Zahlung erwartet</td>
                        <td className="py-2">SEPA generieren oder auf Überweisung warten</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 font-medium text-foreground">SEPA eingereicht</td>
                        <td className="py-2">XML generiert, Einzug bei Bank beauftragt</td>
                        <td className="py-2">Geldeingang abwarten, dann als bezahlt markieren</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium text-foreground">Bezahlt</td>
                        <td className="py-2">Zahlungseingang bestätigt</td>
                        <td className="py-2">–</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Häufige Fehler */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">5. Häufige Fehlermeldungen</h3>
                  <div className="space-y-4">
                    {[
                      {
                        msg: 'Betreiber-SEPA-Daten unvollständig',
                        solution: 'Navigieren Sie zu Einstellungen → Zahlungen und ergänzen Sie Gläubiger-ID, Betreiber-IBAN und Betreiber-BIC.',
                      },
                      {
                        msg: 'Vertragspartner hat unvollständige SEPA-Bankdaten',
                        solution: 'Öffnen Sie den Vertragspartner unter Verwaltung → Unternehmen und tragen Sie IBAN, BIC, Mandatsreferenz und Mandatsdatum ein.',
                      },
                      {
                        msg: 'Keine Rechnungen mit Status „Rechnung gestellt"',
                        solution: 'Exportieren Sie zuerst eine Rechnung als PDF (Status wechselt auf INVOICED), oder wählen Sie die Quelle „Offener Saldo".',
                      },
                      {
                        msg: 'Kein offener Saldo für diesen Vertragspartner',
                        solution: 'Es liegen keine nicht-abgerechneten Bestellungen mit Zuschussbetrag vor.',
                      },
                      {
                        msg: 'SEPA CORE erfordert mindestens 5 Werktage Vorlaufzeit',
                        solution: 'Wählen Sie das vom System angezeigte frühestmögliche Datum oder später.',
                      },
                    ].map(({ msg, solution }) => (
                      <div key={msg} className="rounded-xl border border-border/50 p-4">
                        <p className="font-medium text-foreground mb-1">„{msg}"</p>
                        <p className="text-sm text-muted-foreground">{solution}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Glossar */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">6. Glossar</h3>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium text-foreground">Begriff</th>
                        <th className="text-left py-2 font-medium text-foreground">Erklärung</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      {[
                        ['Gläubiger-ID', '18-stellige ID des Lastschrift-Einreichers (z. B. DE98ZZZ09999999999); einmalig von der Bank vergeben'],
                        ['Mandat', 'Schriftliche Erlaubnis des Vertragspartners, Lastschriften zuzulassen'],
                        ['Mandatsreferenz', 'Eindeutige Kennung des Mandats, max. 35 Zeichen'],
                        ['FRST', 'Sequenztyp Erstlastschrift – erste Lastschrift auf einem neuen Mandat'],
                        ['RCUR', 'Sequenztyp Wiederkehrend – Folge-Lastschriften auf bestehendem Mandat'],
                        ['pain.008.003.03', 'ISO 20022 XML-Format für SEPA Core Direct Debit'],
                        ['Fälligkeitsdatum', 'Datum, an dem die Bank den Einzug ausführt (mind. 5 Werktage Vorlaufzeit)'],
                        ['Rücklastschrift', 'Stornierung einer Lastschrift durch die Bank oder den Kontoinhaber – muss manuell nachbearbeitet werden'],
                      ].map(([term, desc]) => (
                        <tr key={term} className="border-b border-border/50">
                          <td className="py-2 font-medium text-foreground">{term}</td>
                          <td className="py-2">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              <section className="bg-card rounded-2xl border border-border/50 p-6 md:p-8 space-y-10">

                {/* Header */}
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">🎨 Design Guidelines</h2>
                  <p className="text-muted-foreground">
                    Visuelles Referenz-System für die Kantine Platform. UI-Bibliothek: <strong className="text-foreground">shadcn/ui</strong> (Radix) + <strong className="text-foreground">Tailwind CSS</strong>. Icons: <strong className="text-foreground">Lucide React</strong>.
                  </p>
                </div>

                {/* ── 1. FARB-SYSTEM ─────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">1. Farb-System</h3>
                  <p className="text-sm text-muted-foreground mb-4">Semantische Farben mit konsistenten Light- und Dark-Mode-Varianten.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Primary', bg: 'bg-primary', text: 'text-primary-foreground', hex: '221.2 83.2% 53.3%', usage: 'Buttons, Links, Fokus' },
                      { label: 'Kategorie (Grün)', bg: 'bg-green-600', text: 'text-white', hex: 'green-600', usage: 'Kategorie-Badges' },
                      { label: 'FIT & VITAL (Blau)', bg: 'bg-blue-500', text: 'text-white', hex: 'blue-500', usage: 'Spezial-Tags' },
                      { label: 'Allergene (Amber)', bg: 'bg-amber-500', text: 'text-white', hex: 'amber-500', usage: 'Allergen-Badges' },
                      { label: 'Destructive (Rot)', bg: 'bg-destructive', text: 'text-destructive-foreground', hex: 'destructive', usage: 'Fehler, Löschen' },
                      { label: 'Muted', bg: 'bg-muted', text: 'text-muted-foreground', hex: 'muted', usage: 'Hintergründe, Tags' },
                      { label: 'Emerald (Finanzen)', bg: 'bg-emerald-600', text: 'text-white', hex: 'emerald-600', usage: 'Billing, SEPA' },
                      { label: 'Violet (Marketing)', bg: 'bg-violet-600', text: 'text-white', hex: 'violet-600', usage: 'Marketing-Bereich' },
                    ].map(({ label, bg, text, hex, usage }) => (
                      <div key={label} className="rounded-xl overflow-hidden border border-border/50 shadow-sm">
                        <div className={`${bg} ${text} h-14 flex items-center justify-center`}>
                          <span className="text-xs font-mono font-semibold">{hex}</span>
                        </div>
                        <div className="p-2.5 bg-card">
                          <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{usage}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Gradient-Hintergründe */}
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Header-Gradienten</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: 'Standard (Grün)', cls: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50', code: 'from-green-50 via-emerald-50 to-teal-50' },
                        { label: 'Finanzen (Blau)', cls: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50', code: 'from-blue-50 via-indigo-50 to-violet-50' },
                        { label: 'Admin-Sidebar', cls: 'bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900', code: 'from-violet-900 via-purple-900 to-indigo-900' },
                      ].map(({ label, cls, code }) => (
                        <div key={label} className={`${cls} rounded-xl h-14 flex flex-col items-center justify-center border border-border/30 px-3`}>
                          <span className="text-xs font-semibold text-foreground/80">{label}</span>
                          <span className="text-xs font-mono text-foreground/50 mt-0.5">{code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── 2. TYPOGRAFIE ──────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">2. Typografie</h3>
                  <p className="text-sm text-muted-foreground mb-4">Alle Texte verwenden die System-Schrift via Tailwind. Keine externe Schrift.</p>

                  <div className="rounded-xl border border-border/50 bg-muted/20 p-6 space-y-4">
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-5xl font-bold text-foreground">H1</span>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">text-4xl md:text-5xl font-bold</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Seitenüberschriften</p>
                      </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-3xl font-bold text-foreground">H2</span>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">text-3xl font-bold</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Sektionen</p>
                      </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-xl font-semibold text-foreground">H3</span>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">text-xl font-semibold</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Unterabschnitte</p>
                      </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-lg font-bold text-foreground">H4 Card</span>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">text-lg font-bold</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Card-Titel</p>
                      </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-sm text-foreground">Body Text</span>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">text-sm text-foreground</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Normaler Fließtext</p>
                      </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-sm text-muted-foreground">Muted Text</span>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">text-sm text-muted-foreground</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Beschreibungen, Meta-Infos</p>
                      </div>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Label</span>
                      <div>
                        <p className="text-sm font-mono text-muted-foreground">text-xs font-medium uppercase tracking-wider</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Gruppen-Labels, Sidebar-Kategorien</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 3. BADGE-SYSTEM ────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">3. Badge-System</h3>
                  <p className="text-sm text-muted-foreground mb-4">Zwei Badge-Typen: <strong className="text-foreground">Overlay</strong> (auf Bildern) und <strong className="text-foreground">Inline</strong> (im Fließtext).</p>

                  <div className="space-y-4">
                    {/* Overlay Badges */}
                    <div className="rounded-xl border border-border/50 p-4">
                      <p className="text-sm font-semibold text-foreground mb-3">Overlay Badges <span className="text-xs font-normal text-muted-foreground ml-1">— auf Karten/Bildern</span></p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg">HAUPTGERICHT</span>
                        <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-md shadow-lg">FIT &amp; VITAL</span>
                        <span className="px-2 py-1 bg-destructive/90 text-white text-xs font-bold rounded-md shadow-lg">INAKTIV</span>
                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-md shadow-sm border border-border/30">Anpassbar</span>
                      </div>
                      <pre className="mt-3 text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">{`px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg`}</pre>
                    </div>

                    {/* Inline Badges */}
                    <div className="rounded-xl border border-border/50 p-4">
                      <p className="text-sm font-semibold text-foreground mb-3">Inline Badges <span className="text-xs font-normal text-muted-foreground ml-1">— im Content</span></p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">Vegan</span>
                        <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">Vegetarisch</span>
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">Gluten</span>
                        <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">Laktose</span>
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">Glutenfrei</span>
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">Low Carb</span>
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium">+3</span>
                      </div>
                      <pre className="mt-3 text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">{`// Vegan/Vegetarisch
px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium

// Allergene
px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium

// Sonstige
px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium`}</pre>
                    </div>

                    {/* Status Badges */}
                    <div className="rounded-xl border border-border/50 p-4">
                      <p className="text-sm font-semibold text-foreground mb-3">Status Badges <span className="text-xs font-normal text-muted-foreground ml-1">— shadcn Badge-Komponente</span></p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground">Aktiv</span>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">Entwurf</span>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground border-border">Outline</span>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-destructive text-destructive-foreground">Fehler</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 4. BUTTONS ─────────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">4. Button-Varianten</h3>
                  <p className="text-sm text-muted-foreground mb-4">Alle Buttons verwenden die shadcn <code className="bg-muted px-1 rounded text-xs">Button</code>-Komponente mit Standard-Varianten und optionalen Gradient-Erweiterungen.</p>

                  <div className="rounded-xl border border-border/50 p-5 space-y-5">
                    {/* Reihe 1: Standard-Varianten */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Standard shadcn-Varianten</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Primary</button>
                        <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">Outline</button>
                        <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Secondary</button>
                        <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 hover:bg-accent hover:text-accent-foreground transition-colors">Ghost</button>
                        <button className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium h-9 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Destructive</button>
                      </div>
                    </div>

                    {/* Reihe 2: Gradient-Buttons */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Gradient-Buttons (Kantine-spezifisch)</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <button className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold h-9 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 transition-all">Hinzufügen</button>
                        <button className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold h-9 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Generieren</button>
                        <button className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold h-9 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Kampagne</button>
                      </div>
                      <pre className="mt-3 text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">{`bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg hover:from-green-700 hover:to-emerald-700 hover:scale-105 active:scale-95 transition-all`}</pre>
                    </div>

                    {/* Reihe 3: Größen */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Größen</p>
                      <div className="flex flex-wrap gap-3 items-center">
                        <button className="inline-flex items-center rounded-md text-xs font-medium h-7 px-3 bg-primary text-primary-foreground">sm</button>
                        <button className="inline-flex items-center rounded-md text-sm font-medium h-9 px-4 bg-primary text-primary-foreground">default</button>
                        <button className="inline-flex items-center rounded-md text-base font-medium h-11 px-8 bg-primary text-primary-foreground">lg</button>
                        <button className="inline-flex items-center justify-center rounded-md h-9 w-9 bg-primary text-primary-foreground">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── 5. CARD-DESIGN ─────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">5. Card-Design</h3>
                  <p className="text-sm text-muted-foreground mb-4">Cards sind das zentrale UI-Element. Alle Cards verwenden <code className="bg-muted px-1 rounded text-xs">rounded-2xl</code> und <code className="bg-muted px-1 rounded text-xs">border border-border/50</code>.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dish-Card Beispiel */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dish Card (mit Bild)</p>
                      <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer">
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                            <span className="text-5xl">🍝</span>
                          </div>
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-md shadow-lg">HAUPTGERICHT</span>
                            <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-md shadow-lg">FIT &amp; VITAL</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="text-lg font-bold text-foreground leading-tight">Spaghetti Bolognese</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">Klassische Bolognese mit frischen Tomaten und Parmesan</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="text-orange-500">🔥</span>
                            <span className="font-medium text-foreground">680 kcal</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full font-medium">Gluten</span>
                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full font-medium">Laktose</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin-Card */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Admin-Card (shadcn Card)</p>
                      <div className="rounded-2xl border border-border/50 bg-card">
                        <div className="p-6 pb-3">
                          <h4 className="text-base font-semibold text-foreground">Offene Rechnungen</h4>
                          <p className="text-sm text-muted-foreground mt-1">Letzte 30 Tage</p>
                        </div>
                        <div className="px-6 pb-6 space-y-3">
                          <div className="text-3xl font-bold text-foreground">12.340,00 €</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="text-emerald-600 font-medium">↑ 8,2%</span>
                            <span>gegenüber Vormonat</span>
                          </div>
                          <div className="h-px bg-border/50" />
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Vertragspartner</span>
                            <span className="font-medium text-foreground">7 aktiv</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Offener Saldo</span>
                            <span className="font-medium text-foreground">3.200,00 €</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <pre className="mt-4 text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">{`// Card-Container (Standard)
<div className="rounded-2xl border border-border/50 bg-card">

// Dish-Card mit Hover
<div className="group relative bg-card rounded-2xl overflow-hidden border border-border/50
  transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">

// Bild mit Zoom-Effekt
<div className="group-hover:scale-110 transition-transform duration-500">`}</pre>
                </div>

                {/* ── 6. LAYOUT-PATTERNS ─────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">6. Layout-Patterns</h3>
                  <p className="text-sm text-muted-foreground mb-4">Wiederkehrende Layout-Strukturen für konsistente Seitenarchitektur.</p>

                  <div className="space-y-4">
                    {/* Header-Gradient */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Seiten-Header (Gradient)</p>
                      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-6">
                        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                          <span>🍳</span> Seitenname
                        </h1>
                        <p className="text-muted-foreground mt-1">Kurze Beschreibung der Seitenfunktion für den Admin.</p>
                      </div>
                      <pre className="mt-2 text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">{`<div className="rounded-2xl border border-border/50 bg-gradient-to-br
  from-green-50 via-emerald-50 to-teal-50
  dark:from-green-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-6">`}</pre>
                    </div>

                    {/* Grid-Layouts */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Card-Grid</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {['Spalte 1', 'Spalte 2', 'Spalte 3'].map((l) => (
                          <div key={l} className="rounded-xl border border-dashed border-border/70 bg-muted/30 h-16 flex items-center justify-center text-sm text-muted-foreground">{l}</div>
                        ))}
                      </div>
                      <pre className="mt-2 text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">{`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}</pre>
                    </div>

                    {/* Tabellen */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Admin-Tabelle</p>
                      <div className="rounded-xl border border-border/50 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50 border-b border-border">
                            <tr>
                              <th className="text-left py-2.5 px-4 font-medium text-foreground">Name</th>
                              <th className="text-left py-2.5 px-4 font-medium text-foreground">Status</th>
                              <th className="text-right py-2.5 px-4 font-medium text-foreground">Betrag</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { name: 'Muster GmbH', status: 'Aktiv', amount: '1.200,00 €' },
                              { name: 'Beispiel AG', status: 'Inaktiv', amount: '340,00 €' },
                            ].map((r) => (
                              <tr key={r.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-4 text-foreground">{r.name}</td>
                                <td className="py-2.5 px-4 text-muted-foreground">{r.status}</td>
                                <td className="py-2.5 px-4 text-right font-medium text-foreground">{r.amount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <pre className="mt-2 text-xs font-mono bg-muted rounded-lg p-3 text-muted-foreground overflow-x-auto">{`// Tabellen-Container
rounded-xl border border-border/50 overflow-hidden

// Header
<thead className="bg-muted/50 border-b border-border">

// Zeilen-Hover
hover:bg-muted/30 transition-colors`}</pre>
                    </div>
                  </div>
                </div>

                {/* ── 7. BORDER-RADIUS & SPACING ─────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">7. Border-Radius & Spacing</h3>
                  <p className="text-sm text-muted-foreground mb-4">Konsistente Radius-Werte je nach Kontext.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'rounded-md', cls: 'rounded-md', desc: 'Overlay Badges', px: '6px' },
                      { label: 'rounded-lg', cls: 'rounded-lg', desc: 'Buttons (sm)', px: '8px' },
                      { label: 'rounded-xl', cls: 'rounded-xl', desc: 'Buttons, Inputs', px: '12px' },
                      { label: 'rounded-2xl', cls: 'rounded-2xl', desc: 'Cards, Panels', px: '16px' },
                    ].map(({ label, cls, desc, px }) => (
                      <div key={label} className="text-center">
                        <div className={`${cls} bg-primary/20 border-2 border-primary/40 h-14 w-full mb-2`} />
                        <p className="text-xs font-mono font-semibold text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                        <p className="text-xs text-muted-foreground">{px}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Spacing-Referenz</p>
                    <div className="rounded-xl border border-border/50 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="text-left py-2 px-4 font-medium text-foreground">Kontext</th>
                            <th className="text-left py-2 px-4 font-medium text-foreground">Klasse</th>
                            <th className="text-left py-2 px-4 font-medium text-foreground">Wert</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          {[
                            ['Card Content Padding', 'p-4', '16px'],
                            ['Card Header Padding', 'p-6 md:p-8', '24px / 32px'],
                            ['Card Grid Gap', 'gap-6', '24px'],
                            ['Content Spacing', 'space-y-3', '12px'],
                            ['Badge Gap', 'gap-2', '8px'],
                            ['Inline Tag Gap', 'gap-1.5', '6px'],
                          ].map(([ctx, cls, val]) => (
                            <tr key={ctx} className="border-b border-border/50">
                              <td className="py-2 px-4 text-foreground">{ctx}</td>
                              <td className="py-2 px-4 font-mono">{cls}</td>
                              <td className="py-2 px-4">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* ── 8. ANIMATIONEN ─────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">8. Animationen & Transitions</h3>
                  <p className="text-sm text-muted-foreground mb-4">Subtile Hover-Effekte für interaktive Elemente.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      {
                        label: 'Card Hover',
                        cls: 'hover:shadow-2xl hover:scale-[1.02] transition-all duration-300',
                        code: 'hover:shadow-2xl hover:scale-[1.02]\ntransition-all duration-300',
                      },
                      {
                        label: 'Button Hover',
                        cls: 'hover:scale-105 active:scale-95 transition-all',
                        code: 'hover:scale-105 active:scale-95\ntransition-all',
                      },
                      {
                        label: 'Bild Zoom',
                        cls: 'hover:scale-110 transition-transform duration-500',
                        code: 'group-hover:scale-110\ntransition-transform duration-500',
                      },
                    ].map(({ label, cls, code }) => (
                      <div key={label} className="rounded-xl border border-border/50 p-4">
                        <p className="text-xs font-semibold text-foreground mb-3">{label}</p>
                        <div className={`rounded-xl bg-primary/10 border border-primary/20 h-16 flex items-center justify-center cursor-pointer ${cls}`}>
                          <span className="text-sm text-primary font-medium">Hover mich</span>
                        </div>
                        <pre className="mt-3 text-xs font-mono text-muted-foreground whitespace-pre-wrap">{code}</pre>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 9. DARK MODE ───────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">9. Dark Mode</h3>
                  <p className="text-sm text-muted-foreground mb-4">Alle Farben und Gradients haben Dark-Mode-Varianten. Grundprinzip: reduzierte Opacity im Dark Mode.</p>

                  <div className="rounded-xl border border-border/50 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium text-foreground">Kontext</th>
                          <th className="text-left py-2 px-4 font-medium text-foreground">Light Mode</th>
                          <th className="text-left py-2 px-4 font-medium text-foreground">Dark Mode</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {[
                          ['Header-Gradient', 'from-green-50 via-emerald-50 to-teal-50', 'dark:from-green-950/20 dark:via-emerald-950/20'],
                          ['Vegan-Badge Bg', 'bg-green-50', 'dark:bg-green-950/30'],
                          ['Vegan-Badge Text', 'text-green-700', 'dark:text-green-400'],
                          ['Allergen-Badge Bg', 'bg-amber-50', 'dark:bg-amber-950/30'],
                          ['Allergen-Badge Text', 'text-amber-700', 'dark:text-amber-400'],
                          ['Gradient-Opacity', '(voll)', '/20 Suffix'],
                        ].map(([ctx, light, dark]) => (
                          <tr key={ctx} className="border-b border-border/50">
                            <td className="py-2 px-4 text-foreground">{ctx}</td>
                            <td className="py-2 px-4 font-mono">{light}</td>
                            <td className="py-2 px-4 font-mono">{dark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── 10. CHECKLISTE ─────────────────────────────────────────────── */}
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-1">10. Checkliste neue Komponenten</h3>
                  <p className="text-sm text-muted-foreground mb-4">Vor dem Merge einer neuen UI-Komponente prüfen:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      'Dark Mode Support implementiert',
                      'Responsive Design (Mobile-first)',
                      'Hover-Effekte definiert',
                      'Konsistentes Spacing (p-4, gap-6)',
                      'Korrekte Border-Radius (rounded-2xl für Cards)',
                      'Semantisches HTML (<button>, <nav>, etc.)',
                      'ARIA-Labels für Icon-only-Buttons',
                      'Transition-Animationen vorhanden',
                      'Konsistente Badge-Farben (kein freies Erfinden)',
                      'Line-Clamping für lange Texte (line-clamp-2)',
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5 rounded-lg border border-border/50 px-3 py-2.5 bg-muted/20">
                        <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
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
