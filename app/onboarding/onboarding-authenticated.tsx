'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/onboarding-wizard'

export function OnboardingAuthenticated() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleComplete(data: OnboardingData) {
    if (!user) {
      setError('You must be signed in to finish onboarding.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          date_of_birth: data.dateOfBirth,
        },
      })
      router.push(`/vibe/${data.username || 'me'}`)
    } catch (err) {
      console.error('[onboarding] failed to save date of birth', err)
      setError('Could not save your profile. Please try again.')
      setSaving(false)
    }
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background py-4">
      {error && (
        <p className="mx-auto mb-4 max-w-lg px-4 text-center text-sm text-destructive">
          {error}
        </p>
      )}
      <OnboardingWizard onComplete={handleComplete} />
      {saving && (
        <p className="mt-4 text-center text-sm text-muted-foreground">Saving your profile…</p>
      )}
    </main>
  )
}
