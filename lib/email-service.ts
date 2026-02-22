/**
 * PROJ-9: E-Mail-Service (Resend)
 * Wrapper für den E-Mail-Versand via Resend API.
 * Fallback: Wirft einen klaren Fehler wenn RESEND_API_KEY fehlt.
 */

import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY ist nicht konfiguriert.')
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? 'noreply@example.com'
}

export function getDefaultSenderName(): string {
  return process.env.EMAIL_FROM_NAME ?? 'Kantine Platform'
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string       // vollständig: "Name <email>"
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/** Einzelne E-Mail senden via Resend. */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const resend = getResend()
    const from = opts.from ?? `${getDefaultSenderName()} <${getEmailFrom()}>`

    const { data, error } = await resend.emails.send({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, messageId: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return { success: false, error: message }
  }
}

/** Prüft ob E-Mail-Versand konfiguriert ist. */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}
