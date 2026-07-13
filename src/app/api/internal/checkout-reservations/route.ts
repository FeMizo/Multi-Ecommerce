import { NextResponse } from "next/server"
import { releaseExpiredOrderReservations } from "@/lib/payment-lifecycle"

async function cleanup(req: Request) {
  const expected = process.env.CRON_SECRET
  const authorization = req.headers.get("authorization")
  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ message: "No autorizado" }, { status: 401 })
  }

  const released = await releaseExpiredOrderReservations(100)
  return NextResponse.json({ released })
}

export const GET = cleanup
export const POST = cleanup
