import { getActiveConversation } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const afterStr = searchParams.get('after')
  const after = afterStr ? new Date(afterStr) : undefined
  if (after && Number.isNaN(after.getTime())) {
    return Response.json({ error: 'Invalid after cursor' }, { status: 400 })
  }

  const conv = await getActiveConversation(after)
  if (!conv) {
    return Response.json({ match: null })
  }

  return Response.json({
    match: {
      id: conv.matchId,
      partner: conv.partner,
    },
    meId: conv.meId,
    messages: conv.messages.map((m) => ({
      id: m.id,
      senderUserId: m.senderUserId,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
    unreadCount: conv.unreadCount,
  })
}
