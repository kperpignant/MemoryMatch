import { redirect } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { VibePage, type VibeProfile } from '@/components/vibe/vibe-page'
import { getMyProfile, getVibePage } from '@/lib/queries'
import type { IntentId } from '@/lib/memorymatch'

export const dynamic = 'force-dynamic'

export default async function MyVibePage() {
  const me = await getMyProfile()
  if (!me) redirect('/onboarding')

  const data = await getVibePage(me.username)
  if (!data) redirect('/onboarding')

  const toUiId = (v: string) => v.replace(/_/g, '-')

  const profile: VibeProfile = {
    userId: data.userId,
    username: data.username,
    displayName: data.displayName,
    avatarUrl: data.avatar ?? undefined,
    mood: data.mood ?? '',
    location:
      data.city && data.state ? `${data.city}, ${data.state}` : undefined,
    intents: [toUiId(data.intent) as IntentId],
    blurb: data.bio ?? '',
    interests: data.interests,
    top8: [],
    prompts: data.prompts.map((p) => ({ q: p.question, a: p.answer })),
    reelThumbFrameId: data.reel?.frames[0]?.id,
    reel: data.reel
      ? {
          beatLabel: data.reel.beat?.title ?? undefined,
          frames: data.reel.frames.map((f) => ({
            src: f.src,
            caption: f.caption ?? undefined,
            duration: Math.round(f.durationMs / 1000),
          })),
        }
      : { frames: [] },
  }

  return (
    <main className="min-h-dvh bg-background text-foreground" data-theme={toUiId(data.theme)}>
      <SiteHeader />
      <VibePage profile={profile} isOwner />
    </main>
  )
}
