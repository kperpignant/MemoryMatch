'use client'

import { useState, useTransition } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { Y2KWindow } from '@/components/y2k-window'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { deleteAccount, unblockUser } from '@/lib/actions/safety'
import type { BlockedUserRow } from '@/lib/queries'

export function SettingsPanel({ blocked: initialBlocked }: { blocked: BlockedUserRow[] }) {
  const { signOut } = useClerk()
  const { user } = useUser()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isUnblocking, startUnblock] = useTransition()
  const [isDeleting, startDelete] = useTransition()

  function handleUnblock(userId: string) {
    setError(null)
    setMessage(null)
    startUnblock(async () => {
      try {
        await unblockUser({ userId })
        setBlocked((list) => list.filter((b) => b.userId !== userId))
        setMessage('Unblocked.')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not unblock')
      }
    })
  }

  function handleDeleteAccount() {
    setError(null)
    startDelete(async () => {
      try {
        await deleteAccount()
        try {
          await user?.delete()
        } catch {
          // DB is already soft-deleted; still sign out below.
        }
        await signOut({ redirectUrl: '/' })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not delete account')
        setDeleteOpen(false)
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage blocked people and your account.
        </p>
      </div>

      {(error || message) && (
        <p
          className={
            'mb-4 rounded-lg px-3 py-2 text-sm ' +
            (error ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-foreground')
          }
        >
          {error ?? message}
        </p>
      )}

      <Y2KWindow title="blocked users">
        {blocked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t blocked anyone. If someone feels off on a Vibe Page, use the ···
            menu to block or report.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {blocked.map((b) => (
              <li
                key={b.userId}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{b.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">@{b.username}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUnblocking}
                  onClick={() => handleUnblock(b.userId)}
                >
                  Unblock
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Y2KWindow>

      <Y2KWindow title="danger zone" className="mt-5">
        <p className="text-sm text-muted-foreground">
          Deleting your account removes your Vibe Page, reel, and matches from MemoryMatch.
          This can&apos;t be undone.
        </p>
        <Button
          variant="destructive"
          className="mt-4 w-full sm:w-auto"
          onClick={() => setDeleteOpen(true)}
        >
          Delete account
        </Button>
      </Y2KWindow>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              Your profile, memory reel, likes, and messages will be removed. You&apos;ll be
              signed out immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? 'Deleting…' : 'Yes, delete my account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
