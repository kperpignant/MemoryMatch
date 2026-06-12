import { SiteHeader } from '@/components/site-header'
import { VibePage, type VibeProfile } from '@/components/vibe/vibe-page'
import { SAMPLE_PROFILES } from '@/lib/memorymatch'

export default async function VibeProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  await params // username reserved for backend lookup later
  const profile = SAMPLE_PROFILES.robin as unknown as VibeProfile

  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <VibePage profile={profile} />
    </main>
  )
}
