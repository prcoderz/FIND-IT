'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const login = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const email = login === 'admin@123' ? 'admin-portal@findit.local' : login
    const result = await authClient.signIn.email({ email, password })
    if (result.error) {
      setError('Unable to verify admin access. Check your credentials or contact a portal administrator.')
      setBusy(false)
      return
    }
    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-12 text-foreground">
      <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <form onSubmit={submit} className="glass-panel relative w-full max-w-md p-7 sm:p-9">
        <a href="/" className="font-mono text-sm font-bold tracking-[-0.08em] text-primary">FIND/IT</a>
        <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"><ShieldCheck size={23} /></div>
        <p className="mt-7 font-mono text-xs uppercase tracking-[0.18em] text-primary">Restricted console</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.06em]">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Use an account with the admin role to access moderation tools.</p>
        <div className="mt-7 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">Email<input required name="email" type="text" autoComplete="username" inputMode="email" placeholder="admin@123" className="h-12 rounded-xl border border-border bg-background/60 px-4 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
          <label className="grid gap-2 text-sm font-medium">Password<div className="relative"><LockKeyhole size={16} className="absolute left-4 top-4 text-muted-foreground" /><input required name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="h-12 w-full rounded-xl border border-border bg-background/60 pl-11 pr-12 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition hover:bg-primary/10 hover:text-primary">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
          {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <button disabled={busy} className="h-12 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 disabled:opacity-60">{busy ? 'Verifying access…' : 'Enter dashboard'}</button>
        </div>
        <a href="/sign-in" className="mt-6 block text-center text-sm text-muted-foreground transition hover:text-primary">Return to member sign in</a>
      </form>
    </main>
  )
}
