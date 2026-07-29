import { Skeleton } from "@/components/ui/skeleton"

function LoadingCard() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/85 p-4 shadow-sm backdrop-blur">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-6 w-3/4" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-5/6" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(250,248,245,1)_42%,_rgba(242,235,225,1)_100%)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-border/60 bg-card/85 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-28 rounded-full" />
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.35fr_0.75fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-sm backdrop-blur sm:p-6">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-4 h-10 w-full max-w-xl" />
              <Skeleton className="mt-3 h-4 w-11/12" />
              <Skeleton className="mt-2 h-4 w-5/6" />

              <div className="mt-5 flex flex-wrap gap-3">
                <Skeleton className="h-11 w-32 rounded-full" />
                <Skeleton className="h-11 w-28 rounded-full" />
                <Skeleton className="h-11 w-36 rounded-full" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-sm backdrop-blur">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-5/6" />
              <Skeleton className="mt-2 h-3 w-4/6" />
              <Skeleton className="mt-5 h-10 w-full rounded-full" />
            </div>

            <LoadingCard />
            <LoadingCard />

            <div className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-sm backdrop-blur">
              <Skeleton className="h-4 w-28" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
