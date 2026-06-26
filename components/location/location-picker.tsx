'use client'

import * as React from 'react'
import { MapPin, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type LocationValue = {
  city: string
  state: string
  lat: number
  lng: number
}

type Suggestion = {
  placeId: string
  description: string
}

type LocationPickerProps = {
  value: LocationValue | null
  onChange: (value: LocationValue | null) => void
  disabled?: boolean
}

function formatLabel(loc: LocationValue): string {
  return `${loc.city}, ${loc.state}`
}

export function LocationPicker({ value, onChange, disabled }: LocationPickerProps) {
  const [query, setQuery] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [resolving, setResolving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [configured, setConfigured] = React.useState(true)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  React.useEffect(() => {
    if (disabled || value) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const q = query.trim()
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`)
        const data = (await res.json()) as {
          suggestions?: Suggestion[]
          error?: string
        }
        if (res.status === 503) {
          setConfigured(false)
          setSuggestions([])
          setOpen(false)
          return
        }
        if (!res.ok) throw new Error(data.error ?? 'Search failed')
        setSuggestions(data.suggestions ?? [])
        setOpen((data.suggestions?.length ?? 0) > 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setSuggestions([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, disabled, value])

  async function selectSuggestion(s: Suggestion) {
    setOpen(false)
    setQuery('')
    setSuggestions([])
    setResolving(true)
    setError(null)
    try {
      const res = await fetch(`/api/location/details?placeId=${encodeURIComponent(s.placeId)}`)
      const data = (await res.json()) as LocationValue & { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Could not resolve location')
      onChange({ city: data.city, state: data.state, lat: data.lat, lng: data.lng })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve location')
    } finally {
      setResolving(false)
    }
  }

  function clear() {
    onChange(null)
    setQuery('')
    setSuggestions([])
    setOpen(false)
    setError(null)
  }

  if (!configured) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Location</Label>
        <p className="text-xs text-muted-foreground">
          Location search is not available right now.
        </p>
      </div>
    )
  }

  if (value) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label>Location</Label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <MapPin size={16} className="shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex-1 text-sm text-foreground">{formatLabel(value)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Clear location"
            disabled={disabled || resolving}
            onClick={clear}
          >
            <X size={14} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          City-level only — we never show your exact address.
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5">
      <Label htmlFor="location-search">Location</Label>
      <div className="relative">
        <MapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          id="location-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Portland, OR"
          className="pl-9"
          disabled={disabled || resolving}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="location-suggestions"
        />
        {open && suggestions.length > 0 && (
          <ul
            id="location-suggestions"
            role="listbox"
            className="absolute top-full z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-popover py-1 shadow-md"
          >
            {suggestions.map((s) => (
              <li key={s.placeId} role="option">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted"
                  onClick={() => selectSuggestion(s)}
                >
                  {s.description}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p
        className={cn(
          'text-xs',
          error ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {error ??
          (resolving
            ? 'Looking up location…'
            : loading
              ? 'Searching…'
              : 'Optional — helps people nearby find you. City-level only.')}
      </p>
    </div>
  )
}
