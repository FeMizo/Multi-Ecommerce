import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  PROSPECT_ACTIVITY_TYPE_LABELS,
  PROSPECT_CONTACT_CHANNEL_LABELS,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUSES,
} from "@/lib/prospects"

const CONTACTED_STATUSES = ["CONTACTED", "REPLIED", "FOLLOW_UP", "SECOND_MESSAGE", "MEETING_SCHEDULED", "PROPOSAL_SENT", "NEGOTIATION"] as const

export default async function AdminProspectsMetricsPage() {
  await requireAdmin()

  const [statusCounts, sourceCounts, categoryCounts, activityCounts, activityTypeCounts, total, wonCount] = await Promise.all([
    db.prospect.groupBy({ by: ["status"], _count: { id: true } }),
    db.prospect.groupBy({ by: ["source"], _count: { id: true } }),
    db.prospect.groupBy({ by: ["category"], _count: { id: true }, where: { category: { not: null } } }),
    db.prospectActivity.groupBy({ by: ["channel"], _count: { id: true } }),
    db.prospectActivity.groupBy({ by: ["activityType"], _count: { id: true } }),
    db.prospect.count(),
    db.prospect.count({ where: { status: "WON" } }),
  ])

  const statusMap = new Map(statusCounts.map((item) => [item.status, item._count.id]))
  const sourceMap = new Map(sourceCounts.map((item) => [item.source, item._count.id]))
  const activityMap = new Map(activityCounts.map((item) => [item.channel, item._count.id]))
  const activityTypeMap = new Map(activityTypeCounts.map((item) => [item.activityType, item._count.id]))
  const categoryMap = new Map(categoryCounts.map((item) => [item.category ?? "", item._count.id]))
  const contactedCount = CONTACTED_STATUSES.reduce((sum, status) => sum + (statusMap.get(status) ?? 0), 0)
  const conversion = total > 0 ? Math.round((wonCount / Math.max(contactedCount + wonCount, 1)) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Metricas</h1>
        <p className="text-sm text-muted-foreground">Resumen basico del pipeline comercial.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total prospectos</p><p className="text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Nuevos</p><p className="text-2xl font-bold">{statusMap.get("NEW") ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Contactados</p><p className="text-2xl font-bold">{contactedCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Conversion a ganado</p><p className="text-2xl font-bold">{conversion}%</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Estados</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROSPECT_STATUSES.map((status) => (
                  <TableRow key={status}>
                    <TableCell>{PROSPECT_STATUS_LABELS[status]}</TableCell>
                    <TableCell className="text-right">{statusMap.get(status) ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fuentes</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fuente</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(sourceMap.entries()).map(([source, count]) => (
                  <TableRow key={source}>
                    <TableCell>{PROSPECT_SOURCE_LABELS[source as keyof typeof PROSPECT_SOURCE_LABELS]}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Canales usados</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(activityMap.entries()).map(([channel, count]) => (
                  <TableRow key={channel}>
                    <TableCell>{PROSPECT_CONTACT_CHANNEL_LABELS[channel as keyof typeof PROSPECT_CONTACT_CHANNEL_LABELS]}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Categorias</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(categoryMap.entries()).map(([category, count]) => (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Tipos de actividad</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(activityTypeMap.entries()).map(([type, count]) => (
                <TableRow key={type}>
                  <TableCell>{PROSPECT_ACTIVITY_TYPE_LABELS[type as keyof typeof PROSPECT_ACTIVITY_TYPE_LABELS]}</TableCell>
                  <TableCell className="text-right">{count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
