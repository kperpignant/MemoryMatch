import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { Y2KWindow } from '@/components/y2k-window'
import { ButtonLink } from '@/components/button-link'
import { MatchList } from '@/components/chemistry/match-list'
import { PixelWave, PixelStar } from '@/components/pixel-icons'
import { getMyChemistry } from '@/lib/queries'

export const dynamic = 'force-dynamic'

const CHARM_LABEL: Record<string, string> = {
  wave: 'waved at you',
  charm: 'sent you a charm',
  sticker: 'sent you a sticker',
  note: 'left you a note',
}

export default async function ChemistryHomePage() {
  const { activeMatches, receivedCharms } = await getMyChemistry()

  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <div className="mx-auto w-full max-w-xl px-4 py-8 md:py-12">
        <div className="mb-6">
          <h1 className="font-serif text-3xl text-foreground">ReelChemistry</h1>
          <p className="mt-1 text-pretty text-muted-foreground">
            Your matches and the charms people have quietly sent your way. Charms are
            private — only you can see them, no counts or rankings.
          </p>
        </div>

        {/* Current matches (up to 5) */}
        <Y2KWindow title="your matches" accent>
          <MatchList matches={activeMatches} />
        </Y2KWindow>

        {/* Received charms (private) */}
        <Y2KWindow title="charms received" className="mt-5">
          {receivedCharms.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {receivedCharms.map((c) => (
                <li
                  key={c.fromUserId}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-2.5"
                >
                  <Link
                    href={`/vibe/${c.username}`}
                    className="relative size-12 shrink-0 overflow-hidden rounded-lg"
                  >
                    {c.reelThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.reelThumb} alt="" className="size-full object-cover" />
                    ) : (
                      <span className="grid size-full place-items-center bg-secondary text-base font-bold text-secondary-foreground">
                        {c.displayName.charAt(0)}
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/vibe/${c.username}`}
                      className="block truncate font-medium text-foreground hover:underline"
                    >
                      {c.displayName}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">
                      {CHARM_LABEL[c.kind] ?? 'sent you a charm'}
                      {c.message ? ` — “${c.message}”` : ''}
                    </p>
                  </div>
                  <ButtonLink href={`/vibe/${c.username}`} variant="outline" size="sm" className="shrink-0">
                    <PixelWave size={14} className="mr-1" />
                    View
                  </ButtonLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center justify-center gap-2 rounded-xl bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
              <PixelStar size={14} className="text-[var(--mm-accent)]" />
              No charms yet — set up a great reel and they&apos;ll come.
            </p>
          )}
        </Y2KWindow>
      </div>
    </main>
  )
}
