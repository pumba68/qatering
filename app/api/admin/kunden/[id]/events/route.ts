import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export interface UserEventEntry {
  id: string
  type: string
  source: 'custom' | 'order' | 'wallet' | 'journey' | 'email' | 'coupon' | 'preference'
  title: string
  description?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

const WALLET_TYPE_LABELS: Record<string, string> = {
  TOP_UP: 'Guthaben aufgeladen',
  ORDER_PAYMENT: 'Bezahlung mit Wallet',
  REFUND: 'Erstattung',
  ADJUSTMENT: 'Guthabenanpassung',
  INCENTIVE: 'Incentive erhalten',
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ausstehend',
  CONFIRMED: 'Bestätigt',
  PREPARING: 'In Zubereitung',
  READY: 'Abholbereit',
  PICKED_UP: 'Abgeholt',
  CANCELLED: 'Storniert',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(role ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = params.id

  // Verify the user exists (mandant check via session orgId if available)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true, organizationId: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const TAKE = 150

  // Parallel fetch from all sources
  const [
    orders,
    walletTxs,
    journeyParts,
    emailLogs,
    couponRedemptions,
    prefAuditLogs,
    customEvents,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        finalAmount: true,
        createdAt: true,
        pickedUpAt: true,
        location: { select: { name: true } },
      },
    }),
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        type: true,
        amount: true,
        balanceAfter: true,
        description: true,
        createdAt: true,
        performedBy: { select: { name: true } },
      },
    }),
    prisma.journeyParticipant.findMany({
      where: { userId },
      orderBy: { enteredAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        status: true,
        enteredAt: true,
        convertedAt: true,
        exitedAt: true,
        journey: { select: { name: true } },
      },
    }),
    prisma.emailCampaignLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        status: true,
        sentAt: true,
        openedAt: true,
        clickedAt: true,
        createdAt: true,
        campaign: { select: { subjectLine: true } },
      },
    }),
    prisma.couponRedemption.findMany({
      where: { userId },
      orderBy: { redeemedAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        redeemedAt: true,
        coupon: { select: { code: true, name: true } },
      },
    }),
    prisma.preferenceAuditLog.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        action: true,
        key: true,
        value: true,
        changedByName: true,
        changedAt: true,
      },
    }),
    prisma.userEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: TAKE,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        metadata: true,
        createdAt: true,
        actor: { select: { name: true } },
      },
    }),
  ])

  const events: UserEventEntry[] = []

  // ── Custom UserEvents (includes account.registered emitted at signup) ──────
  for (const ev of customEvents) {
    events.push({
      id: `ue_${ev.id}`,
      type: ev.type,
      source: 'custom',
      title: ev.title,
      description: ev.description ?? undefined,
      metadata: (ev.metadata ?? undefined) as Record<string, unknown> | undefined,
      createdAt: ev.createdAt.toISOString(),
    })
  }

  // If no account.registered event was emitted yet (legacy users), synthesize one
  const hasRegistrationEvent = customEvents.some((e) => e.type === 'account.registered')
  if (!hasRegistrationEvent) {
    events.push({
      id: `reg_${user.id}`,
      type: 'account.registered',
      source: 'custom',
      title: 'Konto erstellt',
      description: `Registrierung mit ${user.email}`,
      createdAt: user.createdAt.toISOString(),
    })
  }

  // ── Orders ────────────────────────────────────────────────────────────────
  for (const o of orders) {
    const amount = Number(o.finalAmount ?? o.totalAmount)
    const amountStr = amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

    events.push({
      id: `order_created_${o.id}`,
      type: 'order.created',
      source: 'order',
      title: 'Bestellung aufgegeben',
      description: `${amountStr} bei ${o.location.name}`,
      metadata: { orderId: o.id, amount, location: o.location.name, status: o.status },
      createdAt: o.createdAt.toISOString(),
    })

    if (o.pickedUpAt) {
      events.push({
        id: `order_pickedup_${o.id}`,
        type: 'order.picked_up',
        source: 'order',
        title: 'Bestellung abgeholt',
        description: `${amountStr} bei ${o.location.name}`,
        metadata: { orderId: o.id },
        createdAt: o.pickedUpAt.toISOString(),
      })
    }

    if (o.status === 'CANCELLED') {
      events.push({
        id: `order_cancelled_${o.id}`,
        type: 'order.cancelled',
        source: 'order',
        title: 'Bestellung storniert',
        description: `Bestellung bei ${o.location.name} (${ORDER_STATUS_LABELS['CANCELLED']})`,
        metadata: { orderId: o.id },
        createdAt: o.createdAt.toISOString(),
      })
    }
  }

  // ── Wallet Transactions ───────────────────────────────────────────────────
  for (const tx of walletTxs) {
    const amount = Number(tx.amount)
    const sign = amount >= 0 ? '+' : ''
    const absStr = Math.abs(amount).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    })
    const afterStr = Number(tx.balanceAfter).toLocaleString('de-DE', {
      style: 'currency',
      currency: 'EUR',
    })
    const label = WALLET_TYPE_LABELS[tx.type] ?? 'Wallet-Transaktion'
    const byPart = tx.performedBy?.name ? ` · von ${tx.performedBy.name}` : ''
    const descParts = [
      `${sign}${absStr}`,
      tx.description ?? `Kontostand: ${afterStr}`,
      byPart,
    ]
      .filter(Boolean)
      .join(' · ')

    events.push({
      id: `wallet_${tx.id}`,
      type: `wallet.${tx.type.toLowerCase()}`,
      source: 'wallet',
      title: label,
      description: descParts,
      metadata: {
        amount,
        balanceAfter: Number(tx.balanceAfter),
        performedBy: tx.performedBy?.name ?? null,
      },
      createdAt: tx.createdAt.toISOString(),
    })
  }

  // ── Journeys ──────────────────────────────────────────────────────────────
  for (const p of journeyParts) {
    events.push({
      id: `journey_entered_${p.id}`,
      type: 'journey.entered',
      source: 'journey',
      title: 'Journey gestartet',
      description: p.journey.name,
      metadata: { journeyName: p.journey.name, status: p.status },
      createdAt: p.enteredAt.toISOString(),
    })

    if (p.convertedAt) {
      events.push({
        id: `journey_converted_${p.id}`,
        type: 'journey.converted',
        source: 'journey',
        title: 'Journey-Ziel erreicht',
        description: p.journey.name,
        metadata: { journeyName: p.journey.name },
        createdAt: p.convertedAt.toISOString(),
      })
    }

    if (p.exitedAt) {
      events.push({
        id: `journey_exited_${p.id}`,
        type: 'journey.exited',
        source: 'journey',
        title: 'Journey verlassen',
        description: p.journey.name,
        metadata: { journeyName: p.journey.name },
        createdAt: p.exitedAt.toISOString(),
      })
    }
  }

  // ── Email Campaign Logs ───────────────────────────────────────────────────
  for (const log of emailLogs) {
    if (log.sentAt) {
      events.push({
        id: `email_sent_${log.id}`,
        type: 'email.sent',
        source: 'email',
        title: 'E-Mail gesendet',
        description: log.campaign.subjectLine,
        createdAt: log.sentAt.toISOString(),
      })
    }
    if (log.openedAt) {
      events.push({
        id: `email_opened_${log.id}`,
        type: 'email.opened',
        source: 'email',
        title: 'E-Mail geöffnet',
        description: log.campaign.subjectLine,
        createdAt: log.openedAt.toISOString(),
      })
    }
    if (log.clickedAt) {
      events.push({
        id: `email_clicked_${log.id}`,
        type: 'email.clicked',
        source: 'email',
        title: 'E-Mail Link geklickt',
        description: log.campaign.subjectLine,
        createdAt: log.clickedAt.toISOString(),
      })
    }
  }

  // ── Coupon Redemptions ────────────────────────────────────────────────────
  for (const r of couponRedemptions) {
    const label = r.coupon.name
      ? `${r.coupon.code} · ${r.coupon.name}`
      : r.coupon.code
    events.push({
      id: `coupon_${r.id}`,
      type: 'coupon.redeemed',
      source: 'coupon',
      title: 'Coupon eingelöst',
      description: label,
      metadata: { couponCode: r.coupon.code, couponName: r.coupon.name },
      createdAt: r.redeemedAt.toISOString(),
    })
  }

  // ── Preference Audit Log ──────────────────────────────────────────────────
  const PREF_ACTION_LABEL: Record<string, string> = {
    ADDED: 'hinzugefügt',
    REMOVED: 'entfernt',
    CONFIRMED: 'bestätigt',
  }
  for (const p of prefAuditLogs) {
    const actionLabel = PREF_ACTION_LABEL[p.action] ?? p.action
    const valuePart = p.value ? `: ${p.value}` : ''
    events.push({
      id: `pref_${p.id}`,
      type: 'preference.changed',
      source: 'preference',
      title: `Präferenz ${actionLabel}`,
      description: `${p.key}${valuePart} · von ${p.changedByName}`,
      metadata: { action: p.action, key: p.key, value: p.value, changedBy: p.changedByName },
      createdAt: p.changedAt.toISOString(),
    })
  }

  // Sort all combined events newest first
  events.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return NextResponse.json({ events: events.slice(0, 300) })
}
