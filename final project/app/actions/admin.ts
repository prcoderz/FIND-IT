'use server'

import { and, desc, eq, ilike, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { hashPassword } from 'better-auth/crypto'
import { db } from '@/lib/db'
import { account, claims, items, user } from '@/lib/db/schema'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1)
  if (account?.role?.toUpperCase() !== 'ADMIN') throw new Error('Forbidden')
  return session.user.id
}

export async function getAdminOverview(query = '') {
  await requireAdmin()
  const term = `%${query.trim()}%`
  const itemRows = await db.select({ id: items.id, title: items.title, type: items.type, category: items.category, location: items.location, status: items.status, createdAt: items.createdAt, ownerId: items.userId }).from(items).where(query.trim() ? or(ilike(items.title, term), ilike(items.category, term), ilike(items.location, term)) : undefined).orderBy(desc(items.createdAt)).limit(50)
  const claimRows = await db.select({ id: claims.id, itemId: claims.itemId, answer: claims.answer, status: claims.status, createdAt: claims.createdAt, claimantId: claims.userId }).from(claims).orderBy(desc(claims.createdAt)).limit(50)
  const userRows = await db.select({ id: user.id, name: user.name, email: user.email, role: user.role, image: user.image, createdAt: user.createdAt }).from(user).orderBy(desc(user.createdAt)).limit(50)
  return { items: itemRows, claims: claimRows, users: userRows }
}

export async function updateItemStatus(formData: FormData) { await requireAdmin(); const id = String(formData.get('id') || ''); const status = String(formData.get('status') || ''); if (!id || !['active', 'reunited', 'archived'].includes(status)) throw new Error('Invalid status'); await db.update(items).set({ status, reunitedAt: status === 'reunited' ? new Date() : null }).where(eq(items.id, id)); revalidatePath('/admin') }
export async function reviewClaim(formData: FormData) { await requireAdmin(); const id = String(formData.get('id') || ''); const status = String(formData.get('status') || ''); if (!id || !['pending', 'approved', 'rejected'].includes(status)) throw new Error('Invalid status'); await db.update(claims).set({ status }).where(eq(claims.id, id)); revalidatePath('/admin') }
export async function setUserRole(formData: FormData) { const adminId = await requireAdmin(); const id = String(formData.get('id') || ''); const normalizedRole = String(formData.get('role') || '').toUpperCase(); if (!id || !['USER', 'ADMIN'].includes(normalizedRole)) throw new Error('Invalid role'); if (id === adminId && normalizedRole !== 'ADMIN') throw new Error('Cannot remove your own admin access'); await db.update(user).set({ role: normalizedRole }).where(eq(user.id, id)); revalidatePath('/admin'); revalidatePath('/admin/users') }
export async function getAdminAccess() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return { authenticated: false, admin: false }; const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id)).limit(1); return { authenticated: true, admin: account?.role?.toUpperCase() === 'ADMIN' } }
export async function getAdminCounts() { await requireAdmin(); const [allItems, openClaims, people] = await Promise.all([db.select({ id: items.id }).from(items).limit(1000), db.select({ id: claims.id }).from(claims).where(eq(claims.status, 'pending')).limit(1000), db.select({ id: user.id }).from(user).limit(1000)]); return { items: allItems.length, openClaims: openClaims.length, users: people.length } }
export async function getAdminProfile() { const adminId = await requireAdmin(); const [profile] = await db.select({ id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt }).from(user).where(eq(user.id, adminId)).limit(1); if (!profile) throw new Error('Unauthorized'); return profile }
export async function getAdminUsers(query = '', role = '') { await requireAdmin(); const term = `%${query.trim()}%`; const conditions = []; if (query.trim()) conditions.push(or(ilike(user.name, term), ilike(user.email, term))); if (role) conditions.push(eq(user.role, role.toUpperCase())); return db.select({ id: user.id, name: user.name, email: user.email, image: user.image, role: user.role, createdAt: user.createdAt }).from(user).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(user.createdAt)).limit(100) }
export async function createAdminUser(formData: FormData) { await requireAdmin(); const name = String(formData.get('name') || '').trim(); const email = String(formData.get('email') || '').trim().toLowerCase(); const password = String(formData.get('password') || ''); const role = String(formData.get('role') || 'USER').toUpperCase(); const image = String(formData.get('image') || '').trim() || null; if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !['USER', 'ADMIN'].includes(role)) throw new Error('Invalid user details'); const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1); if (existing) throw new Error('Email already exists'); const id = crypto.randomUUID(); const now = new Date(); await db.insert(user).values({ id, name, email, image, role, emailVerified: false, createdAt: now, updatedAt: now }); await db.insert(account).values({ id: crypto.randomUUID(), accountId: id, providerId: 'credential', userId: id, password: await hashPassword(password), createdAt: now, updatedAt: now }); revalidatePath('/admin/users') }
export { requireAdmin }
