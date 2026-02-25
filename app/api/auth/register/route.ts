import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'
import { enrollUserInJourneys } from '@/lib/journey-enroll'
import { emitUserEvent } from '@/lib/emit-user-event'

const registerSchema = z.object({
  email: z.string().email('Ungültige Email-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
  name: z.string().min(2, 'Name muss mindestens 2 Zeichen lang sein'),
  organizationId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    const email = validatedData.email.trim().toLowerCase()
    // Prüfen ob User bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser Email existiert bereits' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const passwordHash = await hashPassword(validatedData.password)

    // User erstellen (E-Mail normalisiert für konsistente Lookups)
    const user = await prisma.user.create({
      data: {
        email,
        name: validatedData.name,
        passwordHash,
        role: 'CUSTOMER',
        organizationId: validatedData.organizationId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    // PROJ-24: Journey-Enrollment (fire-and-forget)
    if (validatedData.organizationId) {
      void enrollUserInJourneys(user.id, 'user.registered', validatedData.organizationId)
    }

    // PROJ-25: Eventstream – Registrierung festhalten
    void emitUserEvent(user.id, 'account.registered', {
      title: 'Konto erstellt',
      description: `Registrierung als ${user.email}`,
    })

    return NextResponse.json(
      { message: 'Registrierung erfolgreich', user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Fehler bei Registrierung:', error)
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    const cause = error instanceof Error && error.cause ? String(error.cause) : null
    return NextResponse.json(
      {
        error: 'Interner Serverfehler',
        ...(process.env.NODE_ENV === 'development' && { details: message, cause }),
      },
      { status: 500 }
    )
  }
}
