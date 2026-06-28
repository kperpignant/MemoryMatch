import { SiteHeader } from '@/components/site-header'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { getBlockedUsers } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const blocked = await getBlockedUsers()

  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <SettingsPanel blocked={blocked} />
    </main>
  )
}
