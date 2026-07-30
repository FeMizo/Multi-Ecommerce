import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { slugify } from "@/lib/utils"
import { checkProductLimit } from "@/lib/plan-limits"
import { getDuplicateVariantNames, normalizeVariantOptions, sumVariantQuantities } from "@/lib/product-variants"
import { productCreateSchema } from "@/lib/schemas"

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
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getMembership(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const body = await req.json()
  const parsed = productCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const storeId = membership.store.id
  const data = parsed.data
  const duplicateVariantNames = getDuplicateVariantNames(data.variantOptions)
  if (duplicateVariantNames.length) {
    return NextResponse.json({ message: "No puedes tener dos variantes con el mismo nombre" }, { status: 422 })
  }
  const normalizedVariantOptions = normalizeVariantOptions(data.variantOptions)
  const hasVariantQty = normalizedVariantOptions.some((option) =>
    option.values.some((value) => typeof value.quantity === "number" && value.quantity > 0)
  )
  const resolvedStock = data.manageStock
    ? (normalizedVariantOptions.length > 0 && hasVariantQty ? sumVariantQuantities(normalizedVariantOptions) : data.stock)
    : 0

  try {
    const product = await db.$transaction(async (tx) => {
      const limit = await checkProductLimit(storeId, tx)
      if (!limit.ok) {
        throw new Error(`PLAN_LIMIT:${limit.count}:${limit.max}`)
      }

      const slugBase = data.slug || slugify(data.name)
      let finalSlug = slugBase
      let i = 1
      while (await tx.product.findFirst({ where: { storeId, slug: finalSlug } })) {
        finalSlug = `${slugBase}-${i++}`
      }

      return tx.product.create({
        data: {
          storeId,
          name: data.name,
          slug: finalSlug,
          description: data.description ?? null,
          price: data.price,
          comparePrice: data.comparePrice ?? null,
          stock: resolvedStock,
          manageStock: data.manageStock,
          sku: data.sku ?? null,
          categoryId: data.categoryId,
          status: data.status,
          featured: data.featured,
          images: data.images,
          tags: data.tags,
          variantOptions: normalizedVariantOptions,
        },
      })
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PLAN_LIMIT:")) {
      const [, count, max] = error.message.split(":")
      return NextResponse.json({ message: `Limite de productos alcanzado (${count}/${max})` }, { status: 409 })
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      return NextResponse.json({ message: "Otra solicitud modifico el catalogo; intenta de nuevo" }, { status: 409 })
    }
    throw error
  }
}
