import Image from 'next/image'
import { ButtonLink } from '@/components/button-link'
import { Y2KWindow } from '@/components/y2k-window'
import { PixelDisc, PixelHeart, PixelSparkle } from '@/components/pixel-icons'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 py-12 md:grid-cols-2 md:py-20">
        <div className="flex flex-col items-start gap-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <PixelSparkle size={13} className="text-primary" />
            Soft Launch — low pressure, no swiping
          </span>
          <h1 className="font-heading text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            Less swiping. <span className="text-primary">More story.</span>
          </h1>
          <p className="text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            Find chemistry through the moments that made you. Build a Memory Reel,
            react to the moments you love, and let ReelChemistry do the rest.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink size="lg" className="font-semibold" href="/onboarding">
              <PixelHeart size={16} className="mr-1" />
              Make your Vibe Page
            </ButtonLink>
            <ButtonLink
              size="lg"
              variant="outline"
              className="font-semibold"
              href="/browse"
            >
              Take a peek around
            </ButtonLink>
          </div>
          <p className="text-xs text-muted-foreground">
            18+ only. No public like counts, ever.
          </p>
        </div>

        <Y2KWindow
          title="memory-reel.exe"
          icon={<PixelDisc size={14} />}
          className="mx-auto w-full max-w-sm"
        >
          <div className="relative aspect-[4/5] w-full">
            <Image
              src="/reels/bedroom-setup.png"
              alt="A cozy Y2K bedroom desk setup featured in a Memory Reel"
              fill
              priority
              sizes="(min-width: 768px) 24rem, 90vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 to-transparent p-3">
              <p className="font-heading text-sm font-semibold text-background">
                where i make all my mixtapes
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <span className="text-xs font-medium text-muted-foreground">
              4 frames · lo-fi beat
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-match px-2.5 py-1 text-xs font-semibold text-match-foreground">
              <PixelHeart size={12} /> charm sent
            </span>
          </div>
        </Y2KWindow>
      </div>
    </section>
  )
}
