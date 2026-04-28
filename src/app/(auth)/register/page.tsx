"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Store, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Store className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">Mercado Local</span>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 max-w-md text-balance">
            Únete a tu comunidad
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-md">
            Crea tu cuenta gratis y comienza a comprar o vender productos locales en minutos.
          </p>
          
          {/* Benefits */}
          <div className="space-y-4 max-w-sm">
            {[
              "Crea tu tienda en minutos",
              "Sin costos de inicio",
              "Llega a clientes locales",
              "Soporte personalizado",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-primary-foreground/90 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 lg:p-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">Mercado Local</span>
              </Link>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Crear cuenta</h2>
              <p className="text-muted-foreground">Únete a tu comunidad local</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input 
                  placeholder="Juan Pérez" 
                  className="h-12 rounded-xl"
                  {...register("name")} 
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  placeholder="tu@email.com" 
                  className="h-12 rounded-xl"
                  {...register("email")} 
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input 
                  type="password" 
                  placeholder="Mínimo 8 caracteres"
                  className="h-12 rounded-xl"
                  {...register("password")} 
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Al crear una cuenta, aceptas nuestros{" "}
                <Link href="#" className="text-primary hover:underline">términos de servicio</Link>
                {" "}y{" "}
                <Link href="#" className="text-primary hover:underline">política de privacidad</Link>.
              </p>
              
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base" 
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
