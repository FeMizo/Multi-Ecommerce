"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Phone, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

function getDismissedKey(userId: string) {
  return `seller-phone-reminder-dismissed:${userId}`
}

export function PhoneReminderBanner({
  userId,
  hasPhone,
}: {
  userId: string
  hasPhone: boolean
}) {
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const banner = bannerRef.current
    if (!banner) return

    if (hasPhone) {
      banner.hidden = true
      return
    }

    const dismissedKey = getDismissedKey(userId)
    if (window.localStorage.getItem(dismissedKey) === "1") {
      banner.hidden = true
      return
    }

    banner.hidden = false
  }, [hasPhone, userId])

  if (hasPhone) return null

  const dismiss = () => {
    window.localStorage.setItem(getDismissedKey(userId), "1")
    if (bannerRef.current) bannerRef.current.hidden = true
  }

  return (
    <div
      ref={bannerRef}
      className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/20 dark:text-sky-50"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-sky-100 p-2 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <p className="font-semibold">Agrega tu telefono</p>
            </div>
            <p className="text-sm text-sky-900/80 dark:text-sky-100/80">
              Sin telefono no podemos avisarte por WhatsApp cuando entren ventas y otras alertas utiles.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/account/profile">Actualizar telefono</Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={dismiss}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}
