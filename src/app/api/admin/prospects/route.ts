import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assertPlatformAdminSession } from "@/lib/admin-permissions"
import { normalizeProspectDraft, normalizeTerminalProspectState } from "@/lib/prospects"
import { prospectCreateSchema } from "@/lib/prospect-schemas"
import { buildProspectDuplicateWhere } from "@/lib/prospects"

export async function POST(req: NextRequest) {
  const session = await auth()
  try {
    assertPlatformAdminSession(session)
  } catch {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = prospectCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 })
  }

  const allowDuplicate = Boolean(body?.allowDuplicate)
  const initialActivity = body?.initialActivity ?? null

  const normalized = normalizeProspectDraft({
    businessName: parsed.data.businessName,
    slug: parsed.data.slug,
    contactName: parsed.data.contactName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    website: parsed.data.website,
    facebookUrl: parsed.data.facebookUrl,
    instagramUrl: parsed.data.instagramUrl,
    googleMapsUrl: parsed.data.googleMapsUrl,
    address: parsed.data.address,
    city: parsed.data.city,
    category: parsed.data.category,
    notes: parsed.data.notes,
    source: parsed.data.source,
    status: parsed.data.status,
    priority: parsed.data.priority,
    assignedToId: parsed.data.assignedToId,
    lastContactAt: parsed.data.lastContactAt ?? null,
    nextFollowUpAt: parsed.data.nextFollowUpAt ?? null,
  })

  const duplicateWhere = buildProspectDuplicateWhere({
    id: "",
    businessNameNormalized: normalized.businessNameNormalized,
    phoneNormalized: normalized.phoneNormalized,
    emailNormalized: normalized.emailNormalized,
    websiteNormalized: normalized.websiteNormalized,
    googleMapsUrlNormalized: normalized.googleMapsUrlNormalized,
    facebookUrlNormalized: normalized.facebookUrlNormalized,
    instagramUrlNormalized: normalized.instagramUrlNormalized,
  })

  if (!allowDuplicate && duplicateWhere) {
    const duplicates = await db.prospect.findMany({
      where: duplicateWhere,
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
      take: 10,
    })
    return NextResponse.json({ message: "Possible duplicates", duplicates }, { status: 409 })
  }

  const created = await db.$transaction(async (tx) => {
    const state = normalizeTerminalProspectState(normalized.status, normalized.nextFollowUpAt)
    const prospect = await tx.prospect.create({
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

    if (initialActivity && typeof initialActivity === "object") {
      const activity = await tx.prospectActivity.create({
        data: {
          prospectId: prospect.id,
          channel: initialActivity.channel,
          activityType: initialActivity.activityType,
          comment: initialActivity.comment ?? null,
          result: initialActivity.result ?? null,
          nextFollowUpAt: initialActivity.nextFollowUpAt ? new Date(initialActivity.nextFollowUpAt) : null,
          performedById: userId,
        },
      })

      await tx.prospect.update({
        where: { id: prospect.id },
        data: {
          lastContactAt: activity.occurredAt,
          nextFollowUpAt: activity.nextFollowUpAt,
        },
      })
    }

    return prospect
  })

  return NextResponse.json({ prospect: created }, { status: 201 })
}
