import { prisma } from '@/lib/prisma'
import { Prisma } from '@/src/generated/prisma'

const MIN_TOP_UP = 5
const MAX_TOP_UP = 200
const LOW_BALANCE_THRESHOLD = 5

export { MIN_TOP_UP, MAX_TOP_UP, LOW_BALANCE_THRESHOLD }

export type WalletTransactionType = 'TOP_UP' | 'ORDER_PAYMENT' | 'REFUND' | 'ADJUSTMENT'

/** Wallet für User anlegen, falls nicht vorhanden. Gibt Wallet zurück. */
export async function ensureWallet(userId: string) {
  let wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0 },
    })
  }
  return wallet
}

/** Guthaben aufladen (Admin oder Online-Payment). Betrag positiv. */
export async function topUp(
  userId: string,
  amount: number,
  options: {
    note?: string
    performedById?: string
    paymentProvider?: string
    externalPaymentId?: string
  }
) {
  if (amount < MIN_TOP_UP || amount > MAX_TOP_UP) {
    throw new Error(`Betrag muss zwischen ${MIN_TOP_UP} und ${MAX_TOP_UP} EUR liegen.`)
  }
  return prisma.$transaction(async (tx) => {
    const wallet = await ensureWalletTx(tx, userId)
    const balanceBefore = Number(wallet.balance)
    const balanceAfter = balanceBefore + amount
    const updated = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    })
    await tx.walletTransaction.create({
      data: {
        userId,
        type: 'TOP_UP',
        amount,
        balanceBefore,
        balanceAfter,
        description: options.note || `Aufladung`,
        performedById: options.performedById ?? undefined,
        paymentProvider: options.paymentProvider ?? undefined,
        externalPaymentId: options.externalPaymentId ?? undefined,
      },
    })
    return updated
  })
}

type TxClient = Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/** Belasten innerhalb einer bestehenden Transaktion (z. B. Order-Erstellung). */
export async function chargeWithinTx(
  tx: TxClient,
  userId: string,
  amount: number,
  options: { orderId: string; description: string }
): Promise<{ balanceBefore: number; balanceAfter: number }> {
  if (amount <= 0) throw new Error('Betrag muss positiv sein.')
  const wallet = await ensureWalletTx(tx, userId)
  const balanceBefore = Number(wallet.balance)
  if (balanceBefore < amount) {
    throw new Error(
      `Guthaben nicht ausreichend. Verfügbar: ${balanceBefore.toFixed(2)} €, Benötigt: ${amount.toFixed(2)} €`
    )
  }
  const balanceAfter = balanceBefore - amount
  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: balanceAfter },
  })
  await tx.walletTransaction.create({
    data: {
      userId,
      type: 'ORDER_PAYMENT',
      amount: -amount,
      balanceBefore,
      balanceAfter,
      description: options.description,
      orderId: options.orderId,
    },
  })
  return { balanceBefore, balanceAfter }
}

/** Für Bestellung belasten. amount = zu zahlender Betrag (positiv). */
export async function charge(
  userId: string,
  amount: number,
  options: { orderId: string; description: string }
) {
  if (amount <= 0) throw new Error('Betrag muss positiv sein.')
  return prisma.$transaction(async (tx) => chargeWithinTx(tx, userId, amount, options))
}

/** Erstatten (z. B. Stornierung). amount positiv. */
export async function refund(
  userId: string,
  amount: number,
  options: { orderId?: string; description: string; performedById?: string }
) {
  if (amount <= 0) throw new Error('Betrag muss positiv sein.')
  return prisma.$transaction(async (tx) => {
    const wallet = await ensureWalletTx(tx, userId)
    const balanceBefore = Number(wallet.balance)
    const balanceAfter = balanceBefore + amount
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    })
    await tx.walletTransaction.create({
      data: {
        userId,
        type: 'REFUND',
        amount,
        balanceBefore,
        balanceAfter,
        description: options.description,
        orderId: options.orderId ?? undefined,
        performedById: options.performedById ?? undefined,
      },
    })
    return { balanceBefore, balanceAfter }
  })
}

/** Admin-Anpassung: delta positiv = Guthaben hinzufügen, negativ = abziehen. */
export async function adjust(
  userId: string,
  delta: number,
  options: { reason: string; performedById: string }
) {
  if (delta === 0) throw new Error('Anpassung darf nicht 0 sein.')
  return prisma.$transaction(async (tx) => {
    const wallet = await ensureWalletTx(tx, userId)
    const balanceBefore = Number(wallet.balance)
    const balanceAfter = balanceBefore + delta
    if (balanceAfter < 0) {
      throw new Error(
        `Anpassung würde negatives Guthaben ergeben. Aktuell: ${balanceBefore.toFixed(2)} €, Delta: ${delta.toFixed(2)} €`
      )
    }
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    })
    await tx.walletTransaction.create({
      data: {
        userId,
        type: 'ADJUSTMENT',
        amount: delta,
        balanceBefore,
        balanceAfter,
        description: options.reason,
        performedById: options.performedById,
      },
    })
    return { balanceBefore, balanceAfter }
  })
}

async function ensureWalletTx(
  tx: Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  userId: string
) {
  let w = await tx.wallet.findUnique({ where: { userId } })
  if (!w) {
    w = await tx.wallet.create({ data: { userId, balance: 0 } })
  }
  return w
}
