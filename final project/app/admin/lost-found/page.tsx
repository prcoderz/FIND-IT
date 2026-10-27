import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getAdminAccess } from '@/app/actions/admin'
import { getAdminItems } from '@/app/actions/admin-items'
import AdminItemManager from '@/components/admin-item-manager'

export default async function AdminLostFoundPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; category?: string; status?: string; sort?: string }> }) {
  const access = await getAdminAccess()
  if (!access.authenticated) redirect('/admin/login')
  if (!access.admin) redirect('/')
  const params = await searchParams
  const items = await getAdminItems(params)
  return <main className="min-h-screen px-4 py-6 sm:px-8 lg:px-12"><div className="mx-auto max-w-[1500px]"><div className="mb-6 flex items-center justify-between"><Link href="/admin" className="text-sm font-semibold text-muted-foreground hover:text-foreground">← Back to dashboard</Link><Link href="/" className="font-mono text-lg font-bold tracking-[-.08em]">FIND<span className="text-primary">/</span>IT</Link></div><AdminItemManager initialItems={items} /></div></main>
}
