"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Pencil, Plus, Trash2, UserRoundCog } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DRIVER_STATUS_DESCRIPTIONS, DRIVER_STATUS_LABELS, type DriverStatusValue } from "@/lib/delivery"
import { driverFormSchema } from "@/lib/delivery-schemas"

type DriverRecord = {
  id: string
  name: string
  phone: string
  plate: string
  licenseNumber: string
  notes: string | null
  status: DriverStatusValue
  activeDelivery: { id: string; status: string } | null
  createdAt: string | Date
  updatedAt: string | Date
}

type FormValues = z.infer<typeof driverFormSchema>

type Props = {
  storeSlug: string
  drivers: DriverRecord[]
  canManage: boolean
}

const emptyValues: FormValues = {
  name: "",
  phone: "",
  plate: "",
  licenseNumber: "",
  notes: "",
  status: "AVAILABLE",
}

export function DriverManager({ storeSlug, drivers, canManage }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const editingDriver = useMemo(() => drivers.find((driver) => driver.id === editingId) ?? null, [drivers, editingId])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (!editingDriver) {
      reset(emptyValues)
      return
    }
    reset({
      name: editingDriver.name,
      phone: editingDriver.phone,
      plate: editingDriver.plate,
      licenseNumber: editingDriver.licenseNumber,
      notes: editingDriver.notes ?? "",
      status: editingDriver.status,
    })
  }, [editingDriver, reset])

  async function submit(values: FormValues) {
    if (!canManage) return
    setSaving(true)
    const payload = {
      ...values,
      name: values.name.trim(),
      phone: values.phone.trim(),
      plate: values.plate.trim(),
      licenseNumber: values.licenseNumber.trim(),
      notes: values.notes.trim(),
    }
    const res = await fetch(
      editingDriver
        ? `/api/stores/${storeSlug}/drivers/${editingDriver.id}`
        : `/api/stores/${storeSlug}/drivers`,
      {
        method: editingDriver ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )
    setSaving(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo guardar el repartidor")
      return
    }

    toast.success(editingDriver ? "Repartidor actualizado" : "Repartidor creado")
    setOpen(false)
    setEditingId(null)
    reset(emptyValues)
    router.refresh()
  }

  async function removeDriver(driverId: string) {
    if (!canManage) return
    if (!window.confirm("¿Eliminar este repartidor?")) return
    setDeletingId(driverId)
    const res = await fetch(`/api/stores/${storeSlug}/drivers/${driverId}`, { method: "DELETE" })
    setDeletingId(null)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo eliminar el repartidor")
      return
    }
    toast.success("Repartidor eliminado")
    router.refresh()
  }

  function openCreate() {
    setEditingId(null)
    reset(emptyValues)
    setOpen(true)
  }

  function openEdit(driverId: string) {
    setEditingId(driverId)
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Repartidores</h1>
          <p className="text-sm text-muted-foreground">{drivers.length} registrados</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} disabled={!canManage}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo repartidor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDriver ? "Editar repartidor" : "Nuevo repartidor"}</DialogTitle>
              <DialogDescription>
                {editingDriver ? "Actualiza el perfil y el estado." : "Crea un repartidor para esta tienda."}
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit(submit)}>
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Teléfono</Label>
                <Input {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Placa</Label>
                  <Input {...register("plate")} />
                  {errors.plate && <p className="text-xs text-destructive">{errors.plate.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Licencia</Label>
                  <Input {...register("licenseNumber")} />
                  {errors.licenseNumber && <p className="text-xs text-destructive">{errors.licenseNumber.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <Label>Estado</Label>
                <Select value={watch("status")} onValueChange={(value) => setValue("status", value as DriverStatusValue, { shouldDirty: true })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["AVAILABLE", "OFFLINE"] as DriverStatusValue[]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {DRIVER_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{DRIVER_STATUS_DESCRIPTIONS[watch("status")]}</p>
              </div>
              <div className="space-y-1">
                <Label>Notas</Label>
                <Textarea {...register("notes")} rows={4} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || !canManage}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingDriver ? "Guardar cambios" : "Crear repartidor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {drivers.map((driver) => (
          <div key={driver.id} className="rounded-2xl border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <UserRoundCog className="h-4 w-4 text-primary" />
                  <p className="font-semibold">{driver.name}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold">
                    {DRIVER_STATUS_LABELS[driver.status]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>Tel: {driver.phone}</span>
                  <span>Placa: {driver.plate}</span>
                  <span>Licencia: {driver.licenseNumber}</span>
                  {driver.activeDelivery && <span>Entrega activa: {driver.activeDelivery.status}</span>}
                </div>
                {driver.notes && <p className="text-sm text-muted-foreground">{driver.notes}</p>}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(driver.id)} disabled={!canManage}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void removeDriver(driver.id)}
                  disabled={!canManage || deletingId === driver.id}
                >
                  {deletingId === driver.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay repartidores creados.
          </div>
        )}
      </div>
    </div>
  )
}
