/**
 * Place details proxy — resolves a Google place_id to city/state + lat/lng.
 */
import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { getPlaceLocation } from '@/lib/google-places'

export async function GET(req: Request) {
  try {
    await requireSession()
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
  const placeId = searchParams.get('placeId')?.trim()
  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 })
  }

  try {
    const location = await getPlaceLocation(placeId)
    return NextResponse.json(location)
  } catch (err) {
    console.error('[location/details]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not resolve location' },
      { status: 502 },
    )
  }
}
