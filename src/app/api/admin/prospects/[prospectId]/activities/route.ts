import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assertPlatformAdminSession } from "@/lib/admin-permissions"
import { prospectActivitySchema } from "@/lib/prospect-schemas"

export async function POST(
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
  const parsed = prospectActivitySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 })
  }

  const activity = await db.$transaction(async (tx) => {
    const prospect = await tx.prospect.findUnique({ where: { id: prospectId } })
    if (!prospect) {
      return null
    }

    const created = await tx.prospectActivity.create({
      data: {
        prospectId,
        channel: parsed.data.channel,
        activityType: parsed.data.activityType,
        comment: parsed.data.comment ?? null,
        result: parsed.data.result ?? null,
        nextFollowUpAt: parsed.data.nextFollowUpAt ? new Date(parsed.data.nextFollowUpAt) : null,
        performedById: session.user!.id,
      },
      include: {
        performedBy: { select: { id: true, name: true, email: true } },
      },
    })

    await tx.prospect.update({
      where: { id: prospectId },
      data: {
        lastContactAt: created.occurredAt,
        nextFollowUpAt: created.nextFollowUpAt ?? prospect.nextFollowUpAt,
      },
    })

    return created
  })

  if (!activity) {
    return NextResponse.json({ message: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ activity }, { status: 201 })
}
