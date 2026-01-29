import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const menuItemUpdateSchema = z.object({
  dishId: z.string().optional(),
  date: z.string().datetime().optional(),
  price: z.number().positive().optional(),
  maxOrders: z.number().int().positive().optional().nullable(),
  available: z.boolean().optional(),
  currentOrders: z.number().int().min(0).optional(),
  isPromotion: z.boolean().optional(),
  promotionPrice: z.number().positive().nullable().optional(),
  promotionLabel: z.string().max(200).nullable().optional(),
})

// PATCH: MenuItem bearbeiten (z.B. Datum, Preis)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // #region agent log
  const paramsId = typeof (params as any)?.then === 'function' ? '(params is Promise)' : (params as { id?: string })?.id;
  fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/menus/items/[id]/route.ts:PATCH:entry',message:'PATCH menu item entry',data:{paramsId,paramsType:typeof params},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/menus/items/[id]/route.ts:PATCH:body',message:'PATCH body before validation',data:{bodyKeys:Object.keys(body),promotionPrice:body?.promotionPrice,promotionLabel:body?.promotionLabel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    const validatedData = menuItemUpdateSchema.parse(body)

    const updateData: any = {}
    if (validatedData.dishId !== undefined) updateData.dishId = validatedData.dishId
    if (validatedData.date !== undefined) updateData.date = new Date(validatedData.date)
    if (validatedData.price !== undefined) updateData.price = validatedData.price
    if (validatedData.maxOrders !== undefined) updateData.maxOrders = validatedData.maxOrders
    if (validatedData.available !== undefined) updateData.available = validatedData.available
    if (validatedData.currentOrders !== undefined) updateData.currentOrders = validatedData.currentOrders
    if (validatedData.isPromotion !== undefined) updateData.isPromotion = validatedData.isPromotion
    if (validatedData.promotionPrice !== undefined) updateData.promotionPrice = validatedData.promotionPrice
    if (validatedData.promotionLabel !== undefined) updateData.promotionLabel = validatedData.promotionLabel

    // #region agent log
    const id = typeof (params as any)?.then === 'function' ? undefined : (params as { id: string }).id;
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/menus/items/[id]/route.ts:PATCH:beforePrisma',message:'before prisma.update',data:{id,updateDataKeys:Object.keys(updateData),hasPromotionPrice:updateData.promotionPrice !== undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    const menuItem = await prisma.menuItem.update({
      where: { id: (params as { id: string }).id },
      data: updateData,
      include: {
        dish: true,
      },
    })

    return NextResponse.json(menuItem)
    } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }
    // #region agent log
    const err = error as Error & { code?: string };
    fetch('http://127.0.0.1:7242/ingest/667b66fd-0ed1-442c-a749-9c4a5c9994ef',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/menus/items/[id]/route.ts:PATCH:catch',message:'PATCH 500 error',data:{errorMessage:err?.message,errorName:err?.name,prismaCode:(err as any)?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    console.error('Fehler beim Aktualisieren des MenuItems:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: MenuItem entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    // Prüfen ob bereits Bestellungen existieren
    const orderItems = await prisma.orderItem.findMany({
      where: { menuItemId: params.id },
    })

    if (orderItems.length > 0) {
      return NextResponse.json(
        { error: 'Gericht kann nicht entfernt werden, da bereits Bestellungen existieren' },
        { status: 400 }
      )
    }

    await prisma.menuItem.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'MenuItem gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des MenuItems:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
