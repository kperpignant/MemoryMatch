'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs'
import { PixelHeart } from '@/components/pixel-icons'
import { cn } from '@/lib/utils'

const navLink =
  'rounded-lg px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

const navLinkActive = 'bg-muted text-foreground'

const navCta =
  'rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90'

export function SiteHeader() {
  const { signOut } = useClerk()
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
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
            className={cn(navLink, isActive('/browse') && navLinkActive)}
            aria-current={isActive('/browse') ? 'page' : undefined}
          >
            Browse
          </Link>
          <SignedIn>
            <Link
              href="/chemistry"
              className={cn(navLink, isActive('/chemistry') && navLinkActive)}
              aria-current={isActive('/chemistry') ? 'page' : undefined}
            >
              Charms
            </Link>
            <Link
              href="/me"
              className={cn(navLink, isActive('/me') && navLinkActive)}
              aria-current={isActive('/me') ? 'page' : undefined}
            >
              My page
            </Link>
            <button
              type="button"
              className={navLink}
              onClick={() => signOut({ redirectUrl: '/' })}
            >
              Sign out
            </button>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className={navLink}>
              Log in
            </Link>
            <Link href="/sign-up" className={navCta}>
              Sign up
            </Link>
          </SignedOut>
        </nav>
      </div>
    </header>
  )
}
