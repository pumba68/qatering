import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

// GET: Analytics-Daten für Dashboard-Charts
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId') || 'demo-location-1'

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Start und Ende des aktuellen Monats
    const currentMonthStart = new Date(currentYear, currentMonth, 1)
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
    
    // Start und Ende des Vormonats
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    // Bestellungen aktueller Monat (nach Tag gruppiert)
    const currentMonthOrders = await prisma.order.findMany({
      where: {
        locationId,
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
        status: { not: 'CANCELLED' },
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: { dish: true },
            },
          },
        },
      },
    })

    // Bestellungen Vormonat (nach Tag gruppiert)
    const lastMonthOrders = await prisma.order.findMany({
      where: {
        locationId,
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
        status: { not: 'CANCELLED' },
      },
    })

    // Berechne tägliche Werte für aktuellen Monat
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const currentMonthData: Record<number, number> = {}
    const lastMonthData: Record<number, number> = {}

    // Initialisiere alle Tage mit 0
    for (let day = 1; day <= daysInMonth; day++) {
      currentMonthData[day] = 0
    }

    // Fülle aktuelle Monatsdaten
    currentMonthOrders.forEach((order) => {
      const day = new Date(order.createdAt).getDate()
      currentMonthData[day] = (currentMonthData[day] || 0) + 1
    })

    // Fülle Vormonatsdaten (nur Tage die es im aktuellen Monat gibt)
    lastMonthOrders.forEach((order) => {
      const orderDay = new Date(order.createdAt).getDate()
      if (orderDay <= daysInMonth) {
        lastMonthData[orderDay] = (lastMonthData[orderDay] || 0) + 1
      }
    })

    // Konvertiere zu Array für Chart
    const orderTrendData = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      return {
        day: `Tag ${day}`,
        currentMonth: currentMonthData[day] || 0,
        lastMonth: lastMonthData[day] || 0,
      }
    })

    // Top 5 Gerichte diesen Monat
    const dishCounts: Record<string, { name: string; count: number }> = {}
    currentMonthOrders.forEach((order) => {
      order.items.forEach((item) => {
        const dishName = item.menuItem.dish.name
        if (!dishCounts[dishName]) {
          dishCounts[dishName] = { name: dishName, count: 0 }
        }
        dishCounts[dishName].count += item.quantity
      })
    })

    const topDishes = Object.values(dishCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((dish, index) => ({
        dish: dish.name,
        orders: dish.count,
        rank: index + 1,
      }))

    // Umsatz diesen Monat
    const monthlyRevenue = currentMonthOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount)
    }, 0)

    // Bestellungen diese Woche
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Sonntag
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weeklyOrders = await prisma.order.count({
      where: {
        locationId,
        createdAt: {
          gte: weekStart,
          lte: weekEnd,
        },
        status: { not: 'CANCELLED' },
      },
    })

    return NextResponse.json({
      orderTrend: orderTrendData,
      topDishes,
      monthlyRevenue,
      weeklyOrders,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Analytics:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}