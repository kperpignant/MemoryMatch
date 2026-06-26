/**
 * Server-side Google Places helpers — API key never exposed to the client.
 */

const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json'

function apiKey(): string {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) throw new Error('GOOGLE_MAPS_API_KEY is not configured')
  return key
}

export type PlaceSuggestion = {
  placeId: string
  description: string
}

export type PlaceLocation = {
  city: string
  state: string
  lat: number
  lng: number
}

export async function searchCities(query: string): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams({
    input: q,
    types: '(cities)',
    components: 'country:us',
    key: apiKey(),
  })

  const res = await fetch(`${AUTOCOMPLETE_URL}?${params}`)
  if (!res.ok) throw new Error(`Places autocomplete failed: ${res.status}`)

  const data = (await res.json()) as {
    status: string
    predictions?: { place_id: string; description: string }[]
    error_message?: string
  }

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(data.error_message ?? `Places autocomplete: ${data.status}`)
  }

  return (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
  }))
}

export async function getPlaceLocation(placeId: string): Promise<PlaceLocation> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'geometry,address_component',
    key: apiKey(),
  })

  const res = await fetch(`${DETAILS_URL}?${params}`)
  if (!res.ok) throw new Error(`Place details failed: ${res.status}`)

  const data = (await res.json()) as {
    status: string
    result?: {
      geometry?: { location?: { lat: number; lng: number } }
      address_components?: { long_name: string; short_name: string; types: string[] }[]
    }
    error_message?: string
  }

  if (data.status !== 'OK' || !data.result) {
    throw new Error(data.error_message ?? `Place details: ${data.status}`)
  }

  const components = data.result.address_components ?? []
  const city =
    components.find((c) => c.types.includes('locality'))?.long_name ??
    components.find((c) => c.types.includes('sublocality'))?.long_name ??
    components.find((c) => c.types.includes('administrative_area_level_3'))?.long_name ??
    ''
  const state =
    components.find((c) => c.types.includes('administrative_area_level_1'))?.short_name ?? ''

  const lat = data.result.geometry?.location?.lat
  const lng = data.result.geometry?.location?.lng

  if (!city || !state || lat == null || lng == null) {
    throw new Error('Could not resolve city/state coordinates for this place')
  }

  return { city, state, lat, lng }
}
