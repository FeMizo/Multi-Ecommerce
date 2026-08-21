import * as dns from "node:dns/promises"
import * as net from "node:net"

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

async function isSafeRemoteHost(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return false
  if (net.isIP(hostname)) return !isPrivateIp(hostname)

  const addresses = await dns.lookup(hostname, { all: true })
  return addresses.length > 0 && addresses.every((entry) => !isPrivateIp(entry.address))
}

export async function hasImageSignature(bytes: Uint8Array, type: string) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index])
  if (type === "image/gif") return String.fromCharCode(...bytes.slice(0, 6)) === "GIF87a" || String.fromCharCode(...bytes.slice(0, 6)) === "GIF89a"
  if (type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  return false
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

export function isRemoteImageUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export async function downloadRemoteImage(urlString: string, redirectsLeft = 3): Promise<{ bytes: Uint8Array; contentType: string; filename: string }> {
  const url = new URL(urlString)
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("URL invalida")
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
    throw new Error("La imagen descargada no es valida")
  }

  return {
    bytes,
    contentType,
    filename: getImageFilename(url, contentType),
  }
}

export const remoteImageLimits = {
  maxBytes: MAX_IMAGE_BYTES,
  imageTypes: IMAGE_TYPES,
}
