'use server'

/**
 * Match-gated 1:1 chat (ReelChemistry). Only active match members may send/read.
 */
import { and, eq, isNull, ne, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { db, schema } from '@/lib/db'
import { rateLimit } from '@/lib/ratelimit'

const sendInput = z.object({
  matchId: z.string().uuid(),
  body: z.string().trim().min(1).max(2000),
})

const readInput = z.object({ matchId: z.string().uuid() })

export type MessageRow = {
  id: string
  matchId: string
  senderUserId: string
  body: string
  createdAt: Date
  readAt: Date | null
}

async function assertActiveMatchMember(matchId: string, meId: string) {
  const dbc = db()
  const [match] = await dbc
    .select()
    .from(schema.matches)
    .where(and(eq(schema.matches.id, matchId), eq(schema.matches.status, 'active')))
    .limit(1)
  if (!match) throw new Error('Conversation unavailable')
  if (match.userAId !== meId && match.userBId !== meId) throw new Error('Unavailable')

  const otherId = match.userAId === meId ? match.userBId : match.userAId
  const blocked = await dbc
    .select({ id: schema.blocks.id })
    .from(schema.blocks)
    .where(
      or(
        and(eq(schema.blocks.blockerUserId, meId), eq(schema.blocks.blockedUserId, otherId)),
        and(eq(schema.blocks.blockerUserId, otherId), eq(schema.blocks.blockedUserId, meId)),
      ),
    )
    .limit(1)
  if (blocked.length > 0) throw new Error('Unavailable')

  return { match, otherId }
}

export async function sendMessage(input: z.infer<typeof sendInput>): Promise<MessageRow> {
  const { matchId, body } = sendInput.parse(input)
  const me = await requireUser()

  const { ok } = await rateLimit(me.id, 'message')
  if (!ok) throw new Error('Slow down a little — try again in a minute')

  await assertActiveMatchMember(matchId, me.id)

  const [row] = await db()
    .insert(schema.messages)
    .values({ matchId, senderUserId: me.id, body })
    .returning()

  return row
}

export async function markConversationRead(input: z.infer<typeof readInput>): Promise<{ ok: true }> {
  const { matchId } = readInput.parse(input)
  const me = await requireUser()
  await assertActiveMatchMember(matchId, me.id)

  await db()
    .update(schema.messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(schema.messages.matchId, matchId),
        ne(schema.messages.senderUserId, me.id),
        isNull(schema.messages.readAt),
      ),
    )

  return { ok: true }
}
