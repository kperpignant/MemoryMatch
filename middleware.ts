/**
 * Route protection (PRD §31). Public: landing, auth pages, health check,
 * Clerk webhook. Everything else requires a session.
 *
 * Until Clerk keys are added to env, the middleware passes requests through so
 * the UI can be developed without auth — flip happens automatically once
 * NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/webhooks/clerk',
])

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default clerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) await auth.protect()
    })
  : () => NextResponse.next()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|wav|mp3)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
