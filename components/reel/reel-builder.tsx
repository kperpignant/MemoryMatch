'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Y2KWindow } from '@/components/y2k-window'
import { ReelPlayer, type ReelFrame } from '@/components/reel-player'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { PixelDisc, PixelStar } from '@/components/pixel-icons'
import { Plus, Trash2, ChevronUp, ChevronDown, Save, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// Human-made Strudel background beats (no AI/Suno). Audio never autoplays.
const BEATS = [
  { id: 'tape-loop', label: 'lo-fi tape loop', vibe: 'warm & nostalgic' },
  { id: 'dialup-dream', label: 'dial-up dream', vibe: 'glitchy & soft' },
  { id: 'arcade-sunset', label: 'arcade sunset', vibe: 'bright & playful' },
  { id: 'midnight-modem', label: 'midnight modem', vibe: 'late & mellow' },
]

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

export function ReelBuilder({
  onSave,
}: {
  onSave?: (reel: { frames: ReelFrame[]; beat: string }) => void
}) {
  const [frames, setFrames] = useState<EditorFrame[]>([
    { id: newId(), src: GALLERY[0], caption: 'golden hour drives', duration: 4 },
  ])
  const [beat, setBeat] = useState(BEATS[0].id)
  const [selected, setSelected] = useState(0)
  const [saved, setSaved] = useState(false)

  const beatLabel = BEATS.find((b) => b.id === beat)?.label

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
              {BEATS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBeat(b.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors',
                    beat === b.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/40',
                  )}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                    <PixelDisc size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {b.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {b.vibe}
                    </span>
                  </span>
                  {beat === b.id && (
                    <Check size={16} className="ml-auto shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </Y2KWindow>
        </div>

        {/* PREVIEW (sticky on desktop) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Y2KWindow title="live preview" accent>
            <ReelPlayer frames={frames} beatLabel={beatLabel} />
            <div className="mt-4 flex flex-col gap-2">
              <Button
                size="lg"
                className="w-full font-semibold"
                disabled={frames.length === 0}
                onClick={() => {
                  onSave?.({
                    frames: frames.map(({ id, ...f }) => f),
                    beat,
                  })
                  setSaved(true)
                }}
              >
                {saved ? (
                  <>
                    <Check size={16} className="mr-1.5" /> Saved to your Vibe Page
                  </>
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
