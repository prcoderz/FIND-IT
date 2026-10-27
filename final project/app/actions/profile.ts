'use server'

import { and, desc, eq, ne } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { claims, items, user } from '@/lib/db/schema'

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function updateProfile(formData: FormData) {
  try {
    const current = await requireUser()
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const image = String(formData.get('image') || '').trim() || null
    if (name.length < 2 || name.length > 80) return { ok: false, error: 'Enter a name between 2 and 80 characters.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Enter a valid email address.' }
    const [existing] = await db.select({ id: user.id }).from(user).where(and(eq(user.email, email), ne(user.id, current.id))).limit(1)
    if (existing) return { ok: false, error: 'That email is already in use.' }
    await db.update(user).set({ name, email, image, emailVerified: email === current.email ? current.emailVerified : false, updatedAt: new Date() }).where(eq(user.id, current.id))
    revalidatePath('/profile')
    return { ok: true }
  } catch { return { ok: false, error: 'Unable to update your profile.' } }
}

export async function getProfileData() {
  const currentUser = await requireUser()
  const [reports, userClaims] = await Promise.all([
    db.select({ id: items.id, title: items.title, type: items.type, location: items.location, status: items.status, createdAt: items.createdAt }).from(items).where(eq(items.userId, currentUser.id)).orderBy(desc(items.createdAt)).limit(50),
    db.select({ id: claims.id, itemId: claims.itemId, answer: claims.answer, status: claims.status, createdAt: claims.createdAt }).from(claims).where(eq(claims.userId, currentUser.id)).orderBy(desc(claims.createdAt)).limit(50),
  ])
  return { user: currentUser, reports, claims: userClaims }
}

export async function getProfileAccess() { const session = await auth.api.getSession({ headers: await headers() }); return session?.user ? { authenticated: true } : { authenticated: false } }
