export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@/src/generated/prisma'

export async function GET(req: NextRequest) {
  try {
    const { error, organizationId } = await getAdminContext()
    if (error) return error

    if (!organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = 25
    const skip = (page - 1) * pageSize

    const sortParam = searchParams.get('sort') ?? 'createdAt_desc'
    const [sortField, sortDir] = sortParam.split('_')

    type OrderByField = 'name' | 'createdAt'
    const allowedSortFields: OrderByField[] = ['name', 'createdAt']
    const safeField = allowedSortFields.includes(sortField as OrderByField)
      ? (sortField as OrderByField)
      : 'createdAt'
    const safeDir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc'

    // Build where clause — Mandantentrennung: immer organizationId-gefiltert
    const where: Prisma.UserWhereInput = {
      organizationId,
      role: 'CUSTOMER',
      // Zusammengeführte Profile (mergedIntoId gesetzt) aus der Liste ausblenden
      mergedIntoId: null,
    }

    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        {
          customerIdentifiers: {
            some: { value: { contains: search, mode: 'insensitive' }, isActive: true },
          },
        },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [safeField]: safeDir },
        select: {
          id: true,
          customerId: true,
          name: true,
          email: true,
          image: true,
          isAnonymous: true,
          createdAt: true,
          organizationId: true,
          wallet: { select: { balance: true } },
          locations: {
            select: {
              location: { select: { id: true, name: true } },
            },
            take: 1,
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    const data = users.map((u) => ({
      id: u.id,
      customerId: u.customerId,
      name: u.name,
      email: u.email,
      image: u.image,
      isAnonymous: u.isAnonymous,
      createdAt: u.createdAt,
      walletBalance: u.wallet ? Number(u.wallet.balance) : 0,
      primaryLocation: u.locations[0]?.location ?? null,
    }))

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error('Fehler beim Abrufen der Kundenliste:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
