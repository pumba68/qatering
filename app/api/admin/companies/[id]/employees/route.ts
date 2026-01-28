import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { z } from 'zod'

const addEmployeeSchema = z.object({
  userId: z.string().min(1, 'Benutzer ist erforderlich'),
  employeeNumber: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
  validFrom: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
})

// GET: Mitarbeiter des Unternehmens abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id: companyId } = await params

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      )
    }

    const employees = await prisma.companyEmployee.findMany({
      where: { companyId },
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Fehler beim Abrufen der Mitarbeiter:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST: Mitarbeiter zum Unternehmen hinzufügen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminRole()
    if (auth.error) return auth.error

    const { id: companyId } = await params
    const body = await request.json()
    const validated = addEmployeeSchema.parse(body)

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Unternehmen nicht gefunden' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    const existing = await prisma.companyEmployee.findUnique({
      where: {
        companyId_userId: { companyId, userId: validated.userId },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Dieser Benutzer ist bereits diesem Unternehmen zugeordnet.' },
        { status: 409 }
      )
    }

    const employee = await prisma.companyEmployee.create({
      data: {
        companyId,
        userId: validated.userId,
        employeeNumber: validated.employeeNumber ?? null,
        department: validated.department ?? null,
        isActive: validated.isActive ?? true,
        validFrom: validated.validFrom ? new Date(validated.validFrom) : null,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : null,
      },
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

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Fehler beim Hinzufügen des Mitarbeiters:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
