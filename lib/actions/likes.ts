'use server'

/**
 * Like + match-on-insert (PRD §19) and unmatch (ReelChemistry).
 *
 * Matching is driven ONLY by a mutual Like. Charms are a separate, private
 * friendly-hello (see lib/actions/reactions.ts) and never form a match.
 *
 * On like(A→B): require A == session user, reject blocked pairs, upsert the
 * like idempotently, and if B already liked A create a canonically-ordered
 * match (user_a < user_b) — but only when BOTH users are currently free, since
 * a person can hold only one active match at a time. If either is already
 * matched the like is still recorded, so the match can form later (when a
 * party unmatches, `reconcile` re-pairs them).
 */
import { and, eq, inArray, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

const likeInput = z.object({ likedUserId: z.string().uuid() })

export type LikeResult =
  | { matched: false; pending?: boolean }
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

  // Mutual like — form the match only if BOTH are free (one match at a time).
  const matchId = await dbc.transaction(async (tx) => {
    if ((await hasActiveMatch(tx, me.id)) || (await hasActiveMatch(tx, likedUserId))) {
      return null
    }
    return createMatch(tx, me.id, likedUserId)
  })

  if (!matchId) return { matched: false, pending: true }
  return { matched: true, matchId }
}

const unmatchInput = z.object({ matchId: z.string().uuid() })

export async function unmatch(input: z.infer<typeof unmatchInput>): Promise<{ ok: true }> {
  const { matchId } = unmatchInput.parse(input)
  const me = await requireUser()

  const { ok } = await rateLimit(me.id, 'unmatch')
  if (!ok) throw new Error('Too many requests')

  const dbc = db()

  const [match] = await dbc
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.id, matchId))
    .limit(1)
  if (!match) throw new Error('Match not found')
  if (match.userAId !== me.id && match.userBId !== me.id) throw new Error('Unavailable')

  if (match.status === 'active') {
    await dbc
      .update(schema.matches)
      .set({ status: 'closed' })
      .where(eq(schema.matches.id, matchId))
  }

  // Now that I'm free, see if an existing mutual like can pair me with someone.
  await reconcile(me.id)
  return { ok: true }
}

type Tx = Parameters<Parameters<ReturnType<typeof db>['transaction']>[0]>[0]

async function hasActiveMatch(tx: Tx, userId: string): Promise<boolean> {
  const [row] = await tx
    .select({ id: schema.matches.id })
    .from(schema.matches)
    .where(
      and(
        eq(schema.matches.status, 'active'),
        or(eq(schema.matches.userAId, userId), eq(schema.matches.userBId, userId)),
      ),
    )
    .limit(1)
  return Boolean(row)
}

/** Insert a canonically-ordered match (idempotent) + seed starters. Returns the match id. */
async function createMatch(tx: Tx, a: string, b: string): Promise<string> {
  const [lo, hi] = [a, b].sort()
  const inserted = await tx
    .insert(schema.matches)
    .values({ userAId: lo, userBId: hi })
    .onConflictDoNothing()
    .returning({ id: schema.matches.id })

  let matchId = inserted[0]?.id
  if (matchId) {
    await seedConversationStarters(tx, matchId, a, b)
  } else {
    const [existing] = await tx
      .select({ id: schema.matches.id })
      .from(schema.matches)
      .where(and(eq(schema.matches.userAId, lo), eq(schema.matches.userBId, hi)))
      .limit(1)
    matchId = existing.id
    // Re-open a previously closed match between this pair.
    await tx
      .update(schema.matches)
      .set({ status: 'active' })
      .where(eq(schema.matches.id, matchId))
  }
  return matchId
}

/**
 * After a user becomes free, try to pair them with the oldest mutual-like
 * partner who is also currently free, so a deferred match forms automatically.
 */
async function reconcile(userId: string): Promise<void> {
  const dbc = db()

  await dbc.transaction(async (tx) => {
    if (await hasActiveMatch(tx, userId)) return

    // Candidates: people I like who also like me, not blocked either way.
    const mutual = await tx
      .select({ otherId: schema.likes.likedUserId, createdAt: schema.likes.createdAt })
      .from(schema.likes)
      .where(eq(schema.likes.likerUserId, userId))
      .orderBy(schema.likes.createdAt)

    if (mutual.length === 0) return

    const candidateIds = mutual.map((m) => m.otherId)

    const reciprocators = await tx
      .select({ likerUserId: schema.likes.likerUserId })
      .from(schema.likes)
      .where(
        and(
          eq(schema.likes.likedUserId, userId),
          inArray(schema.likes.likerUserId, candidateIds),
        ),
      )
    const reciprocalSet = new Set(reciprocators.map((r) => r.likerUserId))

    const blockedRows = await tx
      .select({ blocker: schema.blocks.blockerUserId, blocked: schema.blocks.blockedUserId })
      .from(schema.blocks)
      .where(
        or(eq(schema.blocks.blockerUserId, userId), eq(schema.blocks.blockedUserId, userId)),
      )
    const blockedSet = new Set(
      blockedRows.map((r) => (r.blocker === userId ? r.blocked : r.blocker)),
    )

    for (const { otherId } of mutual) {
      if (!reciprocalSet.has(otherId)) continue
      if (blockedSet.has(otherId)) continue
      if (await hasActiveMatch(tx, otherId)) continue
      await createMatch(tx, userId, otherId)
      return
    }
  })
}

/**
 * Deterministic starters (no LLM, PRD §15): prefer templates referencing a
 * shared Top 8 interest, pad with generic warm openers.
 */
async function seedConversationStarters(tx: Tx, matchId: string, userA: string, userB: string) {
  const sharedInterests = await tx
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

  await tx
    .insert(schema.conversationStarters)
    .values(starters.map((s) => ({ matchId, ...s })))
}
