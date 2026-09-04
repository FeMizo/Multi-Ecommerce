"use client"

import { OrderDetailsSheet, type OrderDetailsSheetProps } from "@/components/orders/order-details-sheet"
import { Button } from "@/components/ui/button"
import { PanelRightOpen } from "lucide-react"

export type { OrderDetailsSheetProps as OrderDetailsSheetClientProps } from "@/components/orders/order-details-sheet"
export type { OrderDetailsSheetOrder } from "@/components/orders/order-details-sheet"

export function OrderDetailsSheetClient(props: OrderDetailsSheetProps) {
  return <OrderDetailsSheet {...props} />
}

export function OrderDetailsSheetButton(props: Omit<OrderDetailsSheetProps, "trigger">) {
  return (
    <OrderDetailsSheet
      {...props}
      trigger={
        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1 px-3">
          <PanelRightOpen className="h-3.5 w-3.5" />
          Ver
        </Button>
      }
    />
  )
}
