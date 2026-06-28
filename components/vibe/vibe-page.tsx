'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Y2KWindow } from '@/components/y2k-window'
import { PanelGrid } from '@/components/panel-grid'
import { ReelPlayer, type ReelFrame } from '@/components/reel-player'
import { SafetyMenu } from '@/components/safety-menu'
import { CharmComposer, type CharmKind } from '@/components/charm-composer'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/chip'
import {
  PixelHeart,
  PixelWave,
  PixelStar,
  PixelDisc,
} from '@/components/pixel-icons'
import { INTENTS, type IntentId } from '@/lib/memorymatch'
import { likeUser } from '@/lib/actions/likes'
import { sendReaction } from '@/lib/actions/reactions'

export type VibeProfile = {
  userId: string
  username: string
  displayName: string
  avatarUrl?: string
  pronouns?: string
  age?: number
  location?: string
  mood: string
  online?: boolean
  intents: IntentId[]
  blurb: string
  nowPlaying?: string
  reel: { frames: ReelFrame[]; beatLabel?: string; beatSrc?: string; beatStartSec?: number }
  interests: string[]
  top8: { username: string; displayName: string }[]
  prompts: { q: string; a: string }[]
  reelThumbFrameId?: string
  alreadyLiked?: boolean
  alreadyCharmed?: boolean
}

export function VibePage({
  profile,
  isOwner = false,
}: {
  profile: VibeProfile
  isOwner?: boolean
}) {
  const router = useRouter()
  const [charmOpen, setCharmOpen] = useState(false)
  const [liked, setLiked] = useState(profile.alreadyLiked ?? false)
  const [sentCharm, setSentCharm] = useState<CharmKind | null>(
    profile.alreadyCharmed ? 'wave' : null,
  )
  const [isLiking, startLikeTransition] = useTransition()
  const [likeError, setLikeError] = useState<string | null>(null)

  const intentLabels = profile.intents
    .map((id) => INTENTS.find((i) => i.id === id)?.label)
    .filter(Boolean) as string[]

  function handleLike() {
    if (liked || isLiking) return
    setLikeError(null)
    startLikeTransition(async () => {
      try {
        const result = await likeUser({ likedUserId: profile.userId })
        setLiked(true)
        if (result.matched) {
          router.push(`/chemistry/${result.matchId}`)
        }
      } catch (err) {
        setLikeError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  async function handleCharm({ kind, payload }: { kind: CharmKind; payload: string }) {
    if (!profile.reelThumbFrameId) return
    try {
      await sendReaction({
        reelFrameId: profile.reelThumbFrameId,
        reactionType: kind,
        message: kind !== 'wave' ? payload : undefined,
      })
      setSentCharm(kind)
    } catch {
      // non-blocking — charm UI already closed
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:py-10">
      <PanelGrid>
        {/* LEFT COLUMN */}
        <PanelGrid.Main>
          {/* Identity window */}
          <Y2KWindow title={`${profile.username}.vibe`} accent>
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="size-20 overflow-hidden rounded-2xl bg-secondary shadow-inner">
                  {profile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-2xl font-bold text-secondary-foreground">
                      {profile.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                {profile.online && (
                  <span
                    className="absolute -bottom-1 -right-1 size-5 rounded-full border-2 border-card bg-[var(--mm-match)]"
                    aria-label="Online now"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="font-serif text-2xl leading-tight text-foreground">
                    {profile.displayName}
                  </h1>
                  {!isOwner && (
                    <SafetyMenu name={profile.displayName} />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                  {profile.pronouns ? ` · ${profile.pronouns}` : ''}
                  {profile.age ? ` · ${profile.age}` : ''}
                  {profile.location ? ` · ${profile.location}` : ''}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-sm text-foreground">
                  <PixelStar size={14} className="text-[var(--mm-accent)]" />
                  <span className="font-medium">mood:</span> {profile.mood}
                </div>
              </div>
            </div>

            {intentLabels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {intentLabels.map((l) => (
                  <span
                    key={l}
                    className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {l}
                  </span>
                ))}
              </div>
            )}
          </Y2KWindow>

          {/* Memory Reel */}
          <Y2KWindow title="memory reel">
            <ReelPlayer
              frames={profile.reel.frames}
              beatLabel={profile.reel.beatLabel}
              beatSrc={profile.reel.beatSrc}
              beatStartSec={profile.reel.beatStartSec}
              autoPlay
            />
          </Y2KWindow>

          {/* Prompts */}
          <Y2KWindow title="a little about me">
            <div className="flex flex-col gap-4">
              <p className="text-pretty leading-relaxed text-foreground">{profile.blurb}</p>
              {profile.prompts.map((p) => (
                <div key={p.q} className="rounded-xl bg-secondary/30 p-4">
                  <p className="text-sm font-semibold text-[var(--mm-primary)]">{p.q}</p>
                  <p className="mt-1 text-pretty leading-relaxed text-foreground">{p.a}</p>
                </div>
              ))}
            </div>
          </Y2KWindow>
        </PanelGrid.Main>

        {/* RIGHT COLUMN */}
        <PanelGrid.Side>
          {/* Action card (hidden for owner) */}
          {!isOwner ? (
            <Y2KWindow title="say hi?" accent>
              <p className="text-sm text-muted-foreground">
                No swiping here. Send a charm or quietly like their page — if it&apos;s
                mutual, you&apos;ll both find out together.
              </p>
              {likeError && (
                <p className="mt-2 text-xs text-destructive">{likeError}</p>
              )}
              <div className="mt-4 flex flex-col gap-2.5">
                <Button
                  size="lg"
                  className="w-full font-semibold"
                  onClick={() => setCharmOpen(true)}
                  disabled={!profile.reelThumbFrameId}
                >
                  <PixelWave size={16} className="mr-1.5" />
                  {sentCharm ? 'Charm sent! send another?' : 'Send a charm'}
                </Button>
                <Button
                  size="lg"
                  variant={liked ? 'secondary' : 'outline'}
                  className="w-full font-semibold"
                  onClick={handleLike}
                  disabled={liked || isLiking}
                  aria-pressed={liked}
                >
                  <PixelHeart
                    size={16}
                    className="mr-1.5"
                  />
                  {isLiking ? 'Liking…' : liked ? 'Liked privately' : 'Like privately'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Likes are always private. No counts, no leaderboards.
                </p>
              </div>
            </Y2KWindow>
          ) : (
            <Y2KWindow title="your page" accent>
              <p className="text-sm text-muted-foreground">
                This is how others see your Vibe Page.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Button variant="outline" className="w-full" onClick={() => router.push('/onboarding?edit=1')}>
                  Edit profile
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/reel/build')}>
                  Edit memory reel
                </Button>
              </div>
            </Y2KWindow>
          )}

          {/* Now playing */}
          {profile.nowPlaying && (
            <Y2KWindow title="now playing">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-[var(--mm-primary)] text-[var(--mm-on-primary,white)]">
                  <PixelDisc size={20} className="text-primary-foreground" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{profile.nowPlaying}</p>
                  <p className="text-xs text-muted-foreground">on repeat lately</p>
                </div>
              </div>
            </Y2KWindow>
          )}

          {/* Interests / Top 8 things */}
          {profile.interests.length > 0 && (
            <Y2KWindow title="into lately">
              <ol className="flex flex-wrap gap-2">
                {profile.interests.map((it, i) => (
                  <li key={it}>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground">
                      <span className="grid size-4 place-items-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {i + 1}
                      </span>
                      {it}
                    </span>
                  </li>
                ))}
              </ol>
            </Y2KWindow>
          )}

          {/* Top 8 friends */}
          {profile.top8.length > 0 && (
            <Y2KWindow title="top 8">
              <ul className="grid grid-cols-4 gap-3">
                {profile.top8.map((f) => (
                  <li key={f.username} className="flex flex-col items-center gap-1 text-center">
                    <span className="grid size-12 place-items-center rounded-xl bg-secondary font-bold text-secondary-foreground">
                      {f.displayName.charAt(0)}
                    </span>
                    <span className="w-full truncate text-xs text-muted-foreground">
                      {f.displayName}
                    </span>
                  </li>
                ))}
              </ul>
            </Y2KWindow>
          )}
        </PanelGrid.Side>
      </PanelGrid>

      <CharmComposer
        open={charmOpen}
        onOpenChange={setCharmOpen}
        name={profile.displayName}
        onSend={handleCharm}
      />
    </div>
  )
}
