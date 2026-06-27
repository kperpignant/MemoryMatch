'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Minus, Send } from 'lucide-react'
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

type MatchInfo = {
  id: string
  partner: {
    username: string
    displayName: string
    reelThumb: string | null
  }
}

type ChatState = {
  match: MatchInfo | null
  meId: string
  messages: ChatMessage[]
  unreadCount: number
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
  const [match, setMatch] = useState<MatchInfo | null>(null)
  const [meId, setMeId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [draft, setDraft] = useState('')
  const [isSending, startSend] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cursorRef = useRef<string | null>(null)
  const prevUnreadRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const expandedRef = useRef(expanded)
  expandedRef.current = expanded

  const updateTitle = useCallback((count: number) => {
    document.title = count > 0 ? `(${count}) ${BASE_TITLE}` : BASE_TITLE
  }, [])

  const applyState = useCallback(
    (data: ChatState, isIncremental: boolean) => {
      if (!data.match) {
        setMatch(null)
        setMessages([])
        setUnreadCount(0)
        setMeId(null)
        cursorRef.current = null
        updateTitle(0)
        return
      }

      setMatch(data.match)
      setMeId(data.meId)

      if (isIncremental && data.messages.length > 0) {
        setMessages((prev) => {
          const merged = mergeMessages(prev, data.messages)
          cursorRef.current = latestCursor(merged)
          return merged
        })
      } else if (!isIncremental) {
        const merged = mergeMessages([], data.messages)
        setMessages(merged)
        cursorRef.current = latestCursor(merged)
      }

      const incomingFromOther = data.messages.some((m) => m.senderUserId !== data.meId)
      const shouldNotify =
        !expandedRef.current &&
        incomingFromOther &&
        data.unreadCount > prevUnreadRef.current

      if (shouldNotify) playNotifySound()

      prevUnreadRef.current = data.unreadCount
      if (!expandedRef.current) {
        setUnreadCount(data.unreadCount)
        updateTitle(data.unreadCount)
      }
    },
    [updateTitle],
  )

  const fetchState = useCallback(async (incremental: boolean) => {
    const after = incremental ? cursorRef.current : null
    const url = after
      ? `/api/chat/state?after=${encodeURIComponent(after)}`
      : '/api/chat/state'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return
    const data = (await res.json()) as ChatState
    applyState(data, incremental)
  }, [applyState])

  const markRead = useCallback(async (matchId: string) => {
    try {
      await markConversationRead({ matchId })
      setUnreadCount(0)
      prevUnreadRef.current = 0
      updateTitle(0)
    } catch {
      // non-blocking
    }
  }, [updateTitle])

  const handleExpand = useCallback(() => {
    setExpanded(true)
    if (match) void markRead(match.id)
    setUnreadCount(0)
    updateTitle(0)
  }, [match, markRead, updateTitle])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
  }, [])

  // Initial load + polling (cadence depends on expanded)
  useEffect(() => {
    void fetchState(false)

    const tick = () => {
      if (!document.hidden) void fetchState(true)
    }

    const ms = expanded ? POLL_EXPANDED_MS : POLL_COLLAPSED_MS
    const interval = setInterval(tick, ms)

    const onVisibility = () => {
      if (!document.hidden) void fetchState(true)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      document.title = BASE_TITLE
    }
  }, [fetchState, expanded])

  // Scroll to bottom when expanded and messages change
  useEffect(() => {
    if (expanded) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, expanded])

  function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    if (!match || !draft.trim() || isSending) return
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
        const row = await sendMessage({ matchId: match.id, body })
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

  if (!match) return null

  const { partner } = match

  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          type="button"
          onClick={handleExpand}
          className="flex items-center gap-2 rounded-full border-2 border-primary/40 bg-card py-2 pl-2 pr-4 shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          aria-label={`Open chat with ${partner.displayName}`}
        >
          <span className="relative size-10 shrink-0 overflow-hidden rounded-full border border-border">
            {partner.reelThumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partner.reelThumb} alt="" className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center bg-secondary text-sm font-bold text-secondary-foreground">
                {partner.displayName.charAt(0)}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[var(--mm-match)] px-1 text-[10px] font-bold text-[var(--mm-ink)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </span>
          <span className="ml-2 max-w-32 truncate text-sm font-medium text-foreground">
            {partner.displayName}
          </span>
          <ChevronUp size={16} className="ml-1 text-muted-foreground" aria-hidden />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,22rem)]">
      <Y2KWindow
        title={partner.displayName}
        accent
        actions={
          <div className="flex items-center gap-0.5">
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
              href={`/chemistry/${match.id}`}
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
        {error && (
          <p className="px-3 pb-2 text-xs text-destructive">{error}</p>
        )}
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
