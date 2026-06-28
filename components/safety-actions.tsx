'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { blockUser, reportContent } from '@/lib/actions/safety'
import { mapReportReason } from '@/lib/safety-labels'

/** Wire SafetyMenu to server-enforced block/report mutations. */
export function useSafetyActions(
  targetUserId: string,
  { onBlocked }: { onBlocked?: () => void } = {},
) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleBlock() {
    setFeedback(null)
    startTransition(async () => {
      try {
        await blockUser({ userId: targetUserId })
        if (onBlocked) onBlocked()
        else router.push('/browse')
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : 'Could not block')
      }
    })
  }

  function handleReport(label: string) {
    setFeedback(null)
    startTransition(async () => {
      try {
        const mapped = mapReportReason(label)
        await reportContent({
          reportedUserId: targetUserId,
          reason: mapped.reason,
          details: mapped.details,
        })
        setFeedback('Report sent — thank you for looking out.')
      } catch (err) {
        setFeedback(err instanceof Error ? err.message : 'Could not send report')
      }
    })
  }

  return { handleBlock, handleReport, feedback, isPending }
}
