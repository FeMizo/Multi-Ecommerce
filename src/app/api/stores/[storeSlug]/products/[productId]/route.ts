import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getDuplicateVariantNames, normalizeVariantOptions, sumVariantQuantities } from "@/lib/product-variants"
import { productUpdateSchema } from "@/lib/schemas"

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; productId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, productId } = await params
  const membership = await getMembership(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const storeId = membership.store.id

  const product = await db.product.findFirst({ where: { id: productId, storeId } })
  if (!product) return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 })

  const body = await req.json()
  const parsed = productUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

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

  if (data.slug !== product.slug) {
    const conflict = await db.product.findFirst({
      where: { storeId, slug: data.slug, id: { not: productId } },
    })
    if (conflict) {
      return NextResponse.json({ message: "Ese slug ya esta en uso" }, { status: 409 })
    }
  }

  const updated = await db.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      slug: data.slug,
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

  return NextResponse.json({ id: updated.id, slug: updated.slug })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string; productId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug, productId } = await params
  const membership = await getMembership(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const storeId = membership.store.id
  const product = await db.product.findFirst({ where: { id: productId, storeId } })
  if (!product) return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 })

  await db.product.update({
    where: { id: productId },
    data: { deletedAt: new Date(), status: "DELETED" },
  })

  return new NextResponse(null, { status: 204 })
}
