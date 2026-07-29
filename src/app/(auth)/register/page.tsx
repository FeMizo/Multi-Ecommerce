import { RegisterForm } from "./register-form"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string }>
}) {
  const { planId } = await searchParams
  return <RegisterForm planId={planId ?? null} />
}
