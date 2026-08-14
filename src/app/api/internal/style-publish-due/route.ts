import { NextResponse } from "next/server"
import {
  publishUploadedSocialPromotion,
  runStylePromotionCron,
  runStylePromotionCronInternal,
} from "@/lib/social-cron"
import type { SocialChannel } from "@/lib/social-marketing"

async function publish(req: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = req.headers.get("authorization")
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  if (req.method === "POST" && req.headers.get("content-type")?.includes("multipart/form-data")) {
    const form = await req.formData()
    const image = form.get("image")
    if (!(image instanceof File)) {
      return NextResponse.json({ message: "Falta el campo image" }, { status: 400 })
    }

    const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp"])
    if (!allowedTypes.has(image.type)) {
      return NextResponse.json({ message: "La imagen debe ser PNG, JPG o WebP" }, { status: 400 })
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer())
    if (imageBuffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ message: "La imagen excede 10 MB" }, { status: 413 })
    }

    const channelsValue = String(form.get("channels") ?? "INSTAGRAM")
    const channels = channelsValue
      .split(",")
      .map((channel) => channel.trim().toUpperCase())
      .filter((channel): channel is SocialChannel => channel === "FACEBOOK" || channel === "INSTAGRAM")

    if (channels.length === 0) {
      return NextResponse.json({ message: "Falta un canal valido" }, { status: 400 })
    }

    const extension = image.type === "image/jpeg" ? "jpg" : image.type.split("/")[1]
    const requestedName = String(form.get("filename") ?? `promo-chatgpt-${Date.now()}.${extension}`)
    const filename = requestedName.replace(/[^a-zA-Z0-9._-]/g, "-")

    const result = await publishUploadedSocialPromotion({
      title: String(form.get("title") ?? "Promocion Multi Shop"),
      topicId: String(form.get("topicId") ?? "chatgpt-image"),
      channels,
      caption: String(form.get("caption") ?? "Compra local en un solo lugar. shop.aionsite.com.mx"),
      destinationUrl: String(form.get("destinationUrl") ?? "https://shop.aionsite.com.mx"),
      imageFileName: filename,
      imageBuffer,
    })

    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  }

  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1"
  const result = dryRun
    ? await runStylePromotionCronInternal(new Date(), true)
    : await runStylePromotionCron(new Date())

  return NextResponse.json(result)
}

export const GET = publish
export const POST = publish
