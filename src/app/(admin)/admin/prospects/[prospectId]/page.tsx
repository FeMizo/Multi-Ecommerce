import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ProspectEditorForm } from "@/components/admin/prospects/prospect-editor-form"
import { ProspectActivityPanel } from "@/components/admin/prospects/prospect-activity-panel"
import {
  PROSPECT_ACTIVITY_TYPE_LABELS,
  PROSPECT_CONTACT_CHANNEL_LABELS,
  PROSPECT_PRIORITY_LABELS,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUS_LABELS,
  prospectPriorityBadgeVariant,
  prospectStatusBadgeVariant,
} from "@/lib/prospects"
import { ExternalLink, Globe, MapPinned, MessageCircle, ArrowLeft } from "lucide-react"

type PageProps = {
  params: Promise<{ prospectId: string }>
}

export default async function AdminProspectDetailPage({ params }: PageProps) {
  await requireAdmin()

  const { prospectId } = await params
  const prospect = await db.prospect.findUnique({
    where: { id: prospectId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      activities: {
        orderBy: { occurredAt: "desc" },
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  if (!prospect) {
    notFound()
  }

  const defaultValues = {
    businessName: prospect.businessName,
    slug: prospect.slug ?? "",
    contactName: prospect.contactName ?? "",
    phone: prospect.phone ?? "",
    email: prospect.email ?? "",
    website: prospect.website ?? "",
    facebookUrl: prospect.facebookUrl ?? "",
    instagramUrl: prospect.instagramUrl ?? "",
    googleMapsUrl: prospect.googleMapsUrl ?? "",
    address: prospect.address ?? "",
    city: prospect.city,
    category: prospect.category ?? "",
    notes: prospect.notes ?? "",
    source: prospect.source,
    status: prospect.status,
    priority: prospect.priority,
    assignedToId: prospect.assignedToId ?? "",
    lastContactAt: prospect.lastContactAt ? new Date(prospect.lastContactAt).toISOString().slice(0, 16) : "",
    nextFollowUpAt: prospect.nextFollowUpAt ? new Date(prospect.nextFollowUpAt).toISOString().slice(0, 16) : "",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button asChild variant="ghost" className="mb-3">
            <Link href="/admin/prospects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{prospect.businessName}</h1>
          <p className="text-sm text-muted-foreground">{prospect.city}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {prospect.googleMapsUrl && (
            <Button asChild variant="outline">
              <a href={prospect.googleMapsUrl} target="_blank" rel="noreferrer">
                <MapPinned className="mr-2 h-4 w-4" />
                Maps
              </a>
            </Button>
          )}
          {prospect.website && (
            <Button asChild variant="outline">
              <a href={prospect.website} target="_blank" rel="noreferrer">
                <Globe className="mr-2 h-4 w-4" />
                Sitio
              </a>
            </Button>
          )}
          {prospect.facebookUrl && (
            <Button asChild variant="outline">
              <a href={prospect.facebookUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" />
                Facebook
              </a>
            </Button>
          )}
          {prospect.instagramUrl && (
            <Button asChild variant="outline">
              <a href={prospect.instagramUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Instagram
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={prospectStatusBadgeVariant(prospect.status)}>{PROSPECT_STATUS_LABELS[prospect.status]}</Badge>
                <Badge variant={prospectPriorityBadgeVariant(prospect.priority)}>{PROSPECT_PRIORITY_LABELS[prospect.priority]}</Badge>
                <Badge variant="outline">{PROSPECT_SOURCE_LABELS[prospect.source]}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacto</p>
                  <p className="font-medium">{prospect.contactName || "Sin contacto"}</p>
                  <p className="text-sm text-muted-foreground">{prospect.phone || "Sin telefono"}</p>
                  <p className="text-sm text-muted-foreground">{prospect.email || "Sin email"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Responsable</p>
                  <p className="font-medium">{prospect.assignedTo?.name ?? prospect.assignedTo?.email ?? "Sin asignar"}</p>
                  <p className="text-sm text-muted-foreground">Ultimo contacto: {prospect.lastContactAt ? format(new Date(prospect.lastContactAt), "dd MMM yyyy HH:mm", { locale: es }) : "—"}</p>
                  <p className="text-sm text-muted-foreground">Proximo seguimiento: {prospect.nextFollowUpAt ? format(new Date(prospect.nextFollowUpAt), "dd MMM yyyy HH:mm", { locale: es }) : "—"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Notas</p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{prospect.notes || "Sin notas"}</p>
              </div>
            </CardContent>
          </Card>

          <ProspectEditorForm
            mode="edit"
            actionLabel="Editar prospecto"
            submitLabel="Guardar cambios"
            successHref="/admin/prospects/:id"
            prospectId={prospect.id}
            defaultValues={defaultValues}
          />

          <ProspectActivityPanel
            prospectId={prospect.id}
            currentStatus={prospect.status}
            currentNextFollowUpAt={prospect.nextFollowUpAt ? new Date(prospect.nextFollowUpAt).toISOString().slice(0, 16) : null}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prospect.activities.length === 0 && (
              <p className="text-sm text-muted-foreground">Aun no hay actividades registradas.</p>
            )}
            {prospect.activities.map((activity) => (
              <div key={activity.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {PROSPECT_ACTIVITY_TYPE_LABELS[activity.activityType]} · {PROSPECT_CONTACT_CHANNEL_LABELS[activity.channel]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.occurredAt), "dd MMM yyyy HH:mm", { locale: es })} · {activity.performedBy.name ?? activity.performedBy.email}
                    </p>
                  </div>
                  {activity.result && <Badge variant="outline">{activity.result}</Badge>}
                </div>
                {activity.comment && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{activity.comment}</p>}
                {activity.nextFollowUpAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Seguimiento: {format(new Date(activity.nextFollowUpAt), "dd MMM yyyy HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
