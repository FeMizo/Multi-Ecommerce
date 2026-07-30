"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ToggleStatusButton } from "@/components/admin/action-buttons"
import { buildTransferReference, TRANSFER_REFERENCE_LIMIT } from "@/lib/transfer-details"

const schema = z
  .object({
    name: z.string().min(2, "Minimo 2 caracteres").max(60, "Maximo 60 caracteres"),
    description: z.string().max(300, "Maximo 300 caracteres").optional(),
    logoUrl: z.string().url("URL invalida").or(z.literal("")).optional(),
    bannerUrl: z.string().url("URL invalida").or(z.literal("")).optional(),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color invalido"),
    fontFamily: z.string(),
    cityId: z.string().optional(),
    customDomain: z.string().max(100).optional(),
    isActive: z.boolean(),
    transferEnabled: z.boolean(),
    transferAccountName: z.string().max(120).optional(),
    transferAccountNumber: z.string().max(40).optional(),
    transferBank: z.string().max(80).optional(),
    transferReferencePrefix: z.string().max(20).optional(),
    transferReferenceExtra: z.string().max(20).optional(),
  })
  .superRefine((data, ctx) => {
    const reference = buildTransferReference(data.transferReferencePrefix, data.transferReferenceExtra)
    if (reference.length > TRANSFER_REFERENCE_LIMIT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["transferReferenceExtra"],
        message: "La referencia combinada no debe pasar de 10 caracteres.",
      })
    }
  })

type FormData = z.infer<typeof schema>
type City = { id: string; name: string }

type Props = {
  storeSlug: string
  initialData: FormData & { slug: string; cashOnDeliveryEnabled: boolean }
  cities: City[]
  isOwner: boolean
  canManageVisibility: boolean
  stripeOnboarded: boolean
  cashOnDeliveryEnabled: boolean
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
  { value: "Roboto", label: "Roboto" },
  { value: "Lato", label: "Lato" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
]

export function StoreSettingsForm({
  storeSlug,
  initialData,
  cities,
  isOwner,
  canManageVisibility,
  stripeOnboarded,
  cashOnDeliveryEnabled: initialCashOnDeliveryEnabled,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [connectingStripe, setConnectingStripe] = useState(false)
  const [visibilityLoading, setVisibilityLoading] = useState(false)
  const [cashOnDeliveryLoading, setCashOnDeliveryLoading] = useState(false)
  const [cashOnDeliveryEnabled, setCashOnDeliveryEnabled] = useState(initialCashOnDeliveryEnabled)
  const [uploadingAsset, setUploadingAsset] = useState<"logoUrl" | "bannerUrl" | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData.name,
      description: initialData.description ?? "",
      logoUrl: initialData.logoUrl ?? "",
      bannerUrl: initialData.bannerUrl ?? "",
      primaryColor: initialData.primaryColor ?? "#000000",
      fontFamily: initialData.fontFamily ?? "Inter",
      cityId: initialData.cityId ?? "",
      customDomain: initialData.customDomain ?? "",
      isActive: initialData.isActive,
      transferEnabled: initialData.transferEnabled,
      transferAccountName: initialData.transferAccountName ?? "",
      transferAccountNumber: initialData.transferAccountNumber ?? "",
      transferBank: initialData.transferBank ?? "",
      transferReferencePrefix: initialData.transferReferencePrefix ?? "",
      transferReferenceExtra: initialData.transferReferenceExtra ?? "",
    },
  })

  const primaryColor = useWatch({ control, name: "primaryColor" })
  const isActive = useWatch({ control, name: "isActive" })
  const transferEnabled = useWatch({ control, name: "transferEnabled" })
  const transferReferencePrefix = useWatch({ control, name: "transferReferencePrefix" })
  const transferReferenceExtra = useWatch({ control, name: "transferReferenceExtra" })
  const transferReference = buildTransferReference(transferReferencePrefix, transferReferenceExtra)

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = {
      ...data,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,
      cityId: data.cityId || null,
      customDomain: data.customDomain || null,
      transferAccountName: data.transferAccountName || null,
      transferAccountNumber: data.transferAccountNumber || null,
      transferBank: data.transferBank || null,
      transferReferencePrefix: data.transferReferencePrefix || null,
      transferReferenceExtra: data.transferReferenceExtra || null,
    }
    const res = await fetch(`/api/stores/${storeSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "Error al guardar")
      return
    }
    toast.success("Cambios guardados")
    router.refresh()
  }

  async function startStripeOnboarding() {
    setConnectingStripe(true)
    const res = await fetch(`/api/stores/${storeSlug}/stripe/onboarding`, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    setConnectingStripe(false)
    if (!res.ok || !data.url) {
      toast.error(data.message ?? "No se pudo iniciar Stripe Connect")
      return
    }
    window.location.assign(data.url)
  }

  async function updateVisibility(nextIsActive: boolean) {
    setVisibilityLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/visibility`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: nextIsActive }),
    })
    setVisibilityLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo actualizar la visibilidad")
      return
    }
    setValue("isActive", nextIsActive, { shouldDirty: false })
    toast.success(nextIsActive ? "Tienda visible" : "Tienda oculta")
    router.refresh()
  }

  async function updateCashOnDelivery(nextEnabled: boolean) {
    setCashOnDeliveryLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/payment-options`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cashOnDeliveryEnabled: nextEnabled }),
    })
    setCashOnDeliveryLoading(false)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "No se pudo actualizar el cobro al entregar")
      return
    }
    setCashOnDeliveryEnabled(nextEnabled)
    toast.success(nextEnabled ? "Cobro al entregar habilitado" : "Cobro al entregar deshabilitado")
    router.refresh()
  }

  async function uploadAsset(field: "logoUrl" | "bannerUrl", file?: File) {
    if (!file) return
    setUploadingAsset(field)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("storeSlug", storeSlug)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = (await res.json().catch(() => ({}))) as { message?: string; url?: string }
      if (!res.ok || !data.url) {
        toast.error(data.message ?? "No se pudo subir la imagen")
        return
      }
      setValue(field, data.url, { shouldValidate: true, shouldDirty: true })
      toast.success("Imagen subida; guarda los cambios para aplicarla")
    } catch {
      toast.error("No se pudo subir la imagen")
    } finally {
      setUploadingAsset(null)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">/{initialData.slug}</p>
        </div>
        <Button type="submit" disabled={loading || !isOwner}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Nombre de la tienda *</Label>
                <Input placeholder="Mi tienda" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Describe tu tienda..."
                  rows={3}
                  className="resize-none"
                  {...register("description")}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>Ciudad</Label>
                <Select defaultValue={initialData.cityId ?? "none"} onValueChange={(v) => setValue("cityId", v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin ciudad</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cobros con Stripe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {stripeOnboarded ? "Tu cuenta puede recibir pagos." : "Conecta tu cuenta para recibir pagos en MXN."}
              </p>
              <Button
                type="button"
                variant={stripeOnboarded ? "outline" : "default"}
                disabled={!isOwner || connectingStripe}
                onClick={startStripeOnboarding}
              >
                {connectingStripe ? "Abriendo Stripe..." : stripeOnboarded ? "Actualizar Stripe Connect" : "Conectar Stripe"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cobro al entregar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Permite que el cliente pague al recibir su pedido. La tienda asume el riesgo de este cobro.
              </p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="cursor-pointer">Habilitar pago contra entrega</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cashOnDeliveryEnabled ? "Visible para visitantes" : "Oculto para visitantes"}
                  </p>
                </div>
                <ToggleStatusButton
                  active={cashOnDeliveryEnabled}
                  onClick={() => updateCashOnDelivery(!cashOnDeliveryEnabled)}
                  loading={cashOnDeliveryLoading}
                  disabled={!isOwner}
                  activeLabel="Habilitado"
                  inactiveLabel="Deshabilitado"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pago por transferencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                El cliente recibirá un código de referencia al finalizar. La tienda configura sus datos bancarios y asume el riesgo.
              </p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="cursor-pointer">Habilitar pago por transferencia</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {transferEnabled ? "Visible para visitantes" : "Oculto para visitantes"}
                  </p>
                </div>
                <ToggleStatusButton
                  active={transferEnabled}
                  onClick={() => setValue("transferEnabled", !transferEnabled, { shouldDirty: true })}
                  disabled={!isOwner}
                  activeLabel="Habilitado"
                  inactiveLabel="Deshabilitado"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nombre del titular</Label>
                  <Input placeholder="Nombre legal del titular" {...register("transferAccountName")} />
                  {errors.transferAccountName && <p className="text-xs text-destructive">{errors.transferAccountName.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Banco</Label>
                  <Input placeholder="Banco receptor" {...register("transferBank")} />
                  {errors.transferBank && <p className="text-xs text-destructive">{errors.transferBank.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Cuenta o CLABE</Label>
                  <Input placeholder="Cuenta o CLABE" {...register("transferAccountNumber")} />
                  {errors.transferAccountNumber && <p className="text-xs text-destructive">{errors.transferAccountNumber.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label>Prefijo de referencia</Label>
                  <Input placeholder="TIENDA123" {...register("transferReferencePrefix")} />
                  {errors.transferReferencePrefix && <p className="text-xs text-destructive">{errors.transferReferencePrefix.message}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Extra para referencia</Label>
                <Input placeholder="Opcional" {...register("transferReferenceExtra")} />
                {errors.transferReferenceExtra && <p className="text-xs text-destructive">{errors.transferReferenceExtra.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Referencia: {transferReference || "Sin definir"}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">
                La referencia combinada no debe pasar de 10 caracteres.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Apariencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>URL del logo</Label>
                <Input placeholder="https://ejemplo.com/logo.png" {...register("logoUrl")} />
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingAsset !== null}
                  onChange={(event) => uploadAsset("logoUrl", event.target.files?.[0])}
                />
                {uploadingAsset === "logoUrl" && <p className="text-xs text-muted-foreground">Subiendo logo...</p>}
                {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>URL del banner</Label>
                <Input placeholder="https://ejemplo.com/banner.jpg" {...register("bannerUrl")} />
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploadingAsset !== null}
                  onChange={(event) => uploadAsset("bannerUrl", event.target.files?.[0])}
                />
                {uploadingAsset === "bannerUrl" && <p className="text-xs text-muted-foreground">Subiendo banner...</p>}
                {errors.bannerUrl && <p className="text-xs text-destructive">{errors.bannerUrl.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Color principal</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-md border shrink-0" style={{ backgroundColor: primaryColor }} />
                    <Input type="color" className="h-9 cursor-pointer p-1" {...register("primaryColor")} />
                  </div>
                  {errors.primaryColor && <p className="text-xs text-destructive">{errors.primaryColor.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Tipografia</Label>
                  <Select defaultValue={initialData.fontFamily ?? "Inter"} onValueChange={(v) => setValue("fontFamily", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="cursor-pointer">Tienda activa</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isActive ? "Visible al publico" : "Oculta al publico"}
                  </p>
                </div>
                <ToggleStatusButton
                  active={isActive}
                  onClick={() => updateVisibility(!isActive)}
                  loading={visibilityLoading}
                  disabled={!canManageVisibility}
                  activeLabel="Visible"
                  inactiveLabel="Oculta"
                />
              </div>

              <Separator />

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">URL de la tienda</Label>
                <p className="text-sm font-mono">/{initialData.slug}</p>
                <p className="text-xs text-muted-foreground">El slug no se puede cambiar.</p>
              </div>
            </CardContent>
          </Card>

          {!isOwner && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
              <CardContent className="pt-4">
                <p className="text-xs text-yellow-800 dark:text-yellow-400">
                  Solo el propietario puede modificar la configuracion general.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}


