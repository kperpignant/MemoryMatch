import { SiteHeader } from '@/components/site-header'
import { BrowseList } from '@/components/browse/browse-list'
import { getBrowseList } from '@/lib/queries'

export default async function BrowsePage() {
  const buddies = await getBrowseList()
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <BrowseList buddies={buddies} />
    </main>
  )
}
