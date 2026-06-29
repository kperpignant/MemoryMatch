'use server'

/**
 * Frame-level Charms (PRD §15): wave / charm / sticker / note on a specific
 * reel frame. Block-aware in both directions, rate-limited.
 *
 * Two product caps on top of the per-minute limiter:
 *  - at most MAX_CHARMS_PER_DAY charms sent in a rolling 24h window, and
 *  - only one *outstanding* charm per recipient: you can't charm the same
 *    person again until they've charmed you back or you've matched.
 */
import { and, count, eq, gte, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

/** Charms a user may send within any rolling 24h window. */
const MAX_CHARMS_PER_DAY = 10

const reactionInput = z.object({
  reelFrameId: z.string().uuid(),
  reactionType: z.enum(['wave', 'charm', 'sticker', 'note']),
  message: z.string().trim().max(200).optional(),
})

export async function sendReaction(input: z.infer<typeof reactionInput>) {
  const data = reactionInput.parse(input)
  const me = await requireUser()

  const { ok } = await rateLimit(me.id, 'reaction')
  if (!ok) throw new Error('Slow down a little — try again in a minute')

  const dbc = db()

  // Resolve the frame's owner to enforce the block rule.
  const [frame] = await dbc
    .select({ ownerId: schema.memoryReels.userId })
    .from(schema.reelFrames)
    .innerJoin(schema.memoryReels, eq(schema.reelFrames.reelId, schema.memoryReels.id))
    .where(eq(schema.reelFrames.id, data.reelFrameId))
    .limit(1)
  if (!frame) throw new Error('Frame not found')
  if (frame.ownerId === me.id) throw new Error('Cannot react to your own reel')

  const blocked = await dbc
    .select({ id: schema.blocks.id })
    .from(schema.blocks)
    .where(
      or(
        and(
          eq(schema.blocks.blockerUserId, me.id),
          eq(schema.blocks.blockedUserId, frame.ownerId),
        ),
        and(
          eq(schema.blocks.blockerUserId, frame.ownerId),
          eq(schema.blocks.blockedUserId, me.id),
        ),
      ),
    )
    .limit(1)
  if (blocked.length > 0) throw new Error('Unavailable')

  // Daily cap — at most MAX_CHARMS_PER_DAY in the last 24 hours.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const [sentToday] = await dbc
    .select({ value: count() })
    .from(schema.reelReactions)
    .where(
      and(
        eq(schema.reelReactions.reactorUserId, me.id),
        gte(schema.reelReactions.createdAt, since),
      ),
    )
  if ((sentToday?.value ?? 0) >= MAX_CHARMS_PER_DAY) {
    throw new Error(`You've used all ${MAX_CHARMS_PER_DAY} of your charms for today — back tomorrow!`)
  }

  // One outstanding charm per person: block a repeat charm to the same owner
  // unless they've charmed me back or we're already matched.
  const [priorCharm] = await dbc
    .select({ id: schema.reelReactions.id })
    .from(schema.reelReactions)
    .innerJoin(schema.reelFrames, eq(schema.reelReactions.reelFrameId, schema.reelFrames.id))
    .innerJoin(schema.memoryReels, eq(schema.reelFrames.reelId, schema.memoryReels.id))
    .where(
      and(
        eq(schema.reelReactions.reactorUserId, me.id),
        eq(schema.memoryReels.userId, frame.ownerId),
      ),
    )
    .limit(1)
  if (priorCharm) {
    const [theyCharmedMe] = await dbc
      .select({ id: schema.reelReactions.id })
      .from(schema.reelReactions)
      .innerJoin(schema.reelFrames, eq(schema.reelReactions.reelFrameId, schema.reelFrames.id))
      .innerJoin(schema.memoryReels, eq(schema.reelFrames.reelId, schema.memoryReels.id))
      .where(
        and(
          eq(schema.reelReactions.reactorUserId, frame.ownerId),
          eq(schema.memoryReels.userId, me.id),
        ),
      )
      .limit(1)

    const [lo, hi] = [me.id, frame.ownerId].sort()
    const [matched] = await dbc
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(
        and(
          eq(schema.matches.status, 'active'),
          eq(schema.matches.userAId, lo),
          eq(schema.matches.userBId, hi),
        ),
      )
      .limit(1)

    if (!theyCharmedMe && !matched) {
      throw new Error("You've already charmed them — wait to hear back before sending another.")
    }
  }

  await dbc.insert(schema.reelReactions).values({
    reactorUserId: me.id,
    reelFrameId: data.reelFrameId,
    reactionType: data.reactionType,
    message: data.reactionType === 'note' ? data.message : data.message?.slice(0, 200),
  })

  return { ok: true }
}
