import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

async function hasImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (file.type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])
  if (file.type === "image/gif") return String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a"
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  return false
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file")
  const storeSlug = formData.get("storeSlug")

  if (!(file instanceof File) || typeof storeSlug !== "string") {
    return NextResponse.json({ message: "Archivo inválido" }, { status: 400 })
  }

  const membership = await db.storeMember.findFirst({
    where: { userId: session.user.id, role: { in: ["OWNER", "STAFF"] }, store: { slug: storeSlug } },
    select: { storeId: true },
  })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })
  if (!IMAGE_TYPES.has(file.type) || file.size === 0 || file.size > MAX_IMAGE_BYTES || !await hasImageSignature(file)) {
    return NextResponse.json({ message: "Usa una imagen JPG, PNG, WebP o GIF de hasta 5 MB" }, { status: 422 })
  }

  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-")
  const blob = await put(`uploads/${membership.storeId}/${crypto.randomUUID()}-${filename}`, file, {
    access: "public",
    contentType: file.type,
  })

  return NextResponse.json({ url: blob.url })
}
