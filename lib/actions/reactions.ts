'use server'

/**
 * Frame-level Charms (PRD §15): wave / charm / sticker / note on a specific
 * reel frame. Block-aware in both directions, rate-limited.
 */
import { and, eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

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

  await dbc.insert(schema.reelReactions).values({
    reactorUserId: me.id,
    reelFrameId: data.reelFrameId,
    reactionType: data.reactionType,
    message: data.reactionType === 'note' ? data.message : data.message?.slice(0, 200),
  })

  return { ok: true }
}
