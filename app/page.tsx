import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Willkommen bei der Kantine Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Online-Bestellungen für Kantinen und Catering-Dienstleister
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <Link
              href="/menu"
              className="bg-card p-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-border"
            >
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                👤 Als Kunde
              </h2>
              <p className="text-muted-foreground">
                Essensplan ansehen und Bestellungen aufgeben
              </p>
            </Link>

            <Link
              href="/admin"
              className="bg-card p-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-border"
            >
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                🍳 Für die Küche
              </h2>
              <p className="text-muted-foreground">
                Dashboard für Bestellungen und Abholungen verwalten
              </p>
            </Link>

            <Link
              href="/wiki"
              className="bg-card p-8 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 border border-border"
            >
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                📚 Dokumentation
              </h2>
              <p className="text-muted-foreground">
                Vollständige Wiki mit allen Implementierungen
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
