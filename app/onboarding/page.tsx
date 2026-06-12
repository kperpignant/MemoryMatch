'use client'

import { useRouter } from 'next/navigation'
import { OnboardingWizard, type OnboardingData } from '@/components/onboarding/onboarding-wizard'

export default function OnboardingPage() {
  const router = useRouter()

  function handleComplete(data: OnboardingData) {
    // Frontend scaffold: hand off to backend later. For now, route to the new Vibe Page.
    console.log('[v0] onboarding complete', data)
    router.push(`/vibe/${data.username || 'me'}`)
  }

  return (
    <main className="min-h-screen bg-background py-4">
      <OnboardingWizard onComplete={handleComplete} />
    </main>
  )
}
