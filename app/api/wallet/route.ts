import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { ensureWallet } from '@/lib/wallet'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const userId = (session.user as { id?: string }).id
    if (!userId) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 401 })
    }

    const wallet = await ensureWallet(userId)
    const balance = Number(wallet.balance)

    return NextResponse.json({
      balance,
      updatedAt: wallet.updatedAt,
      isLow: balance > 0 && balance < 5,
      isZero: balance === 0,
    })
  } catch (error) {
    console.error('Fehler beim Abrufen des Wallets:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
