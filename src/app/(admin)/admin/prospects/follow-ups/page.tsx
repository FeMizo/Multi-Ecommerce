import { addDays, startOfDay, endOfDay, format } from "date-fns"
import { es } from "date-fns/locale"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PROSPECT_STATUS_LABELS, isProspectOverdueFollowUp, prospectStatusBadgeVariant } from "@/lib/prospects"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AdminProspectsFollowUpsPage() {
  await requireAdmin()

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const nextWeek = addDays(todayStart, 7)

  const [today, overdue, upcoming, noActivity, noResponse, proposalSent] = await Promise.all([
    db.prospect.findMany({
      where: {
        nextFollowUpAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: ["WON", "DISCARDED"] },
      },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { nextFollowUpAt: "asc" },
      take: 20,
    }),
    db.prospect.findMany({
      where: {
        nextFollowUpAt: { lt: now },
        status: { notIn: ["WON", "DISCARDED"] },
      },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { nextFollowUpAt: "asc" },
      take: 20,
    }),
    db.prospect.findMany({
      where: {
        nextFollowUpAt: { gt: todayEnd, lte: nextWeek },
        status: { notIn: ["WON", "DISCARDED"] },
      },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { nextFollowUpAt: "asc" },
      take: 20,
    }),
    db.prospect.findMany({
      where: { activities: { none: {} } },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.prospect.findMany({
      where: { status: "NO_RESPONSE" },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    db.prospect.findMany({
      where: { status: "PROPOSAL_SENT" },
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ])

  const cards = [
    { title: "Seguimientos de hoy", items: today },
    { title: "Seguimientos vencidos", items: overdue },
    { title: "Próximos seguimientos", items: upcoming },
    { title: "Sin actividad", items: noActivity },
    { title: "Sin respuesta", items: noResponse },
    { title: "Propuesta enviada", items: proposalSent },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Seguimientos</h1>
          <p className="text-sm text-muted-foreground">Vista operativa de prospectos que requieren atención.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/prospects">Volver a prospectos</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Seguimiento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {card.items.map((prospect) => {
                    const overdueFlag = isProspectOverdueFollowUp(prospect.nextFollowUpAt, prospect.status)
                    return (
                      <TableRow key={prospect.id}>
                        <TableCell>
                          <Link href={`/admin/prospects/${prospect.id}`} className="font-medium hover:underline">
                            {prospect.businessName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{prospect.assignedTo?.name ?? prospect.assignedTo?.email ?? "Sin asignar"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={prospectStatusBadgeVariant(prospect.status)}>{PROSPECT_STATUS_LABELS[prospect.status]}</Badge>
                        </TableCell>
                        <TableCell className={overdueFlag ? "text-destructive font-medium" : ""}>
                          {prospect.nextFollowUpAt ? format(new Date(prospect.nextFollowUpAt), "dd MMM yyyy", { locale: es }) : "—"}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {card.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                        Sin registros
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
