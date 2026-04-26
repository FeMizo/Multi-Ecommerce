import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0),
  sku: z.string().max(60).optional().nullable(),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]),
  featured: z.boolean(),
  images: z.array(z.string().url()).max(8),
  tags: z.array(z.string()).max(10),
})

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
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const data = parsed.data

  if (data.slug !== product.slug) {
    const conflict = await db.product.findFirst({
      where: { storeId, slug: data.slug, id: { not: productId } },
    })
    if (conflict) {
      return NextResponse.json({ message: "Ese slug ya está en uso" }, { status: 409 })
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
      stock: data.stock,
      sku: data.sku ?? null,
      categoryId: data.categoryId,
      status: data.status,
      featured: data.featured,
      images: data.images,
      tags: data.tags,
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
