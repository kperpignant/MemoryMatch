import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * ButtonLink — a Button styled link. base-ui's Button needs `nativeButton={false}`
 * and a `render` prop (not asChild) when rendering a non-<button> element.
 */
export function ButtonLink({
  href,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { href: string }) {
  return (
    <Button nativeButton={false} render={<Link href={href} />} {...props}>
      {children}
    </Button>
  )
}
