import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

/**
 * GET: Übersicht Vertragspartner mit offenem Zuschuss-Saldo (noch nicht abgerechnet).
 */
export async function GET() {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const companies = await prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        contractNumber: true,
        sepaIban: true,
        sepaBic: true,
        sepaMandateReference: true,
        sepaMandateDate: true,
        _count: { select: { orders: true } },
      },
    })

    const invoicedOrderIds = await prisma.companyInvoiceItem.findMany({
      select: { orderId: true },
    })
    const set = new Set(invoicedOrderIds.map((i) => i.orderId))

    const result = await Promise.all(
      companies.map(async (c) => {
        const orders = await prisma.order.findMany({
          where: {
            employerCompanyId: c.id,
            status: { not: 'CANCELLED' },
            id: { notIn: Array.from(set) },
            employerSubsidyAmount: { not: null },
          },
          select: {
            employerSubsidyAmount: true,
          },
        })
        const openBalance = orders.reduce(
          (sum, o) => sum + Number(o.employerSubsidyAmount ?? 0),
          0
        )
        return {
          ...c,
          openBalance: Math.round(openBalance * 100) / 100,
          sepaComplete: !!(c.sepaIban && c.sepaBic && c.sepaMandateReference && c.sepaMandateDate),
        }
      })
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Fehler Billing Overview:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
