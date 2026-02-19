import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Aktuellen Essensplan für eine Location abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const weekParam = searchParams.get('weekNumber')
    const yearParam = searchParams.get('year')

    if (!locationId) {
      return NextResponse.json(
        { error: 'locationId ist erforderlich' },
        { status: 400 }
      )
    }

    // Wenn weekNumber und year angegeben sind, verwende diese, sonst aktuelle Woche
    let weekNumber: number
    let year: number

    if (weekParam && yearParam) {
      weekNumber = parseInt(weekParam)
      year = parseInt(yearParam)
    } else {
      const today = new Date()
      year = today.getFullYear()
      const startOfWeek = new Date(today)
      startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Montag
      startOfWeek.setHours(0, 0, 0, 0)
      weekNumber = getWeekNumber(startOfWeek)
    }

    // Hole Location mit workingDays
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { workingDays: true },
    })

    const workingDays = location?.workingDays || [1, 2, 3, 4, 5] // Default: Mo-Fr

    // Check all menus for this location to see what exists
    const allMenus = await prisma.menu.findMany({
      where: { locationId },
      select: { id: true, weekNumber: true, year: true, isPublished: true },
    })

    const baseWhere = {
      locationId_weekNumber_year: {
        locationId,
        weekNumber,
        year,
      },
    }
    const baseInclude = {
      menuItems: {
        where: { available: true },
        include: { dish: true },
        orderBy: { date: 'asc' as const },
      },
    }

    type MenuResult = NonNullable<Awaited<ReturnType<typeof prisma.menu.findUnique>>> & {
      menuItems: Array<{ date: Date }>
      promotionBanners?: Array<{ promotionBanner: { id: string; title: string; subtitle: string | null; imageUrl: string | null } }>
    }
    let menu: MenuResult | null = null
    try {
      const result = await prisma.menu.findUnique({
        where: baseWhere,
        include: {
          ...baseInclude,
          promotionBanners: {
            where: { promotionBanner: { isActive: true } },
            include: {
              promotionBanner: {
                include: { coupon: { select: { code: true, name: true } } },
              },
            },
            orderBy: { sortOrder: 'asc' as const },
          },
        },
      })
      menu = result as MenuResult | null
    } catch {
      const result = await prisma.menu.findUnique({
        where: baseWhere,
        include: baseInclude,
      })
      menu = result as MenuResult | null
    }

    if (!menu || !menu.isPublished) {
      return NextResponse.json(
        { error: 'Kein veröffentlichter Menüplan gefunden' },
        { status: 404 }
      )
    }

    // Filtere MenuItems basierend auf workingDays (UTC-Wochentag, da Datum als 12:00 UTC gespeichert)
    const filteredMenuItems = menu.menuItems.filter((item) => {
      const itemDate = new Date(item.date)
      const dayOfWeek = itemDate.getUTCDay() // 0=Sonntag, 1=Montag, ..., 5=Freitag, 6=Samstag
      return workingDays.includes(dayOfWeek)
    })

    // Promotion-Banner für Kunden-Ansicht (bereits nach sortOrder sortiert, nur aktive)
    const promotionBanners = (menu.promotionBanners || []).map(
      (a: {
        promotionBanner: {
          id: string
          title: string
          subtitle: string | null
          imageUrl: string | null
          coupon?: { code: string; name: string } | null
        }
      }) => ({
        id: a.promotionBanner.id,
        title: a.promotionBanner.title,
        subtitle: a.promotionBanner.subtitle,
        imageUrl: a.promotionBanner.imageUrl,
        couponCode: a.promotionBanner.coupon?.code ?? null,
        couponName: a.promotionBanner.coupon?.name ?? null,
      })
    )

    return NextResponse.json({
      ...menu,
      menuItems: filteredMenuItems,
      promotionBanners,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen des Menüs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
