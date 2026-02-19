/**
 * PROJ-4e: Incentive-Ausspielung – Coupon oder Guthaben an Segment-User vergeben.
 */

import { prisma } from '@/lib/prisma'
import {
  loadAudienceData,
  computeSegmentAudienceIds,
  type RulesCombination,
} from '@/lib/segment-audience'
import { ensureWallet } from '@/lib/wallet'
import { Decimal } from '@/src/generated/prisma/runtime/library'

function generatePersonalCode(prefix: string, userId: string): string {
  const hash = userId.slice(-8).toUpperCase().replace(/[^A-Z0-9]/g, 'X')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}-${hash}${random}`
}

/** Incentive an alle User eines Segments ausspielen. Gibt Anzahl der Grants zurück. */
export async function grantIncentiveToSegment(
  incentiveId: string,
  options: { organizationId: string; allowedLocationIds?: string[] | null }
): Promise<{ granted: number; skipped: number; errors: string[] }> {
  const incentive = await prisma.segmentIncentive.findFirst({
    where: { id: incentiveId, organizationId: options.organizationId, isActive: true },
    include: {
      segment: true,
      coupon: true,
    },
  })

  if (!incentive) {
    throw new Error('Incentive nicht gefunden oder inaktiv.')
  }

  const now = new Date()
  if (incentive.startDate && new Date(incentive.startDate) > now) {
    throw new Error('Incentive ist noch nicht aktiv.')
  }
  if (incentive.endDate && new Date(incentive.endDate) < now) {
    throw new Error('Incentive ist abgelaufen.')
  }

  const audienceData = await loadAudienceData(
    options.organizationId,
    options.allowedLocationIds ?? null
  )
  const rules = (incentive.segment.rules as unknown[]) ?? []
  const combination = (incentive.segment.rulesCombination as RulesCombination) ?? 'AND'
  const userIds = computeSegmentAudienceIds(audienceData, rules, combination)

  let granted = 0
  let skipped = 0
  const errors: string[] = []

  for (const userId of userIds) {
    try {
      const existing = await prisma.incentiveGrant.count({
        where: {
          segmentIncentiveId: incentiveId,
          userId,
        },
      })
      if (existing >= incentive.maxGrantsPerUser) {
        skipped++
        continue
      }

      if (incentive.incentiveType === 'COUPON') {
        if (!incentive.couponId || !incentive.coupon) {
          errors.push(`Incentive ${incentiveId}: Kein Coupon konfiguriert.`)
          continue
        }
        const template = incentive.coupon
        let couponCode: string
        let couponId: string

        if (incentive.personaliseCoupon) {
          // Personalisierten Einmal-Coupon erstellen
          let code = generatePersonalCode('INC', userId)
          let attempts = 0
          while (await prisma.coupon.findUnique({ where: { code } }) && attempts < 10) {
            code = generatePersonalCode('INC', userId + attempts)
            attempts++
          }
          const newCoupon = await prisma.coupon.create({
            data: {
              code,
              name: template.name,
              description: template.description,
              type: template.type,
              discountValue: template.discountValue,
              freeItemDishId: template.freeItemDishId,
              locationId: template.locationId,
              startDate: incentive.startDate,
              endDate: incentive.endDate,
              maxUses: 1,
              maxUsesPerUser: 1,
              minOrderAmount: template.minOrderAmount,
              isActive: true,
            },
          })
          couponCode = code
          couponId = newCoupon.id
        } else {
          couponCode = template.code
          couponId = template.id
        }

        await prisma.incentiveGrant.create({
          data: {
            segmentIncentiveId: incentiveId,
            userId,
            couponCode,
            couponId,
          },
        })
      } else if (incentive.incentiveType === 'WALLET_CREDIT') {
        if (!incentive.walletAmount || Number(incentive.walletAmount) <= 0) {
          errors.push(`Incentive ${incentiveId}: Ungültiger Guthaben-Betrag.`)
          continue
        }
        const amount = Number(incentive.walletAmount)
        const wallet = await ensureWallet(userId)
        const balanceBefore = Number(wallet.balance)
        const balanceAfter = balanceBefore + amount

        const grant = await prisma.incentiveGrant.create({
          data: {
            segmentIncentiveId: incentiveId,
            userId,
          },
        })

        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: balanceAfter },
          }),
          prisma.walletTransaction.create({
            data: {
              userId,
              type: 'INCENTIVE',
              amount,
              balanceBefore,
              balanceAfter,
              description: incentive.name || `Incentive: ${incentive.segment.name}`,
              incentiveGrantId: grant.id,
            },
          }),
        ])
      }
      granted++
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`User ${userId}: ${msg}`)
    }
  }

  return { granted, skipped, errors }
}
