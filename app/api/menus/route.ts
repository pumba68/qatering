import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: Aktuellen Essensplan für eine Location abrufen
export async function GET(request: NextRequest) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/menus/route.ts:6',message:'API GET /api/menus called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const weekParam = searchParams.get('weekNumber')
    const yearParam = searchParams.get('year')

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/menus/route.ts:12',message:'Location ID from request',data:{locationId,weekParam,yearParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/menus/route.ts:35',message:'Searching for menu',data:{locationId,weekNumber,year},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/menus/route.ts:36',message:'All menus found in DB',data:{allMenus:allMenus.map(m=>({weekNumber:m.weekNumber,year:m.year,isPublished:m.isPublished})),searchingFor:{weekNumber,year}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const menu = await prisma.menu.findUnique({
      where: {
        locationId_weekNumber_year: {
          locationId,
          weekNumber,
          year,
        },
      },
      include: {
        menuItems: {
          where: {
            available: true,
            // Entferne Datumsfilter für Wochen-Navigation (zeige alle Tage der Woche)
          },
          include: {
            dish: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    })

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/menus/route.ts:51',message:'Menu query result',data:{menuFound:!!menu,isPublished:menu?.isPublished,menuItemsCount:menu?.menuItems?.length||0,menuId:menu?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!menu || !menu.isPublished) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/menus/route.ts:54',message:'Menu not found or not published',data:{menuExists:!!menu,isPublished:menu?.isPublished},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return NextResponse.json(
        { error: 'Kein veröffentlichter Menüplan gefunden' },
        { status: 404 }
      )
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/menus/route.ts:60',message:'Menu found and published, returning',data:{menuItemsCount:menu.menuItems.length,menuItemDates:menu.menuItems.map(mi=>mi.date)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Filtere MenuItems basierend auf workingDays
    const filteredMenuItems = menu.menuItems.filter((item) => {
      const itemDate = new Date(item.date)
      const dayOfWeek = itemDate.getDay() // 0=Sonntag, 1=Montag, ..., 6=Samstag
      return workingDays.includes(dayOfWeek)
    })

    return NextResponse.json({
      ...menu,
      menuItems: filteredMenuItems,
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
