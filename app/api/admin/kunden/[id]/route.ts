export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAdminContext()
    if (error) return error

    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.user.findFirst({
      where: {
        id,
        organizationId, // Mandantentrennung: nur eigene Org
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        customerId: true,
        name: true,
        email: true,
        image: true,
        isAnonymous: true,
        mergedIntoId: true,
        createdAt: true,
        organizationId: true,
        organization: { select: { id: true, name: true } },
        wallet: { select: { balance: true } },
        locations: {
          select: {
            location: { select: { id: true, name: true } },
          },
        },
        customerIdentifiers: {
          where: { isActive: true },
          select: {
            id: true,
            type: true,
            value: true,
            source: true,
            addedAt: true,
          },
          orderBy: { addedAt: 'desc' },
        },
        companyEmployees: {
          where: { isActive: true },
          select: {
            company: {
              select: {
                id: true,
                name: true,
                subsidyType: true,
                subsidyValue: true,
                subsidyMaxPerDay: true,
                validUntil: true,
                isActive: true,
              },
            },
            employeeNumber: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      customerId: user.customerId,
      name: user.name,
      email: user.email,
      image: user.image,
      isAnonymous: user.isAnonymous,
      mergedIntoId: user.mergedIntoId,
      createdAt: user.createdAt,
      organization: user.organization,
      walletBalance: user.wallet ? Number(user.wallet.balance) : 0,
      locations: user.locations.map((l) => l.location),
      identifiers: user.customerIdentifiers,
      companyAccess: user.companyEmployees.map((ce) => ({
        companyId: ce.company.id,
        companyName: ce.company.name,
        subsidyType: ce.company.subsidyType,
        subsidyValue: ce.company.subsidyValue ? Number(ce.company.subsidyValue) : null,
        subsidyMaxPerDay: ce.company.subsidyMaxPerDay ? Number(ce.company.subsidyMaxPerDay) : null,
        isActive: ce.company.isActive,
        validUntil: ce.company.validUntil,
        employeeNumber: ce.employeeNumber,
      })),
    })
  } catch (error) {
    console.error('Fehler beim Abrufen des Kundenprofils:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
