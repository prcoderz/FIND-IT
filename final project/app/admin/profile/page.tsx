import { redirect } from 'next/navigation'
import { ArrowLeft, CalendarDays, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { getAdminProfile } from '@/app/actions/admin'
import { AdminLogout } from '@/components/admin-logout'
import { ProfileImageUpload } from '@/components/profile-image-upload'

export default async function AdminProfilePage() {
  try {
    const profile = await getAdminProfile()
    return <main className="min-h-screen bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-3xl"><header className="mb-8 flex items-center justify-between gap-4"><div><a href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft size={16} /> Back to dashboard</a><p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Administrator profile</p><h1 className="mt-2 text-4xl font-bold tracking-[-0.06em]">Your profile</h1></div><AdminLogout /></header><section className="glass-panel p-6 sm:p-8"><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><ProfileImageUpload pathname={profile.image ?? null} name={profile.name} /><div><h2 className="text-2xl font-semibold">{profile.name}</h2><p className="mt-1 text-muted-foreground">{profile.email}</p><span className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary"><ShieldCheck size={14} /> Administrator</span></div></div><div className="mt-8 grid gap-3 sm:grid-cols-2"><Info icon={<UserRound size={17} />} label="Admin name" value={profile.name} /><Info icon={<Mail size={17} />} label="Admin email" value={profile.email} /><Info icon={<ShieldCheck size={17} />} label="Role" value="Administrator" /><Info icon={<CalendarDays size={17} />} label="Account created" value={profile.createdAt.toLocaleDateString()} /></div><div className="mt-8 border-t border-border pt-5"><button type="button" disabled className="rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted-foreground">Edit profile coming soon</button><p className="mt-2 text-xs text-muted-foreground">Role changes are managed by protected access controls, not from this profile.</p></div></section></div></main>
  } catch { redirect('/admin/login') }
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-2xl border border-border bg-background/40 p-4"><div className="flex items-center gap-2 text-primary">{icon}<span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span></div><p className="mt-2 font-medium">{value}</p></div> }
