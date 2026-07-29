import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="relative aspect-square bg-muted/30">
        <div className="absolute inset-0 shimmer" />
      </div>
      <div className="space-y-3 p-4 md:p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl lg:hidden" />
        </div>
      </div>
    </div>
  )
}
