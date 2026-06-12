import { SiteHeader } from '@/components/site-header'
import { BrowseList } from '@/components/browse/browse-list'

export default function BrowsePage() {
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <BrowseList />
    </main>
  )
}
