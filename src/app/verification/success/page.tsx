import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function VerificationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>
}) {
  const { store } = await searchParams

  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold">Cuenta verificada</h1>
        <p className="mt-3 text-muted-foreground">
          {store ? `La tienda /${store} ya está visible públicamente.` : "La verificación se completó correctamente."}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/stores">Ver tiendas</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Ir al dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
