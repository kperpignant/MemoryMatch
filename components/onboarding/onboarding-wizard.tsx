'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Chip } from '@/components/chip'
import { Y2KWindow } from '@/components/y2k-window'
import { PixelHeart, PixelStar, PixelSparkle } from '@/components/pixel-icons'
import {
  INTENTS,
  THEMES,
  SUGGESTED_INTERESTS,
  type IntentId,
  type ThemeId,
} from '@/lib/memorymatch'
import { cn } from '@/lib/utils'
import { LocationPicker, type LocationValue } from '@/components/location/location-picker'
import { ZODIAC_SIGNS, SIGN_META } from '@/lib/horoscope'

export type OnboardingData = {
  username: string
  displayName: string
  avatarUrl: string
  dateOfBirth: string
  intents: IntentId[]
  softLaunch: boolean
  theme: ThemeId
  bio: string
  mood: string
  interests: string[]
  city?: string
  state?: string
  lat?: number
  lng?: number
  sunSign?: string
  moonSign?: string
  risingSign?: string
  showHoroscope?: boolean
}

function isAtLeast18(dobIso: string): boolean {
  const dob = new Date(dobIso)
  if (Number.isNaN(dob.getTime())) return false
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return dob <= cutoff
}

function maxDobFor18Plus(): string {
  const cutoff = new Date()
  cutoff.setFullYear(cutoff.getFullYear() - 18)
  return cutoff.toISOString().slice(0, 10)
}

const STEP_TITLES = ['Your name', 'Your vibe', 'Your look', 'Your top 8']

export function OnboardingWizard({
  onComplete,
  initial,
  submitLabel,
  onExit,
  lockIdentity = false,
}: {
  onComplete?: (data: OnboardingData) => void
  /** Prefilled values for edit mode (Vibe Page → Edit profile). */
  initial?: Partial<OnboardingData>
  /** Override the final button label (e.g. "Save changes" when editing). */
  submitLabel?: string
  /** When set, the first-step Back button becomes "Exit" (e.g. cancel an edit). */
  onExit?: () => void
  /** Lock identity fields (username, date of birth) — used when editing an
   *  existing profile so they can only be set once, at signup. */
  lockIdentity?: boolean
}) {
  const [step, setStep] = React.useState(0)
  const [username, setUsername] = React.useState(initial?.username ?? '')
  const [displayName, setDisplayName] = React.useState(initial?.displayName ?? '')
  const [avatarUrl, setAvatarUrl] = React.useState(initial?.avatarUrl ?? '')
  const [dateOfBirth, setDateOfBirth] = React.useState(initial?.dateOfBirth ?? '')
  const [intents, setIntents] = React.useState<IntentId[]>(initial?.intents ?? ['slow-burn'])
  const [softLaunch, setSoftLaunch] = React.useState(initial?.softLaunch ?? true)
  const [theme, setTheme] = React.useState<ThemeId>(initial?.theme ?? 'soft-pixel-romance')
  const [bio, setBio] = React.useState(initial?.bio ?? '')
  const [mood, setMood] = React.useState(initial?.mood ?? '')
  const [interests, setInterests] = React.useState<string[]>(initial?.interests ?? [])
  const [location, setLocation] = React.useState<LocationValue | null>(() => {
    if (initial?.city && initial?.state && initial.lat != null && initial.lng != null) {
      return {
        city: initial.city,
        state: initial.state,
        lat: initial.lat,
        lng: initial.lng,
      }
    }
    return null
  })
  const [sunSign, setSunSign] = React.useState<string | undefined>(initial?.sunSign)
  const [moonSign, setMoonSign] = React.useState<string | undefined>(initial?.moonSign)
  const [risingSign, setRisingSign] = React.useState<string | undefined>(initial?.risingSign)
  const [showHoroscope, setShowHoroscope] = React.useState(initial?.showHoroscope ?? true)

  // ---- username validation ----
  const usernameError = React.useMemo(() => {
    if (!username) return null
    if (username.length < 3) return 'At least 3 characters.'
    if (!/^[a-z0-9_-]+$/.test(username))
      return 'Lowercase letters, numbers, hyphens, and underscores only.'
    return null
  }, [username])

  const dateOfBirthError = React.useMemo(() => {
    if (!dateOfBirth) return null
    if (!isAtLeast18(dateOfBirth)) return 'You must be at least 18 to join.'
    return null
  }, [dateOfBirth])

  const step1Valid =
    username.length >= 3 &&
    !usernameError &&
    displayName.trim().length > 0 &&
    dateOfBirth.length > 0 &&
    !dateOfBirthError

  function toggleIntent(id: IntentId) {
    setIntents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function toggleInterest(label: string) {
    setInterests((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : prev.length >= 8
          ? prev
          : [...prev, label],
    )
  }

  const canAdvance = step === 0 ? step1Valid : true
  const isLast = step === 3

  function next() {
    if (isLast) {
      onComplete?.({
        username,
        displayName,
        avatarUrl,
        dateOfBirth,
        intents,
        softLaunch,
        theme,
        bio,
        mood,
        interests,
        sunSign,
        moonSign,
        risingSign,
        showHoroscope,
        ...(location
          ? { city: location.city, state: location.state, lat: location.lat, lng: location.lng }
          : {}),
      })
      return
    }
    setStep((s) => Math.min(3, s + 1))
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 text-foreground" data-theme={theme}>
      {/* progress */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Step {step + 1} of 4 · {STEP_TITLES[step]}
          </span>
          <span>{Math.round(((step + 1) / 4) * 100)}%</span>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-2 flex-1 rounded-full transition-colors',
                i <= step ? 'bg-primary' : 'bg-muted',
              )}
            />
          ))}
        </div>
      </div>

      <Y2KWindow
        title="setup-wizard.exe"
        icon={<PixelSparkle size={14} />}
        bodyClassName="p-5"
      >
        {step === 0 && (
          <StepName
            username={username}
            setUsername={(v) => setUsername(v.toLowerCase())}
            usernameError={usernameError}
            displayName={displayName}
            setDisplayName={setDisplayName}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            dateOfBirthError={dateOfBirthError}
            location={location}
            setLocation={setLocation}
            lockIdentity={lockIdentity}
          />
        )}
        {step === 1 && (
          <StepVibe
            intents={intents}
            toggleIntent={toggleIntent}
            softLaunch={softLaunch}
            setSoftLaunch={setSoftLaunch}
          />
        )}
        {step === 2 && (
          <StepLook
            theme={theme}
            setTheme={setTheme}
            bio={bio}
            setBio={setBio}
            mood={mood}
            setMood={setMood}
            sunSign={sunSign}
            setSunSign={setSunSign}
            moonSign={moonSign}
            setMoonSign={setMoonSign}
            risingSign={risingSign}
            setRisingSign={setRisingSign}
            showHoroscope={showHoroscope}
            setShowHoroscope={setShowHoroscope}
          />
        )}
        {step === 3 && (
          <StepInterests
            interests={interests}
            setInterests={setInterests}
            toggleInterest={toggleInterest}
          />
        )}
      </Y2KWindow>

      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => (step === 0 ? onExit?.() : setStep((s) => Math.max(0, s - 1)))}
          disabled={step === 0 && !onExit}
        >
          {step === 0 && onExit ? 'Exit' : 'Back'}
        </Button>
        <Button onClick={next} disabled={!canAdvance} className="font-semibold">
          {isLast ? (
            <>
              <PixelHeart size={15} className="mr-1" /> {submitLabel ?? 'Finish setup'}
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  )
}

/* ---------------- Step 1: name ---------------- */
function StepName({
  username,
  setUsername,
  usernameError,
  displayName,
  setDisplayName,
  avatarUrl,
  setAvatarUrl,
  dateOfBirth,
  setDateOfBirth,
  dateOfBirthError,
  location,
  setLocation,
  lockIdentity,
}: {
  username: string
  setUsername: (v: string) => void
  usernameError: string | null
  displayName: string
  setDisplayName: (v: string) => void
  avatarUrl: string
  setAvatarUrl: (v: string) => void
  dateOfBirth: string
  setDateOfBirth: (v: string) => void
  dateOfBirthError: string | null
  location: LocationValue | null
  setLocation: (v: LocationValue | null) => void
  lockIdentity: boolean
}) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
      setAvatarUrl(data.url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Let&apos;s claim your corner
        </h1>
        <p className="text-sm text-muted-foreground">
          No pressure — you can change all of this later.
        </p>
      </header>

      <div className="flex items-center gap-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-secondary shadow-inner">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Your profile picture" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-2xl font-bold text-secondary-foreground">
              {(displayName.charAt(0) || '?').toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
          </Button>
          {avatarUrl && !uploading && (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setAvatarUrl('')}
            >
              Remove
            </button>
          )}
          <p className={cn('text-xs', uploadError ? 'text-destructive' : 'text-muted-foreground')}>
            {uploadError ?? 'Square images look best.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="username">Username</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">@</span>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="mixtape_kid"
            aria-invalid={!!usernameError}
            aria-describedby="username-help"
            autoComplete="off"
            disabled={lockIdentity}
          />
        </div>
        <p
          id="username-help"
          className={cn(
            'text-xs',
            usernameError ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {lockIdentity
            ? 'Your handle is permanent — it can’t be changed.'
            : (usernameError ??
              (username.length >= 3
                ? 'Looks good — this is your vibe.gg/@handle.'
                : 'Lowercase letters, numbers, hyphens, underscores.'))}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Robin"
          maxLength={40}
        />
        <p className="text-xs text-muted-foreground">
          What people see on your Vibe Page.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input
          id="dateOfBirth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          max={maxDobFor18Plus()}
          aria-invalid={!!dateOfBirthError}
          aria-describedby="dob-help"
          required
          disabled={lockIdentity}
        />
        <p
          id="dob-help"
          className={cn(
            'text-xs',
            dateOfBirthError ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {lockIdentity
            ? 'Date of birth can’t be changed after signup.'
            : (dateOfBirthError ?? 'You must be 18 or older to use MemoryMatch.')}
        </p>
      </div>

      <LocationPicker value={location} onChange={setLocation} />
    </div>
  )
}

/* ---------------- Step 2: vibe ---------------- */
function StepVibe({
  intents,
  toggleIntent,
  softLaunch,
  setSoftLaunch,
}: {
  intents: IntentId[]
  toggleIntent: (id: IntentId) => void
  softLaunch: boolean
  setSoftLaunch: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-bold text-foreground">
          What are you here for?
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick as many as feel true. This just helps set the tone.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {INTENTS.map((intent) => (
          <Chip
            key={intent.id}
            selected={intents.includes(intent.id)}
            onClick={() => toggleIntent(intent.id)}
            title={intent.hint}
          >
            {intent.label}
          </Chip>
        ))}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-4">
        <Switch
          checked={softLaunch}
          onCheckedChange={setSoftLaunch}
          aria-label="Soft Launch Mode"
          className="mt-0.5"
        />
        <span className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
            <PixelStar size={14} className="text-primary" />
            Soft Launch Mode
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
              recommended
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            Softer, lower-pressure interactions. No like counts, gentler
            prompts, and a calmer pace.
          </span>
        </span>
      </label>
    </div>
  )
}

/* ---------------- Step 3: look ---------------- */
function StepLook({
  theme,
  setTheme,
  bio,
  setBio,
  mood,
  setMood,
  sunSign,
  setSunSign,
  moonSign,
  setMoonSign,
  risingSign,
  setRisingSign,
  showHoroscope,
  setShowHoroscope,
}: {
  theme: ThemeId
  setTheme: (t: ThemeId) => void
  bio: string
  setBio: (v: string) => void
  mood: string
  setMood: (v: string) => void
  sunSign?: string
  setSunSign: (v: string | undefined) => void
  moonSign?: string
  setMoonSign: (v: string | undefined) => void
  risingSign?: string
  setRisingSign: (v: string | undefined) => void
  showHoroscope: boolean
  setShowHoroscope: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Pick your look
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a theme — your whole Vibe Page recolors to match.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {THEMES.map((t) => {
          const active = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={active}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:bg-muted',
              )}
            >
              <span className="flex shrink-0 overflow-hidden rounded-lg border border-border">
                {t.swatch.map((c, i) => (
                  <span
                    key={i}
                    className="size-6"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-foreground">
                  {t.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {t.blurb}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="bio">Short bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="collector of small moments + lo-fi loops"
          rows={3}
          maxLength={160}
        />
        <p className="text-right text-xs text-muted-foreground">
          {bio.length}/160
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mood">Mood status</Label>
        <Input
          id="mood"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="brb, building a reel 💿"
          maxLength={60}
        />
        <p className="text-xs text-muted-foreground">
          AIM-style away message. Set the mood.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <Label>Your stars ✨</Label>
            <p className="text-xs text-muted-foreground">
              Optional — add your big three.
            </p>
          </div>
          <Switch
            checked={showHoroscope}
            onCheckedChange={setShowHoroscope}
            aria-label="Show horoscope on your Vibe Page"
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SignSelect label="Sun ☉" value={sunSign} onChange={setSunSign} />
          <SignSelect label="Moon ☾" value={moonSign} onChange={setMoonSign} />
          <SignSelect label="Rising ↑" value={risingSign} onChange={setRisingSign} />
        </div>
        <p className="text-xs text-muted-foreground">
          {showHoroscope
            ? 'Your signs show on your Vibe Page.'
            : 'Hidden for now — flip the switch to show them.'}
        </p>
      </div>
    </div>
  )
}

function SignSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value?: string
  onChange: (v: string | undefined) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">—</option>
        {ZODIAC_SIGNS.map((s) => (
          <option key={s} value={s}>
            {SIGN_META[s].label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ---------------- Step 4: interests (Top 8, drag to reorder) ---------------- */
function StepInterests({
  interests,
  setInterests,
  toggleInterest,
}: {
  interests: string[]
  setInterests: React.Dispatch<React.SetStateAction<string[]>>
  toggleInterest: (label: string) => void
}) {
  const [query, setQuery] = React.useState('')
  const [dragIndex, setDragIndex] = React.useState<number | null>(null)

  const filtered = SUGGESTED_INTERESTS.filter(
    (i) =>
      i.toLowerCase().includes(query.toLowerCase()) && !interests.includes(i),
  )

  const canAddCustom =
    query.trim().length > 0 &&
    !SUGGESTED_INTERESTS.some(
      (i) => i.toLowerCase() === query.trim().toLowerCase(),
    ) &&
    !interests.some((i) => i.toLowerCase() === query.trim().toLowerCase())

  function addCustom() {
    if (!canAddCustom || interests.length >= 8) return
    setInterests((prev) => [...prev, query.trim()])
    setQuery('')
  }

  function reorder(from: number, to: number) {
    if (from === to) return
    setInterests((prev) => {
      const copy = [...prev]
      const [moved] = copy.splice(from, 1)
      copy.splice(to, 0, moved)
      return copy
    })
  }

  function move(index: number, dir: -1 | 1) {
    const to = index + dir
    if (to < 0 || to >= interests.length) return
    reorder(index, to)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Your Top 8 interests
        </h1>
        <p className="text-sm text-muted-foreground">
          Pick up to 8 and drag to rank them. These power your matches.
        </p>
      </header>

      {/* selected / ranked list */}
      {interests.length > 0 && (
        <ol className="flex flex-col gap-2">
          {interests.map((label, i) => (
            <li
              key={label}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, i)
                setDragIndex(null)
              }}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 pl-3',
                dragIndex === i && 'opacity-50',
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span className="flex-1 truncate text-sm font-medium text-card-foreground">
                {label}
              </span>
              <span className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${label} up`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move ${label} down`}
                  disabled={i === interests.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${label}`}
                  onClick={() => toggleInterest(label)}
                >
                  ✕
                </Button>
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs text-muted-foreground">
        {interests.length}/8 chosen
        <span aria-hidden="true" className="mx-1">
          ·
        </span>
        <span className="text-muted-foreground/80">
          tip: drag rows or use the arrows to reorder
        </span>
      </p>

      {/* search + add */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canAddCustom) {
                e.preventDefault()
                addCustom()
              }
            }}
            placeholder="Search or add your own…"
            aria-label="Search interests"
            disabled={interests.length >= 8}
          />
          {canAddCustom && interests.length < 8 && (
            <Button variant="secondary" onClick={addCustom}>
              Add
            </Button>
          )}
        </div>

        {interests.length < 8 && (
          <div className="flex flex-wrap gap-2">
            {filtered.slice(0, 14).map((label) => (
              <Chip key={label} onClick={() => toggleInterest(label)}>
                + {label}
              </Chip>
            ))}
            {filtered.length === 0 && !canAddCustom && (
              <p className="text-xs text-muted-foreground">
                No matches — type to add a custom one.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
