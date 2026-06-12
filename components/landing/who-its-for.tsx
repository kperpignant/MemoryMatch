const AUDIENCES = [
  { label: 'The shy ones', sub: 'soft openers over cold DMs' },
  { label: 'Creatives', sub: 'show your work, not your stats' },
  { label: 'Tech folks', sub: 'people who love a good build' },
  { label: 'Gamers', sub: 'looking for player two' },
  { label: 'Nostalgic internet folks', sub: 'webcore hearts welcome' },
]

export function WhoItsFor() {
  return (
    <section className="bg-secondary/40 py-12 md:py-16">
      <div className="mx-auto w-full max-w-5xl px-4">
        <h2 className="font-heading mb-6 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Who it&apos;s for
        </h2>
        <ul className="flex flex-wrap justify-center gap-3">
          {AUDIENCES.map((a) => (
            <li
              key={a.label}
              className="y2k-bevel flex flex-col gap-0.5 rounded-xl border border-border bg-card px-4 py-3 text-card-foreground"
            >
              <span className="font-heading text-sm font-semibold">{a.label}</span>
              <span className="text-xs text-muted-foreground">{a.sub}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
