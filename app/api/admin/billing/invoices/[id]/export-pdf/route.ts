import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

/**
 * POST: PDF erzeugen, Rechnung auf „Rechnung gestellt“ setzen, PDF zurückgeben.
 */
export async function POST(
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
        company: { select: { name: true, contractNumber: true } },
        items: { orderBy: { orderDate: 'asc' } },
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      )
    }

    if (invoice.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Nur Rechnungen im Status Entwurf können exportiert werden.' },
        { status: 400 }
      )
    }

    const pdfDoc = await PDFDocument.create()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()
    let y = height - 50

    const drawText = (text: string, x: number, size = 11, bold = false) => {
      const f = bold ? fontBold : font
      page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) })
      y -= size + 2
    }

    drawText('Monatsrechnung – Zuschusskosten', 50, 18, true)
    y -= 10

    drawText(`Vertragspartner: ${invoice.company.name}`, 50)
    if (invoice.company.contractNumber) {
      drawText(`Vertragsnummer: ${invoice.company.contractNumber}`, 50)
    }
    drawText(
      `Abrechnungszeitraum: ${MONTHS[invoice.month - 1]} ${invoice.year}`,
      50
    )
    y -= 15

    drawText('Einzelposten', 50, 12, true)
    drawText(
      'Bestellnummer          Datum        Mitarbeiter                    Summe (€)',
      50,
      10
    )
    y -= 8

    for (const item of invoice.items) {
      const dateStr = new Date(item.orderDate).toLocaleDateString('de-DE')
      const amountStr = Number(item.amount).toFixed(2)
      const line =
        `${item.orderNumber.padEnd(22)} ${dateStr.padEnd(12)} ${(item.employeeName || '-').slice(0, 28).padEnd(28)} ${amountStr}`
      drawText(line, 50, 10)
    }

    y -= 15
    const totalStr = `Gesamtbetrag: ${Number(invoice.totalAmount).toFixed(2)} €`
    drawText(totalStr, 50, 12, true)

    y -= 30
    drawText(
      'Diese Rechnung stellt die durch Arbeitgeberzuschüsse entstandenen Kosten dar.',
      50,
      9
    )

    const pdfBytes = await pdfDoc.save()

    await prisma.companyInvoice.update({
      where: { id },
      data: { status: 'INVOICED', invoicedAt: new Date() },
    })

    const filename = `Rechnung_${invoice.company.name.replace(/[^a-zA-Z0-9]/g, '_')}_${invoice.year}_${String(invoice.month).padStart(2, '0')}.pdf`

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (error) {
    console.error('Fehler PDF Export:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
