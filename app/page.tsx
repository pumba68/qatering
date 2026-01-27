import Link from 'next/link'
import { ArrowRight, Utensils, ChefHat, BookOpen } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 gradient-animate transition-colors relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-6 animate-in fade-in slide-in-from-top">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-purple-600 shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300">
              <span className="text-4xl">🍽️</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent mb-6 leading-tight">
            Willkommen bei der<br />
            <span className="bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
              Kantine Platform
            </span>
          </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Moderne Online-Bestellungen für Kantinen und Catering-Dienstleister
            </p>
            <div className="flex items-center justify-center gap-2 mt-8">
              <div className="h-1 w-12 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <div className="h-1 w-2 bg-primary rounded-full"></div>
              <div className="h-1 w-12 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Link
              href="/menu"
              className="group relative glass-strong p-8 rounded-2xl border border-border/50 hover-lift transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: '100ms' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <Utensils className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  Als Kunde
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Essensplan ansehen und Bestellungen aufgeben
                </p>
                <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Jetzt bestellen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>

            <Link
              href="/admin"
              className="group relative glass-strong p-8 rounded-2xl border border-border/50 hover-lift transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: '200ms' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-4 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300">
                  <ChefHat className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Für die Küche
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Dashboard für Bestellungen und Abholungen verwalten
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Dashboard öffnen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>

            <Link
              href="/wiki"
              className="group relative glass-strong p-8 rounded-2xl border border-border/50 hover-lift transition-all duration-300 overflow-hidden animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: '300ms' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-4 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-300">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Dokumentation
                </h2>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Vollständige Wiki mit allen Implementierungen
                </p>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Wiki öffnen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </Link>
          </div>

          {/* Additional Info Section */}
          <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom" style={{ animationDelay: '400ms' }}>
            <div className="inline-flex items-center gap-4 px-6 py-3 glass rounded-full border border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full pulse-glow"></div>
                <span className="text-sm text-muted-foreground">System online</span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <span className="text-sm text-muted-foreground">24/7 verfügbar</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
