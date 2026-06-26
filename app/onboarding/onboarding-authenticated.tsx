'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/onboarding-wizard'
import { completeOnboarding, getProfileForEdit, updateProfile } from '@/lib/actions/profile'

/** Update <html data-theme> live so a theme change reflects site-wide
 *  immediately — the server-rendered root layout only re-reads it on a full
 *  page load, so without this the new theme wouldn't apply to other routes
 *  (e.g. /browse) until the next sign-in. */
function applyThemeSiteWide(theme: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}

export function OnboardingAuthenticated() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Only show the wizard for new users or an explicit edit (/onboarding?edit=1).
  // A returning user with a finished profile is sent straight to their page.
  const editMode = searchParams.get('edit') === '1'
  const { user, isLoaded } = useUser()
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // Prefill from the existing profile so "Edit profile" edits instead of wiping.
  const [initial, setInitial] = React.useState<Partial<OnboardingData> | null>(null)
  const [loadingProfile, setLoadingProfile] = React.useState(true)

  React.useEffect(() => {
    if (!isLoaded || !user) return
    let active = true
    getProfileForEdit()
      .then((p) => {
        if (!active) return
        // Returning user with a profile, not explicitly editing → skip the wizard.
        if (p && !editMode) {
          router.replace('/me')
          return // keep the loading state until navigation completes
        }
        setInitial(p as Partial<OnboardingData> | null)
        setLoadingProfile(false)
      })
      .catch(() => {
        if (!active) return
        setInitial(null)
        setLoadingProfile(false)
      })
    return () => {
      active = false
    }
  }, [isLoaded, user, editMode, router])

  const isEditing = initial !== null

  async function handleComplete(data: OnboardingData) {
    if (!user) {
      setError('You must be signed in to finish onboarding.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        // Edit mode: identity (username, date of birth) is locked — only the
        // mutable fields go through updateProfile, which can't change the
        // username and never touches DOB.
        await updateProfile({
          displayName: data.displayName,
          intent: (data.intents[0] ??
            'open-to-dating') as Parameters<typeof updateProfile>[0]['intent'],
          softLaunch: data.softLaunch,
          theme: data.theme,
          bio: data.bio || undefined,
          mood: data.mood || undefined,
          avatarUrl: data.avatarUrl || undefined,
          interests: data.interests,
          city: data.city,
          state: data.state,
          latitude: data.lat,
          longitude: data.lng,
        })

        applyThemeSiteWide(data.theme)
        router.push('/me')
        return
      }

      // First-time onboarding: 1) Persist DOB to Clerk — the 18+ gate that lets
      //    the webhook create/activate the user row in production.
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          date_of_birth: data.dateOfBirth,
        },
      })

      // 2) Persist the profile (username, bio, interests, theme, mood) to Aurora.
      //    requireUser() lazily creates the user row if the webhook hasn't fired
      //    yet, so this doesn't race Clerk's async delivery.
      const result = await completeOnboarding({
        username: data.username,
        displayName: data.displayName,
        intent: (data.intents[0] ??
          'open-to-dating') as Parameters<typeof completeOnboarding>[0]['intent'],
        softLaunch: data.softLaunch,
        theme: data.theme,
        bio: data.bio || undefined,
        mood: data.mood || undefined,
        avatarUrl: data.avatarUrl || undefined,
        interests: data.interests,
        city: data.city,
        state: data.state,
        latitude: data.lat,
        longitude: data.lng,
      })

      if (!result.ok) {
        setError(result.error)
        setSaving(false)
        return
      }

      applyThemeSiteWide(data.theme)
      router.push(`/vibe/${result.username}`)
    } catch (err) {
      console.error('[onboarding] failed to complete onboarding', err)
      setError('Could not save your profile. Please try again.')
      setSaving(false)
    }
  }

  if (!isLoaded || loadingProfile) {
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
      <OnboardingWizard
        onComplete={handleComplete}
        initial={initial ?? undefined}
        submitLabel={isEditing ? 'Save changes' : undefined}
        onExit={isEditing ? () => router.push('/me') : undefined}
        lockIdentity={isEditing}
      />
      {saving && (
        <p className="mt-4 text-center text-sm text-muted-foreground">Saving your profile…</p>
      )}
    </main>
  )
}
