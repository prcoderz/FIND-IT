'use server'

import { db } from '@/lib/db'
import { items } from '@/lib/db/schema'
import { and, desc, eq, or, ilike } from 'drizzle-orm'

export async function getLostFoundItems() {
  return db.select({
    id: items.id,
    type: items.type,
    title: items.title,
    description: items.description,
    category: items.category,
    location: items.location,
    imageUrl: items.imageUrl,
    itemDate: items.itemDate,
    createdAt: items.createdAt,
    status: items.status,
  }).from(items).where(eq(items.status, 'active')).orderBy(desc(items.itemDate))
}

export async function getLostFoundItem(id: string) {
  const result = await db.select({
    id: items.id,
    type: items.type,
    title: items.title,
    description: items.description,
    category: items.category,
    location: items.location,
    imageUrl: items.imageUrl,
    itemDate: items.itemDate,
    createdAt: items.createdAt,
    status: items.status,
    verificationQuestion: items.verificationQuestion,
  }).from(items).where(and(eq(items.id, id), eq(items.status, 'active'))).limit(1)
  return result[0] ?? null
}

export async function searchLostFoundItems(query: string) {
  const normalized = query.trim()
  if (!normalized) return getLostFoundItems()
  return db.select({
    id: items.id,
    type: items.type,
    title: items.title,
    description: items.description,
    category: items.category,
    location: items.location,
    imageUrl: items.imageUrl,
    itemDate: items.itemDate,
    createdAt: items.createdAt,
    status: items.status,
  }).from(items).where(and(eq(items.status, 'active'), or(
    ilike(items.title, `%${normalized}%`),
    ilike(items.description, `%${normalized}%`),
    ilike(items.category, `%${normalized}%`),
    ilike(items.location, `%${normalized}%`),
  ))).orderBy(desc(items.itemDate))
}


export type LostFoundItem = Awaited<ReturnType<typeof getLostFoundItems>>[number]
export type LostFoundDetail = NonNullable<Awaited<ReturnType<typeof getLostFoundItem>>>
