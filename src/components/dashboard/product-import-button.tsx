"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type Props = {
  storeSlug: string
  disabled?: boolean
}

export function ProductImportButton({ storeSlug, disabled }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  function downloadDemoCsv() {
    const csv = [
      [
        "titulo*",
        "precio*",
        "sku",
        "stock",
        "descripcion",
        "categoria*",
        "estado",
        "imagenes",
        "etiquetas",
      ].join(","),
      [
        '"Camiseta basica"',
        "299.99",
        "CAM-001",
        "25",
        '"Camiseta de algodon para uso diario. Tela suave, corte clasico y disponible en varias tallas."',
        '"Ropa"',
        "ACTIVE",
        '"https://example.com/imagen-1.jpg;https://example.com/imagen-2.jpg;https://example.com/imagen-3.jpg"',
        '"ropa;verano;algodon"',
      ].join(","),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "plantilla-productos.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function handleFile(file: File | undefined) {
    if (!file || loading) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/stores/${storeSlug}/products/import`, {
        method: "POST",
        body: formData,
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const rowErrors = Array.isArray(payload.errors)
          ? payload.errors.map((error: { line?: number; message?: string }) => `Fila ${error.line ?? "?"}: ${error.message ?? "Error"}`).slice(0, 5)
          : []
        toast.error(rowErrors.length > 0 ? rowErrors.join(" | ") : payload.message ?? "No se pudo importar")
        return
      }

      const created = Number(payload.created ?? 0)
      const updated = Number(payload.updated ?? 0)
      const summary = [created > 0 ? `${created} creados` : null, updated > 0 ? `${updated} actualizados` : null].filter(Boolean).join(", ")
      toast.success(summary ? `Importación lista: ${summary}` : "Importación lista")
      router.refresh()
    } catch {
      toast.error("No se pudo importar el CSV")
    } finally {
      setLoading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={downloadDemoCsv} disabled={disabled}>
        <Download className="h-4 w-4 mr-2" />
        Descargar demo tipo excel
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || loading}
      >
        <Upload className="h-4 w-4 mr-2" />
        {loading ? "Importando..." : "Importar productos"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      <p className="w-full text-xs text-muted-foreground">
        Las columnas con * son las únicas obligatorias.
      </p>
    </div>
  )
}
