'use server'

/**
 * Like + match-on-insert (PRD §19).
 *
 * On like(A→B): require A == session user, reject blocked pairs, upsert the
 * like idempotently, and if B already liked A create a canonically-ordered
 * match (user_a < user_b) plus its conversation starters.
 */
import { and, eq, inArray, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

const likeInput = z.object({ likedUserId: z.string().uuid() })

export type LikeResult =
  | { matched: false }
  | { matched: true; matchId: string }

export async function likeUser(input: z.infer<typeof likeInput>): Promise<LikeResult> {
  const { likedUserId } = likeInput.parse(input)
  const me = await requireUser()
  if (likedUserId === me.id) throw new Error('Cannot like yourself')

  const { ok } = await rateLimit(me.id, 'like')
  if (!ok) throw new Error('Slow down a little — try again in a minute')

  const dbc = db()

  // Blocked in either direction → no interaction (PRD §19 block enforcement)
  const blocked = await dbc
    .select({ id: schema.blocks.id })
    .from(schema.blocks)
    .where(
      or(
        and(
          eq(schema.blocks.blockerUserId, me.id),
          eq(schema.blocks.blockedUserId, likedUserId),
        ),
        and(
          eq(schema.blocks.blockerUserId, likedUserId),
          eq(schema.blocks.blockedUserId, me.id),
        ),
      ),
    )
    .limit(1)
  if (blocked.length > 0) throw new Error('Unavailable')

  await dbc
    .insert(schema.likes)
    .values({ likerUserId: me.id, likedUserId })
    .onConflictDoNothing()

  const reciprocal = await dbc
    .select({ id: schema.likes.id })
    .from(schema.likes)
    .where(
      and(eq(schema.likes.likerUserId, likedUserId), eq(schema.likes.likedUserId, me.id)),
    )
    .limit(1)
  if (reciprocal.length === 0) return { matched: false }

  const [lo, hi] = [me.id, likedUserId].sort()
  const inserted = await dbc
    .insert(schema.matches)
    .values({ userAId: lo, userBId: hi })
    .onConflictDoNothing()
    .returning({ id: schema.matches.id })

  let matchId = inserted[0]?.id
  if (matchId) {
    await seedConversationStarters(matchId, me.id, likedUserId)
  } else {
    const [existing] = await dbc
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(and(eq(schema.matches.userAId, lo), eq(schema.matches.userBId, hi)))
      .limit(1)
    matchId = existing.id
  }

  return { matched: true, matchId }
}

/**
 * Deterministic starters (no LLM, PRD §15): prefer templates referencing a
 * shared Top 8 interest, pad with generic warm openers.
 */
async function seedConversationStarters(matchId: string, userA: string, userB: string) {
  const dbc = db()

  const sharedInterests = await dbc
    .select({ name: schema.interests.name })
    .from(schema.profileInterests)
    .innerJoin(schema.interests, eq(schema.profileInterests.interestId, schema.interests.id))
    .innerJoin(schema.profiles, eq(schema.profileInterests.profileId, schema.profiles.id))
    .where(inArray(schema.profiles.userId, [userA, userB]))

  const counts = new Map<string, number>()
  for (const { name } of sharedInterests) counts.set(name, (counts.get(name) ?? 0) + 1)
  const shared = [...counts.entries()].filter(([, n]) => n >= 2).map(([name]) => name)

  const starters: { starterText: string; sourceContext: string }[] = shared
    .slice(0, 2)
    .map((name) => ({
      starterText: `You're both into ${name} — what got you started?`,
      sourceContext: `shared interest: ${name}`,
    }))

  const generic = [
    'Your reel gave me actual nostalgia. Which frame is the real you?',
    'Trading a small-moment story for a small-moment story. You first.',
    'Okay — best track to put on a mixtape for a rainy Sunday?',
  ]
  for (const g of generic) {
    if (starters.length >= 3) break
    starters.push({ starterText: g, sourceContext: 'template' })
  }

  await dbc
    .insert(schema.conversationStarters)
    .values(starters.map((s) => ({ matchId, ...s })))
}
