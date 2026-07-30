"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
  storeSlug: string
  isVerified: boolean
}

export function StoreVerificationCard({ storeSlug, isVerified }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function resendVerification() {
    setLoading(true)
    const res = await fetch(`/api/stores/${storeSlug}/verification`, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      toast.error(data.message ?? "No se pudo enviar el correo de verificacion")
      return
    }

    toast.success("Correo de verificacion enviado")
    router.refresh()
  }

  return (
    <Card id="verificacion" className={!isVerified ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : undefined}>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Verificacion</p>
            <p className="text-sm text-muted-foreground">
              {isVerified ? "Tu cuenta ya esta verificada." : "Tu cuenta aun no esta verificada."}
            </p>
          </div>
          <Badge variant={isVerified ? "secondary" : "outline"}>{isVerified ? "Verificada" : "Pendiente"}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          La verificacion se completa con un enlace enviado por correo a la cuenta del propietario.
        </p>
        {!isVerified && (
          <Button type="button" variant="outline" onClick={resendVerification} disabled={loading}>
            {loading ? "Enviando..." : "Reenviar correo"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
