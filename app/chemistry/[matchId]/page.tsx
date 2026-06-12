import { SiteHeader } from '@/components/site-header'
import { ChemistryScreen, type MatchData } from '@/components/chemistry/chemistry-screen'

const SAMPLE_MATCH: MatchData = {
  you: { displayName: 'You', reelThumb: '/reels/cafe-window.png' },
  them: {
    username: 'pixelpetal',
    displayName: 'Mira',
    reelThumb: '/reels/bedroom-setup.png',
    mood: 'drawing tiny worlds',
  },
  sharedInterests: ['pixel art', 'lo-fi beats', 'thrifting', 'cozy games'],
  starters: [
    'Okay, your reel gave me actual nostalgia. Where was that bedroom shot taken?',
    "We're clearly both into pixel art — what are you making lately?",
    'Trade you a lo-fi recommendation for a thrift store tip?',
  ],
}

export default async function ChemistryPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  await params // matchId reserved for backend lookup later
  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <ChemistryScreen match={SAMPLE_MATCH} />
    </main>
  )
}
