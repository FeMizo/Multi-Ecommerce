"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildSocialCopy, normalizeChannels, SOCIAL_CHANNELS } from "@/lib/social-marketing"
import { publishDueSocialPosts } from "@/lib/social-cron"
import { publishSocialPost } from "@/lib/social-publisher"
import type { SocialPostRecord } from "@/components/admin/social-marketing-board"

export type SocialPostActionInput = {
  title: string
  topic: string
  channels: SocialPostRecord["channels"]
  caption?: string
  imageUrl?: string
  destinationUrl?: string
  scheduledAt: string
  publishNow: boolean
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    throw new Error("Forbidden")
  }
  return session
}

function serializePost(post: Awaited<ReturnType<typeof db.socialPost.findFirstOrThrow>>) : SocialPostRecord {
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

export async function getSocialPostsAction() {
  await requireAdmin()
  const posts = await db.socialPost.findMany({
    orderBy: { scheduledAt: "desc" },
    take: 50,
  })
  return posts.map(serializePost)
}

export async function createSocialPostAction(input: SocialPostActionInput) {
  await requireAdmin()

  const channels = normalizeChannels(input.channels)
  if (!channels.every((channel) => SOCIAL_CHANNELS.includes(channel))) {
    throw new Error("Canales invalidos")
  }

  const destinationUrl = input.destinationUrl?.trim() || "https://shop.aionsite.com.mx"
  const caption = input.caption?.trim() || buildSocialCopy(input.topic, 0, destinationUrl)
  const scheduledAt = new Date(input.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime())) {
    throw new Error("Fecha invalida")
  }

  const created = await db.socialPost.create({
    data: {
      title: input.title.trim(),
      topic: input.topic,
      channels,
      caption,
      imageUrl: input.imageUrl?.trim() || null,
      destinationUrl,
      scheduledAt,
      status: input.publishNow ? "PUBLISHING" : "SCHEDULED",
    },
  })

  if (input.publishNow) {
    try {
      await publishSocialPost({
        id: created.id,
        caption: created.caption,
        channels: created.channels as SocialPostRecord["channels"],
        imageUrl: created.imageUrl,
        destinationUrl: created.destinationUrl,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo publicar"
      await db.socialPost.update({
        where: { id: created.id },
        data: { status: "FAILED", lastError: message },
      })
      revalidatePath("/admin/marketing")
      throw new Error(message)
    }
  }

  revalidatePath("/admin/marketing")
  return serializePost(await db.socialPost.findFirstOrThrow({ where: { id: created.id } }))
}

export async function publishSocialPostAction(postId: string) {
  await requireAdmin()

  const post = await db.socialPost.findFirst({ where: { id: postId } })
  if (!post) {
    throw new Error("Publicacion no encontrada")
  }

  await db.socialPost.update({
    where: { id: post.id },
    data: { status: "PUBLISHING", lastError: null },
  })

  try {
    await publishSocialPost({
      id: post.id,
      caption: post.caption,
      channels: post.channels as SocialPostRecord["channels"],
      imageUrl: post.imageUrl,
      destinationUrl: post.destinationUrl,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo publicar"
    await db.socialPost.update({
      where: { id: post.id },
      data: { status: "FAILED", lastError: message },
    })
    revalidatePath("/admin/marketing")
    throw new Error(message)
  }

  revalidatePath("/admin/marketing")
  return serializePost(await db.socialPost.findFirstOrThrow({ where: { id: post.id } }))
}

export async function publishDueSocialPostsAction() {
  await requireAdmin()
  const results = await publishDueSocialPosts()
  revalidatePath("/admin/marketing")
  return results
}
