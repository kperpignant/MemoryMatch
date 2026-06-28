/**
 * Server-side identity (PRD §31): resolve the authenticated Clerk session to
 * our `users` row. Never trust client-supplied user ids — every mutation calls
 * this and uses the returned row's id.
 *
 * The Clerk webhook is the source of truth for user provisioning in production,
 * but it can lag behind the session (or be unconfigured in local dev). To avoid
 * racing it, we lazily create the row on first authenticated request, reusing
 * the same 18+ gate the webhook enforces.
 */
import { auth, clerkClient } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/lib/db'

function isAtLeast18(dobIso: string): boolean {
  const dob = new Date(dobIso)
  if (Number.isNaN(dob.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return dob <= cutoff
}

/**
 * Lightweight auth: confirm a Clerk session exists and return its id, WITHOUT
 * requiring a provisioned `users` row or the 18+ DOB gate.
 *
 * For onboarding-time utility endpoints (image upload, location lookup) that
 * run during the wizard's first step — before the profile, and therefore the
 * date of birth, has been persisted to Clerk. requireUser() would 401 these
 * because the DOB gate hasn't been satisfied yet. Profile creation itself still
 * goes through requireUser(), so the 18+ gate is enforced where it matters.
 */
export async function requireSession(): Promise<string> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')
  return clerkId
}

export async function requireUser() {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const dbc = db()

  const [existing] = await dbc
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.authProviderId, clerkId), eq(schema.users.status, 'active')))
    .limit(1)
  if (existing) return existing

  // Lazy provision — the webhook hasn't created this row yet (or isn't wired).
  const cc = await clerkClient()
  const clerkUser = await cc.users.getUser(clerkId)

  const dob = (clerkUser.unsafeMetadata?.date_of_birth as string | undefined) ?? null
  if (!dob || !isAtLeast18(dob)) {
    // DOB is captured during onboarding (writes unsafeMetadata.date_of_birth);
    // until that's set we can't activate an account (18+ gate).
    throw new Error('Unauthorized: 18+ date of birth required')
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null
  if (!email) throw new Error('Unauthorized: no email on account')

  const displayName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    email.split('@')[0]

  const [created] = await dbc
    .insert(schema.users)
    .values({
      authProviderId: clerkId,
      email,
      displayName,
      dateOfBirth: dob,
      status: 'active',
    })
    .onConflictDoNothing()
    .returning()
  if (created) return created

  // Lost a race (webhook or a parallel request inserted between our read+write).
  const [now] = await dbc
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.authProviderId, clerkId), eq(schema.users.status, 'active')))
    .limit(1)
  if (now) return now

  // The email already belongs to a prior identity for this person (e.g. the Clerk
  // account was recreated, yielding a new auth_provider_id). Verified emails are
  // unique per human, so re-link the existing account to the current Clerk id
  // instead of failing — this preserves their profile and data.
  const [relinked] = await dbc
    .update(schema.users)
    .set({ authProviderId: clerkId, status: 'active', updatedAt: new Date() })
    .where(eq(schema.users.email, email))
    .returning()
  if (relinked) return relinked

  throw new Error('Unauthorized: no active account')
}
