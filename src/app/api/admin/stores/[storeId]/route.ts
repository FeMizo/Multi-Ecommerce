import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

const schema = z.object({
  isActive: z.boolean().optional(),
  cityId: z.string().nullable().optional(),
  featuredPosition: z.coerce.number().int().min(1).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  await requireAdmin()
  const { storeId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 422 })
  }

  if (parsed.data.cityId) {
    const city = await db.city.findFirst({
      where: { id: parsed.data.cityId, active: true },
      select: { id: true },
    })
    if (!city) {
      return NextResponse.json({ message: "Ciudad no encontrada" }, { status: 404 })
    }
  }

  try {
    const store = await db.store.update({
      where: { id: storeId },
      data: {
        ...(parsed.data.isActive !== undefined && { isActive: parsed.data.isActive }),
        ...(parsed.data.cityId !== undefined && { cityId: parsed.data.cityId }),
        ...(parsed.data.featuredPosition !== undefined && { featuredPosition: parsed.data.featuredPosition }),
      },
      select: { id: true, isActive: true, cityId: true, featuredPosition: true },
    })

    return NextResponse.json(store)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Esa posición ya está ocupada" }, { status: 409 })
    }
    throw error
  }
}
