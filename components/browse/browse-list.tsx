'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Y2KWindow } from '@/components/y2k-window'
import { CharmComposer, type CharmKind } from '@/components/charm-composer'
import { Chip } from '@/components/chip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PixelWave, PixelStar } from '@/components/pixel-icons'
import { MapPin, Search } from 'lucide-react'
import { sendReaction } from '@/lib/actions/reactions'
import type { BuddySummary } from '@/lib/queries'

const INTENT_LABEL: Record<string, string> = {
  open_to_dating: 'open to dating',
  slow_burn: 'slow burn',
  friend_first: 'friend first',
  just_browsing: 'just browsing',
  co_op_mode: 'co-op mode',
  social_discovery: 'social discovery',
}

const RADIUS_OPTIONS = [
  { label: 'Anywhere', value: null },
  { label: '10 mi', value: 10 },
  { label: '25 mi', value: 25 },
  { label: '50 mi', value: 50 },
  { label: '100 mi', value: 100 },
] as const

type Buddy = BuddySummary & { pace: string }

function formatLocation(buddy: BuddySummary): string | null {
  if (buddy.city && buddy.state) return `${buddy.city}, ${buddy.state}`
  return null
}

function BuddyRow({
  buddy,
  onCharm,
  charmed,
  activeInterest,
  onPickInterest,
}: {
  buddy: Buddy
  onCharm: (b: Buddy) => void
  charmed: boolean
  activeInterest: string | null
  onPickInterest: (interest: string) => void
}) {
  const loc = formatLocation(buddy)
  const canCharm = Boolean(buddy.reelThumbFrameId)
  const thumbSrc = buddy.avatarUrl ?? buddy.reelThumb

  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 transition-colors hover:border-primary/40">
      <Link
        href={`/vibe/${buddy.username}`}
        className="relative size-14 shrink-0 overflow-hidden rounded-lg"
      >
        {thumbSrc ? (
          <Image src={thumbSrc} alt="" fill className="object-cover" sizes="56px" />
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
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {buddy.pace && (
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-foreground">
              {buddy.pace}
            </span>
          )}
          {loc && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <MapPin size={10} aria-hidden />
              {loc}
            </span>
          )}
          {buddy.distanceMiles != null && (
            <span className="text-[11px] text-muted-foreground">
              ~{buddy.distanceMiles} mi away
            </span>
          )}
        </div>
        {buddy.interests.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {buddy.interests.slice(0, 4).map((it) => (
              <button
                key={it}
                type="button"
                onClick={() => onPickInterest(it)}
                className={
                  'rounded-full border px-2 py-0.5 text-[11px] transition-colors ' +
                  (activeInterest === it
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40')
                }
              >
                {it}
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        variant={charmed ? 'secondary' : 'outline'}
        size="sm"
        className="shrink-0"
        onClick={() => onCharm(buddy)}
        disabled={charmed || !canCharm}
        title={canCharm ? undefined : 'No reel to charm yet'}
      >
        <PixelWave size={14} className="mr-1" />
        {charmed ? 'Charm sent' : 'Charm'}
      </Button>
    </li>
  )
}

export function BrowseList({
  buddies,
  radiusMiles,
  viewerHasLocation,
}: {
  buddies: BuddySummary[]
  radiusMiles: number | null
  viewerHasLocation: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pace, setPace] = useState<string | null>(null)
  const [interest, setInterest] = useState<string | null>(null)
  const [charmFor, setCharmFor] = useState<Buddy | null>(null)
  const [charmed, setCharmed] = useState<Set<string>>(new Set())

  const enriched: Buddy[] = buddies.map((b) => ({
    ...b,
    pace: b.intent ? (INTENT_LABEL[b.intent] ?? b.intent.replace(/_/g, ' ')) : '',
  }))

  const paces = useMemo(
    () => [...new Set(enriched.map((b) => b.pace).filter(Boolean))],
    [enriched],
  )

  const interestOptions = useMemo(
    () => [...new Set(enriched.flatMap((b) => b.interests))].sort((a, b) => a.localeCompare(b)),
    [enriched],
  )

  const filtered = useMemo(() => {
    return enriched.filter((b) => {
      const matchesPace = !pace || b.pace === pace
      const matchesInterest =
        !interest || b.interests.some((it) => it.toLowerCase() === interest.toLowerCase())
      const q = query.trim().toLowerCase()
      const matchesQuery =
        !q ||
        b.displayName.toLowerCase().includes(q) ||
        b.username.toLowerCase().includes(q) ||
        (b.mood ?? '').toLowerCase().includes(q) ||
        (b.city ?? '').toLowerCase().includes(q) ||
        (b.state ?? '').toLowerCase().includes(q) ||
        b.interests.some((it) => it.toLowerCase().includes(q))
      return matchesPace && matchesInterest && matchesQuery
    })
  }, [enriched, query, pace, interest])

  function pickInterest(it: string) {
    setInterest((cur) => (cur === it ? null : it))
  }

  async function handleSendCharm({ kind, payload }: { kind: CharmKind; payload: string }) {
    const buddy = charmFor
    if (!buddy?.reelThumbFrameId) return
    try {
      await sendReaction({
        reelFrameId: buddy.reelThumbFrameId,
        reactionType: kind,
        message: kind !== 'wave' ? payload : undefined,
      })
      setCharmed((prev) => new Set(prev).add(buddy.username))
    } catch {
      // non-blocking — the composer has already closed
    }
  }

  function setRadius(value: number | null) {
    if (value == null) {
      router.push('/browse')
    } else {
      router.push(`/browse?radius=${value}`)
    }
  }

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
              placeholder="search names, moods, or cities..."
              className="pl-9"
              aria-label="Search buddies"
            />
          </div>

          {viewerHasLocation && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Within</span>
              <div className="flex flex-wrap gap-2">
                {RADIUS_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.label}
                    selected={radiusMiles === opt.value}
                    onClick={() => setRadius(opt.value)}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {!viewerHasLocation && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} aria-hidden />
              <Link href="/onboarding?edit=1" className="underline hover:text-foreground">
                Add your city
              </Link>
              {' '}to filter by distance.
            </p>
          )}

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

          {interestOptions.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Into</span>
              <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                <Chip selected={interest === null} onClick={() => setInterest(null)}>
                  anything
                </Chip>
                {interestOptions.map((it) => (
                  <Chip key={it} selected={interest === it} onClick={() => pickInterest(it)}>
                    {it}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* List */}
        <div className="mt-5 flex flex-col gap-5">
          {filtered.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {filtered.map((b) => (
                <BuddyRow
                  key={b.username}
                  buddy={b}
                  onCharm={setCharmFor}
                  charmed={charmed.has(b.username)}
                  activeInterest={interest}
                  onPickInterest={pickInterest}
                />
              ))}
            </ul>
          ) : buddies.length === 0 ? (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
              <PixelStar size={14} className="text-[var(--mm-accent)]" />
              {radiusMiles != null
                ? `No one within ${radiusMiles} miles yet — try a wider range or add your city.`
                : 'No one here yet — be the first to set up your Vibe Page.'}
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
        onSend={handleSendCharm}
      />
    </div>
  )
}
