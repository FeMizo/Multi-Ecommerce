import { NextResponse } from "next/server"
import { db } from "@/lib/db"
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null, store: { isActive: true, deletedAt: null } },
    select: { slug: true, store: { select: { slug: true } } },
    orderBy: { createdAt: "asc" },
  })
  if (!product) return new NextResponse("Producto no encontrado", { status: 404 })
  return NextResponse.redirect(new URL(`/${product.store.slug}/${product.slug}`, request.url), 308)
}
