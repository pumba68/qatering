import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starte Seeding...')

  // 1. Organisation erstellen
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-kantine' },
    update: {},
    create: {
      name: 'Demo Kantine',
      slug: 'demo-kantine',
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
    },
  })
  console.log('✅ Organisation erstellt:', organization.name)

  // 2. Location erstellen
  const location = await prisma.location.upsert({
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
  console.log('✅ Location erstellt:', location.name)

  // 3. Metadaten erstellen (Diät-Kategorien, Allergene, Speise-Kategorien)
  const dietCategories = [
    { name: 'vegan', icon: '🌱', color: '#22c55e', description: 'Vollständig pflanzlich' },
    { name: 'vegetarisch', icon: '🥬', color: '#10b981', description: 'Ohne Fleisch und Fisch' },
    { name: 'fitness', icon: '💪', color: '#3b82f6', description: 'Proteinreich für Sportler' },
    { name: 'low-carb', icon: '🥩', color: '#8b5cf6', description: 'Wenig Kohlenhydrate' },
    { name: 'glutenfrei', icon: '🌾', color: '#f59e0b', description: 'Ohne Gluten' },
    { name: 'laktosefrei', icon: '🥛', color: '#ef4444', description: 'Ohne Laktose' },
  ]

  const allergens = [
    { name: 'Nüsse', icon: '🥜', color: '#dc2626', description: 'Enthält Nüsse' },
    { name: 'Gluten', icon: '🌾', color: '#f59e0b', description: 'Enthält Gluten' },
    { name: 'Laktose', icon: '🥛', color: '#ef4444', description: 'Enthält Laktose' },
    { name: 'Ei', icon: '🥚', color: '#fbbf24', description: 'Enthält Ei' },
    { name: 'Milch', icon: '🥛', color: '#60a5fa', description: 'Enthält Milch' },
    { name: 'Soja', icon: '🫘', color: '#84cc16', description: 'Enthält Soja' },
    { name: 'Fisch', icon: '🐟', color: '#06b6d4', description: 'Enthält Fisch' },
    { name: 'Schalentiere', icon: '🦐', color: '#ec4899', description: 'Enthält Schalentiere' },
  ]

  const dishCategories = [
    { name: 'Hauptgericht', icon: '🍽️', color: '#3b82f6', description: 'Hauptspeise' },
    { name: 'Dessert', icon: '🍰', color: '#ec4899', description: 'Nachspeise' },
    { name: 'Salat', icon: '🥗', color: '#10b981', description: 'Salatgericht' },
    { name: 'Vorspeise', icon: '🥖', color: '#f59e0b', description: 'Vor dem Hauptgericht' },
    { name: 'Suppe', icon: '🍲', color: '#ef4444', description: 'Suppengericht' },
    { name: 'Snack', icon: '🍿', color: '#8b5cf6', description: 'Kleine Zwischenmahlzeit' },
  ]

  // Diät-Kategorien erstellen
  for (let i = 0; i < dietCategories.length; i++) {
    const category = dietCategories[i]
    await prisma.metadata.upsert({
      where: {
        type_name: {
          type: 'DIET_CATEGORY',
          name: category.name,
        },
      },
      update: {},
      create: {
        type: 'DIET_CATEGORY',
        name: category.name,
        icon: category.icon,
        color: category.color,
        description: category.description,
        isActive: true,
        sortOrder: i,
      },
    })
  }
  console.log(`✅ ${dietCategories.length} Diät-Kategorien erstellt`)

  // Allergene erstellen
  for (let i = 0; i < allergens.length; i++) {
    const allergen = allergens[i]
    await prisma.metadata.upsert({
      where: {
        type_name: {
          type: 'ALLERGEN',
          name: allergen.name,
        },
      },
      update: {},
      create: {
        type: 'ALLERGEN',
        name: allergen.name,
        icon: allergen.icon,
        color: allergen.color,
        description: allergen.description,
        isActive: true,
        sortOrder: i,
      },
    })
  }
  console.log(`✅ ${allergens.length} Allergene erstellt`)

  // Speise-Kategorien erstellen
  for (let i = 0; i < dishCategories.length; i++) {
    const category = dishCategories[i]
    await prisma.metadata.upsert({
      where: {
        type_name: {
          type: 'DISH_CATEGORY',
          name: category.name,
        },
      },
      update: {},
      create: {
        type: 'DISH_CATEGORY',
        name: category.name,
        icon: category.icon,
        color: category.color,
        description: category.description,
        isActive: true,
        sortOrder: i,
      },
    })
  }
  console.log(`✅ ${dishCategories.length} Speise-Kategorien erstellt`)

  // 4. Beispiel-Gerichte erstellen
  const dishes = await Promise.all([
    prisma.dish.upsert({
      where: { id: 'dish-1' },
      update: {},
      create: {
        id: 'dish-1',
        name: 'Schnitzel mit Pommes',
        description: 'Panierter Schweineschnitzel mit knusprigen Pommes und Salat',
        category: 'Hauptgericht',
        calories: 650,
        protein: 35.0,
        carbs: 55.0,
        fat: 28.0,
        allergens: ['Gluten', 'Ei', 'Milch'],
        dietTags: [],
        isActive: true,
      },
    }),
    prisma.dish.upsert({
      where: { id: 'dish-2' },
      update: {},
      create: {
        id: 'dish-2',
        name: 'Vegane Curry Bowl',
        description: 'Gemüse-Curry mit Kichererbsen, Reis und Koriander',
        category: 'Hauptgericht',
        calories: 420,
        protein: 15.0,
        carbs: 70.0,
        fat: 8.0,
        allergens: [],
        dietTags: ['vegan', 'vegetarisch'],
        isActive: true,
      },
    }),
    prisma.dish.upsert({
      where: { id: 'dish-3' },
      update: {},
      create: {
        id: 'dish-3',
        name: 'Caesar Salad',
        description: 'Römersalat mit Caesar-Dressing, Croutons und Parmesan',
        category: 'Salat',
        calories: 320,
        protein: 12.0,
        carbs: 20.0,
        fat: 22.0,
        allergens: ['Gluten', 'Milch', 'Ei'],
        dietTags: ['vegetarisch'],
        isActive: true,
      },
    }),
    prisma.dish.upsert({
      where: { id: 'dish-4' },
      update: {},
      create: {
        id: 'dish-4',
        name: 'Pizza Margherita',
        description: 'Klassische Pizza mit Tomaten, Mozzarella und Basilikum',
        category: 'Hauptgericht',
        calories: 580,
        protein: 25.0,
        carbs: 75.0,
        fat: 18.0,
        allergens: ['Gluten', 'Milch'],
        dietTags: ['vegetarisch'],
        isActive: true,
      },
    }),
    prisma.dish.upsert({
      where: { id: 'dish-5' },
      update: {},
      create: {
        id: 'dish-5',
        name: 'Apfelstrudel',
        description: 'Hausgemachter Apfelstrudel mit Vanilleeis',
        category: 'Dessert',
        calories: 380,
        protein: 5.0,
        carbs: 55.0,
        fat: 15.0,
        allergens: ['Gluten', 'Ei', 'Milch'],
        dietTags: ['vegetarisch'],
        isActive: true,
      },
    }),
  ])
  console.log(`✅ ${dishes.length} Gerichte erstellt`)

  // 4. Beispiel-User erstellen (Kunde)
  const customerPasswordHash = await hashPassword('demo123')
  const customer = await prisma.user.upsert({
    where: { email: 'kunde@demo.de' },
    update: {
      passwordHash: customerPasswordHash, // Passwort aktualisieren falls User existiert
    },
    create: {
      email: 'kunde@demo.de',
      name: 'Max Mustermann',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      organizationId: organization.id,
    },
  })
  console.log('✅ Kunde erstellt:', customer.email, '(Passwort: demo123)')

  // 5. Beispiel-User erstellen (Küchenpersonal)
  const kitchenPasswordHash = await hashPassword('kueche123')
  const kitchenStaff = await prisma.user.upsert({
    where: { email: 'kueche@demo.de' },
    update: {
      passwordHash: kitchenPasswordHash, // Passwort aktualisieren falls User existiert
    },
    create: {
      email: 'kueche@demo.de',
      name: 'Küchenleiter',
      passwordHash: kitchenPasswordHash,
      role: 'KITCHEN_STAFF',
      organizationId: organization.id,
    },
  })
  console.log('✅ Küchenpersonal erstellt:', kitchenStaff.email, '(Passwort: kueche123)')

  // User-Location Verknüpfung
  await prisma.userLocation.upsert({
    where: {
      userId_locationId: {
        userId: customer.id,
        locationId: location.id,
      },
    },
    update: {},
    create: {
      userId: customer.id,
      locationId: location.id,
    },
  })

  await prisma.userLocation.upsert({
    where: {
      userId_locationId: {
        userId: kitchenStaff.id,
        locationId: location.id,
      },
    },
    update: {},
    create: {
      userId: kitchenStaff.id,
      locationId: location.id,
    },
  })

  console.log('✅ User-Location Verknüpfungen erstellt')

  // 6. Beispiel-Menü für diese Woche erstellen
  const today = new Date()
  const currentYear = today.getFullYear()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Montag
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Sonntag
  
  // Kalenderwoche berechnen
  const weekNumber = getWeekNumber(startOfWeek)

  const menu = await prisma.menu.upsert({
    where: {
      locationId_weekNumber_year: {
        locationId: location.id,
        weekNumber: weekNumber,
        year: currentYear,
      },
    },
    update: {},
    create: {
      locationId: location.id,
      weekNumber: weekNumber,
      year: currentYear,
      startDate: startOfWeek,
      endDate: endOfWeek,
      isPublished: true,
    },
  })
  console.log('✅ Menü erstellt für KW', weekNumber)

  // 7. MenuItems für diese Woche erstellen
  const weekDays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag']
  const menuItems = []

  for (let day = 0; day < 5; day++) {
    const menuDate = new Date(startOfWeek)
    menuDate.setDate(startOfWeek.getDate() + day)

    // Verschiedene Gerichte für verschiedene Tage
    const dishForDay = dishes[day % dishes.length]

    const menuItem = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        dishId: dishForDay.id,
        date: menuDate,
        available: true,
        price: 8.50,
        maxOrders: 50,
        currentOrders: 0,
      },
    })
    menuItems.push(menuItem)
  }
  console.log(`✅ ${menuItems.length} MenuItems erstellt`)

  console.log('🎉 Seeding abgeschlossen!')
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
