import { db } from "@/lib/db"
import {
  DEFAULT_SOCIAL_ASSET_BASE_URL,
  buildScheduledSocialCampaign,
  buildScheduledStyleCampaign,
} from "@/lib/social-marketing"
import { renderSocialImageBuffer } from "@/lib/social-marketing-image"
import { uploadFileToFtp } from "@/lib/ftp"
import { publishSocialPost } from "@/lib/social-publisher"

function isPromotionDay(date: Date) {
  const day = date.getUTCDay()
  return day === 2 || day === 4
}

function isStyleDay(date: Date) {
  const day = date.getUTCDay()
  return day === 1 || day === 5
}

function readCronConfig() {
  const host = process.env.FTP_HOST?.trim()
  const port = Number(process.env.FTP_PORT?.trim() || "21")
  const user = process.env.FTP_USER?.trim()
  const password = process.env.FTP_PASSWORD?.trim()
  const remoteDir = process.env.FTP_REMOTE_DIR?.trim()
  const publicBaseUrl = (process.env.APP_URL?.trim() || DEFAULT_SOCIAL_ASSET_BASE_URL).replace(/\/$/, "")

  if (!host || !user || !password || !remoteDir) {
    throw new Error("Faltan credenciales FTP en .env.local")
  }

  return { host, port, user, password, remoteDir, publicBaseUrl }
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la publicacion"
}

export async function runSocialPromotionCron(now = new Date()) {
  return runSocialPromotionCronInternal(now, false)
}

export async function publishDueSocialPosts(now = new Date()) {
  return runSocialPromotionCron(now)
}

export async function runStylePromotionCron(now = new Date()) {
  return runStylePromotionCronInternal(now, false)
}

export async function publishDueStylePosts(now = new Date()) {
  return runStylePromotionCron(now)
}

export async function runSocialPromotionCronInternal(now = new Date(), dryRun = false) {
  if (!dryRun && !isPromotionDay(now)) {
    return { skipped: true, reason: "Solo corre martes y jueves" }
  }

  const campaign = buildScheduledSocialCampaign(now)
  const created = await db.socialPost.create({
    data: {
      title: campaign.title,
      topic: campaign.topicId,
      channels: campaign.channels,
      caption: campaign.caption,
      destinationUrl: campaign.destinationUrl,
      scheduledAt: now,
      status: "PUBLISHING",
    },
  })

  try {
    const imageBuffer = await renderSocialImageBuffer(campaign)
    const upload = await uploadFileToFtp(readCronConfig(), campaign.imageFileName, imageBuffer)

    await db.socialPost.update({
      where: { id: created.id },
      data: { imageUrl: upload.publicUrl },
    })

    if (!dryRun) {
      await publishSocialPost({
        id: created.id,
        caption: campaign.caption,
        channels: campaign.channels,
        imageUrl: upload.publicUrl,
        destinationUrl: campaign.destinationUrl,
      })
    } else {
      await db.socialPost.update({
        where: { id: created.id },
        data: {
          status: "SCHEDULED",
          publishedAt: null,
        },
      })
    }

    const finalPost = await db.socialPost.findUniqueOrThrow({ where: { id: created.id } })
    return {
      ok: true,
      post: {
        id: finalPost.id,
        status: finalPost.status,
        imageUrl: finalPost.imageUrl,
        facebookPostId: finalPost.facebookPostId,
        instagramMediaId: finalPost.instagramMediaId,
        lastError: finalPost.lastError,
      },
      upload,
      dryRun,
    }
  } catch (error) {
    const message = toErrorMessage(error)
    const current = await db.socialPost.findUnique({ where: { id: created.id } })
    if (current?.status === "PUBLISHING") {
      await db.socialPost.update({
        where: { id: created.id },
        data: {
          status: "FAILED",
          lastError: message,
        },
      })
    }

    return {
      ok: false,
      postId: created.id,
      error: message,
    }
  }
}

export async function runStylePromotionCronInternal(now = new Date(), dryRun = false) {
  if (!dryRun && !isStyleDay(now)) {
    return { skipped: true, reason: "Solo corre lunes y viernes" }
  }

  const campaign = buildScheduledStyleCampaign(now)
  const created = await db.socialPost.create({
    data: {
      title: campaign.title,
      topic: campaign.topicId,
      channels: campaign.channels,
      caption: campaign.caption,
      destinationUrl: campaign.destinationUrl,
      scheduledAt: now,
      status: "PUBLISHING",
    },
  })

  try {
    const imageBuffer = await renderSocialImageBuffer(campaign)
    const upload = await uploadFileToFtp(readCronConfig(), campaign.imageFileName, imageBuffer)

    await db.socialPost.update({
      where: { id: created.id },
      data: { imageUrl: upload.publicUrl },
    })

    if (!dryRun) {
      await publishSocialPost({
        id: created.id,
        caption: campaign.caption,
        channels: campaign.channels,
        imageUrl: upload.publicUrl,
        destinationUrl: campaign.destinationUrl,
      })
    } else {
      await db.socialPost.update({
        where: { id: created.id },
        data: {
          status: "SCHEDULED",
          publishedAt: null,
        },
      })
    }

    const finalPost = await db.socialPost.findUniqueOrThrow({ where: { id: created.id } })
    return {
      ok: true,
      post: {
        id: finalPost.id,
        status: finalPost.status,
        imageUrl: finalPost.imageUrl,
        facebookPostId: finalPost.facebookPostId,
        instagramMediaId: finalPost.instagramMediaId,
        lastError: finalPost.lastError,
      },
      upload,
      dryRun,
    }
  } catch (error) {
    const message = toErrorMessage(error)
    const current = await db.socialPost.findUnique({ where: { id: created.id } })
    if (current?.status === "PUBLISHING") {
      await db.socialPost.update({
        where: { id: created.id },
        data: {
          status: "FAILED",
          lastError: message,
        },
      })
    }

    return {
      ok: false,
      postId: created.id,
      error: message,
    }
  }
}
