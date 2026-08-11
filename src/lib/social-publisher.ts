import { db } from "@/lib/db"
import { DEFAULT_SOCIAL_DESTINATION, type SocialChannel, requiresImage } from "@/lib/social-marketing"

type PublishInput = {
  caption: string
  channels: SocialChannel[]
  imageUrl?: string | null
  destinationUrl?: string | null
}

type PublishResult = {
  facebookPostId?: string | null
  instagramMediaId?: string | null
}

function requireMetaEnv() {
  const pageId = process.env.META_PAGE_ID?.trim()
  const pageAccessToken = process.env.META_PAGE_ACCESS_TOKEN?.trim()
  const igUserId = process.env.META_IG_USER_ID?.trim()
  const graphVersion = process.env.META_GRAPH_VERSION?.trim() || "v26.0"

  if (!pageId || !pageAccessToken || !igUserId) {
    throw new Error("Faltan variables de Meta en .env.local")
  }

  return { pageId, pageAccessToken, igUserId, graphVersion }
}

async function postGraph(path: string, token: string, body: URLSearchParams) {
  const { graphVersion } = requireMetaEnv()
  const res = await fetch(`https://graph.facebook.com/${graphVersion}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  })

  const data = await res.json() as Record<string, unknown>
  if (!res.ok) {
    const error = data.error as Record<string, unknown> | undefined
    const message = typeof error?.message === "string" ? error.message : "Error de Meta"
    throw new Error(message)
  }

  return data
}

async function getGraph(path: string, token: string) {
  const { graphVersion } = requireMetaEnv()
  const res = await fetch(`https://graph.facebook.com/${graphVersion}/${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await res.json() as Record<string, unknown>
  if (!res.ok) {
    const error = data.error as Record<string, unknown> | undefined
    const message = typeof error?.message === "string" ? error.message : "Error de Meta"
    throw new Error(message)
  }

  return data
}

async function waitForInstagramContainer(containerId: string, token: string) {
  const maxAttempts = 10
  const delayMs = 2000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const data = await getGraph(`${containerId}?fields=status_code,status`, token)
    const statusCode = typeof data.status_code === "string" ? data.status_code : ""

    if (statusCode === "FINISHED") {
      return
    }

    if (statusCode === "ERROR" || statusCode === "EXPIRED") {
      const status = typeof data.status === "string" ? data.status : statusCode
      throw new Error(`Instagram container no listo: ${status}`)
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw new Error("Instagram container no quedo listo a tiempo")
}

export async function publishFacebookPagePost({ caption, imageUrl, destinationUrl }: PublishInput): Promise<PublishResult> {
  const { pageId, pageAccessToken } = requireMetaEnv()
  const message = caption.trim()
  const link = (destinationUrl?.trim() || DEFAULT_SOCIAL_DESTINATION).trim()

  if (imageUrl?.trim()) {
    const captionWithLink = link ? `${message}\n\n${link}` : message
    const data = await postGraph(`${pageId}/photos`, pageAccessToken, new URLSearchParams({
      url: imageUrl.trim(),
      caption: captionWithLink,
      published: "true",
      access_token: pageAccessToken,
    }))
    return { facebookPostId: typeof data.id === "string" ? data.id : null }
  }

  const feedMessage = link ? `${message}\n\n${link}` : message
  const data = await postGraph(`${pageId}/feed`, pageAccessToken, new URLSearchParams({
    message: feedMessage,
    access_token: pageAccessToken,
  }))
  return { facebookPostId: typeof data.id === "string" ? data.id : null }
}

export async function publishInstagramPost({ caption, imageUrl }: PublishInput): Promise<PublishResult> {
  const { igUserId, pageAccessToken } = requireMetaEnv()
  const publicImageUrl = imageUrl?.trim()

  if (!publicImageUrl) {
    throw new Error("Instagram requiere una imagen publica")
  }

  const creation = await postGraph(`${igUserId}/media`, pageAccessToken, new URLSearchParams({
    image_url: publicImageUrl,
    caption: caption.trim(),
    access_token: pageAccessToken,
  }))

  const creationId = typeof creation.id === "string" ? creation.id : null
  if (!creationId) {
    throw new Error("No se pudo crear el contenedor de Instagram")
  }

  await waitForInstagramContainer(creationId, pageAccessToken)

  const published = await postGraph(`${igUserId}/media_publish`, pageAccessToken, new URLSearchParams({
    creation_id: creationId,
    access_token: pageAccessToken,
  }))

  return { instagramMediaId: typeof published.id === "string" ? published.id : null }
}

export async function publishSocialPost(post: {
  id: string
  caption: string
  channels: SocialChannel[]
  imageUrl?: string | null
  destinationUrl?: string | null
}) {
  if (requiresImage(post.channels) && !post.imageUrl?.trim()) {
    throw new Error("Instagram requiere imagen para publicar")
  }

  const result: PublishResult = {}
  const failures: string[] = []

  if (post.channels.includes("FACEBOOK")) {
    try {
      const facebook = await publishFacebookPagePost(post)
      result.facebookPostId = facebook.facebookPostId ?? null
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "No se pudo publicar en Facebook")
    }
  }

  if (post.channels.includes("INSTAGRAM")) {
    try {
      const instagram = await publishInstagramPost(post)
      result.instagramMediaId = instagram.instagramMediaId ?? null
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "No se pudo publicar en Instagram")
    }
  }

  const hasSuccess = Boolean(result.facebookPostId || result.instagramMediaId)
  const lastError = failures.length > 0 ? failures.join(" | ") : null

  await db.socialPost.update({
    where: { id: post.id },
    data: hasSuccess
      ? {
          status: "PUBLISHED",
          publishedAt: new Date(),
          facebookPostId: result.facebookPostId ?? undefined,
          instagramMediaId: result.instagramMediaId ?? undefined,
          lastError,
        }
      : {
          status: "FAILED",
          facebookPostId: result.facebookPostId ?? undefined,
          instagramMediaId: result.instagramMediaId ?? undefined,
          lastError: lastError ?? "No se pudo publicar",
        },
  })

  if (!hasSuccess) {
    throw new Error(lastError ?? "No se pudo publicar")
  }

  return result
}
