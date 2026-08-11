import { NextResponse } from "next/server"
import { runStylePromotionCron, runStylePromotionCronInternal } from "@/lib/social-cron"

async function publish(req: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = req.headers.get("authorization")
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1"
  const result = dryRun
    ? await runStylePromotionCronInternal(new Date(), true)
    : await runStylePromotionCron(new Date())

  return NextResponse.json(result)
}

export const GET = publish
export const POST = publish
