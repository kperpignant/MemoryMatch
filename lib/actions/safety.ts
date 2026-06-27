'use server'

/**
 * Trust & Safety mutations (PRD §15, §32): block, unblock, report.
 * All server-enforced — identity comes from the session, never the client.
 */
import { and, eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

const blockInput = z.object({ userId: z.string().uuid() })

export async function blockUser(input: z.infer<typeof blockInput>) {
  const { userId } = blockInput.parse(input)
  const me = await requireUser()
  if (userId === me.id) throw new Error('Cannot block yourself')

  const { ok } = await rateLimit(me.id, 'block')
  if (!ok) throw new Error('Too many requests')

  const dbc = db()
  await dbc
    .insert(schema.blocks)
    .values({ blockerUserId: me.id, blockedUserId: userId })
    .onConflictDoNothing()

  // A block closes any existing match between the pair (PRD §15)
  const [lo, hi] = [me.id, userId].sort()
  await dbc
    .update(schema.matches)
    .set({ status: 'closed' })
    .where(and(eq(schema.matches.userAId, lo), eq(schema.matches.userBId, hi)))

  await audit(me.id, 'block', 'user', userId)
  return { ok: true }
}

export async function unblockUser(input: z.infer<typeof blockInput>) {
  const { userId } = blockInput.parse(input)
  const me = await requireUser()

  await db()
    .delete(schema.blocks)
    .where(
      and(eq(schema.blocks.blockerUserId, me.id), eq(schema.blocks.blockedUserId, userId)),
    )

  await audit(me.id, 'unblock', 'user', userId)
  return { ok: true }
}

const reportInput = z.object({
  reportedUserId: z.string().uuid().optional(),
  reportedReelFrameId: z.string().uuid().optional(),
  reportedReactionId: z.string().uuid().optional(),
  reason: z.enum(['harassment', 'inappropriate', 'spam', 'impersonation', 'safety', 'other']),
  details: z.string().max(1000).optional(),
})

export async function reportContent(input: z.infer<typeof reportInput>) {
  const data = reportInput.parse(input)
  if (!data.reportedUserId && !data.reportedReelFrameId && !data.reportedReactionId) {
    throw new Error('Report must reference a user, frame, or reaction')
  }
  const me = await requireUser()

  const { ok } = await rateLimit(me.id, 'report')
  if (!ok) throw new Error('Too many requests')

  await db().insert(schema.reports).values({ reporterUserId: me.id, ...data })
  await audit(me.id, 'report', 'user', data.reportedUserId ?? null)
  return { ok: true }
}

/** Account deletion (PRD §15): cascade wipe + status flag; Clerk deletion is triggered client-side. */
export async function deleteAccount() {
  const me = await requireUser()
  const dbc = db()
  await audit(me.id, 'account_delete', 'user', me.id)
  // Soft-flag first (so browse hides immediately), then cascade-purge.
  await dbc
    .update(schema.users)
    .set({ status: 'deleted', deletedAt: new Date() })
    .where(eq(schema.users.id, me.id))
  await dbc.delete(schema.profiles).where(eq(schema.profiles.userId, me.id))
  await dbc
    .delete(schema.likes)
    .where(or(eq(schema.likes.likerUserId, me.id), eq(schema.likes.likedUserId, me.id)))
  await dbc.delete(schema.messages).where(eq(schema.messages.senderUserId, me.id))
  return { ok: true }
}

async function audit(actorUserId: string, action: string, targetType: string, targetId: string | null) {
  await db()
    .insert(schema.auditEvents)
    .values({ actorUserId, action, targetType, targetId: targetId ?? undefined })
}
