'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PixelDisc } from '@/components/pixel-icons'
import { Pause, Play, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'

/** Length of the looped beat snippet, in seconds (matches the reel builder). */
const SNIPPET_LEN = 15

export type ReelFrame = {
  src: string
  caption?: string
  /** seconds, 1–6 */
  duration?: number
}

/**
 * ReelPlayer — a 16:9 Memory Reel player.
 * - Audio NEVER autoplays and starts muted; a button toggles the background track.
 * - Respects prefers-reduced-motion: no auto-advance, no crossfade animation.
 * - Always offers pause + manual prev/next.
 */
export function ReelPlayer({
  frames,
  beatLabel,
  beatSrc,
  beatStartSec = 0,
  className,
  autoPlay = false,
}: {
  frames: ReelFrame[]
  beatLabel?: string
  beatSrc?: string
  /** Start offset (seconds) of the beat snippet that loops behind the reel. */
  beatStartSec?: number
  className?: string
  autoPlay?: boolean
}) {
  const reduceMotion = usePrefersReducedMotion()
  const [index, setIndex] = React.useState(0)
  const [playing, setPlaying] = React.useState(autoPlay && !reduceMotion)
  // Try to start the beat automatically when autoplaying; the browser may block
  // unmuted autoplay until the user interacts, in which case the audio effect
  // flips this back off and the tap-to-play button takes over.
  const [audioOn, setAudioOn] = React.useState(autoPlay && Boolean(beatSrc))
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const safeFrames = frames.length > 0 ? frames : [{ src: '', caption: '' }]
  const current = safeFrames[Math.min(index, safeFrames.length - 1)]
  const duration = clampDuration(current?.duration)

  // auto-advance (disabled under reduced motion)
  React.useEffect(() => {
    if (!playing || reduceMotion || safeFrames.length <= 1) return
    const t = setTimeout(() => {
      setIndex((i) => (i + 1) % safeFrames.length)
    }, duration * 1000)
    return () => clearTimeout(t)
  }, [playing, index, duration, reduceMotion, safeFrames.length])

  // audio control — play when audioOn (autoplay-attempted or user-toggled);
  // pause otherwise. Unmuted autoplay may be blocked by the browser.
  React.useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (audioOn) {
      el.muted = false
      // Start the chosen snippet; loop back to it rather than to 0.
      if (Math.abs(el.currentTime - beatStartSec) > 1) el.currentTime = beatStartSec
      el.play().catch(() => setAudioOn(false))
    } else {
      el.pause()
    }
  }, [audioOn, beatStartSec])

  // If unmuted autoplay was blocked, start the beat on the visitor's first
  // interaction with the page — unless they've already muted it themselves.
  const userMutedRef = React.useRef(false)
  React.useEffect(() => {
    if (!autoPlay || !beatSrc) return
    const onGesture = () => {
      if (!userMutedRef.current) setAudioOn(true)
      cleanup()
    }
    const cleanup = () => {
      window.removeEventListener('pointerdown', onGesture)
      window.removeEventListener('keydown', onGesture)
    }
    window.addEventListener('pointerdown', onGesture)
    window.addEventListener('keydown', onGesture)
    return cleanup
  }, [autoPlay, beatSrc])

  function toggleAudio() {
    userMutedRef.current = audioOn // turning it off counts as an explicit mute
    setAudioOn((a) => !a)
  }

  function prev() {
    setIndex((i) => (i - 1 + safeFrames.length) % safeFrames.length)
  }
  function next() {
    setIndex((i) => (i + 1) % safeFrames.length)
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-foreground/5">
        {safeFrames.map((frame, i) => (
          <div
            key={i}
            aria-hidden={i !== index}
            className={cn(
              'absolute inset-0',
              reduceMotion ? '' : 'transition-opacity duration-500',
              i === index ? 'opacity-100' : 'opacity-0',
            )}
          >
            {frame.src ? (
              <Image
                src={frame.src || '/placeholder.svg'}
                alt={frame.caption || `Reel frame ${i + 1}`}
                fill
                sizes="(min-width: 768px) 42rem, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">
                <PixelDisc size={40} />
              </div>
            )}
          </div>
        ))}

        {/* caption */}
        {current?.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/75 to-transparent p-3 pt-8">
            <p className="font-heading text-sm font-semibold text-background">
              {current.caption}
            </p>
          </div>
        )}

        {/* frame counter */}
        <div className="absolute right-2 top-2 rounded-full bg-foreground/55 px-2 py-0.5 text-xs font-medium text-background">
          {index + 1}/{safeFrames.length}
        </div>

        {/* progress dots */}
        <div className="absolute inset-x-0 top-2 flex justify-center gap-1 px-10">
          {safeFrames.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1 flex-1 max-w-8 rounded-full',
                i === index ? 'bg-background' : 'bg-background/40',
              )}
            />
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={prev} aria-label="Previous frame">
            <ChevronLeft />
          </Button>
          <Button
            variant="default"
            size="icon-sm"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause reel' : 'Play reel'}
            disabled={reduceMotion}
            title={reduceMotion ? 'Auto-play off (reduced motion)' : undefined}
          >
            {playing ? <Pause /> : <Play />}
          </Button>
          <Button variant="outline" size="icon-sm" onClick={next} aria-label="Next frame">
            <ChevronRight />
          </Button>
        </div>

        {beatLabel && (
          <Button
            variant={audioOn ? 'secondary' : 'outline'}
            size="sm"
            onClick={toggleAudio}
            aria-pressed={audioOn}
            className="gap-1.5"
          >
            {audioOn ? <Volume2 /> : <VolumeX />}
            <span className="max-w-28 truncate">{beatLabel}</span>
          </Button>
        )}
      </div>

      {reduceMotion && (
        <p className="text-xs text-muted-foreground">
          Reduced motion is on — use the arrows to move through frames.
        </p>
      )}

      {beatSrc && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio
          ref={audioRef}
          src={beatSrc}
          loop
          preload={autoPlay ? 'auto' : 'none'}
          onTimeUpdate={(e) => {
            // Loop within the ~15s snippet window instead of the whole track.
            const el = e.currentTarget
            if (el.currentTime >= beatStartSec + SNIPPET_LEN) el.currentTime = beatStartSec
          }}
        />
      )}
    </div>
  )
}

function clampDuration(d?: number) {
  if (!d || Number.isNaN(d)) return 3
  return Math.min(6, Math.max(1, d))
}

export function usePrefersReducedMotion() {
  const [reduce, setReduce] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const handler = () => setReduce(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduce
}
