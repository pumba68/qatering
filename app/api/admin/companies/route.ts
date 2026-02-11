import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'
import { Decimal } from '@/src/generated/prisma/runtime/library'

const subsidyTypeEnum = z.enum(['NONE', 'PERCENTAGE', 'FIXED'])

const companySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  contractNumber: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  subsidyType: subsidyTypeEnum.default('NONE'),
  subsidyValue: z.number().optional().nullable(),
  subsidyMaxPerDay: z.number().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
})

// GET: Alle Unternehmen abrufen
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: { isActive?: boolean } = {}
    if (!includeInactive) where.isActive = true

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Fehler beim Abrufen der Unternehmen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST: Neues Unternehmen erstellen
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const body = await request.json()
    const validated = companySchema.parse(body)

    if (
      (validated.subsidyType === 'PERCENTAGE' || validated.subsidyType === 'FIXED') &&
      (validated.subsidyValue == null || validated.subsidyValue <= 0)
    ) {
      return NextResponse.json(
        { error: 'Zuschuss-Wert ist erforderlich und muss größer als 0 sein.' },
        { status: 400 }
      )
    }
    if (
      validated.subsidyType === 'PERCENTAGE' &&
      validated.subsidyValue != null &&
      validated.subsidyValue > 100
    ) {
      return NextResponse.json(
        { error: 'Prozent-Zuschuss darf nicht größer als 100% sein.' },
        { status: 400 }
      )
    }

    const company = await prisma.company.create({
      data: {
        name: validated.name,
        contractNumber: validated.contractNumber ?? null,
        isActive: validated.isActive ?? true,
        subsidyType: validated.subsidyType,
        subsidyValue: validated.subsidyValue != null ? new Decimal(validated.subsidyValue) : null,
        subsidyMaxPerDay:
          validated.subsidyMaxPerDay != null ? new Decimal(validated.subsidyMaxPerDay) : null,
        validFrom: validated.validFrom ? new Date(validated.validFrom) : null,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
      },
      include: {
        _count: { select: { employees: true } },
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Erstellen des Unternehmens:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
