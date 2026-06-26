import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * PanelGrid — the responsive layout for stacks of Y2KWindow panels.
 *
 * One column on mobile; on `lg` it splits into a main column + a side rail.
 * Compose with the slot components so new panels reflow automatically — drop
 * another <Y2KWindow> into <PanelGrid.Main> or <PanelGrid.Side> and you never
 * have to touch a breakpoint:
 *
 *   <PanelGrid>
 *     <PanelGrid.Main>
 *       <Y2KWindow … />
 *       <Y2KWindow … />        // add as many as you like — they stack + reflow
 *     </PanelGrid.Main>
 *     <PanelGrid.Side sticky>
 *       <Y2KWindow … />
 *     </PanelGrid.Side>
 *   </PanelGrid>
 *
 * `layout` picks the desktop column split:
 *   - 'balanced'     → 1.4fr / 1fr            (profile / vibe pages)
 *   - 'mainWithRail' → 1fr / 320–420px rail   (editors, e.g. reel builder)
 *
 * For a single column of panels you don't need PanelGrid at all — just stack
 * <Y2KWindow>s in a `flex flex-col gap-5` wrapper.
 */
const LAYOUTS = {
  balanced: 'lg:grid-cols-[1.4fr_1fr]',
  mainWithRail: 'lg:grid-cols-[1fr_minmax(320px,420px)]',
} as const

export function PanelGrid({
  children,
  layout = 'balanced',
  className,
}: {
  children: React.ReactNode
  layout?: keyof typeof LAYOUTS
  className?: string
}) {
  return <div className={cn('grid gap-5', LAYOUTS[layout], className)}>{children}</div>
}

/** Main (wider) column of stacked panels. */
function PanelMain({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('flex flex-col gap-5', className)}>{children}</div>
}

/**
 * Side rail of stacked panels. `sticky` pins it alongside a long main column on
 * desktop (≥ lg); on mobile it simply stacks under the main column.
 */
function PanelSide({
  children,
  sticky = false,
  className,
}: {
  children: React.ReactNode
  sticky?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        sticky && 'lg:sticky lg:top-6 lg:self-start',
        className,
      )}
    >
      {children}
    </div>
  )
}

PanelGrid.Main = PanelMain
PanelGrid.Side = PanelSide
