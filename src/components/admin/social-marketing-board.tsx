"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CopyButton } from "@/components/admin/copy-button"
import {
  DEFAULT_SOCIAL_DESTINATION,
  SOCIAL_CHANNELS,
  SOCIAL_TOPICS,
  buildSocialCopy,
  getSocialTopic,
  type SocialChannel,
} from "@/lib/social-marketing"
import { cn } from "@/lib/utils"
import { CalendarClock, CheckCircle2, CircleAlert, ImageIcon, Loader2, Megaphone, PencilLine, Send, Sparkles } from "lucide-react"
import { createSocialPostAction, publishSocialPostAction, type SocialPostActionInput } from "@/app/(admin)/admin/marketing/actions"

type SocialPostStatus = "DRAFT" | "SCHEDULED" | "PUBLISHING" | "PUBLISHED" | "FAILED"

export type SocialPostRecord = {
  id: string
  title: string
  topic: string
  channels: SocialChannel[]
  caption: string
  imageUrl: string | null
  destinationUrl: string
  scheduledAt: string
  status: SocialPostStatus
  publishedAt: string | null
  facebookPostId: string | null
  instagramMediaId: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

type BoardProps = {
  initialPosts: SocialPostRecord[]
}

type StatusTone = {
  label: string
  variant: "default" | "secondary" | "outline" | "destructive" | "success"
}

const statusTone: Record<SocialPostStatus, StatusTone> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  SCHEDULED: { label: "Programado", variant: "secondary" },
  PUBLISHING: { label: "Publicando", variant: "default" },
  PUBLISHED: { label: "Publicado", variant: "success" },
  FAILED: { label: "Fallo", variant: "destructive" },
}

function formatLocalDateTimeValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

function formatCompactDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function getToneClass(status: SocialPostStatus) {
  switch (status) {
    case "PUBLISHED":
      return "bg-success/10 text-success-foreground"
    case "FAILED":
      return "bg-destructive/10 text-destructive"
    case "PUBLISHING":
      return "bg-primary/10 text-primary"
    case "SCHEDULED":
      return "bg-secondary/70 text-secondary-foreground"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export function SocialMarketingBoard({ initialPosts }: BoardProps) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState(SOCIAL_TOPICS[0]?.id ?? "launch")
  const [destinationUrl, setDestinationUrl] = useState(DEFAULT_SOCIAL_DESTINATION)
  const [scheduledAt, setScheduledAt] = useState(formatLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)))
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState(buildSocialCopy(SOCIAL_TOPICS[0]?.id ?? "launch", 0, DEFAULT_SOCIAL_DESTINATION))
  const [channels, setChannels] = useState<SocialChannel[]>(["FACEBOOK"])
  const [busy, setBusy] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedTopic = useMemo(() => getSocialTopic(topic), [topic])
  const suggestedCopy = useMemo(
    () => selectedTopic.copy.map((copy, index) => buildSocialCopy(selectedTopic.id, index, destinationUrl || DEFAULT_SOCIAL_DESTINATION)),
    [destinationUrl, selectedTopic]
  )

  function toggleChannel(channel: SocialChannel) {
    setChannels((current) => {
      if (current.includes(channel)) {
        const next = current.filter((item) => item !== channel)
        return next.length > 0 ? next : current
      }
      return [...current, channel]
    })
  }

  function resetForm() {
    setTitle("")
    setTopic(SOCIAL_TOPICS[0]?.id ?? "launch")
    setDestinationUrl(DEFAULT_SOCIAL_DESTINATION)
    setScheduledAt(formatLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)))
    setImageUrl("")
    setCaption(buildSocialCopy(SOCIAL_TOPICS[0]?.id ?? "launch", 0, DEFAULT_SOCIAL_DESTINATION))
    setChannels(["FACEBOOK"])
  }

  async function submitPost(publishNow: boolean) {
    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const post = await createSocialPostAction({
        title: title.trim(),
        topic,
        channels,
        caption: caption.trim(),
        imageUrl: imageUrl.trim() || undefined,
        destinationUrl: destinationUrl.trim() || undefined,
        scheduledAt,
        publishNow,
      } satisfies SocialPostActionInput)

      if (post) {
        setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)])
      }
      setMessage(publishNow ? "Publicado" : "Programado")
      resetForm()
      setPosts((current) => [...current].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()))
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la publicacion")
    } finally {
      setBusy(false)
    }
  }

  async function publishScheduledPost(postId: string) {
    setPublishingId(postId)
    setError(null)
    setMessage(null)

    try {
      const post = await publishSocialPostAction(postId)
      if (post) {
        setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)])
      }
      setMessage("Publicado")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar")
    } finally {
      setPublishingId(null)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Programacion manual</Badge>
            <Badge variant="outline">Facebook</Badge>
            <Badge variant="secondary">Instagram</Badge>
          </div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Megaphone className="h-5 w-5 text-primary" />
            Crea el siguiente post
          </CardTitle>
          <CardDescription>Sin IA: eliges tema, canal y fecha. El sistema guarda y publica desde Meta cuando toque.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {message ? (
            <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Titulo</label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Lanzamiento del lunes" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tema</label>
              <Select value={topic} onValueChange={(value) => {
                setTopic(value)
                setCaption(buildSocialCopy(value, 0, destinationUrl || DEFAULT_SOCIAL_DESTINATION))
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  {SOCIAL_TOPICS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Destino</label>
              <Input value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} placeholder={DEFAULT_SOCIAL_DESTINATION} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha y hora</label>
              <Input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen publica</label>
              <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Canales</label>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_CHANNELS.map((channel) => {
                const active = channels.includes(channel)
                return (
                  <Button
                    key={channel}
                    type="button"
                    variant={active ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleChannel(channel)}
                  >
                    {channel === "FACEBOOK" ? "Facebook" : "Instagram"}
                  </Button>
                )
              })}
            </div>
            {channels.includes("INSTAGRAM") ? (
              <p className="text-xs text-muted-foreground">Instagram necesita imagen publica para poder publicar.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium">Copy</label>
              <CopyButton text={caption} />
            </div>
            <Textarea value={caption} onChange={(event) => setCaption(event.target.value)} rows={6} placeholder="Escribe el copy manual o usa una sugerencia" />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {suggestedCopy.map((copy, index) => (
                <Button key={`${selectedTopic.id}-${index}`} type="button" variant="outline" size="sm" onClick={() => setCaption(copy)}>
                  <PencilLine className="h-4 w-4" />
                  Sugerencia {index + 1}
                </Button>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {selectedTopic.copy.map((copy, index) => (
                <button
                  key={copy}
                  type="button"
                  onClick={() => setCaption(buildSocialCopy(selectedTopic.id, index, destinationUrl || DEFAULT_SOCIAL_DESTINATION))}
                  className="rounded-2xl border bg-muted/20 p-3 text-left text-sm leading-6 text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {selectedTopic.label}
                  </div>
                  {copy}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => submitPost(false)} disabled={busy || !title.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
              Guardar programacion
            </Button>
            <Button type="button" onClick={() => submitPost(true)} disabled={busy || !title.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publicar ahora
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <ImageIcon className="h-5 w-5 text-primary" />
              Resumen de uso
            </CardTitle>
            <CardDescription>Los temas listos sirven para crear texto corto y reutilizable sin IA.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Sitio</p>
              <p className="mt-1 text-sm font-medium">shop.aionsite.com.mx</p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Canales</p>
              <p className="mt-1 text-sm font-medium">Facebook + Instagram</p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Metodo</p>
              <p className="mt-1 text-sm font-medium">Programacion manual</p>
            </div>
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ultimo paso</p>
              <p className="mt-1 text-sm font-medium">Publicar o programar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="space-y-3">
            <CardTitle className="text-xl">Publicaciones recientes</CardTitle>
            <CardDescription>Lista sincronizada desde la base de datos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Aun no hay publicaciones guardadas.
              </div>
            ) : (
              posts.map((post) => {
                const tone = statusTone[post.status]
                return (
                  <div key={post.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={tone.variant}>{tone.label}</Badge>
                          <Badge variant="outline">{post.channels.map((channel) => (channel === "FACEBOOK" ? "Facebook" : "Instagram")).join(" / ")}</Badge>
                        </div>
                        <h3 className="font-semibold">{post.title}</h3>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{getSocialTopic(post.topic).label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {post.status !== "PUBLISHED" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => publishScheduledPost(post.id)}
                            disabled={publishingId === post.id}
                          >
                            {publishingId === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Publicar
                          </Button>
                        ) : null}
                        <CopyButton text={post.caption} />
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide">Programado</p>
                        <p className="mt-1 text-foreground">{formatCompactDate(post.scheduledAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide">Destino</p>
                        <p className="mt-1 break-all text-foreground">{post.destinationUrl}</p>
                      </div>
                    </div>

                    {post.imageUrl ? (
                      <div className="mt-3 rounded-xl border bg-muted/20 p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Imagen:</span> {post.imageUrl}
                      </div>
                    ) : null}

                    {post.lastError ? (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{post.lastError}</span>
                      </div>
                    ) : null}

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span>{post.publishedAt ? `Publicado ${formatCompactDate(post.publishedAt)}` : "Pendiente de publicar"}</span>
                      <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1", getToneClass(post.status))}>
                        {post.status === "PUBLISHED" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                        {post.status}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
