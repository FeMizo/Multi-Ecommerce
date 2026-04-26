import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { UserRoleToggle } from "@/components/admin/user-role-toggle"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default async function AdminUsersPage() {
  await requireAdmin()

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { storeMembers: true, orders: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">{users.length} registrados</p>
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
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
