function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-")
}

export function buildStoreUploadPath(
  storeSlug: string,
  filename: string,
  uploadId = crypto.randomUUID(),
) {
  const safeStoreSlug = sanitizePathSegment(storeSlug)
  const safeFilename = sanitizePathSegment(filename)

  return `uploads/${safeStoreSlug}/${uploadId}-${safeFilename}`
}
