import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/", "/login", "/register"]
const authRoutes = ["/login", "/register"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))
  const isAuthRoute = authRoutes.some((r) => pathname === r)

  // Si ya tiene sesión y va a login/register → redirigir al dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (isPublic) return NextResponse.next()

  // Rutas protegidas — requieren sesión
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Solo PLATFORM_ADMIN puede acceder a /admin
  if (pathname.startsWith("/admin") && session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
