import Link from 'next/link'
import { PixelHeart } from '@/components/pixel-icons'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
            <PixelHeart size={16} />
          </span>
          <span className="font-heading text-lg font-bold tracking-tight text-foreground">
            MemoryMatch
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/browse"
            className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Browse
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  )
}
