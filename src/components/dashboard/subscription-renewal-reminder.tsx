"use client"

import { useEffect, useMemo, useRef } from "react"
import { differenceInCalendarDays } from "date-fns"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

type SubscriptionReminder = {
  status: string
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const REMINDER_DAYS = [10, 5, 3, 1] as const

function getReminderDay(currentPeriodEnd: string | null) {
  if (!currentPeriodEnd) return null

  const daysLeft = differenceInCalendarDays(new Date(currentPeriodEnd), new Date())
  return REMINDER_DAYS.includes(daysLeft as (typeof REMINDER_DAYS)[number]) ? daysLeft : null
}

function getDismissedKey(storeId: string, currentPeriodEnd: string, reminderDay: number) {
  return `plan-renewal-dismissed:${storeId}:${currentPeriodEnd}:${reminderDay}`
}

export function SubscriptionRenewalReminder({
  storeId,
  storeName,
  subscription,
}: {
  storeId: string
  storeName: string
  subscription: SubscriptionReminder | null
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const reminderDay = useMemo(() => getReminderDay(subscription?.currentPeriodEnd ?? null), [subscription?.currentPeriodEnd])

  const shouldShow = Boolean(subscription?.cancelAtPeriodEnd && subscription.currentPeriodEnd && reminderDay !== null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (!shouldShow || !subscription?.currentPeriodEnd || reminderDay === null) {
      if (dialog.open) dialog.close()
      return
    }

    const dismissedKey = getDismissedKey(storeId, subscription.currentPeriodEnd, reminderDay)
    if (window.localStorage.getItem(dismissedKey) === "1") {
      if (dialog.open) dialog.close()
      return
    }

    if (!dialog.open) dialog.showModal()
  }, [reminderDay, shouldShow, storeId, subscription?.currentPeriodEnd])

  if (!shouldShow || reminderDay === null || !subscription?.currentPeriodEnd) return null

  const dismiss = () => {
    window.localStorage.setItem(getDismissedKey(storeId, subscription.currentPeriodEnd!, reminderDay), "1")
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto w-[calc(100vw-2rem)] max-w-lg rounded-2xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/70"
    >
      <div className="space-y-5 p-6">
        <div className="flex items-start gap-3 text-left">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700 dark:bg-amber-950/40">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Importante: tu plan no se renovará automáticamente</h2>
            <p className="text-sm text-muted-foreground">
              {storeName} tiene la renovación automática deshabilitada.
              {" "}
              Te avisamos con {reminderDay} día{reminderDay === 1 ? "" : "s"} de anticipación para que no pierdas acceso.
            </p>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-2">
          <p>
            Quedan {reminderDay} día{reminderDay === 1 ? "" : "s"} para que termine el periodo actual.
          </p>
          <p className="text-muted-foreground">
            Si no renuevas antes de la fecha de vencimiento, el plan puede cambiar de estado y limitar el acceso.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <form method="dialog">
            <Button type="button" variant="outline" onClick={dismiss}>
              Cerrar
            </Button>
          </form>
        </div>
      </div>
    </dialog>
  )
}
