import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { fetchGooglePhoneNumber } from "@/lib/google-people"
import { normalizeDriverPhone } from "@/lib/delivery"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/user.phonenumbers.read",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      async authorize(credentials) {
        const { identifier, password } = credentials as { identifier?: string; password?: string }
        const login = identifier?.trim()
        if (!login || !password) return null
        const normalizedPhone = login.includes("@") ? null : normalizeDriverPhone(login)

        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: login.toLowerCase() },
              { phone: normalizedPhone ?? login },
            ],
          },
        })
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(password, user.password)
        if (!valid) return null

        return user
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !account.access_token) return true
      if (!user.email) return true

      const current = await db.user.findUnique({
        where: { email: user.email },
        select: { id: true, phone: true },
      })
      if (!current || current.phone) return true

      const phone = await fetchGooglePhoneNumber(account.access_token).catch(() => null)
      if (!phone) return true

      await db.user.update({
        where: { id: current.id },
        data: { phone },
      })

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.globalRole = user.globalRole
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.globalRole = token.globalRole as string
      }
      return session
    },
  },
})
