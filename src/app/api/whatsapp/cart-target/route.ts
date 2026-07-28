import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"

const schema = z.object({
  storeId: z.string().min(1),
})

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ message: "Solicitud invalida" }, { status: 422 })

  const store = await db.store.findFirst({
    where: { id: parsed.data.storeId, deletedAt: null, isActive: true },
    select: {
      name: true,
      members: {
        where: { role: "OWNER" },
        take: 1,
        select: { user: { select: { phone: true } } },
      },
    },
  })

  const phone = store?.members[0]?.user.phone ?? null
  return NextResponse.json({
    phone,
    storeName: store?.name ?? null,
  })
}
