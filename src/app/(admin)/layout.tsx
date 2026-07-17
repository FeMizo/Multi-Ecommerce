import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { AdminNav } from "@/components/admin/admin-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") redirect("/")

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 h-screen w-60 border-r bg-foreground text-background flex flex-col">
          <div className="p-4 border-b border-background/10">
            <Link href="/admin" className="block mb-3">
              <Image src="/logo.png" alt="AionSite" width={110} height={32} className="h-7 w-auto object-contain brightness-0 invert" />
            </Link>
            <p className="text-xs font-semibold text-background/50 uppercase tracking-widest">Admin Panel</p>
          </div>
          <AdminNav />
          <div className="absolute bottom-0 left-0 w-full bg-foreground p-3 border-t border-background/10">
            <Link href="/" className="text-xs text-background/50 hover:text-background/80">
              ← Volver al marketplace
            </Link>
          </div>
        </aside>
        <main className="ml-60 flex-1 p-6 bg-muted/30 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  )
}
