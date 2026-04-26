import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { slugify } from "@/lib/utils"

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
  stock: z.number().int().min(0).default(0),
  sku: z.string().max(60).optional().nullable(),
  categoryId: z.string().min(1),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).default("DRAFT"),
  featured: z.boolean().default(false),
  images: z.array(z.string().url()).max(8).default([]),
  tags: z.array(z.string()).max(10).default([]),
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
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const storeId = membership.store.id
  const data = parsed.data

  const slugBase = data.slug || slugify(data.name)
  let finalSlug = slugBase
  let i = 1
  while (await db.product.findFirst({ where: { storeId, slug: finalSlug } })) {
    finalSlug = `${slugBase}-${i++}`
  }

  const product = await db.product.create({
    data: {
      storeId,
      name: data.name,
      slug: finalSlug,
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

  return NextResponse.json({ id: product.id, slug: product.slug }, { status: 201 })
}
