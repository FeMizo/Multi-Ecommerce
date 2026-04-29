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
        <aside className="w-60 border-r bg-foreground text-background shrink-0 flex flex-col">
          <div className="p-4 border-b border-background/10">
            <Link href="/admin" className="block mb-1">
              <Image src="/logo-icon.png" alt="AionSite" width={32} height={32} className="rounded-lg" />
            </Link>
            <p className="font-bold text-sm text-background">Admin Panel</p>
          </div>
          <AdminNav />
          <div className="p-3 border-t border-background/10">
            <Link href="/" className="text-xs text-background/50 hover:text-background/80">
              ← Volver al marketplace
            </Link>
          </div>
        </aside>
        <main className="flex-1 p-6 bg-muted/30 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  )
}
