import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assertPlatformAdminSession } from "@/lib/admin-permissions"
import { prospectDuplicateCheckSchema } from "@/lib/prospect-schemas"
import { normalizeProspectDraft, buildProspectDuplicateWhere } from "@/lib/prospects"

export async function POST(req: NextRequest) {
  const session = await auth()
  try {
    assertPlatformAdminSession(session)
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = prospectDuplicateCheckSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  const normalized = normalizeProspectDraft({
    businessName: parsed.data.businessName,
    slug: parsed.data.slug,
    phone: parsed.data.phone,
    email: parsed.data.email,
    website: parsed.data.website,
    facebookUrl: parsed.data.facebookUrl,
    instagramUrl: parsed.data.instagramUrl,
    googleMapsUrl: parsed.data.googleMapsUrl,
    city: "tmp",
    source: "MANUAL",
    status: "NEW",
    priority: "MEDIUM",
  })

  const excludeId = typeof body?.excludeId === "string" ? body.excludeId : undefined

  const where = buildProspectDuplicateWhere({
    id: "",
    businessNameNormalized: normalized.businessNameNormalized,
    phoneNormalized: normalized.phoneNormalized,
    emailNormalized: normalized.emailNormalized,
    websiteNormalized: normalized.websiteNormalized,
    googleMapsUrlNormalized: normalized.googleMapsUrlNormalized,
    facebookUrlNormalized: normalized.facebookUrlNormalized,
    instagramUrlNormalized: normalized.instagramUrlNormalized,
  }, excludeId)

  if (!where) {
    return NextResponse.json({ duplicates: [] })
  }

  const duplicates = await db.prospect.findMany({
    where,
    select: {
      id: true,
      businessName: true,
      contactName: true,
      phone: true,
      email: true,
      city: true,
      status: true,
      priority: true,
      assignedTo: { select: { id: true, name: true, email: true } },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  })

  return NextResponse.json({ duplicates })
}
