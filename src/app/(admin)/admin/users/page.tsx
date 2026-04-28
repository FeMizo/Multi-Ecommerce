import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { UserRoleToggle } from "@/components/admin/user-role-toggle"
import { AdminSearch } from "@/components/admin/admin-search"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type SearchParams = { q?: string }

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const { q } = await searchParams

  const users = await db.user.findMany({
    where: q ? {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    } : {},
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { storeMembers: true, orders: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <div className="flex items-center gap-3">
          <AdminSearch placeholder="Buscar por nombre o email..." />
          <p className="text-sm text-muted-foreground shrink-0">{users.length} encontrados</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">Usuario</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Rol</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Tiendas</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Pedidos</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Registrado</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image ?? undefined} />
                        <AvatarFallback>
                          {(user.name ?? user.email)[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge variant={user.globalRole === "PLATFORM_ADMIN" ? "default" : "secondary"}>
                      {user.globalRole === "PLATFORM_ADMIN" ? "Admin" : "Usuario"}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">{user._count.storeMembers}</td>
                  <td className="p-4 text-center">{user._count.orders}</td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(user.createdAt), { locale: es, addSuffix: true })}
                  </td>
                  <td className="p-4">
                    <UserRoleToggle userId={user.id} currentRole={user.globalRole} />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
