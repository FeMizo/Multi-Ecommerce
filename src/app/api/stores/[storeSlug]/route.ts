import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
  description: z.string().max(300, "Máximo 300 caracteres").optional().nullable(),
  logoUrl: z.string().url("URL inválida").optional().nullable(),
  bannerUrl: z.string().url("URL inválida").optional().nullable(),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .optional()
    .nullable(),
  fontFamily: z.string().max(60).optional().nullable(),
  cityId: z.string().optional().nullable(),
  customDomain: z.string().max(100).optional().nullable(),
  isActive: z.boolean(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params

  const membership = await db.storeMember.findFirst({
    where: {
      userId: session.user.id,
      store: { slug: storeSlug },
      role: "OWNER",
    },
    include: { store: { select: { id: true } } },
  })
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  const data = parsed.data

  if (data.customDomain) {
    const conflict = await db.store.findFirst({
      where: { customDomain: data.customDomain, id: { not: membership.store.id } },
    })
    if (conflict) {
      return NextResponse.json({ message: "Ese dominio ya está en uso" }, { status: 409 })
    }
  }

  const updated = await db.store.update({
    where: { id: membership.store.id },
    data: {
      name: data.name,
      description: data.description ?? null,
      logoUrl: data.logoUrl ?? null,
      bannerUrl: data.bannerUrl ?? null,
      primaryColor: data.primaryColor ?? null,
      fontFamily: data.fontFamily ?? null,
      cityId: data.cityId ?? null,
      customDomain: data.customDomain ?? null,
      isActive: data.isActive,
    },
    select: { slug: true, name: true },
  })

  return NextResponse.json(updated)
}
