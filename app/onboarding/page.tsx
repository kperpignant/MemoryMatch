'use client'

import { useRouter } from 'next/navigation'
import { OnboardingAuthenticated } from '@/app/onboarding/onboarding-authenticated'
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/onboarding-wizard'

const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function OnboardingPage() {
  if (clerkConfigured) {
    return <OnboardingAuthenticated />
  }

  return <OnboardingWithoutAuth />
}

function OnboardingWithoutAuth() {
  const router = useRouter()

  function handleComplete(data: OnboardingData) {
    router.push(`/vibe/${data.username || 'me'}`)
  }

  return (
    <main className="min-h-screen bg-background py-4">
      <OnboardingWizard onComplete={handleComplete} />
    </main>
  )
}
