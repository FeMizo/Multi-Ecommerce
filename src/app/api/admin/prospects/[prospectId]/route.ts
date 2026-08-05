import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assertPlatformAdminSession } from "@/lib/admin-permissions"
import { prospectUpdateSchema } from "@/lib/prospect-schemas"
import { buildProspectDuplicateWhere, normalizeProspectDraft, normalizeTerminalProspectState } from "@/lib/prospects"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const session = await auth()
  try {
    assertPlatformAdminSession(session)
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { prospectId } = await params
  const prospect = await db.prospect.findUnique({
    where: { id: prospectId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      activities: {
        orderBy: { occurredAt: "desc" },
        include: {
          performedBy: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  if (!prospect) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ prospect })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ prospectId: string }> }
) {
  const session = await auth()
  try {
    assertPlatformAdminSession(session)
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const { prospectId } = await params
  const body = await req.json()
  const parsed = prospectUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 })
  }

  const current = await db.prospect.findUnique({ where: { id: prospectId } })
  if (!current) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  const normalized = normalizeProspectDraft({
    businessName: parsed.data.businessName ?? current.businessName,
    slug: parsed.data.slug ?? current.slug,
    contactName: parsed.data.contactName ?? current.contactName,
    phone: parsed.data.phone ?? current.phone,
    email: parsed.data.email ?? current.email,
    website: parsed.data.website ?? current.website,
    facebookUrl: parsed.data.facebookUrl ?? current.facebookUrl,
    instagramUrl: parsed.data.instagramUrl ?? current.instagramUrl,
    googleMapsUrl: parsed.data.googleMapsUrl ?? current.googleMapsUrl,
    address: parsed.data.address ?? current.address,
    city: parsed.data.city ?? current.city,
    category: parsed.data.category ?? current.category,
    notes: parsed.data.notes ?? current.notes,
    source: parsed.data.source ?? current.source,
    status: parsed.data.status ?? current.status,
    priority: parsed.data.priority ?? current.priority,
    assignedToId: parsed.data.assignedToId ?? current.assignedToId,
    lastContactAt: parsed.data.lastContactAt ?? current.lastContactAt,
    nextFollowUpAt: parsed.data.nextFollowUpAt ?? current.nextFollowUpAt,
  })

  const duplicateWhere = buildProspectDuplicateWhere({
    id: prospectId,
    businessNameNormalized: normalized.businessNameNormalized,
    phoneNormalized: normalized.phoneNormalized,
    emailNormalized: normalized.emailNormalized,
    websiteNormalized: normalized.websiteNormalized,
    googleMapsUrlNormalized: normalized.googleMapsUrlNormalized,
    facebookUrlNormalized: normalized.facebookUrlNormalized,
    instagramUrlNormalized: normalized.instagramUrlNormalized,
  }, prospectId)

  if (duplicateWhere) {
    const duplicates = await db.prospect.findMany({
      where: duplicateWhere,
      select: { id: true, businessName: true, contactName: true, phone: true, email: true, city: true, status: true, priority: true },
      take: 10,
    })
    if (duplicates.length) {
      return NextResponse.json({ message: "Possible duplicates", duplicates }, { status: 409 })
    }
  }

  const updated = await db.$transaction(async (tx) => {
    const state = normalizeTerminalProspectState(normalized.status, normalized.nextFollowUpAt)
    const prospect = await tx.prospect.update({
      where: { id: prospectId },
      data: {
        businessName: normalized.businessName,
        businessNameNormalized: normalized.businessNameNormalized,
        slug: normalized.slug,
        contactName: normalized.contactName,
        phone: normalized.phone,
        phoneNormalized: normalized.phoneNormalized,
        email: normalized.email,
        emailNormalized: normalized.emailNormalized,
        website: normalized.website,
        websiteNormalized: normalized.websiteNormalized,
        facebookUrl: normalized.facebookUrl,
        facebookUrlNormalized: normalized.facebookUrlNormalized,
        instagramUrl: normalized.instagramUrl,
        instagramUrlNormalized: normalized.instagramUrlNormalized,
        googleMapsUrl: normalized.googleMapsUrl,
        googleMapsUrlNormalized: normalized.googleMapsUrlNormalized,
        address: normalized.address,
        city: normalized.city,
        category: normalized.category,
        notes: normalized.notes,
        source: normalized.source,
        status: state.status,
        priority: normalized.priority,
        assignedToId: normalized.assignedToId,
        lastContactAt: normalized.lastContactAt,
        nextFollowUpAt: state.nextFollowUpAt,
      },
    })

    if (current.status !== prospect.status) {
      await tx.prospectActivity.create({
        data: {
          prospectId: prospect.id,
          activityType: "STATUS_CHANGED",
          channel: "OTHER",
          comment: `Estado cambiado de ${current.status} a ${prospect.status}`,
          result: prospect.status,
          performedById: session.user!.id,
        },
      })
    }

    return prospect
  })

  return NextResponse.json({ prospect: updated })
}
