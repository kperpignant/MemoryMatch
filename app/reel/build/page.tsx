import { SiteHeader } from '@/components/site-header'
import { ReelBuilder } from '@/components/reel/reel-builder'
import { getBeats, getMyReel } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function ReelBuildPage() {
  const [beats, reel] = await Promise.all([getBeats(), getMyReel()])
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <ReelBuilder beats={beats} reel={reel} />
    </main>
  )
}
