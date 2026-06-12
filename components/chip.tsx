'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Chip — a pill toggle used for intents, interests, and filters.
 * Works as a button (onClick) or static when `as="span"`.
 */
export function Chip({
  selected,
  className,
  children,
  ...props
}: React.ComponentProps<'button'> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-card-foreground hover:bg-muted',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
