"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"

const schema = z.object({
  name: z.string().min(2, "Requerido"),
  slug: z.string().min(2, "Requerido").regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  state: z.string().min(2, "Requerido"),
  country: z.string().min(1),
})
type FormData = z.infer<typeof schema>

type City = {
  id: string
  name: string
  slug: string
  state: string
  country: string
  active: boolean
  _count: { stores: number }
}

export function CityManager({ cities }: { cities: City[] }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: "MX" },
  })

  async function onAdd(data: FormData) {
    setLoading(true)
    const res = await fetch("/api/admin/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al crear ciudad")
      return
    }
    toast.success("Ciudad creada")
    reset()
    router.refresh()
  }

  async function toggleActive(cityId: string, active: boolean) {
    const res = await fetch(`/api/admin/cities/${cityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    })
    if (!res.ok) { toast.error("Error al actualizar"); return }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Nueva ciudad</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onAdd)} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nombre</label>
              <Input {...register("name")} placeholder="Lima" className="w-36" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Slug</label>
              <Input {...register("slug")} placeholder="lima" className="w-36" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Departamento</label>
              <Input {...register("state")} placeholder="Lima" className="w-36" />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">País</label>
              <Input {...register("country")} placeholder="PE" className="w-20" />
            </div>
            <Button type="submit" disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">Ciudad</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Slug</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Departamento</th>
                <th className="text-left p-4 font-medium text-muted-foreground">País</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Tiendas</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Activa</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city) => (
                <tr key={city.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-4 font-medium">{city.name}</td>
                  <td className="p-4 text-muted-foreground">{city.slug}</td>
                  <td className="p-4 text-muted-foreground">{city.state}</td>
                  <td className="p-4 text-muted-foreground">{city.country}</td>
                  <td className="p-4 text-center">{city._count.stores}</td>
                  <td className="p-4 text-center">
                    <Button
                      variant={city.active ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleActive(city.id, !city.active)}
                      className="text-xs h-7 px-2"
                    >
                      {city.active ? "Activa" : "Inactiva"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
