'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Y2KWindow } from '@/components/y2k-window'
import { CharmComposer } from '@/components/charm-composer'
import { Chip } from '@/components/chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PixelWave, PixelStar } from '@/components/pixel-icons'
import { Search } from 'lucide-react'
import type { BuddySummary } from '@/lib/queries'

const INTENT_LABEL: Record<string, string> = {
  open_to_dating: 'open to dating',
  slow_burn: 'slow burn',
  friend_first: 'friend first',
  just_browsing: 'just browsing',
  co_op_mode: 'co-op mode',
  social_discovery: 'social discovery',
}

type Buddy = BuddySummary & { pace: string }

function BuddyRow({ buddy, onCharm }: { buddy: Buddy; onCharm: (b: Buddy) => void }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40">
      <Link
        href={`/vibe/${buddy.username}`}
        className="relative size-14 shrink-0 overflow-hidden rounded-lg"
      >
        {buddy.reelThumb ? (
          <Image src={buddy.reelThumb} alt="" fill className="object-cover" sizes="56px" />
        ) : (
          <span className="grid size-full place-items-center bg-secondary text-lg font-bold text-secondary-foreground">
            {buddy.displayName.charAt(0)}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/vibe/${buddy.username}`}
          className="block truncate font-medium text-foreground hover:underline"
        >
          {buddy.displayName}{' '}
          <span className="font-normal text-muted-foreground">@{buddy.username}</span>
        </Link>
        <p className="truncate text-sm text-muted-foreground">{buddy.mood}</p>
        {buddy.pace && (
          <span className="mt-1 inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-foreground">
            {buddy.pace}
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0"
        onClick={() => onCharm(buddy)}
      >
        <PixelWave size={14} className="mr-1" />
        Charm
      </Button>
    </li>
  )
}

export function BrowseList({ buddies }: { buddies: BuddySummary[] }) {
  const [query, setQuery] = useState('')
  const [pace, setPace] = useState<string | null>(null)
  const [charmFor, setCharmFor] = useState<Buddy | null>(null)

  const enriched: Buddy[] = buddies.map((b) => ({
    ...b,
    pace: b.intent ? (INTENT_LABEL[b.intent] ?? b.intent.replace(/_/g, ' ')) : '',
  }))

  const paces = useMemo(
    () => [...new Set(enriched.map((b) => b.pace).filter(Boolean))],
    [enriched],
  )

  const filtered = useMemo(() => {
    return enriched.filter((b) => {
      const matchesPace = !pace || b.pace === pace
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        b.displayName.toLowerCase().includes(q) ||
        b.username.toLowerCase().includes(q) ||
        (b.mood ?? '').toLowerCase().includes(q)
      return matchesPace && matchesQuery
    })
  }, [enriched, query, pace])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <div className="mb-5">
        <h1 className="font-serif text-3xl text-foreground">Buddy list</h1>
        <p className="mt-1 text-pretty text-muted-foreground">
          People whose vibes might match yours. Peek at a reel, send a charm, no rush.
          We don&apos;t show like counts or rankings here.
        </p>
      </div>

      <Y2KWindow title="who's around" accent>
        {/* Search + filters */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search names or moods..."
              className="pl-9"
              aria-label="Search buddies"
            />
          </div>
          {paces.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Chip selected={pace === null} onClick={() => setPace(null)}>
                everyone
              </Chip>
              {paces.map((p) => (
                <Chip key={p} selected={pace === p} onClick={() => setPace(p)}>
                  {p}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="mt-5 flex flex-col gap-5">
          {filtered.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {filtered.map((b) => (
                <BuddyRow key={b.username} buddy={b} onCharm={setCharmFor} />
              ))}
            </ul>
          ) : buddies.length === 0 ? (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
              <PixelStar size={14} className="text-[var(--mm-accent)]" />
              No one here yet — be the first to set up your Vibe Page.
            </p>
          ) : (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
              <PixelStar size={14} className="text-[var(--mm-accent)]" />
              No one matches that yet — try a different pace or search.
            </p>
          )}
        </div>
      </Y2KWindow>

      <CharmComposer
        open={charmFor !== null}
        onOpenChange={(o) => !o && setCharmFor(null)}
        name={charmFor?.displayName ?? 'them'}
      />
    </div>
  )
}
