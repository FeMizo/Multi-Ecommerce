import { config } from "dotenv"
import { BlobNotFoundError, copy, del, head } from "@vercel/blob"
import { getStoreBlobMigration, type BlobMigration } from "../src/lib/blob-migration"

config({ path: ".env.local" })

async function main() {
  const apply = process.argv.includes("--apply")
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const storeId = process.env.BLOB_STORE_ID
  if (!token || !storeId?.startsWith("store_")) {
    throw new Error("Configura BLOB_STORE_ID y BLOB_READ_WRITE_TOKEN")
  }

  const blobHostname = `${storeId.slice("store_".length).toLowerCase()}.public.blob.vercel-storage.com`
  const { db } = await import("../src/lib/db")

  try {
    const stores = await db.store.findMany({
      select: {
        id: true,
        slug: true,
        logoUrl: true,
        bannerUrl: true,
        products: { select: { id: true, images: true } },
      },
    })

    const migrations = new Map<string, BlobMigration>()
    for (const store of stores) {
      const urls = [
        store.logoUrl,
        store.bannerUrl,
        ...store.products.flatMap((product) => product.images),
      ]
      for (const url of urls) {
        if (!url) continue
        const migration = getStoreBlobMigration({
          url,
          storeId: store.id,
          storeSlug: store.slug,
          blobHostname,
        })
        if (migration) migrations.set(migration.sourceUrl, migration)
      }
    }

    console.log(`Blobs por migrar: ${migrations.size}`)
    for (const migration of migrations.values()) {
      console.log(`${new URL(migration.sourceUrl).pathname} -> /${migration.targetPath}`)
    }

    if (!apply || migrations.size === 0) return

    for (const migration of migrations.values()) {
      const source = await head(migration.sourceUrl, { token })
      try {
        const target = await head(migration.targetUrl, { token })
        if (target.size !== source.size || target.contentType !== source.contentType) {
          throw new Error(`El destino ya existe con contenido diferente: ${migration.targetPath}`)
        }
      } catch (error) {
        if (!(error instanceof BlobNotFoundError)) throw error
        await copy(migration.sourceUrl, migration.targetPath, {
          access: "public",
          addRandomSuffix: false,
          contentType: source.contentType,
          token,
        })
      }
    }

    await db.$transaction(async (tx) => {
      for (const store of stores) {
        const nextLogoUrl = store.logoUrl ? migrations.get(store.logoUrl)?.targetUrl ?? store.logoUrl : null
        const nextBannerUrl = store.bannerUrl ? migrations.get(store.bannerUrl)?.targetUrl ?? store.bannerUrl : null
        if (nextLogoUrl !== store.logoUrl || nextBannerUrl !== store.bannerUrl) {
          await tx.store.update({
            where: { id: store.id },
            data: { logoUrl: nextLogoUrl, bannerUrl: nextBannerUrl },
          })
        }

        for (const product of store.products) {
          const nextImages = product.images.map((url) => migrations.get(url)?.targetUrl ?? url)
          if (nextImages.some((url, index) => url !== product.images[index])) {
            await tx.product.update({ where: { id: product.id }, data: { images: nextImages } })
          }
        }
      }
    })

    await del([...migrations.keys()], { token })
    console.log(`Migración aplicada: ${migrations.size} blobs`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
