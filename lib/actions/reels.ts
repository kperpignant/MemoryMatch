'use server'

/**
 * Memory Reel persistence (PRD §15): save/replace the user's single active
 * reel. Ownership is implicit — the reel written is always the session user's.
 * Frames reference seeded media URLs for now (real uploads are P1).
 */
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

const frameInput = z.object({
  /** Path under /public or an approved media URL (uploads are P1) */
  mediaUrl: z.string().min(1).max(500),
  caption: z.string().max(140).optional(),
  durationMs: z.number().int().min(1000).max(6000).default(2500),
})

const saveReelInput = z.object({
  beatId: z.string().uuid().nullable().optional(),
  /** Start offset (seconds) of the chosen beat snippet. */
  beatStartSec: z.number().int().min(0).max(600).default(0),
  frames: z.array(frameInput).min(1).max(12),
})

export async function saveReel(input: z.infer<typeof saveReelInput>) {
  const data = saveReelInput.parse(input)
  const me = await requireUser()

  const { ok } = await rateLimit(me.id, 'reel_save')
  if (!ok) throw new Error('Too many requests — try again in a minute')

  const dbc = db()

  // One active reel per user (PRD §15) — reuse it or create it.
  let [reel] = await dbc
    .select({ id: schema.memoryReels.id })
    .from(schema.memoryReels)
    .where(eq(schema.memoryReels.userId, me.id))
    .limit(1)
  if (!reel) {
    ;[reel] = await dbc
      .insert(schema.memoryReels)
      .values({ userId: me.id, isActive: true })
      .returning({ id: schema.memoryReels.id })
  }

  await dbc
    .update(schema.memoryReels)
    .set({
      beatId: data.beatId ?? null,
      beatStartSec: data.beatStartSec,
      isActive: true,
      updatedAt: new Date(),
    })
    .where(eq(schema.memoryReels.id, reel.id))

  // Replace frames wholesale (builder always submits the full ordered list).
  const oldFrames = await dbc
    .select({ id: schema.reelFrames.id, mediaItemId: schema.reelFrames.mediaItemId })
    .from(schema.reelFrames)
    .where(eq(schema.reelFrames.reelId, reel.id))
  await dbc.delete(schema.reelFrames).where(eq(schema.reelFrames.reelId, reel.id))
  if (oldFrames.length > 0) {
    await dbc
      .delete(schema.mediaItems)
      .where(inArray(schema.mediaItems.id, oldFrames.map((f) => f.mediaItemId)))
  }

  for (const [i, frame] of data.frames.entries()) {
    const [media] = await dbc
      .insert(schema.mediaItems)
      .values({ userId: me.id, mediaUrl: frame.mediaUrl, mediaType: 'image' })
      .returning({ id: schema.mediaItems.id })
    await dbc.insert(schema.reelFrames).values({
      reelId: reel.id,
      mediaItemId: media.id,
      position: i + 1,
      caption: frame.caption,
      durationMs: frame.durationMs,
    })
  }

  return { ok: true, reelId: reel.id }
}
