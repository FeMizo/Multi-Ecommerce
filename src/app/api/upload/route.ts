import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildStoreUploadPath } from "@/lib/blob-path"
import { downloadRemoteImage, hasImageSignature, remoteImageLimits } from "@/lib/remote-image"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file")
  const imageUrl = formData.get("imageUrl")
  const storeSlug = formData.get("storeSlug")

  if (typeof storeSlug !== "string") {
    return NextResponse.json({ message: "Archivo invalido" }, { status: 400 })
  }

  const membership = await db.storeMember.findFirst({
    where: { userId: session.user.id, role: { in: ["OWNER", "STAFF"] }, store: { slug: storeSlug } },
    select: { store: { select: { slug: true } } },
  })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  try {
    if (file instanceof File) {
      const bytes = new Uint8Array(await file.slice(0, remoteImageLimits.maxBytes + 1).arrayBuffer())
      if (!remoteImageLimits.imageTypes.has(file.type) || bytes.length === 0 || bytes.length > remoteImageLimits.maxBytes || !await hasImageSignature(bytes, file.type)) {
        return NextResponse.json({ message: "Usa una imagen JPG, PNG, WebP o GIF de hasta 5 MB" }, { status: 422 })
      }

      const blob = await put(buildStoreUploadPath(membership.store.slug, file.name), file, {
        access: "public",
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      return NextResponse.json({ url: blob.url })
    }

    if (typeof imageUrl === "string" && imageUrl.trim()) {
      const downloaded = await downloadRemoteImage(imageUrl.trim())
      const imageBuffer = downloaded.bytes.buffer.slice(downloaded.bytes.byteOffset, downloaded.bytes.byteOffset + downloaded.bytes.byteLength) as ArrayBuffer
      const blob = await put(buildStoreUploadPath(membership.store.slug, downloaded.filename), new Blob([imageBuffer], {
        type: downloaded.contentType,
      }), {
        access: "public",
        contentType: downloaded.contentType,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      return NextResponse.json({ url: blob.url })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo subir la imagen"
    return NextResponse.json({ message }, { status: 422 })
  }

  return NextResponse.json({ message: "Archivo invalido" }, { status: 400 })
}
