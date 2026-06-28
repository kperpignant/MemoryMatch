import Link from 'next/link'
import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:py-14">
        <p className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            ← Home
          </Link>
        </p>
        <h1 className="mt-4 font-serif text-3xl text-foreground md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
        <article className="prose prose-sm mt-8 max-w-none space-y-4 text-foreground [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:text-muted-foreground [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
