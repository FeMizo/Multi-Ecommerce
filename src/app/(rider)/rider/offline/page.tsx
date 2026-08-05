import Link from "next/link"
import { WifiOff } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function RiderOfflinePage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="space-y-4 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-semibold">Estás sin conexión</p>
            <p className="text-sm text-muted-foreground">
              El panel del repartidor sigue disponible con lo último cargado.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button asChild variant="outline">
              <Link href="/rider">Reintentar</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
