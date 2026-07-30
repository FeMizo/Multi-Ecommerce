import { Skeleton } from "@/components/ui/skeleton"

function StoreCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      <Skeleton className="h-32 w-full md:h-36" />
      <div className="p-5">
        <div className="flex items-start gap-4 -mt-12 mb-4">
          <Skeleton className="h-16 w-16 rounded-2xl border-[3px] border-card" />
        </div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-4 w-28" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border/50 bg-card">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <Skeleton className="mb-4 h-6 w-28 rounded-full" />
            <Skeleton className="h-10 w-full max-w-lg" />
            <Skeleton className="mt-3 h-6 w-full max-w-xl" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
          <StoreCardSkeleton />
        </div>
      </div>
    </div>
  )
}
