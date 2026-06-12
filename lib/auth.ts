/**
 * Server-side identity (PRD §31): resolve the authenticated Clerk session to
 * our `users` row. Never trust client-supplied user ids — every mutation calls
 * this and uses the returned row's id.
 */
import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db'

export async function requireUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const [user] = await db()
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.authProviderId, clerkId), eq(schema.users.status, 'active')))
    .limit(1)

  if (!user) throw new Error('Unauthorized: no active account')
  return user
}
