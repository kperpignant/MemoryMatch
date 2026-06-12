import { Y2KWindow } from '@/components/y2k-window'
import { PixelDisc, PixelStar, PixelSparkle } from '@/components/pixel-icons'

const STEPS = [
  {
    icon: PixelDisc,
    title: 'Build your Memory Reel',
    body: 'Stitch together the snapshots, places, and tiny moments that actually feel like you — set to a beat.',
  },
  {
    icon: PixelStar,
    title: 'React to moments',
    body: 'Send a low-key wave, a sticker, or a note on the frame that caught your eye. No pressure, no scores.',
  },
  {
    icon: PixelSparkle,
    title: 'ReelChemistry',
    body: 'When two people light up at each other, you get a warm match with starters to break the ice.',
  },
]

export function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-12 md:py-16">
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          How it works
        </h2>
        <p className="text-pretty text-sm text-muted-foreground md:text-base">
          Three gentle steps. No swiping required.
        </p>
      </div>
      <ol className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon
          return (
            <li key={step.title}>
              <Y2KWindow title={`step ${i + 1}`} className="h-full">
                <div className="flex h-full flex-col gap-3 p-5">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <Icon size={22} />
                  </span>
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </Y2KWindow>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
