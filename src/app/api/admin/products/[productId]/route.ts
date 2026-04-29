import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.globalRole !== "PLATFORM_ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { productId } = await params
  await db.product.update({
    where: { id: productId },
    data: { deletedAt: new Date(), status: "DELETED" },
  })
  return NextResponse.json({ ok: true })
}
