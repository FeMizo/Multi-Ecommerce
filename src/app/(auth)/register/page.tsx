import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RegisterForm } from "./register-form"

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; role?: string }>
}) {
  const { planId, role } = await searchParams
  const session = await auth()
  const normalizedRole = role?.trim().toUpperCase() ?? null

  if (session?.user) redirect("/dashboard")

  return <RegisterForm planId={planId ?? null} role={normalizedRole} />
}
