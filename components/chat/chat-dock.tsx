'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Minus, Send } from 'lucide-react'
import { Y2KWindow } from '@/components/y2k-window'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PixelHeart } from '@/components/pixel-icons'
import { markConversationRead, sendMessage } from '@/lib/actions/messages'
import { cn } from '@/lib/utils'

type ChatMessage = {
  id: string
  senderUserId: string
  body: string
  createdAt: string
  readAt: string | null
}

type Conversation = {
  matchId: string
  partner: {
    username: string
    displayName: string
    reelThumb: string | null
  }
  unreadCount: number
  lastMessageAt: string | null
  lastMessagePreview: string | null
}

type ListState = {
  meId: string
  conversations: Conversation[]
  totalUnread: number
}

type MessagesState = {
  matchId: string
  meId?: string
  messages: ChatMessage[]
}

const BASE_TITLE = 'MemoryMatch — Less swiping. More story.'
const POLL_COLLAPSED_MS = 3000
const POLL_EXPANDED_MS = 2000

function playNotifySound() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.04
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => void ctx.close()
  } catch {
    // audio unavailable
  }
}

function mergeMessages(prev: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const map = new Map(prev.map((m) => [m.id, m]))
  for (const m of incoming) map.set(m.id, m)
  return [...map.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

function latestCursor(msgs: ChatMessage[]): string | null {
  if (msgs.length === 0) return null
  return msgs[msgs.length - 1]!.createdAt
}

export function ChatDock() {
  const [expanded, setExpanded] = useState(false)
  const [meId, setMeId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [openMatchId, setOpenMatchId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, startSend] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cursorRef = useRef<string | null>(null)
  const prevUnreadRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded
  const openMatchRef = useRef<string | null>(openMatchId)
  openMatchRef.current = openMatchId

  const updateTitle = useCallback((count: number) => {
    document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE
  }, [])

  const openConversation = conversations.find((c) => c.matchId === openMatchId) ?? null

  const fetchList = useCallback(async () => {
    const res = await fetch('/api/chat/state', { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as ListState
    setMeId(data.meId)
    setConversations(data.conversations)

    const viewingOpen = expandedRef.current && openMatchRef.current !== null
    if (data.totalUnread > prevUnreadRef.current && !viewingOpen) {
      playNotifySound()
    }
    prevUnreadRef.current = data.totalUnread
    setTotalUnread(data.totalUnread)
    updateTitle(data.totalUnread)
  }, [updateTitle])

  const fetchMessages = useCallback(async (matchId: string, incremental: boolean) => {
    const after = incremental ? cursorRef.current : null
    const params = new URLSearchParams({ matchId })
    if (after) params.set('after', after)
    const res = await fetch(`/api/chat/state?${params.toString()}`, { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as MessagesState
    if (data.matchId !== openMatchRef.current) return // switched away mid-flight
    if (data.meId) setMeId(data.meId)

    if (incremental && data.messages.length > 0) {
      setMessages((prev) => {
        const merged = mergeMessages(prev, data.messages)
        cursorRef.current = latestCursor(merged)
        return merged
      })
    } else if (!incremental) {
      const merged = mergeMessages([], data.messages)
      setMessages(merged)
      cursorRef.current = latestCursor(merged)
    }
  }, [])

  const markRead = useCallback(
    async (matchId: string) => {
      try {
        await markConversationRead({ matchId })
        setConversations((prev) =>
          prev.map((c) => (c.matchId === matchId ? { ...c, unreadCount: 0 } : c)),
        )
        setTotalUnread((prev) => {
          const conv = conversations.find((c) => c.matchId === matchId)
          const next = Math.max(0, prev - (conv?.unreadCount ?? 0))
          prevUnreadRef.current = next
          updateTitle(next)
          return next
        })
      } catch {
        // non-blocking
      }
    },
    [conversations, updateTitle],
  )

  const handleOpenConversation = useCallback(
    (matchId: string) => {
      setOpenMatchId(matchId)
      setMessages([])
      cursorRef.current = null
      setError(null)
      void fetchMessages(matchId, false)
      void markRead(matchId)
    },
    [fetchMessages, markRead],
  )

  const handleBackToList = useCallback(() => {
    setOpenMatchId(null)
    setMessages([])
    cursorRef.current = null
  }, [])

  const handleExpand = useCallback(() => {
    setExpanded(true)
  }, [])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
  }, [])

  // Initial load + list polling
  useEffect(() => {
    void fetchList()
    const ms = expanded ? POLL_EXPANDED_MS : POLL_COLLAPSED_MS
    const tick = () => {
      if (!document.hidden) void fetchList()
    }
    const interval = setInterval(tick, ms)
    const onVisibility = () => {
      if (!document.hidden) void fetchList()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      document.title = BASE_TITLE
    }
  }, [fetchList, expanded])

  // Open-conversation message polling
  useEffect(() => {
    if (!expanded || !openMatchId) return
    const tick = () => {
      if (!document.hidden) {
        void fetchMessages(openMatchId, true)
        void markRead(openMatchId)
      }
    }
    const interval = setInterval(tick, POLL_EXPANDED_MS)
    return () => clearInterval(interval)
  }, [expanded, openMatchId, fetchMessages, markRead])

  // Scroll to bottom when viewing a conversation and messages change
  useEffect(() => {
    if (expanded && openMatchId) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, expanded, openMatchId])

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!openMatchId || !draft.trim() || isSending) return
    const matchId = openMatchId
    const body = draft.trim()
    setDraft('')
    setError(null)

    const optimistic: ChatMessage = {
      id: `opt-${Date.now()}`,
      senderUserId: meId ?? '',
      body,
      createdAt: new Date().toISOString(),
      readAt: null,
    }
    setMessages((prev) => mergeMessages(prev, [optimistic]))
    cursorRef.current = optimistic.createdAt

    startSend(async () => {
      try {
        const row = await sendMessage({ matchId, body })
        setMessages((prev) => {
          const withoutOpt = prev.filter((m) => m.id !== optimistic.id)
          const merged = mergeMessages(withoutOpt, [
            {
              id: row.id,
              senderUserId: row.senderUserId,
              body: row.body,
              createdAt: row.createdAt.toISOString(),
              readAt: row.readAt?.toISOString() ?? null,
            },
          ])
          cursorRef.current = latestCursor(merged)
          return merged
        })
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
        setDraft(body)
        setError(err instanceof Error ? err.message : 'Could not send')
      }
    })
  }

  if (conversations.length === 0) return null

  // Collapsed bubble
  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={handleExpand}
          className="flex items-center gap-2 rounded-full border-2 border-primary/40 bg-card py-2 pl-2 pr-4 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label="Open messages"
        >
          <span className="relative flex -space-x-3">
            {conversations.slice(0, 3).map((c) => (
              <span
                key={c.matchId}
                className="size-10 shrink-0 overflow-hidden rounded-full border-2 border-card"
              >
                {c.partner.reelThumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.partner.reelThumb} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center bg-secondary text-sm font-bold text-secondary-foreground">
                    {c.partner.displayName.charAt(0)}
                  </span>
                )}
              </span>
            ))}
            {totalUnread > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[var(--mm-match)] px-1 text-[10px] font-bold text-[var(--mm-ink)]">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </span>
          <span className="ml-2 text-sm font-medium text-foreground">
            Messages
            {conversations.length > 1 ? ` (${conversations.length})` : ''}
          </span>
          <ChevronUp size={16} className="ml-1 text-muted-foreground" aria-hidden />
        </button>
      </div>
    )
  }

  // Expanded: conversation list
  if (!openMatchId || !openConversation) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,22rem)]">
        <Y2KWindow
          title="messages"
          accent
          actions={
            <button
              type="button"
              onClick={handleCollapse}
              className="grid size-6 place-items-center rounded-md hover:bg-black/10"
              aria-label="Minimize messages"
            >
              <Minus size={14} />
            </button>
          }
          bodyClassName="flex flex-col p-0"
        >
          <ScrollArea className="max-h-80">
            <ul className="flex flex-col">
              {conversations.map((c) => (
                <li key={c.matchId}>
                  <button
                    type="button"
                    onClick={() => handleOpenConversation(c.matchId)}
                    className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-secondary/40"
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border">
                      {c.partner.reelThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.partner.reelThumb} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center bg-secondary text-sm font-bold text-secondary-foreground">
                          {c.partner.displayName.charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {c.partner.displayName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.lastMessagePreview ?? 'Say hi — no pressure.'}
                      </span>
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-[var(--mm-match)] px-1 text-[10px] font-bold text-[var(--mm-ink)]">
                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </Y2KWindow>
        <button
          type="button"
          onClick={handleCollapse}
          className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card p-0.5 shadow-sm"
          aria-label="Collapse messages"
        >
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </div>
    )
  }

  // Expanded: single conversation thread
  const { partner } = openConversation

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,22rem)]">
      <Y2KWindow
        title={partner.displayName}
        accent
        actions={
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleBackToList}
              className="mr-1 grid size-6 place-items-center rounded-md hover:bg-black/10"
              aria-label="Back to messages"
            >
              <ArrowLeft size={14} />
            </button>
            <Link
              href={`/vibe/${partner.username}`}
              className="mr-1 truncate text-xs underline opacity-90 hover:opacity-100"
            >
              @{partner.username}
            </Link>
            <button
              type="button"
              onClick={handleCollapse}
              className="grid size-6 place-items-center rounded-md hover:bg-black/10"
              aria-label="Minimize chat"
            >
              <Minus size={14} />
            </button>
            <Link
              href={`/chemistry/${openMatchId}`}
              className="grid size-6 place-items-center rounded-md hover:bg-black/10"
              aria-label="Open ReelChemistry"
            >
              <PixelHeart size={14} />
            </Link>
          </div>
        }
        bodyClassName="flex flex-col p-0"
      >
        <ScrollArea className="h-72 px-3 py-2">
          <div className="flex flex-col gap-2">
            {messages.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Say hi — no pressure, just a hello.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.senderUserId === meId
                return (
                  <div
                    key={m.id}
                    className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                        mine
                          ? 'rounded-br-md bg-primary text-primary-foreground'
                          : 'rounded-bl-md border border-border bg-secondary/50 text-foreground',
                      )}
                    >
                      {m.body}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 border-t border-border px-3 py-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            maxLength={2000}
            disabled={isSending}
            aria-label="Message"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!draft.trim() || isSending}
            aria-label="Send message"
          >
            <Send size={16} />
          </Button>
        </form>
        {error && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
      </Y2KWindow>
      <button
        type="button"
        onClick={handleCollapse}
        className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card p-0.5 shadow-sm"
        aria-label="Collapse chat"
      >
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
    </div>
  )
}
