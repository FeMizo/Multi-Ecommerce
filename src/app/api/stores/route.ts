import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres").max(60),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo letras, números y guiones"),
  description: z.string().max(300).optional(),
  cityId: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 })
  }

  const { name, slug, description, cityId } = parsed.data

  const existing = await db.store.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ message: "Ese nombre de tienda ya está en uso" }, { status: 409 })
  }

  const freePlan = await db.plan.findUnique({ where: { slug: "free" } })

  const store = await db.$transaction(async (tx) => {
    const newStore = await tx.store.create({
      data: {
        name,
        slug,
        description,
        cityId: cityId || null,
        isActive: true,
      },
    })

    await tx.storeMember.create({
      data: {
        storeId: newStore.id,
        userId: session.user.id,
        role: "OWNER",
      },
    })

    if (freePlan) {
      await tx.storeSubscription.create({
        data: {
          storeId: newStore.id,
          planId: freePlan.id,
          status: "ACTIVE",
        },
      })
    }

    return newStore
  })

  return NextResponse.json({ slug: store.slug }, { status: 201 })
}
