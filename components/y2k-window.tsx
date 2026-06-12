import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Y2KWindow — a glossy "desktop window" module with a soft title bar.
 * Used across MemoryMatch for that nostalgic-but-clean OS feel.
 */
export function Y2KWindow({
  title,
  icon,
  actions,
  accent,
  className,
  bodyClassName,
  children,
  ...props
}: React.ComponentProps<'section'> & {
  title?: React.ReactNode
  icon?: React.ReactNode
  actions?: React.ReactNode
  /** Tints the title bar with the accent color for emphasis. */
  accent?: boolean
  bodyClassName?: string
}) {
  return (
    <section
      className={cn(
        'y2k-bevel overflow-hidden rounded-2xl border border-border bg-window',
        className,
      )}
      {...props}
    >
      {title !== undefined && (
        <header
          className={cn(
            'flex items-center gap-2 px-3 py-2',
            accent
              ? 'bg-[var(--mm-accent)] text-[var(--mm-ink)]'
              : 'bg-window-bar text-window-bar-foreground',
          )}
        >
          {icon && (
            <span className="grid size-5 shrink-0 place-items-center">
              {icon}
            </span>
          )}
          <h2 className="font-heading min-w-0 flex-1 truncate text-sm font-semibold tracking-wide">
            {title}
          </h2>
          {actions ? (
            <div className="flex items-center gap-1.5">{actions}</div>
          ) : (
            <WindowDots />
          )}
        </header>
      )}
      <div className={cn('y2k-gloss', bodyClassName)}>{children}</div>
    </section>
  )
}

/** Decorative window control dots (non-interactive, hidden from a11y tree). */
export function WindowDots() {
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <span className="size-2.5 rounded-[3px] bg-window-bar-foreground/30" />
      <span className="size-2.5 rounded-[3px] bg-window-bar-foreground/30" />
      <span className="size-2.5 rounded-[3px] border border-window-bar-foreground/40" />
    </div>
  )
}
