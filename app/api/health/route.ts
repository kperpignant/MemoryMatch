/**
 * Health check (PRD §34) — verifies the app is up and Aurora is reachable.
 * Public route; safe to point uptime monitors at.
 */
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const base = { service: 'memorymatch', time: new Date().toISOString() }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ...base, status: 'degraded', database: 'not configured' })
  }

  try {
    await db().execute(sql`select 1`)
    return NextResponse.json({ ...base, status: 'ok', database: 'ok' })
  } catch (err) {
    return NextResponse.json(
      { ...base, status: 'error', database: err instanceof Error ? err.message : 'unreachable' },
      { status: 503 },
    )
  }
}
