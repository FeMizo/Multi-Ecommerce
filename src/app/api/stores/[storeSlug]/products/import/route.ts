import { Prisma } from "@prisma/client"
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkProductLimit } from "@/lib/plan-limits"
import { slugify } from "@/lib/utils"
import {
  normalizeCsvHeader,
  parseCsv,
  parseCsvInteger,
  parseCsvNumber,
  splitCsvList,
} from "@/lib/csv"

type CsvRow = {
  line: number
  title: string
  price: number
  sku: string | null
  stock: number
  manageStock: boolean
  description: string | null
  categoryId: string
  status: "DRAFT" | "ACTIVE" | "PAUSED"
  images: string[]
  tags: string[]
}

const headerAliases: Record<string, string[]> = {
  title: ["titulo", "title", "nombre", "product", "productname"],
  price: ["precio", "price"],
  sku: ["sku"],
  stock: ["stock", "inventario", "existencia"],
  description: ["descripcion", "description"],
  category: ["categoria", "category"],
  status: ["estado", "status"],
  images: ["imagenes", "images", "image", "fotos"],
  tags: ["etiquetas", "tags"],
}

function normalizeForLookup(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function mapStatus(value: string | undefined) {
  const normalized = normalizeForLookup(value ?? "")
  if (!normalized) return "DRAFT" as const
  if (["active", "activo", "published", "publicado"].includes(normalized)) return "ACTIVE" as const
  if (["paused", "pausado", "inactive", "inactivo"].includes(normalized)) return "PAUSED" as const
  if (["draft", "borrador"].includes(normalized)) return "DRAFT" as const
  return null
}

function findHeaderIndex(headers: string[], candidates: string[]) {
  return headers.findIndex((header) => candidates.includes(normalizeCsvHeader(header)))
}

function normalizeSkuKey(value: string) {
  return value.toLowerCase().trim()
}

async function getMembership(userId: string, storeSlug: string) {
  return db.storeMember.findFirst({
    where: {
      userId,
      store: { slug: storeSlug },
      role: { in: ["OWNER", "STAFF"] },
    },
    include: { store: { select: { id: true } } },
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const { storeSlug } = await params
  const membership = await getMembership(session.user.id, storeSlug)
  if (!membership) {
    return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Adjunta un archivo CSV" }, { status: 400 })
  }

  const rawText = await file.text()
  const rows = parseCsv(rawText)
  if (rows.length < 2) {
    return NextResponse.json({ message: "El CSV no tiene filas para importar" }, { status: 400 })
  }

  const headers = rows[0]
  const dataRows = rows.slice(1)

  const headerIndexes = {
    title: findHeaderIndex(headers, headerAliases.title),
    price: findHeaderIndex(headers, headerAliases.price),
    sku: findHeaderIndex(headers, headerAliases.sku),
    stock: findHeaderIndex(headers, headerAliases.stock),
    description: findHeaderIndex(headers, headerAliases.description),
    category: findHeaderIndex(headers, headerAliases.category),
    status: findHeaderIndex(headers, headerAliases.status),
    images: findHeaderIndex(headers, headerAliases.images),
    tags: findHeaderIndex(headers, headerAliases.tags),
  }

  const requiredColumns = ["title", "price", "category"] as const
  const missingColumns = requiredColumns.filter((column) => headerIndexes[column] === -1)
  if (missingColumns.length > 0) {
    return NextResponse.json(
      { message: `Faltan columnas requeridas: ${missingColumns.join(", ")}` },
      { status: 400 }
    )
  }

  const categories = await db.category.findMany({
    where: { active: true },
    select: { id: true, name: true, slug: true },
  })
  const categoryLookup = new Map<string, string>()
  for (const category of categories) {
    categoryLookup.set(normalizeForLookup(category.name), category.id)
    categoryLookup.set(normalizeForLookup(category.slug), category.id)
  }

  const parsedRows: CsvRow[] = []
  const rowErrors: Array<{ line: number; message: string }> = []
  const seenSkus = new Set<string>()

  dataRows.forEach((row, index) => {
    const line = index + 2
    const cell = (column: number) => (column >= 0 ? (row[column] ?? "") : "")
    const title = cell(headerIndexes.title).trim()
    const price = parseCsvNumber(cell(headerIndexes.price))
    const categoryValue = cell(headerIndexes.category).trim()

    if (!title) {
      rowErrors.push({ line, message: "titulo es obligatorio" })
      return
    }
    if (title.length < 2 || title.length > 120) {
      rowErrors.push({ line, message: "titulo debe tener entre 2 y 120 caracteres" })
      return
    }
    if (price === null || price <= 0) {
      rowErrors.push({ line, message: "precio invalido" })
      return
    }
    if (!categoryValue) {
      rowErrors.push({ line, message: "categoria es obligatoria" })
      return
    }

    const categoryId = categoryLookup.get(normalizeForLookup(categoryValue))
    if (!categoryId) {
      rowErrors.push({ line, message: `categoria no encontrada: ${categoryValue}` })
      return
    }

    const skuValue = cell(headerIndexes.sku).trim()
    if (skuValue.length > 60) {
      rowErrors.push({ line, message: "sku supera 60 caracteres" })
      return
    }
    const skuKey = skuValue ? normalizeSkuKey(skuValue) : null
    if (skuKey && seenSkus.has(skuKey)) {
      rowErrors.push({ line, message: `sku duplicado en el CSV: ${skuValue}` })
      return
    }
    if (skuKey) {
      seenSkus.add(skuKey)
    }

    const descriptionValue = cell(headerIndexes.description).trim()
    if (descriptionValue.length > 2000) {
      rowErrors.push({ line, message: "descripcion supera 2000 caracteres" })
      return
    }

    const imageValues = headerIndexes.images >= 0 ? splitCsvList(cell(headerIndexes.images)) : []
    if (imageValues.length > 8) {
      rowErrors.push({ line, message: "imagenes supera el limite de 8" })
      return
    }

    const tagValues = headerIndexes.tags >= 0
      ? splitCsvList(cell(headerIndexes.tags)).map((tag) => tag.toLowerCase())
      : []
    if (tagValues.length > 10) {
      rowErrors.push({ line, message: "etiquetas supera el limite de 10" })
      return
    }

    const statusValue = headerIndexes.status >= 0 ? mapStatus(cell(headerIndexes.status)) : "DRAFT"
    if (!statusValue) {
      rowErrors.push({ line, message: `estado invalido: ${cell(headerIndexes.status)}` })
      return
    }

    const hasStockColumn = headerIndexes.stock >= 0
    const stockValue = hasStockColumn ? parseCsvInteger(cell(headerIndexes.stock)) : 0
    if (hasStockColumn && (stockValue === null || stockValue < 0)) {
      rowErrors.push({ line, message: "stock invalido" })
      return
    }

    parsedRows.push({
      line,
      title,
      price,
      sku: skuValue || null,
      stock: stockValue ?? 0,
      manageStock: hasStockColumn,
      description: descriptionValue || null,
      categoryId,
      status: statusValue,
      images: imageValues,
      tags: tagValues,
    })
  })

  if (rowErrors.length > 0) {
    return NextResponse.json(
      {
        message: "Corrige el CSV antes de importar",
        errors: rowErrors,
      },
      { status: 422 }
    )
  }

  const currentLimit = await checkProductLimit(membership.store.id)

  try {
    const skuRows = parsedRows.filter((row) => row.sku)
    const uniqueSkus = [...new Set(skuRows.map((row) => normalizeSkuKey(row.sku ?? "")))]
    const existingSkuProducts = uniqueSkus.length > 0
      ? await db.product.findMany({
        where: {
          storeId: membership.store.id,
          deletedAt: null,
          sku: { in: uniqueSkus },
        },
        select: { id: true, sku: true },
      })
      : []

    const productsBySku = new Map<string, Array<{ id: string }>>()
    for (const product of existingSkuProducts) {
      const skuKey = normalizeSkuKey(product.sku ?? "")
      const existing = productsBySku.get(skuKey) ?? []
      existing.push({ id: product.id })
      productsBySku.set(skuKey, existing)
    }

    const duplicatedCatalogSku = [...productsBySku.entries()].find(([, products]) => products.length > 1)
    if (duplicatedCatalogSku) {
      return NextResponse.json(
        { message: `SKU duplicado en el catalogo: ${duplicatedCatalogSku[0]}` },
        { status: 409 }
      )
    }

    const createsNeeded = parsedRows.filter((row) => {
      if (!row.sku) return true
      return !productsBySku.has(normalizeSkuKey(row.sku))
    }).length

    if (currentLimit.max !== null && currentLimit.count + createsNeeded > currentLimit.max) {
      return NextResponse.json(
        {
          message: `Limite de productos alcanzado (${currentLimit.count}/${currentLimit.max})`,
        },
        { status: 409 }
      )
    }

    const usedSlugs = new Set<string>()

    const result = await db.$transaction(async (tx) => {
      const counts = { created: 0, updated: 0 }

      for (const row of parsedRows) {
        const skuKey = row.sku ? normalizeSkuKey(row.sku) : null
        const existingProduct = skuKey ? productsBySku.get(skuKey)?.[0] ?? null : null

        if (existingProduct) {
          await tx.product.update({
            where: { id: existingProduct.id },
            data: {
              name: row.title,
              description: row.description,
              price: row.price,
              stock: row.stock,
              manageStock: row.manageStock,
              sku: row.sku,
              images: row.images,
              tags: row.tags,
              categoryId: row.categoryId,
              status: row.status,
            },
          })
          counts.updated += 1
          continue
        }

        const slugBase = slugify(row.title) || `producto-${row.line}`
        let finalSlug = slugBase
        let suffix = 1

        while (
          usedSlugs.has(finalSlug) ||
          (await tx.product.findFirst({
            where: {
              storeId: membership.store.id,
              slug: finalSlug,
            },
            select: { id: true },
          }))
        ) {
          finalSlug = `${slugBase}-${suffix++}`
        }

        usedSlugs.add(finalSlug)

        await tx.product.create({
          data: {
            storeId: membership.store.id,
            categoryId: row.categoryId,
            name: row.title,
            slug: finalSlug,
            description: row.description,
            price: row.price,
            comparePrice: null,
            stock: row.stock,
            manageStock: row.manageStock,
            sku: row.sku,
            images: row.images,
            tags: row.tags,
            variantOptions: [],
            status: row.status,
            featured: false,
          },
        })
        counts.created += 1
      }

      return counts
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json(
        { message: "Otra solicitud modifico el catalogo; intenta de nuevo" },
        { status: 409 }
      )
    }

    throw error
  }
}
