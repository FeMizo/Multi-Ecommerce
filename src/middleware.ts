import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/", "/login", "/register", "/products", "/cities"]
const sellerRoutes = ["/seller"]
const adminRoutes = ["/admin"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))
  if (isPublic) return NextResponse.next()

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (sellerRoutes.some((r) => pathname.startsWith(r)) && session.user.role !== "SELLER" && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  if (adminRoutes.some((r) => pathname.startsWith(r)) && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
