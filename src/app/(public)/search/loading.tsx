import { ProductCardSkeleton } from "@/components/products/product-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-full sm:w-28" />
        </div>
        <Skeleton className="mt-3 h-3 w-56" />
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        <aside className="order-2 w-full shrink-0 space-y-6 md:order-1 md:w-56">
          <div>
            <Skeleton className="mb-3 h-5 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-5/6" />
              <Skeleton className="h-9 w-4/6" />
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-9 w-5/6" />
            </div>
          </div>
        </aside>

        <section className="order-1 flex-1 md:order-2">
          <div className="mb-6 space-y-3">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-40 rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </div>

          <div className="mt-8 flex justify-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </section>
      </div>
    </div>
  )
}
