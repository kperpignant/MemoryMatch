'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Wraps a thumbnail/avatar in a button that opens an enlarged view of the same
 * image in a dialog. Falls back to a plain, non-interactive wrapper when there
 * is no `src` to enlarge (e.g. initials placeholder).
 */
export function ImageLightbox({
  src,
  alt,
  name,
  className,
  children,
}: {
  src?: string | null
  alt: string
  /** Optional label shown above the enlarged image. */
  name?: string
  /** Classes for the trigger element (matches the thumbnail it wraps). */
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)

  if (!src) {
    return <span className={className}>{children}</span>
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('cursor-zoom-in', className)}
        aria-label={`Enlarge ${alt}`}
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(92vw,32rem)]">
          <DialogHeader>
            <DialogTitle>{name ?? alt}</DialogTitle>
            <DialogDescription className="sr-only">Enlarged profile picture</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-xl bg-foreground/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="max-h-[70vh] w-full object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
