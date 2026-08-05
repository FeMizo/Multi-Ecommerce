import Link from "next/link"
import { addDays, format } from "date-fns"
import { es } from "date-fns/locale"
import { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import {
  buildProspectSearchWhere,
  getProspectDuplicateKeys,
  isProspectOverdueFollowUp,
  PROSPECT_LIST_PAGE_SIZE,
  PROSPECT_PRIORITY_LABELS,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_LABELS,
  parseProspectSort,
  prospectPriorityBadgeVariant,
  prospectStatusBadgeVariant,
  type ProspectContactChannelValue,
  type ProspectPriorityValue,
  type ProspectSourceValue,
  type ProspectStatusValue,
} from "@/lib/prospects"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ProspectListFilters } from "@/components/admin/prospects/prospect-list-filters"
import { CircleAlert, ChevronLeft, ChevronRight, ExternalLink, Pencil, Plus, StickyNote, Target } from "lucide-react"
import { cn } from "@/lib/utils"

type SearchParams = Record<string, string | string[] | undefined>

function pickValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? ""
}

function queryDateRange(filter: string | null) {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (filter === "today") return { gte: startOfToday, lt: addDays(startOfToday, 1) }
  if (filter === "upcoming") return { gte: startOfToday, lt: addDays(startOfToday, 7) }
  return null
}

export default async function AdminProspectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const params = await searchParams
  const q = pickValue(params.q)
  const status = pickValue(params.status) as ProspectStatusValue | ""
  const source = pickValue(params.source) as ProspectSourceValue | ""
  const channel = pickValue(params.channel) as ProspectContactChannelValue | ""
  const priority = pickValue(params.priority) as ProspectPriorityValue | ""
  const category = pickValue(params.category)
  const followUp = pickValue(params.followUp)
  const sort = pickValue(params.sort)
  const page = Math.max(1, Number.parseInt(pickValue(params.page) || "1", 10) || 1)

  const whereClauses: Prisma.ProspectWhereInput[] = []
  const searchWhere = buildProspectSearchWhere(q)
  if (searchWhere) whereClauses.push(searchWhere)
  if (status) whereClauses.push({ status })
  if (source) whereClauses.push({ source })
  if (priority) whereClauses.push({ priority })
  if (channel) whereClauses.push({ activities: { some: { channel } } })
  if (category) whereClauses.push({ category: { contains: category, mode: "insensitive" } })
  if (followUp === "overdue") {
    whereClauses.push({ nextFollowUpAt: { lt: new Date() }, status: { notIn: ["WON", "DISCARDED"] } })
  } else if (followUp === "none") {
    whereClauses.push({ nextFollowUpAt: null })
  } else if (followUp === "today" || followUp === "upcoming") {
    whereClauses.push({ nextFollowUpAt: queryDateRange(followUp), status: { notIn: ["WON", "DISCARDED"] } })
  }

  const where: Prisma.ProspectWhereInput = whereClauses.length ? { AND: whereClauses } : {}

  const [total, statusCounts, prospects] = await Promise.all([
    db.prospect.count({ where }),
    db.prospect.groupBy({
      by: ["status"],
      where,
      _count: { id: true },
    }),
    db.prospect.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        activities: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { occurredAt: true, channel: true, activityType: true },
        },
      },
      orderBy: parseProspectSort(sort),
      skip: (page - 1) * PROSPECT_LIST_PAGE_SIZE,
      take: PROSPECT_LIST_PAGE_SIZE,
    }),
  ])

  const duplicateClauses: Prisma.ProspectWhereInput[] = []
  for (const prospect of prospects) {
    const duplicateWhere = getProspectDuplicateKeys(prospect).map((key) => {
      if (key === prospect.businessNameNormalized) return { businessNameNormalized: key }
      if (key === prospect.phoneNormalized) return { phoneNormalized: key }
      if (key === prospect.emailNormalized) return { emailNormalized: key }
      if (key === prospect.websiteNormalized) return { websiteNormalized: key }
      if (key === prospect.googleMapsUrlNormalized) return { googleMapsUrlNormalized: key }
      if (key === prospect.facebookUrlNormalized) return { facebookUrlNormalized: key }
      return { instagramUrlNormalized: key }
    })
    duplicateClauses.push(...duplicateWhere)
  }

  const duplicateMatches = duplicateClauses.length
    ? await db.prospect.findMany({
        where: { AND: [{ id: { notIn: prospects.map((item) => item.id) } }, { OR: duplicateClauses }] },
        select: {
          businessNameNormalized: true,
          phoneNormalized: true,
          emailNormalized: true,
          websiteNormalized: true,
          googleMapsUrlNormalized: true,
          facebookUrlNormalized: true,
          instagramUrlNormalized: true,
        },
      })
    : []

  const duplicateFieldMap = new Map<string, number>()
  for (const match of duplicateMatches) {
    for (const key of getProspectDuplicateKeys(match)) {
      duplicateFieldMap.set(key, (duplicateFieldMap.get(key) ?? 0) + 1)
    }
  }

  const statusCountMap = new Map(statusCounts.map((entry) => [entry.status, entry._count.id]))
  const totalPages = Math.max(1, Math.ceil(total / PROSPECT_LIST_PAGE_SIZE))
  const nextPage = Math.min(totalPages, page + 1)
  const prevPage = Math.max(1, page - 1)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prospectos</h1>
          <p className="text-sm text-muted-foreground">CRM interno para negocios locales y seguimiento comercial.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/prospects/follow-ups">
              <StickyNote className="mr-2 h-4 w-4" />
              Seguimientos
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/prospects/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo prospecto
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["NEW", "PENDING_CONTACT", "CONTACTED", "REPLIED", "FOLLOW_UP", "SECOND_MESSAGE", "MEETING_SCHEDULED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "NO_RESPONSE", "DISCARDED"].map((item) => (
          <Card key={item}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{PROSPECT_STATUS_LABELS[item as ProspectStatusValue]}</p>
              <p className="text-2xl font-bold">{statusCountMap.get(item as ProspectStatusValue) ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProspectListFilters
        initialQuery={q}
        initialStatus={status}
        initialSource={source}
        initialChannel={channel}
        initialPriority={priority}
        initialCategory={category}
        initialFollowUp={followUp}
        initialSort={sort || "createdAt"}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Resultados</CardTitle>
          <div className="text-sm text-muted-foreground">{total} prospectos</div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Negocio</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Ultimo contacto</TableHead>
                <TableHead>Proximo seguimiento</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prospects.map((prospect) => {
                const hasDuplicate = getProspectDuplicateKeys(prospect).some((key) => duplicateFieldMap.has(key))
                const overdue = isProspectOverdueFollowUp(prospect.nextFollowUpAt, prospect.status)
                const lastActivity = prospect.activities[0]
                return (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{prospect.businessName}</span>
                          {hasDuplicate && <Badge variant="secondary">Duplicado posible</Badge>}
                          {overdue && (
                            <Badge variant="destructive">
                              <CircleAlert className="mr-1 h-3 w-3" />
                              Vencido
                            </Badge>
                          )}
                        </div>
                        {prospect.website && (
                          <a className="text-xs text-muted-foreground hover:underline" href={prospect.website} target="_blank" rel="noreferrer">
                            {prospect.website}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <p>{prospect.contactName ?? "—"}</p>
                        <p className="text-muted-foreground">{prospect.phone ?? "—"}</p>
                        <p className="text-muted-foreground">{prospect.email ?? "—"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{prospect.category ?? "—"}</TableCell>
                    <TableCell>{PROSPECT_SOURCE_LABELS[prospect.source]}</TableCell>
                    <TableCell>
                      <Badge variant={prospectStatusBadgeVariant(prospect.status)}>{PROSPECT_STATUS_LABELS[prospect.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={prospectPriorityBadgeVariant(prospect.priority)}>{PROSPECT_PRIORITY_LABELS[prospect.priority]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {prospect.lastContactAt
                        ? format(new Date(prospect.lastContactAt), "dd MMM yyyy", { locale: es })
                        : lastActivity
                          ? format(new Date(lastActivity.occurredAt), "dd MMM yyyy", { locale: es })
                          : "—"}
                    </TableCell>
                    <TableCell className={cn(overdue && "font-medium text-destructive")}>
                      {prospect.nextFollowUpAt
                        ? format(new Date(prospect.nextFollowUpAt), "dd MMM yyyy", { locale: es })
                        : "—"}
                    </TableCell>
                    <TableCell>{prospect.assignedTo ? prospect.assignedTo.name ?? prospect.assignedTo.email : "Sin asignar"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/prospects/${prospect.id}`}>
                            <ExternalLink className="mr-1 h-4 w-4" />
                            Abrir
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/prospects/${prospect.id}?mode=edit`}>
                            <Pencil className="mr-1 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/prospects/${prospect.id}?action=contact`}>
                            <Target className="mr-1 h-4 w-4" />
                            Contacto
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {prospects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="py-10 text-center text-muted-foreground">
                    Sin resultados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Página {page} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link href={`/admin/prospects?page=${prevPage}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link href={`/admin/prospects?page=${nextPage}`}>
              Siguiente
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
