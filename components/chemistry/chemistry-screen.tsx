'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Y2KWindow } from '@/components/y2k-window'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SafetyMenu } from '@/components/safety-menu'
import { PixelHeart, PixelStar, PixelWave } from '@/components/pixel-icons'
import { unmatch } from '@/lib/actions/likes'
import { sendMessage } from '@/lib/actions/messages'
import { cn } from '@/lib/utils'

export type MatchData = {
  matchId: string
  you: { displayName: string; reelThumb: string }
  them: { username: string; displayName: string; reelThumb: string; mood: string }
  sharedInterests: string[]
  starters: string[]
}

export function ChemistryScreen({ match }: { match: MatchData }) {
  const router = useRouter()
  const [starter, setStarter] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sent, setSent] = useState(false)
  const [isUnmatching, startUnmatch] = useTransition()
  const [isSending, startSend] = useTransition()
  const [sendError, setSendError] = useState<string | null>(null)

  function pickStarter(s: string) {
    setStarter(s)
    setDraft(s)
    setSent(false)
  }

  function handleSendMessage() {
    const body = draft.trim()
    if (!body || sent || isSending) return
    setSendError(null)
    startSend(async () => {
      try {
        await sendMessage({ matchId: match.matchId, body })
        setSent(true)
      } catch (err) {
        setSendError(err instanceof Error ? err.message : 'Could not send message')
      }
    })
  }

  function handleUnmatch() {
    if (isUnmatching) return
    startUnmatch(async () => {
      try {
        await unmatch({ matchId: match.matchId })
        router.push('/browse')
      } catch {
        // stay on the page if it fails
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 md:py-12">
      {/* Celebration header */}
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--mm-match)] px-4 py-1.5 text-sm font-semibold text-[var(--mm-ink)]">
          <PixelHeart size={15} />
          ReelChemistry
        </span>
        <h1 className="text-balance font-serif text-3xl text-foreground md:text-4xl">
          You and {match.them.displayName} both felt it
        </h1>
        <p className="mx-auto mt-2 max-w-md text-pretty text-muted-foreground">
          No rush, no pressure. You liked each other&apos;s reels — say hi whenever you feel
          like it, or just enjoy knowing the vibe was mutual.
        </p>
      </div>

      {/* The two reels */}
      <Y2KWindow title="your reels clicked" accent>
        <div className="flex items-center justify-center gap-3">
          <ReelThumb name="You" src={match.you.reelThumb} />
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--mm-match)] text-[var(--mm-ink)] shadow-sm">
            <PixelHeart size={22} />
          </span>
          <ReelThumb
            name={match.them.displayName}
            src={match.them.reelThumb}
            href={`/vibe/${match.them.username}`}
          />
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {match.them.displayName} is feeling: <span className="text-foreground">{match.them.mood}</span>
        </p>
      </Y2KWindow>

      {/* What you have in common */}
      {match.sharedInterests.length > 0 && (
        <Y2KWindow title="what you have in common" className="mt-5">
          <div className="flex flex-wrap gap-2">
            {match.sharedInterests.map((it) => (
              <span
                key={it}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm text-foreground"
              >
                <PixelStar size={13} className="text-[var(--mm-accent)]" />
                {it}
              </span>
            ))}
          </div>
        </Y2KWindow>
      )}

      {/* Conversation starters */}
      <Y2KWindow title="break the ice (optional)" className="mt-5">
        <p className="mb-3 text-sm text-muted-foreground">
          Stuck on a first message? Tap a starter to drop it in — then make it your own.
        </p>
        <div className="flex flex-col gap-2">
          {match.starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => pickStarter(s)}
              className={cn(
                'rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors',
                starter === s
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/40',
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              setSent(false)
            }}
            rows={3}
            placeholder={`Send ${match.them.displayName} a first message...`}
          />
          <div className="flex items-center justify-between gap-2">
            <SafetyMenu name={match.them.displayName} align="start" />
            <div className="flex flex-col items-end gap-1">
              {sendError && (
                <p className="text-xs text-destructive">{sendError}</p>
              )}
              <Button
                disabled={!draft.trim() || sent || isSending}
                onClick={handleSendMessage}
                className="font-semibold"
              >
                <PixelWave size={15} className="mr-1.5" />
                {isSending ? 'Sending…' : sent ? 'Message sent!' : 'Send message'}
              </Button>
            </div>
          </div>
        </div>
      </Y2KWindow>

      <div className="mt-6 flex flex-col items-center gap-2">
        <Button variant="ghost" onClick={() => router.push('/browse')}>
          Maybe later — back to browsing
        </Button>
        <Button
          variant="ghost"
          onClick={handleUnmatch}
          disabled={isUnmatching}
          className="text-muted-foreground hover:text-destructive"
        >
          {isUnmatching ? 'Unmatching…' : 'Quietly unmatch'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Unmatching is silent — no notice is sent. It also frees you both to match again.
        </p>
      </div>
    </div>
  )
}

function ReelThumb({
  name,
  src,
  href,
}: {
  name: string
  src: string
  href?: string
}) {
  const inner = (
    <>
      <div className="relative aspect-[3/4] w-28 overflow-hidden rounded-xl border-2 border-card shadow-md sm:w-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src || '/placeholder.svg'} alt={`${name}'s reel`} className="size-full object-cover" />
      </div>
      <span className="mt-1.5 block text-center text-sm font-medium text-foreground">
        {name}
      </span>
    </>
  )
  return href ? (
    <Link href={href} className="group">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  )
}
