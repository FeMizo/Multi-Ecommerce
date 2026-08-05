import { NextResponse } from "next/server"
import { releaseExpiredOrderReservations } from "@/lib/payment-lifecycle"
import { runSocialPromotionCron, runSocialPromotionCronInternal } from "@/lib/social-cron"

async function cleanup(req: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = req.headers.get("authorization")
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const task = new URL(req.url).searchParams.get("task")
  if (task === "social-publish-due") {
    const dryRun = new URL(req.url).searchParams.get("dryRun") === "1"
    const result = dryRun
      ? await runSocialPromotionCronInternal(new Date(), true)
      : await runSocialPromotionCron(new Date())
    return NextResponse.json(result)
  }

  const released = await releaseExpiredOrderReservations(100)
  return NextResponse.json({ released })
}

export const GET = cleanup
export const POST = cleanup
