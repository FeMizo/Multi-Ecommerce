import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
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

async function resolveUniqueSlug(baseSlug: string) {
  const normalized = baseSlug || "categoria"
  let slug = normalized
  let suffix = 1

  while (await db.category.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${normalized}-${suffix++}`
  }

  return slug
}

async function validateParent(parentId: string | null | undefined, categoryId?: string) {
  if (!parentId) return null

  const parent = await db.category.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  })
  if (!parent) return "Padre no encontrado"
  if (parentId === categoryId) return "La categoria no puede ser su propio padre"
  if (parent.parentId) return "Solo puedes elegir una categoria principal como padre"
  return parent.id
}

export async function POST(req: NextRequest) {
  const session = await requirePlatformAdmin()
  if (!session) return NextResponse.json({ message: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Invalido" }, { status: 400 })

  const parentId = parsed.data.parentId ?? null
  const parentError = await validateParent(parentId)
  if (typeof parentError === "string") {
    return NextResponse.json({ message: parentError }, { status: 400 })
  }

  const baseSlug = parsed.data.slug?.trim() || slugify(parsed.data.name)
  const slug = await resolveUniqueSlug(baseSlug)

  try {
    const category = await db.category.create({
      data: {
        name: parsed.data.name.trim(),
        slug,
        icon: parsed.data.icon?.trim() || null,
        image: parsed.data.image?.trim() || null,
        parentId,
        active: parsed.data.active ?? true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch {
    return NextResponse.json({ message: "No se pudo crear la categoria" }, { status: 500 })
  }
}
