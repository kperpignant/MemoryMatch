import { getChatConversations, getConversationMessages } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')
  const afterStr = searchParams.get('after')
  const after = afterStr ? new Date(afterStr) : undefined
  if (after && Number.isNaN(after.getTime())) {
    return Response.json({ error: 'Invalid after cursor' }, { status: 400 })
  }

  // Messages for a single open conversation.
  if (matchId) {
    const conv = await getConversationMessages(matchId, after)
    if (!conv) return Response.json({ matchId, messages: [] })
    return Response.json({
      matchId,
      meId: conv.meId,
      messages: conv.messages.map((m) => ({
        id: m.id,
        senderUserId: m.senderUserId,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        readAt: m.readAt?.toISOString() ?? null,
      })),
    })
  }

  // Otherwise the conversation list + combined unread badge.
  const { meId, conversations, totalUnread } = await getChatConversations()
  return Response.json({ meId, conversations, totalUnread })
}
