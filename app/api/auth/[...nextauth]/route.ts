import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { NextResponse } from 'next/server'

const handler = NextAuth(authOptions)

async function wrappedHandler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    return await handler(req, context)
  } catch (error) {
    console.error('[NextAuth] Server error:', error)
    const message =
      process.env.NEXTAUTH_SECRET
        ? 'Ein Serverfehler ist aufgetreten.'
        : 'NEXTAUTH_SECRET fehlt in .env. Bitte setzen (z.B. mit: openssl rand -base64 32).'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

export { wrappedHandler as GET, wrappedHandler as POST }
