'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, useClerk } from '@clerk/nextjs'
import { PixelHeart } from '@/components/pixel-icons'
import { cn } from '@/lib/utils'

const navLink =
  'rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3'

const navLinkActive = 'bg-muted text-foreground'

const navCta =
  'rounded-lg bg-primary px-2.5 py-1.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:px-3'

export function SiteHeader() {
  const { signOut } = useClerk()
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <PixelHeart size={16} />
          </span>
          <span className="hidden truncate font-heading text-base font-bold tracking-tight text-foreground sm:inline sm:text-lg">
            MemoryMatch
          </span>
        </Link>
        <nav className="ml-auto flex min-w-0 items-center gap-0.5 text-sm sm:gap-1">
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
              <span className="sm:hidden">Chemistry</span>
              <span className="hidden sm:inline">ReelChemistry</span>
            </Link>
            <Link
              href="/me"
              className={cn(navLink, isActive('/me') && navLinkActive)}
              aria-current={isActive('/me') ? 'page' : undefined}
            >
              <span className="sm:hidden">Me</span>
              <span className="hidden sm:inline">My page</span>
            </Link>
            <Link
              href="/settings"
              className={cn(navLink, isActive('/settings') && navLinkActive)}
              aria-current={isActive('/settings') ? 'page' : undefined}
            >
              <span className="max-md:hidden">Settings</span>
              <span className="md:hidden">Set</span>
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
