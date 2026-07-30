import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="mb-6 h-5 w-40" />

      <div className="grid grid-cols-1 gap-10 grid-cols-1 lg:grid-cols-2">
        <section className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="grid grid-cols-4 gap-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <Skeleton className="h-7 w-28 rounded-full" />
            <Skeleton className="mt-3 h-10 w-full max-w-xl" />
            <Skeleton className="mt-3 h-4 w-28" />
          </div>

          <div className="flex items-end gap-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>

          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
          <div className="h-px w-full bg-border" />

          <div className="rounded-xl border p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>

          <Skeleton className="h-5 w-48" />

          <div>
            <Skeleton className="h-5 w-28" />
            <div className="mt-2 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </section>
      </div>

      <div className="mt-12 space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div>
          <Skeleton className="h-8 w-44" />
          <div className="mt-6 grid gap-4 grid-cols-1 md:grid-cols-2">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
