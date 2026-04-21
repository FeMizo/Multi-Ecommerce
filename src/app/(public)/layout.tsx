import { Navbar } from "@/components/layout/navbar"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <SessionProvider session={session}>
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-muted/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Mercado Local · Todos los derechos reservados
        </div>
      </footer>
    </SessionProvider>
  )
}
