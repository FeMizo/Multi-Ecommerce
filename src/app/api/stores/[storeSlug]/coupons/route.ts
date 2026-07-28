import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { normalizeCouponCode } from "@/lib/store-coupons"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2).max(60),
  code: z.string().min(2).max(32),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().optional().nullable(),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
})

async function getOwnedStore(userId: string, storeSlug: string) {
  return db.storeMember.findFirst({
    where: { userId, role: "OWNER", store: { slug: storeSlug } },
    include: { store: { select: { id: true, name: true, slug: true } } },
  })
}

export async function GET(_req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/coupons">) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getOwnedStore(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const coupons = await db.storeCoupon.findMany({
    where: { storeId: membership.store.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ coupons })
}

export async function POST(req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/coupons">) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getOwnedStore(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })

  const code = normalizeCouponCode(parsed.data.code)
  if (!/^[A-Z0-9_-]{2,32}$/.test(code)) {
    return NextResponse.json({ message: "El codigo solo puede tener letras, numeros, guion o guion bajo" }, { status: 422 })
  }
  if (parsed.data.type === "PERCENTAGE" && parsed.data.value > 100) {
    return NextResponse.json({ message: "El porcentaje no puede superar 100" }, { status: 422 })
  }

  try {
    const coupon = await db.storeCoupon.create({
      data: {
        storeId: membership.store.id,
        name: parsed.data.name.trim(),
        code,
        type: parsed.data.type,
        value: parsed.data.type === "PERCENTAGE" ? parsed.data.value : Math.round(parsed.data.value * 100) / 100,
        minOrderAmount: parsed.data.minOrderAmount ?? null,
        maxRedemptions: parsed.data.maxRedemptions ?? null,
        startsAt: parsed.data.startsAt ? new Date(parsed.data.startsAt) : null,
        endsAt: parsed.data.endsAt ? new Date(parsed.data.endsAt) : null,
      },
    })
    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Ese codigo ya existe en la tienda" }, { status: 409 })
    }
    throw error
  }
}
