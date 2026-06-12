import { SiteHeader } from '@/components/site-header'
import { ReelBuilder } from '@/components/reel/reel-builder'

export default function ReelBuildPage() {
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <ReelBuilder />
    </main>
  )
}
