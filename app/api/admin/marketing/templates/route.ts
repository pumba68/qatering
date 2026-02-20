import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/src/generated/prisma'
import { getAdminContext } from '@/lib/admin-helpers'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  type: z.enum(['EMAIL', 'IN_APP_BANNER', 'PROMOTION_BANNER', 'PUSH']),
  content: z.record(z.unknown()).optional().default({}),
  starterTemplateId: z.string().optional(), // Dupliziere aus Starter
})

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const includeStarter = searchParams.get('includeStarter') === 'true'
    const sort = searchParams.get('sort') || 'updatedAt'

    const where: Prisma.MarketingTemplateWhereInput = {}

    if (ctx.organizationId) {
      if (includeStarter) {
        where.OR = [
          { organizationId: ctx.organizationId },
          { isStarter: true },
        ]
      } else {
        where.organizationId = ctx.organizationId
      }
    } else {
      where.isStarter = true
    }

    if (type && ['EMAIL', 'IN_APP_BANNER', 'PROMOTION_BANNER', 'PUSH'].includes(type)) {
      where.type = type as 'EMAIL' | 'IN_APP_BANNER' | 'PROMOTION_BANNER' | 'PUSH'
    }
    if (status && ['ACTIVE', 'ARCHIVED'].includes(status)) {
      where.status = status as 'ACTIVE' | 'ARCHIVED'
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    const orderBy =
      sort === 'name'
        ? { name: 'asc' as const }
        : sort === 'createdAt'
          ? { createdAt: 'desc' as const }
          : { updatedAt: 'desc' as const }

    const templates = await prisma.marketingTemplate.findMany({
      where,
      orderBy,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        isStarter: true,
        isFavorite: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('GET /api/admin/marketing/templates error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: parsed.error.errors },
        { status: 400 }
      )
    }
    const { name, type, content, starterTemplateId } = parsed.data

    let templateContent: Prisma.InputJsonValue = content as Prisma.InputJsonValue
    if (starterTemplateId) {
      const starter = await prisma.marketingTemplate.findFirst({
        where: { id: starterTemplateId, isStarter: true },
        select: { content: true },
      })
      if (starter) {
        templateContent = starter.content as Prisma.InputJsonValue
      }
    }

    const template = await prisma.marketingTemplate.create({
      data: {
        organizationId: ctx.organizationId,
        name,
        type,
        content: templateContent,
        status: 'ACTIVE',
        isStarter: false,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/marketing/templates error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
