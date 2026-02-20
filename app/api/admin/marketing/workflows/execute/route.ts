export const dynamic = 'force-dynamic'

/**
 * POST: Workflows ausführen (für Cron/Manuelle Auslösung).
 * Führt alle aktiven Workflows mit SCHEDULED-Trigger aus.
 * Bei actionType GRANT_INCENTIVE: incentiveId aus actionConfig verwenden.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-helpers'
import { prisma } from '@/lib/prisma'
import { grantIncentiveToSegment } from '@/lib/incentive-grant'

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAdminContext()
    if (ctx.error) return ctx.error
    if (!ctx.organizationId) {
      return NextResponse.json({ error: 'Keine Organisation zugeordnet' }, { status: 403 })
    }

    const workflows = await prisma.marketingWorkflow.findMany({
      where: {
        organizationId: ctx.organizationId,
        isActive: true,
        triggerType: 'SCHEDULED',
      },
    })

    const results: { workflowId: string; status: string; message?: string }[] = []

    for (const wf of workflows) {
      try {
        if (wf.actionType === 'GRANT_INCENTIVE') {
          const config = (wf.actionConfig as { incentiveId?: string }) ?? {}
          const incentiveId = config.incentiveId
          if (!incentiveId) {
            results.push({ workflowId: wf.id, status: 'FAILED', message: 'Kein incentiveId in actionConfig' })
            continue
          }

          const { granted, skipped, errors } = await grantIncentiveToSegment(incentiveId, {
            organizationId: ctx.organizationId,
            allowedLocationIds: ctx.allowedLocationIds,
          })

          await prisma.workflowExecutionLog.create({
            data: {
              workflowId: wf.id,
              status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
              message: `${granted} vergeben, ${skipped} übersprungen`,
              details: errors.length > 0 ? { errors } : undefined,
            },
          })
          results.push({
            workflowId: wf.id,
            status: 'SUCCESS',
            message: `${granted} Incentives vergeben`,
          })
        } else {
          results.push({
            workflowId: wf.id,
            status: 'SKIPPED',
            message: `Aktion ${wf.actionType} noch nicht implementiert`,
          })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        await prisma.workflowExecutionLog.create({
          data: {
            workflowId: wf.id,
            status: 'FAILED',
            message: msg,
          },
        })
        results.push({ workflowId: wf.id, status: 'FAILED', message: msg })
      }
    }

    return NextResponse.json({ executed: results.length, results })
  } catch (error) {
    console.error('Fehler bei Workflow-Ausführung:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
