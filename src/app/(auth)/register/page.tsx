"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["BUYER", "SELLER"]),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "BUYER" },
  })
  const role = watch("role")

  async function onSubmit(data: FormData) {
    setLoading(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    setLoading(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al registrarse")
      return
    }
    toast.success("Cuenta creada. Inicia sesión.")
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="font-bold text-xl text-primary mb-2 block">Mercado Local</Link>
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>Únete a tu comunidad local</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
            {(["BUYER", "SELLER"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setValue("role", r)}
                className={`py-2 text-sm font-medium rounded-md transition-all ${
                  role === r ? "bg-white shadow text-foreground" : "text-muted-foreground"
                }`}
              >
                {r === "BUYER" ? "Comprador" : "Vendedor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre completo</Label>
              <Input placeholder="Juan Pérez" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" placeholder="tu@email.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Contraseña</Label>
              <Input type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
