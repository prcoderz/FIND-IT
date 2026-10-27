'use server'

import { and, asc, desc, eq, ilike, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { claims, items, user } from '@/lib/db/schema'

const TYPES = ['lost', 'found'] as const
const CATEGORIES = ['Electronics', 'Wallet', 'ID Card', 'Bags', 'Keys', 'Stationery', 'Accessories', 'Clothing', 'Bottle', 'Other'] as const
const STATUSES = ['active', 'claimed', 'resolved', 'returned'] as const

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (account?.role?.toUpperCase() !== 'ADMIN') throw new Error('Forbidden')
  return session.user.id
}

function readItem(formData: FormData) {
  const type = String(formData.get('type') || '').toLowerCase()
  const category = String(formData.get('category') || '')
  const status = String(formData.get('status') || '').toLowerCase()
  const title = String(formData.get('title') || '').trim()
  const location = String(formData.get('location') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const itemDate = new Date(String(formData.get('itemDate') || ''))
  const imageUrl = String(formData.get('imageUrl') || '').trim() || null
  if (!title || !location || !description || Number.isNaN(itemDate.getTime())) throw new Error('Please complete all required fields')
  if (!TYPES.includes(type as never) || !CATEGORIES.includes(category as never) || !STATUSES.includes(status as never)) throw new Error('Invalid item details')
  return { type, category, status, title, location, description, itemDate, imageUrl }
}

export async function getAdminItems(filters: { query?: string; type?: string; category?: string; status?: string; sort?: string } = {}) {
  await requireAdmin()
  const query = filters.query?.trim()
  const conditions = []
  if (query) conditions.push(or(ilike(items.title, `%${query}%`), ilike(items.description, `%${query}%`), ilike(items.category, `%${query}%`), ilike(items.location, `%${query}%`)))
  if (filters.type && TYPES.includes(filters.type as never)) conditions.push(eq(items.type, filters.type))
  if (filters.category && CATEGORIES.includes(filters.category as never)) conditions.push(eq(items.category, filters.category))
  if (filters.status && STATUSES.includes(filters.status as never)) conditions.push(eq(items.status, filters.status))
  return db.select().from(items).where(conditions.length ? and(...conditions) : undefined).orderBy(filters.sort === 'oldest' ? asc(items.itemDate) : desc(items.itemDate))
}

export async function createAdminItem(formData: FormData) {
  const adminId = await requireAdmin()
  const item = readItem(formData)
  await db.insert(items).values({ id: crypto.randomUUID(), userId: adminId, ...item })
  revalidatePath('/admin/lost-found')
  revalidatePath('/lost-found')
}

export async function updateAdminItem(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing item')
  await db.update(items).set(readItem(formData)).where(eq(items.id, id))
  revalidatePath('/admin/lost-found')
  revalidatePath('/lost-found')
  revalidatePath(`/lost-found/${id}`)
}

export async function deleteAdminItem(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) throw new Error('Missing item')
  await db.delete(claims).where(eq(claims.itemId, id))
  await db.delete(items).where(eq(items.id, id))
  revalidatePath('/admin/lost-found')
  revalidatePath('/lost-found')
  revalidatePath(`/lost-found/${id}`)
}

