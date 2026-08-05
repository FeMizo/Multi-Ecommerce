import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { isPlatformAdminSession } from "@/lib/admin-permissions"

export async function requireAdmin() {
  const session = await auth()
  if (!isPlatformAdminSession(session)) {
    redirect("/")
  }
  return session
}
