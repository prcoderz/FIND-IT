import { redirect } from 'next/navigation'
import { ArrowLeft, Megaphone } from 'lucide-react'
import { getAdminAccess } from '@/app/actions/admin'
import { listAnnouncements } from '@/app/actions/announcements'
import { AnnouncementManager } from '@/components/announcement-manager'

export default async function AnnouncementsPage() { const access = await getAdminAccess(); if (!access.authenticated) redirect('/admin/login'); if (!access.admin) redirect('/'); const announcements = await listAnnouncements(); return <main className="min-h-screen bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-7xl"><header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><a href="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Admin dashboard</a><h1 className="mt-4 flex items-center gap-3 text-4xl font-bold tracking-[-0.06em]"><Megaphone className="text-primary" /> Announcements</h1><p className="mt-2 text-sm text-muted-foreground">Send timely updates to the FindIt community.</p></div></header><AnnouncementManager announcements={announcements} /></div></main> }
