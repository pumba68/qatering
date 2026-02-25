import { prisma } from '@/lib/prisma'

export type UserEventType =
  | 'account.registered'
  | 'order.created'
  | 'order.confirmed'
  | 'order.picked_up'
  | 'order.cancelled'
  | 'wallet.top_up'
  | 'wallet.payment'
  | 'wallet.refund'
  | 'wallet.incentive'
  | 'wallet.adjustment'
  | 'coupon.redeemed'
  | 'journey.entered'
  | 'journey.converted'
  | 'journey.exited'
  | 'preference.changed'
  | 'email.sent'
  | 'email.opened'
  | 'email.clicked'

export async function emitUserEvent(
  userId: string,
  type: UserEventType,
  payload: {
    title: string
    description?: string
    metadata?: Record<string, unknown>
    actorId?: string
    createdAt?: Date
  }
): Promise<void> {
  try {
    await prisma.userEvent.create({
      data: {
        userId,
        type,
        title: payload.title,
        description: payload.description ?? null,
        metadata: payload.metadata as never ?? null,
        actorId: payload.actorId ?? null,
        createdAt: payload.createdAt ?? new Date(),
      },
    })
  } catch (err) {
    // Fire-and-forget safe — never throws
    console.error('[emitUserEvent] Failed to persist event:', err)
  }
}
