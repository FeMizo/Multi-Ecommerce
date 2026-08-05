type AdminSessionLike = {
  user?: {
    globalRole?: string | null
  } | null
} | null | undefined

export function isPlatformAdminSession(session: AdminSessionLike) {
  return session?.user?.globalRole === "PLATFORM_ADMIN"
}

export function assertPlatformAdminSession(session: AdminSessionLike) {
  if (!isPlatformAdminSession(session)) {
    throw new Error("Unauthorized")
  }

  return session
}
