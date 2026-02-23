'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'

type Status = 'loading' | 'success' | 'expired' | 'used' | 'error'

export default function EmailBestaetigenPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [newEmail, setNewEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setErrorMsg('Kein Token angegeben.')
      return
    }

    fetch(`/api/profil/email-bestaetigen?token=${encodeURIComponent(token)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, data: d })))
      .then(({ ok, status: httpStatus, data }) => {
        if (ok && data.success) {
          setNewEmail(data.newEmail || '')
          setStatus('success')
          // Auto-redirect to /profil after 3 seconds
          setTimeout(() => router.push('/profil?email_confirmed=1'), 3000)
        } else if (httpStatus === 410) {
          setStatus('expired')
        } else if (httpStatus === 404) {
          setStatus('used')
        } else {
          setStatus('error')
          setErrorMsg(data.error || 'Ein Fehler ist aufgetreten.')
        }
      })
      .catch(() => {
        setStatus('error')
        setErrorMsg('Verbindungsfehler.')
      })
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border/50 shadow-lg p-8 text-center space-y-5">

        {status === 'loading' && (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <h1 className="text-lg font-semibold text-foreground">E-Mail wird bestätigt…</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-foreground">E-Mail bestätigt!</h1>
              {newEmail && (
                <p className="text-sm text-muted-foreground">
                  Deine neue E-Mail-Adresse lautet: <strong>{newEmail}</strong>
                </p>
              )}
              <p className="text-sm text-muted-foreground">Du wirst in Kürze weitergeleitet…</p>
            </div>
            <Link href="/profil" className="block px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 rounded-xl">
              Zum Profil
            </Link>
          </>
        )}

        {status === 'expired' && (
          <>
            <XCircle className="w-12 h-12 text-orange-500 mx-auto" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-foreground">Link abgelaufen</h1>
              <p className="text-sm text-muted-foreground">
                Dieser Link ist abgelaufen. Bitte beantrage die E-Mail-Änderung erneut.
              </p>
            </div>
            <Link href="/profil" className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 rounded-xl">
              <Mail className="w-4 h-4" />
              Erneut beantragen
            </Link>
          </>
        )}

        {status === 'used' && (
          <>
            <XCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-foreground">Link bereits verwendet</h1>
              <p className="text-sm text-muted-foreground">
                Dieser Bestätigungslink wurde bereits verwendet.
              </p>
            </div>
            <Link href="/profil" className="block px-4 py-2.5 text-sm font-medium text-foreground bg-muted rounded-xl hover:bg-muted/80">
              Zum Profil
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-foreground">Fehler</h1>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <Link href="/profil" className="block px-4 py-2.5 text-sm font-medium text-foreground bg-muted rounded-xl hover:bg-muted/80">
              Zurück zum Profil
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
