import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const authRoutes = ["/login", "/register"]
const protectedRoutes = ["/dashboard", "/account", "/admin"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isAuthRoute = authRoutes.some((r) => pathname === r)
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r))

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/admin") && session?.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
