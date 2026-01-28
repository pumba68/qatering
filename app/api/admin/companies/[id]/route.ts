import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const subsidyTypeEnum = z.enum(['NONE', 'PERCENTAGE', 'FIXED'])

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  contractNumber: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  subsidyType: subsidyTypeEnum.optional(),
  subsidyValue: z.number().optional().nullable(),
  subsidyMaxPerDay: z.number().optional().nullable(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
})

// GET: Einzelnes Unternehmen abrufen (mit Mitarbeitern)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        employees: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Fehler beim Abrufen des Unternehmens:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PATCH: Unternehmen aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params
    const body = await request.json()
    const validated = updateCompanySchema.parse(body)

    const existing = await prisma.company.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      )
    }

    const subsidyType = validated.subsidyType ?? existing.subsidyType
    if (
      (subsidyType === 'PERCENTAGE' || subsidyType === 'FIXED') &&
      validated.subsidyValue !== undefined
    ) {
      if (validated.subsidyValue == null || validated.subsidyValue <= 0) {
        return NextResponse.json(
          { error: 'Zuschuss-Wert muss größer als 0 sein.' },
          { status: 400 }
        )
      }
      if (
        subsidyType === 'PERCENTAGE' &&
        validated.subsidyValue > 100
      ) {
        return NextResponse.json(
          { error: 'Prozent-Zuschuss darf nicht größer als 100% sein.' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.contractNumber !== undefined) updateData.contractNumber = validated.contractNumber
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    if (validated.subsidyType !== undefined) updateData.subsidyType = validated.subsidyType
    if (validated.subsidyValue !== undefined)
      updateData.subsidyValue =
        validated.subsidyValue != null ? new Decimal(validated.subsidyValue) : null
    if (validated.subsidyMaxPerDay !== undefined)
      updateData.subsidyMaxPerDay =
        validated.subsidyMaxPerDay != null ? new Decimal(validated.subsidyMaxPerDay) : null
    if (validated.validFrom !== undefined)
      updateData.validFrom = validated.validFrom ? new Date(validated.validFrom) : null
    if (validated.validUntil !== undefined)
      updateData.validUntil = validated.validUntil ? new Date(validated.validUntil) : null

    const company = await prisma.company.update({
      where: { id },
      data: updateData,
      include: {
        _count: { select: { employees: true } },
      },
    })

    return NextResponse.json(company)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren des Unternehmens:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: Unternehmen löschen (Cascade löscht CompanyEmployees)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id } = await params

    const existing = await prisma.company.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.company.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Unternehmen erfolgreich gelöscht' })
  } catch (error) {
    console.error('Fehler beim Löschen des Unternehmens:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
