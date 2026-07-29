import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/admin-auth"

const schema = z.object({
  cityId: z.string().nullable().optional(),
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

  const store = await db.store.update({
    where: { id: storeId },
    data: { cityId: parsed.data.cityId ?? null },
    select: { id: true, cityId: true },
  })

  return NextResponse.json(store)
}
