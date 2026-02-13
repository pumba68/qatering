import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['PAID']),
})

/**
 * GET: Einzelne Rechnung inkl. Einzelposten.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params
    const invoice = await prisma.companyInvoice.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, contractNumber: true } },
        items: { orderBy: { orderDate: 'asc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Fehler GET Billing Invoice:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * PATCH: Status aktualisieren (z. B. auf „Bezahlt“).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params
    const invoice = await prisma.companyInvoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    if (parsed.data.status === 'PAID' && invoice.status !== 'INVOICED') {
      return NextResponse.json(
        { error: 'Nur Rechnungen mit Status „Rechnung gestellt“ können auf „Bezahlt“ gesetzt werden.' },
        { status: 400 }
      )
    }

    const updated = await prisma.companyInvoice.update({
      where: { id },
      data: { status: parsed.data.status },
      include: {
        company: { select: { id: true, name: true, contractNumber: true } },
        items: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Fehler PATCH Billing Invoice:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
