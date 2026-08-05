import type { Metadata } from "next"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function RiderStoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/20">
      {children}
    </div>
  )
}
