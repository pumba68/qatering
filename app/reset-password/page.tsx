'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react'

type Status = 'form' | 'loading' | 'success' | 'expired' | 'error'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<Status>('form')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!token) { setErrorMsg('Kein Token angegeben.'); return }
    if (password.length < 8) { setErrorMsg('Passwort muss mindestens 8 Zeichen lang sein.'); return }
    if (password !== confirm) { setErrorMsg('Passwörter stimmen nicht überein.'); return }

    setStatus('loading')
    try {
      const r = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const d = await r.json()

      if (r.ok && d.success) {
        setStatus('success')
      } else if (r.status === 410) {
        setStatus('expired')
      } else {
        setStatus('error')
        setErrorMsg(d.error || 'Ein Fehler ist aufgetreten.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Verbindungsfehler.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-purple-950/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border/50 shadow-lg p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Neues Passwort setzen</h1>
          <p className="text-sm text-muted-foreground">Wähle ein sicheres Passwort mit mindestens 8 Zeichen.</p>
        </div>

        {/* Form */}
        {(status === 'form' || status === 'loading') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="pw">Neues Passwort</label>
              <div className="relative">
                <input
                  id="pw"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mindestens 8 Zeichen"
                  minLength={8}
                  required
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label={showPw ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="confirm">Passwort bestätigen</label>
              <input
                id="confirm"
                type={showPw ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {errorMsg && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 rounded-xl disabled:opacity-50 transition-all"
            >
              {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Passwort speichern
            </button>
          </form>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Passwort geändert!</p>
              <p className="text-sm text-muted-foreground">Du kannst dich jetzt mit deinem neuen Passwort anmelden.</p>
            </div>
            <Link
              href="/login"
              className="block px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-purple-600 rounded-xl"
            >
              Zum Login
            </Link>
          </div>
        )}

        {/* Expired */}
        {status === 'expired' && (
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-orange-500 mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Link abgelaufen</p>
              <p className="text-sm text-muted-foreground">
                Dieser Link ist nicht mehr gültig. Bitte fordere über dein Profil einen neuen Link an.
              </p>
            </div>
            <Link href="/profil" className="block px-4 py-2.5 text-sm font-medium text-foreground bg-muted rounded-xl hover:bg-muted/80">
              Zum Profil
            </Link>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-red-500 mx-auto" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">Fehler</p>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
            </div>
            <button
              onClick={() => { setStatus('form'); setErrorMsg('') }}
              className="block w-full px-4 py-2.5 text-sm font-medium text-foreground bg-muted rounded-xl hover:bg-muted/80"
            >
              Erneut versuchen
            </button>
          </div>
        )}

        {/* No token */}
        {!token && status === 'form' && (
          <div className="text-center space-y-4">
            <XCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Kein gültiger Reset-Link. Bitte fordere über dein Profil einen neuen Link an.</p>
            <Link href="/profil" className="block px-4 py-2.5 text-sm font-medium text-foreground bg-muted rounded-xl">
              Zum Profil
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
