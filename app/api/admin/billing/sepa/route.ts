export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { generatePain008, earliestSepaCoreDueDate } from '@/lib/sepa/generatePain008'
import { Decimal } from '@/src/generated/prisma/runtime/library'

/**
 * GET /api/admin/billing/sepa
 * Returns SEPA submission history for the organization.
 */
export async function GET(request: NextRequest) {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('companyId') || undefined

  const submissions = await prisma.sepaSubmission.findMany({
    where: {
      organizationId: organizationId ?? undefined,
      ...(companyId ? { companyId } : {}),
    },
    orderBy: { generatedAt: 'desc' },
    take: 50,
    include: {
      company: { select: { id: true, name: true, contractNumber: true } },
      invoices: {
        include: {
          companyInvoice: { select: { id: true, year: true, month: true, totalAmount: true } },
        },
      },
    },
  })

  return NextResponse.json(
    submissions.map((s) => ({
      ...s,
      totalAmount: Number(s.totalAmount),
    }))
  )
}

/**
 * POST /api/admin/billing/sepa/generate
 * Generates a pain.008.003.03 SEPA Core Direct Debit XML file.
 *
 * Body: {
 *   companyId: string
 *   source: 'INVOICED' | 'OPEN_BALANCE'
 *   dueDate: string  (YYYY-MM-DD)
 *   seqType: 'FRST' | 'RCUR'
 * }
 *
 * Returns: XML file as application/xml download.
 */
export async function POST(request: NextRequest) {
  const { error, organizationId, user } = await getAdminContext()
  if (error) return error
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userRole = (user as { role?: string }).role
  if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '')) {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  if (!organizationId) {
    return NextResponse.json({ error: 'Organisation nicht gefunden.' }, { status: 400 })
  }

  const body = await request.json()
  const { companyId, source, dueDate: dueDateStr, seqType } = body

  // ── Input validation ─────────────────────────────────────────────────────────
  if (!companyId || !source || !dueDateStr || !seqType) {
    return NextResponse.json({ error: 'Fehlende Pflichtfelder.' }, { status: 400 })
  }
  if (!['INVOICED', 'OPEN_BALANCE'].includes(source)) {
    return NextResponse.json({ error: 'Ungültige Quelle.' }, { status: 400 })
  }
  if (!['FRST', 'RCUR'].includes(seqType)) {
    return NextResponse.json({ error: 'Ungültiger Sequenztyp.' }, { status: 400 })
  }

  const dueDate = new Date(dueDateStr)
  if (isNaN(dueDate.getTime())) {
    return NextResponse.json({ error: 'Ungültiges Fälligkeitsdatum.' }, { status: 400 })
  }
  const earliest = earliestSepaCoreDueDate()
  if (dueDate < earliest) {
    return NextResponse.json({
      error: `SEPA CORE erfordert mindestens 5 Werktage Vorlaufzeit. Frühestes zulässiges Datum: ${earliest.toISOString().slice(0, 10)}.`,
    }, { status: 400 })
  }

  // ── Load organization SEPA settings ─────────────────────────────────────────
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, sepaCreditorId: true, sepaIban: true, sepaBic: true },
  })

  if (!org?.sepaCreditorId || !org?.sepaIban || !org?.sepaBic) {
    return NextResponse.json({
      error: 'Betreiber-SEPA-Daten unvollständig. Bitte Gläubiger-ID, IBAN und BIC in den Zahleinstellungen hinterlegen.',
    }, { status: 400 })
  }

  // ── Load company ─────────────────────────────────────────────────────────────
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true, name: true,
      sepaIban: true, sepaBic: true, sepaMandateReference: true, sepaMandateDate: true,
    },
  })

  if (!company) {
    return NextResponse.json({ error: 'Vertragspartner nicht gefunden.' }, { status: 404 })
  }

  if (!company.sepaIban || !company.sepaBic || !company.sepaMandateReference || !company.sepaMandateDate) {
    return NextResponse.json({
      error: `Vertragspartner "${company.name}" hat unvollständige SEPA-Bankdaten. Bitte IBAN, BIC, Mandatsreferenz und Mandatsdatum unter Unternehmen hinterlegen.`,
    }, { status: 400 })
  }

  const adminUserId = (user as { id?: string }).id ?? 'unknown'

  // ── Collect invoices/positions ───────────────────────────────────────────────
  let invoiceIds: string[] = []
  let totalAmount = 0
  let transactions: Array<{
    endToEndId: string
    amount: number
    debtor: {
      name: string
      iban: string
      bic: string
      mandateReference: string
      mandateDate: Date
    }
    remittanceInfo: string
  }> = []

  if (source === 'INVOICED') {
    // Use existing INVOICED invoices (not yet SEPA_SUBMITTED or PAID)
    const invoices = await prisma.companyInvoice.findMany({
      where: { companyId, status: 'INVOICED' },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
    })

    if (invoices.length === 0) {
      return NextResponse.json({
        error: 'Keine Rechnungen mit Status "Rechnung gestellt" für diesen Vertragspartner.',
      }, { status: 400 })
    }

    invoiceIds = invoices.map((i) => i.id)
    totalAmount = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)

    transactions = invoices.map((inv) => ({
      endToEndId: `INV-${inv.year}-${String(inv.month).padStart(2, '0')}-${company.id.slice(-6)}`,
      amount: Number(inv.totalAmount),
      debtor: {
        name: company.name,
        iban: company.sepaIban!,
        bic: company.sepaBic!,
        mandateReference: company.sepaMandateReference!,
        mandateDate: company.sepaMandateDate!,
      },
      remittanceInfo: `Rechnung ${inv.year}/${String(inv.month).padStart(2, '0')} – ${company.name}`,
    }))

  } else {
    // OPEN_BALANCE: collect all uninvoiced orders and create an invoice
    const alreadyInvoicedItems = await prisma.companyInvoiceItem.findMany({
      select: { orderId: true },
    })
    const invoicedOrderIds = new Set(alreadyInvoicedItems.map((i) => i.orderId))

    const orders = await prisma.order.findMany({
      where: {
        employerCompanyId: companyId,
        status: { not: 'CANCELLED' },
        id: { notIn: Array.from(invoicedOrderIds) },
        employerSubsidyAmount: { gt: 0 },
      },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    })

    if (orders.length === 0) {
      return NextResponse.json({
        error: 'Kein offener Saldo für diesen Vertragspartner.',
      }, { status: 400 })
    }

    totalAmount = orders.reduce((s, o) => s + Number(o.employerSubsidyAmount ?? 0), 0)

    // Create a new invoice for these orders (auto-invoiced via SEPA)
    const now = new Date()
    const invoice = await prisma.companyInvoice.create({
      data: {
        companyId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        status: 'SEPA_SUBMITTED',
        totalAmount: new Decimal(totalAmount),
        invoicedAt: now,
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
    })

    invoiceIds = [invoice.id]

    transactions = [{
      endToEndId: `OB-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${company.id.slice(-6)}`,
      amount: totalAmount,
      debtor: {
        name: company.name,
        iban: company.sepaIban!,
        bic: company.sepaBic!,
        mandateReference: company.sepaMandateReference!,
        mandateDate: company.sepaMandateDate!,
      },
      remittanceInfo: `Offener Saldo ${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')} – ${company.name}`,
    }]
  }

  if (totalAmount <= 0) {
    return NextResponse.json({ error: 'Gesamtbetrag muss größer als 0 sein.' }, { status: 400 })
  }

  // ── Generate XML ─────────────────────────────────────────────────────────────
  let xml: string
  try {
    xml = generatePain008({
      creditor: {
        name: org.name,
        iban: org.sepaIban!,
        bic: org.sepaBic!,
        creditorId: org.sepaCreditorId!,
      },
      transactions,
      dueDate,
      seqType: seqType as 'FRST' | 'RCUR',
      messageId: `MSG-${companyId.slice(-8)}-${Date.now()}`,
      paymentInfoId: `PMTINF-${companyId.slice(-8)}-${Date.now()}`,
    })
  } catch (xmlErr) {
    console.error('SEPA XML generation error:', xmlErr)
    return NextResponse.json({
      error: 'XML-Generierung fehlgeschlagen. Bitte Support kontaktieren.',
    }, { status: 500 })
  }

  // ── Persist SepaSubmission + update invoice statuses ─────────────────────────
  await prisma.$transaction(async (tx) => {
    // Create submission record
    const submission = await tx.sepaSubmission.create({
      data: {
        companyId,
        organizationId,
        totalAmount: new Decimal(totalAmount),
        dueDate,
        seqType,
        createdById: adminUserId,
        source,
      },
    })

    // Link invoices to submission
    await tx.sepaSubmissionInvoice.createMany({
      data: invoiceIds.map((id) => ({
        sepaSubmissionId: submission.id,
        companyInvoiceId: id,
      })),
    })

    // Update INVOICED invoices to SEPA_SUBMITTED (skip OPEN_BALANCE ones already set)
    if (source === 'INVOICED') {
      await tx.companyInvoice.updateMany({
        where: { id: { in: invoiceIds }, status: 'INVOICED' },
        data: { status: 'SEPA_SUBMITTED' },
      })
    }
  })

  // ── Return XML file ──────────────────────────────────────────────────────────
  const safeName = company.name.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40)
  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `sepa-lastschrift-${safeName}-${dateStr}.xml`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
