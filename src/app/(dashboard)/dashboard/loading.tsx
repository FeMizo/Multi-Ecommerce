import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-16 flex-col border-r border-border bg-card text-foreground">
        <div className="flex h-20 items-center justify-center border-b border-border px-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>

        <nav className="flex-1 space-y-2 px-2 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg"
            >
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-border px-3 py-3">
          <Skeleton className="mx-auto h-5 w-5 rounded-full" />
          <Skeleton className="mx-auto h-5 w-5 rounded-full" />
        </div>
      </aside>

      <main className="min-h-screen min-w-0 bg-background" style={{ marginLeft: 64 }}>
        <div className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 w-40 max-w-full" />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-5 h-72 w-full rounded-xl" />
              </div>

              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <Skeleton className="h-6 w-32" />
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between gap-4 rounded-xl border p-3">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-4 w-44" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
