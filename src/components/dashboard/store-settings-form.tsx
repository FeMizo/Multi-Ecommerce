"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
  description: z.string().max(300, "Máximo 300 caracteres").optional(),
  logoUrl: z.string().url("URL inválida").or(z.literal("")).optional(),
  bannerUrl: z.string().url("URL inválida").or(z.literal("")).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  fontFamily: z.string(),
  cityId: z.string().optional(),
  customDomain: z.string().max(100).optional(),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof schema>

type City = { id: string; name: string }

type Props = {
  storeSlug: string
  initialData: FormData & { slug: string }
  cities: City[]
  isOwner: boolean
}

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Poppins", label: "Poppins" },
  { value: "Roboto", label: "Roboto" },
  { value: "Lato", label: "Lato" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Merriweather", label: "Merriweather" },
]

export function StoreSettingsForm({ storeSlug, initialData, cities, isOwner }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
    },
  })

  const primaryColor = watch("primaryColor")
  const isActive = watch("isActive")

  async function onSubmit(data: FormData) {
    setLoading(true)
    const payload = {
      ...data,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,
      cityId: data.cityId || null,
      customDomain: data.customDomain || null,
    }
    const res = await fetch(`/api/stores/${storeSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al guardar")
      return
    }
    toast.success("Cambios guardados")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted-foreground">/{initialData.slug}</p>
        </div>
        <Button type="submit" disabled={loading || !isOwner}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
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
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Ciudad</Label>
                <Select
                  defaultValue={initialData.cityId ?? "none"}
                  onValueChange={(v) => setValue("cityId", v === "none" ? "" : v)}
                >
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
              <CardTitle className="text-base">Apariencia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>URL del logo</Label>
                <Input placeholder="https://ejemplo.com/logo.png" {...register("logoUrl")} />
                {errors.logoUrl && (
                  <p className="text-xs text-destructive">{errors.logoUrl.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>URL del banner</Label>
                <Input placeholder="https://ejemplo.com/banner.jpg" {...register("bannerUrl")} />
                {errors.bannerUrl && (
                  <p className="text-xs text-destructive">{errors.bannerUrl.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Color principal</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 w-9 rounded-md border shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <Input
                      type="color"
                      className="h-9 cursor-pointer p-1"
                      {...register("primaryColor")}
                    />
                  </div>
                  {errors.primaryColor && (
                    <p className="text-xs text-destructive">{errors.primaryColor.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Tipografía</Label>
                  <Select
                    defaultValue={initialData.fontFamily ?? "Inter"}
                    onValueChange={(v) => setValue("fontFamily", v)}
                  >
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dominio personalizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Dominio</Label>
                <Input placeholder="mitienda.com" {...register("customDomain")} />
                <p className="text-xs text-muted-foreground">
                  Configura un CNAME en tu DNS apuntando a la plataforma.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="cursor-pointer">Tienda activa</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isActive ? "Visible al público" : "Oculta al público"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary cursor-pointer"
                  disabled={!isOwner}
                  {...register("isActive")}
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
                  Solo el propietario puede modificar la configuración.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  )
}
