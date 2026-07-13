"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"

type Props = {
  productId: string
}

export function ReviewForm({ productId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? "Error al guardar la reseña")
      }

      toast.success("Reseña enviada")
      setComment("")
      setRating(5)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar la reseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border p-4 space-y-4">
      <div>
        <Label className="mb-2 block">Tu valoración</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="text-yellow-400"
            >
              <Star className={`h-5 w-5 ${value <= rating ? "fill-current" : "text-muted"}`} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="comment">Comentario</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Cuéntanos tu experiencia con este producto"
          rows={4}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Publicar reseña"}
      </Button>
    </form>
  )
}
