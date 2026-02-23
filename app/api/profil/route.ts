export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerContext } from '@/lib/profil-helpers'

/**
 * GET /api/profil
 * Returns aggregated profile data for the authenticated customer:
 * - User data (name, email, image, marketing consent, etc.)
 * - Wallet balance
 * - Last order
 * - Preferences (explicit + derived suggestions)
 * - Push subscription status
 * - Pending email change token
 */
export async function GET() {
  const ctx = await getCustomerContext()
  if (ctx.error) return ctx.error

  const userId = ctx.userId!

  try {
    const [user, wallet, lastOrder, allPrefs, pushSub, pendingToken] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
          marketingEmailConsent: true,
          isAnonymous: true,
          passwordHash: true,
        },
      }),
      prisma.wallet.findUnique({
        where: { userId },
        select: { balance: true },
      }),
      prisma.order.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, totalAmount: true },
      }),
      prisma.customerPreference.findMany({
        where: { userId },
        select: {
          id: true,
          key: true,
          type: true,
          source: true,
          confidence: true,
          ignored: true,
        },
      }),
      prisma.pushSubscription.findFirst({
        where: { userId },
        select: { id: true },
      }),
      (prisma as any).emailChangeToken.findFirst({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { newEmail: true, expiresAt: true, createdAt: true },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Filter preferences: explicit are those with source !== 'DERIVED', derived are DERIVED + not ignored + not already explicit
    const explicit = allPrefs.filter((p: any) => p.source !== 'DERIVED' && !p.ignored)
    const derived = allPrefs.filter(
      (p: any) =>
        p.source === 'DERIVED' &&
        !p.ignored &&
        !explicit.some((e: any) => e.key === p.key)
    )

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        marketingEmailConsent: user.marketingEmailConsent,
        isAnonymous: user.isAnonymous,
        hasPassword: !!user.passwordHash,
      },
      wallet: wallet ? { balance: Number(wallet.balance) } : null,
      lastOrder: lastOrder
        ? {
            id: lastOrder.id,
            status: lastOrder.status,
            createdAt: lastOrder.createdAt,
            totalAmount: Number(lastOrder.totalAmount),
          }
        : null,
      preferences: {
        explicit: explicit.map((p) => ({
          id: p.id,
          key: p.key,
          type: p.type,
          source: p.source,
        })),
        derived: derived.map((p) => ({
          id: p.id,
          key: p.key,
          confidence: p.confidence ? Number(p.confidence) : null,
        })),
      },
      pushSubscribed: !!pushSub,
      pendingEmailChange: pendingToken
        ? {
            newEmail: pendingToken.newEmail,
            expiresAt: pendingToken.expiresAt,
            sentAt: pendingToken.createdAt,
          }
        : null,
    })
  } catch (error) {
    console.error('Fehler bei Profil-Abruf:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
