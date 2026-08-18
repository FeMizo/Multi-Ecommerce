"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { CopyButton } from "@/components/admin/copy-button"
import {
  DEFAULT_SOCIAL_DESTINATION,
  SOCIAL_CHANNELS,
  SOCIAL_TOPICS,
  buildSocialCopy,
  getSocialTopic,
  type SocialChannel,
} from "@/lib/social-marketing"
import { CalendarClock, CircleAlert, ImageIcon, Loader2, Megaphone, PencilLine, Send, Sparkles } from "lucide-react"
import {
  createSocialPostAction,
  publishSocialPostAction,
  updateSocialPostChannelsAction,
  type SocialPostActionInput,
} from "@/app/(admin)/admin/marketing/actions"

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

const socialPostStatuses: SocialPostStatus[] = ["PUBLISHED", "FAILED", "SCHEDULED", "DRAFT", "PUBLISHING"]

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

export function SocialMarketingBoard({ initialPosts }: BoardProps) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [title, setTitle] = useState("")
  const [topic, setTopic] = useState(SOCIAL_TOPICS[0]?.id ?? "launch")
  const [destinationUrl, setDestinationUrl] = useState(DEFAULT_SOCIAL_DESTINATION)
  const [scheduledAt, setScheduledAt] = useState(() => formatLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)))
  const [imageUrl, setImageUrl] = useState("")
  const [caption, setCaption] = useState(buildSocialCopy(SOCIAL_TOPICS[0]?.id ?? "launch", 0, DEFAULT_SOCIAL_DESTINATION))
  const [channels, setChannels] = useState<SocialChannel[]>(["FACEBOOK"])
  const [busy, setBusy] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [editingChannelsId, setEditingChannelsId] = useState<string | null>(null)
  const [editingChannels, setEditingChannels] = useState<SocialChannel[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<"ALL" | SocialPostStatus>("ALL")
  const [channelFilter, setChannelFilter] = useState<"ALL" | SocialChannel>("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedTopic = useMemo(() => getSocialTopic(topic), [topic])
  const suggestedCopy = useMemo(
    () => selectedTopic.copy.map((copy, index) => buildSocialCopy(selectedTopic.id, index, destinationUrl || DEFAULT_SOCIAL_DESTINATION)),
    [destinationUrl, selectedTopic]
  )
  const selectedPost = posts.find((post) => post.id === selectedPostId) ?? null
  const visiblePosts = posts.filter((post) => {
    const matchesStatus = statusFilter === "ALL" || post.status === statusFilter
    const matchesChannel = channelFilter === "ALL" || post.channels.includes(channelFilter)
    return matchesStatus && matchesChannel
  })
  const pageSize = 5
  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / pageSize))
  const paginatedPosts = visiblePosts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function changeStatusFilter(value: "ALL" | SocialPostStatus) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  function changeChannelFilter(value: "ALL" | SocialChannel) {
    setChannelFilter(value)
    setCurrentPage(1)
  }

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

  function startEditingChannels(post: SocialPostRecord) {
    setEditingChannelsId(post.id)
    setEditingChannels([...post.channels])
    setError(null)
    setMessage(null)
  }

  function toggleEditingChannel(channel: SocialChannel) {
    setEditingChannels((current) => {
      if (current.includes(channel)) {
        return current.filter((item) => item !== channel)
      }
      return [...current, channel]
    })
  }

  async function saveEditingChannels(postId: string) {
    if (editingChannels.length === 0) {
      setError("Selecciona al menos un canal")
      return
    }

    setPublishingId(postId)
    setError(null)
    setMessage(null)
    try {
      const post = await updateSocialPostChannelsAction(postId, editingChannels)
      setPosts((current) => [post, ...current.filter((item) => item.id !== post.id)])
      setEditingChannelsId(null)
      setMessage("Canales actualizados")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron actualizar los canales")
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
          <CardHeader className="space-y-3 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Publicaciones recientes</CardTitle>
                <CardDescription>Lista sincronizada desde la base de datos.</CardDescription>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</label>
                  <Select value={statusFilter} onValueChange={(value) => changeStatusFilter(value as "ALL" | SocialPostStatus)}>
                    <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar publicaciones por tipo o estado">
                      <SelectValue placeholder="Tipo de publicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos ({posts.length})</SelectItem>
                      {socialPostStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusTone[status].label} ({posts.filter((post) => post.status === status).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Canal</label>
                  <Select value={channelFilter} onValueChange={(value) => changeChannelFilter(value as "ALL" | SocialChannel)}>
                    <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar publicaciones por canal">
                      <SelectValue placeholder="Filtrar canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todos los canales</SelectItem>
                      {SOCIAL_CHANNELS.map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {channel === "FACEBOOK" ? "Facebook" : "Instagram"} ({posts.filter((post) => post.channels.includes(channel)).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                Aun no hay publicaciones guardadas.
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                No hay publicaciones con el estado seleccionado.
              </div>
            ) : (
              paginatedPosts.map((post) => {
                const tone = statusTone[post.status]
                return (
                  <button
                    key={post.id}
                    type="button"
                    className="w-full rounded-2xl border p-4 text-left transition hover:border-primary/50 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setSelectedPostId(post.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={tone.variant}>{tone.label}</Badge>
                          <Badge variant="outline">{post.channels.map((channel) => (channel === "FACEBOOK" ? "Facebook" : "Instagram")).join(" / ")}</Badge>
                        </div>
                        <h3 className="truncate font-semibold">{post.title}</h3>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{getSocialTopic(post.topic).label} · {formatCompactDate(post.scheduledAt)}</p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-primary">Ver detalle</span>
                    </div>
                  </button>
                )
              })
            )}
            {visiblePosts.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
                <span>Mostrando {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, visiblePosts.length)} de {visiblePosts.length}</span>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}>
                    Anterior
                  </Button>
                  <span className="min-w-20 text-center">Página {currentPage} de {totalPages}</span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages}>
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selectedPost)} onOpenChange={(open) => !open && setSelectedPostId(null)}>
        <SheetContent side="right" className="h-dvh w-full overflow-y-auto p-0 sm:max-w-xl">
          {selectedPost ? (
            <div className="space-y-6 p-6">
              <SheetHeader className="pr-8 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusTone[selectedPost.status].variant}>{statusTone[selectedPost.status].label}</Badge>
                  <Badge variant="outline">{selectedPost.channels.map((channel) => (channel === "FACEBOOK" ? "Facebook" : "Instagram")).join(" / ")}</Badge>
                </div>
                <SheetTitle>{selectedPost.title}</SheetTitle>
                <SheetDescription>{getSocialTopic(selectedPost.topic).label} · {formatCompactDate(selectedPost.scheduledAt)}</SheetDescription>
              </SheetHeader>

              {selectedPost.imageUrl ? <img src={selectedPost.imageUrl} alt="Imagen de la publicación" className="w-full rounded-2xl border object-cover" /> : null}

              {selectedPost.lastError ? (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{selectedPost.lastError}</span>
                </div>
              ) : null}

              <div className="space-y-3 text-sm">
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Copy</p><p className="mt-1 whitespace-pre-wrap">{selectedPost.caption}</p></div>
                <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Destino</p><p className="mt-1 break-all">{selectedPost.destinationUrl}</p></div>
                {selectedPost.imageUrl ? <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Imagen pública</p><p className="mt-1 break-all">{selectedPost.imageUrl}</p></div> : null}
              </div>

              {selectedPost.status === "FAILED" && editingChannelsId === selectedPost.id ? (
                <div className="rounded-xl border bg-muted/20 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Canales para reintentar</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {SOCIAL_CHANNELS.map((channel) => (
                      <Button key={channel} type="button" size="sm" variant={editingChannels.includes(channel) ? "default" : "outline"} onClick={() => toggleEditingChannel(channel)}>
                        {channel === "FACEBOOK" ? "Facebook" : "Instagram"}
                      </Button>
                    ))}
                    <Button type="button" size="sm" onClick={() => saveEditingChannels(selectedPost.id)} disabled={publishingId === selectedPost.id || editingChannels.length === 0}>Guardar</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setEditingChannelsId(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {selectedPost.status !== "PUBLISHED" ? <Button type="button" onClick={() => publishScheduledPost(selectedPost.id)} disabled={publishingId === selectedPost.id}><Send className="h-4 w-4" />{publishingId === selectedPost.id ? "Publicando" : "Publicar"}</Button> : null}
                {selectedPost.status === "FAILED" && editingChannelsId !== selectedPost.id ? <Button type="button" variant="outline" onClick={() => startEditingChannels(selectedPost)}><PencilLine className="h-4 w-4" />Canales</Button> : null}
                <CopyButton text={selectedPost.caption} />
              </div>

              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div><p className="text-xs uppercase tracking-wide">Estado</p><p className="mt-1 text-foreground">{selectedPost.status}</p></div>
                <div><p className="text-xs uppercase tracking-wide">Publicado</p><p className="mt-1 text-foreground">{selectedPost.publishedAt ? formatCompactDate(selectedPost.publishedAt) : "Pendiente"}</p></div>
                <div><p className="text-xs uppercase tracking-wide">Facebook ID</p><p className="mt-1 break-all text-foreground">{selectedPost.facebookPostId ?? "-"}</p></div>
                <div><p className="text-xs uppercase tracking-wide">Instagram ID</p><p className="mt-1 break-all text-foreground">{selectedPost.instagramMediaId ?? "-"}</p></div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
