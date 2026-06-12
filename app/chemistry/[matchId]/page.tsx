import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { ChemistryScreen, type MatchData } from '@/components/chemistry/chemistry-screen'
import { getChemistry } from '@/lib/queries'

export default async function ChemistryPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const data = await getChemistry(matchId)
  if (!data) notFound()

  const match: MatchData = {
    you: {
      displayName: data.you.displayName,
      reelThumb: data.you.reelThumb ?? '/placeholder.svg',
    },
    them: {
      username: data.them.username,
      displayName: data.them.displayName,
      reelThumb: data.them.reelThumb ?? '/placeholder.svg',
      mood: data.them.mood ?? '',
    },
    sharedInterests: [],
    starters: data.starters.map((s) => s.text),
  }

  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <ChemistryScreen match={match} />
    </main>
  )
}
