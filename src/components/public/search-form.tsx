"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search as MorphSearch, X as MorphX } from "lucide"
import { MorphIcon } from "morphicons/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchParams = {
  q?: string
  category?: string
  min?: string
  max?: string
  page?: string
}

function buildSearchUrl(pathname: string, current: URLSearchParams, q: string) {
  const params = new URLSearchParams(current.toString())
  const value = q.trim()

  if (value) {
    params.set("q", value)
  } else {
    params.delete("q")
  }

  params.delete("page")

  const qs = params.toString()
  return `${pathname}${qs ? `?${qs}` : ""}`
}

export function SearchForm({ initialParams }: { initialParams: SearchParams }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [value, setValue] = useState(initialParams.q ?? "")

  const navigate = (nextValue: string) => {
    startTransition(() => {
      router.replace(buildSearchUrl(pathname, new URLSearchParams(searchParams.toString()), nextValue))
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigate(value)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value
    setValue(nextValue)
    if (!nextValue.trim() && (searchParams.get("q") ?? "")) {
      navigate("")
    }
  }

  const handleClear = () => {
    setValue("")
    navigate("")
  }

  return (
    <form key={initialParams.q ?? ""} onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <MorphIcon
          icon={MorphSearch}
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          spring="snappy"
          reducedMotion="never"
        />
        <Input
          value={value}
          onChange={handleChange}
          placeholder="Buscar productos, tiendas..."
          className="pl-10 pr-10"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
            <MorphIcon icon={MorphX} className="h-4 w-4" spring="snappy" reducedMotion="never" />
          </button>
        )}
      </div>
      <Button type="submit" className="sm:w-auto">
        Buscar
      </Button>
    </form>
  )
}
