import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Minimal pixel-art icon set drawn on a 7x7 grid for MemoryMatch.
 * crispEdges keeps the blocky Y2K look. Decorative — pair with text labels.
 */
type PixelIconProps = React.ComponentProps<'svg'> & { size?: number }

function Base({
  size = 20,
  className,
  children,
  ...props
}: PixelIconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 7 7"
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden="true"
      className={cn('inline-block', className)}
      {...props}
    >
      {children}
    </svg>
  )
}

// each <rect> is one pixel; helper for brevity
const P = ({ x, y }: { x: number; y: number }) => (
  <rect x={x} y={y} width="1" height="1" />
)

export function PixelHeart(props: PixelIconProps) {
  const px = [
    [1, 1],
    [2, 1],
    [4, 1],
    [5, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [6, 2],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [5, 3],
    [2, 4],
    [3, 4],
    [4, 4],
    [3, 5],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}

export function PixelStar(props: PixelIconProps) {
  const px = [
    [3, 0],
    [3, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [5, 3],
    [6, 3],
    [2, 4],
    [3, 4],
    [4, 4],
    [1, 5],
    [2, 5],
    [4, 5],
    [5, 5],
    [1, 6],
    [5, 6],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}

export function PixelWave(props: PixelIconProps) {
  // little hand
  const px = [
    [2, 0],
    [4, 0],
    [2, 1],
    [3, 1],
    [4, 1],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [5, 2],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [5, 3],
    [2, 4],
    [3, 4],
    [4, 4],
    [2, 5],
    [3, 5],
    [4, 5],
    [2, 6],
    [4, 6],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}

export function PixelNote(props: PixelIconProps) {
  const px = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [0, 1],
    [5, 1],
    [0, 2],
    [2, 2],
    [3, 2],
    [5, 2],
    [0, 3],
    [5, 3],
    [0, 4],
    [2, 4],
    [3, 4],
    [4, 4],
    [5, 4],
    [0, 5],
    [5, 5],
    [0, 6],
    [1, 6],
    [2, 6],
    [3, 6],
    [4, 6],
    [5, 6],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}

export function PixelSticker(props: PixelIconProps) {
  // smiley sticker
  const px = [
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [0, 1],
    [6, 1],
    [0, 2],
    [2, 2],
    [4, 2],
    [6, 2],
    [0, 3],
    [6, 3],
    [0, 4],
    [1, 4],
    [5, 4],
    [6, 4],
    [0, 5],
    [2, 5],
    [3, 5],
    [4, 5],
    [6, 5],
    [1, 6],
    [2, 6],
    [3, 6],
    [4, 6],
    [5, 6],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}

export function PixelDisc(props: PixelIconProps) {
  const px = [
    [2, 0],
    [3, 0],
    [4, 0],
    [1, 1],
    [5, 1],
    [0, 2],
    [3, 2],
    [6, 2],
    [0, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [6, 3],
    [0, 4],
    [3, 4],
    [6, 4],
    [1, 5],
    [5, 5],
    [2, 6],
    [3, 6],
    [4, 6],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}

export function PixelFlower(props: PixelIconProps) {
  // little daisy with a stem + leaf
  const px = [
    [3, 0],
    [2, 1],
    [3, 1],
    [4, 1],
    [1, 2],
    [2, 2],
    [4, 2],
    [5, 2],
    [2, 3],
    [3, 3],
    [4, 3],
    [3, 4],
    [3, 5],
    [4, 5],
    [3, 6],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}

export function PixelSparkle(props: PixelIconProps) {
  const px = [
    [3, 0],
    [3, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [4, 3],
    [5, 3],
    [6, 3],
    [2, 4],
    [3, 4],
    [4, 4],
    [3, 5],
    [3, 6],
  ]
  return (
    <Base {...props}>
      {px.map(([x, y]) => (
        <P key={`${x}-${y}`} x={x} y={y} />
      ))}
    </Base>
  )
}
