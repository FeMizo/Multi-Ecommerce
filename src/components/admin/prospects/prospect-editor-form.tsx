"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { prospectCreateSchema } from "@/lib/prospect-schemas"
import {
  PROSPECT_ACTIVITY_TYPE_LABELS,
  PROSPECT_ACTIVITY_TYPES,
  PROSPECT_CONTACT_CHANNEL_LABELS,
  PROSPECT_CONTACT_CHANNELS,
  PROSPECT_PRIORITY_LABELS,
  PROSPECT_PRIORITIES,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_SOURCES,
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUSES,
  type ProspectActivityTypeValue,
  type ProspectContactChannelValue,
  type ProspectPriorityValue,
  type ProspectSourceValue,
  type ProspectStatusValue,
} from "@/lib/prospects"

type ProspectFormValues = z.infer<typeof prospectCreateSchema>

type ProspectDuplicate = {
  id: string
  businessName: string
  contactName: string | null
  phone: string | null
  email: string | null
  city: string
  status: ProspectStatusValue
  priority: ProspectPriorityValue
  assignedTo: { id: string; name: string | null; email: string }
}

type ProspectEditorFormProps = {
  mode: "create" | "edit"
  defaultValues: Partial<ProspectFormValues>
  actionLabel: string
  submitLabel: string
  successHref?: string
  prospectId?: string
}

const activitySchema = z.object({
  channel: z.enum(PROSPECT_CONTACT_CHANNELS).default("OTHER"),
  activityType: z.enum(PROSPECT_ACTIVITY_TYPES).default("CONTACT_ATTEMPT"),
  comment: z.string().max(4000).optional().or(z.literal("")),
  result: z.string().max(120).optional().or(z.literal("")),
  nextFollowUpAt: z.string().optional().or(z.literal("")),
})

export function ProspectEditorForm({
  mode,
  defaultValues,
  actionLabel,
  submitLabel,
  successHref,
  prospectId,
}: ProspectEditorFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [allowDuplicate, setAllowDuplicate] = useState(false)
  const [duplicateList, setDuplicateList] = useState<ProspectDuplicate[]>([])
  const [duplicateOpen, setDuplicateOpen] = useState(false)
  const [activityEnabled, setActivityEnabled] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)

  const schema = useMemo(() => prospectCreateSchema, [])
  const endpoint = mode === "create" ? "/api/admin/prospects" : `/api/admin/prospects/${prospectId}`
  const { register, handleSubmit, control, formState: { errors }, setValue } = useForm<ProspectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessName: "",
      city: "",
      source: "MANUAL",
      status: "NEW",
      priority: "MEDIUM",
      ...defaultValues,
    },
  })

  async function submitDraft(data: ProspectFormValues, forceAllowDuplicate = false) {
    setLoading(true)

    const activity = activityEnabled
      ? {
          channel: activityForm.getValues("channel"),
          activityType: activityForm.getValues("activityType"),
          comment: activityForm.getValues("comment") || null,
          result: activityForm.getValues("result") || null,
          nextFollowUpAt: activityForm.getValues("nextFollowUpAt") || null,
        }
      : null

    const res = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        allowDuplicate: forceAllowDuplicate,
        initialActivity: activity,
      }),
    })

    setLoading(false)

    if (res.status === 409) {
      const payload = await res.json().catch(() => null)
      setDuplicateList(payload?.duplicates ?? [])
      setDuplicateOpen(true)
      return
    }

    if (!res.ok) {
      const payload = await res.json().catch(() => null)
      toast.error(payload?.message ?? "No se pudo guardar")
      return
    }

    const payload = await res.json()
    toast.success(mode === "create" ? "Prospecto creado" : "Prospecto actualizado")

    if (successHref && payload?.prospect?.id) {
      router.push(successHref.replace(":id", payload.prospect.id))
      return
    }

    router.refresh()
  }

  async function onSubmit(data: ProspectFormValues) {
    if (allowDuplicate) {
      await submitDraft(data, true)
      return
    }

    setActivityLoading(true)
    const dupRes = await fetch("/api/admin/prospects/duplicates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, excludeId: mode === "edit" ? prospectId : undefined }),
    })
    setActivityLoading(false)

    if (!dupRes.ok) {
      const payload = await dupRes.json().catch(() => null)
      toast.error(payload?.message ?? "No se pudo validar duplicados")
      return
    }

    const dupPayload = await dupRes.json()
    if (dupPayload.duplicates?.length) {
      setDuplicateList(dupPayload.duplicates)
      setDuplicateOpen(true)
      return
    }

    await submitDraft(data, false)
  }

  const activityForm = useForm({
    defaultValues: {
      channel: "OTHER" as ProspectContactChannelValue,
      activityType: "CONTACT_ATTEMPT" as ProspectActivityTypeValue,
      comment: "",
      result: "",
      nextFollowUpAt: "",
    },
    resolver: zodResolver(activitySchema),
  })
  const sourceValue = useWatch({ control, name: "source" })
  const statusValue = useWatch({ control, name: "status" })
  const priorityValue = useWatch({ control, name: "priority" })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{actionLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Negocio</Label>
                <Input {...register("businessName")} />
                {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Slug interno</Label>
                <Input {...register("slug")} placeholder="opcional" />
              </div>
              <div className="space-y-2">
                <Label>Contacto</Label>
                <Input {...register("contactName")} />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input {...register("phone")} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register("email")} type="email" />
              </div>
              <div className="space-y-2">
                <Label>Sitio web</Label>
                <Input {...register("website")} />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input {...register("facebookUrl")} />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input {...register("instagramUrl")} />
              </div>
              <div className="space-y-2">
                <Label>Google Maps</Label>
                <Input {...register("googleMapsUrl")} />
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Input {...register("city")} />
                {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input {...register("category")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Direccion</Label>
                <Input {...register("address")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notas</Label>
                <Textarea {...register("notes")} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Fuente</Label>
                <Select value={sourceValue} onValueChange={(value) => setValue("source", value as ProspectSourceValue, { shouldDirty: true })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROSPECT_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>{PROSPECT_SOURCE_LABELS[source]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={statusValue} onValueChange={(value) => setValue("status", value as ProspectStatusValue, { shouldDirty: true })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROSPECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{PROSPECT_STATUS_LABELS[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={priorityValue} onValueChange={(value) => setValue("priority", value as ProspectPriorityValue, { shouldDirty: true })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROSPECT_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>{PROSPECT_PRIORITY_LABELS[priority]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Actividad inicial</p>
                  <p className="text-sm text-muted-foreground">Opcional. Si se completa, se guarda junto con el prospecto.</p>
                </div>
                <Button type="button" variant={activityEnabled ? "default" : "outline"} onClick={() => setActivityEnabled((value) => !value)}>
                  {activityEnabled ? "Actividad activa" : "Agregar actividad"}
                </Button>
              </div>

              {activityEnabled && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Canal</Label>
                    <Select defaultValue="OTHER" onValueChange={(value) => activityForm.setValue("channel", value as ProspectContactChannelValue)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROSPECT_CONTACT_CHANNELS.map((channel) => (
                          <SelectItem key={channel} value={channel}>{PROSPECT_CONTACT_CHANNEL_LABELS[channel]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select defaultValue="CONTACT_ATTEMPT" onValueChange={(value) => activityForm.setValue("activityType", value as ProspectActivityTypeValue)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROSPECT_ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{PROSPECT_ACTIVITY_TYPE_LABELS[type]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Comentario</Label>
                    <Textarea {...activityForm.register("comment")} rows={3} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Resultado</Label>
                    <Input {...activityForm.register("result")} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Proximo seguimiento</Label>
                    <Input {...activityForm.register("nextFollowUpAt")} type="datetime-local" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={loading || activityLoading}>
                {loading ? "Guardando..." : submitLabel}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Posibles duplicados</DialogTitle>
            <DialogDescription>Revisa si uno de estos prospectos ya existe antes de continuar.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto">
            {duplicateList.map((item) => (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.businessName}</p>
                    <p className="text-sm text-muted-foreground">{item.contactName ?? "Sin contacto"} · {item.city}</p>
                    <p className="text-sm text-muted-foreground">{item.phone ?? "Sin telefono"} · {item.email ?? "Sin email"}</p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/admin/prospects/${item.id}`}>Abrir existente</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                setAllowDuplicate(true)
                setDuplicateOpen(false)
                await handleSubmit((data) => submitDraft(data, true))()
              }}
            >
              Guardar de todos modos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
