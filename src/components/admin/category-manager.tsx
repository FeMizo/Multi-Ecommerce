"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Plus, PencilLine, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DeleteIconButton, ToggleStatusButton } from "@/components/admin/action-buttons"
import { formatCategoryLabel } from "@/lib/categories"

const ROOT_PARENT = "__root__"

const schema = z.object({
  name: z.string().min(2, "Requerido"),
  slug: z.string().max(80, "Maximo 80 caracteres").optional(),
  icon: z.string().max(32).optional(),
  image: z.string().max(255).optional(),
  parentId: z.string().optional(),
  active: z.boolean(),
})

type FormData = z.infer<typeof schema>

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  image: string | null
  parentId: string | null
  active: boolean
  parent: { id: string; name: string; slug: string } | null
  _count: { products: number; children: number }
}

function buildTree(categories: Category[]) {
  const children = new Map<string | null, Category[]>()

  for (const category of categories) {
    const key = category.parentId ?? null
    const list = children.get(key) ?? []
    list.push(category)
    children.set(key, list)
  }

  const sortItems = (items: Category[]) => [...items].sort((a, b) => a.name.localeCompare(b.name, "es"))
  const result: Array<{ category: Category; depth: number }> = []

  const visit = (parentId: string | null, depth: number) => {
    for (const category of sortItems(children.get(parentId) ?? [])) {
      result.push({ category, depth })
      visit(category.id, depth + 1)
    }
  }

  visit(null, 0)

  return {
    rows: result,
    roots: sortItems(children.get(null) ?? []),
  }
}

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [toggleLoading, setToggleLoading] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { rows, roots } = useMemo(() => buildTree(categories), [categories])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      active: true,
      parentId: ROOT_PARENT,
      slug: "",
      icon: "",
      image: "",
    },
  })

  const selectedParentId = watch("parentId") ?? ROOT_PARENT

  function clearForm() {
    setEditingId(null)
    reset({
      name: "",
      slug: "",
      icon: "",
      image: "",
      parentId: ROOT_PARENT,
      active: true,
    })
  }

  function startEdit(category: Category) {
    setEditingId(category.id)
    reset({
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? "",
      image: category.image ?? "",
      parentId: category.parentId ?? ROOT_PARENT,
      active: category.active,
    })
  }

  async function submitCategory(data: FormData) {
    setLoading(true)
    const payload = {
      name: data.name,
      slug: data.slug?.trim() || null,
      icon: data.icon?.trim() || null,
      image: data.image?.trim() || null,
      parentId: data.parentId === ROOT_PARENT ? null : data.parentId ?? null,
      active: data.active,
    }

    const response = await fetch(
      editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories",
      {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    setLoading(false)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      toast.error(error.message ?? "No se pudo guardar la categoria")
      return
    }

    toast.success(editingId ? "Categoria actualizada" : "Categoria creada")
    clearForm()
    router.refresh()
  }

  async function toggleActive(category: Category) {
    setToggleLoading(category.id)
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !category.active }),
    })
    setToggleLoading(null)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      toast.error(error.message ?? "No se pudo actualizar")
      return
    }

    router.refresh()
  }

  async function deleteCategory(category: Category) {
    if (category._count.products > 0 || category._count.children > 0) {
      toast.error("No se puede eliminar: tiene productos o subcategorias")
      return
    }
    if (!window.confirm("Eliminar esta categoria?")) return

    setDeleteLoading(category.id)
    const response = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" })
    setDeleteLoading(null)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      toast.error(error.message ?? "No se pudo eliminar")
      return
    }

    if (editingId === category.id) clearForm()
    toast.success("Categoria eliminada")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{editingId ? "Editar categoria" : "Nueva categoria"}</CardTitle>
            <p className="text-sm text-muted-foreground">Categorias principales y subcategorias de un solo nivel.</p>
          </div>
          {editingId && (
            <Button type="button" variant="ghost" onClick={clearForm}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(submitCategory)} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="category-name">Nombre</Label>
              <Input id="category-name" {...register("name")} placeholder="Bebidas" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="category-slug">Slug</Label>
              <Input id="category-slug" {...register("slug")} placeholder="bebidas" />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="category-icon">Icono</Label>
              <Input id="category-icon" {...register("icon")} placeholder="🍹" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category-image">Imagen</Label>
              <Input id="category-image" {...register("image")} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category-parent">Padre</Label>
              <select
                id="category-parent"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selectedParentId}
                onChange={(event) => setValue("parentId", event.target.value, { shouldDirty: true })}
              >
                <option value={ROOT_PARENT}>Sin padre</option>
                {roots.map((category) => (
                  <option key={category.id} value={category.id}>
                    {formatCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register("active")} />
                Activa
              </label>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                {editingId ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="min-w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-medium text-muted-foreground">Categoria</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Slug</th>
                <th className="p-4 text-left font-medium text-muted-foreground">Padre</th>
                <th className="p-4 text-center font-medium text-muted-foreground">Productos</th>
                <th className="p-4 text-center font-medium text-muted-foreground">Hijos</th>
                <th className="p-4 text-center font-medium text-muted-foreground">Estado</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, depth }) => (
                <tr key={category.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-4">
                    <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm">
                        {category.icon ?? "•"}
                      </div>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-muted-foreground">{formatCategoryLabel(category)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{category.slug}</td>
                  <td className="p-4 text-muted-foreground">{category.parent?.name ?? "-"}</td>
                  <td className="p-4 text-center">{category._count.products}</td>
                  <td className="p-4 text-center">{category._count.children}</td>
                  <td className="p-4 text-center">
                    <ToggleStatusButton
                      active={category.active}
                      onClick={() => toggleActive(category)}
                      loading={toggleLoading === category.id}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => startEdit(category)}>
                        <PencilLine className="h-3.5 w-3.5" />
                      </Button>
                      <DeleteIconButton
                        onClick={() => deleteCategory(category)}
                        loading={deleteLoading === category.id}
                        disabled={category._count.products > 0 || category._count.children > 0}
                      />
                    </div>
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
