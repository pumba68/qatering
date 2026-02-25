/**
 * PROJ-24: Journey Enrollment Helper
 *
 * enrollUserInJourneys   — Trägt einen Nutzer in alle passenden aktiven Journeys ein.
 *                          Berücksichtigt Re-Entry-Policy (NEVER / AFTER_DAYS:X / ALWAYS).
 *
 * checkAndConvertParticipants — Markiert alle aktiven Participants als CONVERTED,
 *                               deren Journey-Ziel (conversionGoal) gerade eingetreten ist.
 *
 * Beide Funktionen werden feuern-und-vergessen aufgerufen (fire-and-forget):
 * → Fehler werden geloggt, aber nicht nach oben weitergegeben.
 */

import { prisma } from '@/lib/prisma'

export type JourneyEventType =
  | 'user.registered'
  | 'order.first'
  | 'user.inactive'
  | 'wallet.below_threshold'

/**
 * Prüft alle aktiven EVENT-Journeys der Organisation auf den gegebenen Event-Typ
 * und trägt den Nutzer ein, sofern Re-Entry-Policy es erlaubt.
 */
export async function enrollUserInJourneys(
  userId: string,
  eventType: JourneyEventType,
  organizationId: string
): Promise<void> {
  try {
    // Alle aktiven EVENT-Journeys mit dem passenden Trigger laden
    const journeys = await prisma.journey.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
        triggerType: 'EVENT',
      },
      select: {
        id: true,
        reEntryPolicy: true,
        triggerConfig: true,
        content: true,
        endDate: true,
      },
    })

    const now = new Date()

    for (const journey of journeys) {
      try {
        const config = journey.triggerConfig as { eventType?: string } | null
        if (config?.eventType !== eventType) continue

        // Laufzeit-Check: Journey darf noch nicht abgelaufen sein
        if (journey.endDate && new Date(journey.endDate) < now) continue

        // Re-Entry-Policy prüfen
        const existing = await prisma.journeyParticipant.findFirst({
          where: { journeyId: journey.id, userId },
          orderBy: { enteredAt: 'desc' },
        })

        if (existing) {
          const policy = journey.reEntryPolicy ?? 'NEVER'

          if (policy === 'NEVER') continue

          if (policy === 'ALWAYS') {
            // Alten Eintrag als exited markieren, neuen anlegen
            await prisma.journeyParticipant.update({
              where: { id: existing.id },
              data: { status: 'EXITED', exitedAt: now },
            })
          } else if (policy.startsWith('AFTER_DAYS:')) {
            const days = parseInt(policy.split(':')[1] ?? '0')
            const sinceEntry = (now.getTime() - new Date(existing.enteredAt).getTime()) / (1000 * 60 * 60 * 24)
            if (sinceEntry < days) continue
            // Alten Eintrag schließen
            await prisma.journeyParticipant.update({
              where: { id: existing.id },
              data: { status: 'EXITED', exitedAt: now },
            })
          } else {
            continue
          }
        }

        // Start-Node finden
        const canvasContent = journey.content as { nodes?: { id: string; type: string }[] }
        const startNode = canvasContent?.nodes?.find((n) => n.type === 'start')

        // Participant anlegen
        await prisma.journeyParticipant.create({
          data: {
            journeyId: journey.id,
            userId,
            status: 'ACTIVE',
            currentNodeId: startNode?.id ?? null,
            nextStepAt: now, // Sofort fällig für den Execute-Job
          },
        })

        // Eintrittsevent loggen
        await prisma.journeyLog.create({
          data: {
            journeyId: journey.id,
            eventType: 'ENTERED',
            status: 'SUCCESS',
            details: { trigger: eventType, userId } as never,
          },
        })
      } catch (err) {
        console.error(`Journey enrollment error for journey ${journey.id}, user ${userId}:`, err)
      }
    }
  } catch (err) {
    console.error('enrollUserInJourneys error:', err)
  }
}

/**
 * Prüft alle ACTIVE Participants der Organisation, deren Journey ein conversionGoal
 * auf diesen Event-Typ gesetzt hat, und markiert sie als CONVERTED.
 */
export async function checkAndConvertParticipants(
  userId: string,
  eventType: string,
  organizationId: string
): Promise<void> {
  try {
    const participants = await prisma.journeyParticipant.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        journey: {
          organizationId,
          status: 'ACTIVE',
        },
      },
      include: {
        journey: { select: { id: true, conversionGoal: true } },
      },
    })

    const now = new Date()

    for (const participant of participants) {
      const goal = participant.journey.conversionGoal as { eventType?: string; windowDays?: number } | null
      if (!goal?.eventType) continue
      if (goal.eventType !== eventType) continue

      // Zeitfenster prüfen
      const windowDays = goal.windowDays ?? 90
      const enteredAt = new Date(participant.enteredAt)
      const daysSinceEntry = (now.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceEntry > windowDays) continue

      await prisma.journeyParticipant.update({
        where: { id: participant.id },
        data: { status: 'CONVERTED', convertedAt: now, nextStepAt: null },
      })

      await prisma.journeyLog.create({
        data: {
          journeyId: participant.journeyId,
          participantId: participant.id,
          eventType: 'CONVERTED',
          status: 'SUCCESS',
          details: { trigger: eventType } as never,
        },
      })
    }
  } catch (err) {
    console.error('checkAndConvertParticipants error:', err)
  }
}
