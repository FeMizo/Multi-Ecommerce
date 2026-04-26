import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  globalRole: z.enum(["USER", "PLATFORM_ADMIN"]),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { userId } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ message: "Inválido" }, { status: 400 })

  const user = await db.user.update({
    where: { id: userId },
    data: { globalRole: parsed.data.globalRole },
  })

  return NextResponse.json(user)
}
