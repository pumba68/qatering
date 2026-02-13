import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const createSchema = z.object({
  companyId: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
})

/**
 * GET: Rechnungen abrufen. Query: companyId, year, month (optional).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('companyId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    const where: { companyId?: string; year?: number; month?: number } = {}
    if (companyId) where.companyId = companyId
    if (year) where.year = parseInt(year, 10)
    if (month) where.month = parseInt(month, 10)

    const invoices = await prisma.companyInvoice.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, contractNumber: true } },
        _count: { select: { items: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error('Fehler GET Billing Invoices:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

/**
 * POST: Monatsrechnung erstellen (DRAFT). Erfasst alle noch nicht abgerechneten Bestellungen des Vertragspartners im Zeitraum.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { companyId, year, month } = parsed.data

    const company = await prisma.company.findFirst({
      where: { id: companyId },
    })
    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      )
    }

    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59, 999)

    const alreadyInvoiced = await prisma.companyInvoiceItem.findMany({
      select: { orderId: true },
    })
    const invoicedIds = new Set(alreadyInvoiced.map((i) => i.orderId))

    const orders = await prisma.order.findMany({
      where: {
        employerCompanyId: companyId,
        status: { not: 'CANCELLED' },
        createdAt: { gte: start, lte: end },
        id: { notIn: Array.from(invoicedIds) },
        employerSubsidyAmount: { not: null },
      },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Keine abrechenbaren Bestellungen für diesen Zeitraum.' },
        { status: 400 }
      )
    }

    const totalAmount = orders.reduce(
      (sum, o) => sum + Number(o.employerSubsidyAmount ?? 0),
      0
    )

    const existing = await prisma.companyInvoice.findUnique({
      where: {
        companyId_year_month: { companyId, year, month },
      },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Für diesen Zeitraum existiert bereits eine Rechnung.' },
        { status: 400 }
      )
    }

    const invoice = await prisma.companyInvoice.create({
      data: {
        companyId,
        year,
        month,
        status: 'DRAFT',
        totalAmount,
        items: {
          create: orders.map((o) => ({
            orderId: o.id,
            orderNumber: o.pickupCode,
            orderDate: o.createdAt,
            employeeName: o.user?.name ?? o.user?.email ?? 'Unbekannt',
            amount: o.employerSubsidyAmount!,
          })),
        },
      },
      include: {
        company: { select: { id: true, name: true, contractNumber: true } },
        items: true,
      },
    })

    return NextResponse.json(invoice, { status: 201 })
  } catch (error) {
    console.error('Fehler POST Billing Invoice:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
