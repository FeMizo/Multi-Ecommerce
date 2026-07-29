import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <Skeleton className="mb-4 h-6 w-28 rounded-full" />
      <Skeleton className="h-10 w-80 max-w-full" />
      <Skeleton className="mt-3 h-6 w-[32rem] max-w-full" />

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
