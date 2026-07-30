import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import * as dns from "node:dns/promises"
import * as net from "node:net"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { buildStoreUploadPath } from "@/lib/blob-path"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308])

function isPrivateIp(address: string) {
  if (net.isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number)
    return a === 10
      || a === 127
      || a === 0
      || a === 169 && b === 254
      || a === 172 && b >= 16 && b <= 31
      || a === 192 && b === 168
      || a === 100 && b >= 64 && b <= 127
  }

  if (net.isIP(address) === 6) {
    const normalized = address.toLowerCase()
    return normalized === "::1"
      || normalized.startsWith("fc")
      || normalized.startsWith("fd")
      || normalized.startsWith("fe80:")
  }

  return false
}

async function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])
  if (type === "image/gif") return String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a"
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  return false
}

async function isSafeRemoteHost(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return false
  if (net.isIP(hostname)) return !isPrivateIp(hostname)

  const addresses = await dns.lookup(hostname, { all: true })
  return addresses.length > 0 && addresses.every((entry) => !isPrivateIp(entry.address))
}

function getImageFilename(url: URL, contentType: string) {
  const lastSegment = url.pathname.split("/").filter(Boolean).pop() || "image"
  if (lastSegment.includes(".")) return lastSegment

  if (contentType === "image/jpeg") return `${lastSegment}.jpg`
  if (contentType === "image/png") return `${lastSegment}.png`
  if (contentType === "image/webp") return `${lastSegment}.webp`
  if (contentType === "image/gif") return `${lastSegment}.gif`

  return `${lastSegment}.img`
}

async function downloadRemoteImage(urlString: string, redirectsLeft = 3): Promise<{ bytes: Uint8Array; contentType: string; filename: string }> {
  const url = new URL(urlString)
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URL inválida")
  }
  if (!(await isSafeRemoteHost(url.hostname))) {
    throw new Error("Host no permitido")
  }

  const response = await fetch(url, { redirect: "manual" })
  if (REDIRECT_STATUS.has(response.status)) {
    if (redirectsLeft <= 0) throw new Error("Demasiados redireccionamientos")
    const location = response.headers.get("location")
    if (!location) throw new Error("Redireccion invalida")
    return downloadRemoteImage(new URL(location, url).toString(), redirectsLeft - 1)
  }

  if (!response.ok) {
    throw new Error("No se pudo descargar la imagen")
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? ""
  if (!IMAGE_TYPES.has(contentType)) {
    throw new Error("La URL no apunta a una imagen compatible")
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error("La imagen debe pesar hasta 5 MB")
  }
  if (!(await hasImageSignature(bytes, contentType))) {
    throw new Error("La imagen descargada no es válida")
  }

  return {
    bytes,
    contentType,
    filename: getImageFilename(url, contentType),
  }
}

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
    return NextResponse.json({ message: "Archivo inválido" }, { status: 400 })
  }

  const membership = await db.storeMember.findFirst({
    where: { userId: session.user.id, role: { in: ["OWNER", "STAFF"] }, store: { slug: storeSlug } },
    select: { store: { select: { slug: true } } },
  })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  try {
    if (file instanceof File) {
      const bytes = new Uint8Array(await file.slice(0, MAX_IMAGE_BYTES + 1).arrayBuffer())
      if (!IMAGE_TYPES.has(file.type) || bytes.length === 0 || bytes.length > MAX_IMAGE_BYTES || !await hasImageSignature(bytes, file.type)) {
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

  return NextResponse.json({ message: "Archivo inválido" }, { status: 400 })
}
