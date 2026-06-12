import Link from 'next/link'
import { PixelHeart } from '@/components/pixel-icons'

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <PixelHeart size={13} />
            </span>
            <span className="font-heading text-sm font-bold text-foreground">
              MemoryMatch
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            18+ only. Be kind — this is a low-pressure space.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link
            href="/terms"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/guidelines"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Community Guidelines
          </Link>
        </nav>
      </div>
    </footer>
  )
}
