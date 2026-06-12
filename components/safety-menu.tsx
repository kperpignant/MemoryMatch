'use client'

import { useState } from 'react'
import { MoreHorizontal, Flag, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

type Mode = 'report' | 'block' | null

export function SafetyMenu({
  name = 'this person',
  onReport,
  onBlock,
  align = 'end',
}: {
  name?: string
  onReport?: (reason: string) => void
  onBlock?: () => void
  align?: 'start' | 'end'
}) {
  const [mode, setMode] = useState<Mode>(null)
  const [reason, setReason] = useState('Not feeling it')

  const reasons = [
    'Not feeling it',
    'Felt off / made me uncomfortable',
    'Spam or fake page',
    'Underage',
    'Something else',
  ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Safety and options"
              className="rounded-full"
            />
          }
        >
          <MoreHorizontal size={18} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-52">
          <DropdownMenuItem onClick={() => setMode('report')}>
            <Flag size={15} className="mr-2" />
            Report gently
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode('block')}>
            <Ban size={15} className="mr-2" />
            Block {name}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={mode === 'report'} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report, no drama</DialogTitle>
            <DialogDescription>
              Thanks for looking out. Tell us what felt off — we&apos;ll take it from here,
              and {name} won&apos;t know it was you.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-2">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={
                  'rounded-xl border-2 px-4 py-2.5 text-left text-sm transition-colors ' +
                  (reason === r
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40')
                }
              >
                {r}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMode(null)}>
              Never mind
            </Button>
            <Button
              onClick={() => {
                onReport?.(reason)
                setMode(null)
              }}
            >
              Send report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mode === 'block'} onOpenChange={(o) => !o && setMode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block {name}?</DialogTitle>
            <DialogDescription>
              You won&apos;t see each other anymore, and any charms or chats will quietly
              disappear. You can undo this later in Settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onBlock?.()
                setMode(null)
              }}
            >
              Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
