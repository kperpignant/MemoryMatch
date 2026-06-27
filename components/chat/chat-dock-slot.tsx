'use client'

import { SignedIn } from '@clerk/nextjs'
import { ChatDock } from '@/components/chat/chat-dock'

/** Mounts the Messenger-style chat dock for authenticated users only. */
export function ChatDockSlot() {
  return (
    <SignedIn>
      <ChatDock />
    </SignedIn>
  )
}
