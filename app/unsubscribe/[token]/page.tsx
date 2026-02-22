import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface Props {
  params: { token: string }
}

async function unsubscribeUser(token: string): Promise<'success' | 'not_found' | 'already'> {
  const log = await prisma.emailCampaignLog.findUnique({
    where: { trackingToken: token },
    include: { user: { select: { id: true, marketingEmailConsent: true } } },
  })

  if (!log || !log.userId) return 'not_found'
  if (!log.user?.marketingEmailConsent) return 'already'

  await prisma.user.update({
    where: { id: log.userId },
    data: { marketingEmailConsent: false },
  })

  return 'success'
}

export default async function UnsubscribePage({ params }: Props) {
  const result = await unsubscribeUser(params.token)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-4">
        {result === 'success' && (
          <>
            <div className="text-4xl">✅</div>
            <h1 className="text-xl font-semibold text-gray-900">Erfolgreich abgemeldet</h1>
            <p className="text-gray-600 text-sm">
              Sie haben sich erfolgreich vom Marketing-E-Mail-Versand abgemeldet.
              Sie erhalten keine weiteren Marketing-E-Mails.
            </p>
          </>
        )}
        {result === 'already' && (
          <>
            <div className="text-4xl">ℹ️</div>
            <h1 className="text-xl font-semibold text-gray-900">Bereits abgemeldet</h1>
            <p className="text-gray-600 text-sm">
              Sie waren bereits von Marketing-E-Mails abgemeldet.
            </p>
          </>
        )}
        {result === 'not_found' && (
          <>
            <div className="text-4xl">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900">Link ungültig</h1>
            <p className="text-gray-600 text-sm">
              Dieser Abmelde-Link ist ungültig oder abgelaufen.
              Bitte kontaktieren Sie uns direkt.
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block mt-4 text-sm text-blue-600 hover:underline"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  )
}
