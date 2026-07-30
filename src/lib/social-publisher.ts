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

  if (result.facebookPostId || result.instagramMediaId) {
    await db.socialPost.update({
      where: { id: post.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        facebookPostId: result.facebookPostId ?? undefined,
        instagramMediaId: result.instagramMediaId ?? undefined,
        lastError: null,
      },
    })
    return result
  }

  await db.socialPost.update({
    where: { id: post.id },
    data: {
      status: "FAILED",
      facebookPostId: result.facebookPostId ?? undefined,
      instagramMediaId: result.instagramMediaId ?? undefined,
      lastError: failures.join(" | ") || "No se pudo publicar",
    },
  })

  throw new Error(failures.join(" | ") || "No se pudo publicar")
}

export async function publishDueSocialPosts(limit = 25) {
  const now = new Date()
  const duePosts = await db.socialPost.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  })

  const results: Array<{ id: string; ok: boolean; error?: string }> = []
  for (const post of duePosts) {
    try {
      await db.socialPost.update({
        where: { id: post.id },
        data: { status: "PUBLISHING", lastError: null },
      })
      await publishSocialPost({
        id: post.id,
        caption: post.caption,
        channels: post.channels as SocialChannel[],
        imageUrl: post.imageUrl,
        destinationUrl: post.destinationUrl,
      })
      results.push({ id: post.id, ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo publicar"
      await db.socialPost.update({
        where: { id: post.id },
        data: { status: "FAILED", lastError: message },
      })
      results.push({ id: post.id, ok: false, error: message })
    }
  }

  return results
}
