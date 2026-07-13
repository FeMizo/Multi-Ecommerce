export type BlobMigration = {
  sourceUrl: string
  targetPath: string
  targetUrl: string
}

export function getStoreBlobMigration({
  url,
  storeId,
  storeSlug,
  blobHostname,
}: {
  url: string
  storeId: string
  storeSlug: string
  blobHostname: string
}): BlobMigration | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const oldPrefix = `/uploads/${storeId}/`
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== blobHostname ||
    !parsed.pathname.startsWith(oldPrefix)
  ) {
    return null
  }

  const filename = parsed.pathname.slice(oldPrefix.length)
  if (!filename || filename.includes("/")) return null

  const targetPath = `uploads/${storeSlug}/${filename}`
  return {
    sourceUrl: parsed.toString(),
    targetPath,
    targetUrl: `https://${blobHostname}/${targetPath}`,
  }
}
