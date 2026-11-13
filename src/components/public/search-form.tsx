"use client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
type SearchParams = { q?: string; category?: string; minPrice?: string; maxPrice?: string; min?: string; max?: string; availability?: "available" | "out-of-stock"; page?: string }
export function SearchForm({ initialParams, categories = [] }: { initialParams: SearchParams; categories?: { slug: string; name: string }[] }) {
  const router = useRouter(), pathname = usePathname(), current = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(initialParams.q ?? "")
  const [category, setCategory] = useState(initialParams.category ?? "")
  const [availability, setAvailability] = useState(initialParams.availability ?? "")
  const [minPrice, setMinPrice] = useState(initialParams.minPrice ?? initialParams.min ?? "")
  const [maxPrice, setMaxPrice] = useState(initialParams.maxPrice ?? initialParams.max ?? "")
  function navigate(params: URLSearchParams) { params.delete("page"); startTransition(() => router.replace(pathname + (params.size ? "?" + params : ""))) }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams(current.toString()); params.delete("min"); params.delete("max")
    for (const [key, content] of Object.entries({ q: value.trim(), category, availability, minPrice, maxPrice })) { if (content) params.set(key, content); else params.delete(key) }
    navigate(params)
    event.currentTarget.querySelectorAll("details").forEach((details) => { details.open = false })
  }
  const summaryClass = "flex min-h-11 cursor-pointer list-none items-center justify-between gap-1 rounded-lg border bg-background px-2 text-xs min-[360px]:text-sm [&::-webkit-details-marker]:hidden"
  const panelClass = "absolute inset-x-0 top-full z-30 mt-2 space-y-3 rounded-xl border bg-card p-4 shadow-lg"
  return <form onSubmit={submit} aria-label="Buscar y filtrar productos" aria-busy={pending} className="search-form space-y-3">
    <div className="flex gap-2"><div className="relative min-w-0 flex-1"><label htmlFor="product-search" className="sr-only">Buscar productos</label><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input id="product-search" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Buscar productos" className="h-12 pl-10 pr-12" />{value && <button type="button" className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center rounded-r-lg hover:bg-accent" aria-label="Limpiar búsqueda" onClick={() => { setValue(""); const params = new URLSearchParams(current.toString()); params.delete("q"); navigate(params) }}><X aria-hidden="true" className="h-5 w-5" /></button>}</div><Button type="submit" className="min-h-12 px-4" disabled={pending}>{pending ? "Buscando…" : "Buscar"}</Button></div>
    <div className="relative grid grid-cols-3 gap-2">
      <details name="search-filters"><summary className={summaryClass}>Categoría<ChevronDown aria-hidden="true" className="h-3 w-3 shrink-0" /></summary><div className={panelClass}><label className="block text-sm">Categoría<select className="mt-2 h-11 w-full rounded-lg border bg-background px-3" value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas las categorías</option>{category && !categories.some((item) => item.slug === category) && <option value={category}>{category}</option>}{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><Button type="submit" className="min-h-11">Aplicar categoría</Button></div></details>
      <details name="search-filters"><summary className={summaryClass}>Precio<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" /></summary><div className={panelClass}><div className="grid grid-cols-2 gap-3"><label className="text-sm">Mínimo (MXN)<Input className="mt-2 h-11" type="number" min="0" step="0.01" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /></label><label className="text-sm">Máximo (MXN)<Input className="mt-2 h-11" type="number" min={minPrice || "0"} step="0.01" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></label></div><Button type="submit" className="min-h-11">Aplicar precio</Button></div></details>
      <details name="search-filters"><summary className={summaryClass}>Filtros<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" /></summary><div className={panelClass}><label className="block text-sm">Disponibilidad<select className="mt-2 h-11 w-full rounded-lg border bg-background px-3" value={availability} onChange={(event) => setAvailability(event.target.value as typeof availability)}><option value="">Todos los productos</option><option value="available">Disponibles</option><option value="out-of-stock">Agotados</option></select></label><Button type="submit" className="min-h-11">Aplicar filtros</Button></div></details>
    </div>
  </form>
}
