import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Starte Datenbank-Bereinigung...')

  try {
    // 1. Alle OrderItems löschen (Abhängigkeiten)
    const orderItemsDeleted = await prisma.orderItem.deleteMany({})
    console.log(`✅ ${orderItemsDeleted.count} OrderItems gelöscht`)

    // 2. Alle Orders löschen
    const ordersDeleted = await prisma.order.deleteMany({})
    console.log(`✅ ${ordersDeleted.count} Orders gelöscht`)

    // 3. Alle MenuItems löschen (Verweise auf Gerichte)
    const menuItemsDeleted = await prisma.menuItem.deleteMany({})
    console.log(`✅ ${menuItemsDeleted.count} MenuItems gelöscht`)

    // 4. Alle Menus löschen
    const menusDeleted = await prisma.menu.deleteMany({})
    console.log(`✅ ${menusDeleted.count} Menus gelöscht`)

    // 5. Alle Dishes löschen
    const dishesDeleted = await prisma.dish.deleteMany({})
    console.log(`✅ ${dishesDeleted.count} Gerichte gelöscht`)

    console.log('🎉 Datenbank-Bereinigung abgeschlossen!')
  } catch (error) {
    console.error('❌ Fehler beim Bereinigen:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
