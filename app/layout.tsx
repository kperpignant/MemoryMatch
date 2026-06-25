import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Baloo_2, Onest, Space_Mono } from 'next/font/google'
import { DEFAULT_THEME_ID, getMyThemeId } from '@/lib/queries'
import './globals.css'

const baloo = Baloo_2({
  variable: '--font-baloo',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
})
const onest = Onest({
  variable: '--font-onest',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})
const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  subsets: ['latin'],
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'MemoryMatch — Less swiping. More story.',
  description:
    'Find chemistry through the moments that made you. A nostalgic, low-pressure way to connect through Memory Reels and Vibe Pages.',
}

export const viewport: Viewport = {
  themeColor: '#8E6FB0',
  width: 'device-width',
  initialScale: 1,
}

// Clerk keys arrive later — render without the provider until they exist so
// local dev and preview builds don't hard-fail.
const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Apply the signed-in user's chosen palette to every route. Server-rendered
  // on <html> so there's no theme flash on load. Profile pages (/me, /vibe)
  // still override this with the page owner's theme for their own subtree.
  const themeId = clerkConfigured ? await getMyThemeId() : DEFAULT_THEME_ID
  const body = (
    <html
      lang="en"
      data-theme={themeId}
      className={`${baloo.variable} ${onest.variable} ${spaceMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
  return clerkConfigured ? <ClerkProvider>{body}</ClerkProvider> : body
}
