'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  PixelWave,
  PixelStar,
  PixelNote,
  PixelHeart,
  PixelSparkle,
  PixelDisc,
  PixelFlower,
  PixelSticker,
} from '@/components/pixel-icons'

export type CharmKind = 'wave' | 'sticker' | 'note'

const STICKERS: {
  id: string
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
}[] = [
  { id: 'sparkle', label: 'sparkle', Icon: PixelSparkle },
  { id: 'heart', label: 'heart', Icon: PixelHeart },
  { id: 'star', label: 'star', Icon: PixelStar },
  { id: 'rad', label: 'rad', Icon: PixelDisc },
  { id: 'cozy', label: 'cozy', Icon: PixelFlower },
  { id: 'same!', label: 'same!', Icon: PixelSticker },
]

export function CharmComposer({
  open,
  onOpenChange,
  name = 'them',
  onSend,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  name?: string
  onSend?: (charm: { kind: CharmKind; payload: string }) => void
}) {
  const [kind, setKind] = useState<CharmKind>('wave')
  const [note, setNote] = useState('')
  const [sticker, setSticker] = useState(STICKERS[0].id)

  const tabs: { id: CharmKind; label: string; icon: React.ReactNode }[] = [
    { id: 'wave', label: 'Wave', icon: <PixelWave size={18} /> },
    { id: 'sticker', label: 'Sticker', icon: <PixelStar size={18} /> },
    { id: 'note', label: 'Tiny note', icon: <PixelNote size={18} /> },
  ]

  function handleSend() {
    const payload = kind === 'note' ? note.trim() : kind === 'sticker' ? sticker : 'wave'
    onSend?.({ kind, payload })
    onOpenChange(false)
    setNote('')
    setKind('wave')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PixelHeart size={18} className="text-[var(--mm-match)]" />
            Send {name} a charm
          </DialogTitle>
          <DialogDescription>
            Low pressure, always. A charm is just a friendly hello — no pile of likes,
            no leaderboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 py-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setKind(t.id)}
              className={
                'flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-xs font-medium transition-colors ' +
                (kind === t.id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40')
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="min-h-24 py-1">
          {kind === 'wave' && (
            <p className="rounded-xl bg-secondary/40 px-4 py-6 text-center text-sm text-foreground">
              {`A simple wave lets ${name} know you stopped by and liked the vibe — they'll see it as a gentle hello. 👋`}
            </p>
          )}
          {kind === 'sticker' && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {STICKERS.map((s) => {
                const active = sticker === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSticker(s.id)}
                    aria-pressed={active}
                    className={
                      'flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-xs font-medium transition-colors ' +
                      (active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40')
                    }
                  >
                    <s.Icon
                      size={24}
                      className={active ? 'text-[var(--mm-primary)]' : 'text-foreground'}
                    />
                    {s.label}
                  </button>
                )
              })}
            </div>
          )}
          {kind === 'note' && (
            <div className="flex flex-col gap-1.5">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 140))}
                placeholder={`Say one nice thing about ${name}'s reel...`}
                rows={3}
              />
              <span className="self-end text-xs text-muted-foreground">
                {note.length}/140
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button onClick={handleSend} disabled={kind === 'note' && !note.trim()}>
            Send charm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
