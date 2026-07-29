import { OnboardingForm } from "./onboarding-form"

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>
}) {
  const { planId } = await searchParams
  return <OnboardingForm planId={planId ?? null} />
}
