import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

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

    // Prüfen ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser Email existiert bereits' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const passwordHash = await hashPassword(validatedData.password)

    // User erstellen
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
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
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
