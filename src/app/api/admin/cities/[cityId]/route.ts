import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cityId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { cityId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Inválido" }, { status: 400 })

  const city = await db.city.update({ where: { id: cityId }, data: parsed.data })
  return NextResponse.json(city)
}
