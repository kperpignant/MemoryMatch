'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/button-link'
import { PixelHeart, PixelStar } from '@/components/pixel-icons'
import { unmatch } from '@/lib/actions/likes'
import type { ActiveMatchSummary } from '@/lib/queries'

export function MatchList({ matches }: { matches: ActiveMatchSummary[] }) {
  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          No matches yet. You can hold up to 5 at a time — when you and someone both like
          each other, you&apos;ll land here.
        </p>
        <ButtonLink href="/browse" variant="outline">
          <PixelStar size={14} className="mr-1.5" />
          Find someone
        </ButtonLink>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {matches.map((m) => (
        <MatchRow key={m.matchId} match={m} />
      ))}
    </ul>
  )
}

function MatchRow({ match }: { match: ActiveMatchSummary }) {
  const router = useRouter()
  const [isUnmatching, startUnmatch] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleUnmatch() {
    if (isUnmatching) return
    startUnmatch(async () => {
      try {
        await unmatch({ matchId: match.matchId })
        router.refresh()
      } catch {
        setConfirming(false)
      }
    })
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40">
      <Link
        href={`/chemistry/${match.matchId}`}
        className="relative size-14 shrink-0 overflow-hidden rounded-lg"
      >
        {match.reelThumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={match.reelThumb} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center bg-secondary text-lg font-bold text-secondary-foreground">
            {match.displayName.charAt(0)}
          </span>
        )}
      </Link>
      <Link href={`/chemistry/${match.matchId}`} className="min-w-0 flex-1">
        <span className="block truncate font-medium text-foreground">
          {match.displayName}{' '}
          <span className="font-normal text-muted-foreground">@{match.username}</span>
        </span>
        {match.mood && (
          <span className="block truncate text-sm text-muted-foreground">{match.mood}</span>
        )}
      </Link>
      {confirming ? (
        <span className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(false)}
            disabled={isUnmatching}
          >
            Keep
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUnmatch}
            disabled={isUnmatching}
            className="text-destructive hover:text-destructive"
          >
            {isUnmatching ? 'Unmatching…' : 'Confirm'}
          </Button>
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          <Link
            href={`/chemistry/${match.matchId}`}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--mm-match)] px-3 py-1 text-sm font-semibold text-[var(--mm-ink)]"
          >
            <PixelHeart size={14} />
            Open
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirming(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            Unmatch
          </Button>
        </span>
      )}
    </li>
  )
}
