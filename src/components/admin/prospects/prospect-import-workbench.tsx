"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { parseCsv, normalizeCsvHeader } from "@/lib/csv"
import {
  PROSPECT_PRIORITY_LABELS,
  PROSPECT_PRIORITIES,
  PROSPECT_SOURCE_LABELS,
  PROSPECT_SOURCES,
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUSES,
  type ProspectPriorityValue,
  type ProspectSourceValue,
  type ProspectStatusValue,
} from "@/lib/prospects"

type PreviewRow = {
  id: string
  businessName: string
  contactName: string
  phone: string
  email: string
  website: string
  facebookUrl: string
  instagramUrl: string
  googleMapsUrl: string
  address: string
  city: string
  category: string
  notes: string
  source: ProspectSourceValue
  status: ProspectStatusValue
  priority: ProspectPriorityValue
  hasDuplicates: boolean
  duplicateCount: number
}

const COLUMN_MAP: Record<string, keyof Omit<PreviewRow, "id" | "hasDuplicates" | "duplicateCount">> = {
  businessname: "businessName",
  negocio: "businessName",
  nombre: "businessName",
  contactname: "contactName",
  contacto: "contactName",
  phone: "phone",
  telefono: "phone",
  email: "email",
  website: "website",
  sitio: "website",
  facebookurl: "facebookUrl",
  facebook: "facebookUrl",
  instagramurl: "instagramUrl",
  instagram: "instagramUrl",
  googlemapsurl: "googleMapsUrl",
  maps: "googleMapsUrl",
  direccion: "address",
  address: "address",
  city: "city",
  ciudad: "city",
  category: "category",
  categoria: "category",
  notes: "notes",
  notas: "notes",
  source: "source",
  fuente: "source",
  status: "status",
  estado: "status",
  priority: "priority",
  prioridad: "priority",
}

function parseRows(text: string, fallbackSource: ProspectSourceValue) {
  const rows = parseCsv(text)
  if (!rows.length) return []

  const headers = rows[0].map((header) => normalizeCsvHeader(header))
  return rows.slice(1).map((row, index) => {
    const result: PreviewRow = {
      id: `row-${index}`,
      businessName: "",
      contactName: "",
      phone: "",
      email: "",
      website: "",
      facebookUrl: "",
      instagramUrl: "",
      googleMapsUrl: "",
      address: "",
      city: "",
      category: "",
      notes: "",
      source: fallbackSource,
      status: "NEW",
      priority: "MEDIUM",
      hasDuplicates: false,
      duplicateCount: 0,
    }

    headers.forEach((header, columnIndex) => {
      const key = COLUMN_MAP[header]
      if (!key) return
      const value = row[columnIndex]?.trim() ?? ""
      if (!value) return

      if (key === "source" && PROSPECT_SOURCES.includes(value as ProspectSourceValue)) {
        result.source = value as ProspectSourceValue
        return
      }
      if (key === "status" && PROSPECT_STATUSES.includes(value as ProspectStatusValue)) {
        result.status = value as ProspectStatusValue
        return
      }
      if (key === "priority" && PROSPECT_PRIORITIES.includes(value as ProspectPriorityValue)) {
        result.priority = value as ProspectPriorityValue
        return
      }

      ;(result as unknown as Record<string, string>)[key] = value
    })

    return result
  }).filter((row) => row.businessName || row.contactName || row.phone || row.email || row.city)
}

export function ProspectImportWorkbench() {
  const [source, setSource] = useState<ProspectSourceValue>("MANUAL")
  const [rawText, setRawText] = useState("")
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  const selectedRows = useMemo(() => rows.filter((row) => selected[row.id]), [rows, selected])

  async function analyze() {
    const parsed = parseRows(rawText, source)
    if (!parsed.length) {
      toast.error("No se encontraron filas")
      return
    }

    setAnalyzing(true)
    const checked = await Promise.all(parsed.map(async (row) => {
      const res = await fetch("/api/admin/prospects/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: row.businessName,
          slug: "",
          phone: row.phone,
          email: row.email,
          website: row.website,
          facebookUrl: row.facebookUrl,
          instagramUrl: row.instagramUrl,
          googleMapsUrl: row.googleMapsUrl,
        }),
      })

      if (!res.ok) {
        return { ...row, hasDuplicates: false, duplicateCount: 0 }
      }

      const payload = await res.json()
      return { ...row, hasDuplicates: Boolean(payload.duplicates?.length), duplicateCount: payload.duplicates?.length ?? 0 }
    }))
    setAnalyzing(false)

    setRows(checked)
    setSelected(Object.fromEntries(checked.map((row) => [row.id, true])))
  }

  async function saveSelected() {
    if (!selectedRows.length) {
      toast.error("Selecciona al menos una fila")
      return
    }

    setSaving(true)
    let saved = 0
    let failed = 0

    for (const row of selectedRows) {
      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: row.businessName,
          slug: "",
          contactName: row.contactName || null,
          phone: row.phone || null,
          email: row.email || null,
          website: row.website || null,
          facebookUrl: row.facebookUrl || null,
          instagramUrl: row.instagramUrl || null,
          googleMapsUrl: row.googleMapsUrl || null,
          address: row.address || null,
          city: row.city,
          category: row.category || null,
          notes: row.notes || null,
          source: row.source,
          status: row.status,
          priority: row.priority,
          allowDuplicate: true,
        }),
      })

      if (res.ok) {
        saved += 1
      } else {
        failed += 1
      }
    }

    setSaving(false)
    toast.success(`Importados ${saved} prospectos`)
    if (failed > 0) {
      toast.error(`Fallaron ${failed} filas`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importación manual y CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fuente original</Label>
              <Select value={source} onValueChange={(value) => setSource(value as ProspectSourceValue)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROSPECT_SOURCES.map((option) => (
                    <SelectItem key={option} value={option}>{PROSPECT_SOURCE_LABELS[option]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Archivo CSV</Label>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  setRawText(text)
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pegar CSV</Label>
            <Textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={12}
              placeholder="businessName,contactName,phone,email,city"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={analyze} disabled={analyzing}>
              {analyzing ? "Analizando..." : "Revisar prospectos"}
            </Button>
            <Button type="button" variant="outline" onClick={saveSelected} disabled={saving}>
              {saving ? "Importando..." : `Guardar seleccionados (${selectedRows.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista previa</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-max w-full whitespace-nowrap text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Sel</th>
                  <th className="p-4 text-left">Negocio</th>
                  <th className="p-4 text-left">Contacto</th>
                  <th className="p-4 text-left">Ciudad</th>
                  <th className="p-4 text-left">Fuente</th>
                  <th className="p-4 text-left">Estado</th>
                  <th className="p-4 text-left">Prioridad</th>
                  <th className="p-4 text-left">Duplicados</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[row.id])}
                        onChange={(event) => setSelected((current) => ({ ...current, [row.id]: event.target.checked }))}
                      />
                    </td>
                    <td className="p-4 font-medium">{row.businessName}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p>{row.contactName || "—"}</p>
                        <p className="text-muted-foreground">{row.phone || "—"}</p>
                        <p className="text-muted-foreground">{row.email || "—"}</p>
                      </div>
                    </td>
                    <td className="p-4">{row.city || "—"}</td>
                    <td className="p-4">{PROSPECT_SOURCE_LABELS[row.source]}</td>
                    <td className="p-4">{PROSPECT_STATUS_LABELS[row.status]}</td>
                    <td className="p-4">{PROSPECT_PRIORITY_LABELS[row.priority]}</td>
                    <td className="p-4">
                      {row.hasDuplicates ? <Badge variant="secondary">{row.duplicateCount} coincidencias</Badge> : <Badge variant="outline">Sin coincidencias</Badge>}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-muted-foreground" colSpan={8}>
                      Sin vista previa
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-sm text-muted-foreground">
            Puedes revisar, desmarcar filas y guardar solo las seleccionadas.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
