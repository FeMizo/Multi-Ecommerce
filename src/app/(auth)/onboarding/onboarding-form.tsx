"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
  slug: z
    .string()
    .min(2, "Mínimo 2 caracteres")
    .max(40, "Máximo 40 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo letras minúsculas, números y guiones"),
  description: z.string().max(300, "Máximo 300 caracteres").optional(),
})
type FormData = z.infer<typeof schema>

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
}

export function OnboardingForm({ planId }: { planId: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!planId) router.replace("/plans")
  }, [planId, router])

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const slug = useWatch({ control, name: "slug" }) ?? ""

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("name", e.target.value)
    setValue("slug", toSlug(e.target.value), { shouldValidate: true })
  }

  async function onSubmit(data: FormData) {
    if (!planId) {
      setLoading(false)
      return
    }

    setLoading(true)
    const res = await fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al crear la tienda")
      setLoading(false)
      return
    }

    const { slug: storeSlug } = await res.json()

    const checkout = await fetch(`/api/stores/${storeSlug}/subscription`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "checkout",
        planId,
        checkoutToken: crypto.randomUUID(),
      }),
    })
    const payload = await checkout.json().catch(() => ({}))
    setLoading(false)
    if (!checkout.ok || !payload.url) {
      toast.error(payload.message ?? "No se pudo abrir el pago del plan")
      return
    }
    window.location.assign(payload.url)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Crea tu tienda</h1>
          <p className="text-muted-foreground mt-1">Tarda menos de 2 minutos.</p>
          {planId && (
            <p className="mt-2 text-sm text-primary">Vas a continuar con la compra del plan seleccionado.</p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información básica</CardTitle>
            <CardDescription>El nombre de tu negocio o emprendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label>Nombre de la tienda</Label>
                <Input
                  placeholder="Ej: Artesanías Rosario"
                  {...register("name")}
                  onChange={handleNameChange}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>URL de tu tienda</Label>
                <div className="flex items-center gap-0">
                  <span className="flex items-center px-3 h-9 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md border-input">
                    /
                  </span>
                  <Input
                    className="rounded-l-none"
                    placeholder="artesanias-rosario"
                    {...register("slug")}
                  />
                </div>
                {slug && !errors.slug && (
                  <p className="text-xs text-muted-foreground">
                    Tu tienda quedará en: <span className="font-medium text-foreground">/{slug}</span>
                  </p>
                )}
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>
                  Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
                </Label>
                <Textarea
                  placeholder="¿Qué vendes? ¿A quién le vendes?"
                  rows={3}
                  className="resize-none"
                  {...register("description")}
                />
                {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading
                  ? "Creando tienda y abriendo pago..."
                  : "Crear tienda y adquirir plan"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
