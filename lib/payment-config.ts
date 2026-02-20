/**
 * PROJ-14: Payment-Provider-Konfiguration
 * AES-256-GCM Verschlüsselung + Provider-Laden aus DB
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { prisma } from '@/lib/prisma'

const ALGORITHM = 'aes-256-gcm'
const SALT = 'qatering-payment-config-salt-v1'

function getEncryptionKey(): Buffer {
  const secret = process.env.PAYMENT_CONFIG_SECRET
  if (!secret) throw new Error('PAYMENT_CONFIG_SECRET env variable is required')
  return scryptSync(secret, SALT, 32)
}

/** Encrypt plaintext string with AES-256-GCM. Returns base64-encoded "iv:authTag:ciphertext". */
export function encryptConfig(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

/** Decrypt AES-256-GCM encoded string. Returns plaintext. */
export function decryptConfig(encoded: string): string {
  const key = getEncryptionKey()
  const [ivB64, authTagB64, encryptedB64] = encoded.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted) + decipher.final('utf8')
}

/** Mask a key: shows last 4 chars, rest replaced with bullets */
export function maskKey(key: string): string {
  if (!key || key.length <= 4) return '••••'
  const prefix = key.substring(0, Math.min(8, key.length - 4))
  const visibleEnd = key.slice(-4)
  return `${prefix}••••••••••••${visibleEnd}`
}

export type PaymentProvider = 'stripe' | 'paypal' | 'sumup'

export interface StripeConfig {
  publishableKey: string
  secretKey: string
  webhookSecret: string
  enableCreditCard: boolean
  enableApplePay: boolean
  enableGooglePay: boolean
  enableSepa: boolean
}

export interface PayPalConfig {
  clientId: string
  clientSecret: string
  webhookId: string
  environment: 'sandbox' | 'live'
}

export interface SumUpConfig {
  apiKey: string
  merchantCode: string
  terminalId: string
}

export type ProviderConfig = StripeConfig | PayPalConfig | SumUpConfig

/** Load decrypted config for a specific provider (server-side only). */
export async function getProviderConfig<T = ProviderConfig>(
  organizationId: string,
  provider: PaymentProvider
): Promise<{ isEnabled: boolean; config: T } | null> {
  const record = await prisma.paymentProviderConfig.findUnique({
    where: { organizationId_provider: { organizationId, provider } },
  })
  if (!record) return null
  try {
    const config = JSON.parse(decryptConfig(record.configJson)) as T
    return { isEnabled: record.isEnabled, config }
  } catch {
    return null
  }
}

/** Get masked configs for all providers (for admin UI display). */
export async function getMaskedProviderConfigs(organizationId: string) {
  const records = await prisma.paymentProviderConfig.findMany({
    where: { organizationId },
    select: { provider: true, isEnabled: true, configJson: true, updatedAt: true, updatedById: true },
  })

  return records.map((r) => {
    let maskedConfig: Record<string, unknown> = {}
    try {
      const raw = JSON.parse(decryptConfig(r.configJson)) as Record<string, unknown>
      maskedConfig = Object.fromEntries(
        Object.entries(raw).map(([k, v]) => {
          if (typeof v === 'string' && v.length > 4) {
            return [k, maskKey(v)]
          }
          return [k, v]
        })
      )
    } catch {
      // encrypted but unreadable — return empty
    }
    return {
      provider: r.provider,
      isEnabled: r.isEnabled,
      config: maskedConfig,
      updatedAt: r.updatedAt,
      updatedById: r.updatedById,
    }
  })
}

/** Simple in-memory cache for active providers (60s TTL). */
let activeProvidersCache: { data: string[]; expiresAt: number } | null = null

export async function getActiveProviders(organizationId: string): Promise<string[]> {
  const now = Date.now()
  if (activeProvidersCache && activeProvidersCache.expiresAt > now) {
    return activeProvidersCache.data
  }

  const records = await prisma.paymentProviderConfig.findMany({
    where: { organizationId, isEnabled: true },
    select: { provider: true },
  })
  const providers = records.map((r) => r.provider)
  activeProvidersCache = { data: providers, expiresAt: now + 60_000 }
  return providers
}

export function invalidateActiveProvidersCache() {
  activeProvidersCache = null
}
