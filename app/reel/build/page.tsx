import { SiteHeader } from '@/components/site-header'
import { ReelBuilder } from '@/components/reel/reel-builder'
import { getBeats } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function ReelBuildPage() {
  const beats = await getBeats()
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <ReelBuilder beats={beats} />
    </main>
  )
}
