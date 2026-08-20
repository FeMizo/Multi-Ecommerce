import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().max(80).optional().nullable(),
  icon: z.string().max(32).optional().nullable(),
  image: z.string().max(255).optional().nullable(),
  parentId: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

async function requirePlatformAdmin() {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") return null
  return session
}

async function resolveUniqueSlug(baseSlug: string, categoryId: string) {
  const normalized = baseSlug || "categoria"
  let slug = normalized
  let suffix = 1

  while (await db.category.findFirst({ where: { slug, id: { not: categoryId } }, select: { id: true } })) {
    slug = `${normalized}-${suffix++}`
  }

  return slug
}

async function validateParent(parentId: string | null | undefined, categoryId: string) {
  if (!parentId) return null

  const parent = await db.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  })
  if (!parent) return "Padre no encontrado"
  if (parentId === categoryId) return "La categoria no puede ser su propio padre"
  if (parent.parentId) return "Solo puedes elegir una categoria principal como padre"

  let currentParentId = parent.parentId
  while (currentParentId) {
    if (currentParentId === categoryId) return "No puedes crear un ciclo de categorias"
    const ancestor = await db.category.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    })
    currentParentId = ancestor?.parentId ?? null
  }

  return parent.id
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await requirePlatformAdmin()
  if (!session) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { categoryId } = await params
  const existing = await db.category.findUnique({ where: { id: categoryId } })
  if (!existing) return NextResponse.json({ message: "No encontrada" }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Invalido" }, { status: 400 })

  const parentId = parsed.data.parentId === undefined ? existing.parentId : parsed.data.parentId
  const parentError = await validateParent(parentId, categoryId)
  if (typeof parentError === "string") {
    return NextResponse.json({ message: parentError }, { status: 400 })
  }

  const nextName = parsed.data.name?.trim() || existing.name
  const nextSlug = parsed.data.slug?.trim() === ""
    ? existing.slug
    : await resolveUniqueSlug(parsed.data.slug?.trim() || slugify(nextName), categoryId)

  try {
    const category = await db.category.update({
      where: { id: categoryId },
      data: {
        name: nextName,
        slug: nextSlug,
        icon: parsed.data.icon === undefined ? existing.icon : (parsed.data.icon?.trim() || null),
        image: parsed.data.image === undefined ? existing.image : (parsed.data.image?.trim() || null),
        parentId,
        active: parsed.data.active ?? existing.active,
      },
    })

    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ message: "No se pudo actualizar la categoria" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const session = await requirePlatformAdmin()
  if (!session) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const { categoryId } = await params
  const category = await db.category.findUnique({
    where: { id: categoryId },
    include: {
      _count: { select: { products: true, children: true } },
    },
  })
  if (!category) return NextResponse.json({ message: "No encontrada" }, { status: 404 })
  if (category._count.products > 0 || category._count.children > 0) {
    return NextResponse.json({ message: "La categoria tiene productos o subcategorias asociadas" }, { status: 400 })
  }

  await db.category.delete({ where: { id: categoryId } })
  return NextResponse.json({ ok: true })
}
