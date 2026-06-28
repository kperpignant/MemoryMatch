'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Y2KWindow } from '@/components/y2k-window'
import { ReelPlayer, type ReelFrame } from '@/components/reel-player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { PixelDisc, PixelStar } from '@/components/pixel-icons'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Check,
  Upload,
  Loader2,
  Play,
  Square,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveReel } from '@/lib/actions/reels'

type Beat = { id: string; title: string; vibe: string; audioUrl: string }
type SavedReel = {
  beatId: string | null
  beatStartSec: number
  frames: { src: string; caption: string; duration: number }[]
}

// Sample clips a user could pull from their camera roll.
const GALLERY = [
  '/reels/sunset-drive.png',
  '/reels/arcade-night.png',
  '/reels/bedroom-setup.png',
  '/reels/polaroid-pile.png',
  '/reels/skate-park.png',
  '/reels/cafe-window.png',
]

type EditorFrame = ReelFrame & { id: string }

let uid = 0
const newId = () => `f${++uid}`

export function ReelBuilder({ beats, reel }: { beats: Beat[]; reel?: SavedReel | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Hydrate from the saved reel so edits reload from the DB rather than reset
  // to defaults; fall back to a starter frame only for a brand-new reel.
  const [frames, setFrames] = useState<EditorFrame[]>(() =>
    reel && reel.frames.length > 0
      ? reel.frames.map((f) => ({ id: newId(), src: f.src, caption: f.caption, duration: f.duration }))
      : [{ id: newId(), src: GALLERY[0], caption: 'golden hour drives', duration: 4 }],
  )
  const [beatId, setBeatId] = useState<string | null>(reel?.beatId ?? beats[0]?.id ?? null)
  const [beatStartSec, setBeatStartSec] = useState<number>(reel?.beatStartSec ?? 0)
  const [selected, setSelected] = useState(0)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setSaveError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
      addFrame(data.url)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const selectedBeat = beats.find((b) => b.id === beatId)

  function addFrame(src: string) {
    setFrames((f) => [...f, { id: newId(), src, caption: '', duration: 4 }])
    setSaved(false)
  }
  function removeFrame(i: number) {
    setFrames((f) => f.filter((_, idx) => idx !== i))
    setSelected((s) => Math.max(0, s >= i ? s - 1 : s))
    setSaved(false)
  }
  function move(i: number, dir: -1 | 1) {
    setFrames((f) => {
      const j = i + dir
      if (j < 0 || j >= f.length) return f
      const next = [...f]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
    setSelected((s) => (s === i ? i + dir : s === i + dir ? i : s))
    setSaved(false)
  }
  function update(i: number, patch: Partial<EditorFrame>) {
    setFrames((f) => f.map((fr, idx) => (idx === i ? { ...fr, ...patch } : fr)))
    setSaved(false)
  }

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      try {
        await saveReel({
          beatId: beatId ?? undefined,
          beatStartSec,
          frames: frames.map((f) => ({
            mediaUrl: f.src,
            caption: f.caption || undefined,
            durationMs: (f.duration ?? 4) * 1000,
          })),
        })
        setSaved(true)
        router.push('/me')
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Save failed')
      }
    })
  }

  const totalSecs = frames.reduce((s, f) => s + (f.duration ?? 4), 0)
  const active = frames[selected]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-5">
        <h1 className="font-serif text-3xl text-foreground">Build your memory reel</h1>
        <p className="mt-1 text-pretty text-muted-foreground">
          Stitch a few moments together, pick a beat, and tell a tiny story. No pressure to
          be perfect — messy and honest reads best.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,420px)]">
        {/* EDITOR */}
        <div className="flex flex-col gap-5">
          {/* Frame list */}
          <Y2KWindow title={`frames · ${frames.length}`} accent>
            {frames.length === 0 ? (
              <p className="rounded-xl bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
                No frames yet. Add a moment from your clips below.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {frames.map((f, i) => (
                  <li
                    key={f.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border-2 bg-card p-2 transition-colors',
                      i === selected ? 'border-primary' : 'border-border',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(i)}
                      className="relative size-14 shrink-0 overflow-hidden rounded-lg"
                      aria-label={`Edit frame ${i + 1}`}
                    >
                      <Image src={f.src} alt="" fill className="object-cover" sizes="56px" />
                      <span className="absolute left-1 top-1 grid size-4 place-items-center rounded bg-background/80 text-[10px] font-bold text-foreground">
                        {i + 1}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        {f.caption || <span className="text-muted-foreground">No caption</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{f.duration ?? 4}s</p>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Move up"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ChevronUp size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Move down"
                        disabled={i === frames.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ChevronDown size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove frame"
                        onClick={() => removeFrame(i)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Total reel length: {totalSecs}s
            </p>
          </Y2KWindow>

          {/* Frame detail editor */}
          {active && (
            <Y2KWindow title={`frame ${selected + 1} details`}>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="caption"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Caption
                  </label>
                  <Input
                    id="caption"
                    value={active.caption ?? ''}
                    maxLength={60}
                    placeholder="say something about this moment..."
                    onChange={(e) => update(selected, { caption: e.target.value })}
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="dur" className="text-sm font-medium text-foreground">
                      Duration
                    </label>
                    <span className="text-sm text-muted-foreground">
                      {active.duration ?? 4}s
                    </span>
                  </div>
                  <Slider
                    id="dur"
                    min={1}
                    max={6}
                    step={1}
                    value={[active.duration ?? 4]}
                    onValueChange={(v) =>
                      update(selected, { duration: Array.isArray(v) ? v[0] : v })
                    }
                  />
                </div>
              </div>
            </Y2KWindow>
          )}

          {/* Clip gallery */}
          <Y2KWindow title="add from your clips">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Upload your own photo, or pick a sample below.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 size={14} className="mr-1.5 animate-spin" />
                ) : (
                  <Upload size={14} className="mr-1.5" />
                )}
                {uploading ? 'Uploading…' : 'Upload photo'}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {GALLERY.map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => addFrame(src)}
                  className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border transition-colors hover:border-primary"
                  aria-label="Add this clip"
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="120px" />
                  <span className="absolute inset-0 grid place-items-center bg-background/0 transition-colors group-hover:bg-background/40">
                    <Plus
                      size={20}
                      className="text-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </span>
                </button>
              ))}
            </div>
          </Y2KWindow>

          {/* Beat picker */}
          <Y2KWindow title="background beat">
            <p className="mb-3 text-xs text-muted-foreground">
              Hand-made loops. Audio stays muted until someone taps play — it never
              autoplays.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {beats.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setBeatId(b.id)
                    setBeatStartSec(0)
                    setSaved(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                    beatId === b.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <PixelDisc size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {b.title}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {b.vibe}
                    </span>
                  </span>
                  {beatId === b.id && (
                    <Check size={16} className="ml-auto shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>

            {selectedBeat && (
              <SnippetPicker
                key={selectedBeat.id}
                src={selectedBeat.audioUrl}
                value={beatStartSec}
                onChange={(s) => {
                  setBeatStartSec(s)
                  setSaved(false)
                }}
              />
            )}
          </Y2KWindow>
        </div>

        {/* PREVIEW (sticky on desktop) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Y2KWindow title="live preview" accent bodyClassName="p-0 pb-4">
            <ReelPlayer
              frames={frames}
              beatLabel={selectedBeat?.title}
              beatSrc={selectedBeat?.audioUrl}
              beatStartSec={beatStartSec}
              edgeToEdge
            />
            <div className="mt-4 flex flex-col gap-2 px-4">
              {saveError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
                  {saveError}
                </p>
              )}
              <Button
                size="lg"
                className="w-full font-semibold"
                disabled={frames.length === 0 || isPending}
                onClick={handleSave}
              >
                {saved ? (
                  <>
                    <Check size={16} className="mr-1.5" /> Saved to your Vibe Page
                  </>
                ) : isPending ? (
                  'Saving…'
                ) : (
                  <>
                    <Save size={16} className="mr-1.5" /> Save reel
                  </>
                )}
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <PixelStar size={12} className="text-[var(--mm-accent)]" />
                You can re-edit your reel anytime.
              </p>
            </div>
          </Y2KWindow>
        </div>
      </div>
    </div>
  )
}

/** Length of the snippet that plays behind a reel, in seconds. */
const SNIPPET_LEN = 15

function fmt(sec: number) {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/**
 * Lets the user scrub to a starting point in the chosen song and preview the
 * ~15s snippet that will loop behind their reel. Audio is muted/stopped until
 * the user explicitly taps preview — never autoplays.
 */
function SnippetPicker({
  src,
  value,
  onChange,
}: {
  src: string
  value: number
  onChange: (start: number) => void
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const stopAt = useRef<number | null>(null)
  const [duration, setDuration] = useState(0)
  const [previewing, setPreviewing] = useState(false)

  const maxStart = Math.max(0, Math.floor(duration - SNIPPET_LEN))

  // Stop preview and reset when the song changes.
  useEffect(() => {
    return () => {
      const el = audioRef.current
      if (el) el.pause()
    }
  }, [src])

  function stop() {
    const el = audioRef.current
    if (el) el.pause()
    setPreviewing(false)
    stopAt.current = null
  }

  function preview() {
    const el = audioRef.current
    if (!el) return
    el.currentTime = value
    el.muted = false
    stopAt.current = value + SNIPPET_LEN
    el.play().then(() => setPreviewing(true)).catch(() => setPreviewing(false))
  }

  return (
    <div className="mt-4 rounded-xl border-2 border-border bg-card/60 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Pick your snippet</p>
        <span className="text-xs text-muted-foreground">
          {duration > 0 ? `${fmt(value)}–${fmt(value + SNIPPET_LEN)}` : 'loading…'}
        </span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Scrub to the part of the track that fits your reel. A ~{SNIPPET_LEN}s loop plays
        behind it.
      </p>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={previewing ? 'secondary' : 'outline'}
          size="icon-sm"
          aria-label={previewing ? 'Stop preview' : 'Preview snippet'}
          disabled={duration === 0}
          onClick={previewing ? stop : preview}
        >
          {previewing ? <Square size={14} /> : <Play size={14} />}
        </Button>
        <Slider
          className="flex-1"
          min={0}
          max={maxStart || 1}
          step={1}
          value={[Math.min(value, maxStart)]}
          disabled={duration === 0}
          onValueChange={(v) => {
            stop()
            onChange(Array.isArray(v) ? v[0] : v)
          }}
        />
      </div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          if (stopAt.current != null && e.currentTarget.currentTime >= stopAt.current) stop()
        }}
        onEnded={stop}
      />
    </div>
  )
}
