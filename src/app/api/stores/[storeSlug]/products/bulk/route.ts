import { ProductStatus } from "@prisma/client"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const productIdsSchema = z.array(z.string().min(1)).min(1).max(200)

const bulkProductSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    productIds: productIdsSchema,
    status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]),
  }),
  z.object({
    action: z.literal("setPrice"),
    productIds: productIdsSchema,
    price: z.number().positive().max(999999),
  }),
  z.object({
    action: z.literal("adjustPricePercent"),
    productIds: productIdsSchema,
    percent: z.number().min(-99).max(500),
  }),
  z.object({
    action: z.literal("setStock"),
    productIds: productIdsSchema,
    stock: z.number().int().min(0).max(999999),
  }),
  z.object({
    action: z.literal("featured"),
    productIds: productIdsSchema,
    featured: z.boolean(),
  }),
  z.object({
    action: z.literal("delete"),
    productIds: productIdsSchema,
  }),
])

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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getMembership(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const parsed = bulkProductSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const input = parsed.data
  const where = {
    id: { in: input.productIds },
    storeId: membership.store.id,
    deletedAt: null,
  }

  if (input.action === "adjustPricePercent") {
    const products = await db.product.findMany({
      where,
      select: { id: true, price: true },
    })
    if (products.length !== input.productIds.length) {
      return NextResponse.json({ message: "Algunos productos no existen o no pertenecen a esta tienda" }, { status: 404 })
    }

    await db.$transaction(
      products.map((product) =>
        db.product.update({
          where: { id: product.id },
          data: { price: Math.max(0.01, roundMoney(product.price * (1 + input.percent / 100))) },
        })
      )
    )

    return NextResponse.json({ updated: products.length })
  }

  const data =
    input.action === "status"
      ? { status: input.status as ProductStatus }
      : input.action === "setPrice"
        ? { price: roundMoney(input.price) }
        : input.action === "setStock"
          ? { stock: input.stock, manageStock: true }
          : input.action === "featured"
            ? { featured: input.featured }
            : { deletedAt: new Date(), status: ProductStatus.DELETED }

  const result = await db.product.updateMany({
    where,
    data,
  })

  if (result.count !== input.productIds.length) {
    return NextResponse.json({ message: "Algunos productos no existen o no pertenecen a esta tienda" }, { status: 404 })
  }

  return NextResponse.json({ updated: result.count })
}
