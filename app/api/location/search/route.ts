/**
 * City search proxy — Google Places Autocomplete (US cities only).
 * Keeps GOOGLE_MAPS_API_KEY server-side.
 */
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { searchCities } from '@/lib/google-places'

export async function GET(req: Request) {
  try {
    await requireUser()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: 'Location search not configured — set GOOGLE_MAPS_API_KEY' },
      { status: 503 },
    )
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  if (q.trim().length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const suggestions = await searchCities(q)
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error('[location/search]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Search failed' },
      { status: 502 },
    )
  }
}
