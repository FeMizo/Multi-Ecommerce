import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { storeId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Inválido" }, { status: 400 })

  const store = await db.store.update({
    where: { id: storeId },
    data: parsed.data,
  })

  return NextResponse.json(store)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { storeId } = await params
  await db.store.update({
    where: { id: storeId },
    data: { deletedAt: new Date(), isActive: false },
  })
  return NextResponse.json({ ok: true })
}
