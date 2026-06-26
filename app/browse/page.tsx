import { SiteHeader } from '@/components/site-header'
import { BrowseList } from '@/components/browse/browse-list'
import { getBrowseList, viewerHasLocation } from '@/lib/queries'

export const dynamic = 'force-dynamic'

const VALID_RADIUS = new Set([10, 25, 50, 100])

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ radius?: string }>
}) {
  const { radius: radiusParam } = await searchParams
  const parsed = radiusParam ? Number.parseInt(radiusParam, 10) : undefined
  const maxDistanceMiles =
    parsed != null && VALID_RADIUS.has(parsed) ? parsed : undefined

  const [buddies, hasLocation] = await Promise.all([
    getBrowseList(maxDistanceMiles != null ? { maxDistanceMiles } : undefined),
    viewerHasLocation(),
  ])

  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <BrowseList
        buddies={buddies}
        radiusMiles={maxDistanceMiles ?? null}
        viewerHasLocation={hasLocation}
      />
    </main>
  )
}
