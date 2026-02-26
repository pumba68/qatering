export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/marketing/journeys/execute
 * Cron-Job-Endpunkt: Verarbeitet alle fälligen Journey-Participants.
 * - Läuft alle 5 Minuten
 * - Batch-Größe: max. 500 Participants pro Lauf
 * - Verarbeitet Delay-Nodes, Channel-Aktionen, Branch-Nodes, Incentive-Nodes
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRole } from '@/lib/admin-helpers'
import { renderTemplateToHtml } from '@/lib/template-renderer'
import { wrapEmailHtml } from '@/lib/email-html-wrapper'
import { sendEmail, getEmailFrom, getDefaultSenderName } from '@/lib/email-service'
import webpush from 'web-push'
import type { TemplateContent } from '@/components/marketing/editor/editor-types'
import {
  loadAudienceData,
  computeSegmentAudienceIds,
  loadSingleUserAudienceData,
} from '@/lib/segment-audience'
import type { RulesCombination } from '@/lib/segment-audience'

// Configure VAPID keys if present
if (
  process.env.VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY &&
  process.env.VAPID_SUBJECT
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

interface CanvasNode {
  id: string
  type: string
  config?: Record<string, unknown>
}

interface CanvasEdge {
  id: string
  source: string
  sourceHandle: string
  target: string
}

interface CanvasContent {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

interface EmailNodeConfig {
  templateId: string
  subjectOverride?: string
  senderNameOverride?: string
  onFailure: 'stop' | 'continue'
}

interface PushNodeConfig {
  templateId: string
  onFailure: 'stop' | 'continue'
}

interface InAppNodeConfig {
  templateId: string
  onFailure: 'stop' | 'continue'
}

interface IncentiveNodeConfig {
  incentiveType: 'coupon' | 'wallet_credit'
  couponId?: string
  couponName?: string
  walletAmount?: number
  walletNote?: string
}

function getNextNode(
  currentNodeId: string,
  handle: string,
  edges: CanvasEdge[],
  nodes: CanvasNode[]
): CanvasNode | null {
  const edge = edges.find(
    (e) => e.source === currentNodeId && (e.sourceHandle === handle || e.sourceHandle === 'output')
  )
  if (!edge) return null
  return nodes.find((n) => n.id === edge.target) ?? null
}

async function evaluateBranchCondition(
  config: Record<string, unknown>,
  userId: string,
  organizationId: string
): Promise<boolean> {
  const { conditionType, field, operator, value, windowDays } = config

  try {
    if (conditionType === 'segment') {
      const segmentId = config.segmentId as string | undefined
      if (!segmentId) return false

      const segment = await prisma.customerSegment.findUnique({
        where: { id: segmentId },
        select: { rules: true, rulesCombination: true },
      })
      if (!segment) return false

      const userData = await loadSingleUserAudienceData(userId, organizationId)
      if (!userData) return false

      const matchingIds = computeSegmentAudienceIds(
        [userData],
        segment.rules,
        (segment.rulesCombination as RulesCombination) ?? 'AND'
      )
      return matchingIds.includes(userId)
    }

    if (conditionType === 'event') {
      const since = new Date(
        Date.now() - ((windowDays as number) ?? 30) * 24 * 60 * 60 * 1000
      )
      if (field === 'order.first') {
        const orderCount = await prisma.order.count({
          where: { userId, createdAt: { gte: since } },
        })
        return orderCount > 0
      }
      return false
    }

    if (conditionType === 'attribute') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, createdAt: true },
      })
      if (!user) return false
      const fieldValue = (user as Record<string, unknown>)[field as string]
      if (operator === 'eq') return String(fieldValue) === String(value)
      if (operator === 'neq') return String(fieldValue) !== String(value)
      return false
    }
  } catch {
    // On error, take false (no) path
  }

  return false
}

/** Send an email via a marketing template to a participant */
async function executeEmailNode(
  cfg: EmailNodeConfig,
  userId: string,
  participantId: string
): Promise<Record<string, unknown>> {
  if (!cfg.templateId) return { skipped: 'no templateId' }

  const [template, user] = await Promise.all([
    prisma.marketingTemplate.findFirst({
      where: { id: cfg.templateId },
      select: { name: true, content: true, subjectLine: true, preheaderText: true, senderName: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    }),
  ])

  if (!template || !user) return { skipped: 'template or user not found' }

  const content = template.content as unknown as TemplateContent
  const variables: Record<string, string> = {
    '{{Vorname}}': user.name?.split(' ')[0] ?? '',
    '{{Name}}': user.name ?? '',
    '{{Email}}': user.email,
  }

  const bodyHtml = renderTemplateToHtml(content, variables)
  const subject = cfg.subjectOverride ?? template.subjectLine ?? template.name
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://localhost:3000'
  const trackingToken = participantId

  const fullHtml = wrapEmailHtml({
    bodyHtml,
    preheaderText: template.preheaderText ?? undefined,
    trackingToken,
    baseUrl,
    subject,
  })

  const senderName = cfg.senderNameOverride ?? template.senderName ?? getDefaultSenderName()
  const from = `${senderName} <${getEmailFrom()}>`

  const result = await sendEmail({ to: user.email, subject, html: fullHtml, from })

  if (!result.success && cfg.onFailure === 'stop') {
    throw new Error(`Email send failed: ${result.error}`)
  }

  return {
    templateId: cfg.templateId,
    to: user.email,
    success: result.success,
    messageId: result.messageId,
    error: result.error,
  }
}

/** Send a push notification via web-push to all user subscriptions */
async function executePushNode(
  cfg: PushNodeConfig,
  userId: string
): Promise<Record<string, unknown>> {
  if (!cfg.templateId) return { skipped: 'no templateId' }
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { skipped: 'VAPID not configured' }
  }

  const [template, subscriptions] = await Promise.all([
    prisma.marketingTemplate.findFirst({
      where: { id: cfg.templateId },
      select: { name: true, content: true },
    }),
    prisma.pushSubscription.findMany({ where: { userId } }),
  ])

  if (!template) return { skipped: 'template not found' }
  if (subscriptions.length === 0) return { skipped: 'no push subscriptions' }

  // Support both PUSH settings format and generic template name as title
  const templateContent = template.content as Record<string, unknown>
  let pushTitle = template.name
  let pushBody = ''
  let pushUrl: string | undefined

  if (templateContent.type === 'push' && templateContent.settings) {
    const s = templateContent.settings as { title?: string; body?: string; actionUrl?: string }
    pushTitle = s.title ?? pushTitle
    pushBody = s.body ?? ''
    pushUrl = s.actionUrl
  }

  const payload = JSON.stringify({
    title: pushTitle,
    body: pushBody,
    ...(pushUrl ? { data: { url: pushUrl } } : {}),
  })

  let sentCount = 0
  let failedCount = 0

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dhKey, auth: sub.authKey } },
          payload
        )
        sentCount++
      } catch {
        failedCount++
      }
    })
  )

  if (sentCount === 0 && failedCount > 0 && cfg.onFailure === 'stop') {
    throw new Error('All push sends failed')
  }

  return { templateId: cfg.templateId, sentCount, failedCount }
}

/** InApp delivery: no per-user InApp store exists — log as scheduled */
async function executeInAppNode(
  cfg: InAppNodeConfig,
  _userId: string
): Promise<Record<string, unknown>> {
  // The InAppMessage model is segment-based, not per-user.
  // Journey in-app delivery would require a dedicated per-user notification table.
  // For now we log the intent so it can be tracked in analytics.
  return { templateId: cfg.templateId, note: 'in-app scheduled (segment-based delivery)' }
}

/** Grant wallet credit or coupon incentive to a participant */
async function executeIncentiveNode(
  cfg: IncentiveNodeConfig,
  userId: string
): Promise<Record<string, unknown>> {
  if (cfg.incentiveType === 'wallet_credit') {
    const amount = cfg.walletAmount ?? 0
    if (amount <= 0) return { skipped: 'wallet amount is 0' }

    await prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId, balance: 0 } })
      }
      const balanceBefore = Number(wallet.balance)
      const balanceAfter = balanceBefore + amount
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: balanceAfter } })
      await tx.walletTransaction.create({
        data: {
          userId,
          type: 'ADJUSTMENT',
          amount,
          balanceBefore,
          balanceAfter,
          description: cfg.walletNote ?? 'Journey Incentive',
        },
      })
    })

    return { incentiveType: 'wallet_credit', amount }
  }

  if (cfg.incentiveType === 'coupon' && cfg.couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: cfg.couponId },
      select: { code: true, name: true, type: true, discountValue: true },
    })
    if (!coupon) return { skipped: 'coupon not found' }

    // Grant is logged in stepDetails; coupon code delivered to user.
    // A production implementation would persist to a journey-grants table
    // and optionally notify the user via email with the code.
    return {
      incentiveType: 'coupon',
      couponCode: coupon.code,
      couponName: coupon.name,
      couponType: coupon.type,
    }
  }

  return { skipped: 'unknown incentive type' }
}

// ─── Enrollment helpers (run at start of each cron cycle) ────────────────────

/**
 * Enrolls all users who currently match a SEGMENT_ENTRY journey's segment.
 * Re-entry policy is respected (NEVER / ALWAYS / AFTER_DAYS:X).
 */
async function runSegmentEntryEnrollment(now: Date): Promise<number> {
  let enrolled = 0

  const journeys = await prisma.journey.findMany({
    where: { status: 'ACTIVE', triggerType: 'SEGMENT_ENTRY' },
    select: {
      id: true,
      organizationId: true,
      triggerConfig: true,
      reEntryPolicy: true,
      endDate: true,
      content: true,
    },
  })

  if (journeys.length === 0) return 0

  // Group by organizationId — load audience data once per org
  const byOrg = new Map<string, typeof journeys>()
  for (const j of journeys) {
    const list = byOrg.get(j.organizationId) ?? []
    list.push(j)
    byOrg.set(j.organizationId, list)
  }

  for (const [orgId, orgJourneys] of Array.from(byOrg.entries())) {
    const audienceData = await loadAudienceData(orgId, null)
    if (audienceData.length === 0) continue

    for (const journey of orgJourneys) {
      try {
        if (journey.endDate && new Date(journey.endDate) < now) continue

        const cfg = journey.triggerConfig as { segmentId?: string } | null
        if (!cfg?.segmentId) continue

        const segment = await prisma.customerSegment.findUnique({
          where: { id: cfg.segmentId },
          select: { rules: true, rulesCombination: true },
        })
        if (!segment) continue

        const matchingUserIds = computeSegmentAudienceIds(
          audienceData,
          segment.rules,
          (segment.rulesCombination as RulesCombination) ?? 'AND'
        )

        const content = journey.content as unknown as CanvasContent
        const startNode = content?.nodes?.find((n) => n.type === 'start')

        for (const userId of matchingUserIds) {
          const existing = await prisma.journeyParticipant.findFirst({
            where: { journeyId: journey.id, userId },
            orderBy: { enteredAt: 'desc' },
          })

          if (existing) {
            const policy = journey.reEntryPolicy ?? 'NEVER'
            if (policy === 'NEVER') continue
            if (policy === 'ALWAYS') {
              await prisma.journeyParticipant.update({
                where: { id: existing.id },
                data: { status: 'EXITED', exitedAt: now },
              })
            } else if (policy.startsWith('AFTER_DAYS:')) {
              const days = parseInt(policy.split(':')[1] ?? '0')
              const sinceEntry =
                (now.getTime() - new Date(existing.enteredAt).getTime()) / (1000 * 60 * 60 * 24)
              if (sinceEntry < days) continue
              await prisma.journeyParticipant.update({
                where: { id: existing.id },
                data: { status: 'EXITED', exitedAt: now },
              })
            } else {
              continue
            }
          }

          await prisma.journeyParticipant.create({
            data: {
              journeyId: journey.id,
              userId,
              status: 'ACTIVE',
              currentNodeId: startNode?.id ?? null,
              nextStepAt: now,
            },
          })

          await prisma.journeyLog.create({
            data: {
              journeyId: journey.id,
              eventType: 'ENTERED',
              status: 'SUCCESS',
              details: { trigger: 'SEGMENT_ENTRY', segmentId: cfg.segmentId, userId } as never,
            },
          })

          enrolled++
        }
      } catch (err) {
        console.error(`Segment enrollment error for journey ${journey.id}:`, err)
      }
    }
  }

  return enrolled
}

/**
 * Enrolls inactive users (activityStatus = 'INAKTIV') into user.inactive EVENT journeys.
 */
async function runInactiveUserEnrollment(now: Date): Promise<number> {
  let enrolled = 0

  const journeys = await prisma.journey.findMany({
    where: { status: 'ACTIVE', triggerType: 'EVENT' },
    select: {
      id: true,
      organizationId: true,
      triggerConfig: true,
      reEntryPolicy: true,
      endDate: true,
      content: true,
    },
  })

  const inactiveJourneys = journeys.filter((j) => {
    const cfg = j.triggerConfig as { eventType?: string } | null
    return cfg?.eventType === 'user.inactive'
  })

  if (inactiveJourneys.length === 0) return 0

  for (const journey of inactiveJourneys) {
    try {
      if (journey.endDate && new Date(journey.endDate) < now) continue

      const inactiveMetrics = await prisma.customerMetrics.findMany({
        where: {
          activityStatus: { in: ['SCHLAFEND', 'ABGEWANDERT'] },
          user: { organizationId: journey.organizationId },
        },
        select: { userId: true },
      })

      const content = journey.content as CanvasContent
      const startNode = content?.nodes?.find((n) => n.type === 'start')

      for (const { userId } of inactiveMetrics) {
        const existing = await prisma.journeyParticipant.findFirst({
          where: { journeyId: journey.id, userId },
          orderBy: { enteredAt: 'desc' },
        })

        if (existing) {
          const policy = journey.reEntryPolicy ?? 'NEVER'
          if (policy === 'NEVER') continue
          if (policy === 'ALWAYS') {
            await prisma.journeyParticipant.update({
              where: { id: existing.id },
              data: { status: 'EXITED', exitedAt: now },
            })
          } else if (policy.startsWith('AFTER_DAYS:')) {
            const days = parseInt(policy.split(':')[1] ?? '0')
            const sinceEntry =
              (now.getTime() - new Date(existing.enteredAt).getTime()) / (1000 * 60 * 60 * 24)
            if (sinceEntry < days) continue
            await prisma.journeyParticipant.update({
              where: { id: existing.id },
              data: { status: 'EXITED', exitedAt: now },
            })
          } else {
            continue
          }
        }

        await prisma.journeyParticipant.create({
          data: {
            journeyId: journey.id,
            userId,
            status: 'ACTIVE',
            currentNodeId: startNode?.id ?? null,
            nextStepAt: now,
          },
        })

        await prisma.journeyLog.create({
          data: {
            journeyId: journey.id,
            eventType: 'ENTERED',
            status: 'SUCCESS',
            details: { trigger: 'user.inactive', userId } as never,
          },
        })

        enrolled++
      }
    } catch (err) {
      console.error(`Inactive enrollment error for journey ${journey.id}:`, err)
    }
  }

  return enrolled
}

/** Accepts either a valid admin session OR a CRON_SECRET bearer token.
 *  This allows both manual triggers from the browser and automated cron calls. */
async function authorizeCronOrAdmin(request: NextRequest): Promise<NextResponse | null> {
  // Option 1: CRON_SECRET header — used by Vercel Cron and any external scheduler
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${cronSecret}`) {
      return null // authorized
    }
  }

  // Option 2: Admin browser session
  const { error } = await requireAdminRole()
  return error ?? null
}

export async function POST(request: NextRequest) {
  const authError = await authorizeCronOrAdmin(request)
  if (authError) return authError

  const now = new Date()
  const BATCH_SIZE = 500
  let processed = 0
  let errors = 0

  let enrolled = 0

  try {
    // 0. Enrollment phase: pull new users into journeys before processing steps
    const [segmentEnrolled, inactiveEnrolled] = await Promise.all([
      runSegmentEntryEnrollment(now),
      runInactiveUserEnrollment(now),
    ])
    enrolled = segmentEnrolled + inactiveEnrolled

    // 1. Find all due participants in active journeys
    const dueParticipants = await prisma.journeyParticipant.findMany({
      where: {
        status: 'ACTIVE',
        nextStepAt: { lte: now },
        journey: { status: 'ACTIVE' },
      },
      take: BATCH_SIZE,
      orderBy: { nextStepAt: 'asc' },
      include: {
        journey: true,
      },
    })

    for (const participant of dueParticipants) {
      try {
        const content = participant.journey.content as unknown as CanvasContent
        const { nodes, edges } = content

        if (!nodes || !edges) continue

        // Process all consecutive immediate (non-delay) nodes in one run.
        // Only stop when we hit a delay node, end node, null, or a safety limit.
        const MAX_STEPS_PER_RUN = 20
        let currentNodeId = participant.currentNodeId
        let stepsThisRun = 0
        let participantDone = false

        while (stepsThisRun < MAX_STEPS_PER_RUN) {
          const currentNode = currentNodeId
            ? nodes.find((n) => n.id === currentNodeId)
            : nodes.find((n) => n.type === 'start')

          if (!currentNode) {
            await prisma.journeyParticipant.update({
              where: { id: participant.id },
              data: { status: 'COMPLETED', nextStepAt: null },
            })
            participantDone = true
            break
          }

          let nextNode: CanvasNode | null = null
          let stepStatus = 'SUCCESS'
          let stepDetails: Record<string, unknown> = {}

          if (currentNode.type === 'start') {
            nextNode = getNextNode(currentNode.id, 'output', edges, nodes)
            stepDetails = { nodeType: 'start', label: 'Journey gestartet' }
          } else if (currentNode.type === 'delay') {
            // Delay has elapsed — advance past it
            nextNode = getNextNode(currentNode.id, 'output', edges, nodes)
            const delayCfg = currentNode.config as { amount?: number; unit?: string } | undefined
            const delayAmt = delayCfg?.amount ?? 1
            const delayUnit =
              delayCfg?.unit === 'minutes' ? 'Min.' : delayCfg?.unit === 'hours' ? 'Std.' : 'Tag(e)'
            stepDetails = { nodeType: 'delay', label: `Wartezeit abgelaufen (${delayAmt} ${delayUnit})` }
          } else if (currentNode.type === 'branch') {
            const cfg = currentNode.config ?? {}
            const result = await evaluateBranchCondition(cfg, participant.userId, participant.journey.organizationId)
            const handle = result ? 'yes' : 'no'
            nextNode = getNextNode(currentNode.id, handle, edges, nodes)
            stepDetails = {
              nodeType: 'branch',
              label: `Bedingung: ${result ? 'Ja-Pfad' : 'Nein-Pfad'}`,
              conditionResult: result,
            }
          } else if (currentNode.type === 'email') {
            const cfg = (currentNode.config ?? {}) as unknown as EmailNodeConfig
            try {
              const emailResult = await executeEmailNode(cfg, participant.userId, participant.id)
              stepDetails = {
                nodeType: 'email',
                label: emailResult.skipped
                  ? `E-Mail übersprungen: ${emailResult.skipped}`
                  : `E-Mail gesendet an ${emailResult.to}`,
                ...emailResult,
              }
            } catch (err) {
              stepStatus = 'FAILED'
              stepDetails = { nodeType: 'email', label: 'E-Mail fehlgeschlagen', error: String(err) }
              throw err
            }
            nextNode = getNextNode(currentNode.id, 'output', edges, nodes)
          } else if (currentNode.type === 'push') {
            const cfg = (currentNode.config ?? {}) as unknown as PushNodeConfig
            try {
              const pushResult = await executePushNode(cfg, participant.userId)
              const sentCount = (pushResult.sentCount as number) ?? 0
              stepDetails = {
                nodeType: 'push',
                label: pushResult.skipped
                  ? `Push übersprungen: ${pushResult.skipped}`
                  : `Push gesendet (${sentCount} Gerät${sentCount !== 1 ? 'e' : ''})`,
                ...pushResult,
              }
            } catch (err) {
              stepStatus = 'FAILED'
              stepDetails = { nodeType: 'push', label: 'Push fehlgeschlagen', error: String(err) }
              throw err
            }
            nextNode = getNextNode(currentNode.id, 'output', edges, nodes)
          } else if (currentNode.type === 'inapp') {
            const cfg = (currentNode.config ?? {}) as unknown as InAppNodeConfig
            const inappResult = await executeInAppNode(cfg, participant.userId)
            stepDetails = { nodeType: 'inapp', label: 'In-App Nachricht geplant', ...inappResult }
            nextNode = getNextNode(currentNode.id, 'output', edges, nodes)
          } else if (currentNode.type === 'incentive') {
            const cfg = (currentNode.config ?? {}) as unknown as IncentiveNodeConfig
            try {
              const incentiveResult = await executeIncentiveNode(cfg, participant.userId)
              const incentiveLabel =
                incentiveResult.incentiveType === 'wallet_credit'
                  ? `Wallet-Guthaben vergeben: ${incentiveResult.amount} €`
                  : incentiveResult.incentiveType === 'coupon'
                    ? `Coupon vergeben: ${incentiveResult.couponCode}`
                    : 'Incentive vergeben'
              stepDetails = { nodeType: 'incentive', label: incentiveLabel, ...incentiveResult }
            } catch (err) {
              stepStatus = 'FAILED'
              stepDetails = { nodeType: 'incentive', label: 'Incentive fehlgeschlagen', error: String(err) }
              throw err
            }
            nextNode = getNextNode(currentNode.id, 'output', edges, nodes)
          } else if (currentNode.type === 'end') {
            nextNode = null
            stepDetails = { nodeType: 'end', label: 'Journey abgeschlossen' }
          }

          // Log this step
          await prisma.journeyLog.create({
            data: {
              journeyId: participant.journeyId,
              participantId: participant.id,
              nodeId: currentNode.id,
              eventType: 'STEP_EXECUTED',
              status: stepStatus,
              details: stepDetails as never,
            },
          })

          stepsThisRun++

          if (nextNode === null || nextNode.type === 'end') {
            // Journey completed
            await prisma.journeyParticipant.update({
              where: { id: participant.id },
              data: {
                status: 'COMPLETED',
                currentNodeId: nextNode?.id ?? currentNode.id,
                nextStepAt: null,
              },
            })
            participantDone = true
            break
          } else if (nextNode.type === 'delay') {
            // Park at the delay node and schedule the next run
            const cfg = nextNode.config as { amount?: number; unit?: string } | undefined
            const amount = cfg?.amount ?? 1
            const unit = cfg?.unit ?? 'days'
            const ms =
              unit === 'minutes'
                ? amount * 60 * 1000
                : unit === 'hours'
                  ? amount * 60 * 60 * 1000
                  : amount * 24 * 60 * 60 * 1000 // days
            const nextStepAt = new Date(now.getTime() + ms)

            await prisma.journeyParticipant.update({
              where: { id: participant.id },
              data: { currentNodeId: nextNode.id, nextStepAt },
            })
            participantDone = true
            break
          } else {
            // Immediate node — update position and continue the while loop
            await prisma.journeyParticipant.update({
              where: { id: participant.id },
              data: { currentNodeId: nextNode.id },
            })
            currentNodeId = nextNode.id
          }
        }

        if (!participantDone) {
          // Safety limit hit — park here for next cron run
          await prisma.journeyParticipant.update({
            where: { id: participant.id },
            data: { nextStepAt: now },
          })
        }

        processed++
      } catch (err) {
        console.error(`Journey execution error for participant ${participant.id}:`, err)
        await prisma.journeyLog.create({
          data: {
            journeyId: participant.journeyId,
            participantId: participant.id,
            nodeId: participant.currentNodeId ?? undefined,
            eventType: 'FAILED',
            status: 'FAILED',
            details: { error: String(err) } as never,
          },
        })
        await prisma.journeyParticipant.update({
          where: { id: participant.id },
          data: { status: 'FAILED' },
        })
        errors++
      }
    }

    // 2. Exit participants whose journey has expired
    await prisma.journeyParticipant.updateMany({
      where: {
        status: 'ACTIVE',
        journey: {
          status: 'ACTIVE',
          endDate: { lte: now },
        },
      },
      data: { status: 'EXITED', exitedAt: now },
    })

    return NextResponse.json({
      ok: true,
      enrolled,
      processed,
      errors,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Journey execute error:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
