"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  name: z.string().min(2, "Minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  phone: z.string().min(9, "Minimo 9 digitos"),
  password: z.string().min(8, "Minimo 8 caracteres"),
})

type FormData = z.infer<typeof schema>

export function RegisterForm({ planId }: { planId: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.message ?? "Error al registrarse")
      setLoading(false)
      return
    }

    const login = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    setLoading(false)
    if (login?.error) {
      toast.success("Cuenta creada. Inicia sesion.")
      router.push("/login")
      return
    }

    router.push(planId ? `/onboarding?planId=${planId}` : "/plans")
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              <Image src="/logo-icon.png" alt="AionSite" width={48} height={48} className="object-cover" />
            </div>
            <span className="text-2xl font-bold text-primary-foreground">AionSite</span>
          </Link>
          <h1 className="text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 max-w-md text-balance">
            Unete a tu comunidad
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-md">
            Crea tu cuenta y empieza a vender con un plan activo desde el inicio.
          </p>
          <div className="space-y-4 max-w-sm">
            {[
              "Crea tu tienda en minutos",
              "Sin costos ocultos",
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
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-block">
                <Image src="/logo.png" alt="AionSite" width={130} height={38} className="h-9 w-auto object-contain mx-auto" />
              </Link>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Crear cuenta</h2>
              <p className="text-muted-foreground">Unete a tu comunidad local</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 rounded-xl border-border/50 hover:bg-accent hover:border-primary/30"
                onClick={() => signIn("google", { callbackUrl: planId ? `/onboarding?planId=${planId}` : "/onboarding" })}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
              </Button>

              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input
                  placeholder="Juan Perez"
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
                <Label>Telefono</Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  placeholder="55 1234 5678"
                  className="h-12 rounded-xl"
                  {...register("phone")}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Contrasena</Label>
                <Input
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  className="h-12 rounded-xl"
                  {...register("password")}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <p className="text-xs text-muted-foreground">
                Al crear una cuenta, aceptas nuestros{" "}
                <Link href="/terms" className="text-primary hover:underline">terminos de servicio</Link>
                {" "}y{" "}
                <Link href="/privacy" className="text-primary hover:underline">politica de privacidad</Link>.
              </p>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesion
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
