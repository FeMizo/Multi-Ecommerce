import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CopyButton } from "@/components/admin/copy-button"
import { marketingKit } from "@/lib/marketing-kit"
import { ArrowUpRight, Globe, Megaphone, Palette, Sparkles, Target } from "lucide-react"

export const metadata: Metadata = {
  title: "Marketing",
  description: "Kit de difusión para shop.aionsite.com.mx",
}

function SnippetCard({
  label,
  text,
  variant,
}: {
  label: string
  text: string
  variant: string
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Badge variant={variant === "Instagram" ? "secondary" : "outline"}>{variant}</Badge>
          <CopyButton text={text} />
        </div>
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  )
}

export default function MarketingPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-primary/10 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.04),transparent_30%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Base de marketing</Badge>
              <Badge variant="outline">Orgánico</Badge>
              <Badge variant="secondary">shop.aionsite.com.mx</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Difusión lista para Facebook e Instagram</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Todo el material de esta pantalla apunta solo a <span className="font-medium text-foreground">{marketingKit.canonicalUrl}</span>, con copys cortos
                para grupos locales y versiones para la Page e Instagram propios.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <a href={marketingKit.canonicalUrl} target="_blank" rel="noreferrer">
                  Abrir sitio
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={marketingKit.linkTargets[1].href} target="_blank" rel="noreferrer">
                  Ver tiendas
                </a>
              </Button>
            </div>
          </div>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Mensaje central</CardTitle>
              <CardDescription>Un solo sitio, una sola referencia, mismo tono en todos los canales.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border bg-muted/40 p-4">
                <p className="text-sm uppercase tracking-wide text-muted-foreground">Posicionamiento</p>
                <p className="mt-2 text-sm leading-6">{marketingKit.positioning}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Canal</p>
                  <p className="mt-1 font-medium">Grupos locales</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Destino</p>
                  <p className="mt-1 font-medium">shop.aionsite.com.mx</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Enlaces base
            </CardTitle>
            <CardDescription>Usa estos enlaces como destino único para publicaciones y perfiles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketingKit.linkTargets.map((link) => (
              <div key={link.href} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                <div className="min-w-0">
                  <p className="font-medium">{link.label}</p>
                  <a href={link.href} target="_blank" rel="noreferrer" className="truncate text-sm text-muted-foreground hover:text-foreground">
                    {link.href}
                  </a>
                </div>
                <CopyButton text={link.href} label="Copiar" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Bios listas
            </CardTitle>
            <CardDescription>Textos cortos para crear las cuentas propias sin inventar copies nuevos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketingKit.bios.map((bio) => (
              <div key={bio.platform} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{bio.platform}</p>
                  <CopyButton text={bio.text} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{bio.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Copys listos para publicar</h2>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Grupos locales</h3>
              <Badge variant="outline">Texto corto</Badge>
            </div>
            {marketingKit.snippets.groups.map((snippet) => (
              <SnippetCard key={snippet.label} label={snippet.label} text={snippet.text} variant="Grupo" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Facebook e Instagram</h3>
              <Badge variant="outline">Canales propios</Badge>
            </div>
            <div className="space-y-4">
              {marketingKit.snippets.facebook.map((snippet) => (
                <SnippetCard key={snippet.label} label={snippet.label} text={snippet.text} variant="Facebook" />
              ))}
              {marketingKit.snippets.instagram.map((snippet) => (
                <SnippetCard key={snippet.label} label={snippet.label} text={snippet.text} variant="Instagram" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5 text-primary" />
              Ideas creativas
            </CardTitle>
            <CardDescription>Base visual simple para preparar la presencia propia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketingKit.creativeIdeas.map((idea) => (
              <div key={idea} className="rounded-2xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                {idea}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Checklist de arranque
            </CardTitle>
            <CardDescription>Orden sugerido para publicar sin mezclar canales ni referencias.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketingKit.checklist.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {index + 1}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Separator />

      <p className="text-sm text-muted-foreground">
        Todo el material de esta pantalla está restringido a la marca propia y al dominio {marketingKit.canonicalUrl}.
      </p>
    </div>
  )
}
