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
import { SAMPLE_BUDDIES } from '@/lib/memorymatch'

// give the sample buddies an intent + pace label for filtering
const PACES = ['slow burn', 'friend first', 'open to dating', 'just browsing', 'co-op mode']
const buddies = SAMPLE_BUDDIES.map((b, i) => ({
  ...b,
  pace: PACES[i % PACES.length],
}))

type Buddy = (typeof buddies)[number]

function BuddyRow({ buddy, onCharm }: { buddy: Buddy; onCharm: (b: Buddy) => void }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40">
      <Link
        href={`/vibe/${buddy.username}`}
        className="relative size-14 shrink-0 overflow-hidden rounded-lg"
      >
        <Image src={buddy.reelThumb} alt="" fill className="object-cover" sizes="56px" />
        {buddy.online && (
          <span
            className="absolute bottom-1 right-1 size-3 rounded-full border-2 border-card bg-[var(--mm-match)]"
            aria-label="online"
          />
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
        <span className="mt-1 inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-foreground">
          {buddy.pace}
        </span>
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

export function BrowseList() {
  const [query, setQuery] = useState('')
  const [pace, setPace] = useState<string | null>(null)
  const [charmFor, setCharmFor] = useState<Buddy | null>(null)

  const filtered = useMemo(() => {
    return buddies.filter((b) => {
      const matchesPace = !pace || b.pace === pace
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        b.displayName.toLowerCase().includes(q) ||
        b.username.toLowerCase().includes(q) ||
        b.mood.toLowerCase().includes(q)
      return matchesPace && matchesQuery
    })
  }, [query, pace])

  const online = filtered.filter((b) => b.online)
  const offline = filtered.filter((b) => !b.online)

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
          <div className="flex flex-wrap gap-2">
            <Chip selected={pace === null} onClick={() => setPace(null)}>
              everyone
            </Chip>
            {PACES.map((p) => (
              <Chip key={p} selected={pace === p} onClick={() => setPace(p)}>
                {p}
              </Chip>
            ))}
          </div>
        </div>

        {/* Lists */}
        <div className="mt-5 flex flex-col gap-5">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="size-2.5 rounded-full bg-[var(--mm-match)]" />
              Online — {online.length}
            </h3>
            {online.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {online.map((b) => (
                  <BuddyRow key={b.username} buddy={b} onCharm={setCharmFor} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-secondary/30 px-4 py-5 text-center text-sm text-muted-foreground">
                Nobody matching that is online right now.
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <span className="size-2.5 rounded-full bg-muted-foreground/40" />
              Away — {offline.length}
            </h3>
            {offline.length > 0 ? (
              <ul className="flex flex-col gap-2 opacity-80">
                {offline.map((b) => (
                  <BuddyRow key={b.username} buddy={b} onCharm={setCharmFor} />
                ))}
              </ul>
            ) : (
              <p className="rounded-xl bg-secondary/30 px-4 py-5 text-center text-sm text-muted-foreground">
                No matches away right now.
              </p>
            )}
          </section>

          {filtered.length === 0 && (
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
