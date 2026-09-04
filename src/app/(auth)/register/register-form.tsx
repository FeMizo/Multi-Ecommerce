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
import { ArrowLeft, CheckCircle2, Shield, Truck, User } from "lucide-react"
import { ArrowLeft as MorphArrowLeft } from "lucide"
import { MorphLink } from "@/components/ui/morph-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const accountTypes = ["SELLER", "RIDER", "BUYER"] as const
type AccountType = (typeof accountTypes)[number]

const baseSchema = z.object({
  accountType: z.enum(accountTypes),
  name: z.string().min(2, "Minimo 2 caracteres"),
  phone: z.string().min(7, "Minimo 7 digitos"),
  password: z.string().min(8, "Minimo 8 caracteres"),
  email: z.string().email("Email invalido").optional(),
  plate: z.string().optional(),
  licenseNumber: z.string().optional(),
})

const schema = z.discriminatedUnion("accountType", [
  baseSchema.extend({
    accountType: z.literal("SELLER"),
    email: z.string().email("Email invalido"),
    plate: z.string().optional(),
    licenseNumber: z.string().optional(),
  }),
  baseSchema.extend({
    accountType: z.literal("BUYER"),
    email: z.string().email("Email invalido"),
    plate: z.string().optional(),
    licenseNumber: z.string().optional(),
  }),
  baseSchema.extend({
    accountType: z.literal("RIDER"),
    email: z.string().optional(),
    plate: z.string().min(2, "Placa requerida"),
    licenseNumber: z.string().min(3, "Licencia requerida"),
  }),
])

type FormData = z.infer<typeof schema>

const TYPE_META: Record<
  AccountType,
  { title: string; description: string; icon: typeof User; accent: string }
> = {
  SELLER: {
    title: "Vendedor",
    description: "Crea tu tienda y habilita la administracion de productos y pedidos.",
    icon: Shield,
    accent: "bg-primary/10 text-primary",
  },
  RIDER: {
    title: "Repartidor",
    description: "Registra tu cuenta sin tienda y luego entra a tu panel.",
    icon: Truck,
    accent: "bg-emerald-500/10 text-emerald-600",
  },
  BUYER: {
    title: "Comprador",
    description: "Compra sin suscripcion y administra tus pedidos desde tu cuenta.",
    icon: User,
    accent: "bg-slate-500/10 text-slate-700",
  },
}

export function RegisterForm({ planId, role }: { planId: string | null; role: string | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const initialType = accountTypes.includes(role as AccountType) ? (role as AccountType) : "SELLER"
  const [accountType, setAccountType] = useState<AccountType>(initialType)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: initialType,
      name: "",
      phone: "",
      password: "",
      email: "",
      plate: "",
      licenseNumber: "",
    } as unknown as FormData,
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        planId: accountType === "SELLER" ? planId : null,
      }),
    })
    setLoading(false)

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast.error(err.message ?? "Error al registrarse")
      return
    }

    const login = await signIn("credentials", {
      identifier: accountType === "RIDER" ? data.phone : data.email,
      password: data.password,
      redirect: false,
    })

    if (login?.error) {
      toast.success("Cuenta creada. Inicia sesion.")
      router.push("/login")
      return
    }

    if (accountType === "SELLER") {
      router.push(planId ? `/onboarding?planId=${planId}` : "/plans")
      return
    }

    router.push("/dashboard")
  }

  const currentMeta = TYPE_META[accountType]
  const CurrentIcon = currentMeta.icon

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
            Crea una cuenta de vendedor, repartidor o comprador en un solo flujo.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-4 lg:p-6">
          <MorphLink
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            icon={MorphArrowLeft}
            iconClassName="h-4 w-4"
          >
            Volver al inicio
          </MorphLink>
        </div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-block">
                <Image src="/logo.png" alt="AionSite" width={130} height={38} className="h-9 w-auto object-contain mx-auto" />
              </Link>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Crear cuenta</h2>
              <p className="text-muted-foreground">Elige el tipo de acceso que necesitas</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {accountTypes.map((type) => {
                const meta = TYPE_META[type]
                const Icon = meta.icon
                const selected = accountType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`rounded-2xl border p-3 text-left transition-all ${
                      selected ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:bg-accent/60"
                    }`}
                  >
                    <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full ${meta.accent}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-semibold">{meta.title}</p>
                  </button>
                )
              })}
            </div>

            <div className="mb-6 rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${TYPE_META[accountType].accent}`}>
                  <CurrentIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{currentMeta.title}</p>
                  <p className="text-sm text-muted-foreground">{currentMeta.description}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" value={accountType} {...register("accountType")} />
              {accountType !== "RIDER" && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-border/50 hover:bg-accent hover:border-primary/30"
                  onClick={() =>
                    signIn("google", {
                      callbackUrl:
                        accountType === "SELLER"
                          ? planId
                            ? `/onboarding?planId=${planId}`
                            : "/onboarding"
                          : "/dashboard",
                    })
                  }
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continuar con Google
                </Button>
              )}

              <div className="space-y-2">
                <Label>Nombre completo</Label>
                <Input placeholder="Juan Perez" className="h-12 rounded-xl" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
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

              {accountType !== "RIDER" && (
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
              )}

              {accountType === "RIDER" && (
                <>
                  <div className="space-y-2">
                    <Label>Placa</Label>
                    <Input placeholder="ABC-123" className="h-12 rounded-xl" {...register("plate")} />
                    {errors.plate && <p className="text-xs text-destructive">{errors.plate.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Numero de licencia</Label>
                    <Input placeholder="LIC-123456" className="h-12 rounded-xl" {...register("licenseNumber")} />
                    {errors.licenseNumber && <p className="text-xs text-destructive">{errors.licenseNumber.message}</p>}
                  </div>
                </>
              )}

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

              <Button type="submit" className="w-full h-12 rounded-xl text-base" disabled={loading}>
                {loading ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
