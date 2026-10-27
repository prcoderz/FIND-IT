'use server'

import { and, count, eq, gte, lt, sql, desc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { items, user } from '@/lib/db/schema'

async function adminId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const [record] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (record?.role?.toUpperCase() !== 'ADMIN') throw new Error('Forbidden')
  return session.user.id
}

function rangeFor(filter: string) {
  const end = new Date()
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(end)
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const today = new Date(Date.UTC(get('year'), get('month') - 1, get('day'), -5, -30))
  const days = filter === 'yesterday' ? 1 : filter === '7d' ? 7 : filter === '30d' ? 30 : 0
  const start = new Date(today.getTime() - days * 86400000)
  return { start, end: days === 0 ? new Date(today.getTime() + 86400000) : end }
}

export async function getActivityStats(filter = 'today') {
  await adminId()
  const { start, end } = rangeFor(filter)
  const [lost, found, active, reunited] = await Promise.all([
    db.select({ value: count() }).from(items).where(and(eq(items.type, 'lost'), gte(items.createdAt, start), lt(items.createdAt, end), eq(items.status, 'active'))),
    db.select({ value: count() }).from(items).where(and(eq(items.type, 'found'), gte(items.createdAt, start), lt(items.createdAt, end), eq(items.status, 'active'))),
    db.select({ value: count() }).from(items).where(eq(items.status, 'active')),
    db.select({ value: count() }).from(items).where(and(eq(items.status, 'reunited'), gte(items.reunitedAt, start), lt(items.reunitedAt, end))),
  ])
  return { lost: Number(lost[0]?.value ?? 0), found: Number(found[0]?.value ?? 0), active: Number(active[0]?.value ?? 0), reunited: Number(reunited[0]?.value ?? 0) }
}

export async function refreshActivityStats() { revalidatePath('/admin'); return getActivityStats('today') }
