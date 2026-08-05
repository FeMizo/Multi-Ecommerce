import type { Metadata } from "next"
import { RiderPwaClient } from "@/components/rider/rider-pwa-client"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
      <RiderPwaClient />
    </div>
  )
}
