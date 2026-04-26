import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SessionProvider } from "next-auth/react"
import Link from "next/link"
import { AdminNav } from "@/components/admin/admin-nav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") redirect("/")

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen">
        <aside className="w-60 border-r bg-slate-900 text-slate-100 shrink-0 flex flex-col">
          <div className="p-4 border-b border-slate-800">
            <Link href="/admin" className="font-bold text-lg">Admin Panel</Link>
            <p className="text-xs text-slate-400 mt-1">Mercado Local</p>
          </div>
          <AdminNav />
          <div className="p-3 border-t border-slate-800">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-300">
              ← Volver al marketplace
            </Link>
          </div>
        </aside>
        <main className="flex-1 p-6 bg-muted/30 overflow-auto">{children}</main>
      </div>
    </SessionProvider>
  )
}
