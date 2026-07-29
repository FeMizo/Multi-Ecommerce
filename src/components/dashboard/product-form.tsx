"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Trash2, Plus, X } from "lucide-react"
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
import { normalizeVariantOptions } from "@/lib/product-variants"

const schema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres").max(120, "Maximo 120 caracteres"),
  slug: z
    .string()
    .min(2, "Minimo 2 caracteres")
    .max(80, "Maximo 80 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo letras minusculas, numeros y guiones"),
  description: z.string().max(2000).optional(),
  price: z.number({ message: "Ingresa un precio valido" }).positive("Debe ser mayor a 0"),
  comparePrice: z.number().positive().optional(),
  stock: z.number().int().min(0, "No puede ser negativo"),
  manageStock: z.boolean(),
  sku: z.string().max(60).optional(),
  categoryId: z.string().min(1, "Selecciona una categoria"),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]),
  featured: z.boolean(),
})

type FormData = z.infer<typeof schema>

type Category = { id: string; name: string }

type VariantDraft = {
  name: string
  valuesText: string
}

type Props = {
  storeSlug: string
  categories: Category[]
  initialData?: Partial<FormData> & {
    id?: string
    images?: string[]
    tags?: string[]
    variantOptions?: unknown
  }
  mode: "new" | "edit"
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

export function ProductForm({ storeSlug, categories, initialData, mode }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>(initialData?.images ?? [])
  const [imageInput, setImageInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tags, setTags] = useState<string[]>(initialData?.tags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>(
    () => normalizeVariantOptions(initialData?.variantOptions ?? []).map((option) => ({
        name: option.name,
        valuesText: option.values.join(", "),
      }))
  )

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? "",
      slug: initialData?.slug ?? "",
      description: initialData?.description ?? "",
      price: initialData?.price ?? undefined,
      comparePrice: initialData?.comparePrice ?? undefined,
      stock: initialData?.stock ?? 0,
      manageStock: initialData?.manageStock ?? true,
      sku: initialData?.sku ?? "",
      categoryId: initialData?.categoryId ?? "",
      status: initialData?.status ?? "DRAFT",
      featured: initialData?.featured ?? false,
    },
  })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue("name", e.target.value)
    if (mode === "new") {
      setValue("slug", toSlug(e.target.value), { shouldValidate: true })
    }
  }

  function addImage() {
    const url = imageInput.trim()
    if (!url || images.includes(url) || images.length >= 8) return
    try {
      new URL(url)
      setImages((prev) => [...prev, url])
      setImageInput("")
    } catch {
      toast.error("URL de imagen invalida")
    }
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (!tag || tags.includes(tag) || tags.length >= 10) return
    setTags((prev) => [...prev, tag])
    setTagInput("")
  }

  function addVariantDraft() {
    setVariantDrafts((prev) => [...prev, { name: "", valuesText: "" }])
  }

  function updateVariantDraft(index: number, patch: Partial<VariantDraft>) {
    setVariantDrafts((prev) => prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)))
  }

  function removeVariantDraft(index: number) {
    setVariantDrafts((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleUpload(file: File) {
    if (!file || images.length >= 8) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("storeSlug", storeSlug)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("No se pudo subir la imagen")
      const data = await res.json()
      setImages((prev) => [...prev, data.url])
      toast.success("Imagen subida")
    } catch {
      toast.error("No se pudo subir la imagen")
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(data: FormData) {
    setLoading(true)

    const variantOptions = normalizeVariantOptions(
      variantDrafts.map((draft) => ({
        name: draft.name,
        values: draft.valuesText.split(",").map((value) => value.trim()),
      }))
    )

    const payload = {
      ...data,
      comparePrice: data.comparePrice ?? null,
      description: data.description || null,
      stock: data.manageStock ? data.stock : 0,
      sku: data.sku || null,
      images,
      tags,
      variantOptions,
    }

    const url =
      mode === "new"
        ? `/api/stores/${storeSlug}/products`
        : `/api/stores/${storeSlug}/products/${initialData?.id}`

    const res = await fetch(url, {
      method: mode === "new" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al guardar")
      return
    }

    toast.success(mode === "new" ? "Producto creado" : "Producto actualizado")
    router.push(`/dashboard/${storeSlug}/products`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm("Eliminar este producto? Esta accion no se puede deshacer.")) return
    setLoading(true)
    await fetch(`/api/stores/${storeSlug}/products/${initialData?.id}`, { method: "DELETE" })
    setLoading(false)
    toast.success("Producto eliminado")
    router.push(`/dashboard/${storeSlug}/products`)
    router.refresh()
  }

  const slug = useWatch({ control, name: "slug" }) ?? ""
  const manageStock = useWatch({ control, name: "manageStock" }) ?? true

  useEffect(() => {
    if (!manageStock) {
      setValue("stock", 0, { shouldValidate: true })
    }
  }, [manageStock, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "new" ? "Nuevo producto" : "Editar producto"}
          </h1>
        </div>
        <div className="flex gap-2">
          {mode === "edit" && (
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : mode === "new" ? "Crear producto" : "Guardar cambios"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacion basica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Nombre *</Label>
                <Input placeholder="Ej: Camiseta de algodon organico" {...register("name")} onChange={handleNameChange} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>Slug (URL) *</Label>
                <div className="flex items-center">
                  <span className="flex items-center px-3 h-9 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md border-input whitespace-nowrap">
                    /{storeSlug}/
                  </span>
                  <Input className="rounded-l-none" placeholder="camiseta-algodon" {...register("slug")} />
                </div>
                {slug && !errors.slug && (
                  <p className="text-xs text-muted-foreground">
                    /{storeSlug}/{slug}
                  </p>
                )}
                {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Describe tu producto..."
                  rows={4}
                  className="resize-none"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variantes del producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Opcional. Ejemplo: Talla = S, M, L. Color = Azul, Rojo, Verde.
              </p>
              <div className="space-y-3">
                {variantDrafts.map((draft, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border p-4 md:grid-cols-[1fr_2fr_auto]">
                    <div className="space-y-1">
                      <Label>Nombre</Label>
                      <Input
                        placeholder="Talla"
                        value={draft.name}
                        onChange={(e) => updateVariantDraft(index, { name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Valores</Label>
                      <Input
                        placeholder="S, M, L"
                        value={draft.valuesText}
                        onChange={(e) => updateVariantDraft(index, { valuesText: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariantDraft(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" onClick={addVariantDraft}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar variante
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Precios e inventario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Precio *</Label>
                  <div className="flex items-center">
                    <span className="flex items-center px-3 h-9 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md border-input">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="rounded-l-none"
                      placeholder="0.00"
                      {...register("price", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label>Precio de descuento</Label>
                  <div className="flex items-center">
                    <span className="flex items-center px-3 h-9 text-sm text-muted-foreground bg-muted border border-r-0 rounded-l-md border-input">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="rounded-l-none"
                      placeholder="0.00"
                      {...register("comparePrice", {
                        setValueAs: (v) => (v === "" || v === undefined ? undefined : parseFloat(v)),
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" {...register("manageStock")} />
                    Manejar stock
                  </Label>

                  {manageStock && (
                    <div>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        disabled={!manageStock}
                        {...register("stock", { valueAsNumber: true })}
                      />
                      {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Desactivalo si el producto no debe agotarse por inventario.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>SKU</Label>
                  <Input placeholder="Ej: CAM-001-BL" {...register("sku")} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Imagenes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {images.map((url, i) => (
                    <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border bg-muted">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImage())}
                />
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={addImage} disabled={images.length >= 8}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={images.length >= 8 || uploading}>
                    {uploading ? "Subiendo..." : "Subir archivo"}
                  </Button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                  e.target.value = ""
                }}
              />
              <p className="text-xs text-muted-foreground">{images.length}/8 imagenes. Puedes agregar URLs o subir archivos.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: ropa, verano, algodon"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 10}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publicacion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Estado *</Label>
                <Select
                  defaultValue={initialData?.status ?? "DRAFT"}
                  onValueChange={(v) => setValue("status", v as FormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Borrador</SelectItem>
                    <SelectItem value="ACTIVE">Activo</SelectItem>
                    <SelectItem value="PAUSED">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label className="cursor-pointer">Destacado</Label>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary cursor-pointer"
                  {...register("featured")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                defaultValue={initialData?.categoryId ?? ""}
                onValueChange={(v) => setValue("categoryId", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
