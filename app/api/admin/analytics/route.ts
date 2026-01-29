import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'] as const
const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const

type Period = 'today' | '7days' | 'week' | 'month' | '30days'

function getDateRange(period: Period): { dateFrom: Date; dateTo: Date } {
  const now = new Date()
  const dateTo = new Date(now)
  dateTo.setHours(23, 59, 59, 999)

  switch (period) {
    case 'today': {
      const dateFrom = new Date(now)
      dateFrom.setHours(0, 0, 0, 0)
      return { dateFrom, dateTo }
    }
    case '7days': {
      const dateFrom = new Date(now)
      dateFrom.setDate(dateFrom.getDate() - 6)
      dateFrom.setHours(0, 0, 0, 0)
      return { dateFrom, dateTo }
    }
    case 'week': {
      const dateFrom = new Date(now)
      dateFrom.setDate(now.getDate() - now.getDay())
      dateFrom.setHours(0, 0, 0, 0)
      const dateToWeek = new Date(dateFrom)
      dateToWeek.setDate(dateFrom.getDate() + 6)
      dateToWeek.setHours(23, 59, 59, 999)
      return { dateFrom, dateTo: dateToWeek }
    }
    case 'month': {
      const y = now.getFullYear()
      const m = now.getMonth()
      return {
        dateFrom: new Date(y, m, 1),
        dateTo: new Date(y, m + 1, 0, 23, 59, 59),
      }
    }
    case '30days': {
      const dateFrom = new Date(now)
      dateFrom.setDate(dateFrom.getDate() - 29)
      dateFrom.setHours(0, 0, 0, 0)
      return { dateFrom, dateTo }
    }
    default:
      return getDateRange('month')
  }
}

// GET: Analytics-Daten für Schaltzentrale (KPIs + Charts)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const locationIdParam = searchParams.get('locationId')
    const locationId = locationIdParam && locationIdParam !== 'all' ? locationIdParam : undefined
    const period = (searchParams.get('period') as Period) || 'month'

    const { dateFrom, dateTo } = getDateRange(period)

    const whereBase = {
      ...(locationId ? { locationId } : {}),
      createdAt: { gte: dateFrom, lte: dateTo },
    }

    // Alle Bestellungen im Zeitraum (inkl. CANCELLED für Stornoquote)
    const allOrders = await prisma.order.findMany({
      where: whereBase,
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

    const completedOrders = allOrders.filter((o) => o.status !== 'CANCELLED')
    const orderCount = completedOrders.length
    const totalOrdersInPeriod = allOrders.length
    const cancelledCount = allOrders.filter((o) => o.status === 'CANCELLED').length
    const periodRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
    const aov = orderCount > 0 ? periodRevenue / orderCount : 0
    const cancellationRate =
      totalOrdersInPeriod > 0 ? Math.round((cancelledCount / totalOrdersInPeriod) * 100) : 0
    const activeCustomers = new Set(completedOrders.map((o) => o.userId)).size

    // Order-Trend: tägliche Werte
    const daysInRange: { d: Date; label: string }[] = []
    const currentMonth = dateFrom.getMonth()
    const currentYear = dateFrom.getFullYear()
    if (period === 'month') {
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        daysInRange.push({
          d: new Date(currentYear, currentMonth, day),
          label: `Tag ${day}`,
        })
      }
    } else {
      const d = new Date(dateFrom)
      while (d <= dateTo) {
        daysInRange.push({
          d: new Date(d),
          label: d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        })
        d.setDate(d.getDate() + 1)
      }
    }

    const ordersByDay = completedOrders.reduce<Record<string, number>>((acc, order) => {
      const key = new Date(order.createdAt).toISOString().split('T')[0]
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const orderTrend =
      period === 'month'
        ? (() => {
            const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)
            const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)
            return prisma.order.findMany({
              where: {
                ...(locationId ? { locationId } : {}),
                createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
                status: { not: 'CANCELLED' },
              },
            }).then((lastMonthOrders) => {
              const lastMonthByDay: Record<number, number> = {}
              lastMonthOrders.forEach((o) => {
                const day = new Date(o.createdAt).getDate()
                lastMonthByDay[day] = (lastMonthByDay[day] || 0) + 1
              })
              return daysInRange.map(({ d, label }) => {
                const day = d.getDate()
                const key = d.toISOString().split('T')[0]
                return {
                  day: label,
                  currentMonth: ordersByDay[key] || 0,
                  lastMonth: lastMonthByDay[day] || 0,
                }
              })
            })
          })()
        : Promise.resolve(
            daysInRange.map(({ d, label }) => {
              const key = d.toISOString().split('T')[0]
              return {
                day: label,
                currentMonth: ordersByDay[key] || 0,
                lastMonth: 0,
              }
            })
          )

    const orderTrendData = await orderTrend

    // Top-Gerichte (Portionen)
    const dishCounts: Record<string, { name: string; count: number }> = {}
    completedOrders.forEach((order) => {
      order.items.forEach((item) => {
        const dishName = item.menuItem.dish.name
        if (!dishCounts[dishName]) dishCounts[dishName] = { name: dishName, count: 0 }
        dishCounts[dishName].count += item.quantity
      })
    })
    const topDishes = Object.values(dishCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((d, i) => ({ dish: d.name, orders: d.count, rank: i + 1 }))

    // Status-Verteilung (für Pie)
    const statusCounts = ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = 0
      return acc
    }, {})
    allOrders.forEach((o) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    })
    const statusDistribution = ORDER_STATUSES.map((status) => ({
      status,
      count: statusCounts[status],
    })).filter((s) => s.count > 0)

    // Bestellungen pro Wochentag (Mo=1 .. So=0 in getDay())
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0] // Mo, Di, Mi, Do, Fr, Sa, So
    completedOrders.forEach((o) => {
      const day = new Date(o.createdAt).getDay() // 0=So, 1=Mo, ...
      const index = day === 0 ? 6 : day - 1 // Mo=0, ..., So=6
      weekdayCounts[index]++
    })
    const ordersByWeekday = WEEKDAY_LABELS.map((label, i) => ({
      day: label,
      count: weekdayCounts[i],
    }))

    return NextResponse.json({
      orderTrend: orderTrendData,
      topDishes,
      monthlyRevenue: periodRevenue,
      weeklyOrders: orderCount,
      orderCount,
      aov: Math.round(aov * 100) / 100,
      cancellationRate,
      activeCustomers,
      statusDistribution,
      ordersByWeekday,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Analytics:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
