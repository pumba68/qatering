import { PrismaClient } from '../src/generated/prisma'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────────────────
// Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────────────────

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPickupCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

// ─────────────────────────────────────────────────────────────────────────────
// Hauptfunktion
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starte erweitertes Seeding...')

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. ORGANISATION
  // ═══════════════════════════════════════════════════════════════════════════
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-kantine' },
    update: {},
    create: {
      name: 'Demo Kantine GmbH',
      slug: 'demo-kantine',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
    },
  })
  console.log('✅ Organisation:', organization.name)

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. STANDORTE (2 Locations)
  // ═══════════════════════════════════════════════════════════════════════════
  const location1 = await prisma.location.upsert({
    where: { id: 'demo-location-1' },
    update: {},
    create: {
      id: 'demo-location-1',
      organizationId: organization.id,
      name: 'Hauptstandort Berlin',
      address: 'Musterstraße 123, 10115 Berlin',
      phone: '+49 30 12345678',
      email: 'berlin@demo-kantine.de',
      openingHours: {
        monday: '11:00-14:00',
        tuesday: '11:00-14:00',
        wednesday: '11:00-14:00',
        thursday: '11:00-14:00',
        friday: '11:00-14:00',
        saturday: 'geschlossen',
        sunday: 'geschlossen',
      },
      isActive: true,
    },
  })

  const location2 = await prisma.location.upsert({
    where: { id: 'demo-location-2' },
    update: {},
    create: {
      id: 'demo-location-2',
      organizationId: organization.id,
      name: 'Zweigstelle Hamburg',
      address: 'Hafenallee 45, 20457 Hamburg',
      phone: '+49 40 87654321',
      email: 'hamburg@demo-kantine.de',
      openingHours: {
        monday: '11:30-14:30',
        tuesday: '11:30-14:30',
        wednesday: '11:30-14:30',
        thursday: '11:30-14:30',
        friday: '11:30-13:30',
        saturday: 'geschlossen',
        sunday: 'geschlossen',
      },
      isActive: true,
    },
  })
  console.log('✅ 2 Standorte erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. UNTERNEHMEN (Companies) – für Arbeitgeberzuschuss
  // ═══════════════════════════════════════════════════════════════════════════
  const company1 = await prisma.company.upsert({
    where: { id: 'company-tech-ag' },
    update: {},
    create: {
      id: 'company-tech-ag',
      name: 'TechCorp AG',
      contractNumber: 'V-2024-001',
      isActive: true,
      subsidyType: 'FIXED',
      subsidyValue: 3.50,
      subsidyMaxPerDay: 3.50,
      validFrom: new Date('2024-01-01'),
    },
  })

  const company2 = await prisma.company.upsert({
    where: { id: 'company-media-gmbh' },
    update: {},
    create: {
      id: 'company-media-gmbh',
      name: 'MediaHaus GmbH',
      contractNumber: 'V-2024-002',
      isActive: true,
      subsidyType: 'PERCENTAGE',
      subsidyValue: 20,
      subsidyMaxPerDay: 4.00,
      validFrom: new Date('2024-03-01'),
    },
  })

  const company3 = await prisma.company.upsert({
    where: { id: 'company-startup' },
    update: {},
    create: {
      id: 'company-startup',
      name: 'GreenStart GmbH',
      contractNumber: 'V-2025-003',
      isActive: true,
      subsidyType: 'NONE',
      validFrom: new Date('2025-01-01'),
    },
  })
  console.log('✅ 3 Unternehmen erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. METADATEN (Diät-Kategorien, Allergene, Speise-Kategorien)
  // ═══════════════════════════════════════════════════════════════════════════
  const dietCategories = [
    { name: 'vegan', icon: '🌱', color: '#22c55e', description: 'Vollständig pflanzlich, ohne tierische Produkte' },
    { name: 'vegetarisch', icon: '🥬', color: '#10b981', description: 'Ohne Fleisch und Fisch' },
    { name: 'fitness', icon: '💪', color: '#3b82f6', description: 'Proteinreich, ideal für Sportler' },
    { name: 'low-carb', icon: '🥩', color: '#8b5cf6', description: 'Wenig Kohlenhydrate, viel Protein' },
    { name: 'glutenfrei', icon: '🌾', color: '#f59e0b', description: 'Ohne Gluten, geeignet für Zöliakie' },
    { name: 'laktosefrei', icon: '🥛', color: '#ef4444', description: 'Ohne Laktose' },
    { name: 'bio', icon: '♻️', color: '#16a34a', description: 'Aus ökologischem Anbau' },
    { name: 'regional', icon: '📍', color: '#0ea5e9', description: 'Zutaten aus der Region' },
  ]

  const allergens = [
    { name: 'Nüsse', icon: '🥜', color: '#dc2626', description: 'Enthält Schalenfrüchte/Nüsse' },
    { name: 'Gluten', icon: '🌾', color: '#f59e0b', description: 'Enthält Gluten (Weizen, Roggen, Gerste)' },
    { name: 'Laktose', icon: '🥛', color: '#ef4444', description: 'Enthält Laktose' },
    { name: 'Ei', icon: '🥚', color: '#fbbf24', description: 'Enthält Hühnerei' },
    { name: 'Milch', icon: '🥛', color: '#60a5fa', description: 'Enthält Kuhmilch' },
    { name: 'Soja', icon: '🫘', color: '#84cc16', description: 'Enthält Soja' },
    { name: 'Fisch', icon: '🐟', color: '#06b6d4', description: 'Enthält Fisch' },
    { name: 'Schalentiere', icon: '🦐', color: '#ec4899', description: 'Enthält Schalentiere' },
    { name: 'Sellerie', icon: '🌿', color: '#65a30d', description: 'Enthält Sellerie' },
    { name: 'Senf', icon: '🌻', color: '#ca8a04', description: 'Enthält Senf' },
    { name: 'Sesam', icon: '🌰', color: '#a16207', description: 'Enthält Sesam' },
    { name: 'Sulfite', icon: '⚗️', color: '#7c3aed', description: 'Enthält Sulfite/Schwefeldioxid' },
  ]

  const dishCategories = [
    { name: 'Hauptgericht', icon: '🍽️', color: '#3b82f6', description: 'Vollständige Hauptspeise' },
    { name: 'Dessert', icon: '🍰', color: '#ec4899', description: 'Süße Nachspeise' },
    { name: 'Salat', icon: '🥗', color: '#10b981', description: 'Frischer Salat' },
    { name: 'Vorspeise', icon: '🥖', color: '#f59e0b', description: 'Leichte Vorspeise' },
    { name: 'Suppe', icon: '🍲', color: '#ef4444', description: 'Warme Suppe' },
    { name: 'Snack', icon: '🍿', color: '#8b5cf6', description: 'Kleiner Snack' },
    { name: 'Bowl', icon: '🥣', color: '#06b6d4', description: 'Nährstoffreiche Bowl' },
    { name: 'Wrap & Sandwich', icon: '🌯', color: '#f97316', description: 'Belegte Brote und Wraps' },
  ]

  for (let i = 0; i < dietCategories.length; i++) {
    const cat = dietCategories[i]
    await prisma.metadata.upsert({
      where: { type_name: { type: 'DIET_CATEGORY', name: cat.name } },
      update: {},
      create: { type: 'DIET_CATEGORY', name: cat.name, icon: cat.icon, color: cat.color, description: cat.description, isActive: true, sortOrder: i },
    })
  }
  for (let i = 0; i < allergens.length; i++) {
    const a = allergens[i]
    await prisma.metadata.upsert({
      where: { type_name: { type: 'ALLERGEN', name: a.name } },
      update: {},
      create: { type: 'ALLERGEN', name: a.name, icon: a.icon, color: a.color, description: a.description, isActive: true, sortOrder: i },
    })
  }
  for (let i = 0; i < dishCategories.length; i++) {
    const dc = dishCategories[i]
    await prisma.metadata.upsert({
      where: { type_name: { type: 'DISH_CATEGORY', name: dc.name } },
      update: {},
      create: { type: 'DISH_CATEGORY', name: dc.name, icon: dc.icon, color: dc.color, description: dc.description, isActive: true, sortOrder: i },
    })
  }
  console.log(`✅ ${dietCategories.length + allergens.length + dishCategories.length} Metadaten erstellt`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. GERICHTE (35 Gerichte)
  // ═══════════════════════════════════════════════════════════════════════════
  const dishData = [
    // ── Hauptgerichte ──────────────────────────────────────────────────────
    { id: 'dish-001', name: 'Wiener Schnitzel mit Pommes', description: 'Klassisches Wiener Schnitzel vom Schwein, goldbraun ausgebacken, serviert mit knusprigen Pommes frites und Zitronenscheibe', category: 'Hauptgericht', calories: 780, protein: 42, carbs: 60, fat: 35, allergens: ['Gluten', 'Ei', 'Milch'], dietTags: [] },
    { id: 'dish-002', name: 'Hähnchenbrust Mediterran', description: 'Saftiges Hähnchenfilet in Kräutermarinade, mit Ofengemüse und Couscous', category: 'Hauptgericht', calories: 520, protein: 48, carbs: 38, fat: 14, allergens: ['Gluten'], dietTags: ['fitness', 'low-carb'] },
    { id: 'dish-003', name: 'Lachs auf Blattspinat', description: 'Ofengebackenes Lachsfilet auf cremigem Blattspinat mit Zitronenbutter-Sauce und Kartoffeln', category: 'Hauptgericht', calories: 610, protein: 45, carbs: 28, fat: 32, allergens: ['Fisch', 'Milch', 'Laktose'], dietTags: ['fitness', 'low-carb'] },
    { id: 'dish-004', name: 'Vegane Curry Bowl', description: 'Cremiges Kichererbsen-Curry mit Kokosmilch, serviert auf Basmatireis mit frischem Koriander', category: 'Bowl', calories: 480, protein: 18, carbs: 72, fat: 10, allergens: [], dietTags: ['vegan', 'vegetarisch', 'bio'] },
    { id: 'dish-005', name: 'Pizza Margherita', description: 'Dünnteig-Pizza mit San-Marzano-Tomatensoße, Büffelmozzarella und frischem Basilikum', category: 'Hauptgericht', calories: 620, protein: 24, carbs: 80, fat: 20, allergens: ['Gluten', 'Milch', 'Laktose'], dietTags: ['vegetarisch'] },
    { id: 'dish-006', name: 'Spaghetti Bolognese', description: 'Al dente Spaghetti mit hausgemachter Rinderhack-Bolognese und geriebenem Parmesan', category: 'Hauptgericht', calories: 680, protein: 35, carbs: 78, fat: 22, allergens: ['Gluten', 'Milch', 'Ei'], dietTags: [] },
    { id: 'dish-007', name: 'Rindergulasch mit Spätzle', description: 'Zart geschmortes Rindfleisch in paprikagewürzter Soße, serviert mit hausgemachten Spätzle', category: 'Hauptgericht', calories: 720, protein: 38, carbs: 65, fat: 28, allergens: ['Gluten', 'Ei'], dietTags: [] },
    { id: 'dish-008', name: 'Falafel Teller', description: 'Knusprige Kichererbsen-Falafel mit Hummus, Taboulé, Gurke-Tomaten-Salat und Pita', category: 'Hauptgericht', calories: 540, protein: 20, carbs: 68, fat: 18, allergens: ['Gluten', 'Sesam'], dietTags: ['vegan', 'vegetarisch'] },
    { id: 'dish-009', name: 'Lachsburger', description: 'Gegrilltes Lachsfilet im Brioche-Bun mit Avocado-Creme, Rucola und Zitronen-Aioli', category: 'Hauptgericht', calories: 650, protein: 38, carbs: 52, fat: 30, allergens: ['Fisch', 'Gluten', 'Ei', 'Milch'], dietTags: [] },
    { id: 'dish-010', name: 'Thüringer Bratwurst', description: 'Zwei Thüringer Rostbratwürste mit Sauerkraut, Senfsoße und Bratkartoffeln', category: 'Hauptgericht', calories: 820, protein: 32, carbs: 42, fat: 55, allergens: ['Gluten', 'Senf'], dietTags: [] },
    { id: 'dish-011', name: 'Veggie Burger', description: 'Saftige Patty aus schwarzen Bohnen und Quinoa, mit Avocado, Rucola und Cashew-Mayo', category: 'Hauptgericht', calories: 580, protein: 22, carbs: 64, fat: 24, allergens: ['Gluten', 'Nüsse'], dietTags: ['vegetarisch', 'bio'] },
    { id: 'dish-012', name: 'Risotto ai Funghi', description: 'Cremiges Pilzrisotto mit Steinpilzen, Parmesan und schwarzem Trüffelöl', category: 'Hauptgericht', calories: 560, protein: 16, carbs: 72, fat: 20, allergens: ['Milch', 'Laktose'], dietTags: ['vegetarisch'] },
    { id: 'dish-013', name: 'Lachs-Quinoa Bowl', description: 'Gegrillter Lachs auf Quinoa mit Edamame, Avocado, Gurke und Sesam-Dressing', category: 'Bowl', calories: 590, protein: 40, carbs: 45, fat: 22, allergens: ['Fisch', 'Soja', 'Sesam'], dietTags: ['fitness', 'low-carb'] },
    { id: 'dish-014', name: 'Hühnersuppe mit Nudeln', description: 'Hausgemachte Hühnerbrühe mit zartem Hähnchenfilet, Wurzelgemüse und feinen Suppennudeln', category: 'Suppe', calories: 280, protein: 22, carbs: 28, fat: 8, allergens: ['Gluten', 'Sellerie'], dietTags: [] },
    { id: 'dish-015', name: 'Tomatensuppe mit Croutons', description: 'Samtweiche Tomatencremesuppe mit Basilikum-Öl und knusprigen Knoblauch-Croutons', category: 'Suppe', calories: 220, protein: 6, carbs: 30, fat: 10, allergens: ['Gluten', 'Milch'], dietTags: ['vegetarisch'] },
    // ── Salate ──────────────────────────────────────────────────────────────
    { id: 'dish-016', name: 'Caesar Salad Classic', description: 'Römersalat mit Caesar-Dressing, Croutons, Parmesan-Hobeln und gegrilltem Hähnchenstreifen', category: 'Salat', calories: 380, protein: 28, carbs: 18, fat: 22, allergens: ['Gluten', 'Milch', 'Ei', 'Fisch'], dietTags: [] },
    { id: 'dish-017', name: 'Griechischer Bauernsalat', description: 'Tomaten, Gurke, Paprika, rote Zwiebel, Oliven und Feta mit Oregano-Olivenöl-Dressing', category: 'Salat', calories: 290, protein: 10, carbs: 16, fat: 20, allergens: ['Milch'], dietTags: ['vegetarisch', 'glutenfrei'] },
    { id: 'dish-018', name: 'Quinoa Superfood Salat', description: 'Tricolor Quinoa mit Kichererbsen, getrockneten Cranberries, Kürbiskernen und Tahini-Dressing', category: 'Salat', calories: 420, protein: 16, carbs: 52, fat: 16, allergens: ['Sesam'], dietTags: ['vegan', 'vegetarisch', 'glutenfrei', 'bio'] },
    { id: 'dish-019', name: 'Rote-Bete Walnuss Salat', description: 'Gebratene Rote Bete mit Ziegenkäse, Walnüssen, Baby-Spinat und Honig-Balsamico-Dressing', category: 'Salat', calories: 350, protein: 12, carbs: 28, fat: 22, allergens: ['Milch', 'Nüsse'], dietTags: ['vegetarisch'] },
    { id: 'dish-020', name: 'Asia Chicken Salat', description: 'Reisnudeln mit gegrilltem Sesam-Hähnchen, Edamame, Möhren, Frühlingszwiebeln und Erdnuss-Dressing', category: 'Salat', calories: 440, protein: 34, carbs: 46, fat: 14, allergens: ['Gluten', 'Soja', 'Erdnüsse', 'Sesam'], dietTags: ['fitness'] },
    // ── Wraps & Sandwiches ──────────────────────────────────────────────────
    { id: 'dish-021', name: 'Wrap Chicken Avocado', description: 'Weizenfladen-Wrap mit Hähnchenstreifen, Avocado, Tomate, Eisbergsalat und Sriracha-Mayo', category: 'Wrap & Sandwich', calories: 540, protein: 32, carbs: 46, fat: 22, allergens: ['Gluten', 'Ei'], dietTags: [] },
    { id: 'dish-022', name: 'Veganer Club Wrap', description: 'Spinat-Wrap mit Hummus, gegrilltem Gemüse, Falafel, Rucola und Tahin-Zitrone', category: 'Wrap & Sandwich', calories: 480, protein: 16, carbs: 58, fat: 18, allergens: ['Gluten', 'Sesam'], dietTags: ['vegan', 'vegetarisch'] },
    { id: 'dish-023', name: 'Lachs-Bagel', description: 'Gerösteter Sesam-Bagel mit Räucherlachs, Frischkäse, Kapernsalz, Gurke und roten Zwiebeln', category: 'Wrap & Sandwich', calories: 480, protein: 28, carbs: 50, fat: 18, allergens: ['Fisch', 'Gluten', 'Milch', 'Sesam'], dietTags: [] },
    // ── Desserts ────────────────────────────────────────────────────────────
    { id: 'dish-024', name: 'Apfelstrudel mit Vanilleeis', description: 'Hausgemachter Apfelstrudel mit Zimt-Rosinen-Füllung, Puderzucker und zwei Kugeln Vanilleeis', category: 'Dessert', calories: 420, protein: 6, carbs: 62, fat: 16, allergens: ['Gluten', 'Ei', 'Milch', 'Laktose'], dietTags: ['vegetarisch'] },
    { id: 'dish-025', name: 'Schokoladenkuchen', description: 'Saftiger Schokoladen-Lava-Cake mit flüssigem Kern und Vanillesauce', category: 'Dessert', calories: 480, protein: 8, carbs: 58, fat: 24, allergens: ['Gluten', 'Ei', 'Milch', 'Laktose', 'Nüsse'], dietTags: ['vegetarisch'] },
    { id: 'dish-026', name: 'Veganes Chia-Pudding', description: 'Kokos-Chia-Pudding mit Mangocoulis, frischen Beeren und Kokosflocken', category: 'Dessert', calories: 260, protein: 8, carbs: 34, fat: 12, allergens: [], dietTags: ['vegan', 'vegetarisch', 'glutenfrei'] },
    { id: 'dish-027', name: 'Panna Cotta', description: 'Cremige Vanille-Panna-Cotta mit frischer Erdbeer-Coulis', category: 'Dessert', calories: 320, protein: 4, carbs: 36, fat: 18, allergens: ['Milch', 'Laktose'], dietTags: ['vegetarisch', 'glutenfrei'] },
    // ── Snacks ──────────────────────────────────────────────────────────────
    { id: 'dish-028', name: 'Gemüse-Sticks mit Dips', description: 'Frische Karotten-, Sellerie- und Paprikasticks mit Hummus und Kräuterquark', category: 'Snack', calories: 180, protein: 8, carbs: 20, fat: 8, allergens: ['Milch', 'Sesam'], dietTags: ['vegetarisch', 'glutenfrei'] },
    { id: 'dish-029', name: 'Obstschale Saisonal', description: 'Frisch geschnittene saisonale Früchte: Melone, Traube, Erdbeere und Kiwi', category: 'Snack', calories: 120, protein: 2, carbs: 28, fat: 0, allergens: [], dietTags: ['vegan', 'vegetarisch', 'glutenfrei'] },
    { id: 'dish-030', name: 'Energy Bowl', description: 'Haferflocken-Bowl mit Mandelmilch, Bananenscheiben, Chiasamen, Nüssen und Honig', category: 'Bowl', calories: 380, protein: 12, carbs: 54, fat: 14, allergens: ['Nüsse', 'Gluten'], dietTags: ['vegetarisch', 'bio'] },
    // ── Vorspeisen ──────────────────────────────────────────────────────────
    { id: 'dish-031', name: 'Bruschetta Pomodoro', description: 'Geröstetes Ciabatta mit marinierten Tomaten, Knoblauch, Basilikum und extra nativem Olivenöl', category: 'Vorspeise', calories: 220, protein: 6, carbs: 32, fat: 8, allergens: ['Gluten'], dietTags: ['vegetarisch'] },
    { id: 'dish-032', name: 'Linsencreme-Suppe', description: 'Sämige rote Linsensuppe mit Kreuzkümmel, Kokosmilch und Chili-Öl', category: 'Suppe', calories: 310, protein: 14, carbs: 42, fat: 10, allergens: [], dietTags: ['vegan', 'vegetarisch', 'glutenfrei'] },
    { id: 'dish-033', name: 'Kürbiscreme-Suppe', description: 'Herbstliche Butternuss-Kürbissuppe mit Ingwer, Kokosmilch und Kürbiskernen', category: 'Suppe', calories: 260, protein: 6, carbs: 34, fat: 12, allergens: [], dietTags: ['vegan', 'vegetarisch', 'glutenfrei', 'bio'] },
    { id: 'dish-034', name: 'Chicken Tikka Masala', description: 'Zartes Tandoori-Hähnchen in aromatischer Tomaten-Sahne-Soße mit Naan-Brot und Basmatireis', category: 'Hauptgericht', calories: 680, protein: 42, carbs: 62, fat: 24, allergens: ['Gluten', 'Milch', 'Laktose'], dietTags: ['fitness'] },
    { id: 'dish-035', name: 'Buddha Bowl Vegan', description: 'Gebackene Süßkartoffel, Avocado, Quinoa, Rote Bete, Edamame, Sprossen und Tahini', category: 'Bowl', calories: 520, protein: 18, carbs: 64, fat: 20, allergens: ['Sesam', 'Soja'], dietTags: ['vegan', 'vegetarisch', 'glutenfrei', 'bio'] },
  ]

  const dishes: Record<string, { id: string }> = {}
  for (const d of dishData) {
    const dish = await prisma.dish.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        name: d.name,
        description: d.description,
        category: d.category,
        calories: d.calories,
        protein: d.protein,
        carbs: d.carbs,
        fat: d.fat,
        allergens: d.allergens,
        dietTags: d.dietTags,
        isActive: true,
      },
    })
    dishes[d.id] = dish
  }
  console.log(`✅ ${dishData.length} Gerichte erstellt`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. BENUTZER
  // ═══════════════════════════════════════════════════════════════════════════

  // Admin-Benutzer
  const adminPw = await hashPassword('admin123')
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@demo.de' },
    update: { passwordHash: adminPw },
    create: { email: 'admin@demo.de', name: 'Anna Becker', passwordHash: adminPw, role: 'ADMIN', organizationId: organization.id, marketingEmailConsent: true },
  })
  const admin2 = await prisma.user.upsert({
    where: { email: 'admin2@demo.de' },
    update: { passwordHash: adminPw },
    create: { email: 'admin2@demo.de', name: 'Thomas Hofer', passwordHash: adminPw, role: 'ADMIN', organizationId: organization.id, marketingEmailConsent: false },
  })

  // Küchenpersonal
  const kitchenPw = await hashPassword('kueche123')
  const kitchen1 = await prisma.user.upsert({
    where: { email: 'kueche@demo.de' },
    update: { passwordHash: kitchenPw },
    create: { email: 'kueche@demo.de', name: 'Stefan Küchenmeister', passwordHash: kitchenPw, role: 'KITCHEN_STAFF', organizationId: organization.id },
  })
  const kitchen2 = await prisma.user.upsert({
    where: { email: 'kueche2@demo.de' },
    update: { passwordHash: kitchenPw },
    create: { email: 'kueche2@demo.de', name: 'Maria Koch', passwordHash: kitchenPw, role: 'KITCHEN_STAFF', organizationId: organization.id },
  })
  const kitchen3 = await prisma.user.upsert({
    where: { email: 'kueche.hamburg@demo.de' },
    update: { passwordHash: kitchenPw },
    create: { email: 'kueche.hamburg@demo.de', name: 'Klaus Bremer', passwordHash: kitchenPw, role: 'KITCHEN_STAFF', organizationId: organization.id },
  })

  // Kunden (15 Stück)
  const customerPw = await hashPassword('demo123')
  const customerData = [
    { email: 'kunde@demo.de',          name: 'Max Mustermann',      consent: true },
    { email: 'lisa.mueller@demo.de',   name: 'Lisa Müller',         consent: true },
    { email: 'jonas.schmidt@demo.de',  name: 'Jonas Schmidt',       consent: false },
    { email: 'sarah.weber@demo.de',    name: 'Sarah Weber',         consent: true },
    { email: 'daniel.braun@demo.de',   name: 'Daniel Braun',        consent: true },
    { email: 'julia.klein@demo.de',    name: 'Julia Klein',         consent: false },
    { email: 'markus.wolf@demo.de',    name: 'Markus Wolf',         consent: true },
    { email: 'lena.fischer@demo.de',   name: 'Lena Fischer',        consent: true },
    { email: 'tobias.meyer@demo.de',   name: 'Tobias Meyer',        consent: false },
    { email: 'hannah.bauer@demo.de',   name: 'Hannah Bauer',        consent: true },
    { email: 'felix.richter@demo.de',  name: 'Felix Richter',       consent: true },
    { email: 'nina.hofmann@demo.de',   name: 'Nina Hofmann',        consent: true },
    { email: 'lukas.wagner@demo.de',   name: 'Lukas Wagner',        consent: false },
    { email: 'emma.zimmermann@demo.de',name: 'Emma Zimmermann',     consent: true },
    { email: 'jan.krause@demo.de',     name: 'Jan Krause',          consent: true },
  ]

  const customers: { id: string; name: string | null; email: string }[] = []
  for (const cd of customerData) {
    const c = await prisma.user.upsert({
      where: { email: cd.email },
      update: { passwordHash: customerPw },
      create: { email: cd.email, name: cd.name, passwordHash: customerPw, role: 'CUSTOMER', organizationId: organization.id, marketingEmailConsent: cd.consent },
    })
    customers.push(c)
  }
  console.log(`✅ ${customers.length} Kunden + 5 Staff/Admin erstellt`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. USER-LOCATION VERKNÜPFUNGEN
  // ═══════════════════════════════════════════════════════════════════════════

  // Alle User an Standort 1 (Berlin)
  const allUsers = [admin1, admin2, kitchen1, kitchen2, ...customers.slice(0, 10)]
  for (const u of allUsers) {
    await prisma.userLocation.upsert({
      where: { userId_locationId: { userId: u.id, locationId: location1.id } },
      update: {},
      create: { userId: u.id, locationId: location1.id },
    })
  }
  // Standort 2 (Hamburg) – kitchen3 + letzte 5 Kunden
  const hamburgUsers = [kitchen3, ...customers.slice(10)]
  for (const u of hamburgUsers) {
    await prisma.userLocation.upsert({
      where: { userId_locationId: { userId: u.id, locationId: location2.id } },
      update: {},
      create: { userId: u.id, locationId: location2.id },
    })
  }
  // Admin sieht beide Standorte
  for (const admin of [admin1, admin2]) {
    await prisma.userLocation.upsert({
      where: { userId_locationId: { userId: admin.id, locationId: location2.id } },
      update: {},
      create: { userId: admin.id, locationId: location2.id },
    })
  }
  console.log('✅ User-Location Verknüpfungen erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. COMPANY EMPLOYEES
  // ═══════════════════════════════════════════════════════════════════════════

  // TechCorp: 6 Kunden
  const techEmployees = customers.slice(0, 6)
  const departments1 = ['Engineering', 'Engineering', 'Product', 'Design', 'Marketing', 'HR']
  for (let i = 0; i < techEmployees.length; i++) {
    await prisma.companyEmployee.upsert({
      where: { companyId_userId: { companyId: company1.id, userId: techEmployees[i].id } },
      update: {},
      create: { companyId: company1.id, userId: techEmployees[i].id, employeeNumber: `TC-${1000 + i}`, department: departments1[i], isActive: true, validFrom: new Date('2024-01-01') },
    })
  }

  // MediaHaus: 5 Kunden
  const mediaEmployees = customers.slice(6, 11)
  const departments2 = ['Redaktion', 'Grafik', 'Vertrieb', 'Redaktion', 'IT']
  for (let i = 0; i < mediaEmployees.length; i++) {
    await prisma.companyEmployee.upsert({
      where: { companyId_userId: { companyId: company2.id, userId: mediaEmployees[i].id } },
      update: {},
      create: { companyId: company2.id, userId: mediaEmployees[i].id, employeeNumber: `MH-${200 + i}`, department: departments2[i], isActive: true, validFrom: new Date('2024-03-01') },
    })
  }

  // GreenStart: 4 Kunden
  const greenEmployees = customers.slice(11)
  for (let i = 0; i < greenEmployees.length; i++) {
    await prisma.companyEmployee.upsert({
      where: { companyId_userId: { companyId: company3.id, userId: greenEmployees[i].id } },
      update: {},
      create: { companyId: company3.id, userId: greenEmployees[i].id, employeeNumber: `GS-${100 + i}`, department: 'Allgemein', isActive: true, validFrom: new Date('2025-01-01') },
    })
  }
  console.log('✅ Company-Employee Verknüpfungen erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. WALLETS & TRANSAKTIONEN
  // ═══════════════════════════════════════════════════════════════════════════

  const walletBalances = [18.50, 42.00, 5.25, 73.80, 12.00, 0.00, 28.60, 55.40, 9.90, 34.20, 21.75, 60.00, 15.30, 88.50, 7.00]
  for (let i = 0; i < customers.length; i++) {
    const balance = walletBalances[i] ?? 10.00
    await prisma.wallet.upsert({
      where: { userId: customers[i].id },
      update: { balance },
      create: { userId: customers[i].id, balance },
    })

    // Top-Up Transaktionen (1-4 pro Kunde)
    const topups = randomBetween(1, 4)
    let runningBalance = 0
    for (let t = 0; t < topups; t++) {
      const amount = [10, 20, 25, 30, 50][randomBetween(0, 4)]
      const before = runningBalance
      runningBalance += amount
      await prisma.walletTransaction.create({
        data: {
          userId: customers[i].id,
          type: 'TOP_UP',
          amount,
          balanceBefore: before,
          balanceAfter: runningBalance,
          description: `Aufladung ${['Überweisung', 'Kreditkarte', 'PayPal', 'Bargeld'][randomBetween(0, 3)]}`,
          performedById: admin1.id,
          createdAt: daysAgo(randomBetween(10, 90)),
        },
      })
    }
  }
  console.log('✅ Wallets + Transaktionen erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. MENÜS (aktuell + 4 vergangene Wochen)
  // ═══════════════════════════════════════════════════════════════════════════

  const today = new Date()
  const currentYear = today.getFullYear()
  const startOfThisWeek = new Date(today)
  startOfThisWeek.setDate(today.getDate() - today.getDay() + 1)
  startOfThisWeek.setHours(0, 0, 0, 0)

  const allMenuItems: { id: string; dishId: string; date: Date; price: number }[] = []

  // 5 Wochen (aktuelle + 4 vergangene)
  for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
    const weekStart = new Date(startOfThisWeek)
    weekStart.setDate(startOfThisWeek.getDate() - weekOffset * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const wn = getWeekNumber(weekStart)
    const yr = weekStart.getFullYear()

    for (const loc of [location1, location2]) {
      const menu = await prisma.menu.upsert({
        where: { locationId_weekNumber_year: { locationId: loc.id, weekNumber: wn, year: yr } },
        update: {},
        create: { locationId: loc.id, weekNumber: wn, year: yr, startDate: weekStart, endDate: weekEnd, isPublished: true },
      })

      // 5 Wochentage, 2-3 Gerichte pro Tag
      const dishPool = dishData.map(d => d.id)
      for (let day = 0; day < 5; day++) {
        const menuDate = new Date(weekStart)
        menuDate.setDate(weekStart.getDate() + day)

        // Wähle 3 verschiedene Gerichte für den Tag
        const dayDishes = [
          dishPool[(weekOffset * 5 + day) % dishPool.length],
          dishPool[(weekOffset * 5 + day + 7) % dishPool.length],
          dishPool[(weekOffset * 5 + day + 14) % dishPool.length],
        ]

        const prices = [7.90, 8.50, 9.20, 10.50, 6.80, 11.00, 8.90]
        for (const dishId of dayDishes) {
          const price = prices[randomBetween(0, prices.length - 1)]
          const mi = await prisma.menuItem.create({
            data: {
              menuId: menu.id,
              dishId,
              date: menuDate,
              available: true,
              price,
              maxOrders: randomBetween(30, 80),
              currentOrders: randomBetween(0, 25),
            },
          })
          allMenuItems.push({ id: mi.id, dishId, date: menuDate, price: Number(price) })
        }
      }
    }
  }
  console.log(`✅ Menüs + MenuItems für 5 Wochen × 2 Standorte erstellt`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. COUPONS
  // ═══════════════════════════════════════════════════════════════════════════

  const coupon1 = await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      name: 'Willkommensrabatt 10%',
      description: 'Einmaliger Willkommensrabatt für neue Kunden – 10 % auf die erste Bestellung',
      type: 'DISCOUNT_PERCENTAGE',
      discountValue: 10,
      maxUses: 500,
      maxUsesPerUser: 1,
      currentUses: 47,
      isActive: true,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
    },
  })

  const coupon2 = await prisma.coupon.upsert({
    where: { code: 'SOMMER25' },
    update: {},
    create: {
      code: 'SOMMER25',
      name: 'Sommer-Aktion 2€',
      description: '2 Euro Rabatt auf alle Bestellungen im Sommer',
      type: 'DISCOUNT_FIXED',
      discountValue: 2.00,
      maxUses: 200,
      maxUsesPerUser: 3,
      currentUses: 112,
      minOrderAmount: 8.00,
      isActive: true,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-08-31'),
    },
  })

  const coupon3 = await prisma.coupon.upsert({
    where: { code: 'TREUE5' },
    update: {},
    create: {
      code: 'TREUE5',
      name: 'Treuebonus 5%',
      description: 'Für unsere Stammkunden: 5 % auf jede Bestellung, ganzjährig',
      type: 'DISCOUNT_PERCENTAGE',
      discountValue: 5,
      maxUsesPerUser: 999,
      currentUses: 234,
      isActive: true,
    },
  })

  const coupon4 = await prisma.coupon.upsert({
    where: { code: 'FREEAPPLE' },
    update: {},
    create: {
      code: 'FREEAPPLE',
      name: 'Gratis Obstschale',
      description: 'Kostenlose Obstschale bei jeder Bestellung',
      type: 'FREE_ITEM',
      freeItemDishId: 'dish-029',
      maxUses: 100,
      maxUsesPerUser: 1,
      currentUses: 23,
      isActive: true,
      endDate: new Date('2026-06-30'),
    },
  })

  const coupon5 = await prisma.coupon.upsert({
    where: { code: 'VEGAN15' },
    update: {},
    create: {
      code: 'VEGAN15',
      name: 'Vegan-Woche 15%',
      description: '15% Rabatt auf alle veganen Gerichte während der Vegan-Aktionswoche',
      type: 'DISCOUNT_PERCENTAGE',
      discountValue: 15,
      maxUses: 300,
      maxUsesPerUser: 2,
      currentUses: 88,
      isActive: false, // abgelaufen
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-07'),
    },
  })
  console.log('✅ 5 Coupons erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. BESTELLUNGEN (historisch + aktuell)
  // ═══════════════════════════════════════════════════════════════════════════

  const statuses: Array<'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'CANCELLED'> =
    ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'PICKED_UP', 'PICKED_UP', 'PICKED_UP', 'CANCELLED']
  const paymentMethods = ['wallet', 'wallet', 'wallet', 'card', 'payroll']
  const timeSlots = ['11:30-11:45', '11:45-12:00', '12:00-12:15', '12:15-12:30', '12:30-12:45', '12:45-13:00', '13:00-13:15']

  let totalOrders = 0

  for (let ci = 0; ci < customers.length; ci++) {
    const customer = customers[ci]
    const orderCount = randomBetween(6, 20) // 6–20 Bestellungen pro Kunde
    const loc = ci < 10 ? location1 : location2

    for (let oi = 0; oi < orderCount; oi++) {
      const pastDays = randomBetween(0, 60)
      const orderDate = daysAgo(pastDays)

      // MenuItem für diesen Tag auswählen (falls vorhanden, sonst erstes)
      const availableItems = allMenuItems.filter(mi => {
        const d = new Date(mi.date)
        return Math.abs(d.getTime() - orderDate.getTime()) < 86400000 * 3
      })
      const menuItem = availableItems[oi % Math.max(availableItems.length, 1)] ?? allMenuItems[oi % allMenuItems.length]

      const status = statuses[randomBetween(0, statuses.length - 1)]
      const paymentMethod = paymentMethods[randomBetween(0, paymentMethods.length - 1)]
      const price = menuItem.price
      const qty = randomBetween(1, 2)
      const totalAmount = price * qty

      // Zuschuss: Kunden 0–5 sind TechCorp (3,50 € fix), 6–10 MediaHaus (20%)
      let subsidy = 0
      let companyId: string | null = null
      if (ci < 6) { subsidy = Math.min(3.50, totalAmount); companyId = company1.id }
      else if (ci < 11) { subsidy = Math.min(4.00, totalAmount * 0.2); companyId = company2.id }

      const finalAmount = totalAmount - subsidy

      const order = await prisma.order.create({
        data: {
          userId: customer.id,
          locationId: loc.id,
          status,
          totalAmount,
          finalAmount,
          paymentStatus: status === 'CANCELLED' ? 'REFUNDED' : status === 'PENDING' ? 'PENDING' : 'COMPLETED',
          paymentMethod,
          pickupCode: randomPickupCode(),
          pickupDate: orderDate,
          pickupTimeSlot: timeSlots[randomBetween(0, timeSlots.length - 1)],
          pickedUpAt: status === 'PICKED_UP' ? new Date(orderDate.getTime() + 3600000) : null,
          employerSubsidyAmount: subsidy > 0 ? subsidy : null,
          employerCompanyId: companyId,
          createdAt: orderDate,
          updatedAt: orderDate,
          items: {
            create: [{
              menuItemId: menuItem.id,
              quantity: qty,
              price,
            }],
          },
        },
      })

      // Wallet-Transaktion für bezahlte Bestellungen
      if (paymentMethod === 'wallet' && status !== 'CANCELLED') {
        await prisma.walletTransaction.create({
          data: {
            userId: customer.id,
            type: 'ORDER_PAYMENT',
            amount: -finalAmount,
            balanceBefore: finalAmount + randomBetween(0, 30),
            balanceAfter: randomBetween(0, 30),
            description: `Bestellung #${order.id.slice(-6).toUpperCase()}`,
            orderId: order.id,
            createdAt: orderDate,
          },
        })
      }

      totalOrders++
    }
  }
  console.log(`✅ ${totalOrders} Bestellungen erstellt`)

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. KUNDENSEGMENTE
  // ═══════════════════════════════════════════════════════════════════════════

  const segAllCustomers = await prisma.customerSegment.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Alle Kunden' } },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Alle Kunden',
      description: 'Alle aktiven Kunden der Organisation',
      rules: [],
      rulesCombination: 'AND',
    },
  })

  const segVeganFans = await prisma.customerSegment.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Vegan-Interessierte' } },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Vegan-Interessierte',
      description: 'Kunden mit Zustimmung zum Marketing-E-Mail und hohem Bestellvolumen',
      rules: [{ attribute: 'marketingEmailConsent', operator: 'eq', value: 'true' }],
      rulesCombination: 'AND',
    },
  })

  const segHighValue = await prisma.customerSegment.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Stammkunden (10+ Bestellungen)' } },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Stammkunden (10+ Bestellungen)',
      description: 'Kunden mit mehr als 10 abgeschlossenen Bestellungen',
      rules: [{ attribute: 'orderCount', operator: 'gte', value: '10' }],
      rulesCombination: 'AND',
    },
  })

  const segNewCustomers = await prisma.customerSegment.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'Neukunden (< 30 Tage)' } },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'Neukunden (< 30 Tage)',
      description: 'Kunden, die sich in den letzten 30 Tagen registriert haben',
      rules: [{ attribute: 'daysSinceRegistration', operator: 'lte', value: '30' }],
      rulesCombination: 'AND',
    },
  })

  const segTechCorp = await prisma.customerSegment.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'TechCorp Mitarbeiter' } },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'TechCorp Mitarbeiter',
      description: 'Alle Mitarbeiter der TechCorp AG mit aktivem Vertrag',
      rules: [{ attribute: 'companyId', operator: 'eq', value: company1.id }],
      rulesCombination: 'AND',
    },
  })
  console.log('✅ 5 Kundensegmente erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. MARKETING TEMPLATES
  // ═══════════════════════════════════════════════════════════════════════════

  const templateContent = {
    blocks: [
      { id: 'b1', type: 'headline', content: { text: 'Willkommen in der Demo Kantine! 🍽️', level: 1 } },
      { id: 'b2', type: 'text', content: { text: 'Entdecken Sie unsere täglich wechselnden Gerichte aus frischen, regionalen Zutaten.', align: 'left' } },
      { id: 'b3', type: 'button', content: { label: 'Jetzt Menü ansehen', url: '/menu', style: 'primary' } },
    ],
  }

  const templatePush = {
    blocks: [
      { id: 'b1', type: 'headline', content: { text: 'Neues Tagesmenü verfügbar!', level: 2 } },
      { id: 'b2', type: 'text', content: { text: 'Heute gibt es wieder leckere Highlights – schauen Sie rein!', align: 'left' } },
    ],
  }

  const tmpl1 = await prisma.marketingTemplate.create({
    data: {
      organizationId: organization.id,
      name: 'Willkommensbanner (Standard)',
      type: 'IN_APP_BANNER',
      content: templateContent,
      status: 'ACTIVE',
      isStarter: false,
      isFavorite: true,
    },
  })

  const tmpl2 = await prisma.marketingTemplate.create({
    data: {
      organizationId: organization.id,
      name: 'Push: Tagesmenü-Hinweis',
      type: 'PUSH',
      content: templatePush,
      status: 'ACTIVE',
      isStarter: false,
    },
  })

  const tmpl3 = await prisma.marketingTemplate.create({
    data: {
      organizationId: null, // Starter-Template (plattformweit)
      name: 'Starter: Aktionswoche',
      type: 'IN_APP_BANNER',
      content: {
        blocks: [
          { id: 'b1', type: 'headline', content: { text: '🎉 Aktionswoche – Jetzt sparen!', level: 1 } },
          { id: 'b2', type: 'text', content: { text: 'Diese Woche mit exklusiven Rabatten auf ausgewählte Gerichte.', align: 'center' } },
          { id: 'b3', type: 'coupon', content: { code: '{{coupon_code}}', label: 'Ihr persönlicher Rabattcode' } },
        ],
      },
      status: 'ACTIVE',
      isStarter: true,
    },
  })
  console.log('✅ 3 Marketing Templates erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. IN-APP NACHRICHTEN
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.inAppMessage.create({
    data: {
      organizationId: organization.id,
      segmentId: segAllCustomers.id,
      title: 'Willkommen in der Kantine!',
      body: 'Entdecken Sie täglich frische Gerichte aus regionalen Zutaten. Bestellen Sie einfach online und holen Sie bequem ab.',
      linkUrl: '/menu',
      displayPlace: 'dashboard',
      displayType: 'POPUP',
      slotId: 'popup_after_login',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
      marketingTemplateId: tmpl1.id,
    },
  })

  await prisma.inAppMessage.create({
    data: {
      organizationId: organization.id,
      segmentId: segVeganFans.id,
      title: 'Vegan-Special diese Woche 🌱',
      body: 'Neue vegane Highlights auf dem Speiseplan: Buddha Bowl, Chia-Pudding und mehr. Probieren Sie es aus!',
      linkUrl: '/menu',
      displayPlace: 'menu',
      displayType: 'BANNER',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 86400000),
      isActive: true,
    },
  })

  await prisma.inAppMessage.create({
    data: {
      organizationId: organization.id,
      segmentId: segHighValue.id,
      title: 'Danke für Ihre Treue! 🎁',
      body: 'Als einer unserer Stammkunden erhalten Sie exklusiv 5% Rabatt auf alle Bestellungen. Nutzen Sie den Code TREUE5.',
      displayPlace: 'wallet',
      displayType: 'BANNER',
      startDate: new Date('2025-01-01'),
      isActive: true,
    },
  })

  await prisma.inAppMessage.create({
    data: {
      organizationId: organization.id,
      segmentId: segNewCustomers.id,
      title: 'Herzlich Willkommen! 👋',
      body: 'Schön, dass Sie dabei sind! Laden Sie Ihr Wallet auf und bestellen Sie zum ersten Mal mit 10% Willkommensrabatt (Code: WELCOME10).',
      displayPlace: 'dashboard',
      displayType: 'BANNER',
      startDate: new Date(),
      isActive: true,
    },
  })
  console.log('✅ 4 In-App Nachrichten erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. PUSH-BENACHRICHTIGUNGEN
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.pushNotification.create({
    data: {
      organizationId: organization.id,
      segmentId: segAllCustomers.id,
      marketingTemplateId: tmpl2.id,
      pushTitle: 'Frisches Mittagsmenü wartet! 🍽️',
      pushBody: 'Neue Gerichte für heute: Hähnchen Mediterran, Buddha Bowl & mehr. Jetzt bestellen!',
      deepLink: '/menu',
      status: 'SENT',
      sentAt: daysAgo(3),
      totalRecipients: 12,
    },
  })

  await prisma.pushNotification.create({
    data: {
      organizationId: organization.id,
      segmentId: segVeganFans.id,
      pushTitle: 'Vegan-Woche gestartet 🌱',
      pushBody: '7 Tage, 7 vegane Highlights – heute: Buddha Bowl mit Tahini!',
      deepLink: '/menu',
      status: 'SENT',
      sentAt: daysAgo(10),
      totalRecipients: 8,
    },
  })

  await prisma.pushNotification.create({
    data: {
      organizationId: organization.id,
      segmentId: segHighValue.id,
      pushTitle: 'Exklusiv für Stammkunden 🎁',
      pushBody: '5% Rabatt auf Ihre nächste Bestellung – exklusiv für treue Kunden!',
      status: 'DRAFT',
    },
  })
  console.log('✅ 3 Push-Benachrichtigungen erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. PROMOTION BANNER
  // ═══════════════════════════════════════════════════════════════════════════

  const banner1 = await prisma.promotionBanner.upsert({
    where: { id: 'banner-bayerische-woche' },
    update: {},
    create: {
      id: 'banner-bayerische-woche',
      title: 'Bayerische Woche 🥨',
      subtitle: 'Genießen Sie diese Woche typisch bayerische Spezialitäten: Schnitzel, Leberkäs und Brezel!',
      isActive: true,
    },
  })

  const banner2 = await prisma.promotionBanner.upsert({
    where: { id: 'banner-vegan-special' },
    update: {},
    create: {
      id: 'banner-vegan-special',
      title: 'Vegan-Monat 🌱',
      subtitle: 'Den ganzen März sind unsere pflanzlichen Gerichte im Fokus. Gut für Sie, gut für die Erde.',
      couponId: coupon5.id,
      isActive: false, // abgelaufen
    },
  })

  const banner3 = await prisma.promotionBanner.upsert({
    where: { id: 'banner-italian-week' },
    update: {},
    create: {
      id: 'banner-italian-week',
      title: 'Italian Week 🇮🇹',
      subtitle: 'La dolce vita! Risotto, Pasta und Pizza Margherita – diese Woche ganz mediterran.',
      isActive: true,
    },
  })

  // Aktuelles Menü (Berlin) mit Banner verknüpfen
  const currentWn = getWeekNumber(startOfThisWeek)
  const currentMenu = await prisma.menu.findFirst({
    where: { locationId: location1.id, weekNumber: currentWn, year: currentYear },
  })
  if (currentMenu) {
    await prisma.menuPromotionBanner.upsert({
      where: { menuId_promotionBannerId: { menuId: currentMenu.id, promotionBannerId: banner1.id } },
      update: {},
      create: { menuId: currentMenu.id, promotionBannerId: banner1.id, sortOrder: 0 },
    })
    await prisma.menuPromotionBanner.upsert({
      where: { menuId_promotionBannerId: { menuId: currentMenu.id, promotionBannerId: banner3.id } },
      update: {},
      create: { menuId: currentMenu.id, promotionBannerId: banner3.id, sortOrder: 1 },
    })
  }
  console.log('✅ 3 Promotion Banner erstellt')

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. SEGMENT INCENTIVES
  // ═══════════════════════════════════════════════════════════════════════════

  await prisma.segmentIncentive.create({
    data: {
      organizationId: organization.id,
      segmentId: segHighValue.id,
      name: 'Stammkunden-Treuebonus',
      incentiveType: 'COUPON',
      couponId: coupon3.id,
      personaliseCoupon: false,
      maxGrantsPerUser: 1,
      displayChannel: 'BOTH',
      isActive: true,
      startDate: new Date('2025-01-01'),
    },
  })

  await prisma.segmentIncentive.create({
    data: {
      organizationId: organization.id,
      segmentId: segNewCustomers.id,
      name: 'Neukunden-Willkommensguthaben',
      incentiveType: 'WALLET_CREDIT',
      walletAmount: 5.00,
      maxGrantsPerUser: 1,
      displayChannel: 'IN_APP',
      isActive: true,
      startDate: new Date('2025-01-01'),
    },
  })
  console.log('✅ 2 Segment-Incentives erstellt')

  // ─────────────────────────────────────────────────────────────────────────
  // ZUSAMMENFASSUNG
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🎉 Erweitertes Seeding abgeschlossen!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📍 2 Standorte`)
  console.log(`🏢 3 Unternehmen`)
  console.log(`🥗 ${dishData.length} Gerichte`)
  console.log(`👤 ${customers.length + 5} Benutzer (${customers.length} Kunden, 3 Küche, 2 Admin)`)
  console.log(`📦 ${totalOrders} Bestellungen`)
  console.log(`💳 ${customers.length} Wallets`)
  console.log(`📋 5 Menüwochen × 2 Standorte`)
  console.log(`🏷️ 5 Coupons`)
  console.log(`🎯 5 Kundensegmente`)
  console.log(`📨 4 In-App Nachrichten`)
  console.log(`🔔 3 Push-Kampagnen`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📧 Logins:')
  console.log('   admin@demo.de         / admin123  (Admin)')
  console.log('   kueche@demo.de        / kueche123 (Küche)')
  console.log('   kunde@demo.de         / demo123   (Kunde)')
  console.log('   lisa.mueller@demo.de  / demo123   (Kundin)')
  console.log('   ... alle weiteren Kunden mit: demo123')
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
