import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const updateEmployeeSchema = z.object({
  employeeNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
})

// PATCH: Mitarbeiter-Zuordnung aktualisieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id: companyId, employeeId } = await params
    const body = await request.json()
    const validated = updateEmployeeSchema.parse(body)

    const existing = await prisma.companyEmployee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Mitarbeiter-Zuordnung nicht gefunden' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (validated.employeeNumber !== undefined) updateData.employeeNumber = validated.employeeNumber
    if (validated.department !== undefined) updateData.department = validated.department
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive
    if (validated.validFrom !== undefined)
      updateData.validFrom = validated.validFrom ? new Date(validated.validFrom) : null
    if (validated.validUntil !== undefined)
      updateData.validUntil = validated.validUntil ? new Date(validated.validUntil) : null

    const employee = await prisma.companyEmployee.update({
      where: { id: employeeId },
      data: updateData,
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
    })

    return NextResponse.json(employee)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Aktualisieren der Mitarbeiter-Zuordnung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE: Mitarbeiter aus Unternehmen entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id: companyId, employeeId } = await params

    const existing = await prisma.companyEmployee.findFirst({
      where: {
        id: employeeId,
        companyId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Mitarbeiter-Zuordnung nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.companyEmployee.delete({
      where: { id: employeeId },
    })

    return NextResponse.json({ message: 'Mitarbeiter erfolgreich entfernt' })
  } catch (error) {
    console.error('Fehler beim Entfernen des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
