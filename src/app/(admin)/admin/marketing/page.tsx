import type { Metadata } from "next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/admin/copy-button"
import { SocialMarketingBoard, type SocialPostRecord } from "@/components/admin/social-marketing-board"
import { requireAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"
import { DEFAULT_SOCIAL_DESTINATION, SOCIAL_TOPICS, buildSocialCopy } from "@/lib/social-marketing"
import { Megaphone, Sparkles, Target } from "lucide-react"

export const metadata: Metadata = {
  title: "Marketing",
  description: "Programacion manual para shop.aionsite.com.mx",
}

function serializePost(post: Awaited<ReturnType<typeof db.socialPost.findFirstOrThrow>>): SocialPostRecord {
  return {
    id: post.id,
    title: post.title,
    topic: post.topic,
    channels: post.channels as SocialPostRecord["channels"],
    caption: post.caption,
    imageUrl: post.imageUrl,
    destinationUrl: post.destinationUrl,
    scheduledAt: post.scheduledAt.toISOString(),
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    facebookPostId: post.facebookPostId,
    instagramMediaId: post.instagramMediaId,
    lastError: post.lastError,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }
}

export default async function MarketingPage() {
  await requireAdmin()

  const posts = await db.socialPost.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 50,
  })

  const initialPosts = posts.map(serializePost)

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-background via-background to-primary/10 p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.04),transparent_30%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Social marketing</Badge>
              <Badge variant="outline">Sin IA</Badge>
              <Badge variant="secondary">shop.aionsite.com.mx</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Programa y publica desde el panel</h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                Todo este flujo queda centrado en {DEFAULT_SOCIAL_DESTINATION}. Puedes guardar publicaciones, reutilizar copys cortos y disparar
                publicaciones manuales o programadas para Facebook e Instagram.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Grupos locales</Badge>
              <Badge variant="outline">Facebook Page</Badge>
              <Badge variant="outline">Instagram profesional</Badge>
            </div>
          </div>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Como funciona</CardTitle>
              <CardDescription>Define tema, canal, imagen y fecha. El sistema guarda el estado y publica cuando toca.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>1. Elige un tema base.</p>
              <p>2. Ajusta el copy manual o usa una sugerencia.</p>
              <p>3. Selecciona Facebook, Instagram o ambos.</p>
              <p>4. Guarda la programacion o publica de una vez.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              Enlace base
            </CardTitle>
            <CardDescription>Usa siempre este destino como referencia principal.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-3 rounded-2xl border bg-muted/20 p-4">
            <div className="min-w-0">
              <p className="font-medium">Sitio principal</p>
              <p className="truncate text-sm text-muted-foreground">{DEFAULT_SOCIAL_DESTINATION}</p>
            </div>
            <CopyButton text={DEFAULT_SOCIAL_DESTINATION} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Temas listos
            </CardTitle>
            <CardDescription>Bloques cortos para rotar publicaciones sin escribir desde cero.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {SOCIAL_TOPICS.slice(0, 3).map((topic) => (
              <div key={topic.id} className="rounded-2xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{topic.label}</p>
                  <Badge variant="outline">3 copys</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{topic.description}</p>
                <p className="mt-3 text-sm leading-6 text-foreground">{buildSocialCopy(topic.id, 0, DEFAULT_SOCIAL_DESTINATION)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Tablero de publicaciones</h2>
        </div>
        <SocialMarketingBoard initialPosts={initialPosts} />
      </section>
    </div>
  )
}
