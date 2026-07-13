import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { stripe } from "@/lib/stripe"

async function getOwnedStore(userId: string, storeSlug: string) {
  return db.storeMember.findFirst({
    where: { userId, role: "OWNER", store: { slug: storeSlug } },
    include: { store: { select: { id: true, stripeAccountId: true } } },
  })
}

export async function GET(_req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/stripe/onboarding">) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getOwnedStore(session.user.id, storeSlug)
  if (!membership?.store.stripeAccountId) return NextResponse.json({ connected: false, onboarded: false })

  const account = await stripe.accounts.retrieve(membership.store.stripeAccountId)
  const onboarded = account.details_submitted && account.charges_enabled && account.payouts_enabled
  await db.store.update({ where: { id: membership.store.id }, data: { stripeOnboarded: onboarded } })
  return NextResponse.json({ connected: true, onboarded, accountId: account.id })
}

export async function POST(req: NextRequest, { params }: RouteContext<"/api/stores/[storeSlug]/stripe/onboarding">) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 })

  const { storeSlug } = await params
  const membership = await getOwnedStore(session.user.id, storeSlug)
  if (!membership) return NextResponse.json({ message: "Acceso denegado" }, { status: 403 })

  let accountId = membership.store.stripeAccountId
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "MX",
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      metadata: { storeId: membership.store.id },
    })
    accountId = account.id
    await db.store.update({ where: { id: membership.store.id }, data: { stripeAccountId: accountId, stripeOnboarded: false } })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${origin}/dashboard/${storeSlug}/settings`,
    return_url: `${origin}/dashboard/${storeSlug}/settings`,
  })
  return NextResponse.json({ url: link.url })
}
