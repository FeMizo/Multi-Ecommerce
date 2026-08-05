"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  PROSPECT_CONTACT_CHANNELS,
  PROSPECT_CONTACT_CHANNEL_LABELS,
  PROSPECT_PRIORITIES,
  PROSPECT_PRIORITY_LABELS,
  PROSPECT_SOURCES,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_STATUSES,
  PROSPECT_STATUS_LABELS,
} from "@/lib/prospects"

type ProspectListFiltersProps = {
  initialQuery: string
  initialStatus: string
  initialSource: string
  initialChannel: string
  initialPriority: string
  initialCategory: string
  initialFollowUp: string
  initialSort: string
}

function syncParams(
  pathname: string,
  current: URLSearchParams,
  updates: Record<string, string | null | undefined>
) {
  const next = new URLSearchParams(current.toString())
  for (const [key, value] of Object.entries(updates)) {
    if (!value) next.delete(key)
    else next.set(key, value)
  }
  next.delete("page")
  return `${pathname}${next.toString() ? `?${next.toString()}` : ""}`
}

export function ProspectListFilters({
  initialQuery,
  initialStatus,
  initialSource,
  initialChannel,
  initialPriority,
  initialCategory,
  initialFollowUp,
  initialSort,
}: ProspectListFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const values = useMemo(() => ({
    q: initialQuery,
    status: initialStatus,
    source: initialSource,
    channel: initialChannel,
    priority: initialPriority,
    category: initialCategory,
    followUp: initialFollowUp,
    sort: initialSort,
  }), [initialQuery, initialStatus, initialSource, initialChannel, initialPriority, initialCategory, initialFollowUp, initialSort])

  return (
    <div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
      <Input
        defaultValue={values.q}
        placeholder="Buscar por negocio, contacto, telefono, email o redes"
        onChange={(event) => {
          const href = syncParams(pathname, params, { q: event.target.value || null })
          router.replace(href)
        }}
        className="xl:col-span-2"
      />

      <Select defaultValue={values.status || "all"} onValueChange={(value) => router.replace(syncParams(pathname, params, { status: value === "all" ? null : value }))}>
        <SelectTrigger>
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {PROSPECT_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {PROSPECT_STATUS_LABELS[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={values.source || "all"} onValueChange={(value) => router.replace(syncParams(pathname, params, { source: value === "all" ? null : value }))}>
        <SelectTrigger>
          <SelectValue placeholder="Fuente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las fuentes</SelectItem>
          {PROSPECT_SOURCES.map((source) => (
            <SelectItem key={source} value={source}>
              {PROSPECT_SOURCE_LABELS[source]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={values.channel || "all"} onValueChange={(value) => router.replace(syncParams(pathname, params, { channel: value === "all" ? null : value }))}>
        <SelectTrigger>
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los canales</SelectItem>
          {PROSPECT_CONTACT_CHANNELS.map((channel) => (
            <SelectItem key={channel} value={channel}>
              {PROSPECT_CONTACT_CHANNEL_LABELS[channel]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={values.priority || "all"} onValueChange={(value) => router.replace(syncParams(pathname, params, { priority: value === "all" ? null : value }))}>
        <SelectTrigger>
          <SelectValue placeholder="Prioridad" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las prioridades</SelectItem>
          {PROSPECT_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {PROSPECT_PRIORITY_LABELS[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        defaultValue={values.category}
        placeholder="Categoria"
        onChange={(event) => {
          const href = syncParams(pathname, params, { category: event.target.value || null })
          router.replace(href)
        }}
      />

      <Select defaultValue={values.followUp || "all"} onValueChange={(value) => router.replace(syncParams(pathname, params, { followUp: value === "all" ? null : value }))}>
        <SelectTrigger>
          <SelectValue placeholder="Seguimiento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="overdue">Vencidos</SelectItem>
          <SelectItem value="today">Hoy</SelectItem>
          <SelectItem value="upcoming">Próximos 7 días</SelectItem>
          <SelectItem value="none">Sin fecha</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue={values.sort} onValueChange={(value) => router.replace(syncParams(pathname, params, { sort: value }))}>
        <SelectTrigger>
          <SelectValue placeholder="Orden" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="createdAt">Creación</SelectItem>
          <SelectItem value="lastContactAt">Último contacto</SelectItem>
          <SelectItem value="nextFollowUpAt">Próximo seguimiento</SelectItem>
        </SelectContent>
      </Select>

      <Button type="button" variant="outline" onClick={() => router.replace(pathname)}>
        Limpiar filtros
      </Button>
    </div>
  )
}
